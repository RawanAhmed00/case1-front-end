/* ==========================================================================
   TAILORA ADMIN — assets/js/api/attractions.js
   Owns: /attractions endpoints (GET, POST, PUT, DELETE).
   ========================================================================== */

(function () {
  "use strict";

  function toFormData(fields) {
    if (fields instanceof FormData) return fields;
    const fd = new FormData();
    Object.entries(fields || {}).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      if (key === "categories") {
        if (Array.isArray(value)) {
          value.forEach(v => {
            if (v !== "" && v !== null && v !== undefined) fd.append("categories[]", v);
          });
        } else if (typeof value === "string") {
          const parts = value.split(",").map(s => s.trim()).filter(Boolean);
          parts.forEach(v => fd.append("categories[]", v));
        }
      } else {
        fd.append(key, value);
      }
    });
    return fd;
  }

  // GET /attractions
  function getAttractions(query) {
    return window.TL.Api.get("/attractions", query);
  }

  // GET /attractions/{id}
  function getAttraction(id) {
    return window.TL.Api.get(`/attractions/${encodeURIComponent(id)}`);
  }

  // POST /attractions
  // fields: city_id, name, description, latitude, longitude, price, image (File), categories
  function createAttraction(fields) {
    return window.TL.Api.postForm("/attractions", toFormData(fields));
  }

  // PUT /attractions/{id}
  function updateAttraction(id, fields) {
    return window.TL.Api.putForm(`/attractions/${encodeURIComponent(id)}`, toFormData(fields));
  }

  // DELETE /attractions/{id}
  function deleteAttraction(id) {
    return window.TL.Api.delete(`/attractions/${encodeURIComponent(id)}`);
  }

  window.TL = window.TL || {};
  window.TL.Attractions = {
    getAttractions,
    getAttraction,
    createAttraction,
    updateAttraction,
    deleteAttraction,
  };
})();
