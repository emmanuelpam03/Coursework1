import {
  addUser,
  clearSession,
  findUser,
  getAllScores,
  getBestScores,
  getCurrentUser,
  getSettings,
  getUsers,
  saveSettings,
  setSession,
} from "./storage.js";
import { showErrors, validateRegistration } from "./validation.js";

const page = document.body.dataset.page;

if (page === "home") {
  window.history.scrollRestoration = "manual";
  window.scrollTo(0, 0);
}

function applySettings() {
  const settings = getSettings();
  document.body.classList.toggle("high-contrast", settings.highContrast);
  document.body.classList.toggle("large-text", settings.largeText);
  document.body.classList.toggle("reduced-effects", settings.reducedEffects);
}

function setupNavigation() {
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".site-nav");
  if (toggle) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
  }

  const slot = document.querySelector("[data-auth-slot]");
  const user = getCurrentUser();
  if (!slot) return;

  if (user) {
    slot.innerHTML = `<a href="profile.html">${user.username}</a><a class="nav-logout" href="#logout">Log out</a>`;
    const logout = slot.querySelector('[href="#logout"]');
    logout.addEventListener("click", (event) => {
      event.preventDefault();
      clearSession();
      window.location.href = "index.html";
    });
  } else {
    slot.innerHTML = '<a href="login.html">Log in <span>-></span></a>';
  }
}

function setupRegistration() {
  const form = document.querySelector("#register-form");
  if (!form) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = {
      username: form.elements.username.value,
      email: form.elements.email.value,
      password: form.elements.password.value,
      confirmPassword: form.elements.confirmPassword.value,
      firstName: form.elements.firstName.value,
      lastName: form.elements.lastName.value,
      dateOfBirth: form.elements.dateOfBirth.value,
      country: form.elements.country.value,
      preferredDifficulty: form.elements.preferredDifficulty.value,
      terms: form.elements.terms.checked,
    };
    const errors = validateRegistration(data, getUsers());
    showErrors(form, errors);
    const feedback = form.querySelector(".form-feedback");
    if (
      errors.username ||
      errors.email ||
      errors.password ||
      errors.confirmPassword ||
      errors.firstName ||
      errors.lastName ||
      errors.dateOfBirth ||
      errors.country ||
      errors.terms
    ) {
      feedback.textContent = "Check the highlighted fields.";
      return;
    }
    const user = {
      username: data.username.trim(),
      email: data.email.trim(),
      password: data.password,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      dateOfBirth: data.dateOfBirth,
      country: data.country,
      preferredDifficulty: data.preferredDifficulty || "standard",
      registeredAt: new Date().toISOString(),
      progress: { highestLevel: 1, tutorialComplete: false },
      scores: [],
    };
    addUser(user);
    setSession(user.username);
    feedback.className = "form-feedback success";
    feedback.textContent = "Profile created. Opening your console...";
    window.setTimeout(() => {
      window.location.href = "profile.html";
    }, 450);
  });
}

function setupLogin() {
  const form = document.querySelector("#login-form");
  if (!form) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = {
      identifier: form.elements.identifier.value,
      password: form.elements.password.value,
    };
    const errors = {};
    if (!data.identifier.trim())
      errors.identifier = "Enter your username or email.";
    if (!data.password) errors.password = "Enter your password.";
    showErrors(form, errors);
    const feedback = form.querySelector(".form-feedback");
    if (errors.identifier || errors.password) {
      feedback.textContent = "Check the highlighted fields.";
      return;
    }
    const user = findUser(data.identifier);
    if (!user) {
      feedback.textContent = "Pilot profile not found.";
      return;
    }
    if (user.password !== data.password) {
      feedback.textContent = "Incorrect password.";
      return;
    }
    setSession(user.username);
    feedback.className = "form-feedback success";
    feedback.textContent = "Access granted. Opening your console...";
    window.setTimeout(() => {
      window.location.href = "profile.html";
    }, 450);
  });
}

