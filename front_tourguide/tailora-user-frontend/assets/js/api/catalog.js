/**
 * TAILORA USER — CATALOG API
 *
 * Public, unauthenticated lookup data.
 * Endpoints:
 * GET /website-settings
 * GET /website-settings/{id}
 * GET /countries
 * GET /countries/search
 * GET /countries/region/{region}
 * GET /countries/{name}
 * GET /cities
 * GET /cities/{id}
 */

(function () {
  "use strict";

  const Settings = {
    all: function () {
      return window.TL.Api.get("/website-settings");
    },

    get: function (id) {
      return window.TL.Api.get("/website-settings/" + id);
    }
  };


  const Countries = {
    all: function () {
      return window.TL.Api.get("/countries");
    },

    search: function (query) {
      return window.TL.Api.get("/countries/search", {
        query: query
      });
    },

    byRegion: function (region) {
      return window.TL.Api.get("/countries/region/" + region);
    },

    byName: function (name) {
      return window.TL.Api.get("/countries/" + name);
    }
  };


  const Cities = {
    all: function () {
      return window.TL.Api.get("/cities");
    },

    get: function (id) {
      return window.TL.Api.get("/cities/" + id);
    }
  };


  window.TL = window.TL || {};

  window.TL.Settings = Settings;
  window.TL.Countries = Countries;
  window.TL.Cities = Cities;

})();