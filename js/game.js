// Import the storage and game classes used by this page.
import {
  getCurrentUser,
  getSettings,
  saveScore,
  saveSettings,
  updateCurrentUserProgress,
} from "./storage.js";
import { AudioManager } from "./audio.js";
import { InputManager } from "./game/input-manager.js";
import { Weapon } from "./game/weapon.js";
import { Projectile } from "./game/projectile.js";
import { Enemy } from "./game/enemy.js";
import { Player } from "./game/player.js";
import { LevelManager } from "./game/level-manager.js";
import { ScoreManager } from "./game/score-manager.js";
import { Renderer3D } from "./game/renderer3d.js";
import { PowerUp } from "./game/power-up.js";
import { Game } from "./game/game.js";
import { SpriteAnimator } from "./game/sprite-animator.js";

// Get the Babylon.js classes used to draw the arena.
const {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  HemisphericLight,
  MeshBuilder,
  StandardMaterial,
  Color3,
  SpriteManager,
  Sprite,
} = window.BABYLON;

// Read the game canvas and saved settings.
const canvas = document.querySelector("#renderCanvas");
const settings = getSettings();
document.body.classList.toggle("high-contrast", settings.highContrast);
document.body.classList.toggle("large-text", settings.largeText);
document.body.classList.toggle("reduced-effects", settings.reducedEffects);
const audioManager = new AudioManager(settings);
const gameState = new Game();

// Create the Babylon engine and scene.
const engine = new Engine(canvas, true, {
  preserveDrawingBuffer: true,
  stencil: true,
});
const scene = new Scene(engine);
scene.clearColor = new Color3(0.055, 0.09, 0.1);
const camera = new ArcRotateCamera(
  "camera",
  -Math.PI / 2,
  1.05,
  18,
  new Vector3(0, 0, 0),
  scene,
);
camera.lowerRadiusLimit = 18;
camera.upperRadiusLimit = 18;
new HemisphericLight("ambient", new Vector3(0, 1, 0), scene).intensity = 1.1;

// Create the materials used by the arena and its objects.
const arenaMaterial = new StandardMaterial("arena-material", scene);
arenaMaterial.diffuseColor = new Color3(0.12, 0.25, 0.27);
arenaMaterial.specularColor = new Color3(0.1, 0.2, 0.2);
const signalMaterial = new StandardMaterial("signal-material", scene);
signalMaterial.emissiveColor = new Color3(0.7, 1, 0.15);
signalMaterial.diffuseColor = new Color3(0.5, 0.8, 0.1);
const threatMaterial = new StandardMaterial("threat-material", scene);
threatMaterial.emissiveColor = new Color3(1, 0.22, 0.12);
threatMaterial.diffuseColor = new Color3(0.9, 0.2, 0.1);
const stoneMaterial = new StandardMaterial("stone-material", scene);
stoneMaterial.diffuseColor = new Color3(0.42, 0.47, 0.45);
stoneMaterial.specularColor = new Color3(0.08, 0.1, 0.1);
const volatileMaterial = new StandardMaterial("volatile-material", scene);
volatileMaterial.emissiveColor = new Color3(1, 0.45, 0.08);
volatileMaterial.diffuseColor = new Color3(0.9, 0.32, 0.05);

// Create the floor and grid lines.
MeshBuilder.CreateGround(
  "arena-floor",
  { width: 16, height: 12 },
  scene,
).material = arenaMaterial;
for (let x = -7; x <= 7; x += 2) {
  const line = MeshBuilder.CreateBox(
    `grid-x-${x}`,
    { width: 0.025, height: 0.02, depth: 12 },
    scene,
  );
  line.position.x = x;
  line.position.y = 0.02;
  line.material = signalMaterial;
  line.visibility = 0.22;
}
for (let z = -5; z <= 5; z += 2) {
  const line = MeshBuilder.CreateBox(
    `grid-z-${z}`,
    { width: 16, height: 0.02, depth: 0.025 },
    scene,
  );
  line.position.z = z;
  line.position.y = 0.02;
  line.material = signalMaterial;
  line.visibility = 0.22;
}
// Create the core that the player protects.
const core = MeshBuilder.CreateCylinder(
  "core",
  { diameter: 1.5, height: 0.3, tessellation: 32 },
  scene,
);
core.position.y = 0.18;
core.material = signalMaterial;

