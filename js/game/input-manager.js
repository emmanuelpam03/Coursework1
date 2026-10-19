// Reads keyboard input and turns keys into game actions.
export class InputManager {
  // Set the default controls and keyboard listeners.
  constructor(target = window) {
    this.keys = {};
    this.bindings = {
      up: "w",
      down: "s",
      left: "a",
      right: "d",
      fire: " ",
      pause: "p",
    };
    this.target = target;
    this.onFire = null;
    this.onPause = null;

    // Save the bound methods so the same functions can be removed in destroy().
    this.boundKeyDown = this.handleKeyDown.bind(this);
    this.boundKeyUp = this.handleKeyUp.bind(this);

    target.addEventListener("keydown", this.boundKeyDown);
    target.addEventListener("keyup", this.boundKeyUp);
  }

  handleKeyDown(event) {
    const key = event.key.toLowerCase();

    if (key === this.bindings.fire || key === "spacebar") {
      event.preventDefault();
      if (this.onFire) this.onFire();
      return;
    }

    this.keys[key] = true;
    if (key === this.bindings.pause || event.key === "Escape") {
      if (this.onPause) this.onPause();
    }
  }

  handleKeyUp(event) {
    delete this.keys[event.key.toLowerCase()];
  }

  // Check whether an action key is being held.
  isDown(action) {
    const key = this.bindings[action];
    if (this.keys[key]) return true;

    if (action === "up" && this.keys.arrowup) return true;
    if (action === "down" && this.keys.arrowdown) return true;
    if (action === "left" && this.keys.arrowleft) return true;
    if (action === "right" && this.keys.arrowright) return true;

    return false;
  }

  // Change one control binding.
  setBinding(action, key) {
    if (this.bindings[action]) this.bindings[action] = key.toLowerCase();
  }

  // Remove listeners when the game is closed.
  destroy() {
    this.target.removeEventListener("keydown", this.boundKeyDown);
    this.target.removeEventListener("keyup", this.boundKeyUp);
  }
}
