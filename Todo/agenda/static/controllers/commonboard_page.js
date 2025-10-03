import { Taskboard } from "../modules/taskboard.js";
import { Task, build_task_from_json } from "../modules/task.js";
import { CommonSocket } from "../modules/user_socket.js";

let taskboard = null;
let connection = null;

document.addEventListener("DOMContentLoaded", () => {

  // Get elements from page.
  const user_token = document.getElementById("user_token").value;
  const common_id = document.getElementById("common_id").value;

  // Create the taskboard.
  taskboard = new Taskboard(document.querySelector(".taskboard"));

  // Set up the connection.
  connection = new CommonSocket("ws://localhost:8000/sockets/user", user_token, common_id);

  // Apply the socket event handlers.
  connection.on_task_new = handle_new_task_socket;
  connection.on_task_edit = handle_edit_task_socket;
  connection.on_task_delete = handle_delete_task_socket;
  connection.on_group_new = handle_new_group_socket;
  connection.on_group_edit = handle_edit_group_socket;
  connection.on_group_delete = handle_delete_group_socket;

  // Apply the taskboard event handlers.
  taskboard.on_task_new = handle_new_task_taskboard;
  taskboard.on_task_edit = handle_edit_task_taskboard;
  taskboard.on_task_delete = handle_delete_task_taskboard;
  taskboard.on_task_complete = handle_complete_task_taskboard;
  taskboard.on_group_rename = handle_group_rename_taskboard;
  taskboard.on_group_delete = handle_group_delete_taskboard;

});





/* Common taskboard utilities. */


function render() {

}





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





/* Taskboard event handlers. */


function handle_new_task_taskboard(event) {

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





/* Form event handlers. */


