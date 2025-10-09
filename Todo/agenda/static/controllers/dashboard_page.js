import { Taskboard } from "../modules/taskboard.js";
import { Task, build_task_from_json } from "../modules/task.js";
import { UserSocket } from "../modules/user_socket.js";
import * as Driver from "../modules/taskboard_driver.js";

export let taskboard = null;
export let connection = null;

document.addEventListener("DOMContentLoaded", () => {

  // Create the taskboard class.
  taskboard = new Taskboard(document.querySelector(".taskboard"));

  // Set up the web socket connection.
  connection = new UserSocket("ws://localhost:8000/sockets/user", document.getElementById("user_token").value);

  // Set up the taskboard driver.
  Driver.set_taskboard(taskboard);
  Driver.set_connection(connection);

  // Add the form event listeners.
  document.getElementById("new-task-form").addEventListener("submit", handle_new_task_submission);
  document.getElementById("new-group-form").addEventListener("submit", handle_new_group_submission);
  document.getElementById("new-group-dialog").addEventListener("close", handle_new_group_dialog_close);
  document.getElementById("edit-task-form").addEventListener("submit", handle_edit_task_submission);

  // Set up the event handlers for taskboard.
  taskboard.on_task_new = Driver.handle_new_task_taskboard;
  taskboard.on_task_edit = Driver.handle_edit_task_taskboard;
  taskboard.on_task_complete = Driver.handle_complete_task_taskboard;
  taskboard.on_task_delete = Driver.handle_delete_task_taskboard;
  taskboard.on_group_rename = Driver.handle_group_rename_taskboard;
  taskboard.on_group_delete = Driver.handle_group_delete_taskboard;

  // Set up the web socket event handlers.
  connection.on_task_new = Driver.handle_new_task_socket;
  connection.on_task_edit = Driver.handle_edit_task_socket;
  connection.on_task_delete = Driver.handle_delete_task_socket;
  connection.on_group_new = Driver.handle_new_group_socket;
  connection.on_group_delete = Driver.handle_delete_group_socket;
  connection.on_error = Driver.handle_error_socket;

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
    connection.request(UserSocket.UPDATE, UserSocket.TASK, id);

  });

  // Prevent the page from reloading.
  event.preventDefault();

  document.getElementById("edit-task-dialog").close();

}