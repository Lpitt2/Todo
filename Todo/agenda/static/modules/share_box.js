import { UserIcon } from "./user_icon.js";

/* Event handlers. */

export async function handle_keydown_event_share_names_field(event) {

  // Get the list of emails.
  const shared_usernames_list = event.currentTarget.parentElement.querySelector("ul");

  // Get the list of emails.
  const users = convert_shared_usernames_to_list(shared_usernames_list, false);

  // Get the names field.
  const name_field = event.currentTarget;

  // Determine if the key being pressed was the return (enter) key.
  if (event.key === "Enter") {

    // Prevent the form from submitting.
    event.preventDefault();

    // Get the current email entered by the user.
    const email = name_field.value;

    // Ensure that the email is not empty.
    if (email !== "") {

      // Verify that the email does not already exist within the list.
      if (!users.includes(email)) {

        // Build the email block.
        const block = await build_user_block(email);

        // Append the block to the list.
        shared_usernames_list.append(block);

        // Clear the content of the names field.
        name_field.value = "";

      }

    }

  }

}


function delete_email_block_click(icon) {

  // Get the source.
  let source = icon.source;

  // Remove the icon.
  source.remove();

}





/* Utility functions */


export function convert_shared_usernames_to_list(shared_elements_list, remove_ignored_users = true) {

  // Declare local variables.
  const emails = [];

  // Iterate over each element within the shared email list.
  shared_elements_list.querySelectorAll(".user_icon").forEach(email_block => {
    if (!remove_ignored_users || (email_block.dataset['enabled'] === "true"))
    emails.push(email_block.dataset['username']);
  })

  return emails;

}


export async function preset_share_list(shared_usernames_list, users) {

  // Get the email list object.
  const usernames_list = document.getElementById(shared_usernames_list);

  // Remove all elements from the shared list.
  usernames_list.innerHTML = "";

  // Add each email to the list.
  users.forEach(async function (user) {

    let block = await build_user_block(user, true);

    // Add the user to the block.
    usernames_list.append(block);

  });
    
}


async function build_user_block(username, ignore = false) {

  // Declare elements.
  let user_icon = null;

  // Attempt to get the email hash.
  let response = await fetch ("http://localhost:8000/user/icon", {
    method: "PUT",
    body: JSON.stringify({
      username: username
    })
  });
  let data = await response.json();  
    
  // Build the user icon.
  user_icon = new UserIcon(username, data['hash']);

  // Set the enable attribute of the icon.
  user_icon.enabled = !ignore;

  // Add the event handler to the delete button.
  user_icon.handle_close = delete_email_block_click;

  // Return the block.
  return user_icon.build();

}
