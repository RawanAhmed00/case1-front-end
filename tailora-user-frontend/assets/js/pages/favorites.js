/**
 * TAILORA USER — FAVORITES PAGE
 * GET /favorites, DELETE /favorites (favoritable_id + favoritable_type)
 */
(function () {
  "use strict";

  const FALLBACK_IMG = "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=500&q=70";
  const state = { items: [], type: "" };

  function card(fav) {
    const item = window.TL.Util.pick(fav, ["favoritable", "item"], fav);
    const name = window.TL.Util.name(item, "Saved item");
    const img = window.TL.Util.image(item, FALLBACK_IMG);
    const type = window.TL.Util.pick(fav, ["favoritable_type", "type"], "");
    const favoritableId = window.TL.Util.pick(fav, ["favoritable_id"], window.TL.Util.id(item));
    const city = window.TL.Util.city(item) || window.TL.Util.country(item);

    return `
    <div class="tl-card tl-place-card">
      <div class="tl-place-media">
        <img src="${img}" alt="${window.TL.Util.escape(name)}" loading="lazy" onerror="this.src='${FALLBACK_IMG}'">
        ${type ? `<span class="tl-badge">${window.TL.Util.escape(type)}</span>` : ""}
        <button class="tl-fav-btn is-active" data-fav-id="${window.TL.Util.escape(favoritableId)}" data-fav-type="${window.TL.Util.escape(type)}" aria-label="Remove from favorites">♥</button>
      </div>
      <div class="tl-place-body">
        <div class="tl-place-title"><h3>${window.TL.Util.escape(name)}</h3></div>
        ${city ? `<div class="tl-place-meta">📍 ${window.TL.Util.escape(city)}</div>` : ""}
      </div>
    </div>`;
  }

  function render() {
    const grid = document.getElementById("favorites-grid");
    const items = state.type ? state.items.filter((f) => window.TL.Util.pick(f, ["favoritable_type", "type"], "") === state.type) : state.items;
    grid.innerHTML = items.length
      ? items.map(card).join("")
      : window.TL.Util.emptyState("No favorites yet", "Save destinations, hotels, restaurants, and experiences you love to see them here.") +
        `<div class="tl-text-center"><a class="tl-btn tl-btn--primary tl-btn--sm" href="destinations.html">Browse Destinations</a></div>`;
    wireRemove();
  }

  function renderTypeFilter() {
    const row = document.getElementById("fav-type-filter");
    const types = Array.from(new Set(state.items.map((f) => window.TL.Util.pick(f, ["favoritable_type", "type"], "")).filter(Boolean)));
    types.forEach((t) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tl-pill";
      btn.dataset.type = t;
      btn.textContent = t;
      row.appendChild(btn);
    });
    row.querySelectorAll("button[data-type]").forEach((btn) => {
      btn.addEventListener("click", () => {
        row.querySelectorAll("button").forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        state.type = btn.dataset.type;
        render();
      });
    });
  }

  function wireRemove() {
    document.querySelectorAll(".tl-fav-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.favId;
        const type = btn.dataset.favType;
        btn.disabled = true;
        try {
          await window.TL.Favorites.remove(id, type);
          state.items = state.items.filter(
            (f) => String(window.TL.Util.pick(f, ["favoritable_id"], "")) !== String(id)
          );
          window.TL.toast("Removed from favorites");
          render();
        } catch (err) {
          window.TL.toast(err.message || "Couldn't remove favorite", "error");
          btn.disabled = false;
        }
      });
    });
  }

  async function load() {
    const grid = document.getElementById("favorites-grid");
    grid.innerHTML = window.TL.Util.skeletonCards(6);
    try {
      const response = await window.TL.Favorites.all();
      const rawFavs = window.TL.Util.list(response);
      state.items = window.TL.Util.uniqueBy(rawFavs, (f) => {
        const item = window.TL.Util.pick(f, ["favoritable", "item"], f);
        const favoritableId = window.TL.Util.pick(f, ["favoritable_id"], window.TL.Util.id(item));
        const type = window.TL.Util.pick(f, ["favoritable_type", "type"], "");
        return `${type}_${favoritableId}`;
      });
      renderTypeFilter();
      render();
    } catch (err) {
      grid.innerHTML = window.TL.Util.errorState(err.message);
    }
  }

  function init() {
    const signedOut = document.getElementById("fav-signed-out");
    const filter = document.getElementById("fav-type-filter");
    const grid = document.getElementById("favorites-grid");

    if (!window.TL.Auth.isAuthenticated()) {
      signedOut.classList.remove("tl-hidden");
      filter.classList.add("tl-hidden");
      grid.classList.add("tl-hidden");
      return;
    }
    load();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
