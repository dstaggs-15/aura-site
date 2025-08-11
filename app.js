// ===== Aura front-end wiring =====
// Point this at your Worker API (no trailing slash)
const API = "https://aura-api.daniel-staggs0215.workers.dev";

// ---------- tiny fetch helpers ----------
async function postJSON(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",            // send/receive cookie
    body: JSON.stringify(body)
  });

  // Read raw text so we can surface server_error details
  const text = await res.text();
  let data = {};
  try { data = JSON.parse(text); } catch {}

  if (!res.ok) {
    const msg = (data.error || res.statusText) + (data.detail ? ` — ${data.detail}` : "");
    throw new Error(msg || "request_failed");
  }
  return data;
}

async function getJSON(path) {
  const res = await fetch(`${API}${path}`, { credentials: "include" });
  const text = await res.text();
  let data = {};
  try { data = JSON.parse(text); } catch {}

  if (!res.ok) {
    const msg = (data.error || res.statusText) + (data.detail ? ` — ${data.detail}` : "");
    throw new Error(msg || "request_failed");
  }
  return data;
}

// ---------- page wiring ----------
document.addEventListener("DOMContentLoaded", () => {
  // Optional: basic health ping to prove API is reachable
  getJSON("/api/health")
    .then(d => console.log("API health:", d))
    .catch(err => console.warn("API health check failed:", err.message));

  // ---- login.html ----
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(loginForm);
      const username = (fd.get("username") || "").toString().trim();
      const password = (fd.get("password") || "").toString();

      try {
        await postJSON("/api/login", { username, password });
        location.href = "index.html";
      } catch (err) {
        alert("Login failed: " + err.message);
      }
    });
  }

  // Sign-up form (also on login.html)
  const signupForm = document.getElementById("signupForm");
  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(signupForm);
      const username = (fd.get("username") || "").toString().trim();
      const password = (fd.get("password") || "").toString();

      try {
        await postJSON("/api/signup", { username, password });
        location.href = "index.html";
      } catch (err) {
        alert("Signup failed: " + err.message);
      }
    });
  }

  // ---- profile.html ----
  const nameEl = document.getElementById("profileUsername");
  const auraEl = document.getElementById("profileAura");
  const streakEl = document.getElementById("profileStreak");

  if (nameEl || auraEl || streakEl) {
    getJSON("/api/me")
      .then(({ user }) => {
        if (user) {
          if (nameEl) nameEl.textContent = "@" + user.username;
          if (auraEl) auraEl.textContent = user.aura_total ?? 0;
          if (streakEl) streakEl.textContent = user.streak ?? 0;
        } else {
          if (nameEl) nameEl.textContent = "Not logged in";
        }
      })
      .catch(err => {
        console.warn("Load profile failed:", err.message);
        if (nameEl) nameEl.textContent = "Error loading profile";
      });
  }

  // ---- logout hook (optional: add a button with id="logoutBtn") ----
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        await postJSON("/api/logout", {});
        location.href = "login.html";
      } catch (err) {
        alert("Logout failed: " + err.message);
      }
    });
  }

  // ---- new.html (post creator) placeholder for later ----
  const newPostForm = document.getElementById("newPostForm");
  if (newPostForm) {
    newPostForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      alert("Posting isn’t wired yet — next step after auth.");
    });
  }
});
