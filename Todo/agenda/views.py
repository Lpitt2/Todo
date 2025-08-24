from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login
from django.contrib.auth.models import User
from django.http import HttpResponse, JsonResponse
from .models import *
from json import JSONDecoder
from datetime import date


# Page Requests.


def index_view(request):
  '''Renders the landing page.'''

  return render(request, "agenda/index.html")


def login_view(request):
  '''Handles the login requests.'''

  # Declare variables.
  error_message = None

  # Handle post requests.
  if (request.method == "POST"):

    # Extract the form data.
    username = request.POST['username_field']
    password = request.POST['password_field']
    
    # Attempt to authenticate the user.
    try:

      # Find the user with the same username.
      user = User.objects.get(username=username)

    except (User.DoesNotExist):

      # Ensure that the user is of type 'None'.
      user = None

      # Set the error message.
      error_message = "Username is incorrect."

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

  # Declare variables.
  error_message = None

  # Handle post requests.
  if (request.method == "POST"):
    
    # Extract the data from the form.
    username = request.POST['username_field']
    email = request.POST['email_field']
    password = request.POST['password_field']
    password_confirmation = request.POST['confirm_field']

    # Ensure that each of the fields are not null.
    if (not username.strip() or not email.strip() or not password.strip()):

      # Set the error message.
      error_message = "Requires username, email, and password."

    elif (password != password_confirmation):

      # Set the error message.
      error_message = "Passwords do not match."

    else:

      # Ensure that the username has not already been used.
      try:

        # Attempt to find a user with the same username.
        user = User.objects.get(username=username)

      except (User.DoesNotExist):

        # Create the user.
        user = User(email=email, username=username, password=password)

        # Save the user.
        user.save()

        # Log the user in.
        login(request, user)

        # Redirect the user to the home page.
        return redirect("home")

      else:

        # Set the error message.
        error_message = "Username is already in use."

  return render(request, "agenda/register.html", {'error_message': error_message})


@login_required(login_url="/login")
def home_view(request):
  '''Handles the home view.'''

  # Extract the user.
  user = request.user

  # Declare tasks dictionary.
  tasks = dict()

  # Iterate over the tasks owned by the 
  for task in user.task_set.all():

    # Determine if the task group exists yet.
    if task.group not in tasks:

      # Add a key for the group.
      tasks[task.group] = list()

    # Append the current task to the group.
    tasks[task.group].append(task)

  return render(request, "agenda/home.html", {'tasks': tasks})


@login_required(login_url="/login")
def task_view(request):
  return render(request, "agenda/task.html")


# API Requests.


@login_required()
def task_info(request, task_id):
  '''Responds with information about the requested task.'''

  # Find the requested task.
  task = get_object_or_404(Task, pk=task_id)

  # Ensure that the task is owned by the user.
  if (task.owner != request.user):
    return HttpResponse(status=401)
  
  # Build the response.
  data = {
    'ID': task.id,
    'title': task.title,
    'description': task.description,
    'completed': task.completion_status,
    'owner': {
      'ID': None,
      'username': task.owner.username
    }
  }

  return JsonResponse(data)


@require_http_methods(['PUT'])
def task_edit(request, task_id):
  '''Handle API requests for task data.'''

  # Ensure that the user is logged in.
  if (not request.user.is_authenticated):
    return HttpResponse(status=401)
  
  # Attempt to find the task.
  task = get_object_or_404(Task, pk=task_id)

  # Ensure that the task is owned by the user.
  if (task.owner != request.user):
    return HttpResponse(status=401)


@require_http_methods(['PUT'])
@csrf_exempt
def task_new(request):
  '''Handles the new task view.'''

  # Ensure that the user is logged in.
  if (not request.user.is_authenticated):
    return HttpResponse(status=401)
    
  # Create a new task object.
  task = Task()

  # Create the JSON decoder.
  decoder = JSONDecoder()

  # Extract the JSON object from the request.
  data = decoder.decode(request.body.decode("utf-8"))

  # Ensure that the required fields are present.
  if (("title" not in data) or (data['title'].strip() == "")):
    return HttpResponse(status=400)
  
  # Add the title.
  task.title = data['title']

  # Add the owner.
  task.owner = request.user

  # Add the description if present.
  if ("description" in data):
    task.description = data['description']

  # Add the due date if present.
  if (("due_date" in data) and (data['due_date'] != None) and ("year" in data['due_date']) and ("month" in data["due_date"]) and ("day" in data["due_date"])):
    task.due_date = date(data['due_date']['year'], data['due_date']['month'], data['due_date']['day'])

  # Save the task.
  task.save()

  # Load the information into the task object.
  return HttpResponse(status=200)