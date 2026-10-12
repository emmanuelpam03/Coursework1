// Stores shared enemy behaviour.
export class Enemy {
  // Create an enemy from a mesh and its statistics.
  constructor(mesh, type, stats) {
    this.mesh = mesh;
    this.type = type;
    Object.assign(this, stats);
  }

  // Move towards the player.
  update(target, delta) {
    const direction = target.subtract(this.mesh.position).normalize();
    this.mesh.position.addInPlace(direction.scale(this.speed * delta));
    return this.mesh.position;
  }

  // Apply damage and report whether the enemy is defeated.
  hit(damage) {
    this.health -= damage;
    return this.health <= 0;
  }

  // Remove the enemy mesh from the scene.
  destroy() {
    this.mesh.dispose();
  }
}

// Named classes keep enemy types clear for future behaviour changes.
export class BallEnemy extends Enemy {}
export class StoneEnemy extends Enemy {}
