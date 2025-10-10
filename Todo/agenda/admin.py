from django.contrib import admin
from .models import Task, TaskGroup, CommonBoard

admin.site.register(Task)
admin.site.register(TaskGroup)
admin.site.register(CommonBoard)