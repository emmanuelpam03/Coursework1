// Represents a pickup that can help the player.
export class PowerUp {
  // Create a repair pickup.
  constructor(mesh, kind = "repair") {
    this.mesh = mesh;
    this.kind = kind;
    this.life = 10;
  }

  // Rotate the pickup and count down its lifetime.
  update(delta) {
    this.life -= delta;
    this.mesh.rotation.y += delta * 2;
    return this.life > 0;
  }

  // Apply the pickup effect to the player.
  collect(player) {
    if (this.kind === "repair") {
      player.health = Math.min(100, player.health + 20);
    }
    this.mesh.dispose();
  }

  // Remove an unused pickup.
  destroy() {
    this.mesh.dispose();
  }
}
