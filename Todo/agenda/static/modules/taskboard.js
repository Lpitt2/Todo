import { Task } from "./task.js";


// Manages the groups and task blocks.
export class Taskboard {

  #taskboard = null;

  #on_task_new = () => {};
  #on_task_edit = () => {};
  #on_task_complete = () => {};
  #on_task_delete = () => {};
  #on_group_rename = () => {};
  #on_group_delete = () => {};

  constructor(taskboard) { this.#taskboard = taskboard; }

  get taskboard() { return this.#taskboard; }

  /* Event handlers. */

  set on_task_new(on_new_task) { this.#on_task_new = on_new_task; }
  set on_task_edit(on_edit_task) { this.#on_task_edit = on_edit_task; }
  set on_task_complete(on_task_complete) { this.#on_task_complete = on_task_complete; }
  set on_task_delete(on_task_delete) { this.#on_task_delete = on_task_delete; }
  set on_group_rename(on_group_rename) { this.#on_group_rename = on_group_rename; }
  set on_group_delete(on_group_delete) { this.#on_group_delete = on_group_delete; }

  /* Builder methods. */

  #build_group_box(group_id, group_title, tasks = []) {

    // Declare variables.
    const group_box = document.createElement("li");
    const header = document.createElement("div");
    const title = document.createElement("div");
    const button_group_bar = document.createElement("div");
    const new_task_button = document.createElement("button");
    const delete_group_button = document.createElement("button");
    const new_task_icon = document.createElement("img");
    const delete_group_icon = document.createElement("img");
    const task_list = document.createElement("ul");

    // Build the structure of the group box.
    new_task_button.append(new_task_icon);
    delete_group_button.append(delete_group_icon);
    button_group_bar.append(new_task_button);
    button_group_bar.append(delete_group_button);
    header.append(title);
    header.append(button_group_bar);
    group_box.append(header);
    group_box.append(task_list);

    // Set the group id data attribute.
    group_box.dataset['group'] = group_id;

    // Set up the group title.
    title.innerHTML = group_title;
    title.contentEditable = true;

    // Set the event handlers.
    new_task_button.addEventListener("click", this.#on_task_new);
    delete_group_button.addEventListener("click", this.#on_group_delete);
    title.addEventListener("focusout", this.#on_group_rename);

    // Set up the new task icon.
    new_task_icon.src = "static/icons/plus.svg";
    new_task_icon.width = 10;
    new_task_icon.height = 10;

    // Set up the delete group icon.
    delete_group_icon.src = "static/icons/delete.svg";
    delete_group_icon.width = 10;
    delete_group_icon.height = 10;

    // Apply CSS styling to the elements.
    group_box.classList.add("task-list-block");
    header.classList.add("left-right-container");
    button_group_bar.classList.add("right-container");
    new_task_button.classList.add("open-dialog-button");
    new_task_button.classList.add("button-accept");
    delete_group_button.classList.add("button-warning");
    task_list.classList.add("element-list");
    task_list.classList.add("task-list");
    button_group_bar.classList.add("button-group-row");

    // Construct the task block objects.
    tasks.forEach(task => {

      // Create the task block.
      const task_box = this.#build_task_box(task);

      // Append the task box to the list.
      task_list.append(task_box);

    });

    return group_box;

  }

  #build_task_box(task) {

    // Declare elements.
    const task_box = document.createElement("li");
    const completion_box = document.createElement("input");
    const task_title = document.createElement("span");
    const delete_container = document.createElement("div");
    const delete_icon = document.createElement("img");

    // Build the structure of the task block.
    delete_container.append(delete_icon);
    task_box.append(completion_box);
    task_box.append(task_title);
    task_box.append(delete_container);

    // Set up the delete icon information.
    delete_icon.src = "/static/icons/delete.svg";
    delete_icon.width = 10;
    delete_icon.height = 10;

    // Add the event handlers.
    completion_box.addEventListener("click", this.#on_task_complete);
    task_box.addEventListener("click", this.#on_task_edit);
    delete_icon.addEventListener("click", this.#on_task_delete);

    // Apply CSS styling.
    delete_container.className = "hover-icon";
    style_task_block(task_box, task);

    // Set up the completition checkbox.
    completion_box.type = "checkbox";

    // Set the title of the task block.
    task_title.textContent = task.title;

    // Set the task ID.
    task_box.dataset['task'] = task.id;
    task_box.id = `task-${task.id}`;

    return task_box;

  }

  /* Task methods. */

  add_task(task) {

    // Find the group for the task.
    const group_box = this.#taskboard.querySelector(`[data-group="${task.group}"]`).querySelector("ul");

    // Build the task box.
    const task_box = this.#build_task_box(task);

    // Append the task box to the group box.
    group_box.append(task_box);

  }

  update_task(task) {

    // Get the task object.
    const task_box = this.#taskboard.querySelector(`[data-task="${task.id}"]`);

    // Determine if the group has changed.
    if (task_box.parentElement.parentElement.dataset['group'] != task.group) {

      // Remove the task from the current group.
      task_box.remove();

      // Add the task to the proper group.
      this.add_task(task);

    } else {

      // Update the title to the new task.
      task_box.querySelector("span").innerHTML = task.title;

      // Update the completion status.
      style_task_block(task_box, task);

    }

  }

  delete_task(task) {

    // Get the task box.
    const task_box = this.#taskboard.querySelector(`[data-task="${task.id}"]`);

    // Remove the task box from the taskboard.
    task_box.remove();

  }

  /* Group methods. */

  add_group(group_id, title, tasks = []) {

    // Create the group box.
    const group_box = this.#build_group_box(group_id, title, tasks);

    // Set the order.
    group_box.style.setProperty("order", group_id);

    // Append the group box to the task board.
    this.#taskboard.append(group_box);

  } 

  update_group(group_id, title) {

    // Get the group box.
    const group_box = this.#taskboard.querySelector(`[data-group="${group_id}"]`);

    // Get the title container.
    const title_box = group_box.querySelector("div").querySelector("div");

    // Update the title.
    title_box.textContent = title;

  }

  delete_group(group_id) {

    // Get the group box.
    const group_box = this.#taskboard.querySelector(`[data-group="${group_id}"]`);

    // Remove the group box from the taskboard.
    group_box.remove();

  }

};



// Applys conditional styling to a task block given the completion status and due-date.
export function style_task_block(task_block, task) {

  // Declare variables.
  let today = new Date();

  // Normalize today month.
  today.setMonth(today.getMonth() + 1);

  // Ensure that the checkbox is inactive.
  task_block.querySelector("input").checked = false;

  // Determine if the task block is completed.
  if (task.completed) {

    task_block.className = "completed-task";

    task_block.querySelector("input").checked = true;

  } else if ((task.due_date == null) || (today.getFullYear() < task.due_date.getFullYear()) || (today.getFullYear() == task.due_date.getFullYear() && today.getMonth() < task.due_date.getMonth()) || (today.getFullYear() == task.due_date.getFullYear() && today.getMonth() == task.due_date.getMonth() && today.getDate() < task.due_date.getDate())) {

    task_block.className = "future-task";

  } else if ((today.getDate() == task.due_date.getDate()) && (today.getMonth() == task.due_date.getMonth()) && (today.getFullYear() == task.due_date.getFullYear())) {

    task_block.className = "due-today-task";

  } else {

    task_block.className = "late-task";

  }

}