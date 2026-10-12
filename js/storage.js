const USERS_KEY = "arena-defender-users";
const SESSION_KEY = "arena-defender-session";
const SETTINGS_KEY = "arena-defender-settings";

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

function read(key, defaultValue) {
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function save(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

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

function cleanUser(user) {
  if (!user || typeof user !== "object" || Array.isArray(user)) return null;
  if (typeof user.username !== "string" || !user.username) return null;

  const progress =
    user.progress &&
    typeof user.progress === "object" &&
    !Array.isArray(user.progress)
      ? user.progress
      : {};
  const scores = Array.isArray(user.scores) ? user.scores : [];

  return {
    ...user,
    username: String(user.username),
    email: typeof user.email === "string" ? user.email : "",
    progress: {
      ...progress,
      highestLevel: Math.max(1, Number(progress.highestLevel) || 1),
      weaponLevel: Math.max(0, Number(progress.weaponLevel) || 0),
    },
    scores: scores.map(cleanScore).filter(Boolean),
  };
}

export function getUsers() {
  const users = read(USERS_KEY, []);
  if (!Array.isArray(users)) return [];
  return users.map(cleanUser).filter(Boolean);
}

export function saveUsers(users) {
  const cleanUsers = Array.isArray(users)
    ? users.map(cleanUser).filter(Boolean)
    : [];
  save(USERS_KEY, cleanUsers);
}

export function getSession() {
  const session = read(SESSION_KEY, null);
  if (!session || typeof session.username !== "string") return null;
  return { username: session.username };
}

export function setSession(username) {
  save(SESSION_KEY, { username });
}

export function clearSession() {
  window.localStorage.removeItem(SESSION_KEY);
}

export function findUser(identifier) {
  const search = String(identifier || "").trim().toLowerCase();
  return getUsers().find(
    (user) =>
      user.username.toLowerCase() === search ||
      user.email.toLowerCase() === search,
  );
}

export function getCurrentUser() {
  const session = getSession();
  if (!session) return null;
  return getUsers().find((user) => user.username === session.username);
}

export function getSettings() {
  const saved = read(SETTINGS_KEY, {});
  const settings =
    saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};

  const result = {
    ...DEFAULT_SETTINGS,
    ...settings,
    bindings: {
      ...DEFAULT_SETTINGS.bindings,
      ...(settings.bindings || {}),
    },
  };

  ["masterVolume", "musicVolume", "effectsVolume"].forEach((name) => {
    const volume = Number(settings[name]);
    if (Number.isFinite(volume)) {
      result[name] = Math.max(0, Math.min(1, volume));
    } else {
      result[name] = DEFAULT_SETTINGS[name];
    }
  });

  if (typeof settings.difficulty !== "string") {
    result.difficulty = DEFAULT_SETTINGS.difficulty;
  }
  [
    "muted",
    "highContrast",
    "largeText",
    "reducedEffects",
    "aimAssist",
    "screenShake",
  ].forEach((name) => {
    if (typeof settings[name] !== "boolean") {
      result[name] = DEFAULT_SETTINGS[name];
    }
  });

  return result;
}

export function saveSettings(settings) {
  const current = getSettings();
  settings = settings && typeof settings === "object" ? settings : {};

  save(SETTINGS_KEY, {
    ...current,
    ...settings,
    bindings: {
      ...current.bindings,
      ...(settings.bindings || {}),
    },
  });
}

export function updateCurrentUserProgress(progress) {
  const user = getCurrentUser();
  if (!user || !progress || typeof progress !== "object") return;

  user.progress = {
    ...user.progress,
    ...progress,
  };

  const users = getUsers();
  const index = users.findIndex((item) => item.username === user.username);
  users[index] = user;
  saveUsers(users);
}

export function addUser(user) {
  const users = getUsers();
  users.push(user);
  saveUsers(users);
}

export function saveScore(score) {
  const users = getUsers();
  const user = users.find((item) => item.username === score.username);
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

  getUsers().forEach((user) => {
    user.scores.forEach((score) => {
      scores.push({ ...score, username: user.username });
    });
  });

  return scores.sort((a, b) => b.score - a.score);
}

export function getBestScores() {
  const best = [];

  getAllScores().forEach((score) => {
    const oldScore = best.find((item) => item.username === score.username);
    if (!oldScore) {
      best.push(score);
    } else if (score.score > oldScore.score) {
      best[best.indexOf(oldScore)] = score;
    }
  });

  return best.sort((a, b) => b.score - a.score);
}

export { DEFAULT_SETTINGS };
export const STORAGE_KEYS = {
  users: USERS_KEY,
  session: SESSION_KEY,
  settings: SETTINGS_KEY,
};
