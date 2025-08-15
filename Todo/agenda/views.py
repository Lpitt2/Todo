from django.shortcuts import render
from django.contrib.auth.decorators import login_required



def index(request):
  '''Renders the landing page.'''
  
  return render(request, "agenda/index.html")


@login_required(login_url="/login")
def home(request):
  '''Handles the home view.'''

  return render(request, "agenda/home.html")


def login(request):
  '''Handles the login requests.'''

  # Handle post requests.
  if (request.method == "POST"):
    pass

  return render(request, "agenda/login.html")


def register(request):
  '''Handles the register requests.'''

  # Handle post requests.
  if (request.method == "POST"):
    pass

  return render(request, "agenda/register.html")
