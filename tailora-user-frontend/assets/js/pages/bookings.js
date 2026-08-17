/**
 * TAILORA USER — BOOKINGS PAGE
 *
 * Reflects whatever the user has selected for their trip (flight from
 * flights.html, hotel from hotel-details.html — both held in TL.Cart) and
 * lets them create the actual booking via:
 *   GET  /bookings
 *   POST /bookings   { flight_id, hotel_id, number_of_nights, wants_tour_guide }
 *
 * Restaurant/experience booking is not part of the documented API. Rather
 * than invent an endpoint, this page shows the user's saved
 * restaurants/experiences (via the existing Favorites endpoint) as a
 * reference list and is explicit that booking them isn't supported yet.
 */
(function () {
  "use strict";

  function flightPrice(flight) {
    const v = window.TL.Util.pick(flight, ["price", "total_price", "fare", "amount"], null);
    return v === null ? null : Number(v);
  }

  function flightDbId(flight) {
    return window.TL.Util.pick(flight, ["id", "flight_id"], null);
  }

  /* --------------------------- Flight section --------------------------- */

  function renderFlight() {
    const mount = document.getElementById("booking-flight");
    const flight = window.TL.Cart.getFlight();
    if (!flight) {
      mount.innerHTML = `
      <div class="tl-booking-item">
        <div class="tl-booking-item-body">
          <strong>No flight selected yet</strong>
          <span>Search and select a flight to add it here.</span>
        </div>
        <a href="flights.html" class="tl-btn tl-btn--outline tl-btn--sm">Search Flights</a>
      </div>`;
      return;
    }
    const origin = window.TL.Util.pick(flight, ["origin", "origin_code", "from"], "");
    const destination = window.TL.Util.pick(flight, ["destination", "destination_code", "to"], "");
    const airline = window.TL.Util.pick(flight, ["airline", "airline_name", "carrier"], "");
    const departure = window.TL.Util.pick(flight, ["departure", "departure_time", "departure_date"], "");
    const price = flightPrice(flight);
    
    const formattedDeparture = departure ? window.TL.Util.formatDate(departure, true) : "";

    mount.innerHTML = `
    <div class="tl-booking-item">
      <div class="tl-booking-item-body">
        <strong>${window.TL.Util.escape(origin)} → ${window.TL.Util.escape(destination)}</strong>
        <span>${[airline, formattedDeparture].filter(Boolean).join(" · ") || "Selected flight"}</span>
      </div>
      ${price !== null ? `<span class="tl-price">${window.TL.Util.escape(window.TL.Util.money(price))}</span>` : ""}
      <button type="button" class="tl-btn tl-btn--ghost tl-btn--sm" id="remove-flight-btn">Remove</button>
    </div>`;
    document.getElementById("remove-flight-btn").addEventListener("click", () => {
      window.TL.Cart.clearFlight();
      renderFlight();
      renderTotal();
    });
  }

  /* --------------------------- Hotel section --------------------------- */

  function renderHotel() {
    const mount = document.getElementById("booking-hotel");
    const hotel = window.TL.Cart.getHotel();
    if (!hotel) {
      mount.innerHTML = `
      <div class="tl-booking-item">
        <div class="tl-booking-item-body">
          <strong>No hotel selected yet</strong>
          <span>Pick a hotel and choose your nights to add it here.</span>
        </div>
        <a href="hotels.html" class="tl-btn tl-btn--outline tl-btn--sm">Browse Hotels</a>
      </div>`;
      return;
    }
    const total = hotel.price_per_night ? Number(hotel.price_per_night) * Number(hotel.number_of_nights || 1) : null;
    mount.innerHTML = `
    <div class="tl-booking-item">
      <img src="${hotel.image || "assets/images/hotels/hotel-1.jpg"}" alt="">
      <div class="tl-booking-item-body">
        <strong>${window.TL.Util.escape(hotel.name || "Selected hotel")}</strong>
        <span>${[hotel.city, `${hotel.number_of_nights || 1} night${(hotel.number_of_nights || 1) === 1 ? "" : "s"}`].filter(Boolean).map((s) => window.TL.Util.escape(s)).join(" · ")}</span>
      </div>
      ${total !== null ? `<span class="tl-price">${window.TL.Util.escape(window.TL.Util.money(total))}</span>` : ""}
      <button type="button" class="tl-btn tl-btn--ghost tl-btn--sm" id="remove-hotel-btn">Remove</button>
    </div>`;
    document.getElementById("remove-hotel-btn").addEventListener("click", () => {
      window.TL.Cart.clearHotel();
      renderHotel();
      renderTotal();
    });
  }

  /* --------------------------- Tour guide --------------------------- */

  function wireTourGuide() {
    const checkbox = document.getElementById("tour-guide-checkbox");
    checkbox.checked = window.TL.Cart.getWantsTourGuide();
    checkbox.addEventListener("change", () => {
      window.TL.Cart.setWantsTourGuide(checkbox.checked);
      renderTotal();
    });
  }

  /* --------------------------- Total --------------------------- */

  function renderTotal() {
    const mount = document.getElementById("booking-total");
    const flight = window.TL.Cart.getFlight();
    const hotel = window.TL.Cart.getHotel();
    let total = 0;
    let hasAny = false;

    const fp = flight ? flightPrice(flight) : null;
    if (fp !== null && Number.isFinite(fp)) {
      total += fp;
      hasAny = true;
    }
    if (hotel && hotel.price_per_night) {
      const nights = Number(hotel.number_of_nights || 1);
      const hp = Number(hotel.price_per_night) * nights;
      if (Number.isFinite(hp)) {
        total += hp;
        hasAny = true;
      }
    }

    // Add $100 if tour guide is selected
    if (window.TL.Cart.getWantsTourGuide()) {
      total += 100;
    }

    mount.innerHTML = hasAny
      ? `<div class="tl-total-row"><strong>Estimated Total</strong><strong>${window.TL.Util.escape(window.TL.Util.money(total))}</strong></div>`
      : "";
  }

  /* --------------------------- Restaurants & experiences (favorites, read-only) --------------------------- */

  async function renderRestaurantsExperiences() {
    const mount = document.getElementById("booking-restaurants-experiences");
    mount.innerHTML = `
      <h3 style="margin-bottom:8px;">Restaurants &amp; Experiences</h3>
      <p class="tl-text-secondary" style="font-size:13px;margin-bottom:16px;">
        Booking restaurants and experiences isn't supported by Tailora's API yet — here are the ones you've saved as favorites for reference.
      </p>
      <div class="tl-skel" style="height:60px;"></div>`;
    try {
      const response = await window.TL.Favorites.all();
      const favorites = window.TL.Util.list(response).filter((f) => {
        const type = String(window.TL.Util.pick(f, ["favoritable_type", "type"], "")).toLowerCase();
        return type.includes("restaurant") || type.includes("attraction") || type.includes("experience");
      });
      if (!favorites.length) {
        mount.querySelector(".tl-skel").outerHTML = `<p class="tl-text-secondary" style="font-size:13px;">No saved restaurants or experiences yet.</p>`;
        return;
      }
      mount.querySelector(".tl-skel").outerHTML = favorites
        .map((f) => {
          const item = window.TL.Util.pick(f, ["favoritable", "item"], f);
          const name = window.TL.Util.name(item, "Saved item");
          const type = window.TL.Util.pick(f, ["favoritable_type", "type"], "");
          return `<div class="tl-booking-item"><div class="tl-booking-item-body"><strong>${window.TL.Util.escape(name)}</strong><span>${window.TL.Util.escape(type)}</span></div></div>`;
        })
        .join("");
    } catch (err) {
      mount.querySelector(".tl-skel").outerHTML = "";
    }
  }

  /* --------------------------- Existing bookings --------------------------- */

  function bookingStatusLabel(booking) {
    return window.TL.Util.pick(booking, ["status"], "pending");
  }

  function existingBookingRow(booking) {
    const id = window.TL.Util.id(booking);
    const status = bookingStatusLabel(booking);
    const label = window.TL.Util.pick(booking, ["reference"], `Booking #${id}`);
    const paid = String(status).toLowerCase().includes("paid") || String(status).toLowerCase().includes("confirmed");
    return `
    <div class="tl-card tl-existing-booking">
      <div>
        <strong style="display:block;">${window.TL.Util.escape(label)}</strong>
        <span class="tl-badge tl-mt-8">${window.TL.Util.escape(status)}</span>
      </div>
      ${!paid ? `<a class="tl-btn tl-btn--outline tl-btn--sm" href="payment.html?booking_id=${encodeURIComponent(id)}">Pay Now</a>` : ""}
    </div>`;
  }

  async function loadExistingBookings() {
    const mount = document.getElementById("existing-bookings");
    mount.innerHTML = window.TL.Util.skeletonCards(2);
    try {
      const response = await window.TL.Bookings.all();
      const bookings = window.TL.Util.list(response);
      mount.innerHTML = bookings.length
        ? bookings.map(existingBookingRow).join("")
        : window.TL.Util.emptyState("No bookings yet", "Create your first booking above.");
    } catch (err) {
      mount.innerHTML = window.TL.Util.errorState(err.message);
    }
  }

  /* --------------------------- Continue to payment --------------------------- */

  function showBookingError(message) {
    const mount = document.getElementById("booking-error");
    if (!message) {
      mount.classList.add("tl-hidden");
      mount.innerHTML = "";
      return;
    }
    mount.classList.remove("tl-hidden");
    mount.innerHTML = `<div class="tl-auth-alert is-visible">${window.TL.Util.escape(message)}</div>`;
  }

  function wireContinueToPayment() {
    const btn = document.getElementById("continue-to-payment-btn");
    btn.addEventListener("click", async () => {
      showBookingError("");
      const flight = window.TL.Cart.getFlight();
      const hotel = window.TL.Cart.getHotel();

      if (!flight && !hotel) {
        showBookingError("Select at least a flight or a hotel before continuing.");
        return;
      }

      const payload = { wants_tour_guide: window.TL.Cart.getWantsTourGuide() };
      if (flight) {
        const fid = flightDbId(flight);
        if (fid) payload.flight_id = fid;
      }
      if (hotel) {
        payload.hotel_id = hotel.hotel_id;
        payload.number_of_nights = hotel.number_of_nights || 1;
      }

      btn.disabled = true;
      btn.textContent = "Creating your booking…";
      try {
        const response = await window.TL.Bookings.create(payload);
        const booking = window.TL.Util.pick(response, ["data", "booking"], response);
        const bookingId = window.TL.Util.id(booking);
        window.TL.Cart.setBooking(booking);
        window.TL.Cart.clearSelection();
        window.TL.toast("Booking created!");
        window.location.href = bookingId ? `payment.html?booking_id=${encodeURIComponent(bookingId)}` : "payment.html";
      } catch (err) {
        btn.disabled = false;
        btn.textContent = "Continue to Payment";
        if (err.name === "ApiValidationError" && err.errors) {
          const messages = Object.values(err.errors).flat().join(" ");
          showBookingError(messages || err.message);
        } else {
          showBookingError(err.message || "Couldn't create your booking. Please try again.");
        }
        window.TL.toast(err.message || "Couldn't create your booking.", "error");
      }
    });
  }

  /* --------------------------- Init --------------------------- */

  function init() {
    const signedOut = document.getElementById("booking-signed-out");
    const shell = document.getElementById("booking-shell");

    if (!window.TL.Auth.isAuthenticated()) {
      signedOut.classList.remove("tl-hidden");
      shell.classList.add("tl-hidden");
      return;
    }
    signedOut.classList.add("tl-hidden");
    shell.classList.remove("tl-hidden");

    renderFlight();
    renderHotel();
    wireTourGuide();
    renderTotal();
    wireContinueToPayment();
    renderRestaurantsExperiences();
    loadExistingBookings();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
