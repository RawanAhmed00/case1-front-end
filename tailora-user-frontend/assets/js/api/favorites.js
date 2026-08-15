/**
 * TAILORA USER — FAVORITES / BOOKINGS / DASHBOARD / WEATHER API
 * All endpoints require authentication.
 */
(function () {
  "use strict";

  // GET /favorites, POST /favorites, DELETE /favorites
  // The docs describe favorites as polymorphic, referenced through
  // `favoritable_id` and `favoritable_type`. The doc doesn't give the exact
  // type strings to send — we use the model class name convention Laravel
  // favorite/polymorphic packages use (e.g. "City", "Hotel", "Restaurant",
  // "Attraction"), matching each catalog's singular resource name. Confirm
  // these against the backend's actual model names before going live.
  const Favorites = {
    all() {
      return window.TL.Api.get("/favorites");
    },
    add(favoritableId, favoritableType) {
      return window.TL.Api.post("/favorites", {
        favoritable_id: favoritableId,
        favoritable_type: favoritableType
      });
    },
    remove(favoritableId, favoritableType) {
      return window.TL.Api.delete("/favorites", {
        body: { favoritable_id: favoritableId, favoritable_type: favoritableType }
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
