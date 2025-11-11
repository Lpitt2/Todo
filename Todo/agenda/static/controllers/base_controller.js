import { InviteAlertBox, OverdueAlertBox } from "../modules/alerts.js"

document.addEventListener("DOMContentLoaded", () => {

  // Get the alerts panel.
  const alerts_panel = document.getElementById("alerts_popover");

  // Add event listeners to the popover.
  alerts_panel.addEventListener("toggle", handle_alerts_open);

});


async function handle_alerts_open(event) {

  const alert_list = document.getElementById("alert_list");

  // Clear the content list.
  alert_list.innerHTML = "";
  
  // Determine if the user is opening the alert panel.
  if (event.newState === "open") {

    // Request all of the user's invites.
    let invite_request = await fetch("http://localhost:8000/alerts/invites");
    let invite_data = await invite_request.json();

    // Iterate over the invites.
    invite_data['invites'].forEach(invite => {
      
      let box = new InviteAlertBox(invite.id, invite.title);

      alert_list.append(box.build());

    });

    // Request all of the user's due tasks.
    let task_request = await fetch("http://localhost:8000/alerts/tasks");
    let task_data = await task_request.json();

    // Add each task box to the alert list.
    task_data['tasks'].forEach(task => {

      let box = new OverdueAlertBox(task['id'], task['title'], task['description']);

      alert_list.append(box.build());

    });

  }

}