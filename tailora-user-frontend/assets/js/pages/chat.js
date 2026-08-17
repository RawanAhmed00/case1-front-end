/**
 * TAILORA USER — MESSAGES / CHAT CONTROLLER
 * Full management of chat threads, tour guide conversation lookup, and real-time messaging.
 * Mirrors all capabilities and architecture from the Tour Guide chat center.
 */

(function () {
  "use strict";

  let activeChatId = null;
  let chats = [];
  let pollInterval = null;

  function getCurrentUser() {
    if (window.TL && window.TL.Auth && typeof window.TL.Auth.getCachedUser === "function") {
      return window.TL.Auth.getCachedUser() || {};
    }
    if (window.TL && window.TL.Auth && typeof window.TL.Auth.user === "function") {
      return window.TL.Auth.user() || {};
    }
    try {
      const stored = localStorage.getItem("tailora_user_profile");
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  function getPartnerUserId(c) {
    if (!c) return null;
    const currentUser = getCurrentUser();
    const currentUserId = String(currentUser.id || "");

    const partner = c.partner || c.guide || c.tour_guide || c.user || c.traveler || {};
    if (partner.id && String(partner.id) !== currentUserId) return String(partner.id);
    if (partner.user_id && String(partner.user_id) !== currentUserId) return String(partner.user_id);
    if (c.guide_id && String(c.guide_id) !== currentUserId) return String(c.guide_id);
    if (c.user_id && String(c.user_id) !== currentUserId) return String(c.user_id);
    if (c.traveler_id && String(c.traveler_id) !== currentUserId) return String(c.traveler_id);
    if (c.sender_id && String(c.sender_id) !== currentUserId) return String(c.sender_id);
    if (c.receiver_id && String(c.receiver_id) !== currentUserId) return String(c.receiver_id);
    return String(c.id);
  }

  function findChatForUser(targetId) {
    if (!targetId || !Array.isArray(chats) || chats.length === 0) return null;
    const targetStr = String(targetId);

    return chats.find((c) => {
      if (getPartnerUserId(c) === targetStr) return true;
      if (String(c.id) === targetStr) return true;
      if (c.guide_id && String(c.guide_id) === targetStr) return true;
      if (c.user_id && String(c.user_id) === targetStr) return true;
      if (c.traveler_id && String(c.traveler_id) === targetStr) return true;
      if (c.partner && (String(c.partner.id) === targetStr || String(c.partner.user_id) === targetStr)) return true;
      if (c.guide && (String(c.guide.id) === targetStr || String(c.guide.user_id) === targetStr)) return true;
      if (c.user && String(c.user.id) === targetStr) return true;
      return false;
    });
  }

  function extractArray(res) {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    if (res.data && Array.isArray(res.data.data)) return res.data.data;
    if (res.data && Array.isArray(res.data.messages)) return res.data.messages;
    if (Array.isArray(res.messages)) return res.messages;
    return [];
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  function showToast(message, type = "success") {
    if (window.TL && typeof window.TL.showToast === "function") {
      window.TL.showToast(message, type);
    } else if (window.TL && typeof window.TL.toast === "function") {
      window.TL.toast(message, type);
    }
  }

  /**
   * Evaluates messages in a conversation to determine:
   * 1. The last unopened message sent by tour guide (and not opened by user) OR
   *    the last unopened message sent by user (and not opened by tour guide).
   * 2. The accurate unread incoming message count for the user.
   */
  function processConversationMessages(c, msgs, currentUserId, currentActiveId) {
    const partnerId = getPartnerUserId(c);
    const isActive = currentActiveId && (String(partnerId) === String(currentActiveId) || String(c.id) === String(currentActiveId));

    let unreadIncomingCount = 0;
    let lastUnopenedMessage = null;

    if (Array.isArray(msgs) && msgs.length > 0) {
      msgs.forEach((m) => {
        const mSenderId = String(m.sender_id || m.sender?.id || m.from_id || "");
        const isRead =
          m.is_read === true ||
          m.is_read === 1 ||
          String(m.is_read) === "1" ||
          String(m.is_read) === "true" ||
          m.read === true ||
          m.read === 1 ||
          m.status === "read" ||
          m.seen === true ||
          Boolean(m.read_at);
        const isUnread = !isRead;

        // 1. Tour guide sent message and user (traveler) did not open yet
        if (mSenderId !== currentUserId && isUnread) {
          unreadIncomingCount++;
          lastUnopenedMessage = m.message || m.content || lastUnopenedMessage;
        }
        // 2. User sent message and tour guide did not open yet
        else if (mSenderId === currentUserId && isUnread) {
          lastUnopenedMessage = m.message || m.content || lastUnopenedMessage;
        }
      });

      // Update the preview message: unopened message takes priority, otherwise latest message
      if (lastUnopenedMessage) {
        c.last_message = lastUnopenedMessage;
      } else {
        const lastMsg = msgs[msgs.length - 1];
        if (lastMsg && (lastMsg.message || lastMsg.content)) {
          c.last_message = lastMsg.message || lastMsg.content;
        }
      }
    }

    c.unread_count = isActive ? 0 : unreadIncomingCount;
    return c.unread_count;
  }

  async function loadChatList() {
    try {
      const res = await window.TL.ChatApi.getChats();
      chats = extractArray(res);

      const currentUser = getCurrentUser();
      const currentUserId = String(currentUser.id || "");

      let totalUnread = 0;

      // Populate exact unread counts and last unopened message previews per conversation
      await Promise.all(
        chats.map(async (c) => {
          const partnerId = getPartnerUserId(c);
          try {
            const msgRes = await window.TL.ChatApi.getChatMessages(partnerId);
            const msgs = extractArray(msgRes);
            const unread = processConversationMessages(c, msgs, currentUserId, activeChatId);
            totalUnread += unread;
          } catch {
            // Fallback unread count if message fetch fails
            if (activeChatId && (String(partnerId) === String(activeChatId) || String(c.id) === String(activeChatId))) {
              c.unread_count = 0;
            }
          }
        })
      );

      // Handle URL query parameters to jump straight to a guide's chat
      const urlParams = new URLSearchParams(window.location.search);
      const targetUserId =
        urlParams.get("guide_id") ||
        urlParams.get("guideId") ||
        urlParams.get("user_id") ||
        urlParams.get("userId") ||
        urlParams.get("chat_id") ||
        urlParams.get("id");
      const targetName = urlParams.get("name") || urlParams.get("username") || urlParams.get("guide_name");

      if (targetUserId) {
        const existing = findChatForUser(targetUserId);
        if (!existing) {
          chats.unshift({
            id: targetUserId,
            user_id: targetUserId,
            guide_id: targetUserId,
            partner: { id: targetUserId, name: targetName || "Tour Guide" },
            name: targetName || "Tour Guide",
            last_message: "Start a conversation"
          });
        }
      }

      let chatToSelect = null;
      let nameToSelect = null;

      if (targetUserId) {
        const existing = findChatForUser(targetUserId);
        chatToSelect = existing ? getPartnerUserId(existing) : targetUserId;
        nameToSelect = targetName;
      }

      renderChatSidebar();
      updateTotalUnreadBadge(totalUnread);

      if (chatToSelect) {
        await selectChat(chatToSelect, nameToSelect);
      }
    } catch (err) {
      showToast("Failed to load chats: " + err.message, "error");
    }
  }

  function updateTotalUnreadBadge(count) {
    const badge = document.getElementById("chatTotalUnreadBadge");
    if (!badge) return;
    if (count > 0) {
      badge.textContent = String(count);
      badge.style.display = "inline-flex";
    } else {
      badge.style.display = "none";
    }
  }

  function renderChatSidebar() {
    const listContainer = document.getElementById("chatListContainer") || document.getElementById("chat-list");
    if (!listContainer) return;

    if (!Array.isArray(chats) || chats.length === 0) {
      listContainer.innerHTML = `
        <div class="tl-chat-empty p-4 text-center">
          <div class="tl-chat-empty-icon mb-2">💬</div>
          <p class="tl-text-secondary small mb-0">No active conversations yet.</p>
        </div>`;
      return;
    }

    const currentUser = getCurrentUser();
    const currentUserId = String(currentUser.id || "");

    listContainer.innerHTML = chats
      .map((c) => {
        const partner = c.partner || c.guide || c.tour_guide || c.user || c.traveler || {};
        const partnerId = getPartnerUserId(c);
        const displayName = partner.name || c.name || c.guide_name || c.traveler_name || "Tour Guide";
        const avatar = displayName.length > 0 ? displayName.charAt(0).toUpperCase() : "G";
        const chatId = partnerId;

        const isActive = String(chatId) === String(activeChatId) || String(c.id) === String(activeChatId);

        // Unread count check
        let rawUnread = 0;
        const senderId = String(c.sender_id || c.last_message_sender_id || c.from_id || "");
        if (currentUserId && senderId === currentUserId) {
          rawUnread = 0;
        } else {
          if (c.unread_count !== undefined && c.unread_count !== null && c.unread_count > 0) {
            rawUnread = parseInt(c.unread_count, 10);
          } else if (c.unreadCount !== undefined && c.unreadCount !== null && c.unreadCount > 0) {
            rawUnread = parseInt(c.unreadCount, 10);
          } else if (c.unread_messages_count !== undefined && c.unread_messages_count !== null && c.unread_messages_count > 0) {
            rawUnread = parseInt(c.unread_messages_count, 10);
          } else if (
            c.is_read === false ||
            c.is_read === 0 ||
            String(c.is_read) === "0" ||
            String(c.is_read) === "false" ||
            c.read === false ||
            c.unread === true ||
            c.has_unread === true
          ) {
            rawUnread = 1;
          } else if (typeof c.unread === "number" && c.unread > 0) {
            rawUnread = c.unread;
          }
        }

        const unreadVal = isActive ? 0 : parseInt(rawUnread, 10) || 0;

        return `
          <div class="tl-chat-item ${isActive ? "is-active" : ""}" data-chat-id="${escapeHtml(chatId)}" data-partner-id="${escapeHtml(partnerId)}" data-name="${escapeHtml(displayName)}">
            <div class="tl-avatar">${escapeHtml(avatar)}</div>
            <div class="tl-chat-item__info">
              <div class="tl-chat-item__name">
                <span class="text-truncate">${escapeHtml(displayName)}</span>
                ${unreadVal > 0 ? `<span class="tl-chat-badge" title="${unreadVal} unread message${unreadVal > 1 ? "s" : ""}">${unreadVal}</span>` : ""}
              </div>
              <div class="tl-chat-item__preview">${escapeHtml(c.last_message || c.message || "No messages yet")}</div>
            </div>
          </div>
        `;
      })
      .join("");

    listContainer.querySelectorAll(".tl-chat-item").forEach((item) => {
      item.addEventListener("click", () => {
        const idToUse = item.getAttribute("data-partner-id") || item.getAttribute("data-chat-id");
        selectChat(idToUse, item.getAttribute("data-name"));
      });
    });
  }

  async function selectChat(id, nameOverride = null) {
    if (!id) return;

    const existingChat = findChatForUser(id);
    const targetGuideId = existingChat ? getPartnerUserId(existingChat) : String(id);
    activeChatId = targetGuideId;

    if (existingChat) {
      existingChat.unread_count = 0;
      existingChat.unreadCount = 0;
      existingChat.unread = 0;
    }

    let displayName = nameOverride;
    if (existingChat && !displayName) {
      const partner = existingChat.partner || existingChat.guide || existingChat.tour_guide || existingChat.user || {};
      displayName = partner.name || existingChat.name || existingChat.guide_name;
    }

    if (!displayName) {
      const activeItem = document.querySelector(`.tl-chat-item[data-partner-id="${id}"], .tl-chat-item[data-chat-id="${id}"]`);
      displayName = activeItem ? activeItem.getAttribute("data-name") : "Tour Guide";
    }

    renderChatSidebar();

    const headerTitle = document.getElementById("activeChatHeaderTitle");
    const layout = document.querySelector(".tl-chat-layout") || document.querySelector(".tl-chat-shell");
    const thread = document.getElementById("chatMessagesThread") || document.getElementById("chat-messages");

    // Immediately isolate conversation state and display spinner
    if (thread) {
      thread.innerHTML =
        '<div class="text-center py-5 text-secondary"><div class="spinner-border spinner-border-sm me-2"></div> Loading messages...</div>';
    }

    const avatar = displayName && displayName.length > 0 ? displayName.charAt(0).toUpperCase() : "G";

    if (layout) {
      layout.classList.add("has-active-chat");
      layout.classList.add("chat-open");
    }

    if (headerTitle) {
      headerTitle.innerHTML = `
        <div class="d-flex align-items-center gap-3">
          <button type="button" class="btn p-0 border-0 text-teal d-md-none me-2" id="backToChatListBtn" title="Back to chats" style="font-size: 1.25rem;">
            <i class="bi bi-arrow-left"></i>
          </button>
          <div class="tl-avatar">${escapeHtml(avatar)}</div>
          <div>
            <h6 class="mb-0">${escapeHtml(displayName)}</h6>
            <span class="tl-metadata text-teal"><i class="bi bi-circle-fill me-1" style="font-size: 8px;"></i> Active Guide Session</span>
          </div>
        </div>`;

      headerTitle.querySelector("#backToChatListBtn")?.addEventListener("click", (e) => {
        e.stopPropagation();
        if (layout) {
          layout.classList.remove("has-active-chat");
          layout.classList.remove("chat-open");
        }
      });
    }

    try {
      await window.TL.ChatApi.markAsRead(activeChatId);
      if (typeof window.TL.checkUnreadMessages === "function") {
        window.TL.checkUnreadMessages();
      }
    } catch {}

    await loadMessages(activeChatId);
  }

  async function loadMessages(id) {
    const thread = document.getElementById("chatMessagesThread") || document.getElementById("chat-messages");
    if (!thread) return;

    try {
      const res = await window.TL.ChatApi.getChatMessages(id);
      // Guard against race conditions when user rapidly clicks through chats
      if (String(activeChatId) !== String(id)) return;
      const msgs = extractArray(res);
      renderMessagesThread(msgs);
    } catch (err) {
      if (String(activeChatId) !== String(id)) return;
      thread.innerHTML = '<div class="text-center py-4 text-danger">Failed to load message thread.</div>';
    }
  }

  function renderMessagesThread(msgs) {
    const thread = document.getElementById("chatMessagesThread") || document.getElementById("chat-messages");
    if (!thread) return;

    if (!Array.isArray(msgs) || msgs.length === 0) {
      thread.innerHTML = `
        <div class="tl-chat-empty my-auto text-center">
          <div class="tl-chat-empty-icon mb-2">💬</div>
          <p class="tl-text-secondary">Start a conversation with your tour guide!</p>
        </div>`;
      return;
    }

    const currentUser = getCurrentUser();
    const currentUserId = String(currentUser.id || "");
    const currentUserName = (currentUser.name || currentUser.full_name || "").toLowerCase();
    const partnerId = String(activeChatId || "");

    thread.innerHTML = msgs
      .map((m) => {
        const senderId = String(m.sender_id || m.sender?.id || m.from_id || "");
        const receiverId = String(m.receiver_id || m.to_id || "");

        let isSent = false;
        if (currentUserId && senderId === currentUserId) {
          isSent = true;
        } else if (partnerId && senderId === partnerId) {
          isSent = false;
        } else if (partnerId && receiverId === partnerId) {
          isSent = true;
        } else if (currentUserName && m.sender?.name && String(m.sender.name).toLowerCase() === currentUserName) {
          isSent = true;
        } else {
          isSent = m.is_sender === true || m.sent_by_me === true;
        }

        const bubbleCls = isSent ? "tl-message--sent" : "tl-message--received";
        const timeStr = m.created_at
          ? new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : "Just now";

        // Read receipt evaluation
        const isRead =
          m.is_read === true ||
          m.is_read === 1 ||
          String(m.is_read) === "1" ||
          String(m.is_read) === "true" ||
          m.read === true ||
          m.read === 1 ||
          m.status === "read" ||
          m.seen === true ||
          Boolean(m.read_at);

        const checkmarkCls = isRead ? "tl-checkmark--read" : "tl-checkmark--unread";
        const checkmarkTitle = isRead ? "Read by guide" : "Delivered";

        return `
          <div class="tl-message-bubble ${bubbleCls}" id="msg-${m.id}">
            <div>${escapeHtml(m.message || m.content)}</div>
            <div class="tl-message__meta">
              <span>${timeStr}</span>
              ${isSent ? `<i class="bi bi-check2-all tl-checkmark ${checkmarkCls}" title="${checkmarkTitle}"></i>` : ""}
              ${
                isSent && m.id
                  ? `<button type="button" class="btn btn-link p-0 text-danger ms-2 delete-msg-btn" data-id="${m.id}" title="Delete Message" style="font-size: 11px; text-decoration: none;">
                      <i class="bi bi-trash"></i>
                    </button>`
                  : ""
              }
            </div>
          </div>`;
      })
      .join("");

    thread.scrollTop = thread.scrollHeight;

    // Attach message deletion listeners
    thread.querySelectorAll(".delete-msg-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const msgId = btn.dataset.id;
        if (!confirm("Delete this message?")) return;

        try {
          await window.TL.ChatApi.deleteMessage(msgId);
          showToast("Message deleted.", "info");
          document.getElementById(`msg-${msgId}`)?.remove();
        } catch (err) {
          showToast("Failed to delete message: " + err.message, "error");
        }
      });
    });
  }

  async function handleSendMessage(e) {
    e.preventDefault();
    const recipientId = activeChatId;
    if (!recipientId) return;

    const input = document.getElementById("chatInputText") || document.getElementById("chat-input");
    const sendBtn = document.getElementById("chatSendBtn") || document.getElementById("chat-send-btn");
    const text = input ? input.value.trim() : "";

    if (!text) return;

    input.value = "";
    if (sendBtn) sendBtn.disabled = true;

    try {
      await window.TL.ChatApi.sendMessage(recipientId, text);
      if (String(activeChatId) === String(recipientId)) {
        await loadMessages(recipientId);
      }
      await loadChatList();
    } catch (err) {
      showToast("Failed to send message: " + err.message, "error");
    } finally {
      if (sendBtn) sendBtn.disabled = false;
      input.focus();
    }
  }

  async function pollUpdates() {
    try {
      const res = await window.TL.ChatApi.getChats();
      const updatedChats = extractArray(res);
      if (updatedChats.length > 0) {
        const currentUser = getCurrentUser();
        const currentUserId = String(currentUser.id || "");

        let totalUnread = 0;

        await Promise.all(
          updatedChats.map(async (c) => {
            const partnerId = getPartnerUserId(c);
            try {
              const msgRes = await window.TL.ChatApi.getChatMessages(partnerId);
              const msgs = extractArray(msgRes);
              const unread = processConversationMessages(c, msgs, currentUserId, activeChatId);
              totalUnread += unread;
            } catch {
              if (activeChatId && (String(partnerId) === String(activeChatId) || String(c.id) === String(activeChatId))) {
                c.unread_count = 0;
              }
            }
          })
        );

        chats = updatedChats;
        renderChatSidebar();
        updateTotalUnreadBadge(totalUnread);
      }

      if (activeChatId) {
        const currentActiveId = activeChatId;
        const msgRes = await window.TL.ChatApi.getChatMessages(currentActiveId);
        if (String(activeChatId) === String(currentActiveId)) {
          const msgs = extractArray(msgRes);
          renderMessagesThread(msgs);
        }
      }
    } catch {}
  }

  async function init() {
    if (window.TL && window.TL.Auth && typeof window.TL.Auth.guard === "function") {
      if (!window.TL.Auth.guard()) return;
    }

    await loadChatList();

    const form = document.getElementById("chatSendForm") || document.getElementById("chat-form");
    if (form) {
      form.addEventListener("submit", handleSendMessage);
    }

    // Background polling for incoming messages every 10 seconds
    if (pollInterval) clearInterval(pollInterval);
    pollInterval = setInterval(pollUpdates, 10000);
  }

  document.addEventListener("DOMContentLoaded", init);
})();