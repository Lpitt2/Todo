from django.db import models
from django.contrib.auth.models import User
from uuid import uuid4
from datetime import date





class CommonBoard(models.Model):

  # Fields.
  title = models.CharField("title", max_length=128)

  # Relationships.
  owners = models.ManyToManyField(User)

  def user_authorized(self, user : User) -> bool:
    """Determines if the specified user is one of the owners of the common board."""
    return self.owners.all().filter(pk=user.id).exists()

  def get_overdue_tasks(self):
    """Returns tasks whose due date exceeds today."""

    # Get the overdue tasks from the commonboard.
    tasks = list()
    for group in TaskGroup.objects.filter(common_board=self.id):

      # Get the overdue tasks of the current group.
      tasks += group.get_overdue_tasks()

    return tasks



class ViewSetting(models.Model):

  # Fields.
  user = models.ForeignKey(User, on_delete=models.CASCADE)
  display_description = models.BooleanField("description", default=False)
  display_due_date = models.BooleanField("due_date", default=False)



class CommonBoardSetting(models.Model):

  # Fields.
  user = models.ForeignKey(User, on_delete=models.CASCADE)
  board = models.ForeignKey(CommonBoard, on_delete=models.CASCADE)
  show_alerts = models.BooleanField("show_alerts", default=True)



class TaskGroup(models.Model):
  
  # Fields.
  title = models.CharField("title", max_length=128)

  # Relationships.
  owner = models.ForeignKey(User, on_delete=models.DO_NOTHING)
  common_board = models.ForeignKey(CommonBoard, on_delete=models.DO_NOTHING, default=None, blank=True, null=True)

  def user_authorized(self, user : User) -> bool:
    """Determines if the specified user is one of the owners of the group."""
    return ((self.owner == user) or (self.common_board != None and self.common_board.user_authorized(user)))

  def get_group_as_dictionary(self):
    """Returns a dictionary object containing the information for the group."""

    return {
      'id': self.id,
      'title': self.title
    }

  def get_overdue_tasks(self):
    """Returns tasks whose due date exceeds today."""

    # Get today's date.
    today = date.today()

    # Find all tasks that are past-due.
    tasks = list()
    for task in Task.objects.filter(group=self.id):

      # Determine if the current task is late.
      if (task.due_date != None and task.due_date < today):

        tasks.append(task)

    return tasks



class Task(models.Model):

  # Fields.
  title = models.CharField("title", max_length=128)
  description = models.CharField("description", max_length=512,  blank=True, null=True)
  due_date = models.DateField("due_date",  blank=True, null=True)
  completion_status = models.BooleanField("completed", default=False, blank=True)

  # Relationships.
  owner = models.ForeignKey(User, on_delete=models.CASCADE)
  group = models.ForeignKey(TaskGroup, on_delete=models.CASCADE)

  def user_authorized(self, user : User) -> bool:
    """Determines if the specified user is one of the owners of the task."""

    return ((self.owner == user) or (self.group.user_authorized(user)))


  def get_task_as_dictionary(self):
    """Returns a JSON object of the task information."""

    return {
      'id': self.id,
      'title': self.title,
      'description': self.description,
      'due_date': None if self.due_date == None else {
        'year': self.due_date.year,
        'month': self.due_date.month,
        'day': self.due_date.day
      },
      'complete': self.completion_status,
      'group': self.group.id
    }


  def is_overdue(self):
    """Returns true if the task is overdue and false otherwise."""

    return ((self.due_date != None) and (self.due_date < date.today()))


  class Meta:
 
    ordering = [models.F("completion_status").asc(), models.F("due_date").asc(nulls_last=True)]



class Invite(models.Model):
  
  # Fields.
  invited_user = models.ForeignKey(User, on_delete=models.DO_NOTHING)

  # Relationships.
  common_board = models.ForeignKey(CommonBoard, on_delete=models.DO_NOTHING)
