// Keys used by the browser localStorage database.
const STORAGE_KEYS = Object.freeze({
  users: "arena-defender-users",
  session: "arena-defender-session",
  settings: "arena-defender-settings",
});

// Default settings used when no saved settings exist.
const DEFAULT_SETTINGS = Object.freeze({
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
});

// Read and parse one localStorage value safely.
function readJson(key, fallback) {
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

// Save one value as JSON.
function writeJson(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

// Clean one saved score before the app uses it.
function normalizeScore(score) {
  if (!score || typeof score !== "object" || Array.isArray(score)) return null;
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

// Clean one saved user before the app uses it.
function normalizeUser(user) {
  if (!user || typeof user !== "object" || Array.isArray(user)) return null;
  const username = typeof user.username === "string" ? user.username : "";
  const email = typeof user.email === "string" ? user.email : "";
  if (!username) return null;
  const progress =
    user.progress &&
    typeof user.progress === "object" &&
    !Array.isArray(user.progress)
      ? user.progress
      : {};
  const highestLevel = Number(progress.highestLevel);
  const weaponLevel = Number(progress.weaponLevel);
  return {
    ...user,
    username,
    email,
    progress: {
      ...progress,
      highestLevel: Number.isFinite(highestLevel)
        ? Math.max(1, highestLevel)
        : 1,
      weaponLevel: Number.isFinite(weaponLevel) ? Math.max(0, weaponLevel) : 0,
    },
    scores: Array.isArray(user.scores)
      ? user.scores.map(normalizeScore).filter(Boolean)
      : [],
  };
}

// Return all valid saved users.
export function getUsers() {
  const users = readJson(STORAGE_KEYS.users, []);
  return Array.isArray(users) ? users.map(normalizeUser).filter(Boolean) : [];
}
// Save the complete user list.
export function saveUsers(users) {
  writeJson(
    STORAGE_KEYS.users,
    Array.isArray(users) ? users.map(normalizeUser).filter(Boolean) : [],
  );
}
// Return the current login session.
export function getSession() {
  const session = readJson(STORAGE_KEYS.session, null);
  return session && typeof session.username === "string"
    ? { username: session.username }
    : null;
}
// Save the current username.
export function setSession(username) {
  writeJson(STORAGE_KEYS.session, { username });
}
// Remove the current login session.
export function clearSession() {
  window.localStorage.removeItem(STORAGE_KEYS.session);
}
// Find a user by username or email.
export function findUser(identifier) {
  const needle = String(identifier ?? "")
    .trim()
    .toLowerCase();
  return getUsers().find(
    (user) =>
      user.username.toLowerCase() === needle ||
      user.email.toLowerCase() === needle,
  );
}
// Return the logged-in user.
export function getCurrentUser() {
  const session = getSession();
  return session
    ? getUsers().find((user) => user.username === session.username)
    : null;
}
// Return settings with safe defaults.
export function getSettings() {
  const saved = readJson(STORAGE_KEYS.settings, {});
  const settings =
    saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};
  const bindings =
    settings.bindings &&
    typeof settings.bindings === "object" &&
    !Array.isArray(settings.bindings)
      ? settings.bindings
      : {};
  const numberSetting = (key) =>
    Number.isFinite(Number(settings[key]))
      ? Math.max(0, Math.min(1, Number(settings[key])))
      : DEFAULT_SETTINGS[key];
  return {
    difficulty:
      typeof settings.difficulty === "string"
        ? settings.difficulty
        : DEFAULT_SETTINGS.difficulty,
    masterVolume: numberSetting("masterVolume"),
    musicVolume: numberSetting("musicVolume"),
    effectsVolume: numberSetting("effectsVolume"),
    muted:
      typeof settings.muted === "boolean"
        ? settings.muted
        : DEFAULT_SETTINGS.muted,
    highContrast:
      typeof settings.highContrast === "boolean"
        ? settings.highContrast
        : DEFAULT_SETTINGS.highContrast,
    largeText:
      typeof settings.largeText === "boolean"
        ? settings.largeText
        : DEFAULT_SETTINGS.largeText,
    reducedEffects:
      typeof settings.reducedEffects === "boolean"
        ? settings.reducedEffects
        : DEFAULT_SETTINGS.reducedEffects,
    aimAssist:
      typeof settings.aimAssist === "boolean"
        ? settings.aimAssist
        : DEFAULT_SETTINGS.aimAssist,
    screenShake:
      typeof settings.screenShake === "boolean"
        ? settings.screenShake
        : DEFAULT_SETTINGS.screenShake,
    bindings: { ...DEFAULT_SETTINGS.bindings, ...bindings },
  };
}
// Save settings while preserving defaults and control bindings.
export function saveSettings(settings) {
  const current = getSettings();
  const next =
    settings && typeof settings === "object" && !Array.isArray(settings)
      ? settings
      : {};
  writeJson(STORAGE_KEYS.settings, {
    ...current,
    ...next,
    bindings: { ...current.bindings, ...(next.bindings ?? {}) },
  });
}
// Update progress for the logged-in user.
export function updateCurrentUserProgress(progress) {
  const session = getSession();
  if (!session) return;
  const users = getUsers();
  const user = users.find(
    (candidate) => candidate.username === session.username,
  );
  if (!user) return;
  const existingProgress =
    user.progress &&
    typeof user.progress === "object" &&
    !Array.isArray(user.progress)
      ? user.progress
      : {};
  const nextProgress =
    progress && typeof progress === "object" && !Array.isArray(progress)
      ? progress
      : {};
  user.progress = {
    highestLevel: 1,
    weaponLevel: 0,
    ...existingProgress,
    ...nextProgress,
  };
  saveUsers(users);
}
// Add a new user to localStorage.
export function addUser(user) {
  const users = getUsers();
  users.push(user);
  saveUsers(users);
}
// Add one completed run to a user's score history.
export function saveScore(score) {
  const users = getUsers();
  const user = users.find((candidate) => candidate.username === score.username);
  if (!user) return;
  user.scores = Array.isArray(user.scores) ? user.scores : [];
  const normalized = normalizeScore(score);
  if (!normalized) return;
  user.scores.push(normalized);
  user.progress = {
    ...user.progress,
    highestLevel: Math.max(user.progress?.highestLevel ?? 1, score.level),
  };
  saveUsers(users);
}
// Return every saved score sorted by score.
export function getAllScores() {
  return getUsers()
    .flatMap((user) =>
      user.scores.map((score) => ({
        ...score,
        username: user.username,
      })),
    )
    .sort((a, b) => b.score - a.score);
}
// Return the best score for each user.
export function getBestScores() {
  const bestByUser = new Map();
  getAllScores().forEach((score) => {
    const current = bestByUser.get(score.username);
    if (!current || score.score > current.score)
      bestByUser.set(score.username, score);
  });
  return [...bestByUser.values()].sort((a, b) => b.score - a.score);
}
export { DEFAULT_SETTINGS };
export { STORAGE_KEYS };
