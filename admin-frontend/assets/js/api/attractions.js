/* ==========================================================================
   TAILORA ADMIN — assets/js/api/attractions.js
   Owns: /admin/attractions (3 documented endpoints).

   NOTE — no GET/list endpoint is documented for attractions. There is no
   getAttractions()/getAttraction() here; see the Step 3 handoff notes.

   Create/Update use multipart/form-data per the docs (there's an `image`
   file field). `categories` is documented only as a plain "text" field —
   the docs don't confirm whether it accepts a comma-separated string, a
   single ID, or repeated fields, so it's passed through as given rather
   than reshaped.
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

  // POST /admin/attractions
  // fields: city_id, name, description, latitude, longitude, price, image (File), categories
  function createAttraction(fields) {
    return window.TL.Api.postForm("/attractions", toFormData(fields));
  }

  // PUT /admin/attractions/{id}
  function updateAttraction(id, fields) {
    return window.TL.Api.putForm(`/attractions/${encodeURIComponent(id)}`, toFormData(fields));
  }

  // DELETE /admin/attractions/{id}
  function deleteAttraction(id) {
    return window.TL.Api.delete(`/attractions/${encodeURIComponent(id)}`);
  }

  window.TL = window.TL || {};
  window.TL.Attractions = {
    createAttraction,
    updateAttraction,
    deleteAttraction,
  };
})();
