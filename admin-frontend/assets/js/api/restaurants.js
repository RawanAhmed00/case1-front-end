/* ==========================================================================
   TAILORA ADMIN — assets/js/api/restaurants.js

   Owns:
   GET    /restaurants
   GET    /restaurants/{id}
   POST   /admin/restaurants
   PUT    /admin/restaurants/{id}
   DELETE /admin/restaurants/{id}

   Restaurant list/details are loaded from the real backend database.
   No hardcoded restaurant data.
   ========================================================================== */

(function () {
  "use strict";

  // ============================================================
  // GET /restaurants
  // Load restaurants from the real database
  // ============================================================

  function getRestaurants(params) {
    return window.TL.Api.get("/restaurants", params || {});
  }


  // ============================================================
  // GET /restaurants/{id}
  // Load one restaurant by ID
  // ============================================================

  function getRestaurant(id) {
    return window.TL.Api.get("/restaurants/" + id);
  }


  // ============================================================
  // POST /admin/restaurants
  // ============================================================

  function createRestaurant(data) {
    return window.TL.Api.post(
      "/restaurants",
      data
    );
  }


  // ============================================================
  // PUT /admin/restaurants/{id}
  // ============================================================

  function updateRestaurant(id, data) {
    return window.TL.Api.put(
      "/restaurants/" + id,
      data
    );
  }


  // ============================================================
  // DELETE /admin/restaurants/{id}
  // ============================================================

  function deleteRestaurant(id) {
    return window.TL.Api.delete(
      "/restaurants/" + id
    );
  }


  // ============================================================
  // Public API
  // ============================================================

  window.TL = window.TL || {};

  window.TL.Restaurants = {
    getRestaurants,
    getRestaurant,
    createRestaurant,
    updateRestaurant,
    deleteRestaurant
  };

})();