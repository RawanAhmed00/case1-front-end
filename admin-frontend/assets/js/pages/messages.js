(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    const P = TL.Pages;
    const state = document.getElementById("messagesState");

    let currentMessages = [];

    function formatDate(raw) {
      if (!raw) return "—";
      try {
        const d = new Date(raw);
        if (isNaN(d.getTime())) return raw;
        return d.toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        });
      } catch (_) {
        return raw;
      }
    }

    async function load() {
      if (!state) return;
      state.innerHTML = `
        <div class="tl-inline-loader">
          <div class="tl-spinner"></div>
        </div>
      `;

      try {
        const r = await TL.Messages.getContactMessages();
        const rows = P.list(r) || [];
        currentMessages = rows;

        if (!rows) {
          state.innerHTML = P.empty(
            "Message data unavailable",
            "Unable to load contact messages.",
            "bi-envelope-x"
          );
          return;
        }

        if (!rows.length) {
          state.innerHTML = P.empty(
            "No contact messages",
            "There are no incoming messages in the database.",
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
                  <th>Sender</th>
                  <th>Message Preview</th>
                  <th>Received Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${rows.map(function (m) {
                  const senderName = m.user?.name || m.name || (m.user_id ? `User #${m.user_id}` : "Website Visitor");
                  const senderEmail = m.user?.email || m.email || "";
                  const messageText = m.message || "";
                  return `
                    <tr>
                      <td><strong>#${P.escape(P.display(m.id))}</strong></td>
                      <td>
                        <strong>${P.escape(senderName)}</strong>
                        ${senderEmail ? `<div class="tl-metadata" style="font-size: 11px;">${P.escape(senderEmail)}</div>` : ''}
                      </td>
                      <td style="max-width: 420px;">
                        <div class="text-truncate" style="color: var(--tl-text-secondary); font-size: 13.5px;">
                          ${P.escape(messageText || "No message text")}
                        </div>
                      </td>
                      <td>${P.escape(formatDate(m.created_at || m.created))}</td>
                      <td>
                        <div class="tl-table-actions">
                          <button
                            type="button"
                            class="tl-btn tl-btn--outline tl-btn--sm"
                            data-message-view="${P.escape(m.id)}"
                            title="View Full Message"
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
        state.innerHTML = P.error(e.message || "Failed to load messages.");
      }
    }

    const refreshBtn = document.getElementById("messagesRefresh");
    if (refreshBtn) refreshBtn.addEventListener("click", load);

    if (state) {
      state.addEventListener("click", async function (e) {
        const viewBtn = e.target.closest("[data-message-view]");
        const delBtn = e.target.closest("[data-message-delete]");

        // View Message Modal
        if (viewBtn) {
          const id = viewBtn.dataset.messageView;
          let m = currentMessages.find(x => String(x.id) === String(id));

          try {
            const r = await TL.Messages.getContactMessage(id);
            const fetched = P.data(r);
            if (fetched && typeof fetched === "object") {
              m = Object.assign({}, m, fetched);
            }
          } catch (_) {
            // Fallback to local row data
          }

          if (m) {
            const senderName = m.user?.name || m.name || (m.user_id ? `User #${m.user_id}` : "Website Visitor");
            const senderEmail = m.user?.email || m.email || "No email provided";
            const dateStr = formatDate(m.created_at || m.created);

            const nameEl = document.getElementById("modalSenderName");
            const emailEl = document.getElementById("modalSenderEmail");
            const dateEl = document.getElementById("modalMessageDate");
            const bodyEl = document.getElementById("modalMessageBody");

            if (nameEl) nameEl.textContent = senderName;
            if (emailEl) emailEl.innerHTML = `<i class="bi bi-envelope me-1"></i> ${P.escape(senderEmail)}`;
            if (dateEl) dateEl.textContent = dateStr;
            if (bodyEl) bodyEl.textContent = m.message || "No content.";

            P.modal("messageViewModal")?.show();
          } else {
            TL.showToast("Message details could not be found.", "warning");
          }
          return;
        }

        // Delete Message
        if (delBtn) {
          const id = delBtn.dataset.messageDelete;
          if (!id) return;
          if (!P.confirm(`Are you sure you want to delete message #${id}? This cannot be undone.`)) return;

          try {
            await TL.Messages.deleteContactMessage(id);
            TL.showToast("Message deleted successfully.", "success");
            load();
          } catch (err) {
            TL.showToast(err.message || "Failed to delete message.", "error");
          }
        }
      });
    }

    load();
  });
})();