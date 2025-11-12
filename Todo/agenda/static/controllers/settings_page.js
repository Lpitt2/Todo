document.addEventListener("DOMContentLoaded", () => {

  // Get the elements.
  const delete_button = document.getElementById("delete-account-button");
  const view_selector = document.getElementById("view-selector");
  const alert_form = document.getElementById("alert-form");

  // Set the event handlers for the elements.
  delete_button.addEventListener("click", handle_account_delete);
  view_selector.addEventListener("change", handle_view_selector_change);
  document.querySelectorAll(".common-board-alert-setting-options").forEach(option => {
    option.addEventListener("click", handle_alert_option_change);
  });

});





async function handle_account_delete() {

  // Prompt the user to confirm.
  if (window.confirm("Are you sure you want to delete your account?")) {

    // Make the request to the server.
    await fetch("http://localhost:8000/settings/delete");

    // Redirect the user to the index page.
    window.location = "http://localhost:8000/";

  }

}

function handle_view_selector_change() {

}

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