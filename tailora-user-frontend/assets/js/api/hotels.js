/**
 * TAILORA USER — HOTELS & RESTAURANTS API
 *
 * Endpoints:
 * GET /hotels
 * GET /hotels/{id}
 * GET /map/hotels
 * GET /restaurants
 * GET /restaurants/{id}
 * GET /map/restaurants
 */

(function () {
  "use strict";

  const Hotels = {
    all(query = {}) {
      return window.TL.Api.get("/hotels", query);
    },

    get(id) {
      return window.TL.Api.get("/hotels/" + id);
    },

    mapped() {
      return window.TL.Api.get("/map/hotels");
    }
  };

 const Restaurants = {
  all(query = {}) {
    return window.TL.Api.get("/restaurants", query);
  },

  get(id) {
    return window.TL.Api.get("/restaurants/" + id);
  },

  mapped() {
    return window.TL.Api.get("/map/restaurants");
  }
};

  window.TL = window.TL || {};

  window.TL.Hotels = Hotels;
  window.TL.Restaurants = Restaurants;
})();