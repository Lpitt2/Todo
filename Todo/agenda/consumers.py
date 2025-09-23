from channels.generic.websocket import WebsocketConsumer
from asgiref.sync import async_to_sync
from json import JSONDecoder, JSONEncoder
from .users import UserRegistration


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
    print("user created object.")

  def handle_update(self, data):
    '''Handles updating requests'''
    print("User updated object.")

  def handle_delete(self, data):
    '''Handles deleting requests'''
    print("User deleted object.")



class ProjectConsumer(WebsocketConsumer):

  def connect(self):
    self.accept()

  def disconnect(self, close_code):
    pass

  def receive(self, text_data):
    
    print(text_data)

    self.send(text_data=text_data)