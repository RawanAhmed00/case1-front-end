/* ==========================================================================
   TAILORA ADMIN — assets/js/api/reviews.js
   Owns: /admin/reviews

   Endpoints:
   GET    /admin/reviews
   PUT    /admin/reviews/{id}/approve
   PUT    /admin/reviews/{id}/reject
   DELETE /admin/reviews/{id}

   Approve / Reject / Delete send no request body.
   ========================================================================== */

(function () {
  "use strict";

  // GET /admin/reviews
  function getReviews(query) {
    return window.TL.Api.get("/reviews", query);
  }

  // PUT /admin/reviews/{id}/approve
  function approveReview(id) {
    return window.TL.Api.put("/reviews/" + id + "/approve");
  }

  // PUT /admin/reviews/{id}/reject
  function rejectReview(id) {
    return window.TL.Api.put("/reviews/" + id + "/reject");
  }

  // DELETE /admin/reviews/{id}
  function deleteReview(id) {
    return window.TL.Api.delete("/reviews/" + id);
  }

  window.TL = window.TL || {};

  window.TL.Reviews = {
    getReviews: getReviews,
    approveReview: approveReview,
    rejectReview: rejectReview,
    deleteReview: deleteReview
  };
})();