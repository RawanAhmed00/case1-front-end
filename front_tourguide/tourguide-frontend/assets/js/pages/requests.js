/**
 * TAILORA TOUR GUIDE — REQUESTS PAGE CONTROLLER
 * Full management of booking requests: filtering, details modal, accept and reject API operations.
 */

(function () {
  "use strict";

  let allRequests = [];
  let currentFilter = "all";

  async function loadRequests() {
    window.TL.showLoading();
    try {
      const res = await window.TL.TourGuideApi.getRequests();
      allRequests = Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : (res.data?.data || []);
      renderRequests();
    } catch (err) {
      window.TL.showToast("Failed to load requests: " + err.message, "error");
    } finally {
      window.TL.hideLoading();
    }
  }

  function extractUsername(obj) {
    if (!obj) return "Traveler";
    if (typeof obj === "string") return obj;
    const name = obj.username || obj.user_name || obj.name ||
      (obj.trip && (obj.trip.user_name || (obj.trip.user && (obj.trip.user.username || obj.trip.user.user_name || obj.trip.user.name)))) ||
      (obj.user && (obj.user.username || obj.user.user_name || obj.user.name)) ||
      (obj.traveler && (obj.traveler.username || obj.traveler.user_name || obj.traveler.name || (obj.traveler.user && (obj.traveler.user.username || obj.traveler.user.name)))) ||
      (obj.booking && (obj.booking.username || obj.booking.user_name || (obj.booking.user && (obj.booking.user.username || obj.booking.user.name)))) ||
      (obj.customer && (obj.customer.username || obj.customer.name)) ||
      obj.traveler_name;
    return name || "Traveler";
  }

  function extractCountry(obj) {
    if (!obj) return null;
    const parse = (val) => {
      if (!val) return null;
      if (typeof val === "string") return val;
      if (typeof val === "object" && val.name) return val.name;
      if (typeof val === "object" && val.country_name) return val.country_name;
      return null;
    };

    return parse(obj.dis_country) ||
      parse(obj.country) ||
      parse(obj.country_name) ||
      parse(obj.destination) ||
      parse(obj.trip && (obj.trip.dis_country || obj.trip.country || obj.trip.country_name || obj.trip.destination)) ||
      parse(obj.booking && obj.booking.trip && (obj.booking.trip.dis_country || obj.booking.trip.country || obj.booking.trip.country_name || obj.booking.trip.destination)) ||
      parse(obj.user && obj.user.country) ||
      parse(obj.traveler && obj.traveler.country) ||
      parse(obj.traveler && obj.traveler.user && obj.traveler.user.country) ||
      parse(obj.booking && obj.booking.country) ||
      parse(obj.booking && obj.booking.user && obj.booking.user.country) ||
      parse(obj.user && obj.user.address && obj.user.address.country) ||
      parse(obj.location && obj.location.country) ||
      parse(obj.destination && obj.destination.country) ||
      (typeof obj.location === "string" && obj.location.includes(",") ? obj.location.split(",").pop().trim() : null);
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  function renderRequests() {
    const grid = document.getElementById("requestsGrid");
    if (!grid) return;

    const searchTerm = (document.getElementById("requestsSearchInput")?.value || "").toLowerCase();

    let filtered = allRequests.filter(req => {
      if (currentFilter !== "all" && req.status !== currentFilter) return false;
      if (searchTerm) {
        const username = extractUsername(req).toLowerCase();
        const country = (extractCountry(req) || "").toLowerCase();
        const text = `${username} ${country} status ${req.status} price ${req.price}`.toLowerCase();
        if (!text.includes(searchTerm)) return false;
      }
      return true;
    });

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="col-12">
          <div class="tl-card tl-empty-state">
            <i class="bi bi-inbox fs-1 text-teal"></i>
            <h5>No Requests Found</h5>
            <p class="tl-text-secondary">No tour guide requests match your current filters.</p>
          </div>
        </div>`;
      return;
    }

    grid.innerHTML = filtered.map(req => {
      const badgeCls = req.status === "accepted" ? "tl-badge--success" : req.status === "rejected" ? "tl-badge--danger" : "tl-badge--warning";
      const statusIcon = req.status === "accepted" ? "bi-check-circle" : req.status === "rejected" ? "bi-x-circle" : "bi-hourglass-split";
      const username = extractUsername(req);
      const country = extractCountry(req);
      const avatarInitial = username.charAt(0).toUpperCase();

      const travelerUserId = req.user_id || req.traveler_id || (req.trip && req.trip.user_id) || (req.trip && req.trip.user && req.trip.user.id) || (req.booking && req.booking.user_id) || (req.booking && req.booking.user && req.booking.user.id) || (req.user && req.user.id) || (req.traveler && req.traveler.id) || (req.partner && req.partner.id);
      const chatHref = travelerUserId ? `messages.html?user_id=${travelerUserId}&name=${encodeURIComponent(username)}` : 'messages.html';

      return `
        <div class="col-md-6 col-lg-4">
          <div class="tl-card tl-card--hover tl-card--accent">
            <div class="tl-card__head">
              <div class="d-flex align-items-center gap-3">
                <div class="tl-avatar">${avatarInitial}</div>
                <div>
                  <h6 class="mb-0 text-light">${escapeHtml(username)}</h6>
                  <span class="tl-metadata"><i class="bi bi-person me-1"></i>Traveler Request</span>
                </div>
              </div>
              <span class="tl-badge ${badgeCls} text-capitalize">
                <i class="bi ${statusIcon}"></i> ${req.status}
              </span>
            </div>

            <div class="mb-3">
              <div class="fw-semibold text-teal mb-1"><i class="bi bi-clock me-1"></i> Status: ${req.status}</div>
              <div class="tl-metadata mb-2">
                <i class="bi bi-calendar-event me-1"></i> ${req.created_at ? req.created_at.split('T')[0] : ''} ${country ? `&bull; <i class="bi bi-geo-alt me-1"></i> ${escapeHtml(country)}` : ''}
              </div>
              <p class="tl-body text-secondary small text-truncate-2 mb-0" style="min-height: 40px;">
                Tour guide request from ${escapeHtml(username)}${country ? ` (${escapeHtml(country)})` : ''}
              </p>
            </div>

            <div class="pt-3 border-top border-secondary border-opacity-25 d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
              <div>
                <span class="tl-label d-block text-teal fw-semibold">Fee Offered</span>
                <span class="fs-4 fw-bold text-light">$${req.price || "0"}</span>
              </div>
              <div class="d-flex align-items-center gap-2 flex-wrap">
                <a href="${chatHref}" class="tl-btn tl-btn--outline tl-btn--sm" title="Chat with Traveler">
                  <i class="bi bi-chat-dots me-1"></i> Chat
                </a>
                <button class="tl-btn tl-btn--outline tl-btn--sm view-btn" data-id="${req.id}">
                  <i class="bi bi-eye me-1"></i> Details
                </button>
                ${req.status === "pending" ? `
                  <button class="tl-btn tl-btn--success tl-btn--sm accept-btn" data-id="${req.id}" title="Accept Request">
                    <i class="bi bi-check-lg me-1"></i> Accept
                  </button>
                  <button class="tl-btn tl-btn--danger tl-btn--sm reject-btn" data-id="${req.id}" title="Reject Request">
                    <i class="bi bi-x-lg me-1"></i> Reject
                  </button>
                ` : ""}
              </div>
            </div>
          </div>
        </div>`;
    }).join("");

    // Event Listeners
    grid.querySelectorAll(".view-btn").forEach(b => b.addEventListener("click", () => openDetailModal(b.dataset.id)));
    grid.querySelectorAll(".accept-btn").forEach(b => b.addEventListener("click", () => executeAction(b.dataset.id, "accept")));
    grid.querySelectorAll(".reject-btn").forEach(b => b.addEventListener("click", () => executeAction(b.dataset.id, "reject")));
  }

  async function openDetailModal(id) {
    window.TL.showLoading();
    try {
      const res = await window.TL.TourGuideApi.getRequest(id);
      const req = res.data || res;
      const username = extractUsername(req);
      const country = extractCountry(req);
      const travelerUserId = req.user_id || req.traveler_id || (req.user && req.user.id) || (req.traveler && req.traveler.id);
      const chatHref = travelerUserId ? `messages.html?user_id=${travelerUserId}&name=${encodeURIComponent(username)}` : 'messages.html';

      const modalBody = document.getElementById("requestModalBody");
      const modalFooter = document.getElementById("requestModalFooter");

      const trip = req.trip || req.booking?.trip || null;
      const tripDates = trip ? `${trip.start_date ? trip.start_date.split('T')[0] : 'N/A'} to ${trip.end_date ? trip.end_date.split('T')[0] : 'N/A'}` : null;
      const countryName = extractCountry(trip) || country || 'Trip Destination';

      // Calculate Number of Trip's Days
      let tripDaysCount = '1 Day';
      if (trip && trip.start_date && trip.end_date) {
        const s = new Date(trip.start_date);
        const e = new Date(trip.end_date);
        if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
          const diffTime = Math.abs(e.getTime() - s.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
          if (diffDays > 0) tripDaysCount = `${diffDays} ${diffDays === 1 ? 'Day' : 'Days'}`;
        }
      } else if (req.number_of_days || req.days || (trip && trip.days)) {
        const dNum = req.number_of_days || req.days || trip.days;
        tripDaysCount = `${dNum} ${dNum == 1 ? 'Day' : 'Days'}`;
      } else if (req.duration) {
        tripDaysCount = String(req.duration);
      }

      if (modalBody) {
        modalBody.innerHTML = `
          <div class="d-flex align-items-center gap-3 mb-4 p-3 rounded-3 tl-card-snippet">
            <div class="tl-avatar fs-4">${username.charAt(0).toUpperCase()}</div>
            <div>
              <h5 class="mb-0 text-light">${escapeHtml(username)}</h5>
              <div class="tl-metadata">${country ? `<i class="bi bi-geo-alt me-1 text-teal"></i> ${escapeHtml(country)}` : '<i class="bi bi-person me-1"></i> Traveler'}</div>
            </div>
          </div>

          ${trip ? `
            <div class="p-3 mb-4 rounded-3 border border-teal border-opacity-25 bg-teal bg-opacity-10">
              <div class="d-flex align-items-center gap-2 mb-2 text-teal fw-semibold">
                <i class="bi bi-map fs-5"></i> Associated Traveler Trip Details
              </div>
              <div class="row g-2 small">
                <div class="col-6"><span class="tl-metadata d-block">Destination / Country</span><strong class="text-light">${escapeHtml(countryName)}</strong></div>
                <div class="col-6"><span class="tl-metadata d-block">Trip Budget</span><strong class="text-light">$${trip.budget || '0.00'}</strong></div>
                <div class="col-6"><span class="tl-metadata d-block">Trip Dates</span><strong class="text-light">${tripDates}</strong></div>
                <div class="col-6"><span class="tl-metadata d-block">Travelers Count</span><strong class="text-light">${trip.travelers || 1} Traveler(s)</strong></div>
              </div>
            </div>
          ` : ''}

          <div class="row g-3">
            <div class="col-6">
              <span class="tl-metadata d-block">Status</span>
              <span class="fw-semibold text-light text-capitalize">${escapeHtml(req.status || 'pending')}</span>
            </div>
            <div class="col-6">
              <span class="tl-metadata d-block">Fee Offered</span>
              <span class="fw-bold text-teal fs-5">$${req.price || req.fee || '0'}</span>
            </div>
            <div class="col-6">
              <span class="tl-metadata d-block">Request Date</span>
              <span class="fw-medium text-light">${req.created_at ? req.created_at.split('T')[0] : (req.date || 'N/A')}</span>
            </div>
            <div class="col-6">
              <span class="tl-metadata d-block">Number of Trip's Days</span>
              <span class="fw-semibold text-light">${escapeHtml(tripDaysCount)}</span>
            </div>
          </div>
        `;
      }

      if (modalFooter) {
        modalFooter.innerHTML = `
          <a href="${chatHref}" class="tl-btn tl-btn--outline" title="Chat with Traveler">
            <i class="bi bi-chat-dots me-1"></i> Chat
          </a>
          ${req.status === "pending" ? `
            <button class="tl-btn tl-btn--success modal-accept-btn">
              <i class="bi bi-check-lg me-1"></i> Accept
            </button>
            <button class="tl-btn tl-btn--danger modal-reject-btn">
              <i class="bi bi-x-lg me-1"></i> Reject
            </button>
          ` : ""}
          <button type="button" class="tl-btn tl-btn--ghost" data-bs-dismiss="modal">Close</button>
        `;

        modalFooter.querySelector(".modal-accept-btn")?.addEventListener("click", () => {
          closeModal();
          executeAction(req.id, "accept");
        });
        modalFooter.querySelector(".modal-reject-btn")?.addEventListener("click", () => {
          closeModal();
          executeAction(req.id, "reject");
        });
      }

      const modalEl = document.getElementById("requestDetailModal");
      if (modalEl) {
        const bsModal = new bootstrap.Modal(modalEl);
        bsModal.show();
      }
    } catch (err) {
      window.TL.showToast("Failed to fetch request details: " + err.message, "error");
    } finally {
      window.TL.hideLoading();
    }
  }

  function closeModal() {
    const el = document.getElementById("requestDetailModal");
    const instance = bootstrap.Modal.getInstance(el);
    if (instance) instance.hide();
  }

  async function executeAction(id, action) {
    window.TL.showLoading();
    try {
      if (action === "accept") {
        await window.TL.TourGuideApi.acceptRequest(id);
        window.TL.showToast("Request accepted successfully!", "success");
      } else {
        await window.TL.TourGuideApi.rejectRequest(id);
        window.TL.showToast("Request rejected.", "info");
      }
      await loadRequests();
    } catch (err) {
      window.TL.showToast(`Operation failed: ${err.message}`, "error");
    } finally {
      window.TL.hideLoading();
    }
  }

  function init() {
    if (document.body.dataset.page !== "requests") return;

    loadRequests();

    // Filter Buttons
    document.querySelectorAll("[data-filter]").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("[data-filter]").forEach(b => b.classList.remove("active", "tl-btn--primary"));
        document.querySelectorAll("[data-filter]").forEach(b => b.classList.add("tl-btn--ghost"));
        btn.classList.remove("tl-btn--ghost");
        btn.classList.add("active", "tl-btn--primary");
        currentFilter = btn.dataset.filter;
        renderRequests();
      });
    });

    // Search input
    document.getElementById("requestsSearchInput")?.addEventListener("input", renderRequests);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
