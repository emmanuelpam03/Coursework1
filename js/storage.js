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

  user.username = String(user.username);
  user.email = typeof user.email === "string" ? user.email : "";
  user.progress = progress;
  user.progress.highestLevel = Math.max(
    1,
    Number(progress.highestLevel) || 1,
  );
  user.progress.weaponLevel = Math.max(0, Number(progress.weaponLevel) || 0);
  user.scores = cleanScores(scores);
  return user;
}

function cleanScores(scores) {
  const clean = [];
  for (let index = 0; index < scores.length; index += 1) {
    const score = cleanScore(scores[index]);
    if (score) clean.push(score);
  }
  return clean;
}

export function getUsers() {
  const users = read(USERS_KEY, []);
  if (!Array.isArray(users)) return [];
  const cleanUsers = [];
  for (let index = 0; index < users.length; index += 1) {
    const user = cleanUser(users[index]);
    if (user) cleanUsers.push(user);
  }
  return cleanUsers;
}

export function saveUsers(users) {
  const cleanUsers = [];
  if (Array.isArray(users)) {
    for (let index = 0; index < users.length; index += 1) {
      const user = cleanUser(users[index]);
      if (user) cleanUsers.push(user);
    }
  }
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
  const users = getUsers();
  for (let index = 0; index < users.length; index += 1) {
    const user = users[index];
    if (
      user.username.toLowerCase() === search ||
      user.email.toLowerCase() === search
    ) {
      return user;
    }
  }
  return null;
}

export function getCurrentUser() {
  const session = getSession();
  if (!session) return null;
  const users = getUsers();
  for (let index = 0; index < users.length; index += 1) {
    if (users[index].username === session.username) return users[index];
  }
  return null;
}

export function getSettings() {
  const saved = read(SETTINGS_KEY, {});
  const settings =
    saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};

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

  if (typeof settings.difficulty !== "string") {
    result.difficulty = DEFAULT_SETTINGS.difficulty;
  }
  if (typeof settings.muted !== "boolean") result.muted = false;
  if (typeof settings.highContrast !== "boolean") result.highContrast = false;
  if (typeof settings.largeText !== "boolean") result.largeText = false;
  if (typeof settings.reducedEffects !== "boolean") {
    result.reducedEffects = false;
  }
  if (typeof settings.aimAssist !== "boolean") result.aimAssist = false;
  if (typeof settings.screenShake !== "boolean") result.screenShake = true;
  if (typeof settings.bindings === "object" && !Array.isArray(settings.bindings)) {
    if (settings.bindings.up) result.bindings.up = settings.bindings.up;
    if (settings.bindings.down) result.bindings.down = settings.bindings.down;
    if (settings.bindings.left) result.bindings.left = settings.bindings.left;
    if (settings.bindings.right) result.bindings.right = settings.bindings.right;
    if (settings.bindings.fire) result.bindings.fire = settings.bindings.fire;
    if (settings.bindings.pause) result.bindings.pause = settings.bindings.pause;
  }

  return result;
}

export function saveSettings(settings) {
  const current = getSettings();
  settings = settings && typeof settings === "object" ? settings : {};

  const newSettings = {
    difficulty: settings.difficulty || current.difficulty,
    masterVolume: current.masterVolume,
    musicVolume: current.musicVolume,
    effectsVolume: current.effectsVolume,
    muted: settings.muted,
    highContrast: settings.highContrast,
    largeText: settings.largeText,
    reducedEffects: settings.reducedEffects,
    aimAssist: settings.aimAssist,
    screenShake: settings.screenShake,
    bindings: {
      up: current.bindings.up,
      down: current.bindings.down,
      left: current.bindings.left,
      right: current.bindings.right,
      fire: current.bindings.fire,
      pause: current.bindings.pause,
    },
  };
  if (settings.masterVolume !== undefined) {
    newSettings.masterVolume = Number(settings.masterVolume);
  }
  if (settings.musicVolume !== undefined) {
    newSettings.musicVolume = Number(settings.musicVolume);
  }
  if (settings.effectsVolume !== undefined) {
    newSettings.effectsVolume = Number(settings.effectsVolume);
  }
  if (settings.muted === undefined) newSettings.muted = current.muted;
  if (settings.highContrast === undefined) {
    newSettings.highContrast = current.highContrast;
  }
  if (settings.largeText === undefined) newSettings.largeText = current.largeText;
  if (settings.reducedEffects === undefined) {
    newSettings.reducedEffects = current.reducedEffects;
  }
  if (settings.aimAssist === undefined) newSettings.aimAssist = current.aimAssist;
  if (settings.screenShake === undefined) {
    newSettings.screenShake = current.screenShake;
  }
  if (settings.bindings && typeof settings.bindings === "object") {
    if (settings.bindings.up !== undefined) {
      newSettings.bindings.up = settings.bindings.up;
    }
    if (settings.bindings.down !== undefined) {
      newSettings.bindings.down = settings.bindings.down;
    }
    if (settings.bindings.left !== undefined) {
      newSettings.bindings.left = settings.bindings.left;
    }
    if (settings.bindings.right !== undefined) {
      newSettings.bindings.right = settings.bindings.right;
    }
    if (settings.bindings.fire !== undefined) {
      newSettings.bindings.fire = settings.bindings.fire;
    }
    if (settings.bindings.pause !== undefined) {
      newSettings.bindings.pause = settings.bindings.pause;
    }
  }
  save(SETTINGS_KEY, newSettings);
}

export function updateCurrentUserProgress(progress) {
  const user = getCurrentUser();
  if (!user || !progress || typeof progress !== "object") return;

  user.progress = {
    ...user.progress,
    ...progress,
  };

  const users = getUsers();
  for (let index = 0; index < users.length; index += 1) {
    if (users[index].username === user.username) {
      users[index] = user;
      break;
    }
  }
  saveUsers(users);
}

export function addUser(user) {
  const users = getUsers();
  users.push(user);
  saveUsers(users);
}

export function saveScore(score) {
  const users = getUsers();
  let user = null;
  for (let index = 0; index < users.length; index += 1) {
    if (users[index].username === score.username) {
      user = users[index];
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
  const users = getUsers();
  for (let userIndex = 0; userIndex < users.length; userIndex += 1) {
    const user = users[userIndex];
    for (let scoreIndex = 0; scoreIndex < user.scores.length; scoreIndex += 1) {
      const score = user.scores[scoreIndex];
      scores.push({ ...score, username: user.username });
    }
  }

  return scores.sort((a, b) => b.score - a.score);
}

export function getBestScores() {
  const best = [];
  const scores = getAllScores();
  for (let index = 0; index < scores.length; index += 1) {
    const score = scores[index];
    let oldScore = null;
    for (let bestIndex = 0; bestIndex < best.length; bestIndex += 1) {
      if (best[bestIndex].username === score.username) {
        oldScore = best[bestIndex];
        break;
      }
    }
    if (!oldScore) {
      best.push(score);
    } else if (score.score > oldScore.score) {
      best[best.indexOf(oldScore)] = score;
    }
  }

  return best.sort((a, b) => b.score - a.score);
}

export { DEFAULT_SETTINGS };
export const STORAGE_KEYS = {
  users: USERS_KEY,
  session: SESSION_KEY,
  settings: SETTINGS_KEY,
};
