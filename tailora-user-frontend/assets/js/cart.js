/**
 * TAILORA USER — BOOKING CART
 *
 * Lightweight client-side state so a selected flight (from
 * POST /flights/select) and a selected hotel (with number_of_nights) can
 * survive navigation between flights.html, hotel-details.html,
 * bookings.html and payment.html before they're sent together to
 * POST /bookings.
 *
 * This is NOT a parallel trip system — trips continue to live entirely in
 * TL.Trips / the /trips endpoints. This only remembers the in-progress
 * booking selection (and, for the Weather page, which trip is "active")
 * on this device, the same way a shopping cart would.
 */
(function () {
  "use strict";

  const KEYS = {
    flight: "tailora_cart_flight",
    hotel: "tailora_cart_hotel",
    tourGuide: "tailora_cart_tour_guide",
    booking: "tailora_cart_booking",
    trip: "tailora_active_trip_id"
  };

  function getJSON(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function setJSON(key, value) {
    if (value === null || value === undefined) {
      localStorage.removeItem(key);
      return;
    }
    localStorage.setItem(key, JSON.stringify(value));
  }

  const Cart = {
    // { ignav_id, id (db id if returned), ...raw selected-flight data }
    getFlight() {
      return getJSON(KEYS.flight);
    },
    setFlight(flight) {
      setJSON(KEYS.flight, flight);
    },
    clearFlight() {
      localStorage.removeItem(KEYS.flight);
    },

    // { hotel_id, number_of_nights, ...raw hotel data for display }
    getHotel() {
      return getJSON(KEYS.hotel);
    },
    setHotel(hotel) {
      setJSON(KEYS.hotel, hotel);
    },
    clearHotel() {
      localStorage.removeItem(KEYS.hotel);
    },

    getWantsTourGuide() {
      return localStorage.getItem(KEYS.tourGuide) === "1";
    },
    setWantsTourGuide(value) {
      localStorage.setItem(KEYS.tourGuide, value ? "1" : "0");
    },

    // { id, ...raw booking data returned by POST /bookings }
    getBooking() {
      return getJSON(KEYS.booking);
    },
    setBooking(booking) {
      setJSON(KEYS.booking, booking);
    },
    clearBooking() {
      localStorage.removeItem(KEYS.booking);
    },

    getActiveTripId() {
      return localStorage.getItem(KEYS.trip) || null;
    },
    setActiveTripId(id) {
      if (id) {
        localStorage.setItem(KEYS.trip, id);
      } else {
        localStorage.removeItem(KEYS.trip);
      }
    },

    clearSelection() {
      localStorage.removeItem(KEYS.flight);
      localStorage.removeItem(KEYS.hotel);
      localStorage.removeItem(KEYS.tourGuide);
    }
  };

  window.TL = window.TL || {};
  window.TL.Cart = Cart;
})();
