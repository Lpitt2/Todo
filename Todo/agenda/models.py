from django.db import models
from django.contrib.auth.models import User



class TaskGroup(models.Model):
  
  # Fields.
  title = models.CharField("title", max_length=128)

  # Relationships.
  owner = models.ForeignKey(User, on_delete=models.DO_NOTHING)



class Task(models.Model):

  # Fields.
  title = models.CharField("title", max_length=128)
  description = models.CharField("description", max_length=512,  blank=True, null=True)
  due_date = models.DateField("due_date",  blank=True, null=True)
  completion_status = models.BooleanField("completed", default=False, blank=True)

  # Relationships.
  owner = models.ForeignKey(User, on_delete=models.CASCADE)
  group = models.ForeignKey(TaskGroup, on_delete=models.CASCADE)