// Create the hidden player mesh used for position and collision.
const player = MeshBuilder.CreateBox(
  "defender",
  { width: 0.65, height: 1.1, depth: 0.65 },
  scene,
);
player.position.y = 0.58;
player.material = signalMaterial;
player.visibility = 0;
// Create the visible animated sprite-sheet defender.
const defenderSpriteManager = new SpriteManager(
  "defender-sprite-manager",
  "images/sprites/defender-sheet.svg",
  1,
  { width: 128, height: 128 },
  scene,
);
const defenderSprite = new Sprite("defender-sprite", defenderSpriteManager);
defenderSprite.position = player.position.clone();
defenderSprite.position.y = 0.72;
defenderSprite.width = 1.7;
defenderSprite.height = 1.7;
const spriteAnimator = new SpriteAnimator(defenderSprite, {
  idle: { start: 0, end: 0, frame: 0 },
  moving: { start: 0, end: 3, frame: 0 },
  firing: { start: 1, end: 1, frame: 1 },
  damaged: { start: 2, end: 2, frame: 2 },
  defeated: { start: 3, end: 3, frame: 3 },
  celebrating: { start: 0, end: 3, frame: 0 },
});
spriteAnimator.play("idle");
const playerController = new Player(player, defenderSprite);

// Store active game objects.
const enemies = [];
const projectiles = [];
const powerUps = [];

// Set the number of enemies required by each normal wave.
const waveEnemyTargets = [16, 24, 32, 44];
const weapons = [
  {
    name: "Pulse MK-I",
    damage: 1,
    fireRate: 0.2,
    range: 10,
    meterClass: "meter-damage",
  },
  {
    name: "Pulse MK-II",
    damage: 2,
    fireRate: 0.16,
    range: 13,
    meterClass: "meter-fire",
  },
  {
    name: "Nova MK-III",
    damage: 3,
    fireRate: 0.12,
    range: 16,
    meterClass: "meter-range",
  },
];
const weaponModels = [];
weapons.forEach((definition) => {
  weaponModels.push(new Weapon(definition));
});
// Use this difficulty if the data file cannot be loaded.
const fallbackDifficulty = {
  enemySpeed: 1,
  enemyDamage: 8,
  scoreMultiplier: 1,
};
let difficultyConfig = fallbackDifficulty;
// Name the four normal environments.
const levelNames = [
  "Training Ground",
  "Desert Strike",
  "Space Defence",
  "Orbital Bastion",
];
const levelThemes = [
  { sky: new Color3(0.055, 0.09, 0.1), floor: new Color3(0.12, 0.25, 0.27) },
  { sky: new Color3(0.16, 0.1, 0.06), floor: new Color3(0.32, 0.22, 0.12) },
  { sky: new Color3(0.025, 0.06, 0.12), floor: new Color3(0.08, 0.17, 0.25) },
  { sky: new Color3(0.12, 0.025, 0.08), floor: new Color3(0.2, 0.08, 0.16) },
];
const levelManager = new LevelManager(
  levelNames,
  levelThemes,
  waveEnemyTargets,
);
const scoreManager = new ScoreManager();
const inputManager = new InputManager(window);
Object.keys(settings.bindings).forEach((action) => {
  const key = settings.bindings[action];
  inputManager.setBinding(action, key);
});
const renderer = new Renderer3D(scene, arenaMaterial, defenderSprite);
const tutorialMode =
  new URLSearchParams(window.location.search).get("mode") === "tutorial";
const totalWaves = tutorialMode ? 1 : waveEnemyTargets.length;
const tutorialEnemyTarget = 6;
const difficultyConfigReady = fetch("data/difficulties.json")
  .then((response) => (response.ok ? response.json() : []))
  .then((difficulties) => {
    const selected = Array.isArray(difficulties)
      ? difficulties.find((difficulty) => difficulty.id === settings.difficulty)
      : null;
    if (selected) difficultyConfig = { ...fallbackDifficulty, ...selected };
  })
  .catch(() => undefined);