function setupRankings() {
  const body = document.querySelector("#ranking-body");
  const empty = document.querySelector("#ranking-empty");
  if (!body || !empty) return;
  const current = getCurrentUser();
  const filter = document.querySelector("#difficulty-filter");
  const view = document.querySelector("#score-view");
  const render = () => {
    const selected = filter ? filter.value : "all";
    let source = getBestScores();
    if (view && view.value === "all") source = getAllScores();
    const scores = [];
    for (let index = 0; index < source.length; index += 1) {
      const score = source[index];
      const difficulty = String(score.difficulty || "standard").toLowerCase();
      if (selected === "all" || difficulty === selected) {
        scores.push(score);
      }
    }
    empty.hidden = scores.length > 0;
    body.innerHTML = "";
    let numberOfScores = scores.length;
    if (numberOfScores > 20) numberOfScores = 20;
    for (let index = 0; index < numberOfScores; index += 1) {
      const score = scores[index];
      const date = score.date ? new Date(score.date) : null;
      let dateLabel = "-";
      if (date && !Number.isNaN(date.valueOf())) {
        dateLabel = date.toLocaleDateString();
      }

      let currentClass = "";
      let currentLabel = "";
      if (current && current.username === score.username) {
        currentClass = "current";
        currentLabel = " <small>(you)</small>";
      }

      const scoreNumber = Number(score.score || 0).toLocaleString();
      const level = score.level || "-";
      const difficulty = score.difficulty || "Standard";
      body.innerHTML += `<tr class="${currentClass}"><td>${String(index + 1).padStart(2, "0")}</td><td>${score.username}${currentLabel}</td><td>${scoreNumber}</td><td>${level}</td><td>${difficulty}</td><td>${dateLabel}</td></tr>`;
    }

    const personalBest = document.querySelector("#personal-best");
    let own = null;
    if (current) {
      const bestScores = getBestScores();
      for (let index = 0; index < bestScores.length; index += 1) {
        if (bestScores[index].username === current.username) {
          own = bestScores[index];
          break;
        }
      }
    }
    if (personalBest) {
      if (own) {
        personalBest.textContent = `Personal best: ${own.score.toLocaleString()} points - Level ${own.level}`;
      } else {
        personalBest.textContent = "Log in to track your personal best.";
      }
    }
  };
  if (filter) filter.addEventListener("change", render);
  if (view) view.addEventListener("change", render);
  render();
}

function setupProfile() {
  const user = getCurrentUser();
  const name = document.querySelector("#profile-name");
  if (!name || !user) return;
  name.textContent = `${user.firstName} ${user.lastName}`;
  document.querySelector("#profile-email").textContent =
    `@${user.username} - ${user.email}`;
  document.querySelector("#profile-level").textContent =
    user.progress && user.progress.highestLevel
      ? user.progress.highestLevel
      : 1;
  const scores = user.scores || [];
  document.querySelector("#profile-runs").textContent = scores.length;
  let highestScore = 0;
  for (let index = 0; index < scores.length; index += 1) {
    if (scores[index].score > highestScore) {
      highestScore = scores[index].score;
    }
  }
  if (scores.length) {
    document.querySelector("#profile-score").textContent =
      highestScore.toLocaleString();
  } else {
    document.querySelector("#profile-score").textContent = "-";
  }
  const action = document.querySelector("#profile-action");
  action.textContent = "Return to the arena ->";
  action.href = "game.html";
}

function setupSettings() {
  const form = document.querySelector("#settings-form");
  if (!form) return;
  const settings = getSettings();
  form.elements.difficulty.value = settings.difficulty;
  form.elements.masterVolume.value = settings.masterVolume;
  form.elements.musicVolume.value = settings.musicVolume;
  form.elements.effectsVolume.value = settings.effectsVolume;
  form.elements.muted.checked = settings.muted;
  form.elements.highContrast.checked = settings.highContrast;
  form.elements.largeText.checked = settings.largeText;
  form.elements.reducedEffects.checked = settings.reducedEffects;
  form.elements.aimAssist.checked = settings.aimAssist;
  form.elements.screenShake.checked = settings.screenShake;
  form.elements.up.value = settings.bindings.up;
  form.elements.down.value = settings.bindings.down;
  form.elements.left.value = settings.bindings.left;
  form.elements.right.value = settings.bindings.right;
  form.elements.fire.value =
    settings.bindings.fire === " " ? "Space" : settings.bindings.fire;
  form.elements.pause.value = settings.bindings.pause;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = {
      difficulty: form.elements.difficulty.value,
      masterVolume: form.elements.masterVolume.value,
      musicVolume: form.elements.musicVolume.value,
      effectsVolume: form.elements.effectsVolume.value,
      muted: form.elements.muted.checked,
      highContrast: form.elements.highContrast.checked,
      largeText: form.elements.largeText.checked,
      reducedEffects: form.elements.reducedEffects.checked,
      aimAssist: form.elements.aimAssist.checked,
      screenShake: form.elements.screenShake.checked,
      bindings: {
        up: form.elements.up.value,
        down: form.elements.down.value,
        left: form.elements.left.value,
        right: form.elements.right.value,
        fire:
          form.elements.fire.value === "Space"
            ? " "
            : form.elements.fire.value,
        pause: form.elements.pause.value,
      },
    };
    data.masterVolume = Number(data.masterVolume);
    data.musicVolume = Number(data.musicVolume);
    data.effectsVolume = Number(data.effectsVolume);
    saveSettings(data);
    applySettings();
    document.querySelector("#settings-feedback").textContent =
      "Settings saved for this browser.";
  });
}

setupNavigation();
setupRegistration();
setupLogin();
setupRankings();
setupProfile();
applySettings();
setupSettings();
