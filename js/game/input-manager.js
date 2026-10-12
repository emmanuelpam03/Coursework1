// Reads keyboard input and turns keys into game actions.
export class InputManager {
  // Set the default controls and keyboard listeners.
  constructor(target = window) {
    this.keys = new Set();
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
    this.handleKeyDown = (event) => {
      const key = event.key.toLowerCase();
      if (key === this.bindings.fire || key === "spacebar") {
        event.preventDefault();
        if (this.onFire) this.onFire();
        return;
      }
      this.keys.add(key);
      if (key === this.bindings.pause || event.key === "Escape") {
        if (this.onPause) this.onPause();
      }
    };
    this.handleKeyUp = (event) => {
      this.keys.delete(event.key.toLowerCase());
    };
    target.addEventListener("keydown", this.handleKeyDown);
    target.addEventListener("keyup", this.handleKeyUp);
  }

  // Check whether an action key is being held.
  isDown(action) {
    const key = this.bindings[action];
    const arrowKeys = {
      up: "arrowup",
      down: "arrowdown",
      left: "arrowleft",
      right: "arrowright",
    };
    return this.keys.has(key) || this.keys.has(arrowKeys[action]);
  }

  // Change one control binding.
  setBinding(action, key) {
    if (this.bindings[action]) this.bindings[action] = key.toLowerCase();
  }

  // Remove listeners when the game is closed.
  destroy() {
    this.target.removeEventListener("keydown", this.handleKeyDown);
    this.target.removeEventListener("keyup", this.handleKeyUp);
  }
}
