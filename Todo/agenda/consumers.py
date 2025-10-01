from channels.generic.websocket import WebsocketConsumer
from asgiref.sync import async_to_sync
from json import JSONDecoder, JSONEncoder
from .users import UserRegistration
from .models import *


# Declare singletons.
registration = UserRegistration()


class UserConsumer(WebsocketConsumer):

  def connect(self):

    # Setup the properties.
    self.group_name = None

    self.accept()


  def disconnect(self, close_code):
    
    # Determine if the socket is in a group.
    if (self.group_name != None):

      # Disconnect the user from the group.
      async_to_sync(self.channel_layer.group_discard)(self.group_name, self.channel_name)


  def receive(self, text_data):
    
    # Convert the incomming data into a dictionary.
    data = JSONDecoder().decode(text_data)

    # Determine the type of request.
    if (self.group_name == None and 'user-token' in data and registration.is_token_valid(data['user-token'])):

      # Set up the group name.
      self.group_name = data['user-token']
      self.user = registration.get_user_from_token(data['user-token'])

      # Connect to the group.
      async_to_sync(self.channel_layer.group_add)(self.group_name, self.channel_name)

      return

    elif (self.group_name == None):

      self.send(text_data=JSONEncoder().encode({
        'status': 403,
        'message': 'User token is required before connection may be authorized.'
      }))

      return

    if (self.group_name != None and 'activity' in data):

      # Handle the requested activity accordingly.
      if (data['activity'] == "CREATE" and data['type'] == "TASK"):
        self.handle_task_creation(data)
      elif (data['activity'] == "CREATE" and data['type'] == "GROUP"):
        self.handle_group_creation(data)
      elif (data['activity'] == "UPDATE" and data['type'] == "TASK"):
        self.handle_task_update(data)
      elif (data['activity'] == "UPDATE" and data['type'] == "GROUP"):
        self.handle_group_update(data)
      elif (data['activity'] == "DELETE"):
        self.handle_delete(data)
      else:

        self.send(JSONEncoder().encode({
          'status': 400,
          'message': f"Invalid requested activity '{data['activity']}'."
        }))

    else:

      self.send(JSONEncoder().encode({
        'status': 400,
        'message': "Invalid request."
      }))

    
  def handle_task_creation(self, data):
    '''Handles task creation requests'''

    # Declare variables.
    task = None

    # Attempt to get the task object.
    try:

      task = Task.objects.get(pk=data['id'])

    except(Task.DoesNotExist):

      self.send(JSONEncoder().encode({
        'status': 404,
        'message': f"Unable to locate task {data['id']}"
      }))

      return

    # Ensure that the user has ownership of this group.
    if (self.user != task.owner):

      self.send(JSONEncoder().encode({
        'status': 403,
        'message': f"User does not have ownership of the task id {data['id']}"
      }))

      return
      
    # Set up the due date information.
    due_date = None if task.due_date == None else {
      'month': task.due_date.month,
      'year': task.due_date.year,
      'day': task.due_date.day
    }

    # Send the new task information to all users within the group.
    async_to_sync(self.channel_layer.group_send)(self.group_name, {
      'type': "relay",
      'message': JSONEncoder().encode({
        'activity': "CREATE",
        'type': "TASK",
        'data': {
          'title': task.title,
          'id': task.id,
          'description': task.description,
          'due_date': due_date,
          'group': task.group.id,
          'complete': task.completion_status
      }})
    })
    
  def handle_task_update(self, data):
    '''Handles task updating requests'''
    
    # Declare variables.
    task = None

    # Attempt to get the task object.
    try:

      task = Task.objects.get(pk=data['id'])

    except(Task.DoesNotExist):

      self.send(JSONEncoder.encode({
        'status': 404,
        'message': f"Unable to locate task {data['id']}"
      }))

    # Verify that the task is owned by the requesting user.
    if (self.user != task.owner):

      self.send(JSONEncoder.encode({
        'status': 403,
        'message': f"User does not have ownership of task {data['id']}"
      }))

    # Set up the due date information.
    due_date = None if task.due_date == None else {
      'month': task.due_date.month,
      'year': task.due_date.year,
      'day': task.due_date.day
    }

    # Send the update information to all users within the group.
    async_to_sync(self.channel_layer.group_send)(self.group_name, {
      'type': "relay",
      'message': JSONEncoder().encode({
      'activity': "UPDATE",
      'type': "TASK",
      'data': {
        'id': task.id,
        'title': task.title,
        'description': task.description,
        'due_date': due_date,
        'complete': task.completion_status,
        'group': task.group.id
      }
    })})

  def handle_delete(self, data):
    '''Handles task deletion requests'''
    
    # Send the delete request to all users.
    async_to_sync(self.channel_layer.group_send)(self.group_name, {
      'type': "relay",
      'message': JSONEncoder().encode({
        'activity': data['activity'],
        'type': data['type'],
        'data': {
          'id': data['id']
        }
      })
    })

  def handle_group_creation(self, data):
    '''Handles group creation requests.'''

    # Declare variables.
    group = None

    # Attempt to get the group object.
    try:

      group = TaskGroup.objects.get(pk=data['id'])

    except (TaskGroup.DoesNotExist):

      self.send(JSONEncoder().encode({
        'status': 404,
        'message': f"Unable to locate group {data['id']}"
      }))

      return

    # Ensure that the user has ownership of this group.
    if (self.user != group.owner):
      
      self.send(JSONEncoder().encode({
        'status': 403,
        'message': f"User does not have ownership of task id {data['id']}"
      }))

      return
    
    # Send the update information to all users.
    async_to_sync(self.channel_layer.group_send)(self.group_name, {
      'type': "relay",
      'message': JSONEncoder().encode({
        'activity': "CREATE",
        'type': "GROUP",
        'data': {
          'id': group.id,
          'title': group.title
        }
      })
    })

  def handle_group_update(self, data):
    '''Handles group update requests.'''

    # Declare variables.
    group = None

    # Attempt to get the group object.
    try:

      group = TaskGroup.objects.get(pk=data['id'])

    except(TaskGroup.DoesNotExist):

      # Send an error to the user.
      self.send(JSONEncoder().encode({
        'status': 404,
        'message': f"Unable to locate group {data['id']}"
      }))

      return

    # Verify that the user is the owner of the group.
    if (self.user != group.owner):

      # Send error to the user.
      self.send(JSONEncoder().encode({
        'status': 403,
        'message': f"User does not have ownership of group {data['id']}"
      }))

      return

    # Send the update information to all users within the group.
    async_to_sync(self.channel_layer.group_send)(self.group_name, {
      'type': "relay",
      'message': JSONEncoder().encode({
        'activity': "UPDATE",
        'type': "GROUP",
        'data': {
          'id': group.id,
          'title': group.title
        }
      })
    })


  def relay(self, event):
    '''Sends the message to the current user.'''

    # Extract the message from the event.
    message = event['message']

    # Send the message on to the current user.
    self.send(text_data=message)


class ProjectConsumer(WebsocketConsumer):

  def connect(self):
    self.accept()

  def disconnect(self, close_code):
    pass

  def receive(self, text_data):
    
    print(text_data)

    self.send(text_data=text_data)