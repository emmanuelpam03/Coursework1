// Stores one weapon's damage and firing settings.
export class Weapon {
  // Copy the weapon definition into the class.
  constructor(definition) {
    this.name = definition.name;
    this.damage = definition.damage;
    this.fireRate = definition.fireRate;
    this.range = definition.range;
    this.meterClass = definition.meterClass;
  }

  // Report whether the weapon can fire.
  canFire(cooldown) {
    return cooldown <= 0;
  }
}
