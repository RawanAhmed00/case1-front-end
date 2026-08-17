/**
 * TAILORA USER — TRIP WEATHER PAGE
 * GET  /trips                    (trip picker)
 * GET  /cities                   (city autocomplete — reused, not hardcoded)
 * GET  /weather/trips/{tripId}   (load existing weather for a trip)
 * POST /weather/trips/{tripId}   { city }  (fetch + save weather)
 *
 * TL.Weather (GET/POST) already exists in assets/js/api/favorites.js, so
 * it's reused as-is rather than re-implemented here.
 */
(function () {
  "use strict";

  let allCities = [];
  let selectedCityName = "";

  function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  /* --------------------------- Trip picker --------------------------- */

  async function loadTrips() {
    const select = document.getElementById("weather-trip-select");
    try {
      const response = await window.TL.Trips.all();
      const trips = window.TL.Util.list(response);
      if (!trips.length) {
        document.getElementById("weather-no-trips").classList.remove("tl-hidden");
        document.getElementById("weather-no-trips").innerHTML = window.TL.Util.emptyState(
          "No trips yet",
          "Create a trip first, then come back here to check its weather."
        ) + `<div class="tl-text-center"><a class="tl-btn tl-btn--primary tl-btn--sm" href="plan-trip.html">Plan a Trip</a></div>`;
        select.innerHTML = "";
        document.querySelector(".tl-weather-form-row").classList.add("tl-hidden");
        return null;
      }

      const preferred = getParam("tripId") || window.TL.Cart.getActiveTripId();
      select.innerHTML = trips
        .map((t) => {
          const id = window.TL.Util.id(t);
          const label = window.TL.Util.pick(t, ["title", "name"], `Trip #${id}`);
          return `<option value="${id}">${window.TL.Util.escape(label)}</option>`;
        })
        .join("");

      if (preferred && trips.some((t) => String(window.TL.Util.id(t)) === String(preferred))) {
        select.value = preferred;
      }
      window.TL.Cart.setActiveTripId(select.value);
      return select.value;
    } catch (err) {
      window.TL.toast(err.message || "Couldn't load your trips.", "error");
      return null;
    }
  }

  /* --------------------------- City autocomplete --------------------------- */

  async function loadCities() {
    try {
      const response = await window.TL.Cities.all();
      const rawCities = window.TL.Util.list(response);
      allCities = window.TL.Util.uniqueBy(rawCities, (c) => `${window.TL.Util.name(c)}_${window.TL.Util.country(c)}`);
    } catch (err) {
      allCities = [];
    }
  }

  function wireCityAutocomplete() {
    const input = document.getElementById("weather-city-input");
    const suggestBox = document.getElementById("weather-city-suggest");

    input.addEventListener("input", () => {
      selectedCityName = "";
      const q = input.value.trim().toLowerCase();
      if (q.length < 1) {
        suggestBox.classList.remove("is-open");
        return;
      }
      const matches = allCities
        .filter((c) => window.TL.Util.name(c, "").toLowerCase().includes(q))
        .slice(0, 8);
      if (!matches.length) {
        suggestBox.classList.remove("is-open");
        return;
      }
      suggestBox.innerHTML = matches
        .map((c, i) => `<button type="button" data-idx="${i}">${window.TL.Util.escape(window.TL.Util.name(c))}${window.TL.Util.country(c) ? ` — ${window.TL.Util.escape(window.TL.Util.country(c))}` : ""}</button>`)
        .join("");
      suggestBox.classList.add("is-open");
      suggestBox.querySelectorAll("button[data-idx]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const city = matches[Number(btn.dataset.idx)];
          selectedCityName = window.TL.Util.name(city);
          input.value = selectedCityName;
          suggestBox.classList.remove("is-open");
        });
      });
    });

    document.addEventListener("click", (e) => {
      if (!suggestBox.contains(e.target) && e.target !== input) {
        suggestBox.classList.remove("is-open");
      }
    });
  }

  /* --------------------------- Weather rendering --------------------------- */

  function renderWeatherCard(data) {
    const mount = document.getElementById("weather-result");
    const city = window.TL.Util.pick(data, ["city"], "");
    const country = window.TL.Util.pick(data, ["country"], "");
    const temperature = window.TL.Util.pick(data, ["weather.temperature", "temperature"], null);
    const humidity = window.TL.Util.pick(data, ["weather.humidity", "humidity"], null);
    const wind = window.TL.Util.pick(data, ["weather.wind_speed", "wind_speed"], null);
    const condition = window.TL.Util.pick(data, ["weather.condition", "condition"], "");
    const forecastDate = window.TL.Util.pick(data, ["forecast_date"], "");

    mount.innerHTML = `
    <div class="tl-card tl-weather-card">
      <span class="tl-eyebrow">${window.TL.Util.escape(city)}${country ? `, ${window.TL.Util.escape(country)}` : ""}</span>
      <div class="tl-weather-temp">${temperature !== null ? `${window.TL.Util.escape(temperature)}°` : "—"}</div>
      ${condition ? `<div class="tl-weather-condition">${window.TL.Util.escape(condition)}</div>` : ""}
      <div class="tl-weather-stats">
        ${humidity !== null ? `<div class="tl-weather-stat"><strong>${window.TL.Util.escape(humidity)}%</strong><span>Humidity</span></div>` : ""}
        ${wind !== null ? `<div class="tl-weather-stat"><strong>${window.TL.Util.escape(wind)}</strong><span>Wind</span></div>` : ""}
        ${forecastDate ? `<div class="tl-weather-stat"><strong>${window.TL.Util.escape(forecastDate)}</strong><span>Forecast Date</span></div>` : ""}
      </div>
    </div>`;
  }

  async function loadExistingWeather(tripId) {
    const mount = document.getElementById("weather-result");
    mount.innerHTML = `<div class="tl-skel" style="height:220px;border-radius:var(--tl-radius-xl);"></div>`;
    try {
      const response = await window.TL.Weather.get(tripId);
      const data = window.TL.Util.pick(response, ["data"], response);
      const hasData = data && (window.TL.Util.pick(data, ["city"], null) || window.TL.Util.pick(data, ["weather"], null));
      if (hasData) {
        renderWeatherCard(data);
      } else {
        mount.innerHTML = window.TL.Util.emptyState("No weather saved for this trip yet", "Search a city above to add one.");
      }
    } catch (err) {
      if (err.status === 404) {
        mount.innerHTML = window.TL.Util.emptyState("No weather saved for this trip yet", "Search a city above to add one.");
      } else {
        mount.innerHTML = "";
      }
    }
  }

  function wireFetchButton() {
    const btn = document.getElementById("weather-fetch-btn");
    btn.addEventListener("click", async () => {
      const tripId = document.getElementById("weather-trip-select").value;
      const city = selectedCityName || document.getElementById("weather-city-input").value.trim();

      if (!tripId) {
        window.TL.toast("Select a trip first.", "error");
        return;
      }
      if (!city) {
        window.TL.toast("Enter or select a city.", "error");
        return;
      }

      window.TL.Cart.setActiveTripId(tripId);
      const original = btn.textContent;
      btn.disabled = true;
      btn.textContent = "Fetching…";
      const mount = document.getElementById("weather-result");
      mount.innerHTML = `<div class="tl-skel" style="height:220px;border-radius:var(--tl-radius-xl);"></div>`;

      try {
        const response = await window.TL.Weather.save(tripId, { city });
        const data = window.TL.Util.pick(response, ["data"], response);
        renderWeatherCard(data);
        window.TL.toast("Weather updated!");
      } catch (err) {
        if (err.status === 422 && err.errors) {
          const messages = Object.values(err.errors).flat().join(" ");
          mount.innerHTML = window.TL.Util.errorState(messages || err.message);
        } else if (err.status === 404) {
          mount.innerHTML = window.TL.Util.errorState("That trip couldn't be found.");
        } else {
          mount.innerHTML = window.TL.Util.errorState(err.message);
        }
        window.TL.toast(err.message || "Couldn't fetch weather.", "error");
      } finally {
        btn.disabled = false;
        btn.textContent = original;
      }
    });
  }

  /* --------------------------- Init --------------------------- */

  async function init() {
    const signedOut = document.getElementById("weather-signed-out");
    const shell = document.getElementById("weather-shell");

    if (!window.TL.Auth.isAuthenticated()) {
      signedOut.classList.remove("tl-hidden");
      shell.classList.add("tl-hidden");
      return;
    }
    signedOut.classList.add("tl-hidden");
    shell.classList.remove("tl-hidden");

    wireCityAutocomplete();
    wireFetchButton();
    loadCities();

    const tripId = await loadTrips();
    if (tripId) {
      document.getElementById("weather-trip-select").addEventListener("change", (e) => {
        window.TL.Cart.setActiveTripId(e.target.value);
        loadExistingWeather(e.target.value);
      });
      loadExistingWeather(tripId);
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
