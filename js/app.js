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
  if (!document.querySelector('link[href="css/accessibility.css"]')) {
    const stylesheet = document.createElement("link");
    stylesheet.rel = "stylesheet";
    stylesheet.href = "css/accessibility.css";
    document.head.append(stylesheet);
  }
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
    const data = {};
    new FormData(form).forEach((value, key) => {
      data[key] = value;
    });
    const errors = validateRegistration(data, getUsers());
    showErrors(form, errors);
    const feedback = form.querySelector(".form-feedback");
    if (Object.keys(errors).length) {
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
    const data = {};
    new FormData(form).forEach((value, key) => {
      data[key] = value;
    });
    const errors = {};
    if (!data.identifier.trim())
      errors.identifier = "Enter your username or email.";
    if (!data.password) errors.password = "Enter your password.";
    showErrors(form, errors);
    const feedback = form.querySelector(".form-feedback");
    if (Object.keys(errors).length) {
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
    const scores = source.filter(
      (score) => {
        return (
          selected === "all" ||
          String(score.difficulty || "standard").toLowerCase() === selected
        );
      },
    );
    empty.hidden = scores.length > 0;
    body.innerHTML = scores
      .slice(0, 20)
      .map((score, index) => {
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
        return `<tr class="${currentClass}"><td>${String(index + 1).padStart(2, "0")}</td><td>${score.username}${currentLabel}</td><td>${scoreNumber}</td><td>${level}</td><td>${difficulty}</td><td>${dateLabel}</td></tr>`;
      })
      .join("");
    const personalBest = document.querySelector("#personal-best");
    let own = null;
    if (current) {
      own = getBestScores().find(
        (score) => score.username === current.username,
      );
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
  document.querySelector("#profile-score").textContent = scores.length
    ? Math.max(...scores.map((score) => score.score)).toLocaleString()
    : "-";
  const action = document.querySelector("#profile-action");
  action.textContent = "Return to the arena ->";
  action.href = "game.html";
}

function setupSettings() {
  const form = document.querySelector("#settings-form");
  if (!form) return;
  const settings = getSettings();
  Object.entries(settings).forEach(([key, value]) => {
    const field = form.elements.namedItem(key);
    if (!field || key === "bindings") return;
    if (field.type === "checkbox") field.checked = Boolean(value);
    else field.value = value;
  });
  Object.entries(settings.bindings).forEach(([key, value]) => {
    const field = form.elements.namedItem(key);
    if (field) field.value = value === " " ? "Space" : value;
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = {};
    new FormData(form).forEach((value, key) => {
      data[key] = value;
    });
    saveSettings({
      ...data,
      masterVolume: Number(data.masterVolume),
      effectsVolume: Number(data.effectsVolume),
      musicVolume: Number(data.musicVolume),
      highContrast: form.elements.highContrast.checked,
      largeText: form.elements.largeText.checked,
      reducedEffects: form.elements.reducedEffects.checked,
      aimAssist: form.elements.aimAssist.checked,
      screenShake: form.elements.screenShake.checked,
      bindings: {
        up: form.elements.up.value === "Space" ? " " : form.elements.up.value,
        down:
          form.elements.down.value === "Space"
            ? " "
            : form.elements.down.value,
        left:
          form.elements.left.value === "Space"
            ? " "
            : form.elements.left.value,
        right:
          form.elements.right.value === "Space"
            ? " "
            : form.elements.right.value,
        fire:
          form.elements.fire.value === "Space"
            ? " "
            : form.elements.fire.value,
        pause:
          form.elements.pause.value === "Space"
            ? " "
            : form.elements.pause.value,
      },
    });
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
