/**
 * TAILORA USER — CITY WEATHER PAGE WITH SEARCHABLE AUTOCOMPLETE & DYNAMIC DATE
 * GET  /cities                   (city autocomplete search via API)
 * GET  /weather?city={city}&city_id={id}&date={date}
 */
(function () {
  "use strict";

  let selectedCityId = null;
  let selectedCityName = "";
  let searchDebounceTimer = null;

  function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function getSelectedDate() {
    const dateInput = document.getElementById("weather-date-input");
    return dateInput && dateInput.value ? dateInput.value : new Date().toISOString().split("T")[0];
  }

  /* --------------------------- City Autocomplete --------------------------- */

  function wireCityAutocomplete() {
    const input = document.getElementById("weather-city-input");
    const hiddenIdInput = document.getElementById("weather-city-id");
    const suggestBox = document.getElementById("weather-city-suggest");

    if (!input || !suggestBox) return;

    input.addEventListener("input", () => {
      selectedCityId = null;
      selectedCityName = "";
      if (hiddenIdInput) hiddenIdInput.value = "";

      const q = input.value.trim();
      if (q.length < 1) {
        suggestBox.classList.remove("is-open");
        suggestBox.innerHTML = "";
        return;
      }

      clearTimeout(searchDebounceTimer);
      suggestBox.innerHTML = `<div style="padding:10px 14px;font-size:13px;color:var(--tl-text-secondary);">Searching cities…</div>`;
      suggestBox.classList.add("is-open");

      searchDebounceTimer = setTimeout(async () => {
        try {
          const response = await window.TL.Cities.search(q);
          const cities = window.TL.Util.list(response);

          if (!cities || !cities.length) {
            suggestBox.innerHTML = `<div style="padding:10px 14px;font-size:13px;color:var(--tl-text-secondary);">No cities found</div>`;
            return;
          }

          suggestBox.innerHTML = cities
            .slice(0, 8)
            .map((c, i) => {
              const id = window.TL.Util.id(c);
              const name = window.TL.Util.name(c);
              const country = window.TL.Util.country(c);
              return `<button type="button" data-idx="${i}">${window.TL.Util.escape(name)}${country ? ` — ${window.TL.Util.escape(country)}` : ""}</button>`;
            })
            .join("");

          suggestBox.querySelectorAll("button[data-idx]").forEach((btn) => {
            btn.addEventListener("click", () => {
              const idx = Number(btn.dataset.idx);
              const cityObj = cities[idx];
              selectedCityId = window.TL.Util.id(cityObj);
              selectedCityName = window.TL.Util.name(cityObj);
              input.value = selectedCityName;
              if (hiddenIdInput) hiddenIdInput.value = selectedCityId;
              suggestBox.classList.remove("is-open");

              fetchCityWeather({
                cityId: selectedCityId,
                city: selectedCityName,
                date: getSelectedDate()
              });
            });
          });
        } catch (err) {
          suggestBox.innerHTML = `<div style="padding:10px 14px;font-size:13px;color:var(--tl-danger, #f87171);">Unable to load cities</div>`;
        }
      }, 250);
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        suggestBox.classList.remove("is-open");
        const cityVal = input.value.trim();
        const cityIdVal = hiddenIdInput ? hiddenIdInput.value : selectedCityId;
        if (!cityVal && !cityIdVal) {
          window.TL.toast("Enter or select a city.", "error");
          return;
        }
        fetchCityWeather({
          cityId: cityIdVal,
          city: cityVal,
          date: getSelectedDate()
        });
      }
    });

    document.addEventListener("click", (e) => {
      if (!suggestBox.contains(e.target) && e.target !== input) {
        suggestBox.classList.remove("is-open");
      }
    });
  }

  function wireDateInput() {
    const dateInput = document.getElementById("weather-date-input");
    const hiddenIdInput = document.getElementById("weather-city-id");
    if (!dateInput) return;

    if (!dateInput.value) {
      dateInput.value = new Date().toISOString().split("T")[0];
    }

    const handleDateChange = () => {
      const cityVal = selectedCityName || document.getElementById("weather-city-input").value.trim();
      const cityIdVal = hiddenIdInput ? hiddenIdInput.value : selectedCityId;
      if (cityVal || cityIdVal) {
        fetchCityWeather({
          cityId: cityIdVal,
          city: cityVal,
          date: dateInput.value
        });
      }
    };
    dateInput.addEventListener("change", handleDateChange);
    dateInput.addEventListener("input", handleDateChange);
  }

  /* --------------------------- Weather Rendering --------------------------- */

  function renderWeatherCard(data) {
    const mount = document.getElementById("weather-result");
    const city = window.TL.Util.pick(data, ["city"], "");
    const country = window.TL.Util.pick(data, ["country"], "");
    const temperature = window.TL.Util.pick(data, ["weather.temperature", "temperature"], null);
    const humidity = window.TL.Util.pick(data, ["weather.humidity", "humidity"], null);
    const wind = window.TL.Util.pick(data, ["weather.wind_speed", "wind_speed"], null);
    const condition = window.TL.Util.pick(data, ["weather.condition", "condition"], "");
    const forecastDate = window.TL.Util.pick(data, ["forecast_date"], "");
    
    let formattedForecastDate = "";
    if (forecastDate) {
      try {
        const parts = String(forecastDate).split("-");
        if (parts.length === 3) {
          const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
          formattedForecastDate = d.toLocaleDateString(undefined, {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
        } else {
          formattedForecastDate = window.TL.Util.formatDate(forecastDate);
        }
      } catch (e) {
        formattedForecastDate = window.TL.Util.formatDate(forecastDate);
      }
    }

    mount.innerHTML = `
    <div class="tl-card tl-weather-card">
      <span class="tl-eyebrow">${window.TL.Util.escape(city)}${country ? `, ${window.TL.Util.escape(country)}` : ""}</span>
      <div class="tl-weather-temp">${temperature !== null ? `${window.TL.Util.escape(temperature)}°` : "—"}</div>
      ${condition ? `<div class="tl-weather-condition">${window.TL.Util.escape(condition)}</div>` : ""}
      <div class="tl-weather-stats">
        ${humidity !== null ? `<div class="tl-weather-stat"><strong>${window.TL.Util.escape(humidity)}%</strong><span>Humidity</span></div>` : ""}
        ${wind !== null ? `<div class="tl-weather-stat"><strong>${window.TL.Util.escape(wind)}</strong><span>Wind</span></div>` : ""}
        ${formattedForecastDate ? `<div class="tl-weather-stat"><strong>${formattedForecastDate}</strong><span>Selected Date</span></div>` : ""}
      </div>
    </div>`;
  }

  async function fetchCityWeather(cityParams, dateStr) {
    let payload = {};
    if (typeof cityParams === "object" && cityParams !== null) {
      payload = cityParams;
    } else {
      payload = {
        city: String(cityParams || ""),
        date: dateStr || getSelectedDate()
      };
    }

    const btn = document.getElementById("weather-fetch-btn");
    const original = btn ? btn.textContent : "Get Weather";
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Fetching…";
    }
    const mount = document.getElementById("weather-result");
    mount.innerHTML = `<div class="tl-skel" style="height:220px;border-radius:var(--tl-radius-xl);"></div>`;

    try {
      const response = await window.TL.Weather.getByCity(payload);
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
    const hiddenIdInput = document.getElementById("weather-city-id");
    btn.addEventListener("click", () => {
      const cityVal = selectedCityName || document.getElementById("weather-city-input").value.trim();
      const cityIdVal = hiddenIdInput ? hiddenIdInput.value : selectedCityId;
      if (!cityVal && !cityIdVal) {
        window.TL.toast("Enter or select a city.", "error");
        return;
      }
      fetchCityWeather({
        cityId: cityIdVal,
        city: cityVal,
        date: getSelectedDate()
      });
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
    wireDateInput();
    wireFetchButton();

    // Auto-display initial/saved city or query params
    const initialCityId = getParam("city_id") || getParam("cityId");
    const initialCity = getParam("city");
    const initialDate = getParam("date");

    if (initialDate) {
      const dateInput = document.getElementById("weather-date-input");
      if (dateInput) dateInput.value = initialDate;
    }

    if (initialCityId) {
      try {
        const response = await window.TL.Cities.get(initialCityId);
        const cityObj = window.TL.Util.pick(response, ["data"], response);
        if (cityObj) {
          selectedCityId = window.TL.Util.id(cityObj);
          selectedCityName = window.TL.Util.name(cityObj);
          document.getElementById("weather-city-input").value = selectedCityName;
          const hiddenIdInput = document.getElementById("weather-city-id");
          if (hiddenIdInput) hiddenIdInput.value = selectedCityId;

          fetchCityWeather({
            cityId: selectedCityId,
            city: selectedCityName,
            date: getSelectedDate()
          });
        }
      } catch (e) {
        if (initialCity) {
          document.getElementById("weather-city-input").value = initialCity;
          fetchCityWeather({ city: initialCity, date: getSelectedDate() });
        }
      }
    } else if (initialCity) {
      document.getElementById("weather-city-input").value = initialCity;
      fetchCityWeather({ city: initialCity, date: getSelectedDate() });
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
