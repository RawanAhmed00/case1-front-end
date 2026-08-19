/**
 * TAILORA TOUR GUIDE — DASHBOARD PAGE CONTROLLER
 * Loads overview metrics, recent booking requests, and schedule overview.
 */

(function () {
  "use strict";

  async function loadDashboard() {
    window.TL.showLoading();

    try {
      const [dashRes, requestsRes, scheduleRes, chatsRes, earningsRes, reviewsRes] = await Promise.allSettled([
        window.TL.TourGuideApi.getDashboard(),
        window.TL.TourGuideApi.getRequests(),
        window.TL.TourGuideApi.getSchedule(),
        window.TL.ChatApi ? window.TL.ChatApi.getChats() : Promise.resolve({ data: [] }),
        window.TL.TourGuideApi.getEarnings().catch(() => ({})),
        window.TL.TourGuideApi.getReviews().catch(() => ({ data: [] }))
      ]);

      const dashData = dashRes.status === "fulfilled" ? (dashRes.value.data || dashRes.value || {}) : {};
      const requestsVal = requestsRes.status === "fulfilled" ? requestsRes.value : [];
      const requests = Array.isArray(requestsVal.data) ? requestsVal.data : Array.isArray(requestsVal) ? requestsVal : (requestsVal.data?.data || []);
      const scheduleVal = scheduleRes.status === "fulfilled" ? scheduleRes.value : [];
      const schedule = Array.isArray(scheduleVal.data) ? scheduleVal.data : Array.isArray(scheduleVal) ? scheduleVal : [];
      const chatsVal = chatsRes.status === "fulfilled" ? chatsRes.value : [];
      const chats = Array.isArray(chatsVal.data) ? chatsVal.data : Array.isArray(chatsVal) ? chatsVal : [];

      const earningsVal = earningsRes.status === "fulfilled" ? earningsRes.value : {};
      const earningsData = earningsVal.data || earningsVal || {};

      const reviewsVal = reviewsRes.status === "fulfilled" ? reviewsRes.value : [];
      const reviews = Array.isArray(reviewsVal.data) ? reviewsVal.data : Array.isArray(reviewsVal) ? reviewsVal : [];

      // Calculate Revenue
      let totalRevenue = dashData.total_earnings || earningsData.total_earnings;
      if (!totalRevenue || parseFloat(totalRevenue) === 0) {
        let sum = 0;
        requests.forEach(r => {
          if (r.status === "accepted" && r.price) sum += parseFloat(r.price);
        });
        totalRevenue = sum > 0 ? sum : 0;
      }
      const formattedRevenue = typeof totalRevenue === "number" ? `$${totalRevenue.toFixed(2)}` : (String(totalRevenue).startsWith("$") ? totalRevenue : `$${parseFloat(totalRevenue || 0).toFixed(2)}`);

      // Calculate Rating
      let avgRating = dashData.average_rating;
      if (!avgRating && reviews.length > 0) {
        let sum = 0;
        reviews.forEach(rev => sum += (parseInt(rev.rating) || 0));
        avgRating = (sum / reviews.length).toFixed(1);
      }
      const formattedRating = avgRating ? `${avgRating} ★` : "5.0 ★";

      // Render KPI cards
      const totalReqEl = document.getElementById("kpiTotalRequests");
      const pendingReqEl = document.getElementById("kpiPendingRequests");
      const earningsEl = document.getElementById("kpiTotalEarnings");
      const ratingEl = document.getElementById("kpiAverageRating");

      if (totalReqEl) totalReqEl.textContent = dashData.total_requests !== undefined ? dashData.total_requests : requests.length;
      if (pendingReqEl) pendingReqEl.textContent = dashData.pending_requests !== undefined ? dashData.pending_requests : requests.filter(r => r.status === "pending").length;
      if (earningsEl) earningsEl.textContent = formattedRevenue;
      if (ratingEl) ratingEl.textContent = formattedRating;

      // Render Pending Requests Table
      renderPendingRequests(requests);

      // Render Today's Schedule Timeline
      renderScheduleSnippet(schedule, requests, chats);

    } catch (err) {
      window.TL.showToast("Failed to load dashboard data: " + err.message, "error");
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
      obj.traveler_name || obj.traveler;
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
      parse(obj.booking && obj.booking.hotel && obj.booking.hotel.country) ||
      parse(obj.user && obj.user.country) ||
      parse(obj.traveler && obj.traveler.country) ||
      parse(obj.traveler && obj.traveler.user && obj.traveler.user.country) ||
      parse(obj.destination && obj.destination.country) ||
      parse(obj.user && obj.user.address && obj.user.address.country) ||
      parse(obj.location && obj.location.country) ||
      (typeof obj.destination === "string" ? obj.destination : null) ||
      (typeof obj.location === "string" && obj.location.includes(",") ? obj.location.split(",").pop().trim() : null) ||
      (typeof obj.location === "string" ? obj.location : null);
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  function renderPendingRequests(requests) {
    const tbody = document.getElementById("pendingRequestsTableBody");
    if (!tbody) return;

    const pending = requests.filter(r => r.status === "pending");

    if (pending.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6">
            <div class="tl-empty-state">
              <i class="bi bi-check2-circle"></i>
              <h5>No Pending Requests</h5>
              <p class="tl-text-secondary">You have responded to all tour guide booking requests!</p>
            </div>
          </td>
        </tr>`;
      return;
    }

    tbody.innerHTML = pending.map(req => {
      const username = extractUsername(req);
      const country = extractCountry(req.trip) || extractCountry(req.booking?.trip) || extractCountry(req) || "Trip Destination";
      const avatarInitial = username.charAt(0).toUpperCase();

      const travelerUserId = req.user_id || req.traveler_id || (req.user && req.user.id) || (req.traveler && req.traveler.id) || (req.partner && req.partner.id);
      const chatHref = travelerUserId ? `messages.html?user_id=${travelerUserId}&name=${encodeURIComponent(username)}` : 'messages.html';

      // Right time when the request was made from the user
      let requestDateStr = 'N/A';
      let requestTimeStr = '09:00 AM';
      if (req.created_at) {
        const d = new Date(req.created_at);
        if (!isNaN(d.getTime())) {
          requestDateStr = d.toISOString().split('T')[0];
          requestTimeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
          requestDateStr = String(req.created_at).split('T')[0];
          requestTimeStr = String(req.created_at).split('T')[1] ? String(req.created_at).split('T')[1].substring(0, 5) : (req.time || '09:00 AM');
        }
      } else {
        requestDateStr = req.date || 'Today';
        requestTimeStr = req.time || '09:00 AM';
      }

      return `
        <tr>
          <td>
            <div class="d-flex align-items-center gap-3">
              <div class="tl-avatar">${avatarInitial}</div>
              <div>
                <div class="fw-semibold text-light">${escapeHtml(username)}</div>
                <div class="tl-metadata"><i class="bi bi-person me-1"></i> Traveler</div>
              </div>
            </div>
          </td>
          <td>
            <div class="fw-semibold text-light">${escapeHtml(country)}</div>
            <div class="tl-metadata"><i class="bi bi-geo-alt me-1 text-teal"></i> Tour Location</div>
          </td>
          <td>
            <div class="fw-semibold text-light">${escapeHtml(requestDateStr)}</div>
            <div class="tl-metadata"><i class="bi bi-clock me-1 text-teal"></i> ${escapeHtml(requestTimeStr)}</div>
          </td>
          <td class="fw-bold text-teal">$${req.price || req.fee || "0"}</td>
          <td>
            <span class="tl-badge tl-badge--warning"><i class="bi bi-hourglass-split"></i> Pending</span>
          </td>
          <td class="text-end">
            <div class="d-inline-flex flex-column gap-1 align-items-end">
              <a href="${chatHref}" class="tl-btn tl-btn--outline tl-btn--xs w-100 justify-content-center" title="Chat with Traveler">
                <i class="bi bi-chat-dots me-1"></i> Chat
              </a>
              <button class="tl-btn tl-btn--success tl-btn--xs w-100 justify-content-center accept-btn" data-id="${req.id}">
                <i class="bi bi-check-lg me-1"></i> Accept
              </button>
              <button class="tl-btn tl-btn--danger tl-btn--xs w-100 justify-content-center reject-btn" data-id="${req.id}">
                <i class="bi bi-x-lg me-1"></i> Reject
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join("");

    // Wire Accept & Reject buttons
    tbody.querySelectorAll(".accept-btn").forEach(btn => {
      btn.addEventListener("click", () => handleAction(btn.dataset.id, "accept"));
    });
    tbody.querySelectorAll(".reject-btn").forEach(btn => {
      btn.addEventListener("click", () => handleAction(btn.dataset.id, "reject"));
    });
  }

  async function handleAction(id, action) {
    window.TL.showLoading();
    try {
      if (action === "accept") {
        await window.TL.TourGuideApi.acceptRequest(id);
        window.TL.showToast(`Request accepted successfully!`, "success");
      } else {
        await window.TL.TourGuideApi.rejectRequest(id);
        window.TL.showToast(`Request rejected.`, "info");
      }
      await loadDashboard();
    } catch (err) {
      window.TL.showToast(`Error updating request: ${err.message}`, "error");
    } finally {
      window.TL.hideLoading();
    }
  }

  function renderScheduleSnippet(schedule, requests = [], chats = []) {
    const container = document.getElementById("todayScheduleContainer");
    if (!container) return;

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    function normalizeDate(val) {
      if (!val) return null;
      let s = String(val).trim();
      if (s.includes("T")) s = s.split("T")[0];
      if (s.includes(" ")) s = s.split(" ")[0];
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
      if (/^\d{2}[-\/]\d{2}[-\/]\d{4}$/.test(s)) {
        const parts = s.split(/[-\/]/);
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      const d = new Date(s);
      if (!isNaN(d.getTime())) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dayNum = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${dayNum}`;
      }
      return s;
    }

    // Merge all ACCEPTED tour guide items from both schedule AND requests API endpoints!
    const acceptedMap = new Map();

    (requests || []).forEach(r => {
      const st = (r.status || r.request_status || '').toLowerCase();
      if (st === 'accepted' || st === 'confirmed') {
        acceptedMap.set(String(r.id), r);
      }
    });

    (schedule || []).forEach(s => {
      const st = (s.status || s.request_status || '').toLowerCase();
      if (st === 'accepted' || st === 'confirmed') {
        if (!acceptedMap.has(String(s.id))) {
          acceptedMap.set(String(s.id), s);
        }
      }
    });

    const allAccepted = Array.from(acceptedMap.values());

    const todayTours = allAccepted.filter(tour => {
      const tourDate = normalizeDate(
        tour.start_date ||
        tour.date ||
        tour.tour_date ||
        tour.booking_date ||
        (tour.trip && tour.trip.start_date) ||
        (tour.booking && (tour.booking.start_date || tour.booking.created_at)) ||
        tour.accepted_at ||
        tour.created_at
      );
      return tourDate === todayStr;
    });

    if (todayTours.length === 0) {
      container.innerHTML = `
        <div class="tl-empty-state p-4">
          <i class="bi bi-calendar-event fs-1 text-teal mb-2 d-block"></i>
          <h6 class="text-light mb-1 fw-bold">No Events Today</h6>
          <p class="tl-text-secondary mb-0 small">You have no tour guide events scheduled for today.</p>
        </div>`;
      return;
    }

    const userNamesMap = {};
    (requests || []).forEach(r => {
      const uid = r.user_id || r.traveler_id || r.user?.id || r.traveler?.id;
      const uname = r.username || r.user_name || r.name || r.user?.username || r.user?.name || r.traveler_name;
      if (uid && uname) userNamesMap[String(uid)] = uname;
    });
    (chats || []).forEach(c => {
      const partner = c.partner || c.user || c.traveler || {};
      const uid = partner.id || c.user_id || c.traveler_id || c.sender_id || c.receiver_id;
      const uname = partner.name || partner.username || c.name || c.traveler_name;
      if (uid && uname) userNamesMap[String(uid)] = uname;
    });

    container.innerHTML = todayTours.map(tour => {
      let username = extractUsername(tour);
      if (username === "Traveler" && tour.user_id && userNamesMap[String(tour.user_id)]) {
        username = userNamesMap[String(tour.user_id)];
      }
      const country = extractCountry(tour);
      const initial = username.charAt(0).toUpperCase();
      const timeStr = tour.time || (tour.start_date ? tour.start_date.split('T')[0] : 'Today');
      
      const travelerUserId = tour.user_id || tour.traveler_id || (tour.user && tour.user.id);
      const chatHref = travelerUserId ? `messages.html?user_id=${travelerUserId}&name=${encodeURIComponent(username)}` : 'messages.html';

      return `
        <div class="p-3 mb-2 rounded-3 tl-card-snippet d-flex align-items-center justify-content-between gap-3 tl-card--hover">
          <div class="d-flex align-items-center gap-3">
            <div class="tl-avatar text-teal bg-teal bg-opacity-10 border border-teal border-opacity-25">${initial}</div>
            <div>
              <div class="fw-semibold text-light fs-6">${escapeHtml(username)}</div>
              <div class="tl-metadata">
                <i class="bi bi-compass me-1 text-teal"></i> ${escapeHtml(tour.title || "Guided Tour")} ${country ? `&bull; <i class="bi bi-geo-alt me-1 text-teal"></i> ${escapeHtml(country)}` : ''}
              </div>
            </div>
          </div>
          <div class="d-flex flex-column align-items-end gap-1">
            <span class="tl-badge tl-badge--info"><i class="bi bi-clock me-1"></i> ${escapeHtml(timeStr)}</span>
            <a href="${chatHref}" class="tl-btn tl-btn--outline tl-btn--xs mt-1" title="Chat with Traveler">
              <i class="bi bi-chat-dots me-1"></i> Chat
            </a>
          </div>
        </div>
      `;
    }).join("");
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (document.body.dataset.page === "dashboard") {
      loadDashboard();
    }
  });
})();
