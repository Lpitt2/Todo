from django.urls import path

from . import views

urlpatterns = [
  path("", views.index_view, name="index"),
  path("home", views.home_view, name="home"),
  path("login", views.login_view, name="login"),
  path("register", views.register_view, name="register"),
  path("tasks", views.task_view, name="task-view"),

  # Task API.
  path("task/info/<int:task_id>", views.task_info, name="task-info"),
  path("task/edit/<int:task_id>", views.task_edit, name="task-edit"),
  path("task/delete/<int:task_id>", views.task_delete, name="task-delete"),
  path("task/new", views.task_new, name="task-new"),

  # Group API.
  path("group/info/<int:group_id>", views.group_info, name="group-info"),
  path("group/edit/<int:group_id>", views.group_edit, name="group-edit"),
  path("group/delete/<int:group_id>", views.group_delete, name="group-delete"),
  path("group/new", views.group_new, name="group-new")
]