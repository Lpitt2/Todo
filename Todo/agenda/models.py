from django.db import models
from django.contrib.auth.models import User





class CommonBoard(models.Model):

  # Fields.
  title = models.CharField("title", max_length=128)

  # Relationships.
  owners = models.ManyToManyField(User)

  def user_authorized(self, user : User) -> bool:
    '''Determines if the specified user is one of the owners of the common board.'''
    return self.owners.all().filter(pk=user.id).exists()



class TaskGroup(models.Model):
  
  # Fields.
  title = models.CharField("title", max_length=128)

  # Relationships.
  owner = models.ForeignKey(User, on_delete=models.DO_NOTHING)
  common_board = models.ForeignKey(CommonBoard, on_delete=models.DO_NOTHING, default=None, blank=True, null=True)

  def get_group_as_dictionary(self):
    """Returns a dictionary object containing the information for the group."""

    return {
      'id': self.id,
      'title': self.title
    }



class Task(models.Model):

  # Fields.
  title = models.CharField("title", max_length=128)
  description = models.CharField("description", max_length=512,  blank=True, null=True)
  due_date = models.DateField("due_date",  blank=True, null=True)
  completion_status = models.BooleanField("completed", default=False, blank=True)

  # Relationships.
  owner = models.ForeignKey(User, on_delete=models.CASCADE)
  group = models.ForeignKey(TaskGroup, on_delete=models.CASCADE)

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

  class Meta:
 
    ordering = [models.F("completion_status").asc(), models.F("due_date").asc(nulls_last=True)]

