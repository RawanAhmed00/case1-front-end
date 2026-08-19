(function () {
  "use strict";

  const FALLBACK_IMG = "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=600&q=70";

  const COUNTRY_REGION_MAP = {
    "egypt": "Africa", "south africa": "Africa", "morocco": "Africa", "kenya": "Africa", "nigeria": "Africa", "tunisia": "Africa", "ghana": "Africa", "tanzania": "Africa", "algeria": "Africa", "ethiopia": "Africa", "uganda": "Africa", "senegal": "Africa",
    "united states": "Americas", "usa": "Americas", "canada": "Americas", "brazil": "Americas", "mexico": "Americas", "argentina": "Americas", "colombia": "Americas", "peru": "Americas", "chile": "Americas", "cuba": "Americas", "costa rica": "Americas", "panama": "Americas", "dominican republic": "Americas",
    "france": "Europe", "germany": "Europe", "italy": "Europe", "spain": "Europe", "united kingdom": "Europe", "uk": "Europe", "turkey": "Europe", "netherlands": "Europe", "greece": "Europe", "portugal": "Europe", "austria": "Europe", "switzerland": "Europe", "czech republic": "Europe", "ireland": "Europe", "belgium": "Europe", "sweden": "Europe", "norway": "Europe", "denmark": "Europe", "finland": "Europe", "poland": "Europe", "hungary": "Europe", "croatia": "Europe",
    "japan": "Asia", "china": "Asia", "united arab emirates": "Asia", "uae": "Asia", "saudi arabia": "Asia", "qatar": "Asia", "thailand": "Asia", "singapore": "Asia", "malaysia": "Asia", "south korea": "Asia", "korea": "Asia", "india": "Asia", "indonesia": "Asia", "vietnam": "Asia", "philippines": "Asia", "maldives": "Asia", "sri lanka": "Asia", "taiwan": "Asia", "hong kong": "Asia", "jordan": "Asia", "lebanon": "Asia",
    "australia": "Oceania", "new zealand": "Oceania", "fiji": "Oceania", "samoa": "Oceania", "tonga": "Oceania"
  };

  const state = {
    view: "cities",
    query: "",
    region: "",
    items: [],
    fullItems: null,
    perPage: 20,
    page: 1,
    lastPage: 1,
    total: 0,
    pages: { cities: 1, countries: 1 },
    cachedAll: { cities: null, countries: null },
    userFavoriteKeys: new Set()
  };

  function resolveItemRegion(item, view) {
    const rawRegion = window.TL.Util.pick(item, ["region", "country.region", "country_information.region", "continent"], "");
    if (typeof rawRegion === "string" && rawRegion.trim()) {
      return rawRegion.trim();
    }
    const countryName = (view === "cities" ? window.TL.Util.country(item) : window.TL.Util.name(item)).toLowerCase().trim();
    return COUNTRY_REGION_MAP[countryName] || "";
  }

  function cardHtml(item, view) {
    const name = window.TL.Util.name(item);
    const country = view === "cities" ? window.TL.Util.country(item) : (resolveItemRegion(item, view) || "");
    const img = window.TL.Util.image(item, FALLBACK_IMG);
    const rating = window.TL.Util.rating(item);
    const id = window.TL.Util.id(item);
    const type = view === "cities" ? "city" : "country";
    const detailHref = view === "cities" ? `destination-details.html?city=${encodeURIComponent(id)}` : `destination-details.html?country=${encodeURIComponent(id)}`;
    const isFav = state.userFavoriteKeys.has(`${type}_${id}`);

    return `
    <div class="tl-card tl-place-card" data-name="${window.TL.Util.escape(name.toLowerCase())}">
      <div class="tl-place-media">
        <a href="${detailHref}"><img src="${img}" alt="${window.TL.Util.escape(name)}" loading="lazy" onerror="this.src='${FALLBACK_IMG}'"></a>
        ${rating ? `<span class="tl-badge">★ ${window.TL.Util.escape(rating)}</span>` : ""}
        <button class="tl-fav-btn ${isFav ? "is-active" : ""}" data-fav-id="${id}" data-fav-type="${type}" aria-label="Save to favorites">${isFav ? "♥" : "♡"}</button>
      </div>
      <div class="tl-place-body">
        <a href="${detailHref}"><div class="tl-place-title"><h3>${window.TL.Util.escape(name)}</h3></div></a>
        ${country ? `<div class="tl-place-meta">📍 ${window.TL.Util.escape(country)}</div>` : ""}
      </div>
    </div>`;
  }

  function paginationControls() {
    const { page, lastPage, total } = state;
    if (lastPage <= 1) return "";

    const windowSize = 2;
    const pages = new Set([1, lastPage]);
    for (let p = page - windowSize; p <= page + windowSize; p++) {
      if (p >= 1 && p <= lastPage) pages.add(p);
    }
    const sorted = [...pages].sort((a, b) => a - b);

    let numbersHtml = "";
    let prev = null;
    sorted.forEach((p) => {
      if (prev !== null && p - prev > 1) {
        numbersHtml += `<span class="tl-page-ellipsis">…</span>`;
      }
      numbersHtml += `<button class="tl-btn tl-btn--sm ${p === page ? "tl-btn--primary" : "tl-btn--outline"}" data-page="${p}">${p}</button>`;
      prev = p;
    });

    return `
    <div class="tl-pagination" id="destinations-pagination">
      <div class="tl-pagination-info">Page ${page} of ${lastPage} · ${total.toLocaleString()} ${state.view}</div>
      <div class="tl-pagination-controls">
        <button class="tl-btn tl-btn--sm tl-btn--outline" data-page="${page - 1}" ${page <= 1 ? "disabled" : ""}>← Prev</button>
        ${numbersHtml}
        <button class="tl-btn tl-btn--sm tl-btn--outline" data-page="${page + 1}" ${page >= lastPage ? "disabled" : ""}>Next →</button>
        <span class="tl-pagination-jump">
          <input type="number" min="1" max="${lastPage}" id="dest-page-jump" placeholder="Go to page">
          <button class="tl-btn tl-btn--sm tl-btn--outline" id="dest-page-jump-btn">Go</button>
        </span>
      </div>
    </div>`;
  }

  function render() {
    const grid = document.getElementById("destinations-grid");
    const pagerTop = document.getElementById("destinations-pagination-top");
    const pagerBottom = document.getElementById("destinations-loadmore");

    const source = Array.isArray(state.fullItems) && state.fullItems.length ? state.fullItems : state.items;

    const filtered = source.filter((item) => {
      const name = window.TL.Util.name(item).toLowerCase();
      const country = window.TL.Util.country(item).toLowerCase();
      const region = resolveItemRegion(item, state.view).toLowerCase();
      const q = state.query.toLowerCase().trim();
      const r = state.region.toLowerCase().trim();

      const matchesQuery = !q || name.includes(q) || country.includes(q);
      const matchesRegion = !r || region.includes(r);
      return matchesQuery && matchesRegion;
    });

    let toRender = filtered;
    if (Array.isArray(state.fullItems) && state.fullItems.length) {
      state.total = filtered.length;
      state.lastPage = Math.max(1, Math.ceil(state.total / state.perPage));
      if (state.page > state.lastPage) state.page = 1;
      const start = (state.page - 1) * state.perPage;
      const end = start + state.perPage;
      toRender = filtered.slice(start, end);
    }

    grid.innerHTML = toRender.length
      ? toRender.map((item) => cardHtml(item, state.view)).join("")
      : window.TL.Util.emptyState("No destinations found", "Try a different search term or region.");

    const pagerHtml = paginationControls();
    if (pagerTop) pagerTop.innerHTML = pagerHtml;
    if (pagerBottom) pagerBottom.innerHTML = pagerHtml;

    wireFavoriteButtons();
    wirePagination();
  }

  function wirePagination() {
    document.querySelectorAll("[data-page]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = Number(btn.dataset.page);
        if (!target || target < 1 || target > state.lastPage || target === state.page) return;
        state.page = target;
        render();
        window.scrollTo({ top: document.getElementById("destinations-grid").offsetTop - 80, behavior: "smooth" });
      });
    });

    const jumpBtn = document.getElementById("dest-page-jump-btn");
    if (jumpBtn) {
      jumpBtn.addEventListener("click", () => {
        const input = document.getElementById("dest-page-jump");
        const target = Number(input.value);
        if (!target || target < 1 || target > state.lastPage) {
          window.TL.toast(`Enter a page between 1 and ${state.lastPage}`, "error");
          return;
        }
        state.page = target;
        render();
        window.scrollTo({ top: document.getElementById("destinations-grid").offsetTop - 80, behavior: "smooth" });
      });
    }

    const jumpInput = document.getElementById("dest-page-jump");
    if (jumpInput) {
      jumpInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") document.getElementById("dest-page-jump-btn").click();
      });
    }
  }

  function wireFavoriteButtons() {
    document.querySelectorAll(".tl-fav-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!window.TL.Auth.isAuthenticated()) {
          window.location.href = `signin.html?next=destinations.html`;
          return;
        }
        const id = btn.dataset.favId;
        const type = btn.dataset.favType;
        const isActive = btn.classList.contains("is-active");
        try {
          if (isActive) {
            await window.TL.Favorites.remove(type, id);
            btn.classList.remove("is-active");
            btn.textContent = "♡";
            state.userFavoriteKeys.delete(`${type}_${id}`);
            window.TL.toast("Removed from favorites");
          } else {
            await window.TL.Favorites.add(type, id);
            btn.classList.add("is-active");
            btn.textContent = "♥";
            state.userFavoriteKeys.add(`${type}_${id}`);
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
        if (favId && type) {
          state.userFavoriteKeys.add(`${type}_${favId}`);
        }
      });
    } catch (e) {}
  }

  async function load(page = 1) {
    const grid = document.getElementById("destinations-grid");
    grid.innerHTML = window.TL.Util.skeletonCards(9);
    try {
      await syncUserFavorites();

      let items;
      if (state.cachedAll[state.view]) {
        items = state.cachedAll[state.view];
      } else {
        const fetcher = state.view === "cities" ? window.TL.Cities.allFull : window.TL.Countries.allFull;
        const fullResponse = await fetcher().catch(() => null);
        if (fullResponse && fullResponse.length) {
          items = window.TL.Util.list(fullResponse);
        } else {
          const fallbackFetcher = state.view === "cities" ? window.TL.Cities.all : window.TL.Countries.all;
          const fallbackRes = await fallbackFetcher({ page: 1, per_page: 100 });
          items = window.TL.Util.list(fallbackRes);
        }
        items = window.TL.Util.uniqueBy(items, (item) => `${window.TL.Util.name(item)}_${window.TL.Util.country(item)}`);
        state.cachedAll[state.view] = items;
      }

      state.fullItems = items;
      state.total = items.length;
      state.lastPage = Math.max(1, Math.ceil(state.total / state.perPage));
      state.page = Math.min(page, state.lastPage);
      state.pages[state.view] = state.page;

      render();
    } catch (err) {
      grid.innerHTML = window.TL.Util.errorState(err.message);
    }
  }

  function wireControls() {
    document.getElementById("dest-search").addEventListener("input", (e) => {
      state.query = e.target.value;
      state.page = 1;
      render();
    });
    document.getElementById("dest-region").addEventListener("change", (e) => {
      state.region = e.target.value;
      state.page = 1;
      render();
    });
    document.querySelectorAll(".tl-pill[data-view]").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".tl-pill[data-view]").forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        state.view = btn.dataset.view;
        load(state.pages[state.view] || 1);
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    load(1);
    wireControls();
  });
})();