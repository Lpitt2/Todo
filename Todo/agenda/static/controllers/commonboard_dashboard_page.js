import * as shared_box from "../modules/share_box.js";

document.addEventListener("DOMContentLoaded", () => {

    // Add event listeners to the new common board dialog.
    document.getElementById("create-common-group-dialog").addEventListener("close", handle_new_common_board_close);
    document.getElementById("create-common-group-form").addEventListener("submit", handle_new_common_board_submission);

    // Add event listners to the new common board elements.
    document.getElementById("share_name_field").addEventListener("keydown", shared_box.handle_keydown_event_share_names_field);

    // Add the event handlers to the leave common board buttons.
    document.querySelectorAll(".common-board-leave-button").forEach(button => {
        button.addEventListener("click", handle_leave_common_board_click);
    })

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
    const emails = shared_box.convert_shared_emails_to_list(document.getElementById("share_users_list"));

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





/* Leave common board button clicked. */


async function handle_leave_common_board_click(event) {

    // Prompt the user to confirm their action.
    if (window.confirm("Are you sure you want to leave this common board?")) {

        // Get the host element.
        const host = event.currentTarget.parentElement.parentElement;

        // Get the common board id.
        const id = host.dataset['commonboard'];

        // Remove the current user from the common board.
        await fetch(`http://localhost:8000/shared/edit/${id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    'remove-self': null
                })
        });

        // Remove the common group button from the list.
        host.remove();

    }

}





/* Utilities. */


function create_new_community_board_button(title, id) {

    // Create the necessary elements.
    const list_item_container = document.createElement("li");
    const button_group = document.createElement("span");
    const link = document.createElement("a");
    const link_button = document.createElement("button");
    const leave_button = document.createElement("button");
    const leave_icon = document.createElement("img");

    // Create the structure.
    leave_button.append(leave_icon);
    link.append(link_button);
    button_group.append(link);
    button_group.append(leave_button);
    list_item_container.append(button_group);

    // Setup the leave icon image.
    leave_icon.src = "/static/icons/delete.svg";
    leave_icon.width = 10;
    leave_icon.height = 10;

    // Set the title of the link button.
    link_button.textContent = title;

    // Set up the styling for the elements.
    button_group.className = "button-group-row";
    link_button.className = "button-secondary stretch";
    leave_button.className = "button-warning";

    // Set the click event handler of the leave button.
    leave_button.addEventListener("click", handle_leave_common_board_click);

    // Set the address of the link.
    link.href = `/shared/${id}`;

    // Set the dataset attribute.
    list_item_container.dataset['commonboard'] = id;

    return list_item_container;

}