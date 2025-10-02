/* Events for opening/closing dialogs. */


export function handle_new_group_dialog_close(event) {

   // Clear the contents of the fields.
  document.getElementById("new-group-name-field").value = "";

}

export function handle_new_task_dialog_open(event) {

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

export async function handle_edit_task_dialog_open(event) {

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





/* Form submission events. */


export function handle_new_task_submission(event) {

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

export function handle_edit_task_submission(event) {

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
    connection.request(UserSocket.UPDATE, UserSocket.TASK, id);

  });

  // Prevent the page from reloading.
  event.preventDefault();

  document.getElementById("edit-task-dialog").close();

}
