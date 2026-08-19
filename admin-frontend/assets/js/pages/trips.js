(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    const P = TL.Pages;
    const state = document.getElementById("tripsState");

    let currentPage = 1;
    const perPage = 10;
    let currentTripsList = [];

    function renderTable(rows, meta) {
      if (!rows) {
        state.innerHTML = P.empty(
          "Trip data unavailable",
          "The API did not return trip records.",
          "bi-map"
        );
        return;
      }

      if (!rows.length) {
        state.innerHTML = P.empty(
          "No trips available",
          "No trip itineraries generated yet.",
          "bi-map"
        );
        return;
      }

      const tableHtml = `
        <div class="tl-table-wrap">
          <table class="tl-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Traveler</th>
                <th>Destination</th>
                <th>Travel Style</th>
                <th>Days</th>
                <th>Budget</th>
                <th>Travelers</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map(t => `
                <tr>
                  <td><strong>#${P.escape(P.display(t.id))}</strong></td>
                  <td>
                    <strong>${P.escape(t.user?.name ? t.user.name : (t.user_id ? `User #${t.user_id}` : "—"))}</strong>
                    ${t.user?.email ? `<div class="tl-metadata">${P.escape(t.user.email)}</div>` : ''}
                  </td>
                  <td>${P.escape(P.display(t.dis_country || "—"))}</td>
                  <td>${P.badge(t.travel_style || "Standard")}</td>
                  <td>${P.escape(P.display(t.num_days))}</td>
                  <td>${P.escape(P.display(t.budget ? `$${t.budget}` : "—"))}</td>
                  <td>${P.escape(P.display(t.number_of_travelers || 1))}</td>
                  <td>${P.escape(P.date(t.created_at || t.created))}</td>
                  <td>
                    <div class="tl-table-actions">
                      <button class="tl-btn tl-btn--outline tl-btn--sm" data-trip-edit="${P.escape(t.id)}" title="Edit Trip">
                        <i class="bi bi-pencil"></i>
                      </button>
                      <button class="tl-btn tl-btn--danger tl-btn--sm" data-trip-delete="${P.escape(t.id)}" title="Delete Trip">
                        <i class="bi bi-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      `;

      const paginationHtml = P.buildPagination(meta, "data-page-target", "trips", currentPage);
      state.innerHTML = tableHtml + paginationHtml;
    }

    async function load(page = 1) {
      currentPage = page;
      state.innerHTML = '<div class="tl-inline-loader"><div class="tl-spinner"></div></div>';

      try {
        const [listRes, statsRes] = await Promise.allSettled([
          TL.Trips.getTrips({ page: currentPage, per_page: perPage }),
          TL.Trips.getTripStatistics(),
        ]);

        // Populate User dropdown for create/edit forms
        (async function populateUsers() {
          try {
            const usersRes = await TL.Users.getUsers({ per_page: 1000 });
            const users = P.list(usersRes) || P.data(usersRes) || [];
            const userSelect = document.getElementById("trip_user_id");
            if (userSelect) {
              const opts = ["<option value=''>Select user</option>"];
              users.forEach(u => {
                const id = u && (u.id !== undefined ? String(u.id) : "");
                const label = u && (u.name || u.email) ? `${P.escape(u.name || `User #${id}`)}${u.email ? ' — ' + P.escape(u.email) : ''}` : `User #${id}`;
                opts.push(`<option value="${id}">${label}</option>`);
              });
              userSelect.innerHTML = opts.join("");
            }
          } catch (e) {
            // silently ignore — dropdown will remain with placeholder
            console.warn("Failed to load users for trip form:", e && e.message ? e.message : e);
          }
        })();

        // Process Stats
        if (statsRes.status === "fulfilled") {
          const d = P.data(statsRes.value) || {};
          const totalEl = document.getElementById("tripTotal");
          const todayEl = document.getElementById("tripToday");
          const monthEl = document.getElementById("tripMonth");
          if (totalEl) totalEl.textContent = P.display(d.total_trips);
          if (todayEl) todayEl.textContent = P.display(d.trips_created_today);
          if (monthEl) monthEl.textContent = P.display(d.trips_this_month);
        }

        // Process Trips List
        if (listRes.status === "fulfilled") {
          const { rows, meta } = P.extractPagination(listRes.value, currentPage, perPage);

          const metaEl = document.getElementById("tripMeta");
          if (metaEl) {
            metaEl.textContent = meta ? `Page ${meta.current_page || currentPage} of ${meta.last_page || 1}` : `Page ${currentPage}`;
          }

          // Cache current list for reliable editing
          currentTripsList = rows || [];

          renderTable(rows, meta);
        } else {
          state.innerHTML = P.error(listRes.reason?.message || "Failed to load trips.");
        }
      } catch (e) {
        state.innerHTML = P.error(e.message || "Failed to load trips.");
      }
    }

    // Refresh Button
    const refreshBtn = document.getElementById("tripsRefresh");
    if (refreshBtn) refreshBtn.addEventListener("click", () => load(currentPage));

    // Edit Trip Form Submit
    const editForm = document.getElementById("tripEditForm");
    if (editForm) {
      editForm.addEventListener("submit", async e => {
        e.preventDefault();
        const f = e.currentTarget;
        P.clearErrors(f);
        const id = document.getElementById("trip_id").value;
        const data = {
          num_days: f.trip_num_days.value,
          travel_style: f.trip_travel_style.value,
          dis_country: f.trip_dis_country.value,
          budget: f.trip_budget.value,
          interst: f.trip_interst.value,
          number_of_travelers: f.trip_number_of_travelers.value,
          user_id: f.trip_user_id.value,
        };

        const btn = f.querySelector("button[type=submit]");
        P.setBusy(btn, true);

        try {
          await TL.Trips.updateTrip(id, data);
          TL.showToast("Trip updated successfully.", "success");
          P.modal("tripEditModal")?.hide();
          load(currentPage);
        } catch (err) {
          if (err instanceof TL.Api.ApiValidationError) P.showValidation(f, err.errors);
          TL.showToast(err.message || "Failed to update trip.", "error");
        } finally {
          P.setBusy(btn, false);
        }
      });
    }

    // Event Delegation: View, Edit, Delete, Pagination
    state.addEventListener("click", async e => {
      // Pagination clicks
      const pageTargetBtn = e.target.closest("[data-page-target]");
      if (pageTargetBtn && !pageTargetBtn.disabled) {
        const targetPage = parseInt(pageTargetBtn.dataset.pageTarget, 10);
        if (!isNaN(targetPage) && targetPage > 0 && targetPage !== currentPage) {
          load(targetPage);
        }
        return;
      }

      

      // Edit
      const editBtn = e.target.closest("[data-trip-edit]");
      if (editBtn) {
        const id = editBtn.dataset.tripEdit;
        try {
          const trip = currentTripsList.find(x => String(x.id) === String(id));
          if (!trip) {
            TL.showToast("Trip details not found.", "warning");
            return;
          }

          document.getElementById("trip_id").value = trip.id;
          document.getElementById("trip_num_days").value = trip.num_days ?? "";
          document.getElementById("trip_travel_style").value = trip.travel_style ?? "";
          document.getElementById("trip_dis_country").value = trip.dis_country ?? "";
          document.getElementById("trip_budget").value = trip.budget ?? "";
          document.getElementById("trip_interst").value = trip.interests ?? trip.interst ?? "";
          document.getElementById("trip_number_of_travelers").value = trip.number_of_travelers ?? "";
          document.getElementById("trip_user_id").value = trip.user?.id ?? trip.user_id ?? "";
          P.modal("tripEditModal")?.show();
        } catch (err) {
          TL.showToast(err.message, "error");
        }
        return;
      }

      // Delete
      const delBtn = e.target.closest("[data-trip-delete]");
      if (delBtn) {
        const id = delBtn.dataset.tripDelete;
        if (P.confirm("Are you sure you want to delete this trip? This action cannot be undone.")) {
          try {
            await TL.Trips.deleteTrip(id);
            TL.showToast("Trip deleted successfully.", "success");
            load(currentPage);
          } catch (err) {
            TL.showToast(err.message, "error");
          }
        }
        return;
      }
    });

    // Initial Load
    load(1);
  });
})();