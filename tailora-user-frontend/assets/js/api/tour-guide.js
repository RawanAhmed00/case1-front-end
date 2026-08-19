/**
 * TAILORA USER — TOUR GUIDE API
 */

(function () {
  "use strict";

  async function getSchedule() {
    const response = await window.TL.Api.get("/tour-guide/schedule");
    return response && Array.isArray(response.data)
      ? response.data
      : [];
  }

  async function getTourGuides() {
    try {
      try {
        const response = await window.TL.Api.get("/tour-guide/guides");
        const list = response && Array.isArray(response.data) ? response.data : (Array.isArray(response) ? response : []);
        if (list.length > 0) return list;
      } catch (e) {}

      const schedules = await getSchedule();
      const guides = [];
      schedules.forEach((s) => {
        if (s.tour_guide && s.tour_guide.id) {
          if (!guides.some((g) => g.id === s.tour_guide.id)) {
            guides.push(s.tour_guide);
          }
        } else if (s.tour_guide_id) {
          if (!guides.some((g) => g.id === s.tour_guide_id)) {
            guides.push({ id: s.tour_guide_id, name: s.tour_guide_name || "Tour Guide" });
          }
        }
      });
      return guides;
    } catch (e) {
      return [];
    }
  }

  async function assignTripToGuide(tripId, guideId) {
    if (!tripId) return;
    try {
      if (!guideId) {
        const guides = await getTourGuides();
        if (guides.length > 0) {
          guideId = guides[0].id;
        }
      }

      const payload = {
        trip_id: tripId,
        wants_tour_guide: true
      };
      if (guideId) payload.tour_guide_id = guideId;

      try {
        await window.TL.Api.post("/tour-guide/assign", payload);
      } catch (e) {
        try {
          await window.TL.Api.post("/tour-guide/requests", payload);
        } catch (e2) {}
      }

      if (guideId) {
        try {
          await window.TL.Api.post(`/chats/${guideId}/messages`, {
            message: `Hello! I have requested you as a tour guide for my trip.`,
            trip_id: tripId
          });
        } catch (e3) {}
      }
    } catch (err) {
      console.warn("Tour guide assignment note:", err);
    }
  }

  window.TL = window.TL || {};

  window.TL.TourGuide = {
    getSchedule,
    getTourGuides,
    assignTripToGuide
  };
})();