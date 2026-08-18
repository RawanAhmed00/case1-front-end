(function () {
  "use strict";

  const FALLBACK_IMG = "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=600&q=70";
  const state = { view: "cities", cities: [], countries: [], query: "", region: "" };

  function cardHtml(item, view) {
    const name = window.TL.Util.name(item);
    const country = view === "cities" ? window.TL.Util.country(item) : window.TL.Util.pick(item, ["region"], "");
    const img = window.TL.Util.image(item, FALLBACK_IMG);
    const rating = window.TL.Util.rating(item);
    const id = window.TL.Util.id(item);
    const type = view === "cities" ? "City" : "Country";
    const detailHref = view === "cities" ? `destination-details.html?city=${encodeURIComponent(id)}` : `destination-details.html?country=${encodeURIComponent(id)}`;

    return `
    <div class="tl-card tl-place-card" data-name="${window.TL.Util.escape(name.toLowerCase())}">
      <div class="tl-place-media">
        <a href="${detailHref}"><img src="${img}" alt="${window.TL.Util.escape(name)}" loading="lazy" onerror="this.src='${FALLBACK_IMG}'"></a>
        ${rating ? `<span class="tl-badge">★ ${window.TL.Util.escape(rating)}</span>` : ""}
        <button class="tl-fav-btn" data-fav-id="${id}" data-fav-type="${type}" aria-label="Save to favorites">♡</button>
      </div>
      <div class="tl-place-body">
        <a href="${detailHref}"><div class="tl-place-title"><h3>${window.TL.Util.escape(name)}</h3></div></a>
        ${country ? `<div class="tl-place-meta">📍 ${window.TL.Util.escape(country)}</div>` : ""}
      </div>
    </div>`;
  }

  function render() {
    const grid = document.getElementById("destinations-grid");
    const source = state.view === "cities" ? state.cities : state.countries;

    const filtered = source.filter((item) => {
      const name = window.TL.Util.name(item).toLowerCase();
      const region = window.TL.Util.pick(item, ["region", "country.region"], "");
      const matchesQuery = !state.query || name.includes(state.query.toLowerCase());
      const matchesRegion = !state.region || region === state.region;
      return matchesQuery && matchesRegion;
    });

    if (!filtered.length) {
      grid.innerHTML = window.TL.Util.emptyState("No destinations found", "Try a different search term or region.");
      return;
    }

    grid.innerHTML = filtered.map((item) => cardHtml(item, state.view)).join("");
    wireFavoriteButtons();
  }

  function wireFavoriteButtons() {
    document.querySelectorAll(".tl-fav-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        if (!window.TL.Auth.isAuthenticated()) {
          window.location.href = `signin.html?next=destinations.html`;
          return;
        }
        const id = btn.dataset.favId;
        const type = btn.dataset.favType;
        const isActive = btn.classList.contains("is-active");
        try {
          if (isActive) {
            await window.TL.Favorites.remove(id, type);
            btn.classList.remove("is-active");
            btn.textContent = "♡";
            window.TL.toast("Removed from favorites");
          } else {
            await window.TL.Favorites.add(id, type);
            btn.classList.add("is-active");
            btn.textContent = "♥";
            window.TL.toast("Saved to favorites");
          }
        } catch (err) {
          window.TL.toast(err.message || "Couldn't update favorites", "error");
        }
      });
    });
  }

  async function load() {
    const grid = document.getElementById("destinations-grid");
    grid.innerHTML = window.TL.Util.skeletonCards(9);
    try {
      const [citiesRes, countriesRes] = await Promise.all([window.TL.Cities.all(), window.TL.Countries.all()]);
      state.cities = window.TL.Util.list(citiesRes);
      state.countries = window.TL.Util.list(countriesRes);
      render();
    } catch (err) {
      grid.innerHTML = window.TL.Util.errorState(err.message);
    }
  }

  function wireControls() {
    document.getElementById("dest-search").addEventListener("input", (e) => {
      state.query = e.target.value;
      render();
    });
    document.getElementById("dest-region").addEventListener("change", (e) => {
      state.region = e.target.value;
      render();
    });
    document.querySelectorAll(".tl-pill[data-view]").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".tl-pill[data-view]").forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        state.view = btn.dataset.view;
        render();
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    load();
    wireControls();
  });
})();
