(function () {
  "use strict";

  // GET /hotels
  function getHotels() {
    return window.TL.Api.get("/hotels");
  }

  // GET /hotels/{id}
  function getHotel(id) {
    return window.TL.Api.get("/hotels/" + id);
  }

  // POST /admin/hotels
  function createHotel(data) {
    return window.TL.Api.post("/hotels", data);
  }

  // PUT /admin/hotels/{id}
  function updateHotel(id, data) {
    return window.TL.Api.put("/hotels/" + id, data);
  }

  // DELETE /admin/hotels/{id}
  function deleteHotel(id) {
    return window.TL.Api.delete("/hotels/" + id);
  }

  window.TL = window.TL || {};

  window.TL.Hotels = {
    getHotels,
    getHotel,
    createHotel,
    updateHotel,
    deleteHotel
  };
})();