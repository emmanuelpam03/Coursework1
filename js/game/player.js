// Stores player health, movement, and sprite position.
export class Player {
  // Connect the player logic to its visible mesh and sprite.
  constructor(mesh, sprite) {
    this.mesh = mesh;
    this.sprite = sprite;
    this.health = 100;
    this.position = mesh.position;
  }

  // Reset health and position for a new run.
  reset() {
    this.health = 100;
    this.position.x = 0;
    this.position.z = 0;
    this.syncSprite();
  }

  // Move the player inside the arena bounds.
  move(direction, distance, bounds = { x: 7, z: 5 }) {
    this.position.x += direction.x * distance;
    this.position.z += direction.z * distance;
    if (this.position.x > bounds.x) this.position.x = bounds.x;
    if (this.position.x < -bounds.x) this.position.x = -bounds.x;
    if (this.position.z > bounds.z) this.position.z = bounds.z;
    if (this.position.z < -bounds.z) this.position.z = -bounds.z;
    this.syncSprite();
  }

  // Reduce health and report whether the player is defeated.
  damage(amount) {
    this.health = Math.max(0, this.health - amount);
    return this.health <= 0;
  }

  // Keep the sprite above the hidden player mesh.
  syncSprite() {
    if (!this.sprite) return;
    this.sprite.position.x = this.position.x;
    this.sprite.position.z = this.position.z;
  }
}
