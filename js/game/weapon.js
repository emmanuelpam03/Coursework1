// Stores one weapon's damage and firing settings.
export class Weapon {
  // Copy the weapon definition into the class.
  constructor(definition) {
    Object.assign(this, definition);
  }

  // Report whether the weapon can fire.
  canFire(cooldown) {
    return cooldown <= 0;
  }
}
