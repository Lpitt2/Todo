export class UserIcon {

  #username;
  #email_hash;
  #enabled;
  #source;

  #handle_close;

  constructor(username, email_hash) {
    this.#username = username;
    this.#email_hash = email_hash;
  }


  build() {

    // Create the elements.
    this.#source = document.createElement("img");

    // Set the image source.
    this.#source.src = `https://gravatar.com/avatar/${this.#email_hash}`;

    console.log(this.#email_hash);

    // Add styling to the element.
    this.#source.classList.add("user_icon");

    // Set the dataset attributes.
    this.#source.dataset['username'] = this.#username;
    this.#source.dataset["enabled"] = this.#enabled;

    // Add event handlers.
    this.#source.addEventListener("click", this._handle_user_click.bind(this));

    return this.#source;

  }


  get username() { return this.#username; }
  get email_hash() { return this.#email_hash; }
  get source() { return this.#source; }
  get enabled() { return this.#enabled; }

  set enabled(enabled) { this.#enabled = enabled; }
  set handle_close(handle_close) { this.#handle_close = handle_close; }


  _handle_user_click() {
    if (this.#enabled)
      this.#handle_close(this);
  }

};