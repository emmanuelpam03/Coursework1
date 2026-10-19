// It saves users, the current login, and settings in localStorage.

const USERS_KEY = "arena-defender-users";
const SESSION_KEY = "arena-defender-session";
const SETTINGS_KEY = "arena-defender-settings";

// These values are used when a setting has not been saved yet.
const DEFAULT_SETTINGS = {
  difficulty: "standard",
  masterVolume: 0.08,
  musicVolume: 0.05,
  effectsVolume: 0.08,
  muted: false,
  highContrast: false,
  largeText: false,
  reducedEffects: false,
  aimAssist: false,
  screenShake: true,
  bindings: {
    up: "w",
    down: "s",
    left: "a",
    right: "d",
    fire: " ",
    pause: "p",
  },
};

// Read JSON data from localStorage.
// Invalid or missing data is replaced by the supplied default value.
function read(key, defaultValue) {
  try {
    const savedValue = window.localStorage.getItem(key);
    return savedValue ? JSON.parse(savedValue) : defaultValue;
  } catch {
    return defaultValue;
  }
}

// Convert a JavaScript value into JSON and save it.
function save(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

// Keep only the score fields used by the application.
function cleanScore(score) {
  if (!score || typeof score !== "object" || Array.isArray(score)) {
    return null;
  }

  return {
    score: Number.isFinite(Number(score.score)) ? Number(score.score) : 0,
    level: Number.isFinite(Number(score.level)) ? Number(score.level) : 1,
    difficulty:
      typeof score.difficulty === "string" ? score.difficulty : "standard",
    accuracy: Number.isFinite(Number(score.accuracy))
      ? Number(score.accuracy)
      : 0,
    date: typeof score.date === "string" ? score.date : "",
  };
}

// Validate one user and return the cleaned user.
function cleanUser(user) {
  if (
    !user ||
    typeof user !== "object" ||
    Array.isArray(user) ||
    typeof user.username !== "string" ||
    !user.username
  ) {
    return null;
  }

  const progress =
    user.progress &&
    typeof user.progress === "object" &&
    !Array.isArray(user.progress)
      ? user.progress
      : {};
  progress.highestLevel = Math.max(1, Number(progress.highestLevel) || 1);
  progress.weaponLevel = Math.max(0, Number(progress.weaponLevel) || 0);

  user.username = String(user.username);
  user.email = typeof user.email === "string" ? user.email : "";
  user.progress = progress;

  const scores = Array.isArray(user.scores) ? user.scores : [];
  user.scores = [];
  for (const score of scores) {
    const clean = cleanScore(score);
    if (clean) user.scores.push(clean);
  }

  return user;
}

export function getUsers() {
  const savedUsers = read(USERS_KEY, []);
  if (!Array.isArray(savedUsers)) return [];

  const users = [];
  for (const savedUser of savedUsers) {
    const user = cleanUser(savedUser);
    if (user) users.push(user);
  }
  return users;
}

export function saveUsers(users) {
  const cleanUsers = [];

  if (Array.isArray(users)) {
    for (const user of users) {
      const clean = cleanUser(user);
      if (clean) cleanUsers.push(clean);
    }
  }

  save(USERS_KEY, cleanUsers);
}

export function getSession() {
  const session = read(SESSION_KEY, null);
  if (
    !session ||
    typeof session !== "object" ||
    Array.isArray(session) ||
    typeof session.username !== "string"
  ) {
    return null;
  }
  return { username: session.username };
}

export function setSession(username) {
  save(SESSION_KEY, { username });
}

export function clearSession() {
  window.localStorage.removeItem(SESSION_KEY);
}

export function findUser(identifier) {
  const searchText = String(identifier || "").trim().toLowerCase();

  for (const user of getUsers()) {
    const usernameMatches = user.username.toLowerCase() === searchText;
    const emailMatches = user.email.toLowerCase() === searchText;
    if (usernameMatches || emailMatches) return user;
  }

  return null;
}

export function getCurrentUser() {
  const session = getSession();
  if (!session) return null;

  for (const user of getUsers()) {
    if (user.username === session.username) return user;
  }

  return null;
}

export function getSettings() {
  const saved = read(SETTINGS_KEY, {});
  const settings =
    saved && typeof saved === "object" && !Array.isArray(saved)
      ? saved
      : {};

  const result = {
    difficulty: DEFAULT_SETTINGS.difficulty,
    masterVolume: DEFAULT_SETTINGS.masterVolume,
    musicVolume: DEFAULT_SETTINGS.musicVolume,
    effectsVolume: DEFAULT_SETTINGS.effectsVolume,
    muted: DEFAULT_SETTINGS.muted,
    highContrast: DEFAULT_SETTINGS.highContrast,
    largeText: DEFAULT_SETTINGS.largeText,
    reducedEffects: DEFAULT_SETTINGS.reducedEffects,
    aimAssist: DEFAULT_SETTINGS.aimAssist,
    screenShake: DEFAULT_SETTINGS.screenShake,
    bindings: {
      up: DEFAULT_SETTINGS.bindings.up,
      down: DEFAULT_SETTINGS.bindings.down,
      left: DEFAULT_SETTINGS.bindings.left,
      right: DEFAULT_SETTINGS.bindings.right,
      fire: DEFAULT_SETTINGS.bindings.fire,
      pause: DEFAULT_SETTINGS.bindings.pause,
    },
  };

  let volume = Number(settings.masterVolume);
  if (Number.isFinite(volume)) {
    result.masterVolume = Math.max(0, Math.min(1, volume));
  }

  volume = Number(settings.musicVolume);
  if (Number.isFinite(volume)) {
    result.musicVolume = Math.max(0, Math.min(1, volume));
  }

  volume = Number(settings.effectsVolume);
  if (Number.isFinite(volume)) {
    result.effectsVolume = Math.max(0, Math.min(1, volume));
  }

  if (typeof settings.difficulty === "string") {
    result.difficulty = settings.difficulty;
  }
  if (typeof settings.muted === "boolean") result.muted = settings.muted;
  if (typeof settings.highContrast === "boolean") {
    result.highContrast = settings.highContrast;
  }
  if (typeof settings.largeText === "boolean") {
    result.largeText = settings.largeText;
  }
  if (typeof settings.reducedEffects === "boolean") {
    result.reducedEffects = settings.reducedEffects;
  }
  if (typeof settings.aimAssist === "boolean") {
    result.aimAssist = settings.aimAssist;
  }
  if (typeof settings.screenShake === "boolean") {
    result.screenShake = settings.screenShake;
  }

  if (
    settings.bindings &&
    typeof settings.bindings === "object" &&
    !Array.isArray(settings.bindings)
  ) {
    if (settings.bindings.up) result.bindings.up = settings.bindings.up;
    if (settings.bindings.down) result.bindings.down = settings.bindings.down;
    if (settings.bindings.left) result.bindings.left = settings.bindings.left;
    if (settings.bindings.right) {
      result.bindings.right = settings.bindings.right;
    }
    if (settings.bindings.fire) result.bindings.fire = settings.bindings.fire;
    if (settings.bindings.pause) {
      result.bindings.pause = settings.bindings.pause;
    }
  }

  return result;
}

export function saveSettings(settings) {
  const current = getSettings();
  const changes =
    settings && typeof settings === "object" && !Array.isArray(settings)
      ? settings
      : {};
  const newSettings = {
    ...current,
    difficulty: changes.difficulty || current.difficulty,
    bindings: { ...current.bindings },
  };

  if (changes.masterVolume !== undefined) {
    newSettings.masterVolume = Number(changes.masterVolume);
  }
  if (changes.musicVolume !== undefined) {
    newSettings.musicVolume = Number(changes.musicVolume);
  }
  if (changes.effectsVolume !== undefined) {
    newSettings.effectsVolume = Number(changes.effectsVolume);
  }

  if (changes.muted !== undefined) newSettings.muted = changes.muted;
  if (changes.highContrast !== undefined) {
    newSettings.highContrast = changes.highContrast;
  }
  if (changes.largeText !== undefined) {
    newSettings.largeText = changes.largeText;
  }
  if (changes.reducedEffects !== undefined) {
    newSettings.reducedEffects = changes.reducedEffects;
  }
  if (changes.aimAssist !== undefined) {
    newSettings.aimAssist = changes.aimAssist;
  }
  if (changes.screenShake !== undefined) {
    newSettings.screenShake = changes.screenShake;
  }

  if (
    changes.bindings &&
    typeof changes.bindings === "object" &&
    !Array.isArray(changes.bindings)
  ) {
    if (changes.bindings.up !== undefined) {
      newSettings.bindings.up = changes.bindings.up;
    }
    if (changes.bindings.down !== undefined) {
      newSettings.bindings.down = changes.bindings.down;
    }
    if (changes.bindings.left !== undefined) {
      newSettings.bindings.left = changes.bindings.left;
    }
    if (changes.bindings.right !== undefined) {
      newSettings.bindings.right = changes.bindings.right;
    }
    if (changes.bindings.fire !== undefined) {
      newSettings.bindings.fire = changes.bindings.fire;
    }
    if (changes.bindings.pause !== undefined) {
      newSettings.bindings.pause = changes.bindings.pause;
    }
  }

  save(SETTINGS_KEY, newSettings);
}

export function updateCurrentUserProgress(progress) {
  const user = getCurrentUser();
  if (
    !user ||
    !progress ||
    typeof progress !== "object" ||
    Array.isArray(progress)
  ) {
    return;
  }

  user.progress = {
    ...user.progress,
    ...progress,
  };

  const users = getUsers();
  for (let index = 0; index < users.length; index += 1) {
    if (users[index].username === user.username) {
      users[index] = user;
      saveUsers(users);
      break;
    }
  }
}

export function addUser(user) {
  const users = getUsers();
  users.push(user);
  saveUsers(users);
}

export function saveScore(score) {
  const users = getUsers();
  let user = null;
  for (const savedUser of users) {
    if (savedUser.username === score.username) {
      user = savedUser;
      break;
    }
  }
  if (!user) return;

  const clean = cleanScore(score);
  if (!clean) return;

  user.scores.push(clean);
  user.progress.highestLevel = Math.max(
    user.progress.highestLevel,
    clean.level,
  );
  saveUsers(users);
}

export function getAllScores() {
  const scores = [];

  for (const user of getUsers()) {
    for (const score of user.scores) {
      scores.push({ ...score, username: user.username });
    }
  }

  return scores.sort((first, second) => second.score - first.score);
}

export function getBestScores() {
  const bestScores = [];
  for (const score of getAllScores()) {
    let userAlreadyIncluded = false;

    for (const bestScore of bestScores) {
      if (bestScore.username === score.username) {
        userAlreadyIncluded = true;
        break;
      }
    }

    if (!userAlreadyIncluded) {
      bestScores.push(score);
    }
  }

  return bestScores.sort((first, second) => second.score - first.score);
}

export { DEFAULT_SETTINGS };
export const STORAGE_KEYS = {
  users: USERS_KEY,
  session: SESSION_KEY,
  settings: SETTINGS_KEY,
};
