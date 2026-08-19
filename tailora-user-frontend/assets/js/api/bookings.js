/**
 * TAILORA USER — BOOKINGS API
 * GET    /bookings
 * POST   /bookings
 * GET    /bookings/{id}
 * DELETE /bookings/{id}
 */
(function () {
  "use strict";

  const Bookings = {
    all(params) {
      return window.TL.Api.get("/bookings", params);
    },
    get(id) {
      return window.TL.Api.get(`/bookings/${id}`);
    },
    create(payload) {
      return window.TL.Api.post("/bookings", payload);
    },
    remove(id) {
      return window.TL.Api.delete(`/bookings/${id}`);
    }
  };

  window.TL = window.TL || {};
  window.TL.Bookings = Bookings;
})();
