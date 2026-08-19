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

  function sortMessagesChronologically(msgs) {
    if (!Array.isArray(msgs)) return [];
    return [...msgs].sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      if (timeA && timeB && timeA !== timeB && !isNaN(timeA) && !isNaN(timeB)) {
        return timeA - timeB;
      }
      return (parseInt(a.id, 10) || 0) - (parseInt(b.id, 10) || 0);
    });
  }

  function formatMessageTime(dateStr) {
    if (!dateStr) return "Just now";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "Just now";
      return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
    } catch {
      return "Just now";
    }
  }

  function getMessageDateGroup(dateStr) {
    if (!dateStr) return "Today";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "Today";
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      if (d.toDateString() === today.toDateString()) {
        return "Today";
      } else if (d.toDateString() === yesterday.toDateString()) {
        return "Yesterday";
      } else {
        return d.toLocaleDateString([], {
          month: "short",
          day: "numeric",
          year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined
        });
      }
    } catch {
      return "Today";
    }
  }

  /**
   * Evaluates messages in a conversation using real API data and timestamps to determine:
   * 1. Accurate unread messages received by the user from the tour guide.
   * 2. The exact latest/most recent message sent in the chat (by user or guide).
   */
  function processConversationMessages(c, msgs, currentUserId, currentActiveId) {
    const partnerId = getPartnerUserId(c);
    const isActive = currentActiveId && (String(partnerId) === String(currentActiveId) || String(c.id) === String(currentActiveId));

    let unreadFromGuideCount = 0;
    let lastMsgPreview = "";

    const currentUser = getCurrentUser();
    const currentUserName = (currentUser.name || currentUser.full_name || currentUser.username || "").toLowerCase();

    if (Array.isArray(msgs) && msgs.length > 0) {
      // Sort chronologically by timestamp (oldest first, newest last)
      const sorted = sortMessagesChronologically(msgs);

      sorted.forEach((m) => {
        const mSenderId = String(m.sender_id || m.sender?.id || m.from_id || "");
        const isRead =
          m.is_read === true ||
          m.is_read === 1 ||
          String(m.is_read) === "1" ||
          String(m.is_read) === "true" ||
          m.read === true ||
          m.read === 1 ||
          String(m.read) === "1" ||
          String(m.read) === "true" ||
          m.status === "read" ||
          m.seen === true ||
          String(m.seen) === "1" ||
          String(m.seen) === "true" ||
          Boolean(m.read_at);
        const isUnread = !isRead;

        const isSentByCurrentUser = Boolean(
          (currentUserId && mSenderId === currentUserId) ||
          m.is_sender === true ||
          m.sent_by_me === true ||
          String(m.is_sender) === "1" ||
          String(m.sent_by_me) === "1" ||
          (currentUserName && m.sender?.name && String(m.sender.name).toLowerCase() === currentUserName)
        );
        const isFromTourGuide = !isSentByCurrentUser;

        // ONLY count unread messages sent by the tour guide (received by user)
        if (isFromTourGuide && isUnread) {
          unreadFromGuideCount++;
        }
      });

      // The exact most recent message in the conversation (whether user or guide sent it)
      const lastMsg = sorted[sorted.length - 1];
      if (lastMsg) {
        const isSentByMe = Boolean(
          (currentUserId && String(lastMsg.sender_id || lastMsg.sender?.id || "") === currentUserId) ||
          lastMsg.is_sender === true ||
          lastMsg.sent_by_me === true ||
          String(lastMsg.is_sender) === "1" ||
          String(lastMsg.sent_by_me) === "1" ||
          (currentUserName && lastMsg.sender?.name && String(lastMsg.sender.name).toLowerCase() === currentUserName)
        );
        const rawText = lastMsg.message || lastMsg.content || "";
        lastMsgPreview = isSentByMe ? (rawText.startsWith("You: ") ? rawText : `You: ${rawText}`) : rawText;
        c.last_message_at = lastMsg.created_at || new Date().toISOString();
        c.last_message_timestamp = lastMsg.created_at ? new Date(lastMsg.created_at).getTime() : Date.now();
      }
    }

    if (lastMsgPreview) {
      c.last_message = lastMsgPreview;
    }
    c.unread_count = isActive ? 0 : unreadFromGuideCount;
    return c.unread_count;
  }

  async function loadChatList() {
    try {
      let rawChats = [];
      try {
        const res = await window.TL.ChatApi.getChats();
        rawChats = extractArray(res);
      } catch (err) {
        console.warn("Backend chats fetch note:", err);
      }

      // Also retrieve database tour guides from schedule if available
      try {
        let guides = [];
        if (window.TL && window.TL.TourGuide && typeof window.TL.TourGuide.getTourGuides === "function") {
          guides = await window.TL.TourGuide.getTourGuides();
        } else if (window.TL && window.TL.TourGuide && typeof window.TL.TourGuide.getSchedule === "function") {
          const schedules = await window.TL.TourGuide.getSchedule();
          schedules.forEach((s) => {
            if (s.tour_guide && s.tour_guide.id) {
              if (!guides.some((g) => g.id === s.tour_guide.id)) guides.push(s.tour_guide);
            } else if (s.tour_guide_id) {
              if (!guides.some((g) => g.id === s.tour_guide_id)) guides.push({ id: s.tour_guide_id, name: s.tour_guide_name || "Tour Guide" });
            }
          });
        }

        guides.forEach((g) => {
          const guideId = String(g.id);
          const exists = rawChats.some((c) => {
            const pid = getPartnerUserId(c);
            return pid === guideId || String(c.id) === guideId || String(c.guide_id) === guideId || String(c.user_id) === guideId;
          });
          if (!exists) {
            rawChats.push({
              id: guideId,
              user_id: guideId,
              guide_id: guideId,
              partner: { id: guideId, name: g.name || "Tour Guide" },
              name: g.name || "Tour Guide",
              last_message: "Start a conversation",
              unread_count: 0
            });
          }
        });
      } catch (gErr) {
        console.warn("Tour guide schedule discovery note:", gErr);
      }

      chats = rawChats;

      const currentUser = getCurrentUser();
      const currentUserId = String(currentUser.id || "");

      let totalUnread = 0;

      // Populate exact unread counts strictly from tour guide messages using allSettled for resilience
      await Promise.allSettled(
        chats.map(async (c) => {
          const partnerId = getPartnerUserId(c);
          if (!partnerId) return;
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

      // Sort chats by latest activity (most recent message at top)
      chats.sort((a, b) => {
        const timeA = a.last_message_timestamp || (a.last_message_at ? new Date(a.last_message_at).getTime() : 0);
        const timeB = b.last_message_timestamp || (b.last_message_at ? new Date(b.last_message_at).getTime() : 0);
        return timeB - timeA;
      });

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
            last_message: "Start a conversation",
            unread_count: 0
          });
        }
      }

      let chatToSelect = null;
      let nameToSelect = null;

      if (targetUserId) {
        const existing = findChatForUser(targetUserId);
        chatToSelect = existing ? getPartnerUserId(existing) : targetUserId;
        nameToSelect = targetName;
      } else if (!activeChatId && chats.length > 0 && window.innerWidth >= 768) {
        chatToSelect = getPartnerUserId(chats[0]);
      }

      renderChatSidebar();
      updateTotalUnreadBadge(totalUnread);

      if (chatToSelect) {
        await selectChat(chatToSelect, nameToSelect);
      }
    } catch (err) {
      renderChatSidebar();
      console.error("Failed to load chats:", err);
    }
  }

  function updateTotalUnreadBadge(count) {
    const badge = document.getElementById("chatTotalUnreadBadge");
    if (!badge) return;
    const parsed = parseInt(count, 10) || 0;
    if (parsed > 0) {
      badge.textContent = String(parsed);
      badge.style.setProperty("display", "inline-flex", "important");
      badge.removeAttribute("hidden");
    } else {
      badge.textContent = "0";
      badge.style.setProperty("display", "none", "important");
      badge.setAttribute("hidden", "hidden");
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

    listContainer.innerHTML = chats
      .map((c) => {
        const partner = c.partner || c.guide || c.tour_guide || c.user || c.traveler || {};
        const partnerId = getPartnerUserId(c);
        const displayName = partner.name || c.name || c.guide_name || c.traveler_name || "Tour Guide";
        const avatar = displayName.length > 0 ? displayName.charAt(0).toUpperCase() : "G";
        const chatId = partnerId;

        const isActive = String(chatId) === String(activeChatId) || String(c.id) === String(activeChatId);
        // Notification badge: unread messages sent by the tour guide
        const unreadVal = isActive ? 0 : (parseInt(c.unread_count, 10) || 0);

        return `
          <div class="tl-chat-item ${isActive ? "is-active" : ""}" data-chat-id="${escapeHtml(chatId)}" data-partner-id="${escapeHtml(partnerId)}" data-name="${escapeHtml(displayName)}">
            <div class="tl-avatar">${escapeHtml(avatar)}</div>
            <div class="tl-chat-item__info">
              <div class="tl-chat-item__name">
                <span class="text-truncate">${escapeHtml(displayName)}</span>
                ${unreadVal > 0 ? `<span class="tl-chat-badge" title="${unreadVal} new message${unreadVal > 1 ? "s from guide" : " from guide"}">${unreadVal}</span>` : ""}
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

    // Opening the chat clears its unread notification count
    if (existingChat) {
      existingChat.unread_count = 0;
      existingChat.unreadCount = 0;
      existingChat.unread = 0;
    }

    // Recalculate total unread count immediately upon opening the chat
    const totalUnread = chats.reduce((sum, c) => sum + (c.unread_count || 0), 0);
    updateTotalUnreadBadge(totalUnread);

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

    // Sort messages strictly by sending time (oldest at top to newest at bottom)
    const sortedMsgs = sortMessagesChronologically(msgs);

    const currentUser = getCurrentUser();
    const currentUserId = String(currentUser.id || "");
    const currentUserName = (currentUser.name || currentUser.full_name || "").toLowerCase();
    const partnerId = String(activeChatId || "");

    let lastGroupDate = null;
    let html = "";

    sortedMsgs.forEach((m) => {
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

      // Check if we need to insert a date divider for the flow of time
      const dateGroup = getMessageDateGroup(m.created_at);
      if (dateGroup !== lastGroupDate) {
        lastGroupDate = dateGroup;
        html += `<div class="tl-chat-date-divider"><span>${escapeHtml(dateGroup)}</span></div>`;
      }

      const bubbleCls = isSent ? "tl-message--sent" : "tl-message--received";
      const timeStr = formatMessageTime(m.created_at);

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

      html += `
        <div class="tl-message-bubble ${bubbleCls}" id="msg-${m.id}">
          <div>${escapeHtml(m.message || m.content)}</div>
          <div class="tl-message__meta">
            <span>${escapeHtml(timeStr)}</span>
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
    });

    thread.innerHTML = html;

    // Smoothly scroll to the newest message at the bottom
    requestAnimationFrame(() => {
      thread.scrollTop = thread.scrollHeight;
    });

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

    // Immediately reflect the user's sent message in the active conversations sidebar
    const existing = findChatForUser(recipientId);
    if (existing) {
      existing.last_message = `You: ${text}`;
      renderChatSidebar();
    }

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

        // Sort chats by latest activity (most recent message at top)
        chats.sort((a, b) => {
          const timeA = a.last_message_timestamp || (a.last_message_at ? new Date(a.last_message_at).getTime() : 0);
          const timeB = b.last_message_timestamp || (b.last_message_at ? new Date(b.last_message_at).getTime() : 0);
          return timeB - timeA;
        });

        renderChatSidebar();
        updateTotalUnreadBadge(totalUnread);
        if (typeof window.TL.checkUnreadMessages === "function") {
          window.TL.checkUnreadMessages();
        }
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