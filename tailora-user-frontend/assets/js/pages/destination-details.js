(function () {
  "use strict";

  const FALLBACK_IMG = "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1400&q=75";
  const CARD_FALLBACK = "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=500&q=70";

  function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  // Matches a hotel/restaurant/attraction record against the loaded
  // destination using whichever city-reference field the API happens to
  // include (undocumented, so we check several candidates defensively).
  function belongsToPlace(item, place, placeName) {
    const candidates = [
      window.TL.Util.pick(item, ["city_id"]),
      window.TL.Util.pick(item, ["city.id"]),
      window.TL.Util.pick(item, ["country_id"]),
      window.TL.Util.pick(item, ["country.id"])
    ];
    const placeId = window.TL.Util.id(place);
    if (candidates.some((c) => c !== undefined && String(c) === String(placeId))) return true;

    const nameFields = [window.TL.Util.city(item), window.TL.Util.country(item)].filter(Boolean);
    if (placeName && nameFields.some((n) => n.toLowerCase() === placeName.toLowerCase())) return true;
    return false;
  }

  function placeCard(item, kind) {
    const name = window.TL.Util.name(item);
    const img = window.TL.Util.image(item, CARD_FALLBACK);
    const rating = window.TL.Util.rating(item);
    const price = window.TL.Util.price(item);
    const desc = window.TL.Util.description(item);
    return `
    <div class="tl-card tl-place-card">
      <div class="tl-place-media">
        <img src="${img}" alt="${window.TL.Util.escape(name)}" loading="lazy" onerror="this.src='${CARD_FALLBACK}'">
        ${rating ? `<span class="tl-badge">★ ${window.TL.Util.escape(rating)}</span>` : ""}
      </div>
      <div class="tl-place-body">
        <div class="tl-place-title"><h3>${window.TL.Util.escape(name)}</h3></div>
        ${desc ? `<p class="tl-place-desc">${window.TL.Util.escape(desc)}</p>` : ""}
        ${
          price
            ? `<div class="tl-place-foot"><span class="tl-price">${window.TL.Util.escape(window.TL.Util.money(price) || price)}${kind === "hotels" ? " <span>/ night</span>" : ""}</span></div>`
            : ""
        }
      </div>
    </div>`;
  }

  async function loadHero(place, isCity) {
    const hero = document.getElementById("detail-hero");
    const name = window.TL.Util.name(place);
    const region = isCity ? window.TL.Util.country(place) : window.TL.Util.pick(place, ["region"], "");
    const img = window.TL.Util.image(place, FALLBACK_IMG);
    hero.innerHTML = `
      <img src="${img}" alt="${window.TL.Util.escape(name)}" onerror="this.src='${FALLBACK_IMG}'">
      <div class="tl-detail-hero-body">
        ${region ? `<span class="tl-badge">📍 ${window.TL.Util.escape(region)}</span>` : ""}
        <h1 class="tl-mt-8">${window.TL.Util.escape(name)}</h1>
      </div>`;

    const overview = document.getElementById("panel-overview");
    const desc = window.TL.Util.description(place);
    overview.innerHTML = `
      <div class="tl-card" style="padding:28px;">
        <h3 style="font-size:18px;margin-bottom:10px;">About ${window.TL.Util.escape(name)}</h3>
        <p class="tl-text-secondary">${desc ? window.TL.Util.escape(desc) : "Overview details for this destination haven't been published yet. Explore hotels, restaurants, and experiences below."}</p>
      </div>`;
  }

  async function loadRelated(place, placeName) {
    const hotelsPanel = document.getElementById("panel-hotels");
    const restaurantsPanel = document.getElementById("panel-restaurants");
    const attractionsPanel = document.getElementById("panel-attractions");

    hotelsPanel.innerHTML = `<div class="tl-grid">${window.TL.Util.skeletonCards(3)}</div>`;
    restaurantsPanel.innerHTML = `<div class="tl-grid">${window.TL.Util.skeletonCards(3)}</div>`;
    attractionsPanel.innerHTML = `<div class="tl-grid">${window.TL.Util.skeletonCards(3)}</div>`;

    try {
      const [hotelsRes, restaurantsRes, attractionsRes] = await Promise.all([
        window.TL.Hotels.all(),
        window.TL.Restaurants.all(),
        window.TL.Attractions.all()
      ]);

      const rawHotels = window.TL.Util.list(hotelsRes).filter((h) => belongsToPlace(h, place, placeName));
      const rawRestaurants = window.TL.Util.list(restaurantsRes).filter((r) => belongsToPlace(r, place, placeName));
      const rawAttractions = window.TL.Util.list(attractionsRes).filter((a) => belongsToPlace(a, place, placeName));

      const hotels = window.TL.Util.uniqueBy(rawHotels, (h) => window.TL.Util.name(h));
      const restaurants = window.TL.Util.uniqueBy(rawRestaurants, (r) => window.TL.Util.name(r));
      const attractions = window.TL.Util.uniqueBy(rawAttractions, (a) => window.TL.Util.name(a));

      hotelsPanel.innerHTML = hotels.length
        ? `<div class="tl-grid">${hotels.map((h) => placeCard(h, "hotels")).join("")}</div>`
        : window.TL.Util.emptyState("No hotels linked yet", "Browse the full hotels catalog instead.") +
          `<div class="tl-text-center"><a class="tl-btn tl-btn--outline tl-btn--sm" href="hotels.html">Browse All Hotels</a></div>`;

      restaurantsPanel.innerHTML = restaurants.length
        ? `<div class="tl-grid">${restaurants.map((r) => placeCard(r, "restaurants")).join("")}</div>`
        : window.TL.Util.emptyState("No restaurants linked yet", "Browse the full restaurants catalog instead.") +
          `<div class="tl-text-center"><a class="tl-btn tl-btn--outline tl-btn--sm" href="restaurants.html">Browse All Restaurants</a></div>`;

      attractionsPanel.innerHTML = attractions.length
        ? `<div class="tl-grid">${attractions.map((a) => placeCard(a, "attractions")).join("")}</div>`
        : window.TL.Util.emptyState("No experiences linked yet", "Browse the full experiences catalog instead.") +
          `<div class="tl-text-center"><a class="tl-btn tl-btn--outline tl-btn--sm" href="experiences.html">Browse All Experiences</a></div>`;
    } catch (err) {
      const msg = window.TL.Util.errorState(err.message);
      hotelsPanel.innerHTML = msg;
      restaurantsPanel.innerHTML = msg;
      attractionsPanel.innerHTML = msg;
    }
  }

  function wireTabs() {
    document.querySelectorAll("#detail-tabs button").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("#detail-tabs button").forEach((b) => b.classList.remove("is-active"));
        document.querySelectorAll(".tl-detail-tabpanel").forEach((p) => p.classList.remove("is-active"));
        btn.classList.add("is-active");
        document.querySelector(`[data-panel="${btn.dataset.tab}"]`).classList.add("is-active");
      });
    });
  }

  async function init() {
    const cityId = getParam("city");
    const countryName = getParam("country");
    const hero = document.getElementById("detail-hero");

    if (!cityId && !countryName) {
      hero.innerHTML = window.TL.Util.emptyState("No destination selected", "Head back to Destinations to pick one.");
      return;
    }

    try {
      let place;
      let isCity = !!cityId;
      if (cityId) {
        place = await window.TL.Cities.get(cityId);
        if (place && place.data) place = place.data;
      } else {
        place = await window.TL.Countries.byName(countryName);
        if (place && place.data) place = place.data;
      }
      await loadHero(place, isCity);
      await loadRelated(place, window.TL.Util.name(place));
    } catch (err) {
      hero.innerHTML = `<div style="padding:60px;">${window.TL.Util.errorState(err.message)}</div>`;
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    init();
    wireTabs();
  });
})();
