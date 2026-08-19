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

  function loadStats(tripsCount = 0, favsCount = 0) {
    const mount = document.getElementById("dash-stats");
    if (!mount) return;
    const cards = [
      ["Total Trips", tripsCount],
      ["Favorites", favsCount]
    ];
    mount.innerHTML = cards
      .map(([label, value]) => `<div class="tl-card tl-stat-card"><div class="tl-stat-num">${window.TL.Util.escape(value)}</div><div class="tl-stat-label">${label}</div></div>`)
      .join("");
  }

  function formatModelType(type) {
    if (!type) return "";
    const cleaned = String(type).split("\\").pop().split("/").pop().trim().toLowerCase();
    if (cleaned.includes("restaurant")) return "Restaurant";
    if (cleaned.includes("attraction") || cleaned.includes("experience")) return "Experience";
    if (cleaned.includes("hotel")) return "Hotel";
    if (cleaned.includes("city")) return "City";
    if (cleaned.includes("country")) return "Country";
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  let countriesMap = {};

  async function ensureCountriesMap() {
    if (Object.keys(countriesMap).length > 0) return countriesMap;
    try {
      if (window.TL && window.TL.Countries && typeof window.TL.Countries.all === "function") {
        const response = await window.TL.Countries.all({ per_page: 100 });
        const list = window.TL.Util.list(response);
        list.forEach((c) => {
          const id = window.TL.Util.id(c);
          const name = window.TL.Util.name(c);
          if (id && name) countriesMap[String(id)] = name;
        });
      }
    } catch (e) {}
    return countriesMap;
  }

  function extractCountryName(trip) {
    if (!trip) return "Trip";

    // 1. Direct country fields on trip
    const country = window.TL.Util.pick(trip, [
      "country.name",
      "country_name",
      "countryName"
    ], "");
    if (typeof country === "string" && country.trim() && country.toLowerCase() !== "destination" && country.toLowerCase() !== "custom trip") {
      return country.trim();
    }
    if (trip.country && typeof trip.country === "object" && trip.country.name) {
      return String(trip.country.name).trim();
    }
    if (typeof trip.country === "string" && trip.country.trim() && trip.country.toLowerCase() !== "destination" && trip.country.toLowerCase() !== "custom trip") {
      return trip.country.trim();
    }

    // 2. Lookup by country_id
    const countryId = window.TL.Util.pick(trip, ["country_id", "countryId"], null);
    if (countryId && countriesMap[String(countryId)]) {
      return countriesMap[String(countryId)];
    }

    // 3. Country from destination or city object
    const dest = window.TL.Util.pick(trip, ["destination", "city"], null);
    if (dest && typeof dest === "object") {
      const cName = window.TL.Util.pick(dest, ["country.name", "country_name", "country"], "");
      if (typeof cName === "string" && cName.trim() && cName.toLowerCase() !== "destination") {
        return cName.trim();
      }
    }

    // 4. Country from days array
    const days = window.TL.Util.pick(trip, ["days", "trip_days", "tripDays", "itinerary"], []);
    if (Array.isArray(days) && days.length > 0) {
      for (const day of days) {
        const dayCountry = window.TL.Util.pick(day, [
          "country.name",
          "country_name",
          "country",
          "city.country.name",
          "city.country_name",
          "city.country"
        ], "");
        if (typeof dayCountry === "string" && dayCountry.trim() && dayCountry.toLowerCase() !== "destination" && dayCountry.toLowerCase() !== "custom trip") {
          return dayCountry.trim();
        }
      }
    }

    // 5. Title if contains actual country name
    const rawTitle = String(window.TL.Util.pick(trip, ["title", "name"], "")).trim();
    if (rawTitle && !rawTitle.toLowerCase().startsWith("untitled") && !rawTitle.toLowerCase().startsWith("trip #") && !rawTitle.toLowerCase().startsWith("custom trip") && rawTitle.toLowerCase() !== "destination" && rawTitle.toLowerCase() !== "your trip") {
      const cleaned = rawTitle.replace(/^trip to\s+/i, "").replace(/\s+trip$/i, "").trim();
      if (cleaned && cleaned.toLowerCase() !== "destination" && cleaned.toLowerCase() !== "custom trip") {
        return cleaned;
      }
    }

    // 6. Direct destination string if valid
    if (typeof trip.destination === "string" && trip.destination.trim() && trip.destination.toLowerCase() !== "destination" && trip.destination.toLowerCase() !== "custom trip") {
      return trip.destination.trim();
    }

    return "Trip";
  }

  /* --------------------------- Trips --------------------------- */

  function tripCard(trip) {
    const id = window.TL.Util.id(trip);
    const countryName = extractCountryName(trip);

    const start = window.TL.Util.pick(trip, ["start_date", "starts_at"], "");
    const end = window.TL.Util.pick(trip, ["end_date", "ends_at"], "");
    const status = window.TL.Util.pick(trip, ["status"], "");
    
    const formattedStart = start ? window.TL.Util.formatDate(start) : "";
    const formattedEnd = end ? window.TL.Util.formatDate(end) : "";
    
    return `
    <a href="trip-details.html?id=${encodeURIComponent(id)}" class="tl-card" style="padding:20px;display:block;">
      <div class="tl-flex tl-justify-between tl-items-center" style="margin-bottom:8px;">
        <h3 style="font-size:16px;font-weight:700;">${window.TL.Util.escape(countryName)}</h3>
        ${status ? `<span class="tl-badge">${window.TL.Util.escape(status)}</span>` : ""}
      </div>
      ${countryName && countryName !== "Trip" ? `<div class="tl-place-meta">📍 ${window.TL.Util.escape(countryName)}</div>` : ""}
      ${formattedStart || formattedEnd ? `<div class="tl-place-meta tl-mt-8">🗓️ ${formattedStart}${formattedEnd ? ` – ${formattedEnd}` : ""}</div>` : ""}
    </a>`;
  }

  async function loadTrips() {
    const gridFull = document.getElementById("trips-grid");
    if (gridFull) gridFull.innerHTML = window.TL.Util.skeletonCards(4);

    try {
      await ensureCountriesMap();

      let response;
      if (window.TL.Trips && typeof window.TL.Trips.all === "function") {
        response = await window.TL.Trips.all();
      } else {
        response = await window.TL.Api.get("/trips");
      }
      const rawTrips = window.TL.Util.list(response);
      const trips = window.TL.Util.uniqueBy(rawTrips, (t) => window.TL.Util.id(t));
      if (!trips.length) {
        const empty = window.TL.Util.emptyState("No trips yet", "Start planning to see your trips here.") +
          `<div class="tl-text-center"><a class="tl-btn tl-btn--primary tl-btn--sm" href="plan-trip.html">Plan a Trip</a></div>`;
        if (gridFull) gridFull.innerHTML = empty;
        return [];
      }
      if (gridFull) gridFull.innerHTML = trips.map(tripCard).join("");
      return trips;
    } catch (err) {
      if (gridFull) gridFull.innerHTML = window.TL.Util.errorState(err.message);
      return [];
    }
  }

  /* --------------------------- Favorites --------------------------- */

  function favoriteCard(fav) {
    const item = window.TL.Util.pick(fav, ["favoritable", "item"], fav);
    const name = window.TL.Util.name(item, "Saved item");
    const img = window.TL.Util.image(item, FALLBACK_IMG);
    const rawType = window.TL.Util.pick(fav, ["favoritable_type", "type"], "");
    const type = formatModelType(rawType);
    const city = window.TL.Util.city(item) || window.TL.Util.country(item);

    return `
    <div class="tl-card tl-place-card">
      <div class="tl-place-media">
        <img src="${img}" alt="${window.TL.Util.escape(name)}" loading="lazy" onerror="this.src='${FALLBACK_IMG}'">
        ${type ? `<span class="tl-badge">${window.TL.Util.escape(type)}</span>` : ""}
      </div>
      <div class="tl-place-body">
        <div class="tl-place-title"><h3>${window.TL.Util.escape(name)}</h3></div>
        ${city ? `<div class="tl-place-meta">📍 ${window.TL.Util.escape(city)}</div>` : ""}
      </div>
    </div>`;
  }

  async function loadFavorites() {
    const grid = document.getElementById("favorites-grid");
    if (grid) grid.innerHTML = window.TL.Util.skeletonCards(3);
    try {
      let response;
      if (window.TL.Favorites && typeof window.TL.Favorites.all === "function") {
        response = await window.TL.Favorites.all();
      } else {
        response = await window.TL.Api.get("/favorites");
      }
      const rawFavorites = window.TL.Util.list(response);
      const favorites = window.TL.Util.uniqueBy(rawFavorites, (f) => {
        const item = window.TL.Util.pick(f, ["favoritable", "item"], f);
        const favoritableId = window.TL.Util.pick(f, ["favoritable_id"], window.TL.Util.id(item));
        const type = window.TL.Util.pick(f, ["favoritable_type", "type"], "");
        return `${type}_${favoritableId}`;
      });
      if (grid) {
        grid.innerHTML = favorites.length
          ? favorites.map(favoriteCard).join("")
          : window.TL.Util.emptyState("No favorites yet", "Save destinations, hotels, and experiences you love.");
      }
      return favorites;
    } catch (err) {
      if (grid) grid.innerHTML = window.TL.Util.errorState(err.message);
      return [];
    }
  }

  /* --------------------------- Panel switching --------------------------- */

  function wirePanelTabs() {
    document.querySelectorAll("#dash-nav button").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("#dash-nav button").forEach((b) => b.classList.remove("is-active"));
        document.querySelectorAll(".tl-dash-panel").forEach((p) => p.classList.remove("is-active"));
        btn.classList.add("is-active");
        const panel = document.querySelector(`.tl-dash-panel[data-panel="${btn.dataset.panel}"]`);
        if (panel) panel.classList.add("is-active");
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

  async function init() {
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
    wirePanelTabs();
    wireProfileForm();
    wirePasswordForm();
    wireDeleteAccount();

    const [trips, favorites] = await Promise.all([
      loadTrips().catch(() => []),
      loadFavorites().catch(() => [])
    ]);

    loadStats(
      Array.isArray(trips) ? trips.length : 0,
      Array.isArray(favorites) ? favorites.length : 0
    );
  }

  document.addEventListener("DOMContentLoaded", init);
})();
