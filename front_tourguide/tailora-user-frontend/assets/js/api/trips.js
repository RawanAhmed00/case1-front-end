/**
 * TAILORA USER — TRIPS API
 * All endpoints require authentication.
 * GET    /trips
 * POST   /trips
 * GET    /trips/{id}
 * DELETE /trips/{id}
 * POST   /trips/trips/{id}/cities
 * PUT    /trips/trip-days/{id}/city
 * GET    /trips/trip-days/{id}/attractions
 * POST   /trips/trip-days/{tripDayId}/attractions
 * GET    /trips/trips/{id}/full
 */
(function () {
  "use strict";

  const Trips = {
    all() {
      return window.TL.Api.get("/trips");
    },
    create(payload) {
      return window.TL.Api.post("/trips", payload);
    },
    get(id) {
      return window.TL.Api.get(`/trips/${id}`);
    },
    remove(id) {
      return window.TL.Api.delete(`/trips/${id}`);
    },
    selectCities(tripId, payload) {
      return window.TL.Api.post(`/trips/trips/${tripId}/cities`, payload);
    },
    updateDayCity(tripDayId, payload) {
      return window.TL.Api.put(`/trips/trip-days/${tripDayId}/city`, payload);
    },
    getDayAttractions(tripDayId) {
      return window.TL.Api.get(`/trips/trip-days/${tripDayId}/attractions`);
    },
    selectDayAttractions(tripDayId, payload) {
      return window.TL.Api.post(`/trips/trip-days/${tripDayId}/attractions`, payload);
    },
    getFull(tripId) {
      return window.TL.Api.get(`/trips/trips/${tripId}/full`);
    }
  };

  window.TL = window.TL || {};
  window.TL.Trips = Trips;
})();
