// Represents a task.
export class Task {

  #id;
  #title = "";
  #description = "";
  #due_date = null;
  #completed = false;
  #group = null;

  constructor(id) { this.#id = id; }

  set title(title) { this.#title = title; }
  set description(description) { this.#description = description; }
  set due_date(due_date) { this.#due_date = due_date; }
  set completed(completed) { this.#completed = completed; }
  set group(group) { this.#group = group; }


  get id() { return this.#id; }
  get title() { return this.#title; }
  get description() { return this.#description; }
  get due_date() { return this.#due_date; }
  get completed() { return this.#completed; }
  get group() { return this.#group; }

};

export function build_task_from_json(data) {

  // Declare task object.
  const task = new Task(data['id']);
  let due_date = null;

  // Create the due date object.
  if (data['due_date'] != null) {

    due_date = new Date(data['due_date']['year'], data['due_date']['month'], data['due_date']['day']);

  }

  // Load the task information into the task object.
  task.title = data['title'];
  task.description = data['description'];
  task.group = data['group'];
  task.completed = data['complete'];
  task.due_date = due_date;

  return task;

}