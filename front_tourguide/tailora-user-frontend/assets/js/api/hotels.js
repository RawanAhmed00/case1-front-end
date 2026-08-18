/**
 * TAILORA USER — HOTELS & RESTAURANTS API
 * Endpoints: GET /hotels, /hotels/{id}, /restaurants, /restaurants/{id}
 * No query/filter parameters are documented for these list endpoints, so
 * search and filtering on the Hotels/Restaurants pages is done client-side
 * over the full result set returned by the API.
 */
(function () {
  "use strict";

  const Hotels = {
    all() {
      return window.TL.Api.get("/hotels");
    },
    get(id) {
      return window.TL.Api.get(`/hotels/${id}`);
    }
  };

  const Restaurants = {
    all() {
      return window.TL.Api.get("/restaurants");
    },
    get(id) {
      return window.TL.Api.get(`/restaurants/${id}`);
    }
  };

  window.TL = window.TL || {};
  window.TL.Hotels = Hotels;
  window.TL.Restaurants = Restaurants;
})();
