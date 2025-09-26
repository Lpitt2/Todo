const connection = new WebSocket("ws://localhost:8000/sockets/user");


document.addEventListener("DOMContentLoaded", () => {

  // Add the form event listeners.
  document.getElementById("new-task-form").addEventListener("submit", handle_new_task_submission);
  document.getElementById("new-group-form").addEventListener("submit", handle_new_group_submission);
  document.getElementById("new-group-dialog").addEventListener("close", handle_new_group_dialog_close);
  document.getElementById("edit-task-form").addEventListener("submit", handle_edit_task_submission);

  // Setup the websocket event handlers.
  connection.addEventListener("message", handle_socket_update);
  connection.addEventListener("open", handle_initial_socket_connection);

  // Render the taskboard.
  render();

});


/* Task and Task Group update operations. */


// Changes the title of a task group.
function handle_group_title_change(event) {

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
    connection.send(JSON.stringify({
      'activity': "UPDATE",
      'type': "GROUP",
      'id': group_id
    }));

  });

}

// Change the style of the task block.
function change_state_of_task_block(block, state) {

  // Get the title block.
  const title_block = block.querySelector("span");
  const check_box = block.querySelector("input");

  // Style based on the state of the block.
  if (state)
    title_block.style.setProperty("text-decoration", "line-through");
  else
    title_block.style.setProperty("text-decoration", "none");

  // Ensure the ckeckbox style.
  check_box.checked = state;

}

// Toggles a task's completion status.
function handle_task_complete_clicked(event) {

  // Declare variables.
  const task_block = event.target.parentElement;
  let completed = event.target.checked;

  // Send the update information to the server.
  fetch(`http://localhost:8000/task/edit/${task_block.dataset['task']}`, {
    'method': 'PUT',
    'body': JSON.stringify({
      'complete': completed
    })
  })
  .then(response => {

    // Send the update to the web socket.
    connection.send(JSON.stringify({
      'activity': "UPDATE",
      'type': "TASK",
      'id': task_block.dataset['task']
    }));

  });

  // Prevent the task edit dialog from displaying.
  event.stopPropagation();

}

// Displays the task edit dialog and form.
async function handle_task_edit_clicked(event) {

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

// Updates the information for a task.
function handle_edit_task_submission(event) {

  // Get form element values.
  const title = document.getElementById("edit-task-title-field").value;
  const description = document.getElementById("edit-task-description-field").innerHTML;
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
  connection.send(JSON.stringify({
      'activity': "UPDATE",
      'type': "TASK",
      'id': id
    }));

  });

  // Prevent the page from reloading.
  event.preventDefault();

  document.getElementById("edit-task-dialog").close();

}

// Requests that the selected task is deleted.
function handle_task_delete_clicked(event) {

  // Declare variables.
  const task_id = event.currentTarget.parentElement.parentElement.dataset['task'];

  // Send delete request to the server.
  fetch (`http://localhost:8000/task/delete/${task_id}`)
  .then(response => {

    // Send the update to the web socket server.
    connection.send(JSON.stringify({
      'activity': "DELETE",
      'type': "TASK",
      'id': task_id
    }));

  });

  // Prevent the task edit dialog from displaying.
  event.stopPropagation();

}


/* Taskboard specific operations. */


// Constructs the group list boxes given the title and ID.
function build_group(group_id) {

  // Declare variables.
  let group_box = null;

  // Get the group information from the server.
  fetch(`http://localhost:8000/group/info/${group_id}`)
  .then(response => response.json())
  .then(data => {

    // Create the group box.
    group_box = build_group_box(data['title'], group_id, data['tasks']);

    // Get the task list.
    const task_list = group_box.querySelector(".element-list");

    group_box.style.setProperty("order", group_id);

    // Add the group box to the taskboard.
    document.querySelector(".taskboard").append(group_box);

  });

}

// Constructs the group box.
function build_group_box(group_title, group_id, tasks = []) {

  // Declare variables.
  const group_box = document.createElement("li");
  const header = document.createElement("div");
  const title = document.createElement("div");
  const button_group_bar = document.createElement("div");
  const new_task_button = document.createElement("button");
  const delete_group_button = document.createElement("button");
  const new_task_icon = document.createElement("img");
  const delete_group_icon = document.createElement("img");
  const task_list = document.createElement("ul");

  // Build the structure of the group box.
  new_task_button.append(new_task_icon);
  delete_group_button.append(delete_group_icon);
  button_group_bar.append(new_task_button);
  button_group_bar.append(delete_group_button);
  header.append(title);
  header.append(button_group_bar);
  group_box.append(header);
  group_box.append(task_list);

  // Set the group id data attribute.
  group_box.dataset['group'] = group_id;

  // Set up the group title.
  title.innerHTML = group_title;
  title.contentEditable = true;

  // Set the event handlers.
  new_task_button.addEventListener("click", handle_new_task_button_pressed);
  delete_group_button.addEventListener("click", handle_group_delete_button_pressed);
  title.addEventListener("focusout", handle_group_title_change);

  // Set up the new task icon.
  new_task_icon.src = "static/icons/plus.svg";
  new_task_icon.width = 10;
  new_task_icon.height = 10;

  // Set up the delete group icon.
  delete_group_icon.src = "static/icons/delete.svg";
  delete_group_icon.width = 10;
  delete_group_icon.height = 10;

  // Apply CSS styling to the elements.
  group_box.classList.add("task-list-block");
  header.classList.add("left-right-container");
  button_group_bar.classList.add("right-container");
  new_task_button.classList.add("open-dialog-button");
  new_task_button.classList.add("button-accept");
  delete_group_button.classList.add("button-warning");
  task_list.classList.add("element-list");
  task_list.classList.add("task-list");
  button_group_bar.classList.add("button-group-row");

  // Construct the task block objects.
  tasks.forEach(task => {

      // Create the due-date object.
      let due_date = null;
      if (task['due_date'] != null) {

        due_date = new Date(task['due_date']['year'], task['due_date']['month'] - 1, task['due_date']['day']);

      }

    // Create the task block.
    const task_box = build_task_block(task['id'], task['title'], task['completed'], due_date);

    // Apply styling to the task.

    // Append the task box to the list.
    task_list.append(task_box);

  });

  return group_box;

}

