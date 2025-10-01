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
