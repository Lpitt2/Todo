from django.db import models
from django.contrib.auth.models import User





class CommonBoard(models.Model):

  # Fields.
  title = models.CharField("title", max_length=128)

  # Relationships.
  owners = models.ManyToManyField(User)



class TaskGroup(models.Model):
  
  # Fields.
  title = models.CharField("title", max_length=128)

  # Relationships.
  owner = models.ForeignKey(User, on_delete=models.DO_NOTHING)
  common_board = models.ForeignKey(CommonBoard, on_delete=models.DO_NOTHING, default=None, blank=True, null=True)



class Task(models.Model):

  # Fields.
  title = models.CharField("title", max_length=128)
  description = models.CharField("description", max_length=512,  blank=True, null=True)
  due_date = models.DateField("due_date",  blank=True, null=True)
  completion_status = models.BooleanField("completed", default=False, blank=True)

  # Relationships.
  owner = models.ForeignKey(User, on_delete=models.CASCADE)
  group = models.ForeignKey(TaskGroup, on_delete=models.CASCADE)

  class Meta:
 
    ordering = [models.F("completion_status").asc(), models.F("due_date").asc(nulls_last=True)]

