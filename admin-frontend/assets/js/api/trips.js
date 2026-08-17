/* ==========================================================================
   TAILORA ADMIN — assets/js/api/trips.js
   Owns: /admin/trips-admin (4 documented endpoints).

   NOTE the path is `trips-admin`, not `trips` — that's the exact
   documented route, not a typo.

   NOTE — the "Get All Trips" response includes pagination `meta`
   (current_page, last_page, per_page, total), which implies the backend
   accepts pagination query params, but the docs never state their names.
   getTrips() accepts an optional query object and passes it straight
   through to the centralized client rather than guessing param names
   like page/per_page — see the Step 3 handoff notes for this gap.
   ========================================================================== */

(function () {
  "use strict";

  // GET /trips-admin
  // `query` is passed through as-is (e.g. { page: 2 }) if the caller has
  // confirmed real param names against the backend; omit it otherwise.
  function getTrips(query) {
    return window.TL.Api.get("/trips-admin", query);
  }

  // GET /admin/trips-admin/statistics
  function getTripStatistics() {
    return window.TL.Api.get("/trips-admin/statistics");
  }

  // PUT /admin/trips-admin/{trip}
  // body: { num_days, travel_style, dis_country, budget, interst,
  //         number_of_travelers, user_id }
  function updateTrip(tripId, data) {
    return window.TL.Api.put(`/trips-admin/${encodeURIComponent(tripId)}`, data);
  }

  // DELETE /admin/trips-admin/{trip}
  function deleteTrip(tripId) {
    return window.TL.Api.delete(`/trips-admin/${encodeURIComponent(tripId)}`);
  }

  window.TL = window.TL || {};
  window.TL.Trips = {
    getTrips,
    getTripStatistics,
    updateTrip,
    deleteTrip,
  };
})();
