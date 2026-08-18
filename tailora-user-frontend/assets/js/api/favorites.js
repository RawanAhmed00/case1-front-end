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
      return window.TL.Api.get("favorites/favorites");
    },
    add(type, id) {
      return window.TL.Api.post("/favorites", {
        type: type,
        id: id
      });
    },
    remove(type, id) {
      return window.TL.Api.delete("/favorites", {
        body: { type: type, id: id }
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

  async function fetchDirectCityWeather(city) {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
    const geoRes = await fetch(geoUrl);
    if (!geoRes.ok) throw new Error("Could not find location data for that city.");
    const geoData = await geoRes.json();
    if (!geoData.results || !geoData.results.length) {
      throw new Error(`No weather data found for "${city}".`);
    }
    const loc = geoData.results[0];
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=auto`;
    const weatherRes = await fetch(weatherUrl);
    if (!weatherRes.ok) throw new Error("Could not fetch weather forecast.");
    const weatherData = await weatherRes.json();
    const current = weatherData.current || {};

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
      temperature: current.temperature_2m !== undefined ? current.temperature_2m : null,
      humidity: current.relative_humidity_2m !== undefined ? current.relative_humidity_2m : null,
      wind_speed: current.wind_speed_10m !== undefined ? current.wind_speed_10m : null,
      condition: WMO_CODES[current.weather_code] || "Clear",
      forecast_date: new Date().toISOString().split("T")[0]
    };
  }

  // Weather API: city-based and trip-based
  const Weather = {
    async getByCity(city) {
      if (window.TL && window.TL.Trips && typeof window.TL.Trips.all === "function") {
        try {
          const tripsRes = await window.TL.Trips.all();
          const trips = window.TL.Util.list(tripsRes);
          if (trips.length > 0) {
            const tripId = window.TL.Util.id(trips[0]);
            return await window.TL.Api.post(`/weather/trips/${tripId}`, { city });
          }
        } catch (e) {
          // Fallback to direct fetch
        }
      }
      return await fetchDirectCityWeather(city);
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