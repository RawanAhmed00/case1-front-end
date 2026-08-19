/**
 * TAILORA USER — BOOKING CART
 *
 * Stores:
 * - Selected flight
 * - Selected hotel
 * - Tour guide selection
 * - Booking
 * - Active trip id
 *
 * Data is saved in localStorage so it survives
 * navigation between pages.
 */
(function () {
  "use strict";

  const TOUR_GUIDIDE_PRICE = 100;

  const KEYS = {
    flight: "tailora_cart_flight",
    hotel: "tailora_cart_hotel",
    tourGuide: "tailora_cart_tour_guide",
    booking: "tailora_cart_booking",
    trip: "tailora_active_trip_id"
  };

  /* =========================================================
     JSON HELPERS
  ========================================================= */

  function getJSON(key) {
    try {
      const raw =
        localStorage.getItem(key);

      return raw
        ? JSON.parse(raw)
        : null;

    } catch (error) {
      console.error(
        "Cart JSON read error:",
        error
      );

      return null;
    }
  }

  function setJSON(
    key,
    value
  ) {
    try {
      if (
        value === null ||
        value === undefined
      ) {
        localStorage.removeItem(
          key
        );

        return;
      }

      localStorage.setItem(
        key,
        JSON.stringify(value)
      );

    } catch (error) {
      console.error(
        "Cart JSON save error:",
        error
      );
    }
  }

  /* =========================================================
     CART
  ========================================================= */

  const Cart = {

    /* =======================================================
       FLIGHT
    ======================================================= */

    getFlight() {
      return getJSON(
        KEYS.flight
      );
    },

    setFlight(flight) {
      setJSON(
        KEYS.flight,
        flight
      );
    },

    clearFlight() {
      localStorage.removeItem(
        KEYS.flight
      );
    },

    /* =======================================================
       HOTEL
    ======================================================= */

    getHotel() {
      return getJSON(
        KEYS.hotel
      );
    },

    setHotel(hotel) {
      setJSON(
        KEYS.hotel,
        hotel
      );
    },

    clearHotel() {
      localStorage.removeItem(
        KEYS.hotel
      );
    },

    /* =======================================================
       TOUR GUIDE
    ======================================================= */

    getWantsTourGuide() {
      return (
        localStorage.getItem(
          KEYS.tourGuide
        ) === "1"
      );
    },

    setWantsTourGuide(value) {
      localStorage.setItem(
        KEYS.tourGuide,
        value
          ? "1"
          : "0"
      );
    },

    getTourGuide() {
      return getJSON("tailora_cart_tour_guide_obj");
    },

    setTourGuide(guide) {
      setJSON("tailora_cart_tour_guide_obj", guide);
    },

    clearTourGuide() {
      localStorage.removeItem(
        KEYS.tourGuide
      );
      localStorage.removeItem("tailora_cart_tour_guide_obj");
    },

    getTourGuidePrice() {
      return TOUR_GUIDIDE_PRICE;
    },

    getTourGuideTotal() {
      return this.getWantsTourGuide()
        ? TOUR_GUIDIDE_PRICE
        : 0;
    },

    /* =======================================================
       BOOKING
    ======================================================= */

    getBooking() {
      return getJSON(
        KEYS.booking
      );
    },

    setBooking(booking) {
      setJSON(
        KEYS.booking,
        booking
      );
    },

    clearBooking() {
      localStorage.removeItem(
        KEYS.booking
      );
    },

    /* =======================================================
       ACTIVE TRIP
    ======================================================= */

    getActiveTripId() {
      return (
        localStorage.getItem(
          KEYS.trip
        ) ||
        null
      );
    },

    setActiveTripId(id) {
      if (id) {
        localStorage.setItem(
          KEYS.trip,
          id
        );

      } else {
        localStorage.removeItem(
          KEYS.trip
        );
      }
    },

    clearActiveTripId() {
      localStorage.removeItem(
        KEYS.trip
      );
    },

    /* =======================================================
       PRICE HELPERS
    ======================================================= */

    getFlightPrice() {
      const flight =
        this.getFlight();

      if (!flight) {
        return 0;
      }

      const price =
        flight?.price?.amount ??
        flight?.total_price ??
        flight?.price ??
        flight?.amount ??
        0;

      const number =
        Number(price);

      return Number.isFinite(number)
        ? number
        : 0;
    },

    getHotelPrice() {
      const hotel =
        this.getHotel();

      if (!hotel) {
        return 0;
      }

      /*
       * First try total price.
       */
      const totalPrice =
        hotel?.total_price ??
        hotel?.totalPrice ??
        null;

      if (
        totalPrice !== null &&
        totalPrice !== undefined
      ) {
        const number =
          Number(totalPrice);

        return Number.isFinite(number)
          ? number
          : 0;
      }

      /*
       * Otherwise calculate:
       *
       * price × nights
       */
      const price =
        Number(
          hotel?.price?.amount ??
          hotel?.price ??
          hotel?.nightly_price ??
          hotel?.price_per_night ??
          0
        );

      const nights =
        Number(
          hotel?.number_of_nights ??
          hotel?.nights ??
          1
        );

      if (
        !Number.isFinite(price)
      ) {
        return 0;
      }

      return (
        price *
        (
          Number.isFinite(nights)
            ? nights
            : 1
        )
      );
    },

    getEstimatedTotal() {
      const flightPrice =
        this.getFlightPrice();

      const hotelPrice =
        this.getHotelPrice();

      const tourGuidePrice =
        this.getTourGuideTotal();

      return (
        flightPrice +
        hotelPrice +
        tourGuidePrice
      );
    },

    /* =======================================================
       CLEAR
    ======================================================= */

    clearSelection() {
      localStorage.removeItem(
        KEYS.flight
      );

      localStorage.removeItem(
        KEYS.hotel
      );

      localStorage.removeItem(
        KEYS.tourGuide
      );
    },

    clearAll() {
      localStorage.removeItem(
        KEYS.flight
      );

      localStorage.removeItem(
        KEYS.hotel
      );

      localStorage.removeItem(
        KEYS.tourGuide
      );

      localStorage.removeItem(
        KEYS.booking
      );

      localStorage.removeItem(
        KEYS.trip
      );
    }
  };

  /* =========================================================
     EXPORT
  ========================================================= */

  window.TL =
    window.TL || {};

  window.TL.Cart =
    Cart;

})();