// This file is the small data layer for the coursework.
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

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isNumber(value) {
  return Number.isFinite(Number(value));
}

function limitVolume(value, fallback) {
  if (!isNumber(value)) return fallback;
  return Math.max(0, Math.min(1, Number(value)));
}

// Keep only the score fields used by the application.
function cleanScore(score) {
  if (!isObject(score)) return null;

  return {
    score: isNumber(score.score) ? Number(score.score) : 0,
    level: isNumber(score.level) ? Number(score.level) : 1,
    difficulty:
      typeof score.difficulty === "string" ? score.difficulty : "standard",
    accuracy: isNumber(score.accuracy) ? Number(score.accuracy) : 0,
    date: typeof score.date === "string" ? score.date : "",
  };
}

function cleanScores(scores) {
  const validScores = [];

  for (const score of scores) {
    const clean = cleanScore(score);
    if (clean) validScores.push(clean);
  }

  return validScores;
}

// Validate one user and return a safe copy.
function cleanUser(user) {
  if (!isObject(user) || typeof user.username !== "string" || !user.username) {
    return null;
  }

  const progress = isObject(user.progress) ? { ...user.progress } : {};
  progress.highestLevel = Math.max(1, Number(progress.highestLevel) || 1);
  progress.weaponLevel = Math.max(0, Number(progress.weaponLevel) || 0);

  return {
    ...user,
    username: String(user.username),
    email: typeof user.email === "string" ? user.email : "",
    progress,
    scores: cleanScores(Array.isArray(user.scores) ? user.scores : []),
  };
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
  if (!isObject(session) || typeof session.username !== "string") {
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

function copyDefaultSettings() {
  return {
    ...DEFAULT_SETTINGS,
    bindings: { ...DEFAULT_SETTINGS.bindings },
  };
}

function copyBindings(bindings) {
  const result = { ...DEFAULT_SETTINGS.bindings };
  if (!isObject(bindings)) return result;

  for (const action of Object.keys(result)) {
    if (bindings[action]) result[action] = bindings[action];
  }
  return result;
}

export function getSettings() {
  const saved = read(SETTINGS_KEY, {});
  const settings = isObject(saved) ? saved : {};
  const result = copyDefaultSettings();

  result.masterVolume = limitVolume(
    settings.masterVolume,
    DEFAULT_SETTINGS.masterVolume,
  );
  result.musicVolume = limitVolume(
    settings.musicVolume,
    DEFAULT_SETTINGS.musicVolume,
  );
  result.effectsVolume = limitVolume(
    settings.effectsVolume,
    DEFAULT_SETTINGS.effectsVolume,
  );

  if (typeof settings.difficulty === "string") {
    result.difficulty = settings.difficulty;
  }

  const booleanSettings = [
    "muted",
    "highContrast",
    "largeText",
    "reducedEffects",
    "aimAssist",
    "screenShake",
  ];
  for (const settingName of booleanSettings) {
    if (typeof settings[settingName] === "boolean") {
      result[settingName] = settings[settingName];
    }
  }

  result.bindings = copyBindings(settings.bindings);
  return result;
}

export function saveSettings(settings) {
  const current = getSettings();
  const changes = isObject(settings) ? settings : {};
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

  const booleanSettings = [
    "muted",
    "highContrast",
    "largeText",
    "reducedEffects",
    "aimAssist",
    "screenShake",
  ];
  for (const settingName of booleanSettings) {
    if (changes[settingName] !== undefined) {
      newSettings[settingName] = changes[settingName];
    }
  }

  if (isObject(changes.bindings)) {
    for (const action of Object.keys(newSettings.bindings)) {
      if (changes.bindings[action] !== undefined) {
        newSettings.bindings[action] = changes.bindings[action];
      }
    }
  }

  save(SETTINGS_KEY, newSettings);
}

export function updateCurrentUserProgress(progress) {
  const user = getCurrentUser();
  if (!user || !isObject(progress)) return;

  user.progress = {
    ...user.progress,
    ...progress,
  };

  const users = getUsers();
  const userIndex = users.findIndex(
    (savedUser) => savedUser.username === user.username,
  );
  if (userIndex !== -1) {
    users[userIndex] = user;
    saveUsers(users);
  }
}

export function addUser(user) {
  const users = getUsers();
  users.push(user);
  saveUsers(users);
}

export function saveScore(score) {
  const users = getUsers();
  const user = users.find((savedUser) => savedUser.username === score.username);
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
  const bestScoresByUser = new Map();

  for (const score of getAllScores()) {
    const oldScore = bestScoresByUser.get(score.username);
    if (!oldScore || score.score > oldScore.score) {
      bestScoresByUser.set(score.username, score);
    }
  }

  return [...bestScoresByUser.values()].sort(
    (first, second) => second.score - first.score,
  );
}

export { DEFAULT_SETTINGS };
export const STORAGE_KEYS = {
  users: USERS_KEY,
  session: SESSION_KEY,
  settings: SETTINGS_KEY,
};
