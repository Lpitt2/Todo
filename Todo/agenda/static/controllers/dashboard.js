import { Taskboard } from "../taskboard.js";
import { Task, build_task_from_json } from "../task.js";
import { UserSocket } from "../user_socket.js";
import * as dialog from "../dialogs.js";

export let taskboard = null;
export let connection = null;

document.addEventListener("DOMContentLoaded", () => {

  // Create the taskboard class.
  taskboard = new Taskboard(document.querySelector(".taskboard"));

  // Set up the web socket connection.
  connection = new UserSocket("ws://localhost:8000/sockets/user", document.getElementById("user_token").value);

  // Add the form event listeners.
  document.getElementById("new-task-form").addEventListener("submit", dialog.handle_new_task_submission);
  document.getElementById("new-group-form").addEventListener("submit", handle_new_group_submission);
  document.getElementById("new-group-dialog").addEventListener("close", handle_new_group_dialog_close);
  document.getElementById("edit-task-form").addEventListener("submit", dialog.handle_edit_task_submission);

  // Set the event handlers for the web socket.
  connection.on_error = (status, message) => { alert(`${status} - ${message}`); };
  connection.on_task_new = dialog.handle_new_task_dialog_open;
  connection.on_task_edit = dialog.handle_edit_task_dialog_open;
  connection.on_task_delete = handle_delete_task_socket;
  connection.on_group_new = handle_new_group_socket;
  connection.on_group_edit = handle_edit_group_socket;
  connection.on_group_delete = handle_delete_group_socket;

  // Set the event handlers for the taskboard.
  taskboard.on_task_new = handle_new_task_taskboard;
  taskboard.on_task_edit = handle_edit_task_taskboard;
  taskboard.on_task_delete = handle_delete_task_taskboard;
  taskboard.on_task_complete = handle_complete_task_taskboard;
  taskboard.on_group_rename = handle_group_rename_taskboard;
  taskboard.on_group_delete = handle_group_delete_taskboard;

  // Render the taskboard.
  render();

});





/* Personal taskboard utilities. */


function render() {

  // Retrieve the task and group information from the server.
  fetch("http://localhost:8000/user/groups")
  .then(response => response.json())
  .then(group_data => {

    // Iterate over the groups within the response.
    group_data['groups'].forEach(group => {
      
      // Create the current group.
      taskboard.add_group(group['id'], group['title']);

      // Get the task information from the server.
      fetch(`http://localhost:8000/group/info/${group['id']}`)
      .then(response => response.json())
      .then(task_data => {

        // Iterate over each task.
        task_data['tasks'].forEach(task => {

          // Create the task object.
          let task_obj = build_task_from_json(task);

          // Add the task object to the group.
          taskboard.add_task(task_obj);

        });

      });

    });

  })

}





/* Web socket event handlers. */


function handle_new_task_socket(task) {

  // Add the task to the taskboard.
  taskboard.add_task(task);

}

function handle_edit_task_socket(task) {

  // Update the task in the taskboard.
  taskboard.update_task(task);

}

function handle_delete_task_socket(task_id) {

  // Declare local variables.
  let task = new Task(task_id);

  // Delete the task in the taskboard.
  taskboard.delete_task(task);

}

function handle_new_group_socket(group_id, group_title) {

  // Add the group to the taskboard.
  taskboard.add_group(group_id, group_title);

}

function handle_edit_group_socket(group_id, group_title) {

  // Update the group information.
  taskboard.update_group(group_id, group_title);

}

function handle_delete_group_socket(group_id) {

  // Remove the group from the taskboard.
  taskboard.delete_group(group_id);

}





/* Taskboard events. */


function handle_delete_task_taskboard(event) {

  // Declare local variables.
  const task_title = event.currentTarget.parentElement.parentElement.querySelector("span").innerHTML;
  const task_id = event.currentTarget.parentElement.parentElement.dataset['task'];

  // Prompt the user for confirmation.
  const response = window.confirm(`Delete ${task_title}`);

  // Delete the task if the response is true.
  if (response) {

    // Send request to delete the task.
    fetch(`http://localhost:8000/task/delete/${task_id}`)
    .then(response => {

      // Send delete request to the web socket server.
      connection.request(UserSocket.DELETE, UserSocket.TASK, task_id);

    });

  }

  // Prevent the edit dialog from displaying.
  event.stopPropagation();

}

function handle_complete_task_taskboard(event) {

  // Declare local variables.
  const task_id = event.currentTarget.parentElement.dataset['task'];
  const complete = event.currentTarget.checked;

  // Send the update information to the server.
  fetch(`http://localhost:8000/task/edit/${task_id}`, {
    'method': 'PUT',
    'body': JSON.stringify({
      'complete': complete
    })
  })
  .then(response => {

    // Send the update information to the web socket server.
    connection.request(UserSocket.UPDATE, UserSocket.TASK, task_id);

  });

  // Prevent the edit dialog from displaying.
  event.stopPropagation();

}

function handle_group_rename_taskboard(event) {

  // Declare local variables.
  const title_box = event.target;
  const group_id = title_box.parentElement.parentElement.dataset['group'];

  // Send update request to the server.
  fetch (`http://localhost:8000/group/edit/${group_id}`, {
    'method': 'PUT',
    'body': JSON.stringify({
      'title': title_box.innerHTML
    })
  })
  .then(response => {

    // Send the update information to the websocket server.
    connection.request(UserSocket.UPDATE, UserSocket.GROUP, group_id);

  });

}

function handle_group_delete_taskboard(event) {

  // Declare local variables.
  const group_id = event.currentTarget.parentElement.parentElement.parentElement.dataset['group'];
  const group_title = event.currentTarget.parentElement.parentElement.querySelector("div").innerHTML;

  // Prompt the user for confirmation.
  const response = window.confirm(`Delete Group "${group_title}"?`);

  // Delete the group if the user confirmed.
  if (response) {

    // Send the request information to the web server.
    fetch(`http://localhost:8000/group/delete/${group_id}`)
    .then(resp => {

      // Send the request to the web socket server.
      connection.request(UserSocket.DELETE, UserSocket.GROUP, group_id);

    });

  }

}





/* Form Event Handlers. */


function handle_new_group_submission(event) {

  // Declare variables.
  const group_name = document.getElementById("new-group-name-field").value;

  // Send the new group request to the server.
  fetch("http://localhost:8000/group/new", {
    'method': "PUT",
    'body': JSON.stringify({
      'title': group_name
    })
  })
  .then(resp => resp.json())
  .then(data => {
    
    // Send the new group information to the web socket server.
    connection.request(UserSocket.CREATE, UserSocket.GROUP, data['id']);

  });

  // Prevent the form from submitting and re-rendering the page.
  event.preventDefault();

  // Close the dialog window.
  document.getElementById("new-group-dialog").close();

}

function handle_new_group_dialog_close(event) {

   // Clear the contents of the fields.
  document.getElementById("new-group-name-field").value = "";

}
