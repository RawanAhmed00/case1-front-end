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
  cuisine: ""
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
    const cuisine = window.TL.Util.pick(item, ["cuisine", "cuisine_type"], "");
    const price = window.TL.Util.money(window.TL.Util.price(item));
    const id = window.TL.Util.id(item);

    return `
    <div class="tl-card tl-place-card">
      <div class="tl-place-media">
        <img src="${img}" alt="${window.TL.Util.escape(name)}" loading="lazy" onerror="this.src='${FALLBACK_IMG}'">
        ${cuisine ? `<span class="tl-badge">${window.TL.Util.escape(cuisine)}</span>` : ""}
        <button class="tl-fav-btn" data-fav-id="${id}" data-fav-type="Restaurant" aria-label="Save to favorites">♡</button>
      </div>
      <div class="tl-place-body">
        <div class="tl-place-title"><h3>${window.TL.Util.escape(name)}</h3>${rating ? `<span class="tl-rating">★ ${window.TL.Util.escape(rating)}</span>` : ""}</div>
        ${city ? `<div class="tl-place-meta">📍 ${window.TL.Util.escape(city)}</div>` : ""}
        <div class="tl-place-foot">
          ${price ? `<span class="tl-price">${window.TL.Util.escape(price)} <span>avg</span></span>` : `<span></span>`}
        </div>
      </div>
    </div>`;
  }

  function populateCuisines() {
    const select = document.getElementById("rest-cuisine");
    const cuisines = Array.from(
      new Set(state.items.map((r) => window.TL.Util.pick(r, ["cuisine", "cuisine_type"], "")).filter(Boolean))
    ).sort();
    cuisines.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c;
      opt.textContent = c;
      select.appendChild(opt);
    });
  }

  function render() {
    const grid = document.getElementById("restaurants-grid");
    const items = state.items.filter((r) => {
      const hay = `${window.TL.Util.name(r)} ${window.TL.Util.pick(r, ["cuisine", "cuisine_type"], "")} ${window.TL.Util.city(r)}`.toLowerCase();
      const matchesQuery = !state.query || hay.includes(state.query.toLowerCase());
      const matchesCuisine = !state.cuisine || window.TL.Util.pick(r, ["cuisine", "cuisine_type"], "") === state.cuisine;
      return matchesQuery && matchesCuisine;
    });

    grid.innerHTML = items.length ? items.map(card).join("") : window.TL.Util.emptyState("No restaurants found", "Try a different search or cuisine.");
    wireFav();
  }

  function wireFav() {
    document.querySelectorAll(".tl-fav-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!window.TL.Auth.isAuthenticated()) {
          window.location.href = "signin.html?next=restaurants.html";
          return;
        }
        const id = btn.dataset.favId;
        const type = btn.dataset.favType;
        const active = btn.classList.contains("is-active");
        try {
          if (active) {
            await window.TL.Favorites.remove(id, type);
            btn.classList.remove("is-active");
            btn.textContent = "♡";
          } else {
            await window.TL.Favorites.add(id, type);
            btn.classList.add("is-active");
            btn.textContent = "♥";
          }
        } catch (err) {
          window.TL.toast(err.message || "Couldn't update favorites", "error");
        }
      });
    });
  }

  async function load() {
    const grid = document.getElementById("restaurants-grid");
    grid.innerHTML = window.TL.Util.skeletonCards(9);
    try {
      const response = await window.TL.Restaurants.all();
      state.items = window.TL.Util.list(response);
      populateCuisines();
      render();
    } catch (err) {
      grid.innerHTML = window.TL.Util.errorState(err.message);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    load();
    document.getElementById("rest-search").addEventListener("input", (e) => {
      state.query = e.target.value;
      render();
    });
    document.getElementById("rest-cuisine").addEventListener("change", (e) => {
      state.cuisine = e.target.value;
      render();
    });
  });
})();
