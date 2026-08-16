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

  // GET/POST /weather/trips/{tripId}
  const Weather = {
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