from django import template
from django.contrib.auth.models import User
from hashlib import sha256


register = template.Library()


@register.inclusion_tag("agenda/user_icon.html")
def user_avatar(user, display_name = True):
  """Returns the address of the user's gravitar image."""

  # Declare base url.
  BASE_URL = "https://gravatar.com/avatar"

  # Verify that the user is not null.
  if (user == None):
    return { 'url': f"{BASE_URL}", 'username': "" }

  # Hash the user's email address.
  email_hash = sha256(user.email.encode("utf-8"))

  return { 'url': f"{BASE_URL}/{email_hash.hexdigest()}", 'username': user.username.capitalize(), 'display_name': display_name }