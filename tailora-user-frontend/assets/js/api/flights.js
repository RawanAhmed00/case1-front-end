/**
 * TAILORA USER — FLIGHTS API
 *
 * Endpoints (see flights.html / assets/js/pages/flights.js for the flow):
 * GET  /flights/airports          (q, limit)
 * POST /flights/one-way
 * POST /flights/round-trip
 * POST /flights/search            (multi-city / flexible search)
 * POST /flights/select            ({ ignav_id })
 */
(function () {
  "use strict";

  const Flights = {
    searchAirports(q, limit = 8) {
      return window.TL.Api.get("/flights/airports", { q, limit });
    },
    oneWay(payload) {
      return window.TL.Api.post("/flights/one-way", payload);
    },
    roundTrip(payload) {
      return window.TL.Api.post("/flights/round-trip", payload);
    },
    multiCity(payload) {
      return window.TL.Api.post("/flights/search", payload);
    },
    // IMPORTANT: selection is keyed by ignav_id, never the flight's database id.
    select(ignavId) {
      return window.TL.Api.post("/flights/select", { ignav_id: ignavId });
    }
  };

  window.TL = window.TL || {};
  window.TL.Flights = Flights;
})();
