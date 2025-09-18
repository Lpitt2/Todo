from channels.generic.websocket import WebsocketConsumer
from json import JSONDecoder

class UserConsumer(WebsocketConsumer):

  def connect(self):
    self.accept()

  def disconnect(self, close_code):
    pass

  def receive(self, text_data):
    
    print(text_data)

    self.send(text_data=text_data)



class ProjectConsumer(WebsocketConsumer):

  def connect(self):
    self.accept()

  def disconnect(self, close_code):
    pass

  def receive(self, text_data):
    
    print(text_data)

    self.send(text_data=text_data)