/**
 * TAILORA USER — FLIGHTS PAGE
 *
 * Drives the three search modes on top of:
 *   GET  /cities                  (catalog — city dropdown data)
 *   POST /flights/one-way
 *   POST /flights/round-trip
 *   POST /flights/search          (multi-city)
 *   POST /flights/select          ({ ignav_id })
 *
 * From/To are <select> dropdowns populated from the catalog's cities table
 * (GET /cities via window.TL.Cities.all()), fetched once and cached, then
 * reused to fill every From/To dropdown on the page (including dynamically
 * added multi-city legs). Whatever identifier field the city record exposes
 * (airport/city code if present, otherwise the city id) is sent as-is to
 * the flight-search endpoints as origin/destination — never guessed.
 */
(function () {
  "use strict";

  let legCount = 0;
  let lastSelectedCard = null;

  /* --------------------------- City dropdown data --------------------------- */

  let citiesCache = null; // [{ value, label }]
  let citiesLoadingPromise = null;

  function cityValue(item) {
    return String(
      window.TL.Util.pick(item, ["code", "iata_code", "iata", "airport_code", "city_code", "id", "uuid"], "")
    );
  }

  // The city record's shape is resolved defensively against the field
  // names already used elsewhere in this project (Util.city / Util.name / Util.country).
  function cityLabel(item) {
    const city = window.TL.Util.city(item) || window.TL.Util.name(item, "");
    const country = window.TL.Util.country(item);
    return country ? `${city}, ${country}` : city;
  }

  async function loadCities() {
    if (citiesCache) return citiesCache;
    if (citiesLoadingPromise) return citiesLoadingPromise;

    citiesLoadingPromise = (async () => {
      try {
        const response = await window.TL.Cities.all();
        const items = window.TL.Util.list(response);
        citiesCache = items
          .map((item) => ({ value: cityValue(item), label: cityLabel(item) || "Unknown city" }))
          .filter((c) => c.value)
          .sort((a, b) => a.label.localeCompare(b.label));
      } catch (err) {
        citiesCache = [];
        window.TL.toast(err.message || "Couldn't load cities.", "error");
      }
      return citiesCache;
    })();

    return citiesLoadingPromise;
  }

  function citySelectValue(select) {
    return (select && select.value) || "";
  }

  function populateCitySelect(select) {
    if (!select) return;
    const current = select.value;
    const options = (citiesCache || [])
      .map((c) => `<option value="${window.TL.Util.escape(c.value)}">${window.TL.Util.escape(c.label)}</option>`)
      .join("");
    select.innerHTML = `<option value="" disabled ${current ? "" : "selected"}>Select city...</option>` + options;
    if (current) select.value = current;
    select.disabled = false;
  }

  function wireCitySelect(select) {
    if (!select || select.dataset.citySelectWired === "1") return;
    select.dataset.citySelectWired = "1";

    if (citiesCache) {
      populateCitySelect(select);
      return;
    }

    select.disabled = true;
    select.innerHTML = `<option value="" disabled selected>Loading cities…</option>`;
    loadCities().then(() => populateCitySelect(select));
  }

  function wireAllCitySelects() {
    document.querySelectorAll("select.tl-city-select").forEach(wireCitySelect);
  }

  /* --------------------------- Mode tabs --------------------------- */

  function wireModes() {
    document.querySelectorAll("#flight-modes button[data-mode]").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("#flight-modes button[data-mode]").forEach((b) => b.classList.remove("is-active"));
        document.querySelectorAll(".tl-flight-panel").forEach((p) => p.classList.remove("is-active"));
        btn.classList.add("is-active");
        document.querySelector(`.tl-flight-panel[data-panel="${btn.dataset.mode}"]`).classList.add("is-active");
      });
    });
  }

  /* --------------------------- Multi-city legs --------------------------- */

  function legTemplate(index) {
    return `
    <div class="tl-leg" data-leg="${index}">
      ${index > 1 ? `<button type="button" class="tl-leg-remove" data-remove-leg="${index}" aria-label="Remove flight">✕</button>` : ""}
      <div class="tl-leg-row">
        <div class="tl-field" style="margin-bottom:0;">
          <label>From</label>
          <select class="tl-select tl-input tl-city-select" id="mc-origin-${index}" required>
            <option value="" disabled selected>Loading cities…</option>
          </select>
        </div>
        <div class="tl-field" style="margin-bottom:0;">
          <label>To</label>
          <select class="tl-select tl-input tl-city-select" id="mc-destination-${index}" required>
            <option value="" disabled selected>Loading cities…</option>
          </select>
        </div>
        <div class="tl-field" style="margin-bottom:0;">
          <label>Departure</label>
          <input class="tl-input" type="date" id="mc-date-${index}" required>
        </div>
        <div></div>
      </div>
    </div>`;
  }

  function addLeg() {
    legCount += 1;
    const mount = document.getElementById("mc-legs");
    mount.insertAdjacentHTML("beforeend", legTemplate(legCount));
    // Every dynamically added leg reuses the exact same cached cities list
    // as the static fields — no separate fetch, no text inputs.
    wireCitySelect(document.getElementById(`mc-origin-${legCount}`));
    wireCitySelect(document.getElementById(`mc-destination-${legCount}`));
    wireLegRemoval();

    const today = new Date().toISOString().slice(0, 10);
    const dateEl = document.getElementById(`mc-date-${legCount}`);
    if (dateEl) dateEl.min = today;
  }

  function wireLegRemoval() {
    document.querySelectorAll("[data-remove-leg]").forEach((btn) => {
      btn.onclick = () => {
        const legs = document.querySelectorAll(".tl-leg");
        if (legs.length <= 2) {
          window.TL.toast("Multi-city needs at least two flights.", "error");
          return;
        }
        document.querySelector(`.tl-leg[data-leg="${btn.dataset.removeLeg}"]`).remove();
      };
    });
  }

  function initMultiCity() {
    addLeg();
    addLeg();
    document.getElementById("mc-add-leg").addEventListener("click", addLeg);
  }

  /* --------------------------- Results rendering --------------------------- */

  function money(item) {
    const value = window.TL.Util.pick(item, ["price", "total_price", "fare", "amount"], null);
    const currency = window.TL.Util.pick(item, ["currency", "currency_code"], "");
    if (value === null) return "";
    const formatted = Number.isFinite(Number(value)) ? Number(value).toLocaleString() : value;
    return currency ? `${formatted} ${currency}` : `${formatted}`;
  }

  function flightIgnavId(item) {
    return window.TL.Util.pick(item, ["ignav_id"], null);
  }

  function flightCard(item, index) {
    const airline = window.TL.Util.pick(item, ["airline", "airline_name", "carrier"], "");
    const flightNumber = window.TL.Util.pick(item, ["flight_number", "flightNumber"], "");
    const origin = window.TL.Util.pick(item, ["origin", "origin_code", "from"], "");
    const destination = window.TL.Util.pick(item, ["destination", "destination_code", "to"], "");
    const departure = window.TL.Util.pick(item, ["departure", "departure_time", "departure_date"], "");
    const arrival = window.TL.Util.pick(item, ["arrival", "arrival_time", "arrival_date"], "");
    const duration = window.TL.Util.pick(item, ["duration"], "");
    const stops = window.TL.Util.pick(item, ["stops", "number_of_stops"], null);
    const cabin = window.TL.Util.pick(item, ["cabin_class", "cabin"], "");
    const price = money(item);
    const ignavId = flightIgnavId(item);

    return `
    <div class="tl-card tl-flight-result" data-result-index="${index}">
      <div class="tl-flight-result-top">
        <div>
          <div class="tl-flight-route">
            <strong>${window.TL.Util.escape(origin || "?")}</strong>
            <span class="tl-flight-arrow">→</span>
            <strong>${window.TL.Util.escape(destination || "?")}</strong>
          </div>
          <div class="tl-flight-meta-row tl-mt-8">
            ${airline ? `<span class="tl-pill">✈ ${window.TL.Util.escape(airline)}${flightNumber ? " " + window.TL.Util.escape(flightNumber) : ""}</span>` : ""}
            ${departure ? `<span class="tl-pill">🛫 ${window.TL.Util.escape(departure)}</span>` : ""}
            ${arrival ? `<span class="tl-pill">🛬 ${window.TL.Util.escape(arrival)}</span>` : ""}
            ${duration ? `<span class="tl-pill">⏱ ${window.TL.Util.escape(duration)}</span>` : ""}
            ${stops !== null ? `<span class="tl-pill">${Number(stops) === 0 ? "Nonstop" : `${window.TL.Util.escape(stops)} stop${Number(stops) === 1 ? "" : "s"}`}</span>` : ""}
            ${cabin ? `<span class="tl-pill">${window.TL.Util.escape(cabin)}</span>` : ""}
          </div>
        </div>
        <div class="tl-flight-price-col">
          ${price ? `<span class="tl-price" style="font-size:20px;">${window.TL.Util.escape(price)}</span>` : ""}
          <button type="button" class="tl-btn tl-btn--primary tl-btn--sm" data-select-flight="${index}" ${ignavId ? "" : "disabled"}>
            ${ignavId ? "Select Flight" : "Unavailable"}
          </button>
        </div>
      </div>
    </div>`;
  }

  async function selectFlight(item, card) {
    if (!window.TL.Auth.isAuthenticated()) {
      window.location.href = "signin.html?next=flights.html";
      return;
    }
    const ignavId = flightIgnavId(item);
    if (!ignavId) {
      window.TL.toast("This flight can't be selected — missing identifier.", "error");
      return;
    }
    const btn = card.querySelector(`[data-select-flight]`);
    const original = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Selecting…";
    try {
      const response = await window.TL.Flights.select(ignavId);
      const selected = window.TL.Util.pick(response, ["data", "flight"], response) || item;

      if (lastSelectedCard) lastSelectedCard.classList.remove("is-selected");
      card.classList.add("is-selected");
      lastSelectedCard = card;
      btn.textContent = "✓ Selected";

      window.TL.Cart.setFlight(Object.assign({}, item, selected, { ignav_id: ignavId }));
      window.TL.toast("Flight selected!");
      renderSelectedBanner();
    } catch (err) {
      btn.disabled = false;
      btn.textContent = original;
      window.TL.toast(err.message || "Couldn't select this flight.", "error");
    }
  }

  function renderResults(list) {
    const mount = document.getElementById("flights-results");
    if (!list.length) {
      mount.innerHTML = window.TL.Util.emptyState("No flights found", "Try different dates or cities.");
      return;
    }
    mount.innerHTML = `<div class="tl-section-head" style="margin-bottom:20px;"><h2 style="font-size:20px;">Flights (${list.length})</h2></div>` +
      list.map(flightCard).join("");
    mount.querySelectorAll("[data-select-flight]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.dataset.selectFlight);
        const card = mount.querySelector(`[data-result-index="${idx}"]`);
        selectFlight(list[idx], card);
      });
    });
  }

  function renderSelectedBanner() {
    const mount = document.getElementById("flight-selected-banner");
    const flight = window.TL.Cart.getFlight();
    if (!flight) {
      mount.innerHTML = "";
      return;
    }
    const origin = window.TL.Util.pick(flight, ["origin", "origin_code", "from"], "");
    const destination = window.TL.Util.pick(flight, ["destination", "destination_code", "to"], "");
    mount.innerHTML = `
    <div class="tl-card" style="padding:18px 22px;margin-bottom:24px;display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;border-color:var(--tl-cyan);">
      <span>✈ Flight selected${origin && destination ? `: ${window.TL.Util.escape(origin)} → ${window.TL.Util.escape(destination)}` : ""}</span>
      <div class="tl-flex tl-gap-12">
        <a href="hotels.html" class="tl-btn tl-btn--outline tl-btn--sm">Add a Hotel</a>
        <a href="bookings.html" class="tl-btn tl-btn--primary tl-btn--sm">Go to Booking</a>
      </div>
    </div>`;
  }

  async function runSearch(searchFn, payload, btn) {
    const original = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Searching…";
    const mount = document.getElementById("flights-results");
    mount.innerHTML = window.TL.Util.skeletonCards(4, "tl-flight-result");
    try {
      const response = await searchFn(payload);
      const list = window.TL.Util.list(response);
      renderResults(list.length ? list : (Array.isArray(response) ? response : []));
    } catch (err) {
      mount.innerHTML = window.TL.Util.errorState(err.message);
      window.TL.toast(err.message || "Flight search failed.", "error");
    } finally {
      btn.disabled = false;
      btn.textContent = original;
    }
  }

  /* --------------------------- Form submit handlers --------------------------- */

  function wireOneWay() {
    document.getElementById("form-one-way").addEventListener("submit", (e) => {
      e.preventDefault();
      const originInput = document.getElementById("ow-origin");
      const destinationInput = document.getElementById("ow-destination");
      const origin = citySelectValue(originInput);
      const destination = citySelectValue(destinationInput);
      if (!origin || !destination) {
        window.TL.toast("Pick a From and To city.", "error");
        return;
      }
      const payload = {
        origin,
        destination,
        departure_date: document.getElementById("ow-departure").value,
        adults: Number(document.getElementById("ow-adults").value) || 1,
        cabin_class: document.getElementById("ow-cabin").value
      };
      runSearch(window.TL.Flights.oneWay, payload, e.target.querySelector("button[type=submit]"));
    });
  }

  function wireRoundTrip() {
    document.getElementById("form-round-trip").addEventListener("submit", (e) => {
      e.preventDefault();
      const originInput = document.getElementById("rt-origin");
      const destinationInput = document.getElementById("rt-destination");
      const origin = citySelectValue(originInput);
      const destination = citySelectValue(destinationInput);
      if (!origin || !destination) {
        window.TL.toast("Pick a From and To city.", "error");
        return;
      }
      const departure = document.getElementById("rt-departure").value;
      const ret = document.getElementById("rt-return").value;
      if (departure && ret && ret < departure) {
        window.TL.toast("Return date is before your departure date.", "error");
        return;
      }
      const payload = {
        origin,
        destination,
        departure_date: departure,
        return_date: ret,
        adults: Number(document.getElementById("rt-adults").value) || 1,
        cabin_class: document.getElementById("rt-cabin").value
      };
      runSearch(window.TL.Flights.roundTrip, payload, e.target.querySelector("button[type=submit]"));
    });
  }

  function wireMultiCity() {
    document.getElementById("form-multi-city").addEventListener("submit", (e) => {
      e.preventDefault();
      const legElements = Array.from(document.querySelectorAll(".tl-leg"));
      const legs = legElements.map((legEl) => {
        const idx = legEl.dataset.leg;
        const origin = citySelectValue(document.getElementById(`mc-origin-${idx}`));
        const destination = citySelectValue(document.getElementById(`mc-destination-${idx}`));
        const date = document.getElementById(`mc-date-${idx}`).value;
        return { origin, destination, departure_date: date };
      });
      if (legs.some((l) => !l.origin || !l.destination || !l.departure_date)) {
        window.TL.toast("Pick a From/To city and date for every flight leg.", "error");
        return;
      }
      const payload = {
        legs,
        adults: Number(document.getElementById("mc-adults").value) || 1,
        children: Number(document.getElementById("mc-children").value) || 0,
        cabin_class: document.getElementById("mc-cabin").value
      };
      runSearch(window.TL.Flights.multiCity, payload, e.target.querySelector("button[type=submit]"));
    });
  }

  /* --------------------------- Init --------------------------- */

  document.addEventListener("DOMContentLoaded", () => {
    wireAllCitySelects();

    wireModes();
    initMultiCity();
    wireOneWay();
    wireRoundTrip();
    wireMultiCity();
    renderSelectedBanner();

    const today = new Date().toISOString().slice(0, 10);
    ["ow-departure", "rt-departure", "rt-return"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.min = today;
    });
  });
})();