// Consturcts task blocks.
function build_task_block(task_id, title, complete, due_date) {

  // Declare elements.
  const task_box = document.createElement("li");
  const completion_box = document.createElement("input");
  const task_title = document.createElement("span");
  const delete_container = document.createElement("div");
  const delete_icon = document.createElement("img");

  // Build the structure of the task block.
  delete_container.append(delete_icon);
  task_box.append(completion_box);
  task_box.append(task_title);
  task_box.append(delete_container);

  // Set up the delete icon information.
  delete_icon.src = "/static/icons/delete.svg";
  delete_icon.width = 10;
  delete_icon.height = 10;

  // Add the event handlers.
  completion_box.addEventListener("click", handle_task_complete_clicked);
  task_box.addEventListener("click", handle_task_edit_clicked);
  delete_icon.addEventListener("click", handle_task_delete_clicked);

  // Apply CSS styling.
  delete_container.className = "hover-icon";
  style_task_block(task_box, complete, due_date);

  // Set up the completition checkbox.
  completion_box.type = "checkbox";
  change_state_of_task_block(task_box, complete);

  // Set the title of the task block.
  task_title.textContent = title;

  // Set the task ID.
  task_box.dataset['task'] = task_id;
  task_box.id = `task-${task_id}`;

  return task_box;

}

// Applys conditional styling to a task block given the completion status and due-date.
function style_task_block(task_block, complete, due_date) {

    // Declare variables.
    let today = new Date();

    // Determine if the task block is completed.
    if (complete) {

      task_block.className = "completed-task";

    } else if ((due_date == null) || (today.getFullYear() < due_date.getFullYear()) || (today.getFullYear() == due_date.getFullYear() && today.getMonth() < due_date.getMonth()) || (today.getFullYear() == due_date.getFullYear() && today.getMonth() == due_date.getMonth() && today.getDate() < due_date.getDate())) {

      task_block.className = "future-task";

    } else if ((today.getDate() == due_date.getDate()) && (today.getMonth() == due_date.getMonth()) && (today.getFullYear() == due_date.getFullYear())) {

      task_block.className = "due-today-task";

    } else {

      task_block.className = "late-task";

    }

}

// Constructs the groups and tasks within the taskboard.
function render() {

  // Declare variables.
  const taskboard = document.querySelector(".taskboard");

  // Remove the existing elements from the taskboard.
  taskboard.childNodes.forEach(node => taskboard.removeChild(node));

  // Retrieve the group information from the server.
  fetch("http://localhost:8000/user/groups")
  .then(resp => resp.json())
  .then(data => {

    // Iterate over the groups.
    data['groups'].forEach(group => {

      // Build the current group.
      build_group(group['id']);

    });

  });

}

// Sends the user token to the web socket.
function handle_initial_socket_connection() {

  // Get the token.
  token = document.getElementById("user_token").value;

  // Send the token.
  connection.send(JSON.stringify({
    'user-token': token
  }));

}

