document.addEventListener("DOMContentLoaded", () => {

    // Add event listener to the new common board dialog.
    document.getElementById("create-common-group-dialog").addEventListener("close", handle_new_common_board_close);
    document.getElementById("create-common-group-form").addEventListener("submit", handle_new_common_board_submission);

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

}





/* Leave common board button clicked. */


function handle_leave_common_board_click(event) {

}