/**
 * TAILORA TOUR GUIDE — CHAT API SERVICE
 * Connects frontend strictly to real Chat API endpoints based on API Documentation.md:
 * - GET /chats
 * - GET /chats/{id}
 * - POST /chats/{id}/messages
 * - PUT /chats/{id}/read
 * - GET /chats/unread-count
 * - DELETE /chats/messages/{id}
 */

(function () {
  "use strict";

  const ChatApi = {
    // GET /chats
    async getChats() {
      return await window.TL.Api.get("/chats");
    },

    // GET /chats/{id}
    async getChatMessages(id) {
      return await window.TL.Api.get(`/chats/${id}`);
    },

    // POST /chats/{id}/messages
    async sendMessage(id, messageText) {
      const payload = {
        message: messageText,
        receiver_id: id,
        user_id: id,
        recipient_id: id
      };
      return await window.TL.Api.post(`/chats/${id}/messages`, payload);
    },

    // PUT /chats/{id}/read
    async markAsRead(id) {
      return await window.TL.Api.put(`/chats/${id}/read`);
    },

    // GET /chats/unread-count
    async getUnreadCount() {
      return await window.TL.Api.get("/chats/unread-count");
    },

    // DELETE /chats/messages/{id}
    async deleteMessage(messageId) {
      return await window.TL.Api.delete(`/chats/messages/${messageId}`);
    }
  };

  window.TL = window.TL || {};
  window.TL.ChatApi = ChatApi;
})();
