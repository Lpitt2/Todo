/*
  This file contains the AlertBox class implementations.

  Contents:
   - AlertBox:            Genaric base class representing an alert box appearing in the alert container.
   - InviteAlertBox:      Variation of AlertBox intendend to invites.
   - OverdueAlertBox:     Variation of AlertBox intended to display overdue tasks.
*/

// Genaric base class representing an alert box appearing in the alert container.
class AlertBox {

  #id;
  #title;
  #description;
  #type;
  #source;

  constructor(id, title, description, type) {
    this.#id = id;
    this.#title = title;
    this.#description = description;
    this.#type = type;
  }

  get id() { return this.#id; }
  get title() { return this.#title; }
  get description() { return this.#description; }
  get type() { return this.#type; }
  get source() { return this.#source; }

  async dismiss() {

    // Add the task id to the local storage.
    localStorage.setItem(`task-${this.#id}`, true);

    // Delete the alert box.
    this.#source.remove();

  }

  build() {

    // Create the alert box.
    this.#source = document.createElement("div");

    // Create the sub elements.
    const header = document.createElement("div");
    const close_button = document.createElement("button");
    const close_icon = document.createElement("img");
    const title_block = document.createElement("h4");
    const description_block = document.createElement("p");

    // Structure the alert box.
    header.append(title_block);
    close_button.append(close_icon);
    header.append(close_button);
    this.#source.append(header);
    this.#source.append(description_block);

    // Fill in the information.
    title_block.innerText = this.#title;
    description_block.innerText = this.#description;

    // Apply stlying to elements.
    this.#source.classList = [ "alert-box" ];
    header.classList = [ "left-right-container" ];
    close_button.classList = [ "hidden-button right-container" ];

    // Set up the close icon.
    close_icon.src = "http://localhost:8000/static/icons/delete.svg";
    close_icon.width = 20;

    // Add event handlers.
    close_button.addEventListener("click", this.dismiss.bind(this));

    return this.#source;

  }

};


// Variation of AlertBox intendend to invites.
export class InviteAlertBox extends AlertBox {

  constructor(id, title) { super(id, title, `You have been invited to ${title} group.`, "INVITE"); }


  async dismiss() {

    super.dismiss();

    // Make request to server to dismiss the alert.
    await fetch(`http://localhost:8000/alerts/invite/dismiss`, {
        method: "PUT",
        body: JSON.stringify({
          'id': this.id
        })
      }
    );

  }

  async accept() {

    // Make the request to the server.
    fetch("http://localhost:8000/alerts/invite/accept",
      {
        method: "PUT",
        body: JSON.stringify({
          'id': super.id
        })
      }
    );

    // Remove the alert box from the window.
    super.source.remove();

  }


  build() {

    // Build the base alert box.
    let source = super.build();

    // Create the elements.
    const button_container = document.createElement("div");
    const accept_button = document.createElement("button");
    const decline_button = document.createElement("button");

    // Add the elements to the alert box.
    button_container.append(accept_button);
    button_container.append(decline_button);
    source.append(button_container);

    // Set the styling for the buttons.
    button_container.classList = [ "alert-box-button-group" ];
    accept_button.classList = [ "button-accept" ];
    decline_button.classList = [ "button-warning" ];

    // Set the text content of the buttons.
    accept_button.innerText = "Accept";
    decline_button.innerText = "Decline";

    // Set the event handlers for the buttons.
    accept_button.addEventListener("click", this.accept.bind(this));
    decline_button.addEventListener("click", this.dismiss.bind(this));

    return source;

  }

};


// Variation of AlertBox intended to display overdue tasks.
export class OverdueAlertBox extends AlertBox {

  constructor(id, title, description) { super(id, title, description, "OVERDUE"); }

};
