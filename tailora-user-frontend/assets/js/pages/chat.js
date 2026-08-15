(function () {
  "use strict";

  // ============================================================
  // STATE
  // ============================================================

  const state = {
    currentUserId: null,
    activeChatId: null,
    chats: [],
    messages: []
  };

  // ============================================================
  // HELPERS
  // ============================================================

  function list(response) {
    if (Array.isArray(response)) {
      return response;
    }

    if (response && Array.isArray(response.data)) {
      return response.data;
    }

    if (
      response &&
      response.data &&
      Array.isArray(response.data.data)
    ) {
      return response.data.data;
    }

    return [];
  }

  function object(response) {
    if (!response) {
      return {};
    }

    if (
      response.data &&
      !Array.isArray(response.data)
    ) {
      return response.data;
    }

    return response;
  }

  function escape(value) {
    if (value === null || value === undefined) {
      return "";
    }

    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function initials(name) {
    const value = String(name || "Tailora Guide").trim();

    if (!value) {
      return "TG";
    }

    const parts = value.split(/\s+/);

    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }

    return (
      parts[0].charAt(0) +
      parts[1].charAt(0)
    ).toUpperCase();
  }

  function getCurrentUserId() {
    const user =
      window.TL &&
      window.TL.Auth &&
      typeof window.TL.Auth.user === "function"
        ? window.TL.Auth.user()
        : null;

    if (user && user.id) {
      return Number(user.id);
    }

    return null;
  }

  // ============================================================
  // RENDER CHAT LIST
  // ============================================================

  function renderChatList() {
    const listEl = document.getElementById("chat-list");

    if (!listEl) {
      return;
    }

    if (!state.chats.length) {
      listEl.innerHTML = `
        <div class="tl-chat-empty">
          No conversations yet.
        </div>
      `;
      return;
    }

    listEl.innerHTML = state.chats
      .map((chat) => {
        const id = chat.id;

        /*
         * ChatController index() returns the latest MessageResource.
         * Depending on MessageResource structure, the other user can
         * be sender or receiver.
         */

        let otherUser = null;

        if (
          chat.sender &&
          Number(chat.sender.id) !== Number(state.currentUserId)
        ) {
          otherUser = chat.sender;
        } else if (
          chat.receiver &&
          Number(chat.receiver.id) !== Number(state.currentUserId)
        ) {
          otherUser = chat.receiver;
        }

        const name =
          chat.name ||
          (otherUser &&
            (otherUser.name ||
              otherUser.full_name ||
              otherUser.username)) ||
          "Tailora Guide";

        const preview =
          chat.message ||
          chat.content ||
          "Start a conversation";

        const active =
          Number(state.activeChatId) === Number(id)
            ? " active"
            : "";

        return `
          <button
            type="button"
            class="tl-chat-item${active}"
            data-chat-id="${escape(id)}"
          >
            <div class="tl-chat-avatar">
              ${escape(initials(name))}
            </div>

            <div class="tl-chat-item-content">
              <div class="tl-chat-item-name">
                ${escape(name)}
              </div>

              <div class="tl-chat-item-preview">
                ${escape(preview)}
              </div>
            </div>
          </button>
        `;
      })
      .join("");

    listEl
      .querySelectorAll("[data-chat-id]")
      .forEach((item) => {
        item.addEventListener("click", function () {
          openChat(this.dataset.chatId);
        });
      });
  }

  // ============================================================
  // SHOW CONVERSATION
  // ============================================================

  function showConversation(chat) {
    const empty =
      document.getElementById("chat-empty");

    const conversation =
      document.getElementById("chat-conversation");

    if (empty) {
      empty.hidden = true;
    }

    if (conversation) {
      conversation.hidden = false;
    }

    const chatName =
      chat.name || "Tailora Guide";

    const title =
      document.getElementById("chat-title");

    if (title) {
      title.textContent = chatName;
    }

    const avatar =
      document.getElementById("chat-avatar");

    if (avatar) {
      avatar.textContent = initials(chatName);
    }

    const status =
      document.getElementById("chat-status");

    if (status) {
      status.textContent = "Tailora Travel Guide";
    }
  }

  // ============================================================
  // RENDER MESSAGES
  // ============================================================

  function renderMessages() {
    const messagesEl =
      document.getElementById("chat-messages");

    if (!messagesEl) {
      return;
    }

    if (!state.messages.length) {
      messagesEl.innerHTML = `
        <div class="tl-chat-empty">
          No messages yet. Start the conversation.
        </div>
      `;
      return;
    }

    messagesEl.innerHTML = state.messages
      .map((message) => {
        const senderId =
          message.sender_id ??
          (message.sender && message.sender.id);

        const mine =
          Number(senderId) === Number(state.currentUserId);

        const messageText =
          message.message ||
          message.content ||
          "";

        const createdAt =
          message.created_at || "";

        return `
          <div class="tl-chat-message-row ${mine ? "mine" : "theirs"}">
            <div class="tl-chat-message">
              <div class="tl-chat-message-text">
                ${escape(messageText)}
              </div>

              ${
                createdAt
                  ? `
                    <div class="tl-chat-message-time">
                      ${escape(createdAt)}
                    </div>
                  `
                  : ""
              }

              ${
                mine && message.id
                  ? `
                    <button
                      type="button"
                      class="tl-chat-delete"
                      data-message-id="${escape(message.id)}"
                    >
                      Delete
                    </button>
                  `
                  : ""
              }
            </div>
          </div>
        `;
      })
      .join("");

    messagesEl
      .querySelectorAll("[data-message-id]")
      .forEach((button) => {
        button.addEventListener("click", function () {
          deleteMessage(this.dataset.messageId);
        });
      });

    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  // ============================================================
  // OPEN CHAT
  // ============================================================

  async function openChat(id) {
    const chat = state.chats.find(
      (item) => Number(item.id) === Number(id)
    );

    if (!chat) {
      return;
    }

    state.activeChatId = Number(id);
    state.messages = [];

    renderChatList();
    showConversation(chat);

    const messagesEl =
      document.getElementById("chat-messages");

    if (!messagesEl) {
      return;
    }

    messagesEl.innerHTML =
      '<div class="tl-chat-loading">Loading messages...</div>';

    try {
      const response =
        await window.TL.Chats.messages(id);

      state.messages = list(response);

      renderMessages();

      await window.TL.Chats
        .markRead(id)
        .catch(() => {});

      await loadUnreadCount();

    } catch (error) {
      console.error(
        "Failed to load messages:",
        error
      );

      messagesEl.innerHTML = `
        <div class="tl-chat-error">
          ${escape(
            error.message ||
            "Failed to load messages."
          )}
        </div>
      `;
    }
  }

  // ============================================================
  // SEND MESSAGE
  // ============================================================

  async function sendMessage(event) {
    event.preventDefault();

    if (!state.activeChatId) {
      return;
    }

    const input =
      document.getElementById("chat-input");

    const button =
      document.getElementById("chat-send-btn");

    if (!input || !button) {
      return;
    }

    const message = input.value.trim();

    if (!message) {
      return;
    }

    button.disabled = true;
    input.disabled = true;

    try {
      const response =
        await window.TL.Chats.sendMessage(
          state.activeChatId,
          message,
          null
        );

      const sent = object(response);

      const newMessage =
        sent.data &&
        !Array.isArray(sent.data)
          ? sent.data
          : sent;

      if (newMessage && newMessage.id) {
        state.messages.push(newMessage);
      } else {
        const refreshed =
          await window.TL.Chats.messages(
            state.activeChatId
          );

        state.messages = list(refreshed);
      }

      input.value = "";
      input.style.height = "auto";

      renderMessages();

      await loadChats(false);

    } catch (error) {
      console.error(
        "Failed to send message:",
        error
      );

      if (
        window.TL &&
        typeof window.TL.toast === "function"
      ) {
        window.TL.toast(
          error.message ||
          "Couldn't send message.",
          "error"
        );
      } else {
        alert(
          error.message ||
          "Couldn't send message."
        );
      }

    } finally {
      button.disabled = false;
      input.disabled = false;
      input.focus();
    }
  }

  // ============================================================
  // DELETE MESSAGE
  // ============================================================

  async function deleteMessage(id) {
    if (!window.confirm("Delete this message?")) {
      return;
    }

    try {
      await window.TL.Chats.deleteMessage(id);

      state.messages =
        state.messages.filter(
          (message) =>
            Number(message.id) !== Number(id)
        );

      renderMessages();

      if (
        window.TL &&
        typeof window.TL.toast === "function"
      ) {
        window.TL.toast(
          "Message deleted",
          "success"
        );
      }

    } catch (error) {
      console.error(
        "Failed to delete message:",
        error
      );

      if (
        window.TL &&
        typeof window.TL.toast === "function"
      ) {
        window.TL.toast(
          error.message ||
          "Couldn't delete message.",
          "error"
        );
      }
    }
  }

  // ============================================================
  // UNREAD COUNT
  // ============================================================

  async function loadUnreadCount() {
    try {
      const response =
        await window.TL.Chats.unreadCount();

      const data =
        response &&
        response.data &&
        !Array.isArray(response.data)
          ? response.data
          : response;

      const count = Number(
        data &&
        (
          data.unread_count ??
          data.count ??
          0
        )
      );

      const badge =
        document.getElementById(
          "chat-unread-count"
        );

      if (!badge) {
        return;
      }

      badge.textContent = String(count);
      badge.hidden = count <= 0;

    } catch (error) {
      console.warn(
        "Failed to load unread count:",
        error
      );
    }
  }

  // ============================================================
  // LOAD CHATS
  // ============================================================

  async function loadChats(selectFirst = true) {
    const listEl =
      document.getElementById("chat-list");

    if (!listEl) {
      console.error(
        "chat-list element was not found."
      );
      return;
    }

    listEl.innerHTML =
      '<div class="tl-chat-loading">Loading conversations...</div>';

    try {
      const response =
        await window.TL.Chats.all();

      state.chats = list(response);

// If there are no previous conversations,
// open the default Tour Guide so the user can
// start the first conversation.
if (state.chats.length === 0) {
  state.chats = [
    {
      id: 4,
      name: "Guide 1",
      role: "t_guide"
    }
  ];
}

renderChatList();

if (
  selectFirst &&
  state.chats.length
) {
  await openChat(state.chats[0].id);
}

    } catch (error) {
      console.error(
        "Failed to load conversations:",
        error
      );

      listEl.innerHTML = `
        <div class="tl-chat-error">
          ${escape(
            error.message ||
            "Failed to load conversations."
          )}
        </div>
      `;
    }
  }

  // ============================================================
  // INITIALIZE PAGE
  // ============================================================

  document.addEventListener(
    "DOMContentLoaded",
    async function () {

      if (
        !window.TL ||
        !window.TL.Auth ||
        !window.TL.Auth.guard()
      ) {
        return;
      }

      state.currentUserId =
        getCurrentUserId();

      const chatForm =
        document.getElementById("chat-form");

      if (chatForm) {
        chatForm.addEventListener(
          "submit",
          sendMessage
        );
      }

      const input =
        document.getElementById("chat-input");

      if (input) {
        input.addEventListener(
          "input",
          function () {
            input.style.height = "auto";

            input.style.height =
              Math.min(
                input.scrollHeight,
                130
              ) + "px";
          }
        );
      }

      await loadUnreadCount();
      await loadChats(true);
    }
  );

})();