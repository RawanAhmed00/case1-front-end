(function () {
  "use strict";

  const FALLBACK_IMG = "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=600&q=70";

  const state = {
    view: "cities",
    query: "",
    region: "",
    items: [],
    page: 1,
    lastPage: 1,
    total: 0,
    // remember page per view so switching tabs doesn't lose your place
    pages: { cities: 1, countries: 1 }
  };

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

    // client-side filter within the currently loaded page only
    // (search isn't wired to the backend yet)
    const filtered = state.items.filter((item) => {
      const name = window.TL.Util.name(item).toLowerCase();
      const region = window.TL.Util.pick(item, ["region", "country.region"], "");
      const matchesQuery = !state.query || name.includes(state.query.toLowerCase());
      const matchesRegion = !state.region || region === state.region;
      return matchesQuery && matchesRegion;
    });

    grid.innerHTML = filtered.length
      ? filtered.map((item) => cardHtml(item, state.view)).join("")
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
        load(target);
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
        load(target);
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

  async function load(page = 1) {
    const grid = document.getElementById("destinations-grid");
    grid.innerHTML = window.TL.Util.skeletonCards(9);
    try {
      const fetcher = state.view === "cities" ? window.TL.Cities.all : window.TL.Countries.all;
      const response = await fetcher(page);

      state.items = window.TL.Util.list(response);
      state.page = response.meta?.current_page || page;
      state.lastPage = response.meta?.last_page || 1;
      state.total = response.meta?.total || state.items.length;
      state.pages[state.view] = state.page;

      render();
      window.scrollTo({ top: document.getElementById("destinations-grid").offsetTop - 80, behavior: "smooth" });
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
        // switch to whatever page we were on for this view (or page 1)
        load(state.pages[state.view] || 1);
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    load(1);
    wireControls();
  });
})();