from django.contrib import admin
from .models import Task, TaskGroup, CommonBoard, ViewSetting, CommonBoardSetting, Invite

admin.site.register(Task)
admin.site.register(TaskGroup)
admin.site.register(CommonBoard)
admin.site.register(ViewSetting)
admin.site.register(CommonBoardSetting)
admin.site.register(Invite)