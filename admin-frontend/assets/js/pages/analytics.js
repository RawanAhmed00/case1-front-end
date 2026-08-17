(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    const P = TL.Pages;

    function getEl(id1, id2) {
      return document.getElementById(id1) || document.getElementById(id2);
    }

    async function load() {
      const totalEl = getEl("statTotalTrips", "aTotal");
      const todayEl = getEl("statTripsToday", "aToday");
      const monthEl = getEl("statTripsMonth", "aMonth");
      const statusEl = getEl("statAnalyticsStatus", "aStatus");

      const latestEl = getEl("analyticsLatestTrips", "aLatest");
      const topEl = getEl("analyticsTopUsers", "aTop");
      const payloadEl = getEl("analyticsPayloadState", "aPayload");

      if (totalEl) totalEl.textContent = "Loading…";
      if (todayEl) todayEl.textContent = "Loading…";
      if (monthEl) monthEl.textContent = "Loading…";
      if (statusEl) statusEl.textContent = "Loading…";

      const loader = '<div class="tl-inline-loader"><div class="tl-spinner"></div></div>';
      if (latestEl) latestEl.innerHTML = loader;
      if (topEl) topEl.innerHTML = loader;
      if (payloadEl) payloadEl.innerHTML = loader;

      const [stats, analytics] = await Promise.allSettled([
        TL.Trips.getTripStatistics(),
        TL.Analytics.getDashboardAnalytics(),
      ]);

      if (stats.status === "fulfilled") {
        const d = P.data(stats.value) || {};
        if (totalEl) totalEl.textContent = P.display(d.total_trips);
        if (todayEl) todayEl.textContent = P.display(d.trips_created_today);
        if (monthEl) monthEl.textContent = P.display(d.trips_this_month);

        const latest = Array.isArray(d.latest_trips) ? d.latest_trips : [];
        const top = Array.isArray(d.top_users) ? d.top_users : [];

        if (latestEl) {
          latestEl.innerHTML = latest.length
            ? `
              <div class="tl-table-wrap">
                <table class="tl-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Destination</th>
                      <th>Days</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${latest.map((t) => `
                      <tr>
                        <td><strong>#${P.escape(P.display(t.id))}</strong></td>
                        <td>${P.escape(P.display(t.dis_country))}</td>
                        <td>${P.escape(P.display(t.num_days))}</td>
                        <td>${P.escape(P.display(t.created_at))}</td>
                      </tr>
                    `).join("")}
                  </tbody>
                </table>
              </div>
            `
            : P.empty("No latest trips", "No latest_trips records were returned.", "bi-map");
        }

        if (topEl) {
          topEl.innerHTML = top.length
            ? `
              <div class="tl-table-wrap">
                <table class="tl-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${top.map((u) => `
                      <tr>
                        <td><strong>#${P.escape(P.display(u.id))}</strong></td>
                        <td>${P.escape(P.display(u.name))}</td>
                        <td>${P.escape(P.display(u.email))}</td>
                      </tr>
                    `).join("")}
                  </tbody>
                </table>
              </div>
            `
            : P.empty("No top users", "No top_users records were returned.", "bi-people");
        }
      } else {
        if (totalEl) totalEl.textContent = "Data unavailable";
        if (todayEl) todayEl.textContent = "Data unavailable";
        if (monthEl) monthEl.textContent = "Data unavailable";
        if (latestEl) latestEl.innerHTML = P.error(stats.reason?.message);
        if (topEl) topEl.innerHTML = P.error(stats.reason?.message);
      }

      if (analytics.status === "fulfilled") {
        const v = P.data(analytics.value);
        if (statusEl) statusEl.textContent = "Online / 200 OK";

        if (v && typeof v === "object" && !Array.isArray(v)) {
          const entries = Object.entries(v);
          if (payloadEl) {
            payloadEl.innerHTML = entries.length
              ? `
                <div class="tl-table-wrap">
                  <table class="tl-table">
                    <thead>
                      <tr>
                        <th>Metric Field</th>
                        <th>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${entries.map(([k, val]) => `
                        <tr>
                          <td><strong>${P.escape(k)}</strong></td>
                          <td>${P.escape(P.display(val))}</td>
                        </tr>
                      `).join("")}
                    </tbody>
                  </table>
                </div>
              `
              : P.empty("Empty analytics object", "The endpoint returned no metrics.", "bi-bar-chart");
          }
        } else {
          if (payloadEl) {
            payloadEl.innerHTML = `
              <div class="p-3">
                <pre class="tl-code-block">${P.escape(JSON.stringify(v, null, 2))}</pre>
              </div>
            `;
          }
        }
      } else {
        if (statusEl) statusEl.textContent = "Unavailable";
        if (payloadEl) payloadEl.innerHTML = P.error(analytics.reason?.message);
      }
    }

    const refreshBtn = document.getElementById("analyticsRefresh");
    if (refreshBtn) refreshBtn.addEventListener("click", load);

    load();
  });
})();