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
  path("task/new", views.task_new, name="task-new")
]