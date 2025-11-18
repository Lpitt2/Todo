/*
  This file contains the logical structure for taskboards.

  Content:
   - Taskboard:             Manages the groups and task blocks.
   - style_task_block:      Applys conditional styling to a task block given the completion status and due-date.
*/

const _view_description = await cookieStore.get({name: "view-description"}).value;
const _view_due_date = await cookieStore.get({name: "view-due-date"}).value;

// Manages the groups and task blocks.
export class Taskboard {

  #taskboard = null;

  #on_task_new = () => {};
  #on_task_edit = (task_block) => {};
  #on_task_complete = (task_block) => {};
  #on_task_delete = (task_block) => {};
  #on_group_rename = () => {};
  #on_group_delete = () => {};

  #task_blocks = [];

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
    new_task_icon.src = "http://localhost:8000/static/icons/plus.svg";
    new_task_icon.width = 10;
    new_task_icon.height = 10;

    // Set up the delete group icon.
    delete_group_icon.src = "http://localhost:8000/static/icons/delete.svg";
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
      const task_block = new TaskBlock(task);

      task_block.on_edit_click = this.#on_task_edit;
      task_block.on_complete_click = this.#on_task_complete;
      task_block.on_delete_click = this.#on_task_delete;

      // Add the task block to the group block.
      task_list.append(task_block.build());

      // Append the task box to the list.
      task_list.push(task_box);

    });

    return group_box;

  }

  /* Task methods. */

  add_task(task) {

    // Find the group for the task.
    const group_box = this.#taskboard.querySelector(`[data-group="${task.group}"]`).querySelector("ul");

    // Create a new task Object.
    const task_block = new TaskBlock(task);

    // Set the event handlers.
    task_block.on_edit_click = this.#on_task_edit;
    task_block.on_complete_click = this.#on_task_complete;
    task_block.on_delete_click = this.#on_task_delete;

    // Append the task box to the group box.
    group_box.append(task_block.build());

    // Append the task block to the array.
    this.#task_blocks.push(task_block);

  }

  update_task(task) {

    // Find the appropriate task block object.
    this.#task_blocks.forEach(block => {

      // Determine if the current block has the same id.
      if (block.task.id === task.id) {

        // Update the task group if necessary.
        if (block.task.group !== task.group) {

          // Remove the task block from its current group box.
          block.source.remove();

          // Find the group box.
          const group_box = this.#taskboard.querySelector(`[data-group="${task.group}"]`).querySelector("ul");

          // Set the updated task information to the task block.
          block.task = task;

          // Add the block to the new group box.
          group_box.append(block.build());

        } else {

          // Update the task block.
          block.update(task);

        }

      }

    });

  }

  delete_task(task) {

    // Find the task block.
    this.#task_blocks.forEach(block => {

      // Determine if the current task is the one to be deleted.
      if (task.id === block.task.id) {

        // Remove the task box from the taskboard.
        block.source.remove();

        // Remove the task block from the list.
        this.#task_blocks.splice(this.#task_blocks.indexOf(block), 1);

      }

    });

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



class TaskBlock {

  #task;

  // Event handlers.

  #on_complete_click = (task_block, complete) => {};
  #on_edit_click = async (task_block) => {};
  #on_delete_click = (task_block) => {};

  // UI elements.

  #source;
  #task_title;
  #description = null;
  #due_date = null;
  

  constructor(task) { this.#task = task; }

  get task() { return this.#task; }
  get source() { return this.#source; }

  set task(task) { this.#task = task; }
  set on_complete_click(on_complete_click) { this.#on_complete_click = on_complete_click; }
  set on_edit_click(on_edit_click) { this.#on_edit_click = on_edit_click; }
  set on_delete_click(on_delete_click) { this.#on_delete_click = on_delete_click; }


  handle_complete_click(event) {

    // Get the completion status.
    const complete = event.currentTarget.checked;

    // this.#on_complete_click(this, complete);

    // Prevent the edit dialog from displaying.
    event.stopPropagation();

  }

  handle_delete_click(event) {

    this.#on_delete_click(this);

    // Prevent the edit dialog from displaying.
    event.stopPropagation();

  }

  async handle_edit_click(event) {

    await this.#on_edit_click(this);

  }


  build() {

    // Create the objects.
    this.#source = document.createElement("li");
    const header_box = document.createElement("div");
    const completion_box = document.createElement("input");
    this.#task_title = document.createElement("span");
    const delete_container = document.createElement("div");
    const delete_icon = document.createElement("img");

    // Build the structure of the task block.
    delete_container.append(delete_icon);
    header_box.append(completion_box);
    header_box.append(this.#task_title);
    header_box.append(delete_container);
    this.#source.append(header_box);

    // Create the description if necessary.
    if (_view_description === "true") {

      // Create the description block.
      this.#description = document.createElement("div");

      // Set the content of the description block.
      this.#description.textContent = this.#task.description;

      // Append the description block to the task block.
      this.#source.append(this.#description);

    }

    // Create the due date if necessary.
    if (_view_due_date === "true") {

      // Create the due date block.
      this.#due_date = document.createElement("div");

      // Set the content of the due date block.
      this.#due_date = `Due-Date: ${this.#task.getMonth()}/${this.#task.getDate()}/${this.#task.due_date.getFullYear()}`;

      // Append the due date block to the task block.
      this.#source.append(this.#due_date);

    }
 
    // Set up the delete icon information.
    delete_icon.src = "/static/icons/delete.svg";
    delete_icon.width = 10;
    delete_icon.height = 10;

    // Add the event handlers.
    completion_box.addEventListener("click", this.handle_complete_click.bind(this));
    this.#source.addEventListener("click", this.handle_edit_click.bind(this));
    delete_icon.addEventListener("click", this.handle_delete_click.bind(this));

    // Apply CSS styling.
    delete_container.className = "hover-icon";
    style_task_block(this.#source, this.#task);

    // Set up the completition checkbox.
    completion_box.type = "checkbox";

    // Set the title of the task block.
    this.#task_title.textContent = this.#task.title;

    return this.#source;

  }

  update(updated_task) {

    // Update the title.
    this.#task_title.textContent = updated_task.title;

    // Update the description if necessary.
    if (this.#description !== null) {

      this.#description.innerText = updated_task.description;

    }

    // Update the due date if necessary.
    if (this.#due_date !== null) {

      this.#due_date.innerText = `Due-Date: ${updated_task.due_date.getMonth()}/${updated_task.due_date.getDate()}/${updated_task.due_date.getFullYear()}`;

    }

    // Update the stored task object.
    this.#task = updated_task;

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