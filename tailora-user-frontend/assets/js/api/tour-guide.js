/**
 * TAILORA USER — TOUR GUIDE API
 */

(function () {
  "use strict";

  async function getSchedule() {
    const response = await window.TL.Api.get("/tour-guide/schedule");

    /*
     * Backend response:
     *
     * {
     *   message: "...",
     *   data: [...]
     * }
     */
    return response && Array.isArray(response.data)
      ? response.data
      : [];
  }

  window.TL = window.TL || {};

  window.TL.TourGuide = {
    getSchedule
  };
})();