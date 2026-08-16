/**
 * TAILORA USER — HOTEL DETAILS / BOOKING PAGE
 * GET /hotels/{id}
 *
 * "Add to Booking" stores the hotel + number_of_nights in TL.Cart so
 * bookings.html can send { hotel_id, number_of_nights } (plus any selected
 * flight_id) to POST /bookings without losing an already-selected flight.
 */
(function () {
  "use strict";

  const FALLBACK_IMG = "assets/images/hotels/hotel-1.jpg";
  let currentHotel = null;
  let currentId = null;
  let nights = 1;

  function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function hotelImage(hotel, id) {
    const img = window.TL.Util.image(hotel, null);
    if (img) return img;
    const n = Number(id);
    if (!Number.isNaN(n) && n > 0) return `assets/images/hotels/hotel-${((n - 1) % 12) + 1}.jpg`;
    return FALLBACK_IMG;
  }

  function renderHero(hotel) {
    const name = window.TL.Util.name(hotel);
    const city = window.TL.Util.city(hotel) || window.TL.Util.country(hotel);
    const rating = window.TL.Util.rating(hotel);
    const img = hotelImage(hotel, currentId);

    document.getElementById("hotel-hero").innerHTML = `
      <img src="${img}" alt="${window.TL.Util.escape(name)}" onerror="this.src='${FALLBACK_IMG}'">
      <div class="tl-detail-hero-body">
        <span class="tl-eyebrow" style="color:#fff;">Stay</span>
        <h1 class="tl-mt-8">${window.TL.Util.escape(name)}</h1>
        <div class="tl-chip-row tl-mt-16">
          ${city ? `<span class="tl-badge">📍 ${window.TL.Util.escape(city)}</span>` : ""}
          ${rating ? `<span class="tl-badge">★ ${window.TL.Util.escape(rating)}</span>` : ""}
        </div>
      </div>`;
  }

  function renderAbout(hotel) {
    const desc = window.TL.Util.description(hotel);
    const price = window.TL.Util.money(window.TL.Util.price(hotel));
    const reviews = window.TL.Util.pick(hotel, ["reviews_count", "reviews.length", "review_count"], null);
    const distance = window.TL.Util.pick(hotel, ["distance", "location.distance"], "");

    document.getElementById("hotel-about").innerHTML = `
      <h3 style="margin-bottom:12px;">About this hotel</h3>
      <p class="tl-text-secondary">${desc ? window.TL.Util.escape(desc) : "No description available for this hotel yet."}</p>
      <div class="tl-chip-row tl-mt-16">
        ${price ? `<span class="tl-pill">${window.TL.Util.escape(price)} / night</span>` : ""}
        ${reviews ? `<span class="tl-pill">${window.TL.Util.escape(reviews)} reviews</span>` : ""}
        ${distance ? `<span class="tl-pill">${window.TL.Util.escape(distance)}</span>` : ""}
      </div>`;
  }

  function renderAmenities(hotel) {
    const amenities = window.TL.Util.pick(hotel, ["amenities"], []);
    const mount = document.getElementById("hotel-amenities");
    if (!Array.isArray(amenities) || !amenities.length) {
      mount.innerHTML = "";
      return;
    }
    mount.innerHTML = `
      <h3 style="margin-bottom:12px;">Amenities</h3>
      <div class="tl-amenity-chips">
        ${amenities.map((a) => `<span>${window.TL.Util.escape(typeof a === "string" ? a : a.name || "")}</span>`).join("")}
      </div>`;
  }

  function renderRooms(hotel) {
    const rooms = window.TL.Util.pick(hotel, ["rooms", "available_rooms"], []);
    const mount = document.getElementById("hotel-rooms");
    if (!Array.isArray(rooms) || !rooms.length) {
      mount.innerHTML = "";
      return;
    }
    mount.innerHTML = `
      <h3 style="margin-bottom:14px;">Available Rooms</h3>
      ${rooms
        .map((r) => {
          const rName = window.TL.Util.name(r, "Room");
          const rPrice = window.TL.Util.money(window.TL.Util.price(r));
          return `<div class="tl-card tl-room-card">
            <span>${window.TL.Util.escape(rName)}</span>
            ${rPrice ? `<span class="tl-price">${window.TL.Util.escape(rPrice)}</span>` : ""}
          </div>`;
        })
        .join("")}`;
  }

  function renderSummary() {
    const price = window.TL.Util.price(currentHotel);
    const mount = document.getElementById("hotel-summary");
    if (price === null || price === undefined) {
      mount.innerHTML = `<div class="tl-hotel-summary-row"><span>${nights} night${nights === 1 ? "" : "s"}</span></div>`;
      return;
    }
    const total = Number(price) * nights;
    mount.innerHTML = `
      <div class="tl-hotel-summary-row"><span>${window.TL.Util.escape(window.TL.Util.money(price))} × ${nights} night${nights === 1 ? "" : "s"}</span></div>
      <div class="tl-hotel-summary-row"><strong>Estimated total</strong><strong>${window.TL.Util.escape(window.TL.Util.money(total))}</strong></div>`;
  }

  function wireStepper() {
    document.getElementById("nights-minus").addEventListener("click", () => {
      nights = Math.max(1, nights - 1);
      document.getElementById("nights-count").textContent = nights;
      renderSummary();
    });
    document.getElementById("nights-plus").addEventListener("click", () => {
      nights = Math.min(60, nights + 1);
      document.getElementById("nights-count").textContent = nights;
      renderSummary();
    });
  }

  function wireAddToBooking() {
    document.getElementById("add-to-booking-btn").addEventListener("click", () => {
      if (!window.TL.Auth.isAuthenticated()) {
        window.location.href = `signin.html?next=hotel-details.html?id=${encodeURIComponent(currentId)}`;
        return;
      }
      window.TL.Cart.setHotel({
        hotel_id: currentId,
        number_of_nights: nights,
        name: window.TL.Util.name(currentHotel),
        city: window.TL.Util.city(currentHotel) || window.TL.Util.country(currentHotel),
        image: hotelImage(currentHotel, currentId),
        price_per_night: window.TL.Util.price(currentHotel)
      });
      window.TL.toast("Hotel added to your booking!");
      window.location.href = "bookings.html";
    });
  }

  async function init() {
    currentId = getParam("id");
    const loading = document.getElementById("hotel-loading");
    const shell = document.getElementById("hotel-shell");
    const errorMount = document.getElementById("hotel-error");

    if (!currentId) {
      loading.classList.add("tl-hidden");
      errorMount.classList.remove("tl-hidden");
      errorMount.innerHTML = window.TL.Util.emptyState("No hotel selected", "Go back to Hotels and pick one to view.");
      return;
    }

    try {
      const response = await window.TL.Hotels.get(currentId);
      currentHotel = window.TL.Util.pick(response, ["data", "hotel"], response);

      loading.classList.add("tl-hidden");
      shell.classList.remove("tl-hidden");

      renderHero(currentHotel);
      renderAbout(currentHotel);
      renderAmenities(currentHotel);
      renderRooms(currentHotel);
      renderSummary();
      wireStepper();
      wireAddToBooking();
    } catch (err) {
      loading.classList.add("tl-hidden");
      errorMount.classList.remove("tl-hidden");
      errorMount.innerHTML = window.TL.Util.errorState(err.message);
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
