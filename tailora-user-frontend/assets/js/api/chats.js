/**
 * TAILORA USER — CHAT API
 * Authenticated endpoints from the current Chat API documentation.
 */
(function () {
  "use strict";

  const Chats = {
    all() {
      return window.TL.Api.get("/chats");
    },

    messages(id) {
      return window.TL.Api.get("/chats/" + id);
    },

    sendMessage(id, message, tripId = null) {
      return window.TL.Api.post("/chats/" + id + "/messages", {
        message,
        trip_id: tripId
      });
    },

    markRead(id) {
      return window.TL.Api.put("/chats/" + id + "/read");
    },

    unreadCount() {
      return window.TL.Api.get("/chats/unread-count");
    },

    deleteMessage(messageId) {
      return window.TL.Api.delete("/chats/messages/" + messageId);
    }
  };

  window.TL = window.TL || {};
  window.TL.Chats = Chats;
})();
