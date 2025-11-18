from django.urls import path, re_path

from . import views
from . import consumers

urlpatterns = [
  path("", views.index_view, name="index"),
  path("home", views.home_view, name="home"),
  path("shared/<int:id>", views.shared_view, name="shared"),
  path("login", views.login_view, name="login"),
  path("register", views.register_view, name="register"),
  path("settings", views.settings_view, name="settings"),

  # Settings.
  path("settings/delete", views.settings_delete_account, name="settings-account-delete"),#
  path("settings/alerts", views.settings_update_alerts, name="settings-alerts-update"),#

  # Alert API.
  path("alerts/tasks", views.alert_task_info, name="alert-task-info"),#
  path("alerts/invites", views.alert_invite_info, name="alert-invite-info"),#
  path("alerts/invite/dismiss", views.alert_dismiss, name="alert-dismiss"),#
  path("alerts/invite/accept", views.alert_invite_accept, name="alert-invite-accept"),#

  # General information API.
  path("user/groups", views.user_group_info, name="user-group-info"),#
  path("user/tasks", views.user_task_info, name="user-task-info"),#
  path("user/icon", views.user_icon_info, name="user-icon-info"),#

  # Task API.
  path("task/info/<int:task_id>", views.task_info, name="task-info"),#
  path("task/edit/<int:task_id>", views.task_edit, name="task-edit"),#
  path("task/delete/<int:task_id>", views.task_delete, name="task-delete"),#
  path("task/new", views.task_new, name="task-new"),#

  # Group API.
  path("group/info/<int:group_id>", views.group_info, name="group-info"),#
  path("group/edit/<int:group_id>", views.group_edit, name="group-edit"),#
  path("group/delete/<int:group_id>", views.group_delete, name="group-delete"),#
  path("group/new", views.group_new, name="group-new"),#

  # Common Board API.
  path("shared/info/<int:id>", views.shared_info, name="shared-info"),#
  path("shared/edit/<int:id>", views.shared_edit, name="shared-edit"),#
  path("shared/new", views.shared_new, name="shared-new"),#
]


websocket_urls = [
  path('sockets/user', consumers.UserConsumer.as_asgi()),
  path('sockets/common', consumers.CommonComumer.as_asgi())
]