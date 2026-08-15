/* ==========================================================================
   TAILORA ADMIN — assets/js/api/messages.js
   Owns: /admin/contact-messages (4 documented endpoints).
   ========================================================================== */

(function () {
  "use strict";

  // GET /admin/contact-messages
  function getContactMessages(query) {
    return window.TL.Api.get("/contact-messages", query);
  }

  // GET /admin/contact-messages/{id}
  function getContactMessage(id) {
    return window.TL.Api.get(`/contact-messages/${encodeURIComponent(id)}`);
  }

  // PUT /admin/contact-messages/{id} — body: { status }
  function updateContactMessage(id, data) {
    return window.TL.Api.put(`/contact-messages/${encodeURIComponent(id)}`, data);
  }

  // DELETE /admin/contact-messages/{id}
  function deleteContactMessage(id) {
    return window.TL.Api.delete(`/contact-messages/${encodeURIComponent(id)}`);
  }

  window.TL = window.TL || {};
  window.TL.Messages = {
    getContactMessages,
    getContactMessage,
    updateContactMessage,
    deleteContactMessage,
  };
})();
