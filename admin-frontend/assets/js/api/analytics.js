/* ==========================================================================
   TAILORA ADMIN — assets/js/api/analytics.js
   Owns: GET /admin/analytics/dashboard (1 documented endpoint).
   All requests go through the centralized TL.Api client from Step 2.
   ========================================================================== */

(function () {
  "use strict";

  function getDashboardAnalytics() {
    return window.TL.Api.get("/analytics/dashboard");
  }

  window.TL = window.TL || {};
  window.TL.Analytics = {
    getDashboardAnalytics,
  };
})();
