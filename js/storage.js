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

function cleanScore(score) {
  if (!score || typeof score !== "object" || Array.isArray(score)) {
    return null;
  }

  const clean = {
    score: Number(score.score),
    level: Number(score.level),
    difficulty: score.difficulty,
    accuracy: Number(score.accuracy),
    date: score.date,
  };

  if (!Number.isFinite(clean.score)) clean.score = 0;
  if (!Number.isFinite(clean.level)) clean.level = 1;
  if (typeof clean.difficulty !== "string") clean.difficulty = "standard";
  if (!Number.isFinite(clean.accuracy)) clean.accuracy = 0;
  if (typeof clean.date !== "string") clean.date = "";

  return clean;
}

function cleanUser(user) {
  if (!user || typeof user !== "object" || Array.isArray(user)) {
    return null;
  }
  if (typeof user.username !== "string" || user.username === "") {
    return null;
  }

  if (
    !user.progress ||
    typeof user.progress !== "object" ||
    Array.isArray(user.progress)
  ) {
    user.progress = {};
  }
  const highestLevel = Number(user.progress.highestLevel);
  const weaponLevel = Number(user.progress.weaponLevel);
  user.progress.highestLevel = Number.isFinite(highestLevel)
    ? Math.max(1, highestLevel)
    : 1;
  user.progress.weaponLevel = Number.isFinite(weaponLevel)
    ? Math.max(0, weaponLevel)
    : 0;

  if (!Array.isArray(user.scores)) user.scores = [];
  user.scores = user.scores.map(cleanScore).filter(Boolean);

  if (typeof user.email !== "string") user.email = "";
  return user;
}

export function getUsers() {
  try {
    const savedUsers = window.localStorage.getItem(USERS_KEY);
    if (!savedUsers) return [];
    const users = JSON.parse(savedUsers);
    if (!Array.isArray(users)) return [];
    return users.map(cleanUser).filter(Boolean);
  } catch {
    return [];
  }
}

export function saveUsers(users) {
  const goodUsers = [];
  if (Array.isArray(users)) {
    users.forEach((user) => {
      const clean = cleanUser(user);
      if (clean) goodUsers.push(clean);
    });
  }
  window.localStorage.setItem(USERS_KEY, JSON.stringify(goodUsers));
}

export function getSession() {
  const savedSession = window.localStorage.getItem(SESSION_KEY);
  if (!savedSession) return null;

  try {
    const session = JSON.parse(savedSession);
    if (session && typeof session.username === "string") {
      return { username: session.username };
    }
  } catch {
    return null;
  }
  return null;
}

export function setSession(username) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify({ username }));
}

export function clearSession() {
  window.localStorage.removeItem(SESSION_KEY);
}

export function findUser(identifier) {
  const search = String(identifier || "").trim().toLowerCase();
  const users = getUsers();

  return users.find((user) => {
    return (
      user.username.toLowerCase() === search ||
      user.email.toLowerCase() === search
    );
  });
}

export function getCurrentUser() {
  const session = getSession();
  if (!session) return null;

  return getUsers().find((user) => user.username === session.username);
}

export function getSettings() {
  let saved = {};
  const savedSettings = window.localStorage.getItem(SETTINGS_KEY);

  if (savedSettings) {
    try {
      saved = JSON.parse(savedSettings);
    } catch {
      saved = {};
    }
  }

  if (!saved || typeof saved !== "object" || Array.isArray(saved)) {
    saved = {};
  }

  const settings = { ...DEFAULT_SETTINGS, ...saved };
  settings.masterVolume = getVolume(saved.masterVolume, DEFAULT_SETTINGS.masterVolume);
  settings.musicVolume = getVolume(saved.musicVolume, DEFAULT_SETTINGS.musicVolume);
  settings.effectsVolume = getVolume(
    saved.effectsVolume,
    DEFAULT_SETTINGS.effectsVolume,
  );

  if (typeof saved.difficulty !== "string") {
    settings.difficulty = DEFAULT_SETTINGS.difficulty;
  }
  if (typeof saved.muted !== "boolean") settings.muted = DEFAULT_SETTINGS.muted;
  if (typeof saved.highContrast !== "boolean") {
    settings.highContrast = DEFAULT_SETTINGS.highContrast;
  }
  if (typeof saved.largeText !== "boolean") {
    settings.largeText = DEFAULT_SETTINGS.largeText;
  }
  if (typeof saved.reducedEffects !== "boolean") {
    settings.reducedEffects = DEFAULT_SETTINGS.reducedEffects;
  }
  if (typeof saved.aimAssist !== "boolean") {
    settings.aimAssist = DEFAULT_SETTINGS.aimAssist;
  }
  if (typeof saved.screenShake !== "boolean") {
    settings.screenShake = DEFAULT_SETTINGS.screenShake;
  }

  let savedBindings = {};
  if (
    saved.bindings &&
    typeof saved.bindings === "object" &&
    !Array.isArray(saved.bindings)
  ) {
    savedBindings = saved.bindings;
  }
  settings.bindings = { ...DEFAULT_SETTINGS.bindings, ...savedBindings };
  return settings;
}

function getVolume(value, defaultValue) {
  const number = Number(value);
  if (!Number.isFinite(number)) return defaultValue;
  return Math.max(0, Math.min(1, number));
}

export function saveSettings(settings) {
  const oldSettings = getSettings();
  if (!settings || typeof settings !== "object") settings = {};

  const newSettings = {
    ...oldSettings,
    ...settings,
    bindings: {
      ...oldSettings.bindings,
      ...(settings.bindings || {}),
    },
  };
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
}

export function updateCurrentUserProgress(progress) {
  const session = getSession();
  if (!session) return;

  const users = getUsers();
  const user = users.find((item) => item.username === session.username);
  if (!user) return;
  if (!progress || typeof progress !== "object") return;

  user.progress = {
    highestLevel: 1,
    weaponLevel: 0,
    ...user.progress,
    ...progress,
  };
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

  const newScore = cleanScore(score);
  if (!newScore) return;
  user.scores.push(newScore);

  if (newScore.level > user.progress.highestLevel) {
    user.progress.highestLevel = newScore.level;
  }
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
  const bestScores = [];
  const scores = getAllScores();

  scores.forEach((score) => {
    const oldScore = bestScores.find(
      (item) => item.username === score.username,
    );
    if (!oldScore) {
      bestScores.push(score);
    } else if (score.score > oldScore.score) {
      const index = bestScores.indexOf(oldScore);
      bestScores[index] = score;
    }
  });

  return bestScores.sort((a, b) => b.score - a.score);
}

export { DEFAULT_SETTINGS };
export const STORAGE_KEYS = {
  users: USERS_KEY,
  session: SESSION_KEY,
  settings: SETTINGS_KEY,
};