// Updates the task board in response to the websocket.
function handle_socket_update(message) {

  const data = JSON.parse(message['data']);
  const activity = data['activity'];
  const type = data['type'];

  // Separate the request into the activitiy.
  if (data['activity'] == "CREATE") {

    // Separate further into the type.
    if (data['type'] == "GROUP") {

      // Build the group in the taskboard.
      document.querySelector(".taskboard").append(build_group_box(data['data']['title'], data['data']['id']));

    } else if (data['type'] == "TASK") {

      // Create the due-date object.
      let due_date = null;
      if (data['data']['due_date'] != null) {

        due_date = new Date(data['data']['due_date']['year'], data['data']['due_date']['month'], data['data']['due_date']['day']);

      }

      // Create the task block.
      const task_block = build_task_block(data['data']['id'], data['data']['title'], data['data']['completed'], due_date);

      // Append the task block to the group.
      document.querySelector(`[data-group=\"${data['data']['group']}\"]`).querySelector(".element-list").append(task_block);

    }

  } else if (data['activity'] == "UPDATE") {

    // Separate further into the type.
    if (data['type'] == "GROUP") {

      // Get the specified group.
      const group_box = document.querySelector(`[data-group="${data['data']['id']}"]`);

      // Update the title of the group.
      group_box.querySelector(".left-right-container").querySelector("div").textContent = data['data']['title'];

    } else if (data['type'] == "TASK") {

      // Get the task block.
      let task_block = document.getElementById(`task-${data['data']['id']}`);

      // Determine if the group that the task block exists within is the appropriate group.
      if (task_block.parentElement.parentElement.dataset['group'] != data['data']['group']) {

        // Remove the task from the specified group.
        task_block.parentElement.removeChild(task_block);

        // Append the task block to the appropriate group.
        const group_box = document.querySelector(`[data-group="${data['data']['group']}"]`);
        group_box.append(task_block);

      }

      // Update the title of the task.
      task_block.querySelector("span").textContent = data['data']['title'];

      // Update the completion status.
      change_state_of_task_block(task_block, data['data']['complete']);

      // Construct the due-date.
      due_date = null;
      if (data['data']['due_date'] != null) {

        due_date = new Date(data['data']['due_date']['year'], data['data']['due_date']['month'] - 1, data['data']['due_date']['day']);

      }

      // Update the styling.
      style_task_block(task_block, data['data']['complete'], due_date);

    }

  } else if (data['activity'] == "DELETE") {

    // Separate further into the type.
    if (data['type'] == "GROUP") {

      // Find the group block.
      const group_block = document.querySelector(`[data-group="${data['id']}"]`);

      // Remove the group block.
      group_block.remove();

    } else if (data['type'] == "TASK") {

      // Find the task block.
      const task_block = document.getElementById(`task-${data['id']}`);

      // Remove the task block.
      task_block.remove();

    }

  }

}


/* New Task dialog and form */


// Opens the new task dialog and sets up the proper group id.
function handle_new_task_button_pressed(event) {

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

// Deletes the selected group.
function handle_group_delete_button_pressed(event) {

  // Obtain the group id.
  const id = event.currentTarget.parentElement.parentElement.parentElement.dataset['group'];

  // Request that the server deletes the group.
  fetch (`http://localhost:8000/group/delete/${id}`)
  .then(response => {

    // Send the deletion information to the websocket server.
    connection.send(JSON.stringify({
      'activity': "DELETE",
      'type': "GROUP",
      'id': id
    }));

  });


}

// Creates a new task.
function handle_new_task_submission(event) {

  // Declare constants.
  const REQUEST_URL = "http://localhost:8000/task/new";

  // Get the objects from the form.
  const title_field = document.getElementById("new-task-title-field");
  const descript_field = document.getElementById("new-task-description-field");
  const due_date_field = document.getElementById("new-task-due-date-field");
  const group_id_field = document.getElementById("group-id-field");

  // Get the alert object.
  const alert_object = document.getElementById("new-task-alert");

  // Get the date object.
  let due_date = due_date_field.valueAsDate

  // Create the due date object.
  let = due_date_data = null;

  if (due_date != null) {
    due_date_data = {
      year: due_date.getFullYear(),
      month: due_date.getMonth() + 1,
      day: due_date.getDate()
    };
  }

  // Build the JSON object.
  let data = {
    title: title_field.value,
    description: descript_field.value,
    due_date: due_date_data,
    group: group_id_field.value
  };

  // Send the data to the server.
  fetch(REQUEST_URL, {
    'method': 'PUT',
    'body': JSON.stringify(data)
  })
  .then(response => response.json())
  .then(data => {

      // Send the update information to the web socket.
      connection.send(JSON.stringify({
        'activity': "CREATE",
        'type': "TASK",
        'id': data['id']
      }));

  }).catch(error => {
    alert_object.innerHTML = "Something went wrong.";
  });
  
  // Prevent the form from submitting and re-rendering the page.
  event.preventDefault();

  // Close the dialog window.
  document.getElementById("new-task-dialog").close();

}


/* New Group dialog and form */


// Creates a new task group.
function handle_new_group_submission(event) {

  // Declare variables.
  const group_name = document.getElementById("new-group-name-field").value;

  // Build the request object.
  let data = {
    'title': group_name
  };

  // Send the new group request to the server.
  fetch("http://localhost:8000/group/new", {
    'method': "PUT",
    'body': JSON.stringify(data)
  })
  .then(resp => resp.json())
  .then(data => {
    
    // Send the new group information to the web socket server.
    connection.send(JSON.stringify({
      'activity': "CREATE",
      'type': "GROUP",
      'id': data['id']
    }));

  });

  // Prevent the form from submitting and re-rendering the page.
  event.preventDefault();

  // Close the dialog window.
  document.getElementById("new-group-dialog").close();

}

// Cleans the new group dialog when closed.
function handle_new_group_dialog_close() {

  // Clear the contents of the fields.
  document.getElementById("new-group-name-field").value = "";

}