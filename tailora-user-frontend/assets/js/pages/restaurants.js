(function () {
  "use strict";
  const FALLBACK_IMG = "assets/images/restaurants/restaurant-1.jpg";

  const RESTAURANT_IMAGES = [
    "assets/images/restaurants/restaurant-1.jpg",
    "assets/images/restaurants/restaurant-2.jpg",
    "assets/images/restaurants/restaurant-3.jpg",
    "assets/images/restaurants/restaurant-4.jpg",
    "assets/images/restaurants/restaurant-5.jpg",
    "assets/images/restaurants/restaurant-6.jpg",
    "assets/images/restaurants/restaurant-7.jpg",
    "assets/images/restaurants/restaurant-8.jpg",
    "assets/images/restaurants/restaurant-9.jpg",
    "assets/images/restaurants/restaurant-10.jpg",
    "assets/images/restaurants/restaurant-11.jpg",
    "assets/images/restaurants/restaurant-12.jpg"
  ];

  const state = {
    items: [],
    query: "",
    page: 1,
    lastPage: 1,
    userFavoriteKeys: new Set()
  };

  function getRestaurantImage(item) {
    const id = Number(window.TL.Util.id(item));
    if (!Number.isNaN(id) && id > 0) {
      return RESTAURANT_IMAGES[(id - 1) % RESTAURANT_IMAGES.length];
    }
    return RESTAURANT_IMAGES[0];
  }

  function card(item) {
    const name = window.TL.Util.name(item);
    const city = window.TL.Util.city(item) || window.TL.Util.country(item);
    const img = getRestaurantImage(item);
    const rating = window.TL.Util.rating(item);
    const price = window.TL.Util.money(window.TL.Util.price(item));
    const id = window.TL.Util.id(item);
    const isFav = state.userFavoriteKeys.has(`restaurant_${id}`);

    return `
    <div class="tl-card tl-place-card">
      <div class="tl-place-media">
        <img src="${img}" alt="${window.TL.Util.escape(name)}" loading="lazy" onerror="this.src='${FALLBACK_IMG}'">
        ${rating ? `<span class="tl-badge">★ ${window.TL.Util.escape(rating)}</span>` : ""}
        <button class="tl-fav-btn ${isFav ? "is-active" : ""}" data-fav-id="${id}" data-fav-type="restaurant" aria-label="Save to favorites">${isFav ? "♥" : "♡"}</button>
      </div>
      <div class="tl-place-body">
        <div class="tl-place-title"><h3>${window.TL.Util.escape(name)}</h3></div>
        ${city ? `<div class="tl-place-meta">📍 ${window.TL.Util.escape(city)}</div>` : ""}
        <div class="tl-place-foot">
          ${price ? `<span class="tl-price">${window.TL.Util.escape(price)} <span>avg</span></span>` : `<span></span>`}
        </div>
      </div>
    </div>`;
  }

  function renderPagination() {
    let bar = document.getElementById("restaurants-pagination");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "restaurants-pagination";
      bar.className = "tl-pagination";
      document.getElementById("restaurants-grid").insertAdjacentElement("afterend", bar);
    }

    if (state.lastPage <= 1) {
      bar.innerHTML = "";
      return;
    }

    const current = state.page;
    const last = state.lastPage;

    const pages = new Set([1, last, current, current - 1, current + 1]);
    const sorted = Array.from(pages).filter((p) => p >= 1 && p <= last).sort((a, b) => a - b);

    let html = `<button class="tl-page-btn" data-page="${current - 1}" ${current <= 1 ? "disabled" : ""} aria-label="Previous page">‹</button>`;

    let prev = 0;
    sorted.forEach((p) => {
      if (prev && p - prev > 1) {
        html += `<span class="tl-page-ellipsis">…</span>`;
      }
      html += `<button class="tl-page-btn${p === current ? " is-active" : ""}" data-page="${p}" ${p === current ? 'aria-current="page"' : ""}>${p}</button>`;
      prev = p;
    });

    html += `<button class="tl-page-btn" data-page="${current + 1}" ${current >= last ? "disabled" : ""} aria-label="Next page">›</button>`;

    bar.innerHTML = html;

    bar.querySelectorAll(".tl-page-btn[data-page]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const page = Number(btn.dataset.page);
        if (!page || page < 1 || page > state.lastPage || page === state.page) return;
        load(page);
      });
    });
  }

  function render() {
    const grid = document.getElementById("restaurants-grid");
    const q = state.query.toLowerCase().trim();
    const items = state.items.filter((r) => {
      if (!q) return true;
      const hay = `${window.TL.Util.name(r)} ${window.TL.Util.city(r)} ${window.TL.Util.country(r)} ${window.TL.Util.pick(r, ['address', 'locality'], '')}`.toLowerCase();
      return hay.includes(q);
    });

    grid.innerHTML = items.length ? items.map(card).join("") : window.TL.Util.emptyState("No restaurants found", "Try a different search term.");
    wireFav();
    renderPagination();
  }

  function wireFav() {
    document.querySelectorAll(".tl-fav-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!window.TL.Auth.isAuthenticated()) {
          window.location.href = "signin.html?next=restaurants.html";
          return;
        }
        const id = btn.dataset.favId;
        const type = btn.dataset.favType || "restaurant";
        const active = btn.classList.contains("is-active");
        try {
          if (active) {
            await window.TL.Favorites.remove(type, id);
            btn.classList.remove("is-active");
            btn.textContent = "♡";
            state.userFavoriteKeys.delete(`restaurant_${id}`);
            window.TL.toast("Removed from favorites");
          } else {
            await window.TL.Favorites.add(type, id);
            btn.classList.add("is-active");
            btn.textContent = "♥";
            state.userFavoriteKeys.add(`restaurant_${id}`);
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
        if (favId && type === "restaurant") {
          state.userFavoriteKeys.add(`restaurant_${favId}`);
        }
      });
    } catch (e) {}
  }

  async function load(page = 1) {
    const grid = document.getElementById("restaurants-grid");
    grid.innerHTML = window.TL.Util.skeletonCards(9);
    try {
      await syncUserFavorites();
      const response = await window.TL.Restaurants.all({ page });
      const rawRestaurants = window.TL.Util.list(response);
      state.items = window.TL.Util.uniqueBy(rawRestaurants, (r) => `${window.TL.Util.name(r)}_${window.TL.Util.pick(r, ['address', 'locality', 'city'], '')}`);

      const meta = response && response.meta ? response.meta : null;
      state.page = meta && meta.current_page ? meta.current_page : page;
      state.lastPage = meta && meta.last_page ? meta.last_page : 1;

      render();
      document.getElementById("restaurants-grid").scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (err) {
      grid.innerHTML = window.TL.Util.errorState(err.message);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    load();
    let debounce;
    document.getElementById("rest-search").addEventListener("input", (e) => {
      clearTimeout(debounce);
      state.query = e.target.value;
      debounce = setTimeout(() => {
        render();
      }, 150);
    });
  });
})();