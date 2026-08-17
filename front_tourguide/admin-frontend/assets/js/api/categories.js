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

  // POST /admin/categories
  function createCategory(data) {
    return window.TL.Api.post(
      "/admin/categories",
      data
    );
  }

  // PUT /admin/categories/{id}
  function updateCategory(id, data) {
    return window.TL.Api.put(
      "/admin/categories/" + encodeURIComponent(id),
      data
    );
  }

  // DELETE /admin/categories/{id}
  function deleteCategory(id) {
    return window.TL.Api.delete(
      "/admin/categories/" + encodeURIComponent(id)
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