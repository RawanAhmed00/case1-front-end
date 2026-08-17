(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    const P = TL.Pages;
    const state = document.getElementById("messagesState");

    async function load() {
      if (!state) return;
      state.innerHTML = `
        <div class="tl-inline-loader">
          <div class="tl-spinner"></div>
        </div>
      `;

      try {
        const r = await TL.Messages.getContactMessages();
        const rows = P.list(r);

        if (!rows) {
          state.innerHTML = P.empty(
            "Message data unavailable",
            "The API response did not expose the contact messages collection.",
            "bi-envelope-x"
          );
          return;
        }

        if (!rows.length) {
          state.innerHTML = P.empty(
            "No contact messages",
            "The API returned an empty message list.",
            "bi-envelope"
          );
          return;
        }

        state.innerHTML = `
          <div class="tl-table-wrap">
            <table class="tl-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User ID</th>
                  <th>Message</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${rows.map(function (m) {
          return `
                    <tr>
                      <td><strong>#${P.escape(P.display(m.id))}</strong></td>
                      <td>${P.escape(P.display(m.user_id))}</td>
                      <td style="max-width: 320px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        ${P.escape(P.display(m.message))}
                      </td>
                      <td>${P.badge(m.status)}</td>
                      <td>${P.escape(P.display(m.created_at))}</td>
                      <td>
                        <div class="tl-table-actions">
                          <button
                            type="button"
                            class="tl-btn tl-btn--outline tl-btn--sm"
                            data-message-view="${P.escape(m.id)}"
                            title="View Message"
                          >
                            <i class="bi bi-eye"></i> View
                          </button>
                          <button
                            type="button"
                            class="tl-btn tl-btn--danger tl-btn--sm"
                            data-message-delete="${P.escape(m.id)}"
                            title="Delete Message"
                          >
                            <i class="bi bi-trash"></i>
                          </button>
                        </div>
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

    const refreshBtn = document.getElementById("messagesRefresh");
    if (refreshBtn) refreshBtn.addEventListener("click", load);

    if (state) {
      state.addEventListener("click", async function (e) {
        const v = e.target.closest("[data-message-view]");
        const d = e.target.closest("[data-message-delete]");

        if (v) {
          const id = v.dataset.messageView;
          try {
            const r = await TL.Messages.getContactMessage(id);
            const m = P.data(r) || {};

            const idInput = document.getElementById("msg_id") || document.getElementById("message_update_id");
            const statusInput = document.getElementById("msg_status") || document.getElementById("message_status");
            const details = document.getElementById("messageDetails");

            if (idInput) idInput.value = m.id || id;
            if (statusInput) statusInput.value = m.status ?? "";

            if (details) {
              details.textContent = JSON.stringify(m, null, 2);
            }

            P.modal("messageViewModal")?.show();
          } catch (err) {
            TL.showToast(err.message, "error");
          }
        }

        if (d) {
          const id = d.dataset.messageDelete;
          if (!id) return;
          if (!P.confirm("Delete this contact message? This cannot be undone.")) return;

          try {
            await TL.Messages.deleteContactMessage(id);
            TL.showToast("Message deleted.", "success");
            load();
          } catch (err) {
            TL.showToast(err.message, "error");
          }
        }
      });
    }

    const form = document.getElementById("messageStatusForm") || document.getElementById("messageUpdateForm");
    if (form) {
      form.addEventListener("submit", async function (e) {
        e.preventDefault();
        const idInput = document.getElementById("msg_id") || document.getElementById("message_update_id");
        const statusInput = document.getElementById("msg_status") || document.getElementById("message_status");

        const id = idInput ? idInput.value : "";
        const status = statusInput ? statusInput.value : "";

        if (!id || !status) return TL.showToast("Enter a status.", "warning");

        try {
          await TL.Messages.updateContactMessage(id, { status });
          TL.showToast("Message status updated.", "success");
          P.modal("messageViewModal")?.hide();
          load();
        } catch (err) {
          if (err instanceof TL.Api.ApiValidationError) {
            P.showValidation(e.currentTarget, err.errors);
          }
          TL.showToast(err.message, "error");
        }
      });
    }

    load();
  });
})();