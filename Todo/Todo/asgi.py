import os

from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.core.asgi import get_asgi_application

from agenda.urls import websocket_urls

default_app = get_asgi_application()

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Todo.settings')

application = ProtocolTypeRouter({
  'http': default_app,
  'websocket': AuthMiddlewareStack(URLRouter(websocket_urls))
})
