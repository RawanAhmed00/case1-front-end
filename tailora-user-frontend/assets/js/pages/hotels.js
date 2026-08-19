(function () {
  "use strict";

  const FALLBACK_IMG = "assets/images/hotels/hotel-1.jpg";

  const HOTEL_IMAGES = [
    "assets/images/hotels/hotel-1.jpg",
    "assets/images/hotels/hotel-2.jpg",
    "assets/images/hotels/hotel-3.jpg",
    "assets/images/hotels/hotel-4.jpg",
    "assets/images/hotels/hotel-5.jpg",
    "assets/images/hotels/hotel-6.jpg",
    "assets/images/hotels/hotel-7.jpg",
    "assets/images/hotels/hotel-8.jpg",
    "assets/images/hotels/hotel-9.jpg",
    "assets/images/hotels/hotel-10.jpg",
    "assets/images/hotels/hotel-11.jpg",
    "assets/images/hotels/hotel-12.jpg"
  ];

  const state = {
    items: [],
    query: "",
    sort: "",
    page: 1,
    lastPage: 1,
    total: 0,
    perPage: 10,
    allHotels: null,
    userFavoriteKeys: new Set()
  };

  function getHotelImage(item) {
    const id = Number(window.TL.Util.id(item));
    if (!Number.isNaN(id) && id > 0) {
      return HOTEL_IMAGES[(id - 1) % HOTEL_IMAGES.length];
    }
    return HOTEL_IMAGES[0];
  }

  function card(item) {
    const name = window.TL.Util.name(item);
    const city = window.TL.Util.city(item) || window.TL.Util.country(item);
    const img = getHotelImage(item);
    const rating = window.TL.Util.rating(item);
    const price = window.TL.Util.money(window.TL.Util.price(item));
    const amenities = window.TL.Util.pick(item, ["amenities"], []);
    const id = window.TL.Util.id(item);
    const isFav = state.userFavoriteKeys.has(`hotel_${id}`);

    return `
    <div class="tl-card tl-place-card">
      <div class="tl-place-media">
        <img src="${img}" alt="${window.TL.Util.escape(name)}" loading="lazy" onerror="this.src='${FALLBACK_IMG}'">
        ${rating ? `<span class="tl-badge">★ ${window.TL.Util.escape(rating)}</span>` : ""}
        <button class="tl-fav-btn ${isFav ? "is-active" : ""}" data-fav-id="${id}" data-fav-type="hotel" aria-label="Save to favorites">${isFav ? "♥" : "♡"}</button>
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
          <button class="tl-btn tl-btn--sm tl-btn--outline" onclick="window.location.href='hotel-details.html?id=${id}'">View</button>
        </div>
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
    <div class="tl-pagination" id="hotels-pagination">
      <div class="tl-pagination-info">Page ${page} of ${lastPage} · ${total.toLocaleString()} hotels</div>
      <div class="tl-pagination-controls">
        <button class="tl-btn tl-btn--sm tl-btn--outline" data-page="${page - 1}" ${page <= 1 ? "disabled" : ""}>← Prev</button>
        ${numbersHtml}
        <button class="tl-btn tl-btn--sm tl-btn--outline" data-page="${page + 1}" ${page >= lastPage ? "disabled" : ""}>Next →</button>
        <span class="tl-pagination-jump">
          <input type="number" min="1" max="${lastPage}" id="hotels-page-jump" placeholder="Go to page">
          <button class="tl-btn tl-btn--sm tl-btn--outline" id="hotels-page-jump-btn">Go</button>
        </span>
      </div>
    </div>`;
  }

  async function getAllHotels() {
    if (state.allHotels && state.allHotels.length > 0) return state.allHotels;
    try {
      const mapRes = await window.TL.Api.get("/hotels/map");
      const list = window.TL.Util.list(mapRes);
      if (list && list.length > 0) {
        state.allHotels = window.TL.Util.uniqueBy(list, (h) => `${window.TL.Util.name(h)}_${window.TL.Util.city(h)}`);
        return state.allHotels;
      }
    } catch (e) {}

    try {
      const promises = [];
      for (let p = 1; p <= 15; p++) {
        promises.push(window.TL.Api.get("/hotels", { page: p }).catch(() => ({ data: [] })));
      }
      const responses = await Promise.all(promises);
      const combined = [];
      for (const r of responses) {
        combined.push(...window.TL.Util.list(r));
      }
      state.allHotels = window.TL.Util.uniqueBy(combined, (h) => `${window.TL.Util.name(h)}_${window.TL.Util.city(h)}`);
      return state.allHotels;
    } catch (e) {
      return state.items;
    }
  }

  async function render() {
    const grid = document.getElementById("hotels-grid");
    const pagerTop = document.getElementById("hotels-pagination-top");
    const pagerBottom = document.getElementById("hotels-pagination-bottom");

    const q = state.query.trim().toLowerCase();
    const isGlobal = Boolean(q || state.sort);

    let displayItems = [];

    if (isGlobal) {
      const allHotels = await getAllHotels();
      let filtered = [...allHotels];

      if (q) {
        filtered = filtered.filter((h) => {
          const hay = `${window.TL.Util.name(h)} ${window.TL.Util.city(h)} ${window.TL.Util.country(h)} ${window.TL.Util.pick(h, ["neighborhood", "address"], "")}`.toLowerCase();
          return hay.includes(q);
        });
      }

      if (state.sort === "price-asc") {
        filtered.sort((a, b) => (Number(window.TL.Util.price(a)) || 0) - (Number(window.TL.Util.price(b)) || 0));
      } else if (state.sort === "price-desc") {
        filtered.sort((a, b) => (Number(window.TL.Util.price(b)) || 0) - (Number(window.TL.Util.price(a)) || 0));
      } else if (state.sort === "rating-desc") {
        filtered.sort((a, b) => (Number(window.TL.Util.rating(b)) || 0) - (Number(window.TL.Util.rating(a)) || 0));
      }

      state.total = filtered.length;
      state.lastPage = Math.max(1, Math.ceil(state.total / state.perPage));
      if (state.page > state.lastPage) state.page = 1;
      const start = (state.page - 1) * state.perPage;
      displayItems = filtered.slice(start, start + state.perPage);
    } else {
      displayItems = [...state.items];
    }

    grid.innerHTML = displayItems.length ? displayItems.map(card).join("") : window.TL.Util.emptyState("No hotels found", "Try a different search term or city.");

    const pagerHtml = paginationControls();
    if (pagerTop) pagerTop.innerHTML = pagerHtml;
    if (pagerBottom) pagerBottom.innerHTML = pagerHtml;

    wireFav();
    wirePagination();
  }

  function wirePagination() {
    document.querySelectorAll("[data-page]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = Number(btn.dataset.page);
        if (!target || target < 1 || target > state.lastPage || target === state.page) return;
        if (state.query.trim() || state.sort) {
          state.page = target;
          render();
        } else {
          load(target);
        }
        window.scrollTo({ top: document.getElementById("hotels-grid").offsetTop - 80, behavior: "smooth" });
      });
    });

    document.querySelectorAll("#hotels-page-jump-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const input = btn.previousElementSibling;
        const target = Number(input.value);
        if (!target || target < 1 || target > state.lastPage) {
          window.TL.toast(`Enter a page between 1 and ${state.lastPage}`, "error");
          return;
        }
        if (state.query.trim() || state.sort) {
          state.page = target;
          render();
        } else {
          load(target);
        }
        window.scrollTo({ top: document.getElementById("hotels-grid").offsetTop - 80, behavior: "smooth" });
      });
    });

    document.querySelectorAll("#hotels-page-jump").forEach((input) => {
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") input.nextElementSibling.click();
      });
    });
  }

  function wireFav() {
    document.querySelectorAll(".tl-fav-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!window.TL.Auth.isAuthenticated()) {
          window.location.href = "signin.html?next=hotels.html";
          return;
        }
        const id = btn.dataset.favId;
        const type = btn.dataset.favType || "hotel";
        const active = btn.classList.contains("is-active");
        try {
          if (active) {
            await window.TL.Favorites.remove(type, id);
            btn.classList.remove("is-active");
            btn.textContent = "♡";
            state.userFavoriteKeys.delete(`hotel_${id}`);
            window.TL.toast("Removed from favorites");
          } else {
            await window.TL.Favorites.add(type, id);
            btn.classList.add("is-active");
            btn.textContent = "♥";
            state.userFavoriteKeys.add(`hotel_${id}`);
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
        if (favId && type === "hotel") {
          state.userFavoriteKeys.add(`hotel_${favId}`);
        }
      });
    } catch (e) {}
  }

  async function load(page = 1) {
    const grid = document.getElementById("hotels-grid");
    grid.innerHTML = window.TL.Util.skeletonCards(9);
    try {
      await syncUserFavorites();
      const response = await window.TL.Hotels.all({ page });
      const rawHotels = window.TL.Util.list(response);
      state.items = window.TL.Util.uniqueBy(rawHotels, (h) => `${window.TL.Util.name(h)}_${window.TL.Util.city(h)}`);
      state.page = response.meta?.current_page || page;
      state.lastPage = response.meta?.last_page || 1;
      state.total = response.meta?.total || state.items.length;
      render();
    } catch (err) {
      grid.innerHTML = window.TL.Util.errorState(err.message);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    load(1);
    let searchDebounce;
    document.getElementById("hotel-search").addEventListener("input", (e) => {
      clearTimeout(searchDebounce);
      state.query = e.target.value;
      state.page = 1;
      searchDebounce = setTimeout(() => {
        render();
      }, 250);
    });
    document.getElementById("hotel-sort").addEventListener("change", (e) => {
      state.sort = e.target.value;
      state.page = 1;
      render();
    });
  });
})();