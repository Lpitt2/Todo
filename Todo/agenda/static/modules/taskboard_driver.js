/*
  This file contains the reusable driver code for task boards.

  Dependencies:
   - ISocket (./user_sockets.js)
   - Task (./task.js)

  Content:
   - set_taskboard:                       Sets the global taskboard.
   - set_connection:                      Sets the global socket connection.
   - handle_new_task_taskboard:           Displays the new task dialog.
   - handle_edit_task_taskboard:          Displays the task edit dialog.
   - handle_delete_task_taskboard:        Sends the delete request to the server.
   - handle_complete_task_taskboard:      Sends the completion request to the server.
   - handle_group_rename_taskboard:       Sends the updated group name to the server.
   - handle_group_delete_taskboard:       Sends the group deletion request to the server.
   - handle_new_task_socket:              Adds a new task block to the taskboard.
   - handle_edit_task_socket:             Updates an existing taskblock on the taskboard.
   - handle_delete_task_socket:           Removes an existing taskblock on the taskboard.
   - handle_new_group_socket:             Adds a new group block on the taskboard.
   - handle_edit_group_socket:            Updates an existing group block on the taskboard.
   - handle_delete_group_socket:          Removes an existing group block on the taskboard.
   - handle_error_socket:                 Displays an error message to the user.
*/

import { ISocket } from "./user_socket.js";
import { Task } from "./task.js";




/* Global variables. */
let _taskboard = null;
let _connection = null;

// Sets the global taskboard.
export function set_taskboard(taskboard) {
  _taskboard = taskboard;
}

// Sets the global socket connection.
export function set_connection(connection) {
  _connection = connection;
}





/* Default functionallity for taskboard. */


// Displays the new task dialog.
export function handle_new_task_taskboard(event) { 

  // Declare variables.
  const group_id = event.currentTarget.parentElement.parentElement.parentElement.dataset['group'];
  const group_id_box = document.getElementById("group-id-field");
  const dialog = document.getElementById("new-task-dialog");
  const title_field = document.getElementById("new-task-title-field");
  const description_field = document.getElementById("new-task-description-field");
  const due_date_field = document.getElementById("new-task-due-date-field");

  // Clear the fields.
  title_field.value = "";
  description_field.value = "";
  due_date_field.value = "";

  // Set the id.
  group_id_box.value = group_id;

  // Display the dialog.
  dialog.showModal();

}

// Displays the task edit dialog.
export async function handle_edit_task_taskboard(task_block) {

  // Declare variables.
  const id = task_block.task.id;

  // Get the elements.
  const dialog = document.getElementById("edit-task-dialog");
  const title_field = document.getElementById("edit-task-title-field");
  const description_field = document.getElementById("edit-task-description-field");
  const due_date_field = document.getElementById("edit-task-due-date-field");
  const group_field = document.getElementById("edit-task-group-field");
  const task_id_field = document.getElementById("edit-task-id-field");
  let current_group_id = null;

  // Set the id in the task id field.
  task_id_field.value = id;

  // Obtain the task information from the server.
  const task_response = await fetch(`http://localhost:8000/task/info/${id}`);
  const task_data = await task_response.json();

  // Set the default values.
  title_field.value = task_data['title'];
  description_field.innerHTML = task_data['description'];
  
  // Update the due-date field.
  if (task_data['due_date'] != null) {

    // Construct the date object.
    let date = new Date(task_data['due_date']['year'], task_data['due_date']['month'] - 1, task_data['due_date']['day']);

    // Set the due-date field.
    due_date_field.valueAsDate = date;

  } else {

    due_date_field.value = "";

  }

  if (task_data['group'] != null) {

    // Set the current group id.
    current_group_id = task_data['group']['id'];

  }

  // Remove the groups from the group field.
  group_field.innerHTML = "";

  // Obtain the group information.
  const group_response = await fetch("http://localhost:8000/user/groups");
  const group_data = await group_response.json();

  // Iterate over each group object.
  group_data['groups'].forEach(group => {

    // Create the option.
    const option = document.createElement("option");

    // Set the value and text content.
    option.value = group['id'];
    option.textContent = group['title'];

    // Determine if the current group is the active group for the task.
    if (group['id'] === current_group_id) {

      option.selected = true;

    }

    // Append the option to the select element.
    group_field.append(option);

  })

  // Display the dialog.
  dialog.showModal();

}

// Sends the delete request to the server.
export function handle_delete_task_taskboard(task_block) {

  // Declare local variables.
  const task_title = task_block.task.title;
  const task_id = task_block.task.id;

  // Prompt the user for confirmation.
  const response = window.confirm(`Delete ${task_title}`);

  // Delete the task if the response is true.
  if (response) {

    // Send request to delete the task.
    fetch(`http://localhost:8000/task/delete/${task_id}`)
    .then(response => {

      // Send delete request to the web socket server.
      _connection.request(ISocket.DELETE, ISocket.TASK, task_id);

    });

  }

}

// Sends the completion request to the server.
export function handle_complete_task_taskboard(task_block, complete) {

  // Declare local variables.
  const task_id = task_block.task.id;

  // Send the update information to the server.
  fetch(`http://localhost:8000/task/edit/${task_id}`, {
    'method': 'PUT',
    'body': JSON.stringify({
      'complete': complete
    })
  })
  .then(response => {

    // Send the update information to the web socket server.
    _connection.request(ISocket.UPDATE, ISocket.TASK, task_id);

  });

}

// Sends the updated group name to the server.
export function handle_group_rename_taskboard(event) {

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
    _connection.request(ISocket.UPDATE, ISocket.GROUP, group_id);

  });

}

// Sends the group deletion request to the server.
export function handle_group_delete_taskboard(event) {

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
      _connection.request(ISocket.DELETE, ISocket.GROUP, group_id);

    });

  }

}




/* Default socket event handlers. */


// Adds a new task block to the taskboard.
export function handle_new_task_socket(task) {

  // Add the task to the taskboard.
  _taskboard.add_task(task);

}

// Updates an existing taskblock on the taskboard.
export function handle_edit_task_socket(task) {

  // Update the task in the taskboard.
  _taskboard.update_task(task);

}

// Removes an existing taskblock on the taskboard.
export function handle_delete_task_socket(task_id) {

  // Declare local variables.
  let task = new Task(task_id);

  // Delete the task in the taskboard.
  _taskboard.delete_task(task);

}

// Adds a new group block on the taskboard.
export function handle_new_group_socket(group_id, group_title) {

  // Add the group to the taskboard.
  _taskboard.add_group(group_id, group_title);

}

// Updates an existing group block on the taskboard.
export function handle_edit_group_socket(group_id, group_title) {

  // Update the group information.
  _taskboard.update_group(group_id, group_title);

}

// Removes an existing group block on the taskboard.
export function handle_delete_group_socket(group_id) {

  // Remove the group from the taskboard.
  _taskboard.delete_group(group_id);

}

// Displays an error message to the user.
export function handle_error_socket(status, message) {

  alert(`${status} - ${message}`);

}
