/* ==========================================================================
   TAILORA ADMIN — assets/js/api/cities.js
   Owns: /admin/cities (3 documented endpoints).

   NOTE — no GET/list endpoint is documented for cities. There is no
   getCities()/getCity() here; see the Step 3 handoff notes.

   NOTE — cities take a `country_id`, but no Countries CRUD endpoints are
   documented anywhere in the Admin API. There is deliberately no
   countries.js module — see the Step 3 handoff notes for this gap.

   Create/Update use multipart/form-data per the docs (there's an `image`
   file field).
   ========================================================================== */

(function () {
  "use strict";

  function toFormData(fields) {
    const fd = new FormData();
    Object.entries(fields || {}).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      fd.append(key, value);
    });
    return fd;
  }

  // POST /admin/cities
  // fields: country_id, name, description, image (File)
  function createCity(fields) {
    return window.TL.Api.postForm("/cities", toFormData(fields));
  }

  // PUT /admin/cities/{id}
  function updateCity(id, fields) {
    return window.TL.Api.putForm(`/cities/${encodeURIComponent(id)}`, toFormData(fields));
  }

  // DELETE /admin/cities/{id}
  function deleteCity(id) {
    return window.TL.Api.delete(`/cities/${encodeURIComponent(id)}`);
  }

  window.TL = window.TL || {};
  window.TL.Cities = {
    createCity,
    updateCity,
    deleteCity,
  };
})();
