import { Taskboard } from "../modules/taskboard.js";
import { Task, build_task_from_json } from "../modules/task.js";
import { UserSocket } from "../modules/user_socket.js";

export let taskboard = null;
export let connection = null;

document.addEventListener("DOMContentLoaded", () => {

  // Create the taskboard class.
  taskboard = new Taskboard(document.querySelector(".taskboard"));

  // Set up the web socket connection.
  connection = new UserSocket("ws://localhost:8000/sockets/user", document.getElementById("user_token").value);

  // Add the form event listeners.
  document.getElementById("new-task-form").addEventListener("submit", handle_new_task_submission);
  document.getElementById("new-group-form").addEventListener("submit", handle_new_group_submission);
  document.getElementById("new-group-dialog").addEventListener("close", handle_new_group_dialog_close);
  document.getElementById("edit-task-form").addEventListener("submit", handle_edit_task_submission);

  // Set the event handlers for the web socket.
  connection.on_error = (status, message) => { alert(`${status} - ${message}`); };
  connection.on_task_new = handle_new_task_socket;
  connection.on_task_edit = handle_edit_task_socket;
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


function handle_new_task_taskboard(event) { 

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

async function handle_edit_task_taskboard(event) {

  // Declare variables.
  const id = event.currentTarget.dataset['task'];

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
    if (group['id'] == current_group_id) {

      option.selected = true;

    }

    // Append the option to the select element.
    group_field.append(option);

  })

  // Display the dialog.
  dialog.showModal();

}

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

function handle_new_task_submission(event) {

  // Get the objects from the form.
  const title_field = document.getElementById("new-task-title-field");
  const descript_field = document.getElementById("new-task-description-field");
  const due_date_field = document.getElementById("new-task-due-date-field");
  const group_id_field = document.getElementById("group-id-field");

  // Get the date object.
  let due_date = due_date_field.valueAsDate;

  // Create the due date object.
  let due_date_data = null;

  if (due_date != null) {
    due_date_data = {
      year: due_date.getFullYear(),
      month: due_date.getMonth() + 1,
      day: due_date.getDate()
    };
  }

  // Send the data to the server.
  fetch("http://localhost:8000/task/new", {
    'method': 'PUT',
    'body': JSON.stringify({
      title: title_field.value,
      description: descript_field.value,
      due_date: due_date_data,
      group: group_id_field.value
    })
  })
  .then(response => response.json())
  .then(data => {

      // Send the update information to the web socket.
      connection.request(UserSocket.CREATE, UserSocket.TASK, data['id']);

  });
  
  // Prevent the form from submitting and re-rendering the page.
  event.preventDefault();

  // Close the dialog window.
  document.getElementById("new-task-dialog").close();


}

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

function handle_edit_task_submission(event) {

  // Get form element values.
  const title = document.getElementById("edit-task-title-field").value;
  const description = document.getElementById("edit-task-description-field").value;
  const due_date = document.getElementById("edit-task-due-date-field").valueAsDate;
  const group_id = document.getElementById("edit-task-group-field").value;
  const id = document.getElementById("edit-task-id-field").value;
  let due_date_data = null;

  // Build the due-date object information.
  if (due_date != null) {

    due_date_data = {
      'year': due_date.getFullYear(),
      'month': due_date.getMonth() + 1,
      'day': due_date.getDate()
    };

  }

  // Send the information to the server.
  fetch(`http://localhost:8000/task/edit/${id}`, {
    'method': "PUT",
    'body': JSON.stringify({
      'title': title,
      'description': description,
      'due_date': due_date_data,
      'group': group_id
    })
  })
  .then(response => {

    // Send the update request to the websocket server.
    connection.request(UserSocket.UPDATE, UserSocket.TASK, id);

  });

  // Prevent the page from reloading.
  event.preventDefault();

  document.getElementById("edit-task-dialog").close();

}