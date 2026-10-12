// Controls the current wave and its environment.
export class LevelManager {
  // Store the level data and start at the first level.
  constructor(names, themes, enemyTargets) {
    this.names = names;
    this.themes = themes;
    this.enemyTargets = enemyTargets;
    this.current = 1;
  }

  // Return to the first level.
  reset() {
    this.current = 1;
  }

  // Return the current level name.
  get name() {
    return this.names[this.current - 1];
  }

  // Return the number of enemies needed for this level.
  get target() {
    return this.enemyTargets[this.current - 1];
  }

  // Report whether this is the final level.
  get isFinal() {
    return this.current === this.enemyTargets.length;
  }

  // Move to the next level.
  advance() {
    if (!this.isFinal) {
      this.current += 1;
    }
    return this.current;
  }

  // Return the current environment theme.
  theme() {
    return this.themes[this.current - 1];
  }
}
