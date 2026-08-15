/* ==========================================================================
   TAILORA ADMIN — assets/js/api/settings.js
   Owns: /admin/website-settings (3 documented endpoints).

   NOTE — no GET is documented for website settings (only create/update/
   delete). There is no getWebsiteSettings() here because there is nothing
   to call; see the Step 3 handoff notes for this gap.

   Create/Update use multipart/form-data per the docs. `logo` and
   `homepage_banner` accept File objects; pass a File (or leave the field
   out) — never a manually-set Content-Type, the browser sets the
   multipart boundary via TL.Api.postForm/putForm.
   ========================================================================== */

(function () {
  "use strict";

  // Builds a FormData instance from a plain object, skipping any field
  // that is undefined or null so callers can omit fields they don't
  // want to touch (relevant for Update, which is a partial multipart
  // request in practice even though Laravel's PUT expects the full set).
  function toFormData(fields) {
    const fd = new FormData();
    Object.entries(fields || {}).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      fd.append(key, value);
    });
    return fd;
  }

  // POST /admin/website-settings
  // fields: site_name, email, phone, address, logo (File), homepage_banner (File), social_media_links
  function createWebsiteSettings(fields) {
    return window.TL.Api.postForm("/website-settings", toFormData(fields));
  }

  // PUT /admin/website-settings/{websiteSetting}
  function updateWebsiteSettings(websiteSettingId, fields) {
    return window.TL.Api.putForm(`/website-settings/${encodeURIComponent(websiteSettingId)}`, toFormData(fields));
  }

  // DELETE /admin/website-settings/{websiteSetting}
  function deleteWebsiteSettings(websiteSettingId) {
    return window.TL.Api.delete(`/website-settings/${encodeURIComponent(websiteSettingId)}`);
  }

  window.TL = window.TL || {};
  window.TL.Settings = {
    createWebsiteSettings,
    updateWebsiteSettings,
    deleteWebsiteSettings,
  };
})();
