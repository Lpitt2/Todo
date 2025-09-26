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
from .users import UserRegistration


# Declare the necessary singletons.
registration = UserRegistration()


# Page Requests.


def index_view(request):
  '''Displays the landing page.'''

  return render(request, "agenda/index.html")


def login_view(request):
  '''Displays the login page.'''

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

      # Register the user with the users system.
      registration.register_user(user)

      # Redirect the user to the home.
      return redirect("home")
    
    else:
      error_message = "Username or password is incorrect."

  return render(request, "agenda/login.html", {'error_message': error_message})


def register_view(request):
  '''Displays the create new account page.'''

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

        # Register the user.
        registration.register_user(user)

        # Redirect the user to the home page.
        return redirect("home")

      else:

        # Set the error message.
        error_message = "Username is already in use."

  return render(request, "agenda/register.html", {'error_message': error_message})


@login_required(login_url="/login")
def home_view(request):
  '''Displays the user's home page with their tasks and groups.'''

  # Extract the user.
  user = request.user

  # Ensure that the user is registered.
  token = registration.register_user(request.user)

  return render(request, "agenda/home.html", {'user_token': token})


@login_required(login_url="/login")
def shared_view(request):
  ''''''

  # Extract the user.
  user = request.user

  # Ensure that the user is registered.
  token = registration.register_user(request.user)

  return render(request, "agenda/shared_dashboard.html", {'user_token': token})


# API Requests.


def user_group_info(request):
  '''API that returns the user's group information.'''

  # Verify that the user is logged in.
  if (not request.user.is_authenticated):
    return HttpResponse(status=401)

  # Obtain the group information.
  groups = TaskGroup.objects.filter(owner=request.user)

  data = {
    'groups': [
      {
        'title': group.title,
        'id': group.id
      } for group in groups
    ]
  }

  return JsonResponse(data)


def user_task_info(request, user_token):
  '''API that returns the user's task information.'''

  # Verify that the user is logged in.
  if (not request.user.is_authenticated):
    return HttpResponse(status=401)

  # Obtains the task information.
  tasks = Task.objects.filter(owner=request.user)

  data = {
    'tasks': [
      {
      'title': task.title,
      'group_id': (task.group.id if task.group != None else None),
      'completed': task.completion_status,
      'id': task.id,
      } for task in tasks
    ] 
  }

  return JsonResponse(data)


def task_info(request, task_id):
  '''API to get task information.'''

  # Ensure that the user is logged in.
  if (not request.user.is_authenticated):
    return HttpResponse(status=401)

  # Find the requested task.
  task = get_object_or_404(Task, pk=task_id)

  # Ensure that the task is owned by the user.
  if (task.owner != request.user):
    return HttpResponse(status=401)
  
  # Determine if the task has a due-date.
  due_date = None
  if (task.due_date != None):
    due_date = {
      'year': task.due_date.year,
      'month': task.due_date.month,
      'day': task.due_date.day
    }

  # Build the response.
  data = {
    'id': task.id,
    'title': task.title,
    'description': task.description,
    'completed': task.completion_status,
    'due_date': due_date,
    'group': {
      'title': task.group.title,
      'id': task.group.id
    },
    'owner': {
      'ID': task.owner.id,
      'username': task.owner.username
    }
  }

  return JsonResponse(data)


@require_http_methods(['PUT'])
@csrf_exempt
def task_edit(request, task_id):
  '''API to edit tasks.'''

  # Ensure that the user is logged in.
  if (not request.user.is_authenticated):
    return HttpResponse(status=401)
  
  # Attempt to find the task.
  task = get_object_or_404(Task, pk=task_id)

  # Ensure that the task is owned by the user.
  if (task.owner != request.user):
    return HttpResponse(status=401)
  
  # Decode the request.
  data = JSONDecoder().decode(request.body.decode("utf-8"))

  # Update the title if present.
  if ("title" in data):
    task.title = data['title']
  
  # Update the description if present.
  if ("description" in data):
    task.description = data['description']

  # Update the due date if present.
  if (("due_date" in data) and (data['due_date'] != None) and ("year" in data['due_date']) and ("month" in data["due_date"]) and ("day" in data["due_date"])):
    task.due_date = date(data['due_date']['year'], data['due_date']['month'], data['due_date']['day'])

  # Update the completion status if present.
  if ("complete" in data):
    task.completion_status = data['complete']

  # Update the group if present.
  if ("group" in data):

    # Find the group.
    group = get_object_or_404(TaskGroup, pk=data['group'])

    # Ensure that the group is owned by the user.
    if (group.owner != request.user):
      return HttpResponse(status=401)
    
    # Update the group to the task.
    task.group = group

  # Save the changes made to the task.
  task.save()

  return HttpResponse(status=200)


