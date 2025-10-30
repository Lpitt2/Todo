document.addEventListener("DOMContentLoaded", () => {

  // Get the elements.
  const view_selector = document.getElementById("view-selector");
  const alert_form = document.getElementById("alert-form");

  // Set the event handlers for the elements.
  view_selector.addEventListener("change", handle_view_selector_change);
  alert_form.addEventListener("submit", handle_alert_form_submit);

});





function handle_view_selector_change() {

}

function handle_alert_form_submit(event) {
  event.preventDefault();
}