const connection = new WebSocket("ws://localhost:8000/sockets/user");


document.addEventListener("DOMContentLoaded", () => {

  // Setup the websocket event handlers.
  connection.addEventListener("message", handle_socket_update);

  // Send the user token to the socket.
  connection.addEventListener("open", () => {

    // Get the token.
    token = document.getElementById("user_token").value;

    // Send the token.
    connection.send(JSON.stringify({
      'user-token': token
    }));

  });

  // Render the taskboard.
  render();

});



function handle_group_title_change() {



}

function change_state_of_task_block(block, state) {

  // Get the title block.
  const title_block = block.querySelector("span");
  const check_box = block.querySelector("input");

  // Style based on the state of the block.
  if (state)
    title_block.style.setProperty("text-decoration", "line-through");
  else
    title_block.style.setProperty("text-decoration", "none");

  // Ensure the ckeckbox style.
  check_box.checked = state;

}

function handle_task_complete_clicked(event) {

  // Declare variables.
  const task_block = event.target.parentElement;

  let completed = event.target.checked;

  // Determine if the task is checked off.
  change_state_of_task_block(task_block, completed);

  // Send the update information to the server.
  fetch(`http://localhost:8000/task/edit/${task_block.dataset['task']}`, {
    'method': 'PUT',
    'body': JSON.stringify({
      'complete': completed
    })
  });

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
      const task_title = document.createElement("span");

      // Set the value of task_title.
      task_title.textContent = task['title'];

      // Build the task block.
      task_box.append(completion_box);
      task_box.append(task_title);

      // Style the elements.
      task_box.classList.add("task-block");
      completion_box.type = "checkbox";
      change_state_of_task_block(task_box, task['completed']);

      // Add event handler.
      completion_box.addEventListener("click", handle_task_complete_clicked);

      // Set the id for the task.
      task_box.dataset['task'] = task['id'];

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

function handle_socket_update(message) {

  console.log(message);

}