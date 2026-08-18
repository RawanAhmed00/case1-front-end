/**
 * TAILORA USER — ATTRACTIONS & CATEGORIES API
 * Endpoints: GET /attractions, /attractions/{id}, /categories, /categories/{id}
 */
(function () {
  "use strict";

  const Attractions = {
    all() {
      return window.TL.Api.get("/attractions");
    },
    get(id) {
      return window.TL.Api.get(`/attractions/${id}`);
    }
  };

  const Categories = {
    all() {
      return window.TL.Api.get("/categories");
    },
    get(id) {
      return window.TL.Api.get(`/categories/${id}`);
    }
  };

  window.TL = window.TL || {};
  window.TL.Attractions = Attractions;
  window.TL.Categories = Categories;
})();
