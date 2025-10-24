import { Taskboard } from "../modules/taskboard.js";
import { build_task_from_json } from "../modules/task.js";
import { CommonSocket, ISocket } from "../modules/user_socket.js";
import * as shared_box from "../modules/share_box.js";
import * as Driver from "../modules/taskboard_driver.js" ;

let taskboard = null;
let connection = null;

document.addEventListener("DOMContentLoaded", () => {

  // Get elements from page.
  const user_token = document.getElementById("user_token").value;
  const common_id = document.getElementById("common_id").value;

  // Create the taskboard.
  taskboard = new Taskboard(document.querySelector(".taskboard"));

  // Set up the connection.
  connection = new CommonSocket("ws://localhost:8000/sockets/common", user_token, common_id);

  // Set up the taskboard and web socket for the boiler plate.
  Driver.set_taskboard(taskboard);
  Driver.set_connection(connection);

  // Add the form event handlers.
  document.getElementById("new-group-form").addEventListener("submit", handle_new_group_submission);
  document.getElementById("new-task-form").addEventListener("submit", handle_new_task_submission);
  document.getElementById("edit-task-form").addEventListener("submit", handle_edit_task_submission);
  document.getElementById("new-group-dialog").addEventListener("close", handle_new_group_dialog_close);
  document.getElementById("share-form").addEventListener("submit", handle_share_submission);

  // Set up the event handlers for taskboard.
  taskboard.on_task_new = Driver.handle_new_task_taskboard;
  taskboard.on_task_edit = handle_edit_task_taskboard;
  taskboard.on_task_complete = Driver.handle_complete_task_taskboard;
  taskboard.on_task_delete = Driver.handle_delete_task_taskboard;
  taskboard.on_group_rename = Driver.handle_group_rename_taskboard;
  taskboard.on_group_delete = Driver.handle_group_delete_taskboard;

  // Set up the web socket event handlers.
  connection.on_task_new = Driver.handle_new_task_socket;
  connection.on_task_edit = Driver.handle_edit_task_socket;
  connection.on_task_delete = Driver.handle_delete_task_socket;
  connection.on_group_new = Driver.handle_new_group_socket;
  connection.on_group_edit = Driver.handle_edit_group_socket;
  connection.on_group_delete = Driver.handle_delete_group_socket;
  connection.on_error = Driver.handle_error_socket;
  connection.on_board_update = handle_edit_common_board;

  // Add the event handler for the share user name box.
  document.getElementById("add-user-share-name-field").addEventListener("keydown", shared_box.handle_keydown_event_share_names_field);
  document.getElementById("add-users-button").addEventListener("click", handle_share_dialog_open);

  // Add the administration event handlers.
  document.getElementById("leave-group-button").addEventListener("click", handle_leave_common_board_click);
  document.getElementById("board_title_header").addEventListener("focusout", handle_board_rename);

  // Perform the initial rendering of the taskboard.
  render();

});





/* Common taskboard utilities. */


function render() {

  // Declare variables.
  const common_id = document.getElementById("common_id").value;

  // Get the common board information from the server.
  fetch(`http://localhost:8000/shared/info/${common_id}`)
  .then(response => response.json())
  .then(group_data => {

    // Ensure that the group list is not null.
    if (group_data['groups'] === null)
      return;

    // Iterate over the groups within the response.
    group_data['groups'].forEach(group => {

      // Create the group in the taskboard.
      taskboard.add_group(group['id'], group['title']);

      // Get the group information for the current group.
      fetch(`http://localhost:8000/group/info/${group['id']}`)
      .then(response => response.json())
      .then(task_data => {

        // Ensure that the task list is not null.
        if (task_data['tasks'] === null)
          return;

        // Iterate over each task.
        task_data['tasks'].forEach(task => {

          // Create the task object.
          let task_obj = build_task_from_json(task);

          // Add the task to the group.
          taskboard.add_task(task_obj);

        })

      });

    });

  });
  
}

