/* ==========================================================================
   TAILORA ADMIN — assets/js/api/bookings.js
   Owns: /admin/bookings (4 documented endpoints).
   ========================================================================== */

(function () {
  "use strict";

  // GET /admin/bookings
  function getBookings(query) {
    return window.TL.Api.get("/bookings", query);
  }

  // GET /admin/bookings/{id}
  function getBooking(id) {
    return window.TL.Api.get(`/bookings/${encodeURIComponent(id)}`);
  }

  // PUT /admin/bookings/{id} — body: { status }
  function updateBooking(id, data) {
    return window.TL.Api.put(`/bookings/${encodeURIComponent(id)}`, data);
  }

  // DELETE /admin/bookings/{id}
  function deleteBooking(id) {
    return window.TL.Api.delete(`/bookings/${encodeURIComponent(id)}`);
  }

  window.TL = window.TL || {};
  window.TL.Bookings = {
    getBookings,
    getBooking,
    updateBooking,
    deleteBooking,
  };
})();
