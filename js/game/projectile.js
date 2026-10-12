// Stores one projectile's movement and damage.
export class Projectile {
  // Create a projectile with a direction and maximum range.
  constructor(mesh, direction, damage, range) {
    this.mesh = mesh;
    this.direction = direction;
    this.damage = damage;
    this.range = range;
  }

  // Move the projectile and report whether it is still in range.
  update(delta, speed = 10) {
    this.mesh.position.addInPlace(this.direction.scale(speed * delta));
    return this.mesh.position.length() <= this.range;
  }

  // Remove the projectile mesh.
  destroy() {
    this.mesh.dispose();
  }
}
