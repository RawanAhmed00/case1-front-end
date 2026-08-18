/**
 * TAILORA TOUR GUIDE — EARNINGS PAGE CONTROLLER
 */

(function () {
  "use strict";

  async function loadEarnings() {
    window.TL.showLoading();
    try {
      const [earningsRes, historyRes, requestsRes, chatsRes] = await Promise.all([
        window.TL.TourGuideApi.getEarnings().catch(() => ({})),
        window.TL.TourGuideApi.getEarningsHistory().catch(() => ({ data: [] })),
        window.TL.TourGuideApi.getRequests().catch(() => ({ data: [] })),
        (window.TL.ChatApi ? window.TL.ChatApi.getChats() : Promise.resolve({ data: [] })).catch(() => ({ data: [] }))
      ]);

      const data = earningsRes.data || earningsRes || {};
      
      let history = Array.isArray(historyRes.data) ? historyRes.data : Array.isArray(historyRes) ? historyRes : [];
      if (history.length === 0 && historyRes && typeof historyRes === 'object') {
        history = Object.values(historyRes).filter(val => Array.isArray(val))[0] || [];
      }

      const requestsList = Array.isArray(requestsRes.data) ? requestsRes.data : Array.isArray(requestsRes) ? requestsRes : (requestsRes.data?.data || []);
      const chatsList = Array.isArray(chatsRes.data) ? chatsRes.data : Array.isArray(chatsRes) ? chatsRes : [];
      const bookingsList = [...requestsList, ...chatsList];

      let totalPaid = 0;

      history.forEach(item => {
        const amount = parseFloat(item.amount || 0);
        const status = (item.status || '').toLowerCase();
        
        if (status === 'paid') {
          totalPaid += amount;
        }
      });

      const finalTotal = data.total_earnings !== undefined && data.total_earnings > 0 ? data.total_earnings : totalPaid;
      const finalMonth = data.month_earnings !== undefined && data.month_earnings > 0 ? data.month_earnings : totalPaid;

      // Render Metrics (تم إزالة earnPending لتوافق الـ HTML الجديد)
      document.getElementById("earnTotal").textContent = `$${parseFloat(finalTotal).toFixed(2)}`;
      document.getElementById("earnThisMonth").textContent = `$${parseFloat(finalMonth).toFixed(2)}`;
      document.getElementById("earnCompleted").textContent = history.filter(i => (i.status || '').toLowerCase() === 'paid').length;

      // Render Transaction History
      renderHistory(history, bookingsList);
    } catch (err) {
      window.TL.showToast("Failed to load earnings data: " + err.message, "error");
    } finally {
      window.TL.hideLoading();
    }
  }

  function extractUsername(item, bookingsList) {
    if (!item) return "Traveler";
    if (item.username) return item.username;
    if (item.user_name) return item.user_name;
    if (item.traveler_name) return item.traveler_name;

    if (item.booking && item.booking.user) {
      const u = item.booking.user;
      if (u.name || u.username || u.user_name) return u.name || u.username || u.user_name;
    }
    if (item.booking && (item.booking.username || item.booking.name || item.booking.user_name)) {
      return item.booking.username || item.booking.name || item.booking.user_name;
    }
    if (item.user && (item.user.username || item.user.user_name || item.user.name)) return item.user.username || item.user.user_name || item.user.name;
    if (item.traveler && (item.traveler.username || item.traveler.user_name || item.traveler.name)) return item.traveler.username || item.traveler.user_name || item.traveler.name;
    if (item.customer && (item.customer.username || item.customer.name)) return item.customer.username || item.customer.name;

    if (item.booking_id && Array.isArray(bookingsList)) {
      const matchedBooking = bookingsList.find(b => String(b.id) === String(item.booking_id) || String(b.booking_id) === String(item.booking_id));
      if (matchedBooking) {
        if (matchedBooking.username) return matchedBooking.username;
        if (matchedBooking.user_name) return matchedBooking.user_name;
        if (matchedBooking.traveler_name) return matchedBooking.traveler_name;
        if (matchedBooking.user && (matchedBooking.user.username || matchedBooking.user.name)) return matchedBooking.user.username || matchedBooking.user.name;
        if (matchedBooking.traveler && (matchedBooking.traveler.username || matchedBooking.traveler.name)) return matchedBooking.traveler.username || matchedBooking.traveler.name;
      }
    }

    return "Traveler";
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  function renderHistory(history, bookingsList) {
    const tbody = document.getElementById("earningsTableBody");
    if (!tbody) return;

    if (!history || history.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5">
            <div class="tl-empty-state">
              <i class="bi bi-receipt fs-1 text-teal"></i>
              <p class="tl-text-secondary mb-0">No transaction records found.</p>
            </div>
          </td>
        </tr>`;
      return;
    }

    tbody.innerHTML = history.map(item => {
      const statementId = item.id || '1';
      const rawDate = item.paid_at || item.created_at || item.date || item.created_date;
      const dateStr = rawDate ? String(rawDate).split('T')[0] : 'N/A';
      const travelerUsername = extractUsername(item, bookingsList);

      const amount = item.amount || '0.00';
      const statusRaw = item.status || 'Pending';
      const isPaid = statusRaw.toLowerCase() === 'paid';
      const statusText = isPaid ? 'Paid' : 'Pending';

      const travelerUserId = item.booking?.user_id || item.booking?.user?.id || item.user_id || item.user?.id;
      const chatHref = travelerUserId ? `messages.html?user_id=${travelerUserId}&name=${encodeURIComponent(travelerUsername)}` : 'messages.html';

      return `
        <tr>
          <td class="fw-semibold text-light">ST-${statementId}</td>
          <td>${dateStr}</td>
          <td>
            <div class="fw-medium text-light">${escapeHtml(travelerUsername)}</div>
          </td>
          <td class="fw-bold text-teal">$${amount}</td>
          <td>
            <span class="tl-badge ${isPaid ? "tl-badge--success" : "tl-badge--warning"}">
              <i class="bi ${isPaid ? "bi-check-circle" : "bi-hourglass-split"} me-1"></i> ${statusText}
            </span>
          </td>
          <td class="text-end">
            <a href="${chatHref}" class="tl-btn tl-btn--outline tl-btn--xs" title="Chat with Traveler">
              <i class="bi bi-chat-dots me-1"></i> Chat
            </a>
          </td>
        </tr>
      `;
    }).join("");
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (document.body.dataset.page === "earnings") {
      loadEarnings();
    }
  });
})();