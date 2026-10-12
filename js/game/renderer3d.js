// Handles the visible Babylon.js scene changes.
export class Renderer3D {
  // Store the scene objects used by the renderer.
  constructor(scene, arenaMaterial, sprite) {
    this.scene = scene;
    this.arenaMaterial = arenaMaterial;
    this.sprite = sprite;
  }

  // Apply an environment colour theme.
  applyTheme(theme) {
    this.scene.clearColor = theme.sky;
    this.arenaMaterial.diffuseColor = theme.floor;
  }

  // Turn scene effects on or off.
  setReducedEffects(enabled) {
    this.scene.particlesEnabled = !enabled;
    this.scene.animationsEnabled = !enabled;
  }

  // Keep the visible sprite aligned with the player.
  syncPlayer(player) {
    player.syncSprite();
  }
}
