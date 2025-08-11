// ===== Aura front-end wiring (auth + posts + votes) =====
const API = "https://aura-api.daniel-staggs0215.workers.dev";

// ---------- helpers ----------
async function postJSON(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body)
  });
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

// ---------- UI helpers ----------
function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") el.className = v;
    else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2).toLowerCase(), v);
    else el.setAttribute(k, v);
  }
  for (const c of children) {
    if (c == null) continue;
    el.append(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return el;
}

// ---------- page wiring ----------
document.addEventListener("DOMContentLoaded", () => {
  // health (console)
  getJSON("/api/health").then(d => console.log("API health:", d)).catch(()=>{});

  // login.html
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(loginForm);
      try {
        await postJSON("/api/login", { username: fd.get("username"), password: fd.get("password") });
        location.href = "index.html";
      } catch (err) { alert("Login failed: " + err.message); }
    });
  }
  const signupForm = document.getElementById("signupForm");
  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(signupForm);
      try {
        await postJSON("/api/signup", { username: fd.get("username"), password: fd.get("password") });
        location.href = "index.html";
      } catch (err) { alert("Signup failed: " + err.message); }
    });
  }

  // profile.html
  const nameEl = document.getElementById("profileUsername");
  const auraEl = document.getElementById("profileAura");
  const streakEl = document.getElementById("profileStreak");
  if (nameEl || auraEl || streakEl) {
    getJSON("/api/me").then(({ user }) => {
      if (user) {
        if (nameEl) nameEl.textContent = "@" + user.username;
        if (auraEl) auraEl.textContent = user.aura_total ?? 0;
        if (streakEl) streakEl.textContent = user.streak ?? 0;
      } else {
        if (nameEl) nameEl.textContent = "Not logged in";
      }
    }).catch(()=>{});
  }

  // logout (optional button)
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try { await postJSON("/api/logout", {}); location.href = "login.html"; }
      catch (err) { alert("Logout failed: " + err.message); }
    });
  }

  // new post page (new.html)
  const newPostForm = document.getElementById("newPostForm");
  if (newPostForm) {
    newPostForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(newPostForm);
      const text = (fd.get("text") || "").toString().trim();
      if (!text) return alert("Write something first.");
      try {
        await postJSON("/api/posts", { text });
        location.href = "index.html";
      } catch (err) {
        alert("Post failed: " + err.message);
      }
    });
  }

  // feed (index.html) & profile posts
  const feedEl = document.getElementById("feed");
  if (feedEl) loadFeed();

  async function loadFeed() {
    try {
      const { posts } = await getJSON("/api/posts?limit=50");
      feedEl.innerHTML = "";
      if (!posts || posts.length === 0) {
        feedEl.append(h("p", { class: "muted" }, "No posts yet."));
        return;
      }
      for (const p of posts) {
        feedEl.append(renderPost(p));
      }
    } catch (err) {
      feedEl.innerHTML = "";
      feedEl.append(h("p", { class: "muted" }, "Failed to load feed: " + err.message));
    }
  }

  function renderPost(p) {
    const wrap = h("div", { class: "card" });
    const header = h("div", { class: "row" },
      h("strong", {}, "@" + p.author),
      h("span", { class: "muted", style: "margin-left:8px" }, new Date(p.created_at).toLocaleString())
    );
    const body = h("p", {}, p.text);
    const aura = h("div", { class: "muted" }, `Aura: ${p.aura_sum}  •  Votes: ${p.votes_count}`);

    const buttons = [-10, -5, -1, 1, 5, 10, 50].map(v =>
      h("button", {
        class: "vote-btn",
        "data-id": p.id,
        "data-val": v
      }, (v > 0 ? "+" : "") + v)
    );
    const bar = h("div", { class: "vote-bar" }, ...buttons);

    const box = h("div", { class: "post" }, header, body, aura, bar);

    // vote handler (event delegation per post)
    bar.addEventListener("click", async (e) => {
      const btn = e.target.closest("button.vote-btn");
      if (!btn) return;
      const pid = btn.getAttribute("data-id");
      const val = Number(btn.getAttribute("data-val"));
      try {
        await postJSON("/api/vote", { post_id: pid, value: val });
        // refresh just this post by reloading the feed quickly (simple for now)
        await loadFeed();
      } catch (err) {
        alert("Vote failed: " + err.message);
      }
    });

    return box;
  }
});
