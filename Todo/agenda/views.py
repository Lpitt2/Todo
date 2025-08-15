from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth import authenticate, login



def index_view(request):
  '''Renders the landing page.'''

  return render(request, "agenda/index.html")


@login_required(login_url="/login")
def home_view(request):
  '''Handles the home view.'''

  return render(request, "agenda/home.html")


def login_view(request):
  '''Handles the login requests.'''

  # Declare variables.
  error_message = None

  # Handle post requests.
  if (request.method == "POST"):
    
    # Attempt to authenticate the user.
    user = authenticate(username=request.POST.get("username_field"), password=request.POST.get("password_field"))

    # Login the user if the authentication was a success.
    if user:

      # Log the user in.
      login(request, user)

      # Redirect the user to the home.
      return redirect("home")
    
    else:
      error_message = "Username or password is incorrect."


  return render(request, "agenda/login.html", {'error_message': error_message})


def register_view(request):
  '''Handles the register requests.'''

  # Handle post requests.
  if (request.method == "POST"):
    pass

  return render(request, "agenda/register.html")
