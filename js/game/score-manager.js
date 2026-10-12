// Stores score, shots, hits, and accuracy for one run.
export class ScoreManager {
  // Start with an empty result.
  constructor() {
    this.value = 0;
    this.shots = 0;
    this.hits = 0;
  }

  // Clear the result for a new run.
  reset() {
    this.value = 0;
    this.shots = 0;
    this.hits = 0;
  }

  // Count a fired projectile.
  shot() {
    this.shots += 1;
  }

  // Add points and count a successful hit.
  hit(points) {
    this.hits += 1;
    this.value += points;
  }

  // Calculate the run accuracy as a percentage.
  get accuracy() {
    return this.shots ? Math.round((this.hits / this.shots) * 100) : 0;
  }
}
