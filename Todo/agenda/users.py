from uuid import uuid4
from django.contrib.auth.models import User

class UserRegistration:

  tokens = {'0': User.objects.get(pk=1)}

  def register_user(self, user):
    '''Generates a token for the user.'''

    # Declare variables.
    token = None

    # Verify that the user does not already exist within the tokens list.
    if (user not in self.tokens.values()):

      # Generate a new token.
      token = str(uuid4())

      # Add the user to the tokens list.
      self.tokens[token] = user

    else:

      # Find the token for the user.
      for registered_token, registered_user in self.tokens.items():

        # Determinbe if the current user is the target user.
        if (registered_user == user):

          token = registered_token

    return token

  def get_user_from_token(self, token) -> str:
    '''Returns the user's token if valid.'''

    return self.tokens[token]

  def is_token_valid(self, token) -> bool:
    '''Determines if a token is associated with a user.'''

    return (token in self.tokens)

  def revoke_token(self, token):
    '''Revokes a token when the user is done.'''

    self.tokens.remove(token)
    