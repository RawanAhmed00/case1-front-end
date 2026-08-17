/* ==========================================================================
   TAILORA ADMIN — assets/js/api/cities.js
   Owns: /cities endpoints (GET, POST, PUT, DELETE).
   ========================================================================== */

(function () {
  "use strict";

  function toFormData(fields) {
    if (fields instanceof FormData) return fields;
    const fd = new FormData();
    Object.entries(fields || {}).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      fd.append(key, value);
    });
    return fd;
  }

  // GET /cities
  function getCities(query) {
    return window.TL.Api.get("/cities", query);
  }

  // GET /cities/{id}
  function getCity(id) {
    return window.TL.Api.get(`/cities/${encodeURIComponent(id)}`);
  }

  // POST /cities
  // fields: country_id, name, description, image (File)
  function createCity(fields) {
    return window.TL.Api.postForm("/cities", toFormData(fields));
  }

  // PUT /cities/{id}
  function updateCity(id, fields) {
    return window.TL.Api.putForm(`/cities/${encodeURIComponent(id)}`, toFormData(fields));
  }

  // DELETE /cities/{id}
  function deleteCity(id) {
    return window.TL.Api.delete(`/cities/${encodeURIComponent(id)}`);
  }

  window.TL = window.TL || {};
  window.TL.Cities = {
    getCities,
    getCity,
    createCity,
    updateCity,
    deleteCity,
  };
})();
