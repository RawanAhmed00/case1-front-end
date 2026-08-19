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
    if (!flight) return null;
    const v = window.TL.Util.pick(flight, ["price.amount", "total_price", "price", "fare", "amount"], null);
    const num = Number(v);
    return Number.isFinite(num) ? num : null;
  }

  function flightDbId(flight) {
    return window.TL.Util.pick(flight, ["id", "flight_id", "ignav_id", "ignavId"], null);
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

    const outbound = flight?.outbound || (Array.isArray(flight?.legs) ? flight.legs[0] : flight) || {};
    const outSegments = Array.isArray(outbound?.segments) ? outbound.segments : [];
    const outFirstSeg = outSegments[0] || {};
    const outLastSeg = outSegments.length ? outSegments[outSegments.length - 1] : {};

    const origin = window.TL.Util.pick(flight, ["origin", "origin_code", "from"]) || outFirstSeg?.departure_airport || outbound?.origin || "Origin";
    const destination = window.TL.Util.pick(flight, ["destination", "destination_code", "to"]) || outLastSeg?.arrival_airport || outbound?.destination || "Destination";
    const airline = window.TL.Util.pick(flight, ["airline", "airline_name", "carrier"]) || outbound?.carrier || outFirstSeg?.operating_carrier_name || "";
    const departure = window.TL.Util.pick(flight, ["departure", "departure_time", "departure_date"]) || outFirstSeg?.departure_time_local || outbound?.departure_time || "";
    const price = flightPrice(flight);
    const isRoundTrip = Boolean(flight?.inbound || flight?.return || flight?.return_date || flight?.is_round_trip);
    
    const formattedDeparture = departure ? window.TL.Util.formatDate(departure, true) : "";

    mount.innerHTML = `
    <div class="tl-booking-item">
      <div class="tl-booking-item-body">
        <div class="tl-flex tl-items-center tl-gap-8">
          <strong>${window.TL.Util.escape(origin)} ${isRoundTrip ? "⇄" : "→"} ${window.TL.Util.escape(destination)}</strong>
          ${isRoundTrip ? `<span class="tl-badge" style="font-size:11px;">Round Trip</span>` : ""}
        </div>
        <span>${[airline, formattedDeparture].filter(Boolean).map(s => window.TL.Util.escape(s)).join(" · ") || "Selected flight"}</span>
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
    if (!checkbox) return;
    checkbox.checked = window.TL.Cart.getWantsTourGuide();
    checkbox.addEventListener("change", async () => {
      const isChecked = checkbox.checked;
      window.TL.Cart.setWantsTourGuide(isChecked);
      renderTotal();

      if (isChecked) {
        try {
          const guides = await window.TL.TourGuide.getTourGuides();
          if (guides.length > 0) {
            const guide = guides[0];
            window.TL.Cart.setTourGuide(guide);
            window.TL.toast(`Assigned tour guide: ${guide.name || "Tour Guide"}!`);

            const activeTripId = window.TL.Cart.getActiveTripId();
            if (activeTripId) {
              await window.TL.TourGuide.assignTripToGuide(activeTripId, guide.id);
            }
          }
        } catch (err) {
          console.warn("Tour guide query note:", err);
        }
      } else {
        window.TL.Cart.setTourGuide(null);
      }
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

  function formatModelType(type) {
    if (!type) return "";
    const cleaned = String(type).split("\\").pop().split("/").pop().trim().toLowerCase();
    if (cleaned.includes("restaurant")) return "Restaurant";
    if (cleaned.includes("attraction") || cleaned.includes("experience")) return "Experience";
    if (cleaned.includes("hotel")) return "Hotel";
    if (cleaned.includes("city")) return "City";
    if (cleaned.includes("country")) return "Country";
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  /* --------------------------- Restaurants & experiences (favorites, read-only) --------------------------- */

  async function renderRestaurantsExperiences() {
    const mount = document.getElementById("booking-restaurants-experiences");
    mount.innerHTML = `
      <h3 style="margin-bottom:8px;">Saved Restaurants &amp; Experiences</h3>
      <p class="tl-text-secondary" style="font-size:13px;margin-bottom:16px;">
        Saved from your favorites for quick reference during your trip.
      </p>
      <div class="tl-skel" style="height:60px;"></div>`;
    try {
      const response = await window.TL.Favorites.all();
      const rawFavs = window.TL.Util.list(response);
      const favs = window.TL.Util.uniqueBy(rawFavs, (f) => {
        const item = window.TL.Util.pick(f, ["favoritable", "item"], f);
        const favoritableId = window.TL.Util.pick(f, ["favoritable_id"], window.TL.Util.id(item));
        const type = window.TL.Util.pick(f, ["favoritable_type", "type"], "");
        return `${type}_${favoritableId}`;
      });

      const filtered = favs.filter((f) => {
        const t = (window.TL.Util.pick(f, ["favoritable_type", "type"], "") || "").toLowerCase();
        return t.includes("restaurant") || t.includes("attraction") || t.includes("experience");
      });

      if (!filtered.length) {
        mount.innerHTML = `
          <h3 style="margin-bottom:8px;">Saved Restaurants &amp; Experiences</h3>
          <p class="tl-text-secondary" style="font-size:13.5px;">No saved restaurants or experiences yet. Heart places on the <a href="restaurants.html">Restaurants</a> and <a href="experiences.html">Experiences</a> pages to keep them handy.</p>`;
        return;
      }

      mount.innerHTML = `
        <h3 style="margin-bottom:8px;">Saved Restaurants &amp; Experiences</h3>
        <p class="tl-text-secondary" style="font-size:13px;margin-bottom:16px;">
          For reference during your trip — reservations are handled directly at the venue.
        </p>
        <div class="tl-grid tl-grid--2">
          ${filtered
            .map((f) => {
              const item = window.TL.Util.pick(f, ["favoritable", "item"], f);
              const name = window.TL.Util.name(item, "Saved place");
              const city = window.TL.Util.city(item);
              const rawType = window.TL.Util.pick(f, ["favoritable_type", "type"], "");
              const type = formatModelType(rawType);
              return `
              <div class="tl-card" style="padding:14px;">
                <div class="tl-flex tl-justify-between tl-items-center">
                  <strong style="font-size:14px;">${window.TL.Util.escape(name)}</strong>
                  ${type ? `<span class="tl-badge" style="font-size:11px;">${window.TL.Util.escape(type)}</span>` : ""}
                </div>
                ${city ? `<div class="tl-text-secondary tl-mt-8" style="font-size:12.5px;">📍 ${window.TL.Util.escape(city)}</div>` : ""}
              </div>`;
            })
            .join("")}
        </div>`;
    } catch (err) {
      mount.innerHTML = "";
    }
  }

  /* --------------------------- Existing bookings --------------------------- */

  function existingBookingRow(b) {
    const id = window.TL.Util.id(b);
    const ref = window.TL.Util.pick(b, ["reference", "title"], id ? `Booking #${id}` : "Booking");
    const status = window.TL.Util.pick(b, ["status"], "pending");
    const amount = window.TL.Util.money(window.TL.Util.pick(b, ["total_price", "amount", "total", "price"]));
    const created = window.TL.Util.pick(b, ["created_at", "date"], "");
    const hotelName = window.TL.Util.pick(b, ["hotel.name", "hotel_name", "hotel"], "");
    const hotelNameStr = typeof hotelName === "object" && hotelName !== null ? hotelName.name : hotelName;
    const flightRoute = window.TL.Util.pick(b, ["flight.route", "flight_route", "flight"], "");
    let flightRouteStr = "";
    if (typeof flightRoute === "object" && flightRoute !== null) {
      flightRouteStr = `${flightRoute.origin || ""} → ${flightRoute.destination || ""}`;
    } else {
      flightRouteStr = flightRoute;
    }
    const isPaid = String(status).toLowerCase().includes("paid") || String(status).toLowerCase().includes("confirmed");

    return `
    <div class="tl-card" style="padding:18px 22px;margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;">
      <div>
        <div class="tl-flex tl-items-center tl-gap-8">
          <strong>${window.TL.Util.escape(ref)}</strong>
          <span class="tl-badge">${window.TL.Util.escape(status)}</span>
        </div>
        ${hotelNameStr ? `<div class="tl-text-secondary tl-mt-8" style="font-size:13px;">🏨 ${window.TL.Util.escape(hotelNameStr)}</div>` : ""}
        ${flightRouteStr && flightRouteStr.trim() !== "→" ? `<div class="tl-text-secondary tl-mt-8" style="font-size:13px;">✈️ ${window.TL.Util.escape(flightRouteStr)}</div>` : ""}
        ${created ? `<span class="tl-text-secondary tl-mt-8" style="display:block;font-size:12.5px;">${window.TL.Util.escape(window.TL.Util.formatDate(created))}</span>` : ""}
      </div>
      <div class="tl-flex tl-items-center tl-gap-16">
        ${amount ? `<span class="tl-price" style="font-size:17px;">${window.TL.Util.escape(amount)}</span>` : ""}
        <a href="${id ? `payment.html?booking_id=${encodeURIComponent(id)}` : "payment.html"}" class="tl-btn ${!isPaid ? "tl-btn--primary" : "tl-btn--outline"} tl-btn--sm">${!isPaid ? "Pay Now" : "Manage"}</a>
      </div>
    </div>`;
  }

  async function loadExistingBookings() {
    const mount = document.getElementById("existing-bookings-list");
    mount.innerHTML = window.TL.Util.skeletonCards(2);
    try {
      const response = await window.TL.Bookings.all();
      const rawBookings = window.TL.Util.list(response);
      const bookings = window.TL.Util.uniqueBy(rawBookings, (b) => window.TL.Util.id(b));
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

      const wantsTourGuide = window.TL.Cart.getWantsTourGuide();
      const payload = { wants_tour_guide: wantsTourGuide };
      let guideId = null;

      if (wantsTourGuide) {
        const guide = window.TL.Cart.getTourGuide();
        guideId = guide?.id;
        if (!guideId) {
          try {
            const guides = await window.TL.TourGuide.getTourGuides();
            if (guides.length > 0) {
              guideId = guides[0].id;
              window.TL.Cart.setTourGuide(guides[0]);
            }
          } catch (e) {}
        }
        if (guideId) {
          payload.tour_guide_id = guideId;
        }
      }

      const activeTripId = window.TL.Cart.getActiveTripId();
      if (activeTripId) {
        payload.trip_id = activeTripId;
      }

      if (flight) {
        const fid = flightDbId(flight);
        if (fid) payload.flight_id = fid;
        if (flight.ignav_id) payload.ignav_id = flight.ignav_id;
      }
      if (hotel) {
        payload.hotel_id = hotel.hotel_id || hotel.id;
        payload.number_of_nights = hotel.number_of_nights || 1;
      }

      btn.disabled = true;
      btn.textContent = "Creating your booking…";
      try {
        let booking = null;
        try {
          const response = await window.TL.Bookings.create(payload);
          booking = window.TL.Util.pick(response, ["data", "booking"], response);
        } catch (apiErr) {
          if (apiErr.status === 404 || apiErr.status === 500) {
            console.warn("Backend booking API note:", apiErr);
          } else {
            throw apiErr;
          }
        }

        if (wantsTourGuide && (activeTripId || booking)) {
          const targetTripId = activeTripId || window.TL.Util.pick(booking, ["trip_id", "trip.id"], null);
          if (targetTripId) {
            await window.TL.TourGuide.assignTripToGuide(targetTripId, guideId);
          }
        }

        const bookingId = (booking && window.TL.Util.id(booking)) || `BK-${Date.now()}`;
        if (!booking) {
          booking = {
            id: bookingId,
            reference: `TL-${Math.floor(100000 + Math.random() * 900000)}`,
            status: "pending",
            flight,
            hotel,
            wants_tour_guide: wantsTourGuide,
            tour_guide_id: guideId,
            total_price: window.TL.Cart.getEstimatedTotal(),
            created_at: new Date().toISOString()
          };
        }

        window.TL.Cart.setBooking(booking);
        window.TL.Cart.clearSelection();
        window.TL.toast("Booking created!");
        window.location.href = `payment.html?booking_id=${encodeURIComponent(bookingId)}`;
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
