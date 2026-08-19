/**
 * TAILORA USER — FAVORITES / BOOKINGS / DASHBOARD / WEATHER API
 * All endpoints require authentication.
 */
(function () {
  "use strict";

  // GET /favorites, POST /favorites, DELETE /favorites
  // Favorites are polymorphic, referenced through a `type` string that
  // matches the backend's model class name — capitalized, singular
  // (confirmed via live response: "Hotel"). Use the same convention for
  // other resources: "Country", "Restaurant", "Attraction", etc.
  // Confirm any type you haven't tested yet against the backend before
  // relying on it.
  const Favorites = {
    all() {
      return window.TL.Api.get("/favorites");
    },
    add(type, id) {
      return window.TL.Api.post("/favorites", {
        type: String(type).toLowerCase(),
        id: Number(id)
      });
    },
    remove(type, id) {
      return window.TL.Api.delete(`/favorites?type=${encodeURIComponent(String(type).toLowerCase())}&id=${encodeURIComponent(Number(id))}`, {
        type: String(type).toLowerCase(),
        id: Number(id)
      });
    }
  };

  // GET /bookings, POST /bookings, GET /bookings/{id}
  const Bookings = {
    all() {
      return window.TL.Api.get("/bookings");
    },
    create(payload) {
      return window.TL.Api.post("/bookings", payload);
    },
    get(id) {
      return window.TL.Api.get(`/bookings/${id}`);
    }
  };

  // GET /dashboard, /dashboard/statistics, /dashboard/trips,
  // /dashboard/favorites, /dashboard/bookings
  const Dashboard = {
    full() {
      return window.TL.Api.get("/dashboard");
    },
    statistics() {
      return window.TL.Api.get("/dashboard/statistics");
    },
    trips() {
      return window.TL.Api.get("/dashboard/trips");
    },
    favorites() {
      return window.TL.Api.get("/dashboard/favorites");
    },
    bookings() {
      return window.TL.Api.get("/dashboard/bookings");
    }
  };

  async function fetchDirectCityWeather(city, dateStr) {
    const targetDate = dateStr || new Date().toISOString().split("T")[0];
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
    const geoRes = await fetch(geoUrl);
    if (!geoRes.ok) throw new Error("Could not find location data for that city.");
    const geoData = await geoRes.json();
    if (!geoData.results || !geoData.results.length) {
      throw new Error(`No weather data found for "${city}".`);
    }
    const loc = geoData.results[0];

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&start_date=${targetDate}&end_date=${targetDate}&daily=temperature_2m_max,relative_humidity_2m_mean,wind_speed_10m_max,weather_code&timezone=auto`;
    let temp = null, humidity = null, wind = null, code = null;

    try {
      const weatherRes = await fetch(weatherUrl);
      if (weatherRes.ok) {
        const weatherData = await weatherRes.json();
        if (weatherData.daily && weatherData.daily.time && weatherData.daily.time.length > 0) {
          const d = weatherData.daily;
          temp = d.temperature_2m_max && d.temperature_2m_max[0] !== undefined ? d.temperature_2m_max[0] : null;
          humidity = d.relative_humidity_2m_mean && d.relative_humidity_2m_mean[0] !== undefined ? d.relative_humidity_2m_mean[0] : null;
          wind = d.wind_speed_10m_max && d.wind_speed_10m_max[0] !== undefined ? d.wind_speed_10m_max[0] : null;
          code = d.weather_code && d.weather_code[0] !== undefined ? d.weather_code[0] : null;
        }
      }
    } catch (e) {}

    if (temp === null) {
      const currentUrl = `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=auto`;
      const currentRes = await fetch(currentUrl);
      if (!currentRes.ok) throw new Error("Could not fetch weather forecast.");
      const currentData = await currentRes.json();
      const current = currentData.current || {};
      temp = current.temperature_2m !== undefined ? current.temperature_2m : null;
      humidity = current.relative_humidity_2m !== undefined ? current.relative_humidity_2m : null;
      wind = current.wind_speed_10m !== undefined ? current.wind_speed_10m : null;
      code = current.weather_code !== undefined ? current.weather_code : null;
    }

    const WMO_CODES = {
      0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
      45: "Fog", 48: "Depositing rime fog",
      51: "Drizzle: Light", 53: "Drizzle: Moderate", 55: "Drizzle: Dense",
      61: "Rain: Slight", 63: "Rain: Moderate", 65: "Rain: Heavy",
      71: "Snow fall: Slight", 73: "Snow fall: Moderate", 75: "Snow fall: Heavy",
      80: "Rain showers: Slight", 81: "Rain showers: Moderate", 82: "Rain showers: Violent",
      95: "Thunderstorm", 96: "Thunderstorm with light hail", 99: "Thunderstorm with heavy hail"
    };

    return {
      city: loc.name,
      country: loc.country || "",
      temperature: temp,
      humidity: humidity,
      wind_speed: wind,
      condition: WMO_CODES[code] || "Clear sky",
      forecast_date: targetDate
    };
  }

  // Weather API: city-based and trip-based
  const Weather = {
    async getByCity(cityOrParams, date) {
      let city = "";
      let cityId = null;
      let targetDate = date;

      if (typeof cityOrParams === "object" && cityOrParams !== null) {
        city = cityOrParams.city || "";
        cityId = cityOrParams.cityId || cityOrParams.city_id || null;
        targetDate = cityOrParams.date || date;
      } else {
        city = String(cityOrParams || "");
      }

      try {
        const directData = await fetchDirectCityWeather(city, targetDate);
        if (cityId) directData.city_id = cityId;

        if (window.TL && window.TL.Trips && typeof window.TL.Trips.all === "function") {
          window.TL.Trips.all().then((tripsRes) => {
            const trips = window.TL.Util.list(tripsRes);
            if (trips.length > 0) {
              const tripId = window.TL.Util.id(trips[0]);
              window.TL.Api.post(`/weather/trips/${tripId}`, { city, city_id: cityId, date: targetDate }).catch(() => {});
            }
          }).catch(() => {});
        }
        return directData;
      } catch (e) {
        if (window.TL && window.TL.Trips && typeof window.TL.Trips.all === "function") {
          const tripsRes = await window.TL.Trips.all();
          const trips = window.TL.Util.list(tripsRes);
          if (trips.length > 0) {
            const tripId = window.TL.Util.id(trips[0]);
            return await window.TL.Api.post(`/weather/trips/${tripId}`, { city, city_id: cityId, date: targetDate });
          }
        }
        throw e;
      }
    },
    get(tripId) {
      return window.TL.Api.get(`/weather/trips/${tripId}`);
    },
    save(tripId, payload) {
      return window.TL.Api.post(`/weather/trips/${tripId}`, payload);
    }
  };

  window.TL = window.TL || {};
  window.TL.Favorites = Favorites;
  window.TL.Bookings = Bookings;
  window.TL.Dashboard = Dashboard;
  window.TL.Weather = Weather;
})();