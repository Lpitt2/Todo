import * as shared_box from "../modules/share_box.js";

document.addEventListener("DOMContentLoaded", () => {

    // Add event listeners to the new common board dialog.
    document.getElementById("create-common-group-dialog").addEventListener("close", handle_new_common_board_close);
    document.getElementById("create-common-group-form").addEventListener("submit", handle_new_common_board_submission);

    // Add event listners to the new common board elements.
    document.getElementById("share_name_field").addEventListener("keydown", shared_box.handle_keydown_event_share_names_field);

});





/* New Common Taskboard event handlers. */


function handle_new_common_board_close() {

    // Clear the title field.
    document.getElementById("common_group_name_field").value = "";

}


function handle_new_common_board_submission(event) {

    // Get the dialog.
    const dialog_container = document.getElementById("create-common-group-dialog");

    // Get the name of the group.
    const title = document.getElementById("common_group_name_field").value;

    // Get the list of users.
    const emails = shared_box.convert_shared_usernames_to_list(document.getElementById("share_users_list"));

    // Send the creation request.
    fetch("http://localhost:8000/shared/new", {
        method: "PUT",
        body: JSON.stringify({
            title: title,
            users: emails
        })
    }).then(response => response.json())
    .then(data => {

        // Determine if the process was successful.
        if (data.hasOwnProperty("id")) {

            // Create the new common board button.
            const common_board_button = create_new_community_board_button(title, data['id']);

            // Add the button to the list.
            document.getElementById("common_board_list").append(common_board_button);

        }

    });

    // Prevent the form from reloading the page.
    event.preventDefault();

    // Close the dialog container.
    dialog_container.close();

}





/* Utilities. */


function create_new_community_board_button(title, id) {

    // Create the necessary elements.
    const list_item_container = document.createElement("li");
    const link = document.createElement("a");
    const link_button = document.createElement("button");

    // Create the structure.
    link.append(link_button);
    list_item_container.append(link);

    // Set the title of the link button.
    link_button.textContent = title;

    // Set up the styling for the elements.
    link_button.className = "button-secondary stretch";

    // Set the address of the link.
    link.href = `/shared/${id}`;

    // Set the dataset attribute.
    list_item_container.dataset['commonboard'] = id;

    return list_item_container;

}