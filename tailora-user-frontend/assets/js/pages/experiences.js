(function () {
  "use strict";

  
  const FALLBACK_IMG = "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=600&q=70";
  
  const state = { items: [], query: "", category: "" };

  function card(item) {
    const name = window.TL.Util.name(item);
    const city = window.TL.Util.city(item) || window.TL.Util.country(item);
    const img = window.TL.Util.image(item, FALLBACK_IMG);
    const rating = window.TL.Util.rating(item);
    const desc = window.TL.Util.description(item);
    const id = window.TL.Util.id(item);

    return `
    <div class="tl-card tl-place-card">
      <div class="tl-place-media">
        <img src="${img}" alt="${window.TL.Util.escape(name)}" loading="lazy" onerror="this.src='${FALLBACK_IMG}'">
        ${rating ? `<span class="tl-badge">★ ${window.TL.Util.escape(rating)}</span>` : ""}
        <button class="tl-fav-btn" data-fav-id="${id}" data-fav-type="attraction" aria-label="Save to favorites">♡</button>
      </div>
      <div class="tl-place-body">
        <div class="tl-place-title"><h3>${window.TL.Util.escape(name)}</h3></div>
        ${city ? `<div class="tl-place-meta">📍 ${window.TL.Util.escape(city)}</div>` : ""}
        ${desc ? `<p class="tl-place-desc">${window.TL.Util.escape(desc)}</p>` : ""}
      </div>
    </div>`;
  }

  function populateCategories(categories) {
    const row = document.getElementById("exp-categories");
    const cats = window.TL.Util.list(categories);
    cats.forEach((c) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tl-pill";
      btn.dataset.cat = window.TL.Util.name(c);
      btn.textContent = window.TL.Util.name(c);
      row.appendChild(btn);
    });
    wireCategoryChips();
  }

  function wireCategoryChips() {
    document.querySelectorAll("#exp-categories .tl-pill").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("#exp-categories .tl-pill").forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        state.category = btn.dataset.cat;
        render();
      });
    });
  }

  function render() {
    const grid = document.getElementById("experiences-grid");
    const items = state.items.filter((a) => {
      const hay = `${window.TL.Util.name(a)} ${window.TL.Util.description(a)}`.toLowerCase();
      const matchesQuery = !state.query || hay.includes(state.query.toLowerCase());
      const category = window.TL.Util.pick(a, ["category", "category_name", "category.name"], "");
      const matchesCategory = !state.category || category === state.category;
      return matchesQuery && matchesCategory;
    });
    grid.innerHTML = items.length ? items.map(card).join("") : window.TL.Util.emptyState("No experiences found", "Try a different search or category.");
    wireFav();
  }

  function wireFav() {
    document.querySelectorAll(".tl-fav-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!window.TL.Auth.isAuthenticated()) {
          window.location.href = "signin.html?next=experiences.html";
          return;
        }
        const id = btn.dataset.favId;
        const type = btn.dataset.favType;
        const active = btn.classList.contains("is-active");
        try {
          if (active) {
            await window.TL.Favorites.remove(type, id);
            btn.classList.remove("is-active");
            btn.textContent = "♡";
          } else {
            await window.TL.Favorites.add(type, id);
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
    const grid = document.getElementById("experiences-grid");
    grid.innerHTML = window.TL.Util.skeletonCards(9);
    try {
      const [attractionsRes, categoriesRes] = await Promise.all([window.TL.Attractions.all(), window.TL.Categories.all().catch(() => [])]);
      state.items = window.TL.Util.list(attractionsRes);
      populateCategories(categoriesRes);
      render();
    } catch (err) {
      grid.innerHTML = window.TL.Util.errorState(err.message);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    load();
    document.getElementById("exp-search").addEventListener("input", (e) => {
      state.query = e.target.value;
      render();
    });
  });
})();
