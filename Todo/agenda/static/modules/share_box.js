import { UserIcon } from "./user_icon.js";

/* Event handlers. */

export function handle_keydown_event_share_names_field(event) {

    // Get the list of emails.
    const shared_usernames_list = event.currentTarget.parentElement.querySelector("ul");

    // Get the list of emails.
    const users = convert_shared_usernames_to_list(shared_usernames_list, false);

    // Get the names field.
    const name_field = event.currentTarget;

    // Determine if the key being pressed was the return (enter) key.
    if (event.key === "Enter") {

        // Get the current email entered by the user.
        const email = name_field.value;

        // Ensure that the email is not empty.
        if (email !== "") {

            // Verify that the email does not already exist within the list.
            if (!users.includes(email)) {

                // Build the email block.
                const block = build_user_block(email);

                // Append the block to the list.
                shared_usernames_list.append(block);

                // Clear the content of the names field.
                name_field.value = "";

            }

        }

        // Prevent the form from submitting.
        event.preventDefault();

    }

}


function delete_email_block_click(event) {

    // Get the email block.
    const block = event.currentTarget.parentElement;

    // Delete the email block.
    block.remove();

}





/* Utility functions */


export function convert_shared_usernames_to_list(shared_elements_list, remove_ignored_users = true) {

    // Declare local variables.
    const emails = [];

    // Iterate over each element within the shared email list.
    shared_elements_list.querySelectorAll("li").forEach(email_block => {
        if (!remove_ignored_users || (email_block.dataset['ignore'] === "false"))
        emails.push(email_block.querySelector("span").innerHTML);
    })

    return emails;

}


export function preset_email_list(shared_usernames_list, users) {

    // Get the email list object.
    const usernames_list = document.getElementById(shared_usernames_list);

    // Add each email to the list.
    users.forEach(user => {

        // Add the user to the block.
        usernames_list.append(build_user_block(user, true));

    });
    
}


function build_user_block(user, ignore = false) {

    // Declare elements.
    const block = document.createElement("li");
    const title_block = document.createElement("span");
    const delete_button = document.createElement("img");

    // Build the structure of the block.
    block.append(title_block);
    block.append(delete_button);

    // Apply styling to the block elements.
    block.className = "left-right-container";
    delete_button.className = "right-container";

    // Set up the delete button.
    delete_button.src = "/static/icons/delete.svg";
    delete_button.width = 10;
    delete_button.height = 10;

    // Set the email value of the user.
    title_block.innerHTML = user;

    // Set the data attribute.
    block.dataset['ignore'] = ignore;

    // Add the event handler to the delete button.
    delete_button.addEventListener("click", delete_email_block_click);

    // Return the block.
    return block;

}
