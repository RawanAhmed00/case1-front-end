/**
 * TAILORA USER — ATTRACTIONS & CATEGORIES API
 *
 * Endpoints:
 * GET /attractions
 * GET /attractions/{id}
 * GET /map/attractions
 * GET /categories
 * GET /categories/{id}
 */

(function () {
  "use strict";

  const Attractions = {
    all() {
      return window.TL.Api.get("/attractions");
    },

    get(id) {
      return window.TL.Api.get(
        "/attractions/" + id
      );
    },

    mapped() {
      return window.TL.Api.get(
        "/map/attractions"
      );
    }
  };

  const Categories = {
    all() {
      return window.TL.Api.get("/categories");
    },

    get(id) {
      return window.TL.Api.get(
        "/categories/" + id
      );
    }
  };

  window.TL = window.TL || {};

  window.TL.Attractions =
    Attractions;

  window.TL.Categories =
    Categories;
})();