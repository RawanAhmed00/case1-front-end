/**
 * TAILORA USER — PROFILE API
 * PUT    /profile
 * PUT    /profile/password
 * DELETE /profile
 * POST   /contact-messages
 */
(function () {
  "use strict";

  const Profile = {
    update(payload) {
      return window.TL.Api.put("/profile", payload);
    },
    updatePassword(payload) {
      return window.TL.Api.put("/profile/password", payload);
    },
    remove() {
      return window.TL.Api.delete("/profile");
    }
  };

  const Contact = {
    send(payload) {
      return window.TL.Api.post("/contact-messages", payload);
    }
  };

  window.TL = window.TL || {};
  window.TL.Profile = Profile;
  window.TL.Contact = Contact;
})();
