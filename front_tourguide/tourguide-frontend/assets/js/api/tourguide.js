/**
 * TAILORA TOUR GUIDE — TOUR GUIDE API SERVICE
 * Connects frontend strictly to real Tour Guide API endpoints documented in API Documentation.md:
 * - GET /dashboard
 * - GET /requests, GET /requests/{id}, PATCH /requests/{id}/accept, PATCH /requests/{id}/reject
 * - GET /availabilities, POST /availabilities, PUT /availabilities/{id}, DELETE /availabilities/{id}
 * - GET /tour-guide/schedule
 * - GET /tour-guide/earnings, GET /tour-guide/earnings/history
 * - GET /tour-guide/reviews, GET /tour-guide/rating
 */

(function () {
  "use strict";

  const TourGuideApi = {
    // GET /dashboard
    async getDashboard() {
      return await window.TL.Api.get("/dashboard");
    },

    // GET /requests
    async getRequests() {
      return await window.TL.Api.get("/requests");
    },

    // GET /requests/{id}
    async getRequest(id) {
      return await window.TL.Api.get(`/requests/${id}`);
    },

    // PATCH /requests/{id}/accept
    async acceptRequest(id) {
      return await window.TL.Api.patch(`/requests/${id}/accept`);
    },

    // PATCH /requests/{id}/reject
    async rejectRequest(id) {
      return await window.TL.Api.patch(`/requests/${id}/reject`);
    },

    // GET /availabilities
    async getAvailabilities() {
      return await window.TL.Api.get("/availabilities");
    },

    // POST /availabilities
    async createAvailability(data) {
      return await window.TL.Api.post("/availabilities", data);
    },

    // PUT /availabilities/{id}
    async updateAvailability(id, data) {
      return await window.TL.Api.put(`/availabilities/${id}`, data);
    },

    // DELETE /availabilities/{id}
    async deleteAvailability(id) {
      return await window.TL.Api.delete(`/availabilities/${id}`);
    },

    // GET /tour-guide/schedule
    async getSchedule() {
      return await window.TL.Api.get("/tour-guide/schedule");
    },

    // GET /tour-guide/earnings
    async getEarnings() {
      return await window.TL.Api.get("/tour-guide/earnings");
    },

    // GET /tour-guide/earnings/history
    async getEarningsHistory() {
      return await window.TL.Api.get("/tour-guide/earnings/history");
    },

    // GET /tour-guide/reviews
    async getReviews() {
      return await window.TL.Api.get("/tour-guide/reviews");
    },

    // GET /tour-guide/rating
    async getRating() {
      return await window.TL.Api.get("/tour-guide/rating");
    },

    // GET /profile 
    async getProfile() {
      return await window.TL.Api.get("/me");
    },

    // PUT /profile 
    async updateProfile(data) {
      return await window.TL.Api.put("/profile", data);
    },

    async updatePassword(formData) {
      return await window.TL.Api.put("/profile/password", formData);
    },
  };

  window.TL = window.TL || {};
  window.TL.TourGuideApi = TourGuideApi;
})();
