/**
 * TAILORA TOUR GUIDE — MESSAGES / CHAT CONTROLLER
 * Full management of chat threads, traveler conversation lookup, and real-time message sending.
 */

(function () {
  "use strict";

  let activeChatId = null;
  let chats = [];

  function getTravelerUserId(c) {
    if (!c) return null;
    const currentUser = window.TL.Auth.getCachedUser() || {};
    const guideId = String(currentUser.id || "");

    const partner = c.partner || c.user || c.traveler || {};
    if (partner.id && String(partner.id) !== guideId) return String(partner.id);
    if (partner.user_id && String(partner.user_id) !== guideId) return String(partner.user_id);
    if (c.user_id && String(c.user_id) !== guideId) return String(c.user_id);
    if (c.traveler_id && String(c.traveler_id) !== guideId) return String(c.traveler_id);
    if (c.sender_id && String(c.sender_id) !== guideId) return String(c.sender_id);
    if (c.receiver_id && String(c.receiver_id) !== guideId) return String(c.receiver_id);
    return String(c.id);
  }

  function findChatForUser(targetId) {
    if (!targetId || !Array.isArray(chats) || chats.length === 0) return null;
    const targetStr = String(targetId);

    return chats.find(c => {
      if (getTravelerUserId(c) === targetStr) return true;
      if (String(c.id) === targetStr) return true;
      if (c.user_id && String(c.user_id) === targetStr) return true;
      if (c.traveler_id && String(c.traveler_id) === targetStr) return true;
      if (c.partner && (String(c.partner.id) === targetStr || String(c.partner.user_id) === targetStr)) return true;
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

  async function loadChatList() {
    try {
      const res = await window.TL.ChatApi.getChats();
      chats = extractArray(res);

      const currentUser = window.TL.Auth.getCachedUser() || {};
      const guideId = String(currentUser.id || "");

      // Populate exact unread counts per conversation
      await Promise.all(chats.map(async (c) => {
        const partnerId = getTravelerUserId(c);
        if (activeChatId && (String(partnerId) === String(activeChatId) || String(c.id) === String(activeChatId))) {
          c.unread_count = 0;
          return;
        }
        const senderId = String(c.sender_id || c.last_message_sender_id || c.from_id || "");
        if (guideId && senderId === guideId) {
          c.unread_count = 0;
          return;
        }

        try {
          const msgRes = await window.TL.ChatApi.getChatMessages(partnerId);
          const msgs = extractArray(msgRes);
          let count = 0;
          msgs.forEach(m => {
            const mSenderId = String(m.sender_id || m.sender?.id || m.from_id || "");
            const isUnread = m.is_read === false || m.is_read === 0 || String(m.is_read) === "0" || String(m.is_read) === "false" || m.read === false;
            if (mSenderId !== guideId && isUnread) {
              count++;
            }
          });
          c.unread_count = count;
        } catch {}
      }));

      const urlParams = new URLSearchParams(window.location.search);
      const targetUserId = urlParams.get("user_id") || urlParams.get("userId") || urlParams.get("chat_id") || urlParams.get("id");
      const targetName = urlParams.get("name") || urlParams.get("username");

      if (targetUserId) {
        const existing = findChatForUser(targetUserId);
        if (!existing) {
          chats.unshift({
            id: targetUserId,
            user_id: targetUserId,
            partner: { id: targetUserId, name: targetName || "Traveler" },
            name: targetName || "Traveler",
            last_message: "New conversation"
          });
        }
      }

      let chatToSelect = null;
      let nameToSelect = null;

      if (targetUserId) {
        const existing = findChatForUser(targetUserId);
        chatToSelect = existing ? getTravelerUserId(existing) : targetUserId;
        nameToSelect = targetName;
      }

      renderChatSidebar();

      if (chatToSelect) {
        await selectChat(chatToSelect, nameToSelect);
      }
    } catch (err) {
      window.TL.showToast("Failed to load chats: " + err.message, "error");
    }
  }

  function renderChatSidebar() {
    const listContainer = document.getElementById("chatListContainer");
    if (!listContainer) return;

    if (!Array.isArray(chats) || chats.length === 0) {
      listContainer.innerHTML = `
        <div class="tl-empty-state p-4">
          <i class="bi bi-chat-square-dots fs-2 text-teal"></i>
          <p class="tl-text-secondary small mb-0">No active traveler conversations.</p>
        </div>`;
      return;
    }

    const currentUser = window.TL.Auth.getCachedUser() || {};
    const guideId = currentUser.id;

    listContainer.innerHTML = chats.map(c => {
      const partner = c.partner || c.user || c.traveler || {};
      const partnerId = getTravelerUserId(c);
      const displayName = partner.name || c.name || c.traveler_name || "Traveler";
      const avatar = displayName.length > 0 ? displayName.charAt(0).toUpperCase() : "T";
      const chatId = partnerId;

      const isActive = String(chatId) === String(activeChatId) || String(c.id) === String(activeChatId);

      // Unread count ONLY applies to incoming messages from traveler (where sender_id != guideId)
      let rawUnread = 0;
      const senderId = String(c.sender_id || c.last_message_sender_id || c.from_id || "");
      if (guideId && senderId === String(guideId)) {
        rawUnread = 0;
      } else {
        if (c.unread_count !== undefined && c.unread_count !== null && c.unread_count > 0) {
          rawUnread = parseInt(c.unread_count);
        } else if (c.unreadCount !== undefined && c.unreadCount !== null && c.unreadCount > 0) {
          rawUnread = parseInt(c.unreadCount);
        } else if (c.unread_messages_count !== undefined && c.unread_messages_count !== null && c.unread_messages_count > 0) {
          rawUnread = parseInt(c.unread_messages_count);
        } else if (c.is_read === false || c.is_read === 0 || String(c.is_read) === "0" || String(c.is_read) === "false" || c.read === false || c.unread === true || c.has_unread === true) {
          rawUnread = 1;
        } else if (typeof c.unread === "number" && c.unread > 0) {
          rawUnread = c.unread;
        }
      }

      const unreadVal = isActive ? 0 : (parseInt(rawUnread) || 0);

      return `
        <div class="tl-chat-item ${isActive ? "is-active" : ""}" data-chat-id="${chatId}" data-partner-id="${partnerId}" data-name="${escapeHtml(displayName)}">
          <div class="tl-avatar">${avatar}</div>
          <div class="tl-chat-item__info">
            <div class="tl-chat-item__name">
              <span class="text-truncate">${escapeHtml(displayName)}</span>
              ${unreadVal > 0 ? `<span class="tl-chat-badge" title="${unreadVal} unread message${unreadVal > 1 ? 's' : ''}">${unreadVal}</span>` : ""}
            </div>
            <div class="tl-chat-item__preview">${escapeHtml(c.last_message || c.message || "No messages yet")}</div>
          </div>
        </div>
      `;
    }).join("");

    listContainer.querySelectorAll(".tl-chat-item").forEach(item => {
      item.addEventListener("click", () => {
        const idToUse = item.getAttribute("data-partner-id") || item.getAttribute("data-chat-id");
        selectChat(idToUse, item.getAttribute("data-name"));
      });
    });
  }

  async function selectChat(id, nameOverride = null) {
    if (!id) return;

    const existingChat = findChatForUser(id);
    const targetTravelerId = existingChat ? getTravelerUserId(existingChat) : String(id);
    activeChatId = targetTravelerId;

    if (existingChat) {
      existingChat.unread_count = 0;
      existingChat.unreadCount = 0;
      existingChat.unread = 0;
    }

    let displayName = nameOverride;
    if (existingChat && !displayName) {
      const partner = existingChat.partner || existingChat.user || existingChat.traveler || {};
      displayName = partner.name || existingChat.name || existingChat.traveler_name;
    }

    if (!displayName) {
      const activeItem = document.querySelector(`.tl-chat-item[data-partner-id="${id}"], .tl-chat-item[data-chat-id="${id}"]`);
      displayName = activeItem ? activeItem.getAttribute("data-name") : "Traveler";
    }

    renderChatSidebar();

    const headerTitle = document.getElementById("activeChatHeaderTitle");
    const layout = document.querySelector(".tl-chat-layout");
    const thread = document.getElementById("chatMessagesThread");

    // Immediately clear previous messages to isolate conversation state
    if (thread) {
      thread.innerHTML = '<div class="text-center py-4 text-secondary"><div class="spinner-border spinner-border-sm me-2"></div> Loading messages...</div>';
    }

    const avatar = displayName && displayName.length > 0 ? displayName.charAt(0).toUpperCase() : "T";

    if (layout) layout.classList.add("has-active-chat");
    if (headerTitle) {
      headerTitle.innerHTML = `
        <div class="d-flex align-items-center gap-3">
          <button type="button" class="btn p-0 border-0 text-teal d-md-none me-1" id="backToChatListBtn" title="Back to conversations">
            <i class="bi bi-arrow-left fs-4"></i>
          </button>
          <div class="tl-avatar">${avatar}</div>
          <div>
            <h6 class="mb-0 text-light">${escapeHtml(displayName)}</h6>
            <span class="tl-metadata text-teal"><i class="bi bi-circle-fill me-1" style="font-size: 8px;"></i> Active Session</span>
          </div>
        </div>`;

      headerTitle.querySelector("#backToChatListBtn")?.addEventListener("click", (e) => {
        e.stopPropagation();
        layout.classList.remove("has-active-chat");
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
    const thread = document.getElementById("chatMessagesThread");
    if (!thread) return;

    try {
      const res = await window.TL.ChatApi.getChatMessages(id);
      // Guard against race conditions when user switches chats rapidly
      if (String(activeChatId) !== String(id)) return;
      const msgs = extractArray(res);
      renderMessagesThread(msgs);
    } catch (err) {
      if (String(activeChatId) !== String(id)) return;
      thread.innerHTML = `<div class="text-center py-4 text-danger">Failed to load message thread.</div>`;
    }
  }

  function renderMessagesThread(msgs) {
    const thread = document.getElementById("chatMessagesThread");
    if (!thread) return;

    if (!Array.isArray(msgs) || msgs.length === 0) {
      thread.innerHTML = `
        <div class="tl-empty-state my-auto">
          <i class="bi bi-chat-text fs-1 text-teal"></i>
          <p class="tl-text-secondary">Start a conversation with the traveler!</p>
        </div>`;
      return;
    }

    const currentUser = window.TL.Auth.getCachedUser() || {};
    const guideId = String(currentUser.id || "");
    const guideName = (currentUser.name || "").toLowerCase();
    const travelerId = String(activeChatId || "");

    thread.innerHTML = msgs.map(m => {
      const senderId = String(m.sender_id || m.sender?.id || m.from_id || "");
      const receiverId = String(m.receiver_id || m.to_id || "");

      let isSent = false;
      if (guideId && senderId === guideId) {
        isSent = true;
      } else if (travelerId && senderId === travelerId) {
        isSent = false;
      } else if (travelerId && receiverId === travelerId) {
        isSent = true;
      } else if (guideName && m.sender?.name && String(m.sender.name).toLowerCase() === guideName) {
        isSent = true;
      } else {
        isSent = m.is_sender === true || m.sent_by_me === true;
      }

      const bubbleCls = isSent ? "tl-message--sent" : "tl-message--received";
      const timeStr = m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now";

      // Real is_read evaluation from backend MessageResource
      const isRead = m.is_read === true || m.is_read === 1 || String(m.is_read) === "1" || String(m.is_read) === "true" || m.read === true || m.read === 1 || m.status === "read" || m.seen === true || Boolean(m.read_at);
      const checkmarkCls = isRead ? "tl-checkmark--read" : "tl-checkmark--unread";
      const checkmarkTitle = isRead ? "Read by traveler" : "Delivered";

      return `
        <div class="tl-message-bubble ${bubbleCls}" id="msg-${m.id}">
          <div>${escapeHtml(m.message)}</div>
          <div class="tl-message__meta">
            <span>${timeStr}</span>
            ${isSent ? `<i class="bi bi-check2-all tl-checkmark ${checkmarkCls}" title="${checkmarkTitle}"></i>` : ""}
            <button class="btn btn-link p-0 text-danger ms-2 delete-msg-btn" data-id="${m.id}" title="Delete Message" style="font-size: 11px; text-decoration: none;">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </div>`;
    }).join("");

    thread.scrollTop = thread.scrollHeight;

    thread.querySelectorAll(".delete-msg-btn").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const msgId = btn.dataset.id;
        if (!confirm("Delete this message?")) return;

        try {
          await window.TL.ChatApi.deleteMessage(msgId);
          window.TL.showToast("Message deleted.", "info");
          document.getElementById(`msg-${msgId}`)?.remove();
        } catch (err) {
          window.TL.showToast("Failed to delete message: " + err.message, "error");
        }
      });
    });
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  async function handleSendMessage(e) {
    e.preventDefault();
    const recipientId = activeChatId;
    if (!recipientId) return;

    const input = document.getElementById("chatInputText");
    const text = input ? input.value.trim() : "";

    if (!text) return;

    input.value = "";

    try {
      await window.TL.ChatApi.sendMessage(recipientId, text);
      if (String(activeChatId) === String(recipientId)) {
        await loadMessages(recipientId);
      }
      await loadChatList();
    } catch (err) {
      window.TL.showToast("Failed to send message: " + err.message, "error");
    }
  }

  async function pollUpdates() {
    try {
      const res = await window.TL.ChatApi.getChats();
      const updatedChats = extractArray(res);
      if (updatedChats.length > 0) {
        const currentUser = window.TL.Auth.getCachedUser() || {};
        const guideId = String(currentUser.id || "");

        await Promise.all(updatedChats.map(async (c) => {
          const partnerId = getTravelerUserId(c);
          if (activeChatId && (String(partnerId) === String(activeChatId) || String(c.id) === String(activeChatId))) {
            c.unread_count = 0;
            return;
          }
          const senderId = String(c.sender_id || c.last_message_sender_id || c.from_id || "");
          if (guideId && senderId === guideId) {
            c.unread_count = 0;
            return;
          }

          try {
            const msgRes = await window.TL.ChatApi.getChatMessages(partnerId);
            const msgs = extractArray(msgRes);
            let count = 0;
            msgs.forEach(m => {
              const mSenderId = String(m.sender_id || m.sender?.id || m.from_id || "");
              const isUnread = m.is_read === false || m.is_read === 0 || String(m.is_read) === "0" || String(m.is_read) === "false" || m.read === false;
              if (mSenderId !== guideId && isUnread) {
                count++;
              }
            });
            c.unread_count = count;
          } catch {}
        }));

        chats = updatedChats;
        renderChatSidebar();
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
    if (document.body.dataset.page !== "messages") return;
    
    await loadChatList();
    document.getElementById("chatSendForm")?.addEventListener("submit", handleSendMessage);

    // Poll for incoming message updates every 10 seconds
    setInterval(pollUpdates, 10000);
  }

  document.addEventListener("DOMContentLoaded", init);
})();