import { showErrors, validateRegistration } from "./validation.js";

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