def task_delete(request, task_id):
  '''API to delete tasks.'''

  # Ensure that the user is logged in.
  if (not request.user.is_authenticated):
    return HttpResponse(status=401)
  
  # Attempt to obtain the task.
  task = get_object_or_404(Task, pk=task_id)

  # Ensure that the user is the owner of the object.
  if (task.owner != request.user):
    return HttpResponse(status=401)
  
  # Delete the task.
  task.delete()

  return HttpResponse(status=200)


@require_http_methods(['PUT'])
@csrf_exempt
def task_new(request):
  '''API to create tasks.'''

  # Ensure that the user is logged in.
  if (not request.user.is_authenticated):
    return HttpResponse(status=401)
    
  # Create a new task object.
  task = Task()

  # Extract the JSON object from the request.
  data = JSONDecoder().decode(request.body.decode("utf-8"))

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

  # Add the task to a group if necessary.
  if ("group" in data):
    
    # Attempt to find the group.
    group = get_object_or_404(TaskGroup, pk=data['group'])

    # Assign the task to the group.
    task.group = group


  # Save the task.
  task.save()

  # Construct the data object.
  data = {
    'id': task.id
  }

  # Load the information into the task object.
  return JsonResponse(data)


# Group API.


def group_info(request, group_id):
  '''API to get group information.'''

  # Attempt to get the group object.
  group = get_object_or_404(TaskGroup, pk=group_id)

  # Ensure that the requesting user is the owner.
  if (group.owner != request.user):
    return HttpResponse(status=404)
  
  # Build the group information.
  data = {
    'title': group.title,
    'owner': {
      'ID': group.owner.id,
      'username': group.owner.username
    },
    'tasks': [
      {
        'id': task.id,
        'title': task.title,
        'completed': task.completion_status,
        'due_date': None if task.due_date == None else {
          'year': task.due_date.year,
          'month': task.due_date.month,
          'day': task.due_date.day
        }
      } for task in Task.objects.filter(group=group_id)
    ]
  }

  return JsonResponse(data)


@require_http_methods(['PUT'])
@csrf_exempt
def group_edit(request, group_id):
  '''API to edit group information.'''

  # Attempt to get the group object.
  group = get_object_or_404(TaskGroup, pk=group_id)

  # Ensure that the group is owned by the requesting user.
  if (request.user != group.owner):
    return HttpResponse(status=401)
  
  # Extract the JSON object.
  data = JSONDecoder().decode(request.body.decode("utf-8"))

  # Update the title if present.
  if ("title" in data):
    group.title = data['title']

  # Save the updated group.
  group.save()

  return HttpResponse(status=200)


def group_delete(request, group_id):
  '''API to delete a group.'''

  # Attempt to get the group object.
  group = get_object_or_404(TaskGroup, pk=group_id)

  # Ensure that the requesting user is the owner.
  if (group.owner != request.user):
    return HttpResponse(status=401)
  
  # Delete the group object.
  group.delete()

  return HttpResponse(status=200)


@require_http_methods(['PUT'])
@csrf_exempt
def group_new(request):
  '''API to create a group.'''

  # Ensure that the user is logged in.
  if (not request.user.is_authenticated):
    return HttpResponse(status=401)
  
  # Create a group object.
  group = TaskGroup()

  # Extract the JSON object from the request.
  data = JSONDecoder().decode(request.body.decode("utf-8"))

  # Ensure that the title is present in the request.
  if ("title" not in data):
    return HttpResponse(status=400)
  
  # Assign the title to the group.
  group.title = data['title']

  # Assign the owner to the group.
  group.owner = request.user

  # Save the group.
  group.save()

  return JsonResponse({
    'id': group.id
  })
