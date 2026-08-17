/* ==========================================================================
   TAILORA ADMIN — assets/js/api/categories.js
   Owns: /categories (documented endpoints in Admin document.md Section 8).
   ========================================================================== */

(function () {
  "use strict";

  // GET /categories
  function getCategories() {
    return window.TL.Api.get("/categories");
  }

  // GET /categories/{id}
  function getCategory(id) {
    return window.TL.Api.get(
      "/categories/" + encodeURIComponent(id)
    );
  }

  // POST /categories
  function createCategory(data) {
    return window.TL.Api.post(
      "/categories",
      data
    );
  }

  // PUT /categories/{id}
  function updateCategory(id, data) {
    return window.TL.Api.put(
      "/categories/" + encodeURIComponent(id),
      data
    );
  }

  // DELETE /categories/{id}
  function deleteCategory(id) {
    return window.TL.Api.delete(
      "/categories/" + encodeURIComponent(id)
    );
  }

  window.TL = window.TL || {};

  window.TL.Categories = {
    getCategories: getCategories,
    getCategory: getCategory,
    createCategory: createCategory,
    updateCategory: updateCategory,
    deleteCategory: deleteCategory
  };
})();