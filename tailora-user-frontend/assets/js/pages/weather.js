/**
 * TAILORA USER — CITY WEATHER PAGE
 * GET  /cities                   (city autocomplete search)
 * GET  /weather?city={city}      (fetch city weather directly)
 */
(function () {
  "use strict";

  let allCities = [];
  let selectedCityName = "";

  function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  /* --------------------------- City autocomplete --------------------------- */

  async function loadCities() {
    try {
      const response = typeof window.TL.Cities.allFull === "function"
        ? await window.TL.Cities.allFull()
        : await window.TL.Cities.all();
      allCities = window.TL.Util.list(response);
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
        .filter((c) => {
          const cName = window.TL.Util.name(c, "").toLowerCase();
          const cCountry = window.TL.Util.country(c, "").toLowerCase();
          return cName.includes(q) || cCountry.includes(q);
        })
        .slice(0, 10);

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

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        suggestBox.classList.remove("is-open");
        const city = selectedCityName || input.value.trim();
        if (!city) {
          window.TL.toast("Enter or select a city.", "error");
          return;
        }
        fetchCityWeather(city);
      }
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
    
    const formattedForecastDate = forecastDate ? window.TL.Util.formatDate(forecastDate) : "";

    mount.innerHTML = `
    <div class="tl-card tl-weather-card">
      <span class="tl-eyebrow">${window.TL.Util.escape(city)}${country ? `, ${window.TL.Util.escape(country)}` : ""}</span>
      <div class="tl-weather-temp">${temperature !== null ? `${window.TL.Util.escape(temperature)}°` : "—"}</div>
      ${condition ? `<div class="tl-weather-condition">${window.TL.Util.escape(condition)}</div>` : ""}
      <div class="tl-weather-stats">
        ${humidity !== null ? `<div class="tl-weather-stat"><strong>${window.TL.Util.escape(humidity)}%</strong><span>Humidity</span></div>` : ""}
        ${wind !== null ? `<div class="tl-weather-stat"><strong>${window.TL.Util.escape(wind)}</strong><span>Wind</span></div>` : ""}
        ${formattedForecastDate ? `<div class="tl-weather-stat"><strong>${formattedForecastDate}</strong><span>Forecast Date</span></div>` : ""}
      </div>
    </div>`;
  }

  async function fetchCityWeather(city) {
    const btn = document.getElementById("weather-fetch-btn");
    const original = btn ? btn.textContent : "Get Weather";
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Fetching…";
    }
    const mount = document.getElementById("weather-result");
    mount.innerHTML = `<div class="tl-skel" style="height:220px;border-radius:var(--tl-radius-xl);"></div>`;

    try {
      const response = await window.TL.Weather.getByCity(city);
      const data = window.TL.Util.pick(response, ["data"], response);
      renderWeatherCard(data);
    } catch (err) {
      if (err.status === 422 && err.errors) {
        const messages = Object.values(err.errors).flat().join(" ");
        mount.innerHTML = window.TL.Util.errorState(messages || err.message);
      } else {
        mount.innerHTML = window.TL.Util.errorState(err.message || "Couldn't fetch weather.");
      }
      window.TL.toast(err.message || "Couldn't fetch weather.", "error");
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = original;
      }
    }
  }

  function wireFetchButton() {
    const btn = document.getElementById("weather-fetch-btn");
    btn.addEventListener("click", () => {
      const city = selectedCityName || document.getElementById("weather-city-input").value.trim();
      if (!city) {
        window.TL.toast("Enter or select a city.", "error");
        return;
      }
      fetchCityWeather(city);
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
    await loadCities();

    // Auto-fetch if city param is provided in URL
    const initialCity = getParam("city");
    if (initialCity) {
      const input = document.getElementById("weather-city-input");
      input.value = initialCity;
      fetchCityWeather(initialCity);
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
