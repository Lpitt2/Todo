import { Task } from "./task.js";

export class UserSocket extends WebSocket {

  #user_token = null;

  // Activity constants.

  static CREATE = "CREATE";
  static UPDATE = "UPDATE";
  static DELETE = "DELETE";

  // Type constants.

  static TASK = "TASK";
  static GROUP = "GROUP";

  // Event Handlers

  #on_task_new = (task) => {};
  #on_task_edit = (task) => {};
  #on_task_delete = (task_id) => {};
  #on_group_new = (group_id, group_title) => {};
  #on_group_edit = (group_id, group_title) => {};
  #on_group_delete = (group_id) => {};
  #on_error = (status, message) => {};


  constructor(url, user_token) {

    // Set up the fields.
    super(url);
    this.#user_token = user_token;

    // Set the event handlers.
    this.addEventListener("open", this.#handle_init_connection);
    this.addEventListener("message", this.#handle_message);

  }


  /* Setters */


  set on_task_new(on_task_new) { this.#on_task_new = on_task_new; }
  set on_task_edit(on_task_edit) { this.#on_task_edit = on_task_edit; }
  set on_task_delete(on_task_delete) { this.#on_task_delete = on_task_delete; }
  set on_group_new(on_group_new) { this.#on_group_new = on_group_new; }
  set on_group_edit(on_group_edit) { this.#on_group_edit = on_group_edit; }
  set on_group_delete(on_group_delete) { this.#on_group_delete = on_group_delete; }
  set on_error(on_error) { this.#on_error = on_error; }


  /* Handles user requests to the web socket server. */


  request(activity, type, id) {

    this.send(JSON.stringify({
      'activity': activity,
      'type': type,
      'id': id
    }));
    
  }


  /* Web Socket Event Handlers. */

  
  #handle_init_connection = (event) => {

    this.send(JSON.stringify({
      'user-token': this.#user_token
    }));

  }

  #handle_message(message) {

    // Extract message information.
    const raw_message = JSON.parse(message['data']);

    // Determine if an error message was sent back.
    if (raw_message.hasOwnProperty('status'))
    {

      // Call the on-error callback.
      this.#on_error(raw_message['status'], raw_message['message']);

      return;

    }

    // Extract the activity and type.
    const data = raw_message['data'];
    const activity = raw_message['activity'];
    const type = raw_message['type'];

    // Determine the request type.
    if (type == "TASK") {

      // Determine the request.
      if (activity == "CREATE") {

        // Build the task object.
        const task = build_task_object_from_request(data);

        // Call the create task callback.
        this.#on_task_new(task);

      } else if (activity == "UPDATE") {

        // Build the task object.
        const task = build_task_object_from_request(data);

        // Call the edit task callback.
        this.#on_task_edit(task);

      } else if (activity == "DELETE") {

        // Call the delete task callback.
        this.#on_task_delete(data['id'])

      }

    } else if (type == "GROUP") {

      // Determine the request.
      if (activity == "CREATE") {

        // Call the group new callback.
        this.#on_group_new(data['id'], data['title']);

      } else if (activity == "UPDATE") {

        // Call the group edit callback.
        this.#on_group_edit(data['id'], data['title']);

      } else if (activity == "DELETE") {

        // Call the group delete callback.
        this.#on_group_delete(data['id']);

      }

    }

  }

};


function build_task_object_from_request(data) {

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