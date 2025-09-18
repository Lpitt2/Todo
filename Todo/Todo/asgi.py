import os

from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.core.asgi import get_asgi_application

from agenda.urls import websocket_urls

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Todo.settings')

application = ProtocolTypeRouter({
  'http': get_asgi_application(),
  'websocket': AuthMiddlewareStack(URLRouter(websocket_urls))
})
