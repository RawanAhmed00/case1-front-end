(function () {
  "use strict";

  const FALLBACK_IMG = "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=500&q=70";

  async function loadTrending() {
    const row = document.getElementById("trending-row");
    if (!row) return;
    row.innerHTML = window.TL.Util.skeletonCards(5, "tl-place-card");

    try {
      const response = await window.TL.Cities.all();
      const cities = window.TL.Util.list(response).slice(0, 8);

      if (!cities.length) {
        row.innerHTML = window.TL.Util.emptyState("No destinations yet", "Check back soon — new cities are being added.");
        return;
      }

      row.innerHTML = cities
        .map((city) => {
          const name = window.TL.Util.name(city);
          const country = window.TL.Util.country(city);
          const img = window.TL.Util.image(city, FALLBACK_IMG);
          const rating = window.TL.Util.rating(city);
          const id = window.TL.Util.id(city);
          return `
          <a href="destination-details.html?city=${encodeURIComponent(id)}" class="tl-card tl-place-card">
            <div class="tl-place-media">
              <img src="${img}" alt="${window.TL.Util.escape(name)}" loading="lazy" onerror="this.src='${FALLBACK_IMG}'">
              ${rating ? `<span class="tl-badge">★ ${window.TL.Util.escape(rating)}</span>` : ""}
            </div>
            <div class="tl-place-body">
              <div class="tl-place-title"><h3>${window.TL.Util.escape(name)}</h3></div>
              ${country ? `<div class="tl-place-meta">📍 ${window.TL.Util.escape(country)}</div>` : ""}
            </div>
          </a>`;
        })
        .join("");
    } catch (err) {
      row.innerHTML = window.TL.Util.errorState(err.message);
    }
  }

  function wireStyleChips() {
    document.querySelectorAll(".tl-pill[data-style]").forEach((btn) => {
      btn.addEventListener("click", () => btn.classList.toggle("is-active"));
    });
  }

  let suggestTimer;
  function wireDestinationSuggest() {
    const input = document.getElementById("hero-destination");
    const box = document.getElementById("hero-suggest");
    if (!input || !box) return;

    input.addEventListener("input", () => {
      clearTimeout(suggestTimer);
      const q = input.value.trim();
      if (q.length < 2) {
        box.classList.remove("is-open");
        return;
      }
      suggestTimer = setTimeout(async () => {
        try {
          const response = await window.TL.Countries.search(q);
          const items = window.TL.Util.list(response).slice(0, 6);
          if (!items.length) {
            box.innerHTML = `<button type="button" disabled>No matches found</button>`;
          } else {
            box.innerHTML = items
              .map((c) => `<button type="button" data-value="${window.TL.Util.escape(window.TL.Util.name(c))}">${window.TL.Util.escape(window.TL.Util.name(c))}</button>`)
              .join("");
          }
          box.classList.add("is-open");
        } catch (err) {
          box.classList.remove("is-open");
        }
      }, 300);
    });

    box.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-value]");
      if (!btn) return;
      input.value = btn.dataset.value;
      box.classList.remove("is-open");
    });

    document.addEventListener("click", (e) => {
      if (!box.contains(e.target) && e.target !== input) box.classList.remove("is-open");
    });
  }

  function wireHeroForm() {
    const form = document.getElementById("hero-search-form");
    if (!form) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const destination = document.getElementById("hero-destination").value.trim();
      const when = document.getElementById("hero-when").value;
      const travelers = document.getElementById("hero-travelers").value;
      const styles = Array.from(document.querySelectorAll(".tl-pill.is-active[data-style]")).map((b) => b.dataset.style);
      const params = new URLSearchParams();
      if (destination) params.set("destination", destination);
      if (when) params.set("when", when);
      if (travelers) params.set("travelers", travelers);
      if (styles.length) params.set("styles", styles.join(","));
      window.location.href = `plan-trip.html?${params.toString()}`;
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    loadTrending();
    wireStyleChips();
    wireDestinationSuggest();
    wireHeroForm();
  });
})();
