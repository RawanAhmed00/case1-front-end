(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    const P = TL.Pages;
    const state = document.getElementById("bookingsState");

    function getBookingIdInput() {
      return document.getElementById("booking_id") || document.getElementById("booking_action_id");
    }

    async function load() {
      if (!state) return;
      state.innerHTML = `
        <div class="tl-inline-loader">
          <div class="tl-spinner"></div>
        </div>
      `;

      try {
        const r = await TL.Bookings.getBookings();
        const rows = P.list(r);

        if (!rows) {
          state.innerHTML = P.empty(
            "Booking data unavailable",
            "The documented booking data field is rendered when the runtime response contains a JSON array.",
            "bi-calendar-x"
          );
          return;
        }

        if (!rows.length) {
          state.innerHTML = P.empty(
            "No bookings available",
            "The API returned an empty booking collection.",
            "bi-calendar-x"
          );
          return;
        }

        state.innerHTML = `
          <div class="tl-table-wrap">
            <table class="tl-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${rows.map(function (b) {
                  return `
                    <tr>
                      <td><strong>#${P.escape(P.display(b.id))}</strong></td>
                      <td>${P.badge(b.status)}</td>
                      <td>${P.escape(P.display(b.created_at))}</td>
                      <td>
                        <button class="tl-btn tl-btn--outline tl-btn--sm" data-booking-select="${P.escape(b.id)}">
                          <i class="bi bi-arrow-down-short"></i> Use ID
                        </button>
                      </td>
                    </tr>
                  `;
                }).join("")}
              </tbody>
            </table>
          </div>
        `;
      } catch (e) {
        state.innerHTML = P.error(e.message);
      }
    }

    const refreshBtn = document.getElementById("bookingsRefresh");
    if (refreshBtn) refreshBtn.addEventListener("click", load);

    if (state) {
      state.addEventListener("click", function (e) {
        const b = e.target.closest("[data-booking-select]");
        if (b) {
          const input = getBookingIdInput();
          if (input) {
            input.value = b.dataset.bookingSelect;
            input.focus();
            TL.showToast(`Selected Booking #${b.dataset.bookingSelect}`, "info");
          }
        }
      });
    }

    

    const updateBtn = document.getElementById("bookingUpdateBtn");
    if (updateBtn) {
      updateBtn.addEventListener("click", async function () {
        const input = getBookingIdInput();
        const id = input ? input.value : "";
        const statusEl = document.getElementById("booking_status");
        const status = statusEl ? statusEl.value : "";

        if (!id || !status) return TL.showToast("Enter both booking ID and status.", "warning");

        try {
          await TL.Bookings.updateBooking(id, { status });
          TL.showToast("Booking updated successfully.", "success");
          load();
        } catch (e) {
          TL.showToast(e.message, "error");
        }
      });
    }

    const deleteBtn = document.getElementById("bookingDeleteBtn");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", async function () {
        const input = getBookingIdInput();
        const id = input ? input.value : "";
        if (!id) return TL.showToast("Enter a booking ID.", "warning");
        if (!P.confirm("Delete this booking? This cannot be undone.")) return;

        try {
          await TL.Bookings.deleteBooking(id);
          TL.showToast("Booking deleted.", "success");
          if (input) input.value = "";
          load();
        } catch (e) {
          TL.showToast(e.message, "error");
        }
      });
    }

    load();
  });
})();