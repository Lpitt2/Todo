import { build_task_from_json } from "./task.js";

export class ISocket extends WebSocket {

  // Activity constants.

  static CREATE = "CREATE";
  static UPDATE = "UPDATE";
  static DELETE = "DELETE";

  // Type constants.

  static TASK = "TASK";
  static GROUP = "GROUP";

  // Event Handlers

  #on_task_new;
  #on_task_edit;
  #on_task_delete;
  #on_group_new;
  #on_group_edit;
  #on_group_delete;
  #on_error;

  _user_token;

  constructor(url, user_token) {

    super(url);

    this._user_token = user_token;

    // Set the "handle message" method to the web socket.
    this.addEventListener("message", this._handle_message);

  }





  /* Accessor Methods. */


  set on_task_new(on_task_new) { this.#on_task_new = on_task_new; }
  set on_task_edit(on_task_edit) { this.#on_task_edit = on_task_edit; }
  set on_task_delete(on_task_delete) { this.#on_task_delete = on_task_delete; }
  set on_group_new(on_group_new) { this.#on_group_new = on_group_new; }
  set on_group_edit(on_group_edit) { this.#on_group_edit = on_group_edit; }
  set on_group_delete(on_group_delete) { this.#on_group_delete = on_group_delete; }
  set on_error(on_error) { this.#on_error = on_error; }

  get on_task_new() { return this.#on_task_new; }
  get on_task_edit() { return this.#on_task_edit; }
  get on_task_delete() { return this.#on_task_delete; }
  get on_group_new() { return this.#on_group_new; }
  get on_group_edit() { return this.#on_group_edit; }
  get on_group_delete() { return this.#on_group_delete; }
  get on_error() { return this.#on_error; }

  get user_token() { return this._user_token; }


  


  /* Handles user requests to the web socket server. */


  request(activity, type, id) {

    this.send(JSON.stringify({
      'activity': activity,
      'type': type,
      'id': id
    }));
    
  }





  /* Web Socket Event Handlers. */


  _handle_message(message) {

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
    if (type === "TASK") {

      // Determine the request.
      if (activity === "CREATE") {

        // Build the task object.
        const task = build_task_from_json(data);

        // Call the create task callback.
        this.#on_task_new(task);

      } else if (activity === "UPDATE") {

        // Build the task object.
        const task = build_task_from_json(data);

        // Call the edit task callback.
        this.#on_task_edit(task);

      } else if (activity === "DELETE") {

        // Call the delete task callback.
        this.#on_task_delete(data['id'])

      }

    } else if (type === "GROUP") {

      // Determine the request.
      if (activity === "CREATE") {

        // Call the group new callback.
        this.#on_group_new(data['id'], data['title']);

      } else if (activity === "UPDATE") {

        // Call the group edit callback.
        this.#on_group_edit(data['id'], data['title']);

      } else if (activity === "DELETE") {

        // Call the group delete callback.
        this.#on_group_delete(data['id']);

      }

    }

  }

};

export class UserSocket extends ISocket {

  constructor(url, user_token) {

    // Set up the fields.
    super(url, user_token);

    // Set the event handlers.
    this.addEventListener("open", this.#handle_init_connection);

  }





  /* Web Socket Event Handlers. */

  
  #handle_init_connection(event) {

    this.send(JSON.stringify({
      'user-token': this._user_token
    }));

  }

};

export class CommonSocket extends ISocket {

  #common_id = null;

  constructor(url, user_token, common_id) {

    super(url, user_token);

    this.#common_id = common_id;

    // Set the event handlers.
    this.addEventListener("open", this.#handle_init_connection);

  }





  /* Web Socket Event Handlers. */


  #handle_init_connection(event) {

    this.send(JSON.stringify({
      'user-token': this._user_token,
      'id': this.#common_id
    }));

  }

};