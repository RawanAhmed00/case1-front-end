/**
 * TAILORA USER — CONTACT MESSAGES API
 * POST /contact-messages
 */

(function () {
  "use strict";

  const STORAGE_KEY = "tailora_user_contact_history";

  function getLocalHistory() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveToLocalHistory(item) {
    try {
      const history = getLocalHistory();
      history.unshift(item);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 50)));
    } catch {}
  }

  const Contact = {
    /**
     * Send a contact message to the support/admin team.
     * @param {string|object} payload
     */
    async send(payload) {
      const messageText = typeof payload === "string" ? payload : payload.message;
      if (!messageText || !String(messageText).trim()) {
        throw new Error("Message text cannot be empty.");
      }

      const response = await window.TL.Api.post("/contact-messages", {
        message: String(messageText).trim()
      });

      const messageObj = response?.data || response?.message_data || {
        id: Date.now(),
        message: messageText,
        status: "pending",
        created_at: new Date().toISOString()
      };

      saveToLocalHistory({
        id: messageObj.id || Date.now(),
        message: messageObj.message || messageText,
        subject: typeof payload === "object" ? payload.subject : "General Inquiry",
        status: messageObj.status || "pending",
        created_at: messageObj.created_at || new Date().toISOString()
      });

      return response;
    },

    getHistory() {
      return getLocalHistory();
    },

    clearHistory() {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  window.TL = window.TL || {};
  window.TL.Contact = Contact;
})();
