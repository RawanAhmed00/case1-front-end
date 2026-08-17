/**
 * TAILORA TOUR GUIDE — REVIEWS PAGE CONTROLLER
 * Rating score breakdown and traveler reviews management.
 */

(function () {
  "use strict";

  async function loadReviews() {
    window.TL.showLoading();
    try {
      // جلب التقييمات، الجدول، والطلبات لاستخراج أسماء المستخدمين الحقيقية
      const [reviewsRes, scheduleRes, requestsRes, chatsRes] = await Promise.all([
        window.TL.TourGuideApi.getReviews().catch(() => ({ data: [] })),
        window.TL.TourGuideApi.getSchedule().catch(() => ({ data: [] })),
        window.TL.TourGuideApi.getRequests().catch(() => ({ data: [] })),
        (window.TL.ChatApi ? window.TL.ChatApi.getChats() : Promise.resolve({ data: [] })).catch(() => ({ data: [] }))
      ]);

      const reviews = Array.isArray(reviewsRes.data) ? reviewsRes.data : Array.isArray(reviewsRes) ? reviewsRes : [];
      const scheduleList = Array.isArray(scheduleRes.data) ? scheduleRes.data : Array.isArray(scheduleRes) ? scheduleRes : [];
      const requestsList = Array.isArray(requestsRes.data) ? requestsRes.data : Array.isArray(requestsRes) ? requestsRes : (requestsRes.data?.data || []);
      const chatsList = Array.isArray(chatsRes.data) ? chatsRes.data : Array.isArray(chatsRes) ? chatsRes : [];

      // بناء خريطة لربط كل user_id باسمه من البيانات المتاحة
      const userNamesMap = {};

      scheduleList.forEach(item => {
        const uid = item.user_id || item.user?.id;
        const uname = item.user?.name || item.user_name || item.traveler_name || item.name;
        if (uid && uname) {
          userNamesMap[String(uid)] = uname;
        }
      });

      requestsList.forEach(item => {
        const uid = item.user_id || item.traveler_id || item.user?.id;
        const uname = item.username || item.user_name || item.user?.name || item.traveler_name || item.name;
        if (uid && uname) {
          userNamesMap[String(uid)] = uname;
        }
      });

      chatsList.forEach(item => {
        const partner = item.partner || item.user || item.traveler || {};
        const uid = partner.id || item.user_id || item.traveler_id || item.sender_id || item.receiver_id;
        const uname = partner.name || partner.username || item.name || item.traveler_name;
        if (uid && uname) {
          userNamesMap[String(uid)] = uname;
        }
      });

      // حساب التقييم العام وتوزيع النجوم ديناميكياً
      let totalScore = 0;
      let ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      const totalReviews = reviews.length;

      reviews.forEach(rev => {
        const rating = parseInt(rev.rating) || 0;
        if (rating >= 1 && rating <= 5) {
          totalScore += rating;
          ratingCounts[rating]++;
        }
      });

      const averageRating = totalReviews > 0 ? (totalScore / totalReviews).toFixed(1) : "0.0";

      // تحديث واجهة التقييم العام
      const avgScoreEl = document.getElementById("avgRatingScore");
      const totalReviewsEl = document.getElementById("totalReviewsCount");
      if (avgScoreEl) avgScoreEl.textContent = averageRating;
      if (totalReviewsEl) totalReviewsEl.textContent = `${totalReviews} verified traveler reviews`;

      // تحديث شريط التقييمات (Rating Breakdown)
      updateRatingBreakdown(ratingCounts, totalReviews);

      // عرض التقييمات مع الأسماء المستخرجة
      renderReviewList(reviews, userNamesMap, scheduleList);
    } catch (err) {
      window.TL.showToast("Failed to load reviews: " + err.message, "error");
    } finally {
      window.TL.hideLoading();
    }
  }

  function updateRatingBreakdown(counts, total) {
    const container = document.getElementById("ratingBreakdownList");
    if (!container) return;

    let html = "";
    for (let i = 5; i >= 1; i--) {
      const count = counts[i] || 0;
      const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
      const label = `${i} Star${i > 1 ? 's' : ''}`;

      html += `
        <div class="d-flex align-items-center gap-3 mb-2">
          <span class="tl-metadata fw-semibold" style="width: 55px;">${label}</span>
          <div class="progress flex-grow-1 border border-secondary border-opacity-25" style="height: 8px; background-color: rgba(125,125,125,0.15); border-radius: 4px; overflow: hidden;">
            <div class="progress-bar bg-warning" role="progressbar" style="width: ${percentage}%; transition: width 0.4s ease;" aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100"></div>
          </div>
          <span class="tl-metadata fw-bold text-end" style="width: 32px;">${count}</span>
        </div>`;
    }
    container.innerHTML = html;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  function renderStars(num) {
    let html = "";
    for (let i = 1; i <= 5; i++) {
      if (i <= num) html += '<i class="bi bi-star-fill text-warning me-1"></i>';
      else html += '<i class="bi bi-star text-secondary me-1"></i>';
    }
    return html;
  }

  function renderReviewList(reviews, userNamesMap, scheduleList) {
    const list = document.getElementById("reviewsList");
    if (!list) return;

    if (reviews.length === 0) {
      list.innerHTML = `
        <div class="tl-card tl-empty-state">
          <i class="bi bi-star fs-1 text-teal"></i>
          <p class="tl-text-secondary mb-0">No traveler reviews received yet.</p>
        </div>`;
      return;
    }

    list.innerHTML = reviews.map(rev => {
      let travelerName = rev.username || rev.user_name || rev.user?.username || rev.user?.name || rev.author || rev.traveler_name || rev.traveler?.name;

      if (!travelerName && rev.user_id) {
        travelerName = userNamesMap[rev.user_id];
      }

      if (!travelerName && scheduleList.length > 0) {
        const matchedTrip = scheduleList.find(s => s.id == rev.trip_id || s.trip_id == rev.trip_id);
        if (matchedTrip) {
          travelerName = matchedTrip.user?.username || matchedTrip.user?.name || matchedTrip.user_name || matchedTrip.traveler_name || matchedTrip.username;
        }
      }

      if (!travelerName) {
        travelerName = "Verified Traveler";
      }

      const travelerUserId = rev.user_id || rev.user?.id || (scheduleList.find(s => s.id == rev.trip_id)?.user_id);
      const chatHref = travelerUserId ? `messages.html?user_id=${travelerUserId}&name=${encodeURIComponent(travelerName)}` : 'messages.html';

      const initials = travelerName.substring(0, 2).toUpperCase();
      let dateRaw = rev.created_at || rev.date || rev.updated_at;
      let dateStr = "Recently";
      if (dateRaw) {
        const d = new Date(dateRaw);
        if (!isNaN(d.getTime())) {
          dateStr = d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
        } else {
          dateStr = String(dateRaw).split("T")[0];
        }
      }

      return `
        <div class="tl-card tl-card--hover mb-3">
          <div class="d-flex justify-content-between align-items-start gap-3 mb-3">
            <div class="d-flex align-items-center gap-3">
              <div class="tl-avatar">${initials}</div>
              <div>
                <h6 class="mb-0 text-light">${escapeHtml(travelerName)}</h6>
                <div class="tl-metadata"><i class="bi bi-calendar-event text-teal me-1"></i> ${escapeHtml(dateStr)}</div>
              </div>
            </div>
            <div class="d-flex align-items-center gap-3">
              <div>${renderStars(rev.rating)}</div>
              <a href="${chatHref}" class="tl-btn tl-btn--outline tl-btn--sm">
                <i class="bi bi-chat-dots me-1"></i> Chat
              </a>
            </div>
          </div>

          <p class="tl-body text-secondary mb-0">${escapeHtml(rev.comment || 'No comment provided.')}</p>
        </div>
      `;
    }).join("");
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (document.body.dataset.page === "reviews") {
      loadReviews();
    }
  });
})();