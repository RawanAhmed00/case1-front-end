(function () {
  "use strict";

  const FALLBACK_IMG = "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=600&q=70";
  const state = { items: [], query: "", sort: "" };

  function card(item) {
    const name = window.TL.Util.name(item);
    const city = window.TL.Util.city(item) || window.TL.Util.country(item);
    const img = window.TL.Util.image(item, FALLBACK_IMG);
    const rating = window.TL.Util.rating(item);
    const price = window.TL.Util.money(window.TL.Util.price(item));
    const amenities = window.TL.Util.pick(item, ["amenities"], []);
    const id = window.TL.Util.id(item);

    return `
    <div class="tl-card tl-place-card">
      <div class="tl-place-media">
        <img src="${img}" alt="${window.TL.Util.escape(name)}" loading="lazy" onerror="this.src='${FALLBACK_IMG}'">
        ${rating ? `<span class="tl-badge">★ ${window.TL.Util.escape(rating)}</span>` : ""}
        <button class="tl-fav-btn" data-fav-id="${id}" data-fav-type="Hotel" aria-label="Save to favorites">♡</button>
      </div>
      <div class="tl-place-body">
        <div class="tl-place-title"><h3>${window.TL.Util.escape(name)}</h3></div>
        ${city ? `<div class="tl-place-meta">📍 ${window.TL.Util.escape(city)}</div>` : ""}
        ${
          Array.isArray(amenities) && amenities.length
            ? `<div class="tl-amenity-chips">${amenities
                .slice(0, 4)
                .map((a) => `<span>${window.TL.Util.escape(typeof a === "string" ? a : a.name || "")}</span>`)
                .join("")}</div>`
            : ""
        }
        <div class="tl-place-foot">
          ${price ? `<span class="tl-price">${window.TL.Util.escape(price)} <span>/ night</span></span>` : `<span></span>`}
          <button class="tl-btn tl-btn--sm tl-btn--outline" onclick="window.location.href='hotels.html'">View</button>
        </div>
      </div>
    </div>`;
  }

  function render() {
    const grid = document.getElementById("hotels-grid");
    let items = state.items.filter((h) => {
      const hay = `${window.TL.Util.name(h)} ${window.TL.Util.city(h)} ${window.TL.Util.country(h)}`.toLowerCase();
      return !state.query || hay.includes(state.query.toLowerCase());
    });

    if (state.sort === "price-asc") items = [...items].sort((a, b) => (window.TL.Util.price(a) || 0) - (window.TL.Util.price(b) || 0));
    if (state.sort === "price-desc") items = [...items].sort((a, b) => (window.TL.Util.price(b) || 0) - (window.TL.Util.price(a) || 0));
    if (state.sort === "rating-desc") items = [...items].sort((a, b) => (window.TL.Util.rating(b) || 0) - (window.TL.Util.rating(a) || 0));

    grid.innerHTML = items.length ? items.map(card).join("") : window.TL.Util.emptyState("No hotels found", "Try a different search term.");
    wireFav();
  }

  function wireFav() {
    document.querySelectorAll(".tl-fav-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!window.TL.Auth.isAuthenticated()) {
          window.location.href = "signin.html?next=hotels.html";
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
    const grid = document.getElementById("hotels-grid");
    grid.innerHTML = window.TL.Util.skeletonCards(9);
    try {
      const response = await window.TL.Hotels.all();
      state.items = window.TL.Util.list(response);
      render();
    } catch (err) {
      grid.innerHTML = window.TL.Util.errorState(err.message);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    load();
    document.getElementById("hotel-search").addEventListener("input", (e) => {
      state.query = e.target.value;
      render();
    });
    document.getElementById("hotel-sort").addEventListener("change", (e) => {
      state.sort = e.target.value;
      render();
    });
  });
})();
