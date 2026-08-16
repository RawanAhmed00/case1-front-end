/**
 * TAILORA USER — PROFILE / DASHBOARD PAGE
 * Prefers the aggregate dashboard endpoints where available and falls back
 * to the equivalent resource endpoints, since the docs don't specify which
 * of /dashboard/* vs /trips, /favorites, /bookings a given deployment
 * actually populates.
 */
(function () {
  "use strict";

  const FALLBACK_IMG = "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=500&q=70";

  function initials(name) {
    if (!name) return "T";
    return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
  }

  /* --------------------------- Header / identity --------------------------- */

  async function loadIdentity() {
    let user = window.TL.Auth.getCachedUser();
    try {
      user = await window.TL.Auth.getCurrentUser();
    } catch (e) {
      /* fall back to cached user */
    }
    const name = window.TL.Util.pick(user, ["name", "full_name"], "Traveler");
    const email = window.TL.Util.pick(user, ["email"], "");
    document.getElementById("dash-avatar").textContent = initials(name);
    document.getElementById("dash-name").textContent = name;
    document.getElementById("dash-email").textContent = email;
    const nameInput = document.getElementById("settings-name");
    const emailInput = document.getElementById("settings-email");
    if (nameInput) nameInput.value = name === "Traveler" ? "" : name;
    if (emailInput) emailInput.value = email;
  }

  /* --------------------------- Stats --------------------------- */

  async function loadStats() {
    const mount = document.getElementById("dash-stats");
    mount.innerHTML = Array.from({ length: 4 })
      .map(() => `<div class="tl-card tl-stat-card"><div class="tl-skel" style="height:28px;width:50%;margin-bottom:8px;"></div><div class="tl-skel" style="height:12px;width:70%;"></div></div>`)
      .join("");

    try {
      const response = await window.TL.Dashboard.statistics();
      const stats = window.TL.Util.pick(response, ["data"], response) || {};
      const cards = [
        ["Total Trips", window.TL.Util.pick(stats, ["total_trips"], 0)],
        ["Upcoming", window.TL.Util.pick(stats, ["upcoming_trips"], 0)],
        ["Total Bookings", window.TL.Util.pick(stats, ["total_bookings"], 0)],
        ["Favorites", window.TL.Util.pick(stats, ["total_favorites"], 0)]
      ];
      mount.innerHTML = cards
        .map(([label, value]) => `<div class="tl-card tl-stat-card"><div class="tl-stat-num">${window.TL.Util.escape(value)}</div><div class="tl-stat-label">${label}</div></div>`)
        .join("");
    } catch (err) {
      mount.innerHTML = "";
    }
  }

  /* --------------------------- Trips --------------------------- */

  function tripCard(trip) {
    const title = window.TL.Util.pick(trip, ["title", "name", "destination"], "Untitled trip");
    const destination = window.TL.Util.pick(trip, ["destination", "city.name", "city_name"], "");
    const start = window.TL.Util.pick(trip, ["start_date", "starts_at"], "");
    const end = window.TL.Util.pick(trip, ["end_date", "ends_at"], "");
    const status = window.TL.Util.pick(trip, ["status"], "");
    const id = window.TL.Util.id(trip);
    return `
    <a href="trip-details.html?id=${encodeURIComponent(id)}" class="tl-card" style="padding:20px;display:block;">
      <div class="tl-flex tl-justify-between tl-items-center" style="margin-bottom:8px;">
        <h3 style="font-size:15.5px;">${window.TL.Util.escape(title)}</h3>
        ${status ? `<span class="tl-badge">${window.TL.Util.escape(status)}</span>` : ""}
      </div>
      ${destination ? `<div class="tl-place-meta">📍 ${window.TL.Util.escape(destination)}</div>` : ""}
      ${start || end ? `<div class="tl-place-meta tl-mt-8">🗓️ ${window.TL.Util.escape(start)}${end ? ` – ${window.TL.Util.escape(end)}` : ""}</div>` : ""}
    </a>`;
  }

  async function loadTrips() {
    const gridFull = document.getElementById("trips-grid");
    const gridOverview = document.getElementById("overview-trips");
    gridFull.innerHTML = window.TL.Util.skeletonCards(4);
    gridOverview.innerHTML = window.TL.Util.skeletonCards(2);

    try {
      let response;
      try {
        response = await window.TL.Dashboard.trips();
      } catch (e) {
        response = await window.TL.Trips.all();
      }
      const trips = window.TL.Util.list(response);
      if (!trips.length) {
        const empty = window.TL.Util.emptyState("No trips yet", "Start planning to see your trips here.") +
          `<div class="tl-text-center"><a class="tl-btn tl-btn--primary tl-btn--sm" href="plan-trip.html">Plan a Trip</a></div>`;
        gridFull.innerHTML = empty;
        gridOverview.innerHTML = empty;
        return;
      }
      gridFull.innerHTML = trips.map(tripCard).join("");
      gridOverview.innerHTML = trips.slice(0, 4).map(tripCard).join("");
    } catch (err) {
      gridFull.innerHTML = window.TL.Util.errorState(err.message);
      gridOverview.innerHTML = window.TL.Util.errorState(err.message);
    }
  }

  /* --------------------------- Favorites --------------------------- */

  function favoriteCard(fav) {
    const item = window.TL.Util.pick(fav, ["favoritable", "item"], fav);
    const name = window.TL.Util.name(item, "Saved item");
    const img = window.TL.Util.image(item, FALLBACK_IMG);
    const type = window.TL.Util.pick(fav, ["favoritable_type", "type"], "");
    return `
    <div class="tl-card tl-place-card">
      <div class="tl-place-media">
        <img src="${img}" alt="${window.TL.Util.escape(name)}" loading="lazy" onerror="this.src='${FALLBACK_IMG}'">
        ${type ? `<span class="tl-badge">${window.TL.Util.escape(type)}</span>` : ""}
      </div>
      <div class="tl-place-body">
        <div class="tl-place-title"><h3>${window.TL.Util.escape(name)}</h3></div>
      </div>
    </div>`;
  }

  async function loadFavorites() {
    const grid = document.getElementById("favorites-grid");
    grid.innerHTML = window.TL.Util.skeletonCards(3);
    try {
      let response;
      try {
        response = await window.TL.Dashboard.favorites();
      } catch (e) {
        response = await window.TL.Favorites.all();
      }
      const favorites = window.TL.Util.list(response);
      grid.innerHTML = favorites.length
        ? favorites.map(favoriteCard).join("")
        : window.TL.Util.emptyState("No favorites yet", "Save destinations, hotels, and experiences you love.");
    } catch (err) {
      grid.innerHTML = window.TL.Util.errorState(err.message);
    }
  }

  /* --------------------------- Bookings --------------------------- */

  function bookingCard(booking) {
    const label = window.TL.Util.pick(booking, ["reference", "title", "type"], `Booking #${window.TL.Util.id(booking) || ""}`);
    const status = window.TL.Util.pick(booking, ["status"], "");
    const amount = window.TL.Util.money(window.TL.Util.pick(booking, ["amount", "total", "price"]));
    return `
    <div class="tl-card" style="padding:20px;">
      <div class="tl-flex tl-justify-between tl-items-center">
        <h3 style="font-size:15px;">${window.TL.Util.escape(label)}</h3>
        ${status ? `<span class="tl-badge">${window.TL.Util.escape(status)}</span>` : ""}
      </div>
      ${amount ? `<div class="tl-price tl-mt-8">${window.TL.Util.escape(amount)}</div>` : ""}
      <a href="bookings.html" class="tl-btn tl-btn--outline tl-btn--sm tl-mt-16">Manage</a>
    </div>`;
  }

  async function loadBookings() {
    const grid = document.getElementById("bookings-grid");
    grid.innerHTML = window.TL.Util.skeletonCards(3);
    try {
      let response;
      try {
        response = await window.TL.Dashboard.bookings();
      } catch (e) {
        response = await window.TL.Bookings.all();
      }
      const bookings = window.TL.Util.list(response);
      grid.innerHTML = bookings.length
        ? bookings.map(bookingCard).join("")
        : window.TL.Util.emptyState("No bookings yet", "Bookings you make will show up here.");
    } catch (err) {
      grid.innerHTML = window.TL.Util.errorState(err.message);
    }
  }

  /* --------------------------- Panel switching --------------------------- */

  function wirePanelTabs() {
    document.querySelectorAll("#dash-nav button").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("#dash-nav button").forEach((b) => b.classList.remove("is-active"));
        document.querySelectorAll(".tl-dash-panel").forEach((p) => p.classList.remove("is-active"));
        btn.classList.add("is-active");
        document.querySelector(`.tl-dash-panel[data-panel="${btn.dataset.panel}"]`).classList.add("is-active");
      });
    });
  }

  /* --------------------------- Settings forms --------------------------- */

  function showAlert(id, message, type = "error") {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = message;
    el.className = `tl-auth-alert is-visible${type === "success" ? " tl-auth-alert--success" : ""}`;
  }

  function clearFieldErrors(form) {
    form.querySelectorAll(".tl-field").forEach((f) => {
      f.classList.remove("has-error");
      const err = f.querySelector(".tl-field-error");
      if (err) err.textContent = "";
    });
  }

  function applyValidationErrors(form, errors) {
    Object.entries(errors || {}).forEach(([key, messages]) => {
      const field = document.getElementById(`field-${key}`);
      if (!field) return;
      field.classList.add("has-error");
      const err = field.querySelector(".tl-field-error");
      if (err) err.textContent = Array.isArray(messages) ? messages[0] : messages;
    });
  }

  function wireProfileForm() {
    const form = document.getElementById("profile-form");
    const btn = document.getElementById("profile-save");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearFieldErrors(form);
      document.getElementById("settings-alert").className = "tl-auth-alert";
      btn.disabled = true;
      btn.textContent = "Saving…";
      try {
        const data = new FormData(form);
        const response = await window.TL.Profile.update({ name: data.get("name"), email: data.get("email") });
        const user = window.TL.Util.pick(response, ["user", "data"], response);
        if (user) window.TL.Auth.cacheUser(user);
        showAlert("settings-alert", "Profile updated.", "success");
        loadIdentity();
      } catch (err) {
        if (err && err.name === "ApiValidationError") {
          applyValidationErrors(form, err.errors);
          showAlert("settings-alert", err.message || "Please check the highlighted fields.");
        } else {
          showAlert("settings-alert", (err && err.message) || "Couldn't update your profile.");
        }
      } finally {
        btn.disabled = false;
        btn.textContent = "Save Changes";
      }
    });
  }

  function wirePasswordForm() {
    const form = document.getElementById("password-form");
    const btn = document.getElementById("password-save");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearFieldErrors(form);
      document.getElementById("password-alert").className = "tl-auth-alert";
      btn.disabled = true;
      btn.textContent = "Updating…";
      try {
        const data = new FormData(form);
        await window.TL.Profile.updatePassword({
          current_password: data.get("current_password"),
          password: data.get("password"),
          password_confirmation: data.get("password_confirmation")
        });
        showAlert("password-alert", "Password updated.", "success");
        form.reset();
      } catch (err) {
        if (err && err.name === "ApiValidationError") {
          applyValidationErrors(form, err.errors);
          showAlert("password-alert", err.message || "Please check the highlighted fields.");
        } else {
          showAlert("password-alert", (err && err.message) || "Couldn't update your password.");
        }
      } finally {
        btn.disabled = false;
        btn.textContent = "Update Password";
      }
    });
  }

  function wireDeleteAccount() {
    const btn = document.getElementById("delete-account-btn");
    btn.addEventListener("click", async () => {
      if (!window.confirm("Delete your Tailora account? This can't be undone.")) return;
      btn.disabled = true;
      btn.textContent = "Deleting…";
      try {
        await window.TL.Profile.remove();
        window.TL.Api.clearToken();
        window.location.href = "index.html";
      } catch (err) {
        window.TL.toast(err.message || "Couldn't delete your account.", "error");
        btn.disabled = false;
        btn.textContent = "Delete My Account";
      }
    });
  }

  /* --------------------------- Init --------------------------- */

  function init() {
    const signedOut = document.getElementById("dash-signed-out");
    const shell = document.getElementById("dash-shell");

    if (!window.TL.Auth.isAuthenticated()) {
      signedOut.classList.remove("tl-hidden");
      shell.classList.add("tl-hidden");
      return;
    }

    signedOut.classList.add("tl-hidden");
    shell.classList.remove("tl-hidden");

    loadIdentity();
    loadStats();
    loadTrips();
    loadFavorites();
    loadBookings();
    wirePanelTabs();
    wireProfileForm();
    wirePasswordForm();
    wireDeleteAccount();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
