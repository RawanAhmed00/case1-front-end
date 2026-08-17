/**
 * TAILORA TOUR GUIDE — SCHEDULE PAGE CONTROLLER
 * Visual schedule view for confirmed and upcoming tour itineraries with interactive Calendar template.
 */

(function () {
  "use strict";

  let currentCalDate = new Date();

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

  async function loadSchedule() {
    window.TL.showLoading();
    try {
      const [scheduleRes, requestsRes, chatsRes] = await Promise.all([
        window.TL.TourGuideApi.getSchedule().catch(() => ({ data: [] })),
        window.TL.TourGuideApi.getRequests().catch(() => ({ data: [] })),
        (window.TL.ChatApi ? window.TL.ChatApi.getChats() : Promise.resolve({ data: [] })).catch(() => ({ data: [] }))
      ]);

      const tours = Array.isArray(scheduleRes.data) ? scheduleRes.data : Array.isArray(scheduleRes) ? scheduleRes : [];
      const requestsList = Array.isArray(requestsRes.data) ? requestsRes.data : Array.isArray(requestsRes) ? requestsRes : (requestsRes.data?.data || []);
      const chatsList = Array.isArray(chatsRes.data) ? chatsRes.data : Array.isArray(chatsRes) ? chatsRes : [];

      // Combine all ACCEPTED tour guide requests from both endpoints
      const acceptedMap = new Map();

      requestsList.forEach(r => {
        const st = (r.status || r.request_status || '').toLowerCase();
        if (st === 'accepted' || st === 'confirmed') {
          acceptedMap.set(String(r.id), r);
        }
      });

      tours.forEach(t => {
        const st = (t.status || t.request_status || '').toLowerCase();
        if (st === 'accepted' || st === 'confirmed') {
          if (!acceptedMap.has(String(t.id))) {
            acceptedMap.set(String(t.id), t);
          }
        }
      });

      const acceptedTours = Array.from(acceptedMap.values());

      renderCalendar(acceptedTours);
      wireCalendarControls(acceptedTours);
      renderSchedule(acceptedTours, requestsList, chatsList);
    } catch (err) {
      window.TL.showToast("Failed to load tour schedule: " + err.message, "error");
    } finally {
      window.TL.hideLoading();
    }
  }

  function renderCalendar(tours) {
    const monthYearEl = document.getElementById("calendarMonthYear");
    const gridEl = document.getElementById("calendarDaysGrid");
    if (!monthYearEl || !gridEl) return;

    const year = currentCalDate.getFullYear();
    const month = currentCalDate.getMonth();

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    monthYearEl.textContent = `${monthNames[month]} ${year}`;

    // Collect ONLY the 1st day of the trip (start_date) for each accepted tour
    const eventDates = new Set();
    (tours || []).forEach(t => {
      const startDateVal = t.start_date || (t.trip && t.trip.start_date) || (t.booking && t.booking.trip && t.booking.trip.start_date) || t.date || t.created_at;
      const d = normalizeDate(startDateVal);
      if (d) eventDates.add(d);
    });

    const firstDayIndex = new Date(year, month, 1).getDay();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    const todayObj = new Date();
    const todayStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}-${String(todayObj.getDate()).padStart(2, '0')}`;

    let daysHtml = "";

    // Previous month padding days
    for (let x = firstDayIndex; x > 0; x--) {
      const dayNum = prevMonthLastDay - x + 1;
      daysHtml += `<div class="tl-calendar-day is-other-month"><span class="tl-calendar-day__num">${dayNum}</span></div>`;
    }

    // Current month days
    for (let i = 1; i <= lastDay; i++) {
      const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const isToday = dayStr === todayStr;
      const hasEvent = eventDates.has(dayStr);

      daysHtml += `
        <div class="tl-calendar-day ${isToday ? 'is-today' : ''} ${hasEvent ? 'has-event' : ''}" data-date="${dayStr}">
          <span class="tl-calendar-day__num">${i}</span>
          ${hasEvent ? '<span class="tl-calendar-day__badge" title="Tour Scheduled"></span>' : ''}
        </div>
      `;
    }

    // Next month padding days to fill 7 columns
    const totalRendered = firstDayIndex + lastDay;
    const nextDays = (7 - (totalRendered % 7)) % 7;
    for (let j = 1; j <= nextDays; j++) {
      daysHtml += `<div class="tl-calendar-day is-other-month"><span class="tl-calendar-day__num">${j}</span></div>`;
    }

    gridEl.innerHTML = daysHtml;
  }

  function wireCalendarControls(tours) {
    const prevBtn = document.getElementById("calPrevBtn");
    const nextBtn = document.getElementById("calNextBtn");
    const todayBtn = document.getElementById("calTodayBtn");

    if (prevBtn && !prevBtn.dataset.listenerAttached) {
      prevBtn.dataset.listenerAttached = "true";
      prevBtn.addEventListener("click", () => {
        currentCalDate.setMonth(currentCalDate.getMonth() - 1);
        renderCalendar(tours);
      });
    }

    if (nextBtn && !nextBtn.dataset.listenerAttached) {
      nextBtn.dataset.listenerAttached = "true";
      nextBtn.addEventListener("click", () => {
        currentCalDate.setMonth(currentCalDate.getMonth() + 1);
        renderCalendar(tours);
      });
    }

    if (todayBtn && !todayBtn.dataset.listenerAttached) {
      todayBtn.dataset.listenerAttached = "true";
      todayBtn.addEventListener("click", () => {
        currentCalDate = new Date();
        renderCalendar(tours);
      });
    }
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  function extractCountry(obj) {
    if (!obj) return null;
    const parse = (val) => {
      if (!val) return null;
      if (typeof val === "string") return val;
      if (typeof val === "object" && val.name) return val.name;
      return null;
    };

    return parse(obj.country) ||
      parse(obj.user && obj.user.country) ||
      parse(obj.traveler && obj.traveler.country) ||
      parse(obj.trip && obj.trip.country) ||
      parse(obj.booking && obj.booking.country) ||
      parse(obj.location && obj.location.country) ||
      parse(obj.destination && obj.destination.country) ||
      (typeof obj.location === "string" && obj.location.includes(",") ? obj.location.split(",").pop().trim() : null);
  }

  function renderSchedule(tours, requestsList, chatsList) {
    const listEl = document.getElementById("scheduleList");
    if (!listEl) return;

    if (tours.length === 0) {
      listEl.innerHTML = `
        <div class="tl-card tl-empty-state">
          <i class="bi bi-calendar-x fs-1 text-teal"></i>
          <h5>No Accepted Tours Scheduled</h5>
          <p class="tl-text-secondary">You currently have no accepted upcoming tours on your schedule.</p>
        </div>`;
      return;
    }

    const userNamesMap = {};

    requestsList.forEach(r => {
      const uid = r.user_id || r.traveler_id || r.user?.id || r.traveler?.id || r.booking?.user_id;
      const uname = r.username || r.user_name || r.name || r.user?.username || r.user?.name || r.traveler?.username || r.traveler?.name || r.traveler_name;
      if (uid && uname) userNamesMap[String(uid)] = uname;
    });

    chatsList.forEach(c => {
      const partner = c.partner || c.user || c.traveler || {};
      const uid = partner.id || c.user_id || c.traveler_id || c.sender_id || c.receiver_id;
      const uname = partner.name || partner.username || c.name || c.traveler_name;
      if (uid && uname) userNamesMap[String(uid)] = uname;
    });

    listEl.innerHTML = tours.map(tour => {
      let userName = tour.username || tour.user_name || tour.user?.username || tour.user?.name || tour.traveler?.name || tour.traveler?.username || tour.traveler_name;

      if (!userName && tour.user_id) {
        userName = userNamesMap[String(tour.user_id)];
      }

      if (!userName && requestsList.length > 0) {
        const matchedReq = requestsList.find(r => 
          r.user_id == tour.user_id || 
          r.id == tour.id || 
          r.trip_id == tour.id ||
          (r.booking && (r.booking.user_id == tour.user_id || r.booking.id == tour.id))
        );

        if (matchedReq) {
          userName = matchedReq.user?.username || matchedReq.user?.name || matchedReq.traveler_name || matchedReq.name || matchedReq.user_name || (matchedReq.booking && (matchedReq.booking.user?.username || matchedReq.booking.user?.name));
        }
      }

      if (!userName || userName === "shhhhhhhhhh") {
        userName = "Traveler";
      }

      const country = extractCountry(tour) || "Tour Location";

      // Date of acceptance for this request
      let acceptedDateStr = 'N/A';
      if (tour.accepted_at) {
        acceptedDateStr = String(tour.accepted_at).split('T')[0];
      } else if (tour.created_at) {
        acceptedDateStr = String(tour.created_at).split('T')[0];
      } else {
        acceptedDateStr = tour.start_date ? String(tour.start_date).split('T')[0] : 'N/A';
      }

      const status = 'Accepted';
      const budget = tour.budget || tour.price || tour.fee || '0.00';
      const userId = tour.user_id || tour.traveler_id || (tour.user && tour.user.id) || (tour.traveler && tour.traveler.id) || (tour.booking && tour.booking.user_id) || (tour.partner && tour.partner.id);
      const chatUrl = `messages.html${userId ? '?user_id=' + userId + '&name=' + encodeURIComponent(userName) : ''}`;

      return `
        <div class="tl-card tl-card--hover mb-3 border-start border-4 border-teal" id="tour-card-${tour.id}">
          <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
            <div class="d-flex align-items-start gap-3">
              <div class="p-3 rounded-3 bg-teal bg-opacity-10 text-teal fs-3">
                <i class="bi bi-calendar-check"></i>
              </div>
              <div>
                <div class="d-flex align-items-center gap-2 mb-1">
                  <span class="tl-badge tl-badge--info"><i class="bi bi-clock me-1"></i> ${acceptedDateStr}</span>
                  <span class="tl-badge tl-badge--success"><i class="bi bi-check-circle me-1"></i> ${status}</span>
                </div>
                <h5 class="text-light mb-1">${escapeHtml(userName)}</h5>
                <div class="tl-metadata">
                  <i class="bi bi-geo-alt me-1 text-teal"></i> ${escapeHtml(country)} &bull; <i class="bi bi-person me-1"></i>Fee Offered: <strong>$${budget}</strong>
                </div>
              </div>
            </div>

            <div class="d-flex align-items-center gap-2 w-100 w-md-auto justify-content-end">
              <a href="${chatUrl}" class="tl-btn tl-btn--primary tl-btn--sm">
                <i class="bi bi-chat-dots me-1"></i> Chat
              </a>
            </div>
          </div>
        </div>
      `;
    }).join("");

    // Wire Details buttons
    listEl.querySelectorAll(".open-schedule-detail-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const matchedTour = tours.find(t => String(t.id) === String(id));
        if (matchedTour) {
          openScheduleDetailModal(matchedTour);
        }
      });
    });
  }

  function openScheduleDetailModal(tour) {
    const modalEl = document.getElementById("scheduleDetailModal");
    if (!modalEl) return;

    const modalBody = document.getElementById("scheduleDetailModalBody");
    const modalFooter = document.getElementById("scheduleDetailModalFooter");

    const userName = extractUsername(tour);
    const country = extractCountry(tour) || "Tour Location";
    const startDate = tour.start_date ? tour.start_date.split('T')[0] : (tour.created_at ? tour.created_at.split('T')[0] : 'N/A');
    const endDate = tour.end_date ? tour.end_date.split('T')[0] : null;
    const dateDisplay = endDate && endDate !== startDate ? `${startDate} to ${endDate}` : startDate;
    const budget = tour.budget || tour.price || tour.fee || '0.00';
    const travelers = tour.travelers || (tour.trip && tour.trip.travelers) || 1;
    const travelStyle = tour.travel_style || (tour.trip && tour.trip.travel_style) || 'Standard';
    const interests = tour.interests || (tour.trip && tour.trip.interests) || [];
    const interestsStr = Array.isArray(interests) ? interests.join(", ") : (typeof interests === "string" ? interests : "General Sightseeing");

    const userId = tour.user_id || tour.traveler_id || (tour.user && tour.user.id) || (tour.traveler && tour.traveler.id) || (tour.booking && tour.booking.user_id);
    const chatUrl = `messages.html${userId ? '?user_id=' + userId + '&name=' + encodeURIComponent(userName) : ''}`;

    if (modalBody) {
      modalBody.innerHTML = `
        <div class="d-flex align-items-center gap-3 mb-4 p-3 rounded-3 tl-card-snippet">
          <div class="tl-avatar fs-3 text-teal bg-teal bg-opacity-10 border border-teal border-opacity-25">${userName.charAt(0).toUpperCase()}</div>
          <div>
            <h5 class="mb-0 text-light">${escapeHtml(userName)}</h5>
            <div class="tl-metadata"><i class="bi bi-geo-alt me-1 text-teal"></i> ${escapeHtml(country)} &bull; <i class="bi bi-person me-1"></i> Traveler</div>
          </div>
        </div>

        <div class="p-3 mb-4 rounded-3 border border-teal border-opacity-25 bg-teal bg-opacity-10">
          <div class="d-flex align-items-center gap-2 mb-2 text-teal fw-semibold">
            <i class="bi bi-map fs-5"></i> Trip & Tour Details
          </div>
          <div class="row g-3 small">
            <div class="col-6"><span class="tl-metadata d-block">Tour Location / Country</span><strong class="text-light fs-6">${escapeHtml(country)}</strong></div>
            <div class="col-6"><span class="tl-metadata d-block">Fee Offered / Budget</span><strong class="text-teal fs-5">$${budget}</strong></div>
            <div class="col-6"><span class="tl-metadata d-block">1st Day & Trip Schedule</span><strong class="text-light">${escapeHtml(dateDisplay)}</strong></div>
            <div class="col-6"><span class="tl-metadata d-block">Group Size</span><strong class="text-light">${travelers} Traveler(s)</strong></div>
            <div class="col-6"><span class="tl-metadata d-block">Travel Style</span><strong class="text-light text-capitalize">${escapeHtml(travelStyle)}</strong></div>
            <div class="col-6"><span class="tl-metadata d-block">Interests</span><strong class="text-light">${escapeHtml(interestsStr)}</strong></div>
          </div>
        </div>

        <div class="row g-3">
          <div class="col-6">
            <span class="tl-metadata d-block">Status</span>
            <span class="tl-badge tl-badge--success fs-6"><i class="bi bi-check-circle me-1"></i> Accepted</span>
          </div>
          <div class="col-6">
            <span class="tl-metadata d-block">Meeting Time</span>
            <span class="fw-medium text-light">${tour.time || '09:00 AM'} (${tour.duration || 'Full Day'})</span>
          </div>
        </div>
      `;
    }

    if (modalFooter) {
      modalFooter.innerHTML = `
        <a href="${chatUrl}" class="tl-btn tl-btn--primary">
          <i class="bi bi-chat-dots me-1"></i> Chat with Traveler
        </a>
        <button type="button" class="tl-btn tl-btn--ghost" data-bs-dismiss="modal">Close</button>
      `;
    }

    const modalInstance = new bootstrap.Modal(modalEl);
    modalInstance.show();
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (document.body.dataset.page === "schedule") {
      loadSchedule();
    }
  });
})();