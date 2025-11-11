document.addEventListener("DOMContentLoaded", () => {

  // Get the elements.
  const view_selector = document.getElementById("view-selector");
  const alert_form = document.getElementById("alert-form");

  // Set the event handlers for the elements.
  view_selector.addEventListener("change", handle_view_selector_change);
  document.querySelectorAll(".common-board-alert-setting-options").forEach(option => {
    option.addEventListener("click", handle_alert_option_change);
  });

});





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