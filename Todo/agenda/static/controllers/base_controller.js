import { InviteAlertBox } from "../modules/alerts.js"

document.addEventListener("DOMContentLoaded", () => {

  // Get the alerts panel.
  const alerts_panel = document.getElementById("alerts_popover");

  // Add event listeners to the popover.
  alerts_panel.addEventListener("toggle", handle_alerts_open);

});


async function handle_alerts_open(event) {

  const alert_list = document.getElementById("alert_list");

  // Determine if the user is opening the alert panel.
  if (event.newState === "open") {

    // Request all of the user's invites.
    let request = await fetch("http://localhost:8000/alerts/invites");
    let data = await request.json();

    // Iterate over the invites.
    data['invites'].forEach(invite => {
      
      let box = new InviteAlertBox(invite.id, invite.title);

      alert_list.append(box.build());

    });

  }

}