let aimDirection = new Vector3(0, 0, 1);
let started = false;
let paused = false;
let score = 0;
let health = 100;
let wave = 1;
let weaponLevel = 0;
let enemiesSpawnedThisWave = 0;
let spawnTimer = 0;
let fireCooldown = 0;
let spriteAnimating = false;
let shakeRemaining = 0;
// Get the game HUD elements.
const waveValue = document.querySelector("#wave-value");
const scoreValue = document.querySelector("#score-value");
const healthValue = document.querySelector("#health-value");
const healthBar = document.querySelector("#health-bar");
const overlay = document.querySelector("#game-overlay");
const message = document.querySelector("#game-message");
const sessionLabel = document.querySelector("[data-session-label]");
const startButton = document.querySelector("#start-button");
const loadoutName = document.querySelector("#loadout-name");
const loadoutDamage = document.querySelector("#loadout-damage");
const loadoutFire = document.querySelector("#loadout-fire");
const loadoutRange = document.querySelector("#loadout-range");
// Return the player's current weapon.
function currentWeapon() {
  return weaponModels[weaponLevel];
}
// Apply the current environment colours.
function applyLevelTheme() {
  const theme = levelThemes[wave - 1];
  renderer.applyTheme(theme);
  if (sessionLabel) sessionLabel.textContent = levelNames[wave - 1];
}
// Update the visible score, health, wave, and loadout.
function updateHud() {
  waveValue.innerHTML = `${String(wave).padStart(2, "0")} <small>/ ${String(totalWaves).padStart(2, "0")}</small>`;
  scoreValue.textContent = String(score).padStart(6, "0");
  healthValue.textContent = `${Math.max(0, health)}%`;
  healthBar.style.width = `${Math.max(0, health)}%`;
  loadoutName.textContent = currentWeapon().name;
  loadoutDamage.className = `stat-meter ${weaponLevel >= 0 ? "meter-active" : ""}`;
  loadoutFire.className = `stat-meter ${weaponLevel >= 1 ? "meter-active" : ""}`;
  loadoutRange.className = `stat-meter ${weaponLevel >= 2 ? "meter-active" : ""}`;
}
// Start a short screen shake when enabled.
function triggerScreenShake() {
  if (!settings.screenShake || settings.reducedEffects) return;
  shakeRemaining = 0.18;
}
// Create one enemy using the current wave rules.
function spawnEnemy() {
  const threatRoll = Math.random();
  let enemyType = "ball";
  if (wave === 2) {
    if (threatRoll < 0.55) enemyType = "fast-ball";
    else enemyType = "stone";
  } else if (wave === 3) {
    if (threatRoll < 0.4) enemyType = "fast-ball";
    else if (threatRoll < 0.75) enemyType = "stone";
    else enemyType = "volatile";
  } else if (wave >= 4) {
    if (threatRoll < 0.25) enemyType = "fast-ball";
    else if (threatRoll < 0.6) enemyType = "stone";
    else enemyType = "volatile";
  }

  let enemy;
  if (enemyType === "stone") {
    enemy = MeshBuilder.CreateBox(
      `stone-${Date.now()}`,
      { width: 0.85, height: 0.85, depth: 0.85 },
      scene,
    );
  } else {
    let diameter = 0.65;
    if (enemyType === "volatile") diameter = 0.9;
    enemy = MeshBuilder.CreateSphere(
      `threat-${Date.now()}`,
      { diameter, segments: 12 },
      scene,
    );
  }
  const edge = Math.floor(Math.random() * 4);
  if (edge === 0) {
    enemy.position = new Vector3(-7, 0.38, Math.random() * 10 - 5);
  } else if (edge === 1) {
    enemy.position = new Vector3(7, 0.38, Math.random() * 10 - 5);
  } else if (edge === 2) {
    enemy.position = new Vector3(Math.random() * 14 - 7, 0.38, -5);
  } else {
    enemy.position = new Vector3(Math.random() * 14 - 7, 0.38, 5);
  }

  if (enemyType === "stone") enemy.material = stoneMaterial;
  else if (enemyType === "volatile") enemy.material = volatileMaterial;
  else enemy.material = threatMaterial;

  let enemyStats = {
    health: 1,
    speed: 0.8,
    damage: 8,
    points: 100,
  };
  if (enemyType === "fast-ball") {
    enemyStats = { health: 1, speed: 1.35, damage: 10, points: 175 };
  } else if (enemyType === "stone") {
    enemyStats = { health: 3, speed: 0.55, damage: 14, points: 300 };
  } else if (enemyType === "volatile") {
    enemyStats = { health: 2, speed: 0.95, damage: 18, points: 450 };
  }

  const enemySpeed = enemyStats.speed * difficultyConfig.enemySpeed;
  const enemyDamage =
    enemyStats.damage *
    (difficultyConfig.enemyDamage / fallbackDifficulty.enemyDamage);
  enemies.push(
    new Enemy(enemy, enemyType, {
      health: enemyStats.health,
      speed: enemySpeed,
      damage: enemyDamage,
      points: enemyStats.points,
    }),
  );
}
// Create a repair pickup at an enemy's last position.
function spawnPowerUp(position) {
  const mesh = MeshBuilder.CreateTorus(
    "repair-pickup",
    { diameter: 0.65, thickness: 0.12 },
    scene,
  );
  mesh.position = position.clone();
  mesh.position.y = 0.45;
  mesh.material = signalMaterial;
  powerUps.push(new PowerUp(mesh));
}
// Fire one projectile in the current aim direction.
function fire() {
  if (!started || paused || fireCooldown > 0) return;
  audioManager.fire();
  spriteAnimator.frame("firing");
  const weapon = currentWeapon();
  let firingDirection = aimDirection.clone();
  if (settings.aimAssist && enemies.length) {
    let nearest = enemies[0];
    enemies.forEach((enemy) => {
      const enemyDistance = Vector3.Distance(
        enemy.mesh.position,
        player.position,
      );
      const nearestDistance = Vector3.Distance(
        nearest.mesh.position,
        player.position,
      );
      if (enemyDistance < nearestDistance) nearest = enemy;
    });
    firingDirection = nearest.mesh.position
      .subtract(player.position)
      .normalize();
  }
  const projectile = MeshBuilder.CreateSphere(
    `pulse-${Date.now()}`,
    { diameter: 0.16 },
    scene,
  );
  projectile.position = player.position.clone();
  projectile.position.y = 0.65;
  projectile.material = signalMaterial;
  scoreManager.shot();
  projectiles.push(
    new Projectile(projectile, firingDirection, weapon.damage, weapon.range),
  );
  fireCooldown = weapon.fireRate;
}
// End the run and save its result once.
function endRun(completed) {
  if (completed === undefined) completed = false;
  if (!started) return;
  gameState.stop();
  started = false;
  spriteAnimator.frame(completed ? "celebrating" : "defeated");
  const user = getCurrentUser();
  if (user) {
    saveScore({
      username: user.username,
      score,
      level: wave,
      difficulty: settings.difficulty,
      accuracy: scoreManager.accuracy,
      date: new Date().toISOString(),
    });
  }
  if (user) {
    message.textContent = `Defence complete. ${score.toLocaleString()} points - ${scoreManager.accuracy}% accuracy - Wave ${wave} cleared. Your result is logged.`;
  } else {
    message.textContent = `Defence complete. ${score.toLocaleString()} points - ${scoreManager.accuracy}% accuracy - Wave ${wave} cleared. Log in to save it.`;
  }
  let highestLevel = 1;
  if (user && user.progress && user.progress.highestLevel) {
    highestLevel = user.progress.highestLevel;
  }
  updateCurrentUserProgress({
    highestLevel: Math.max(wave, highestLevel),
    weaponLevel,
  });
  overlay.querySelector(".button").textContent = "Run it again ->";
  overlay.classList.remove("hidden");
}
// Start a new run from the first wave.
async function startRun() {
  audioManager.unlock();
  await difficultyConfigReady;
  const user = getCurrentUser();
  gameState.start();
  started = true;
  paused = false;
  scoreManager.reset();
  score = 0;
  wave = 1;
  levelManager.reset();
  let savedWeaponLevel = 0;
  if (user && user.progress) {
    savedWeaponLevel = Number(user.progress.weaponLevel) || 0;
  }
  weaponLevel = Math.min(weapons.length - 1, Math.max(0, savedWeaponLevel));
  enemiesSpawnedThisWave = 0;
  spawnTimer = 0;
  enemies.splice(0).forEach((enemy) => enemy.mesh.dispose());
  projectiles.splice(0).forEach((projectile) => projectile.mesh.dispose());
  powerUps.splice(0).forEach((powerUp) => powerUp.destroy());
  playerController.reset();
  health = playerController.health;
  applyLevelTheme();
  overlay.classList.add("hidden");
  startButton.textContent = "Start simulation ->";
  if (tutorialMode) {
    message.textContent =
      "Training mode: practise movement, firing, and dodging in one short wave.";
  }
  updateHud();
  renderer.setReducedEffects(settings.reducedEffects);
}
// Start the next wave after the player confirms deployment.
async function continueToNextWave() {
  audioManager.unlock();
  await difficultyConfigReady;
  gameState.start();
  started = true;
  paused = false;
  overlay.classList.add("hidden");
  updateHud();
}
// Show the deployment screen between waves.
function showLevelComplete() {
  started = false;
  gameState.stop();
  message.textContent = `${levelNames[wave - 2]} cleared. ${currentWeapon().name} is ready for the next deployment.`;
  startButton.textContent = `Deploy ${levelNames[wave - 1]} ->`;
  overlay.classList.remove("hidden");
}
// Set the aim direction from the current movement keys.
function updateAimDirection() {
  const direction = new Vector3(0, 0, 0);
  if (inputManager.isDown("up")) direction.z += 1;
  if (inputManager.isDown("down")) direction.z -= 1;
  if (inputManager.isDown("left")) direction.x -= 1;
  if (inputManager.isDown("right")) direction.x += 1;
  if (direction.lengthSquared() > 0) aimDirection = direction.normalize();
}
// Connect input actions to game actions.
inputManager.onFire = fire;
inputManager.onPause = () => {
  paused = gameState.togglePause();
};
canvas.addEventListener("pointerdown", fire);
startButton.addEventListener("click", () => {
  if (wave > 1 && enemiesSpawnedThisWave === 0) continueToNextWave();
  else startRun();
});
document.querySelector("#pause-button").addEventListener("click", () => {
  paused = gameState.togglePause();
});
// Update all game objects before each rendered frame.
scene.onBeforeRenderObservable.add(() => {
  if (!started || paused) return;
  const delta = engine.getDeltaTime() / 1000;
  const move = 4 * delta;
  if (shakeRemaining > 0) {
    shakeRemaining -= delta;
    camera.target.x = (Math.random() - 0.5) * 0.12;
    camera.target.z = (Math.random() - 0.5) * 0.12;
  } else {
    camera.target.x = 0;
    camera.target.z = 0;
  }
  updateAimDirection();
  const isMoving = inputManager.isDown("up") ||
    inputManager.isDown("down") ||
    inputManager.isDown("left") ||
    inputManager.isDown("right");
  const movement = new Vector3(0, 0, 0);
  if (inputManager.isDown("right")) movement.x += 1;
  if (inputManager.isDown("left")) movement.x -= 1;
  if (inputManager.isDown("up")) movement.z += 1;
  if (inputManager.isDown("down")) movement.z -= 1;
  if (isMoving) {
    playerController.move(movement.normalize(), move);
  }
  renderer.syncPlayer(playerController);
  if (isMoving && !spriteAnimating) {
    spriteAnimator.play("moving", true, 180);
    spriteAnimating = true;
  } else if (!isMoving && spriteAnimating) {
    spriteAnimator.stop("idle");
    spriteAnimating = false;
  }
  fireCooldown = Math.max(0, fireCooldown - delta);
  spawnTimer -= delta;
  let enemyTarget = waveEnemyTargets[wave - 1];
  if (tutorialMode) enemyTarget = tutorialEnemyTarget;
  if (spawnTimer <= 0 && enemiesSpawnedThisWave < enemyTarget) {
    spawnEnemy();
    enemiesSpawnedThisWave += 1;
    spawnTimer = Math.max(0.45, 1.4 - wave * 0.15);
  }
  for (let index = enemies.length - 1; index >= 0; index -= 1) {
    const enemy = enemies[index];
    enemy.update(player.position, delta);
    if (Vector3.Distance(enemy.mesh.position, player.position) < 0.8) {
      enemy.mesh.dispose();
      enemies.splice(index, 1);
      playerController.damage(enemy.damage);
      health = playerController.health;
      spriteAnimator.frame("damaged");
      triggerScreenShake();
      audioManager.damage();
      updateHud();
      if (health <= 0) endRun();
    }
  }
  if (!started) return;
  for (
    let projectileIndex = projectiles.length - 1;
    projectileIndex >= 0;
    projectileIndex -= 1
  ) {
    const projectile = projectiles[projectileIndex];
    const projectileInRange = projectile.update(delta);
    if (!projectileInRange) {
      projectile.destroy();
      projectiles.splice(projectileIndex, 1);
      continue;
    }
    let enemyIndex = -1;
    enemies.forEach((enemy, index) => {
      const distance = Vector3.Distance(
        projectile.mesh.position,
        enemy.mesh.position,
      );
      if (distance < 0.55 && enemyIndex === -1) enemyIndex = index;
    });
    if (enemyIndex < 0) continue;
    const enemy = enemies[enemyIndex];
    projectile.destroy();
    projectiles.splice(projectileIndex, 1);
    enemy.health -= projectile.damage;
    if (enemy.health <= 0) {
      const enemyPosition = enemy.mesh.position.clone();
      enemy.mesh.dispose();
      enemies.splice(enemyIndex, 1);
      scoreManager.hit(enemy.points * difficultyConfig.scoreMultiplier);
      score = scoreManager.value;
      audioManager.hit();
      if (Math.random() < 0.12) spawnPowerUp(enemyPosition);
      window.setTimeout(() => {
        if (!started) return;
        spriteAnimator.frame("idle");
      }, 150);
    }
    updateHud();
  }
  for (
    let powerUpIndex = powerUps.length - 1;
    powerUpIndex >= 0;
    powerUpIndex -= 1
  ) {
    const powerUp = powerUps[powerUpIndex];
    if (!powerUp.update(delta)) {
      powerUp.destroy();
      powerUps.splice(powerUpIndex, 1);
    } else if (Vector3.Distance(powerUp.mesh.position, player.position) < 0.9) {
      powerUp.collect(playerController);
      health = playerController.health;
      updateHud();
      powerUps.splice(powerUpIndex, 1);
      audioManager.waveComplete();
    }
  }
  let levelTarget = levelManager.target;
  if (tutorialMode) levelTarget = tutorialEnemyTarget;
  if (enemiesSpawnedThisWave >= levelTarget && enemies.length === 0) {
    if (wave < totalWaves) {
      wave += 1;
      levelManager.advance();
      weaponLevel = Math.min(weapons.length - 1, weaponLevel + 1);
      enemiesSpawnedThisWave = 0;
      spawnTimer = 1.5;
      applyLevelTheme();
      audioManager.waveComplete();
      updateHud();
      showLevelComplete();
    } else {
      audioManager.gameComplete();
      endRun(true);
    }
  }
});
// Start rendering and keep the canvas responsive.
engine.runRenderLoop(() => scene.render());
window.addEventListener("resize", () => engine.resize());
document.querySelector("#mute-button").addEventListener("click", (event) => {
  const muted = audioManager.toggleMute();
  saveSettings({ muted });
  event.currentTarget.textContent = muted ? "Sound off" : "Sound on";
  event.currentTarget.setAttribute("aria-pressed", String(!muted));
});
document.querySelector("#mute-button").textContent = settings.muted
  ? "Sound off"
  : "Sound on";
document
  .querySelector("#mute-button")
  .setAttribute("aria-pressed", String(!settings.muted));
applyLevelTheme();
updateHud();
