import { Taskboard, style_task_block } from "../taskboard.js";
import { Task } from "../task.js";
import { UserSocket } from "../user_socket.js";

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

});





/* Web socket event handlers. */


function handle_new_task_socket(task) {

  

}

function handle_edit_task_socket(task) {

}

function handle_delete_task_socket(task_id) {

}

function handle_new_group_socket(group_id, group_title) {

}

function handle_edit_group_socket(group_id, group_title) {

}

function handle_delete_group_socket(group_id) {

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

function handle_edit_task_taskboard(event) {

}

function handle_delete_task_taskboard(event) {

}

function handle_complete_task_taskboard(event) {

}

function handle_group_rename_taskboard(event) {

}

function handle_group_delete_taskboard(event) {

}





/* Form Event Handlers. */

function handle_new_task_submission(event) {

}

function handle_new_group_submission(event) {

}

function handle_new_group_dialog_close(event) {

}

function handle_edit_task_submission(event) {

}