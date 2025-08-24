document.addEventListener("DOMContentLoaded", () => {

  // Get the elements needed.
  const form_object = document.getElementById("new-task-form");
  
  // Add the event listeners.
  form_object.addEventListener("submit", handle_new_task_submission);

});


function handle_new_task_submission(e) {

  // Declare constants.
  const REQUEST_URL = "http://localhost:8000/task/new";

  // Get the objects from the form.
  const title_field = document.getElementById("new-task-title-field");
  const descript_field = document.getElementById("new-task-description-field");
  const due_date_field = document.getElementById("new-task-due-date-field");

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
    due_date: due_date_data
  };

  // Send the data to the server.
  fetch(REQUEST_URL, {
    'method': 'PUT',
    'body': JSON.stringify(data)
  }).then(response => {
    if (!response.ok) {
      alert_object.innerHTML = "Something went wrong.";
    }
  });
  
  // Prevent the form from submitting and re-rendering the page.
  e.preventDefault();

}