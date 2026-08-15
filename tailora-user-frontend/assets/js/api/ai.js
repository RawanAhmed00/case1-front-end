/**
 * TAILORA USER — AI API
 * All endpoints require authentication.
 * POST /ai/enhance
 * POST /ai/travel
 * POST /ai/travel/{conversationId}/plans
 * POST /ai/travel/{conversationId}/choose
 * POST /ai/recommendations
 * POST /ai/places
 * POST /ai/travel-tips
 * POST /ai/trip/{tripId}/recommendation
 */
(function () {
  "use strict";

  const Ai = {
    enhance(payload) {
      return window.TL.Api.post("/ai/enhance", payload);
    },
    travel(payload) {
      return window.TL.Api.post("/ai/travel", payload);
    },
    generatePlans(conversationId, payload) {
      return window.TL.Api.post(`/ai/travel/${conversationId}/plans`, payload);
    },
    choosePlan(conversationId, payload) {
      return window.TL.Api.post(`/ai/travel/${conversationId}/choose`, payload);
    },
    recommendations(payload) {
      return window.TL.Api.post("/ai/recommendations", payload);
    },
    places(payload) {
      return window.TL.Api.post("/ai/places", payload);
    },
    travelTips(payload) {
      return window.TL.Api.post("/ai/travel-tips", payload);
    },
    tripRecommendation(tripId, payload) {
      return window.TL.Api.post(`/ai/trip/${tripId}/recommendation`, payload || {});
    }
  };

  window.TL = window.TL || {};
  window.TL.Ai = Ai;
})();
