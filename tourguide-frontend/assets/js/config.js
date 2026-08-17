/**
 * TAILORA TOUR GUIDE — ENVIRONMENT & API CONFIGURATION
 * Central environment configuration for API Base URL and local settings.
 */

(function () {
  "use strict";

  window.ENV = window.ENV || {};

  // Default API Base URL as per requirements
  window.ENV.API_URL = window.ENV.API_URL || localStorage.getItem("VITE_API_URL") || "http://127.0.0.1:8000/api";
})();
