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
      if (data['activity'] == "CREATE"):
        self.handle_creation(data)
      elif (data['activity'] == "UPDATE"):
        self.handle_update(data)
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

    
  def handle_creation(self, data):
    '''Handles creation requests'''

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

    if (self.user != task.owner):

      self.send(JSONEncoder().encode({
        'status': 403,
        'message': f"User does not have ownership of the task id {data['id']}"
      }))
      
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
        'group': None if task.group == None else task.group.id,
        'complete': task.completion_status
      }})
    })
    
  def handle_update(self, data):
    '''Handles updating requests'''
    
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
        'message': f"User does not have ownership of task id {data['id']}"
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
        'group': None if task.group == None else task.group.id
      }
    })})

  def handle_delete(self, data):
    '''Handles deleting requests'''
    print("User deleted object.")

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