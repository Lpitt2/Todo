document.addEventListener("DOMContentLoaded", () => {

  // Declare variables.
  const taskboard = document.getElementById("taskboard");
  const connection = new WebSocket("ws://localhost:8000/sockets/user");
  const token = document.getElementById("user_token").value;

  // Render the taskboard.
  render();

});



function handle_group_title_change() {



}

function handle_task_complete_clicked() {



}

// Constructs the group list boxes given the title and ID.
function build_group_list(group_id) {

  // Declare variables.
  const group_box = document.createElement("li");
  const header = document.createElement("div");
  const title = document.createElement("div");
  const task_list = document.createElement("ul");
  const new_task_button = document.createElement("button");
  const icon = document.createElement("img");
  let tasks = [];


  // Get the group information from the server.
  fetch(`http://localhost:8000/group/info/${group_id}`)
  .then(response => response.json())
  .then(data => {
    
    // Set the title element.
    title.innerHTML = data['title'];

    // Iterate over the tasks within the group.
    data['tasks'].forEach(task => {
      
      // Create the elements.
      const task_box = document.createElement("li");
      const completion_box = document.createElement("input");

      // Style the elements.
      task_box.classList.add("task-block");
      completion_box.type = "checkbox";

      // Build the task block.
      task_box.append(completion_box);
      task_box.append(task['title']);

      // Append the task box to the task list.
      task_list.append(task_box);

    });

  });


  // Set up the styling for the elements.
  group_box.classList.add("task-list-block");
  header.classList.add("left-right-container");
  new_task_button.classList.add("right-container");
  new_task_button.classList.add("open-dialog-button");
  new_task_button.classList.add("button-accept");
  task_list.classList.add("element-list");

  // Set up the icon for the new task button.
  icon.src = "static/icons/plus.svg";
  icon.width = 10;
  icon.height = 10;

  // Set up the title.
  title.contentEditable = true;

  // Build the structure of the group block.
  group_box.append(header);
  header.append(title);
  new_task_button.append(icon);
  header.append(new_task_button);
  group_box.append(task_list);

  // Add group box to the taskboard.
  document.querySelector(".taskboard").append(group_box);

}

function render() {

  // Declare variables.
  const taskboard = document.querySelector(".taskboard");

  // Remove the existing elements from the taskboard.
  taskboard.childNodes.forEach(node => taskboard.removeChild(node));

  // Retrieve the group information from the server.
  fetch("http://localhost:8000/user/groups")
  .then(resp => resp.json())
  .then(data => {

    // Iterate over the groups.
    data['groups'].forEach(group => {

      // Build the current group.
      build_group_list(group['id']);

    });

  });

}

function handle_socket_update() {



}