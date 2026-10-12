// Stores the main running and paused state of the game.
export class Game {
  // The game starts stopped.
  constructor() {
    this.started = false;
    this.paused = false;
  }

  // Start or restart the game.
  start() {
    this.started = true;
    this.paused = false;
  }

  // Stop the game and clear its paused state.
  stop() {
    this.started = false;
    this.paused = false;
  }

  // Toggle pause only while a game is running.
  togglePause() {
    if (this.started) this.paused = !this.paused;
    return this.paused;
  }
}