function handle_edit_common_board(data) {

  // Get the elements.
  const board_name_field = document.getElementById("board_title_header");

  // Update the name.
  board_name_field.innerText = data['title'];

}





/* Taskboard events. */


async function handle_edit_task_taskboard(event) {

  // Declare variables.
  const id = event.currentTarget.dataset['task'];
  const common_id = document.getElementById("common_id").value;

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
  const group_response = await fetch(`http://localhost:8000/shared/info/${common_id}`);
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





/* Form event handlers. */


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
      day: due_date.getDate() + 1
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
      connection.request(CommonSocket.CREATE, CommonSocket.TASK, data['id']);

  });
  
  // Prevent the form from submitting and re-rendering the page.
  event.preventDefault();

  // Close the dialog window.
  document.getElementById("new-task-dialog").close();


}

function handle_new_group_submission(event) {

  // Declare variables.
  const group_name = document.getElementById("new-group-name-field").value;
  const board_id = document.getElementById("common_id").value;

  // Send the new group request to the server.
  fetch("http://localhost:8000/group/new", {
    'method': "PUT",
    'body': JSON.stringify({
      'title': group_name,
      'board': board_id
    })
  })
  .then(resp => resp.json())
  .then(data => {
    
    // Send the new group information to the web socket server.
    connection.request(CommonSocket.CREATE, CommonSocket.GROUP, data['id']);

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

function handle_share_dialog_open(event) {

  // Get the common board id.
  const common_id = document.getElementById("common_id").value;

  // Get the users already within the group.
  fetch(`http://localhost:8000/shared/info/${common_id}`)
  .then(response => response.json())
  .then(data => {

    // Ensure that the list of users is present.
    if (data.hasOwnProperty("owners") && typeof(data['owners']) === typeof([])) {

      // Add the default users to the shared box.
      shared_box.preset_email_list("add-user-share-name-list", data['owners']);

    }

  });

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
      'day': due_date.getDate() + 1
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
    connection.request(CommonSocket.UPDATE, CommonSocket.TASK, id);

  });

  // Prevent the page from reloading.
  event.preventDefault();

  document.getElementById("edit-task-dialog").close();

}

function handle_share_submission(event) {

  // Get the common board id.
  const common_id = document.getElementById("common_id").value;

  // Get the list of users.
  const usernames = shared_box.convert_shared_usernames_to_list(document.getElementById("add-user-share-name-list"));

  // Prevent the form from submitting.
  event.preventDefault();

  // Build the request.
  let data = JSON.stringify({
    'add-users': usernames
  });

  // Make the request to the server to update the users.
  fetch(`http://localhost:8000/shared/edit/${common_id}`, {
    method: 'PUT',
    body: data
  });  

  // Close the dialog.
  document.getElementById("share-dialog").close();

}





/* Leave common board administration events. */


function handle_leave_common_board_click(event) {

    // Get the common board id.
    const common_id = document.getElementById("common_id").value;

    // Prompt the user to confirm their action.
    if (window.confirm("Are you sure you want to leave this common board?")) {

        // Remove the current user from the common board.
        fetch(`http://localhost:8000/shared/edit/${common_id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    'remove-self': null
                })
        }).then(response => window.location.href = "http://localhost:8000/shared/0");

    }

}

function handle_board_rename(event) {

  // Get the element values.
  const board_name = `${document.getElementById("board_title_header").innerText}`;
  const commonboard_id = document.getElementById("common_id").value;

  // Ensure that the name is not empty.
  if (board_name.trim() === "") {

    alert("Board name cannot be empty.");

    return;

  }

  // Make the name change request to the server.
  fetch (`http://localhost:8000/shared/edit/${commonboard_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      'title': board_name
    })
  }).then(response => {
    connection.request(ISocket.UPDATE, CommonSocket.BOARD, null);
  });

}