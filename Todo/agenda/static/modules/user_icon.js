class UserIcon {

  #username;
  #email_hash;
  #source;

  #handle_close;

  UserIcon(username, email_hash) {
    this.#username = username;
    this.#email_hash = email_hash;
  }


  build() {

    // Create the elements.
    this.#source = document.createElement("img");

    // Set the image source.
    this.#source = `https://gravatar.com/avatar/${this.#email_hash}`;

    // Add styling logic to the element.
    this.#source.classList.add("user_icon");

    // Add event handlers.
    this.#source.addEventListener("click", this._handle_user_click.bind(this));

    return this.#source;

  }


  get username() { return this.#username; }
  get email_hash() { return this.#email_hash; }
  get source() { return this.#source; }

  set handle_close(handle_close) { this.#handle_close = handle_close; }


  _handle_user_click() {
    this.#handle_close(this);
  }

};