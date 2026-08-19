(function () {
  "use strict";

  const FALLBACK_IMG = "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=600&q=70";

  const state = {
    items: [],
    query: "",
    userFavoriteKeys: new Set()
  };

  function card(item) {
    const name = window.TL.Util.name(item);
    const city = window.TL.Util.city(item) || window.TL.Util.country(item);
    const img = window.TL.Util.image(item, FALLBACK_IMG);
    const rating = window.TL.Util.rating(item);
    const desc = window.TL.Util.description(item);
    const id = window.TL.Util.id(item);
    const isFav = state.userFavoriteKeys.has(`attraction_${id}`);

    return `
    <div class="tl-card tl-place-card">
      <div class="tl-place-media">
        <img src="${img}" alt="${window.TL.Util.escape(name)}" loading="lazy" onerror="this.src='${FALLBACK_IMG}'">
        ${rating ? `<span class="tl-badge">★ ${window.TL.Util.escape(rating)}</span>` : ""}
        <button class="tl-fav-btn ${isFav ? "is-active" : ""}" data-fav-id="${id}" data-fav-type="attraction" aria-label="Save to favorites">${isFav ? "♥" : "♡"}</button>
      </div>
      <div class="tl-place-body">
        <div class="tl-place-title"><h3>${window.TL.Util.escape(name)}</h3></div>
        ${city ? `<div class="tl-place-meta">📍 ${window.TL.Util.escape(city)}</div>` : ""}
        ${desc ? `<p class="tl-place-desc">${window.TL.Util.escape(desc)}</p>` : ""}
      </div>
    </div>`;
  }

  function render() {
    const grid = document.getElementById("experiences-grid");
    const q = state.query.toLowerCase().trim();

    const items = state.items.filter((a) => {
      if (!q) return true;
      const name = window.TL.Util.name(a).toLowerCase();
      const city = (window.TL.Util.city(a) || "").toLowerCase();
      const country = (window.TL.Util.country(a) || "").toLowerCase();
      const desc = (window.TL.Util.description(a) || "").toLowerCase();
      const category = (window.TL.Util.pick(a, ["category", "category_name", "category.name"], "") || "").toLowerCase();

      return name.includes(q) || city.includes(q) || country.includes(q) || desc.includes(q) || category.includes(q);
    });

    grid.innerHTML = items.length ? items.map(card).join("") : window.TL.Util.emptyState("No experiences found", "Try a different search term.");
    wireFav();
  }

  function wireFav() {
    document.querySelectorAll(".tl-fav-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!window.TL.Auth.isAuthenticated()) {
          window.location.href = "signin.html?next=experiences.html";
          return;
        }
        const id = btn.dataset.favId;
        const type = btn.dataset.favType || "attraction";
        const active = btn.classList.contains("is-active");
        try {
          if (active) {
            await window.TL.Favorites.remove(type, id);
            btn.classList.remove("is-active");
            btn.textContent = "♡";
            state.userFavoriteKeys.delete(`attraction_${id}`);
            window.TL.toast("Removed from favorites");
          } else {
            await window.TL.Favorites.add(type, id);
            btn.classList.add("is-active");
            btn.textContent = "♥";
            state.userFavoriteKeys.add(`attraction_${id}`);
            window.TL.toast("Saved to favorites");
          }
        } catch (err) {
          window.TL.toast(err.message || "Couldn't update favorites", "error");
        }
      });
    });
  }

  async function syncUserFavorites() {
    if (!window.TL.Auth.isAuthenticated()) return;
    try {
      const response = await window.TL.Favorites.all();
      const rawFavs = window.TL.Util.list(response);
      rawFavs.forEach((f) => {
        const item = window.TL.Util.pick(f, ["favoritable", "item"], f);
        const favId = window.TL.Util.pick(f, ["favoritable_id"], window.TL.Util.id(item));
        const type = String(window.TL.Util.pick(f, ["favoritable_type", "type"], "")).toLowerCase();
        if (favId && type === "attraction") {
          state.userFavoriteKeys.add(`attraction_${favId}`);
        }
      });
    } catch (e) {}
  }

  async function load() {
    const grid = document.getElementById("experiences-grid");
    grid.innerHTML = window.TL.Util.skeletonCards(9);
    try {
      await syncUserFavorites();
      const attractionsRes = await window.TL.Attractions.all({ per_page: 100 });
      const rawAttractions = window.TL.Util.list(attractionsRes);
      state.items = window.TL.Util.uniqueBy(rawAttractions, (a) => window.TL.Util.name(a));
      render();
    } catch (err) {
      grid.innerHTML = window.TL.Util.errorState(err.message);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    load();
    let debounce;
    document.getElementById("exp-search").addEventListener("input", (e) => {
      clearTimeout(debounce);
      state.query = e.target.value;
      debounce = setTimeout(() => {
        render();
      }, 150);
    });
  });
})();
