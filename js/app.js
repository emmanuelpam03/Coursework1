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