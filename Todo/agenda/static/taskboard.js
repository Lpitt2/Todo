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

  // Determine if the task is checked off.
  change_state_of_task_block(task_block, completed);

  // Send the update information to the server.
  fetch(`http://localhost:8000/task/edit/${task_block.dataset['task']}`, {
    'method': 'PUT',
    'body': JSON.stringify({
      'complete': completed
    })
  });

  // Send the update to the web socket.
  connection.send(JSON.stringify({
    'activity': "UPDATE",
    'type': "TASK",
    'id': task_block.dataset['task']
  }));

  // Prevent the task edit dialog from displaying.
  event.stopPropagation();

}

// Displays the task edit dialog and form.
function handle_task_edit_clicked(event) {

  // Declare variables.
  const id = event.currentTarget.dataset['task'];

  // Get the elements.
  const dialog = document.getElementById("edit-task-dialog");
  const title_field = document.getElementById("edit-task-title-field");
  const description_field = document.getElementById("edit-task-description-field");
  const due_date_field = document.getElementById("edit-task-due-date-field");
  const task_id_field = document.getElementById("edit-task-id-field");

  // Set the id in the task id field.
  task_id_field.value = id;

  // Obtain the task information from the server.
  fetch(`http://localhost:8000/task/info/${id}`)
  .then(response => response.json())
  .then(data => {

    // Set the default values.
    title_field.value = data['title'];
    description_field.innerHTML = data['description'];
    
    if (data['due-date'] != null) {

      // Construct the date object.
      let date = new Date(data['due-date']['year'], data['due-date']['month'], data['due-date']['day']);

      // Set the due-date field.
      due_date_field.valueAsDate = date;

    }

  });

  // Display the dialog.
  dialog.showModal();

}

// Updates the information for a task.
function handle_edit_task_submission(event) {

  // Get form element values.
  const title = document.getElementById("edit-task-title-field").value;
  const description = document.getElementById("edit-task-description-field").innerHTML;
  const due_date = document.getElementById("edit-task-due-date-field").valueAsDate;
  const id = document.getElementById("edit-task-id-field").value;
  let due_date_data = null;

  // Build the due-date object information.
  if (due_date != null) {

    due_date_data = {
      'year': due_date.year,
      'month': due_date.month,
      'day': due_date.day
    };

  }

  // Send the information to the server.
  fetch(`http://localhost:8000/task/edit/${id}`, {
    'method': "PUT",
    'body': JSON.stringify({
      'title': title,
      'description': description,
      'due-date': due_date_data
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

}


/* Taskboard specific operations. */


// Constructs the group list boxes given the title and ID.
function build_group_list(group_id) {

  // Declare variables.
  const group_box = document.createElement("li");
  const header = document.createElement("div");
  const title = document.createElement("div");
  const task_list = document.createElement("ul");
  const new_task_button = document.createElement("button");
  const icon = document.createElement("img");

  // Set the group id in the dataset.
  group_box.dataset['group'] = group_id;

  // Get the group information from the server.
  fetch(`http://localhost:8000/group/info/${group_id}`)
  .then(response => response.json())
  .then(data => {
    
    // Set the title element.
    title.innerHTML = data['title'];

    // Add the event handler to the title.
    title.addEventListener("focusout", handle_group_title_change);

    // Iterate over the tasks within the group.
    data['tasks'].forEach(task => {
      
      // Create the elements.
      const task_box = document.createElement("li");
      const completion_box = document.createElement("input");
      const task_title = document.createElement("span");

      // Set the value of task_title.
      task_title.textContent = task['title'];

      // Build the task block.
      task_box.append(completion_box);
      task_box.append(task_title);

      // Style the elements.
      task_box.classList.add("task-block");
      completion_box.type = "checkbox";
      change_state_of_task_block(task_box, task['completed']);

      // Add event handler.
      completion_box.addEventListener("click", handle_task_complete_clicked);
      task_box.addEventListener("click", handle_task_edit_clicked);

      // Set the id for the task.
      task_box.dataset['task'] = task['id'];

      // Append the task box to the task list.
      task_list.append(task_box);

    });

  });


  // Set up the styling for the elements.
  group_box.classList.add("task-list-block");
  header.classList.add("left-right-container");
  new_task_button.classList.add("right-container");
  new_task_button.classList.add("open-dialog-button");
  new_task_button.classList.add("button-accept");
  task_list.classList.add("element-list");

  // Set up the icon for the new task button.
  icon.src = "static/icons/plus.svg";
  icon.width = 10;
  icon.height = 10;

  // Set up the title.
  title.contentEditable = true;

  // Build the structure of the group block.
  group_box.append(header);
  header.append(title);
  new_task_button.append(icon);
  header.append(new_task_button);
  group_box.append(task_list);

  // Add the event handler to the new task button.
  new_task_button.addEventListener("click", handle_new_task_button_pressed);

  // Add group box to the taskboard.
  document.querySelector(".taskboard").append(group_box);

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
      build_group_list(group['id']);

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

  console.log(message['data']);

}


/* New Task dialog and form */


// Opens the new task dialog and sets up the proper group id.
function handle_new_task_button_pressed(event) {

  // Declare variables.
  const group_id = event.currentTarget.parentElement.parentElement.dataset['group'];
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