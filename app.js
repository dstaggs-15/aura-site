// Frontend wiring for login/signup/profile using your Worker API
const API = "https://aura-api.daniel-staggs0215.workers.dev";

// helpers
async function postJSON(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "request_failed");
  return data;
}
async function getJSON(path) {
  const res = await fetch(`${API}${path}`, { credentials: "include" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "request_failed");
  return data;
}

// wire up forms/pages
document.addEventListener("DOMContentLoaded", () => {
  // login.html
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(loginForm);
      try {
        await postJSON("/api/login", {
          username: fd.get("username"),
          password: fd.get("password")
        });
        location.href = "index.html";
      } catch (err) {
        alert("Login failed: " + err.message);
      }
    });
  }

  // signup form on login.html
  const signupForm = document.getElementById("signupForm");
  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(signupForm);
      try {
        await postJSON("/api/signup", {
          username: fd.get("username"),
          password: fd.get("password")
        });
        location.href = "index.html";
      } catch (err) {
        alert("Signup failed: " + err.message);
      }
    });
  }

  // profile.html
  const auraName = document.getElementById("profileUsername");
  const auraAura = document.getElementById("profileAura");
  const auraStreak = document.getElementById("profileStreak");
  if (auraName || auraAura || auraStreak) {
    getJSON("/api/me")
      .then(({ user }) => {
        if (user) {
          if (auraName) auraName.textContent = "@" + user.username;
          if (auraAura) auraAura.textContent = user.aura_total ?? 0;
          if (auraStreak) auraStreak.textContent = user.streak ?? 0;
        } else {
          if (auraName) auraName.textContent = "Not logged in";
        }
      })
      .catch(() => {});
  }
});
