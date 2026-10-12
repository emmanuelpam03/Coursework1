import {
  addUser,
  clearSession,
  findUser,
  getAllScores,
  getBestScores,
  getCurrentUser,
  getUsers,
  getSettings,
  saveSettings,
  setSession,
} from "./storage.js";
import { showErrors, validateRegistration } from "./validation.js";

const page = document.body.dataset.page;

if (page === "home") {
  window.history.scrollRestoration = "manual";
  window.scrollTo(0, 0);
}

// Apply saved accessibility preferences to the current page.
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

// Set up the shared navigation and logout link.
function setupNavigation() {
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".site-nav");
  toggle?.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  const slot = document.querySelector("[data-auth-slot]");
  const user = getCurrentUser();
  if (!slot) return;
  slot.innerHTML = user
    ? `<a href="profile.html">${user.username}</a><a class="nav-logout" href="#logout">Log out</a>`
    : '<a href="login.html">Log in <span>-></span></a>';
  slot.querySelector('[href="#logout"]')?.addEventListener("click", (event) => {
    event.preventDefault();
    clearSession();
    window.location.href = "index.html";
  });
}

// Set up registration and validation.
function setupRegistration() {
  const form = document.querySelector("#register-form");
  if (!form) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form));
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
      preferredDifficulty: data.preferredDifficulty ?? "standard",
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

// Set up login and session creation.
function setupLogin() {
  const form = document.querySelector("#login-form");
  if (!form) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form));
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

// Render the rankings table and filters.
function setupRankings() {
  const body = document.querySelector("#ranking-body");
  const empty = document.querySelector("#ranking-empty");
  if (!body || !empty) return;
  const current = getCurrentUser();
  const filter = document.querySelector("#difficulty-filter");
  const view = document.querySelector("#score-view");
  const render = () => {
    const selected = filter?.value ?? "all";
    const source = view?.value === "all" ? getAllScores() : getBestScores();
    const scores = source.filter(
      (score) =>
        selected === "all" ||
        String(score.difficulty ?? "standard").toLowerCase() === selected,
    );
    empty.hidden = Boolean(scores.length);
    body.innerHTML = scores
      .slice(0, 20)
      .map((score, index) => {
        const date = score.date ? new Date(score.date) : null;
        const dateLabel =
          date && !Number.isNaN(date.valueOf())
            ? date.toLocaleDateString()
            : "-";
        return `<tr class="${current?.username === score.username ? "current" : ""}"><td>${String(index + 1).padStart(2, "0")}</td><td>${score.username}${current?.username === score.username ? " <small>(you)</small>" : ""}</td><td>${Number(score.score ?? 0).toLocaleString()}</td><td>${score.level ?? "-"}</td><td>${score.difficulty ?? "Standard"}</td><td>${dateLabel}</td></tr>`;
      })
      .join("");
    const personalBest = document.querySelector("#personal-best");
    const own = current
      ? getBestScores().find((score) => score.username === current.username)
      : null;
    if (personalBest)
      personalBest.textContent = own
        ? `Personal best: ${own.score.toLocaleString()} points - Level ${own.level}`
        : "Log in to track your personal best.";
  };
  filter?.addEventListener("change", render);
  view?.addEventListener("change", render);
  render();
}

// Render the logged-in user's profile.
function setupProfile() {
  const user = getCurrentUser();
  const name = document.querySelector("#profile-name");
  if (!name || !user) return;
  name.textContent = `${user.firstName} ${user.lastName}`;
  document.querySelector("#profile-email").textContent =
    `@${user.username} - ${user.email}`;
  document.querySelector("#profile-level").textContent =
    user.progress?.highestLevel ?? 1;
  const scores = user.scores ?? [];
  document.querySelector("#profile-runs").textContent = scores.length;
  document.querySelector("#profile-score").textContent = scores.length
    ? Math.max(...scores.map((score) => score.score)).toLocaleString()
    : "-";
  const action = document.querySelector("#profile-action");
  action.textContent = "Return to the arena ->";
  action.href = "game.html";
}

// Load and save the profile settings form.
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
    const data = Object.fromEntries(new FormData(form));
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
      bindings: Object.fromEntries(
        ["up", "down", "left", "right", "fire", "pause"].map((key) => [
          key,
          form.elements[key].value === "Space" ? " " : form.elements[key].value,
        ]),
      ),
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
