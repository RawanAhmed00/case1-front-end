(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", async function () {
    const P = window.TL && window.TL.Pages ? window.TL.Pages : null;

    /*
     * ------------------------------------------------------------
     * SAFETY HELPERS
     * ------------------------------------------------------------
     */
    function display(value, fallback = "—") {
      if (P && typeof P.display === "function") {
        return P.display(value);
      }
      if (value === null || value === undefined || value === "") {
        return fallback;
      }
      return String(value);
    }

    function escape(value) {
      if (P && typeof P.escape === "function") {
        return P.escape(display(value));
      }
      return String(display(value))
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }

    function empty(title, message, icon = "bi-info-circle") {
      if (P && typeof P.empty === "function") {
        return P.empty(title, message, icon);
      }
      return `
        <div class="tl-empty">
          <div class="tl-empty__icon"><i class="bi ${icon}"></i></div>
          <div class="tl-empty__title">${escape(title)}</div>
          <p class="tl-empty__desc">${escape(message)}</p>
        </div>
      `;
    }

    function error(message) {
      if (P && typeof P.error === "function") {
        return P.error(message);
      }
      return `
        <div class="tl-empty">
          <div class="tl-empty__icon"><i class="bi bi-exclamation-triangle"></i></div>
          <div class="tl-empty__title">Unable to load data</div>
          <p class="tl-empty__desc">${escape(message || "An unexpected error occurred.")}</p>
        </div>
      `;
    }

    function getData(response) {
      if (!response) return {};
      if (typeof response === "object" && response !== null && Object.prototype.hasOwnProperty.call(response, "data")) {
        return response.data || {};
      }
      return response;
    }

    function formatDate(dateStr) {
      if (!dateStr) return "—";
      try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleString("en-US", {
          day: "numeric",
          month: "short",
          year: "numeric"
        });
      } catch (_) {
        return String(dateStr);
      }
    }

    function formatDays(trip) {
      const start = trip.start_date ? formatDate(trip.start_date) : null;
      const end = trip.end_date ? formatDate(trip.end_date) : null;
      const numDays = trip.num_days;

      if (start && end) {
        if (numDays) {
          return `<div class="fw-semibold">${numDays} days</div><div class="tl-metadata" style="font-size: 11px;">( ${start} - ${end} )</div>`;
        }
        return `<div class="fw-semibold">( ${start} - ${end} )</div>`;
      }
      if (numDays) {
        return `<div class="fw-semibold">${numDays} days</div>`;
      }
      return "—";
    }

    const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    /*
     * ------------------------------------------------------------
     * ELEMENTS
     * ------------------------------------------------------------
     */
    const totalTripsEl = document.getElementById("kpiTotalTrips");
    const tripsTodayEl = document.getElementById("kpiTripsToday");
    const tripsMonthEl = document.getElementById("kpiTripsMonth");
    const analyticsStatusEl = document.getElementById("kpiAnalyticsStatus");
    const latestTripsEl = document.getElementById("latestTrips");
    const topUsersEl = document.getElementById("topUsers");
    const analyticsPayloadEl = document.getElementById("analyticsPayloadState");

    if (totalTripsEl) totalTripsEl.textContent = "Loading…";
    if (tripsTodayEl) tripsTodayEl.textContent = "Loading…";
    if (tripsMonthEl) tripsMonthEl.textContent = "Loading…";
    if (analyticsStatusEl) analyticsStatusEl.textContent = "Loading…";

    /*
     * ------------------------------------------------------------
     * 1. LOAD TRIP STATISTICS (Today, This Month, Latest Trips, Top Users)
     * ------------------------------------------------------------
     */
    if (window.TL && window.TL.Trips && typeof window.TL.Trips.getTripStatistics === "function") {
      try {
        const tripsResult = await window.TL.Trips.getTripStatistics();
        const data = getData(tripsResult);

        // Total Trips
        if (totalTripsEl) {
          totalTripsEl.textContent = display(data.total_trips !== undefined ? data.total_trips : 0);
        }

        // Trips Today
        if (tripsTodayEl) {
          tripsTodayEl.textContent = display(data.trips_created_today !== undefined ? data.trips_created_today : 0);
        }

        // Trips This Month
        if (tripsMonthEl) {
          tripsMonthEl.textContent = display(data.trips_this_month !== undefined ? data.trips_this_month : 0);
        }

        // Latest Trips Box
        const latestTrips = Array.isArray(data.latest_trips) ? data.latest_trips : [];
        if (latestTripsEl) {
          if (latestTrips.length === 0) {
            latestTripsEl.innerHTML = empty("No latest trips", "No trips found in the database.", "bi-map");
          } else {
            const rows = latestTrips.map(trip => {
              const countryName = trip.country?.name || trip.dis_country || (trip.country_id ? `Country #${trip.country_id}` : "—");
              const travelerName = trip.user?.name || (trip.user_id ? `User #${trip.user_id}` : "—");
              const createdDate = formatDate(trip.created_at);
              const daysHtml = formatDays(trip);
              const travelStyle = trip.travel_style ? (P ? P.badge(trip.travel_style) : `<span class="tl-badge tl-badge--neutral">${escape(trip.travel_style)}</span>`) : "—";

              return `
                <tr>
                  <td><strong>#${escape(trip.id)}</strong></td>
                  <td>
                    <strong>${escape(countryName)}</strong>
                    <div class="tl-metadata">${escape(travelerName)}</div>
                  </td>
                  <td>${daysHtml}</td>
                  <td>${travelStyle}</td>
                  <td><span class="tl-metadata">${escape(createdDate)}</span></td>
                </tr>
              `;
            }).join("");

            latestTripsEl.innerHTML = `
              <div class="tl-table-wrap">
                <table class="tl-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Destination / Traveler</th>
                      <th>Days (From - To)</th>
                      <th>Style</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${rows}
                  </tbody>
                </table>
              </div>
            `;
          }
        }

        // Top Users Box (users with most created trips)
        const topUsers = Array.isArray(data.top_users) ? data.top_users : [];
        if (topUsersEl) {
          if (topUsers.length === 0) {
            topUsersEl.innerHTML = empty("No top users", "No user statistics available.", "bi-people");
          } else {
            const rows = topUsers.map((user, idx) => {
              const count = user.trips_count !== undefined ? user.trips_count : (user.trips ? user.trips.length : 0);
              const rankBadge = idx === 0 ? "tl-badge--warning" : (idx === 1 ? "tl-badge--info" : "tl-badge--neutral");

              return `
                <tr>
                  <td>
                    <span class="tl-badge ${rankBadge}">#${idx + 1}</span>
                  </td>
                  <td>
                    <strong>${escape(user.name || "User #" + user.id)}</strong>
                    <div class="tl-metadata">${escape(user.email || "—")}</div>
                  </td>
                  <td class="text-end">
                    <span class="tl-badge tl-badge--success font-monospace">
                      <i class="bi bi-map me-1"></i> ${escape(count)} ${count === 1 ? 'trip' : 'trips'}
                    </span>
                  </td>
                </tr>
              `;
            }).join("");

            topUsersEl.innerHTML = `
              <div class="tl-table-wrap">
                <table class="tl-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Traveler</th>
                      <th class="text-end">Trips Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${rows}
                  </tbody>
                </table>
              </div>
            `;
          }
        }
      } catch (tripError) {
        console.error("Tailora trip statistics error:", tripError);
        if (totalTripsEl) totalTripsEl.textContent = "—";
        if (tripsTodayEl) tripsTodayEl.textContent = "—";
        if (tripsMonthEl) tripsMonthEl.textContent = "—";
        if (latestTripsEl) latestTripsEl.innerHTML = error(tripError?.message || "Failed to load trip statistics.");
        if (topUsersEl) topUsersEl.innerHTML = error(tripError?.message || "Failed to load top users.");
      }
    }

    /*
     * ------------------------------------------------------------
     * 2. LOAD REAL DASHBOARD ANALYTICS (Real Database Data)
     * ------------------------------------------------------------
     */
    if (window.TL && window.TL.Analytics && typeof window.TL.Analytics.getDashboardAnalytics === "function") {
      try {
        const analyticsResult = await window.TL.Analytics.getDashboardAnalytics();
        const analyticsData = getData(analyticsResult);

        if (analyticsStatusEl) {
          analyticsStatusEl.textContent = "Live Active";
          analyticsStatusEl.style.color = "var(--tl-success, #10b981)";
        }

        if (analyticsPayloadEl) {
          const stats = analyticsData.statistics || {};
          const revenue = Number(analyticsData.total_revenue || 0);
          const totalBookings = Number(analyticsData.total_bookings || 0);
          const confirmedBookings = Number(analyticsData.confirmed_bookings || 0);
          const cancelledBookings = Number(analyticsData.cancelled_bookings || 0);
          const pendingBookings = Number(analyticsData.pending_bookings || 0);
          const totalUsers = Number(analyticsData.total_users || 0);
          const tourGuides = Number(analyticsData.total_tour_guides || 0);
          const totalTrips = Number(analyticsData.total_trips || stats.total_trips || 0);
          const completedTrips = Number(stats.completed_trips || 0);
          const upcomingTrips = Number(stats.upcoming_trips || 0);
          const totalHotels = Number(analyticsData.total_hotels || 0);
          const totalRestaurants = Number(analyticsData.total_restaurants || 0);

          const popular = Array.isArray(analyticsData.most_popular_destinations) ? analyticsData.most_popular_destinations : [];
          const monthlyTrips = Array.isArray(analyticsData.monthly_trips) ? analyticsData.monthly_trips : [];
          const userGrowth = Array.isArray(analyticsData.user_growth) ? analyticsData.user_growth : [];
          const monthlyRevenue = Array.isArray(analyticsData.monthly_revenue) ? analyticsData.monthly_revenue : [];

          // Format Popular Destinations
          let popularHtml = "";
          if (popular.length > 0) {
            popularHtml = `
              <div class="mt-4">
                <div class="d-flex align-items-center justify-content-between mb-3">
                  <h4 class="tl-section-title mb-0" style="font-size: 15px;">
                    <i class="bi bi-geo-alt me-1 text-primary"></i> Most Popular Destinations
                  </h4>
                  <span class="tl-metadata">Based on live database trips</span>
                </div>
                <div class="row g-3">
                  ${popular.map((p) => {
                    const countryName = p.country || "Unknown";
                    const tripsCount = Number(p.total_trips || p.total_bookings || 0);
                    return `
                      <div class="col-md-4 col-sm-6">
                        <div class="tl-card p-3 d-flex align-items-center justify-content-between" style="background: var(--tl-bg-elevated); border: 1px solid var(--tl-border);">
                          <div>
                            <div class="fw-bold">${escape(countryName)}</div>
                            <div class="tl-metadata" style="font-size: 11px;">Destination</div>
                          </div>
                          <span class="tl-badge tl-badge--info font-monospace">
                            ${escape(tripsCount)} ${tripsCount === 1 ? 'trip' : 'trips'}
                          </span>
                        </div>
                      </div>
                    `;
                  }).join("")}
                </div>
              </div>
            `;
          }

          // Format Monthly Breakdown Table (if available)
          let monthlyActivityHtml = "";
          if (monthlyTrips.length > 0 || userGrowth.length > 0 || monthlyRevenue.length > 0) {
            const monthsMap = {};
            for (let m = 1; m <= 12; m++) {
              const key = String(m).padStart(2, "0");
              monthsMap[key] = { monthName: MONTH_NAMES[m - 1], trips: 0, users: 0, revenue: 0 };
            }
            monthlyTrips.forEach(item => {
              const k = String(item.month).padStart(2, "0");
              if (monthsMap[k]) monthsMap[k].trips = Number(item.total || 0);
            });
            userGrowth.forEach(item => {
              const k = String(item.month).padStart(2, "0");
              if (monthsMap[k]) monthsMap[k].users = Number(item.total || 0);
            });
            monthlyRevenue.forEach(item => {
              const k = String(item.month).padStart(2, "0");
              if (monthsMap[k]) monthsMap[k].revenue = Number(item.revenue || 0);
            });

            const activeMonths = Object.values(monthsMap).filter(m => m.trips > 0 || m.users > 0 || m.revenue > 0);

            if (activeMonths.length > 0) {
              monthlyActivityHtml = `
                <div class="mt-4">
                  <div class="d-flex align-items-center justify-content-between mb-3">
                    <h4 class="tl-section-title mb-0" style="font-size: 15px;">
                      <i class="bi bi-calendar-event me-1 text-primary"></i> ${new Date().getFullYear()} Monthly Activity (Database)
                    </h4>
                    <span class="tl-metadata">Live MySQL Date Aggregations</span>
                  </div>
                  <div class="tl-table-wrap">
                    <table class="tl-table">
                      <thead>
                        <tr>
                          <th>Month</th>
                          <th>New Trips</th>
                          <th>New Users</th>
                          <th class="text-end">Confirmed Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${activeMonths.map(m => `
                          <tr>
                            <td><strong>${escape(m.monthName)}</strong></td>
                            <td><span class="tl-badge tl-badge--neutral">${escape(m.trips)}</span></td>
                            <td><span class="tl-badge tl-badge--info">${escape(m.users)}</span></td>
                            <td class="text-end font-monospace text-success"><strong>$${escape(m.revenue.toLocaleString())}</strong></td>
                          </tr>
                        `).join("")}
                      </tbody>
                    </table>
                  </div>
                </div>
              `;
            }
          }

          analyticsPayloadEl.innerHTML = `
            <!-- Real Operational KPI Metrics -->
            <div class="row g-3">
              <div class="col-lg-3 col-md-6">
                <div class="tl-card p-3 h-100" style="background: var(--tl-bg-elevated); border: 1px solid var(--tl-border);">
                  <div class="d-flex justify-content-between align-items-center">
                    <span class="tl-label">Confirmed Revenue</span>
                    <i class="bi bi-cash-stack text-success fs-5"></i>
                  </div>
                  <div class="fs-4 fw-bold mt-2 text-success font-monospace">$${escape(revenue.toLocaleString())}</div>
                  <div class="tl-metadata mt-1">From confirmed bookings</div>
                </div>
              </div>

              <div class="col-lg-3 col-md-6">
                <div class="tl-card p-3 h-100" style="background: var(--tl-bg-elevated); border: 1px solid var(--tl-border);">
                  <div class="d-flex justify-content-between align-items-center">
                    <span class="tl-label">Total Bookings</span>
                    <i class="bi bi-bookmark-check text-primary fs-5"></i>
                  </div>
                  <div class="fs-4 fw-bold mt-2 font-monospace">${escape(totalBookings)}</div>
                  <div class="d-flex gap-2 mt-1">
                    <span class="tl-badge tl-badge--success" style="font-size: 10px;">${escape(confirmedBookings)} Confirmed</span>
                    <span class="tl-badge tl-badge--danger" style="font-size: 10px;">${escape(cancelledBookings)} Cancelled</span>
                  </div>
                </div>
              </div>

              <div class="col-lg-3 col-md-6">
                <div class="tl-card p-3 h-100" style="background: var(--tl-bg-elevated); border: 1px solid var(--tl-border);">
                  <div class="d-flex justify-content-between align-items-center">
                    <span class="tl-label">Platform Accounts</span>
                    <i class="bi bi-people text-info fs-5"></i>
                  </div>
                  <div class="fs-4 fw-bold mt-2 font-monospace">${escape(totalUsers)}</div>
                  <div class="tl-metadata mt-1">${escape(tourGuides)} Tour Guides registered</div>
                </div>
              </div>

              <div class="col-lg-3 col-md-6">
                <div class="tl-card p-3 h-100" style="background: var(--tl-bg-elevated); border: 1px solid var(--tl-border);">
                  <div class="d-flex justify-content-between align-items-center">
                    <span class="tl-label">Catalog Resources</span>
                    <i class="bi bi-building text-warning fs-5"></i>
                  </div>
                  <div class="fs-4 fw-bold mt-2 font-monospace">${escape(totalHotels + totalRestaurants)}</div>
                  <div class="tl-metadata mt-1">${escape(totalHotels)} Hotels · ${escape(totalRestaurants)} Restaurants</div>
                </div>
              </div>
            </div>

            ${popularHtml}
            ${monthlyActivityHtml}
          `;
        }
      } catch (analyticsError) {
        console.error("Tailora analytics error:", analyticsError);
        if (analyticsStatusEl) {
          analyticsStatusEl.textContent = "Error";
          analyticsStatusEl.style.color = "var(--tl-danger, #ef4444)";
        }
        if (analyticsPayloadEl) {
          analyticsPayloadEl.innerHTML = error(analyticsError?.message || "Analytics endpoint returned an error.");
        }
      }
    } else {
      if (analyticsStatusEl) analyticsStatusEl.textContent = "Unavailable";
      if (analyticsPayloadEl) analyticsPayloadEl.innerHTML = error("Analytics API module is not available.");
    }
  });
})();