/*
  This file contains the interaction code for the settings page.

  Content:
   - handle_account_delete:         Sends the delete request to the server.
   - handle_alert_option_change:    Sends the updated information for allowing/silencing alerts.
*/

document.addEventListener("DOMContentLoaded", () => {

  // Get the elements.
  const delete_button = document.getElementById("delete-account-button");

  // Set the event handlers for the elements.
  delete_button.addEventListener("click", handle_account_delete);
  document.querySelectorAll(".appearence-option").forEach(option => {
    option.addEventListener("click", handle_view_option_change);
  });
  document.querySelectorAll(".common-board-alert-setting-options").forEach(option => {
    option.addEventListener("click", handle_alert_option_change);
  });


});




// Sends the delete request to the server.
async function handle_account_delete() {

  // Prompt the user to confirm.
  if (window.confirm("Are you sure you want to delete your account?")) {

    // Make the request to the server.
    await fetch("http://localhost:8000/settings/delete");

    // Redirect the user to the index page.
    window.location = "http://localhost:8000/";

  }

}

// Sends the updated information for allowing/silencing alerts.
function handle_alert_option_change(event) {
 
  // Get the selected option.
  const option = event.target;

  // Get the id and alert status.
  const id = option.dataset['id'];
  const status = option.checked;

  // Set the request to the server.
  fetch ("http://localhost:8000/settings/alerts", {
    method: "PUT",
    body: JSON.stringify({
      id: id,
      status: status
    })
  });

}

function handle_view_option_change(event) {

  //Get the value and selection status.
  const option_button = event.target;
  const option_value = option_button.value;
  const selected = option_button.checked;

  // Send the updated information to the server.
  fetch("http://localhost:8000/settings/views", {
    method: "PUT",
    body: JSON.stringify({
      type: option_value,
      status: selected
    })
  })
  .catch(e => { alert("Unexpected failular to update settings."); });

}