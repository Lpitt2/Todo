from channels.generic.websocket import WebsocketConsumer
from asgiref.sync import async_to_sync
from json import JSONDecoder, JSONEncoder
from .users import UserRegistration
from .models import *
from typing import TypeVar, Generic


# Declare singletons.
registration = UserRegistration()
user_sessions = dict()

T = TypeVar('T')

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

    # Send the new task information to all users within the group.
    async_to_sync(self.channel_layer.group_send)(self.group_name, {
      'type': "relay",
      'message': JSONEncoder().encode({
        'activity': "CREATE",
        'type': "TASK",
        'data': task.get_task_as_dictionary()})
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

    # Send the update information to all users within the group.
    async_to_sync(self.channel_layer.group_send)(self.group_name, {
      'type': "relay",
      'message': JSONEncoder().encode({
      'activity': "UPDATE",
      'type': "TASK",
      'data': task.get_task_as_dictionary()
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
        'data': group.get_group_as_dictionary()
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
        'data': group.get_group_as_dictionary()
      })
    })


  def relay(self, event):
    '''Sends the message to the current user.'''

    # Extract the message from the event.
    message = event['message']

    # Send the message on to the current user.
    self.send(text_data=message)


class CommonComumer(WebsocketConsumer):

  def connect(self):

    # Set the group name.
    self.group_name = None
    self.common_board_id = None
    self.common_board = None
    self.user = None

    self.accept()

  def disconnect(self, close_code):

    # Determine if the socket is in a group.
    if (self.group_name != None):

      # Remove the user from the group.
      user_sessions[self.group_name].remove(self.user.username)

      # Send the user update to everyone within the group.
      async_to_sync(self.channel_layer.group_send)(self.group_name, {
        'type': "relay",
        'message': JSONEncoder().encode({
          'activity': "UPDATE",
          'type': "USER",
          'data': user_sessions[self.group_name]
        })
      })

      # Disconnect the user from the group.
      async_to_sync(self.channel_layer.group_discard)(self.group_name, self.channel_name)

  def receive(self, text_data):

    # Convert the incomming data into a dictionary.
    data = JSONDecoder().decode(text_data)

    # Determine the type of the request.
    if (self.group_name == None and 'user-token' in data):

      # Handle the initial request.
      self.handle_initial_communication(data)

      return

    elif (self.group_name == None):

      self.send(text_data=JSONEncoder().encode({
        'status': 412,
        'message': 'User token and id are required before connection may be authorized.'
      }))

      return

    # Ensure that the activity, type, and id attributes are present.
    if ('activity' not in data or 'type' not in data or ('type' in data and data['type'] != "BOARD" and 'id' not in data)):

      # Send error message.
      self.send_error(400, "Requires 'type', 'activity', and 'id' attributes.")

      return

    # Extract the data attributes.
    activity = data['activity']
    type = data['type']
    id = data['id'] if 'id' in data else None

    # Determine the request.
    if (activity == "CREATE" and type == "TASK"):
      self.handle_task_create(id)
    elif (activity == "UPDATE" and type == "TASK"):
      self.handle_task_update(id)
    elif (activity == "CREATE" and type == "GROUP"):
      self.handle_group_create(id)
    elif (activity == "UPDATE" and type == "GROUP"):
      self.handle_group_update(id)
    elif (activity == "UPDATE" and type == "BOARD"):
      self.handle_board_update(data)
    elif (activity == "DELETE"):
      self.handle_delete(data)
    else:

      # Send error message to the user.
      self.send_error(400, "Invalid request.")


  def send_error(self, code = 404, message = "Unable to find requested object."):
    """Sends an error message to the user."""

    self.send(JSONEncoder().encode({
      'status': code,
      'message': message
    }))

  def get_object_or_404(self, model : Generic[T], primary_key : int, message = "Unable to find object."):
    """Retrieve the object from the model given the primary key."""

    # Declare variables.
    object = None

    # Attempt to get the object from the request.
    try:

      object = model.objects.get(pk=primary_key)

    except(model.DoesNotExist):

        # Send error message.
        self.send_error(message=message)

    return object


  def handle_initial_communication(self, message):
    """Handles the initial communication."""

    # Ensure that the user-token and id fields are present in the data.
    if ('user-token' not in message or 'id' not in message):

      # Send error message to the user.
      self.send_error()

      return

    # Extract the data.
    common_board_id = message['id']
    user_token = message['user-token']

    # Ensure that the user is valid.
    if (not registration.is_token_valid(user_token)):

      # Send error to the user.
      self.send_error(message = f"Unable to verify user token.")

      return

    # Get the user from the registration system.
    self.user = registration.get_user_from_token(user_token)

    # Attempt to get the commonboard object.
    self.common_board = self.get_object_or_404(CommonBoard, common_board_id)
    self.common_board_id = common_board_id

    # Determine if the common board was not found.
    if (self.common_board == None):
      return

    # Verify that the user is one of the owners of the common board.
    if (not self.common_board.user_authorized(self.user)):

      # Send error message to the user.
      self.send_error(401, f"User is not authorized to access common board id {common_board_id}")

    # Set up the group name.
    self.group_name = f"Common-Board-{common_board_id}"

    # Determine if the group is within the 'user_sessions' dictionary.
    if (self.group_name not in user_sessions):

      user_sessions[self.group_name] = list()

    # Add the current user to the 'user_sessions' variable.
    user_sessions[self.group_name].append(self.user.username)

    # Connect to the group.
    async_to_sync(self.channel_layer.group_add)(self.group_name, self.channel_name)

    # Send the initial connection message to everyone within the group.
    async_to_sync(self.channel_layer.group_send)(self.group_name, {
      'type': "relay",
      'message': JSONEncoder().encode({
        'activity': "UPDATE",
        'type': "USER",
        'data': user_sessions[self.group_name]
      })
    })

  def handle_group_create(self, id):
    """Handles new group creation."""

    # Get the group object.
    group = self.get_object_or_404(TaskGroup, id, message=f"Unable to find group {id}.")

    # Ensure that the group was found.
    if (group == None):
      return

    # Verify that the group is within the common board.
    if (group.common_board != self.common_board):

      # Send an error to the user.
      self.send_error(406, f"Group with id {id} does not exist within the common board {self.common_board.id}.")

      return

    # Replay to all users within the group about the new TaskGroup object.
    async_to_sync(self.channel_layer.group_send)(self.group_name, {
      'type': "relay",
      'message': JSONEncoder().encode({
        'activity': "CREATE",
        'type': "GROUP",
        'data': group.get_group_as_dictionary()
      })
    })

  def handle_group_update(self, id):
    """Handles group update."""

    # Get the group object.
    group = self.get_object_or_404(TaskGroup, id, message=f"Unable to find group {id}.")

    # Determine if the group is null.
    if (group == None):
      return

    # Verify that the group is within the common board.
    if (group.common_board != self.common_board):

      # Send an error to the user.
      self.send_error(406, f"Group with id {id} does not exist within the common board {self.common_board.id}.")

      return

    # Send the update information to all users within the group.
    async_to_sync(self.channel_layer.group_send)(self.group_name, {
      'type': "relay",
      'message': JSONEncoder().encode({
        'activity': "UPDATE",
        'type': "GROUP",
        'data': group.get_group_as_dictionary()
      })
    })

  def handle_delete(self, message):
    """Handles group deletion."""

    # Send the delete request to all users.
    async_to_sync(self.channel_layer.group_send)(self.group_name, {
      'type': "relay",
      'message': JSONEncoder().encode({
        'activity': message['activity'],
        'type': message['type'],
        'data': {
          'id': message['id']
        }
      })
    })

  def handle_task_create(self, id):
    """Handles new task creation."""

    # Get the task object.
    task = self.get_object_or_404(Task, id, f"Unable to find task {id}")

    # Verify that the task was found.
    if (task == None):
      return

    # Get the associated group from the task.
    group = task.group

    # Verify that the group is within the associated common board.
    if (group.common_board != self.common_board):

      # Send error message to the user.
      self.send_error(406, f"Group with id {group.id} does not exist within the common board {self.common_board.id}")

      return

    # Send the new task information to all users within the group.
    async_to_sync(self.channel_layer.group_send)(self.group_name, {
      'type': "relay",
      'message': JSONEncoder().encode({
        'activity': "CREATE",
        'type': "TASK",
        'data': task.get_task_as_dictionary()
      })
    })

  def handle_task_update(self, id):
    """Handles task update."""

    # Get the task object.
    task = self.get_object_or_404(Task, id, f"Unable to find task {id}")

    # Verify that the task was found.
    if (task == None):
      return

    # Get the associated group from the task.
    group = task.group

    # Verify that the group is within the associated common board.
    if (group.common_board != self.common_board):

      # Send error message to the user.
      self.send_error(406, f"Group with id {group.id} does not exist within the common board {self.common_board.id}")

      return

    # Send the update information to all users within the group.
    async_to_sync(self.channel_layer.group_send)(self.group_name, {
      'type': "relay",
      'message': JSONEncoder().encode({
        'activity': "UPDATE",
        'type': "TASK",
        'data': task.get_task_as_dictionary()
      })
    })

  def handle_board_update(self, id):
    """Handles update information to the common board."""
    
    # Get the common board object.
    self.common_board = self.get_object_or_404(CommonBoard, self.common_board_id)

    # Send the updated information to the users.
    async_to_sync(self.channel_layer.group_send)(self.group_name, {
      'type': "relay",
      'message': JSONEncoder().encode({
        'activity': "UPDATE",
        'type': "BOARD",
        'data': {
          'id': self.common_board_id,
          'title': self.common_board.title
        }
      })
    })


  def relay(self, event):
    """Relays the information to each user within the group."""

    # Extract the message from the event.
    message = event['message']

    # Send the message on to the current user.
    self.send(text_data=message)