/**
 * TAILORA USER — CONTACT PAGE CONTROLLER
 * Handles composing & sending contact messages to the platform/admin,
 * topic selector pills, copy actions, FAQ accordions, pre-filling user info,
 * and displaying sent message history with high visual polish.
 */

(function () {
  "use strict";

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  function showAlert(message, type = "error") {
    const el = document.getElementById("contact-alert");
    if (!el) return;
    el.textContent = message;
    el.className = `tl-auth-alert is-visible${type === "success" ? " tl-auth-alert--success" : ""}`;
  }

  function hideAlert() {
    const el = document.getElementById("contact-alert");
    if (!el) return;
    el.className = "tl-auth-alert";
    el.textContent = "";
  }

  function initUserInfo() {
    const user = window.TL.Auth.getCachedUser() || {};
    const authed = window.TL.Auth.isAuthenticated();

    const nameInput = document.getElementById("contact-name");
    const emailInput = document.getElementById("contact-email");
    const authNote = document.getElementById("contact-auth-note");
    const badgeMount = document.getElementById("user-auth-badge");

    if (nameInput && (user.name || user.full_name || user.username)) {
      nameInput.value = user.name || user.full_name || user.username || "";
      nameInput.readOnly = true;
    }

    if (emailInput && user.email) {
      emailInput.value = user.email || "";
      emailInput.readOnly = true;
    }

    if (badgeMount) {
      if (authed) {
        badgeMount.innerHTML = `
          <span class="tl-verified-badge">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            Verified Traveler
          </span>`;
      } else {
        badgeMount.innerHTML = ``;
      }
    }

    if (authNote) {
      if (!authed) {
        authNote.innerHTML = `
          <div class="tl-alert" style="background:rgba(234,179,8,0.1);border:1px solid rgba(234,179,8,0.25);color:var(--tl-yellow);padding:14px 18px;border-radius:12px;margin-bottom:20px;font-size:13.5px;display:flex;align-items:center;gap:10px;">
            <span style="font-size:18px;">🔒</span>
            <div><strong>Sign in recommended:</strong> Please <a href="signin.html?next=contact.html" style="color:var(--tl-cyan);text-decoration:underline;font-weight:600;">Sign in</a> to record this inquiry in your traveler account.</div>
          </div>`;
        authNote.style.display = "block";
      } else {
        authNote.style.display = "none";
      }
    }
  }

  function initTopicSelector() {
    const selector = document.getElementById("topicSelector");
    const hiddenInput = document.getElementById("contact-subject");
    if (!selector || !hiddenInput) return;

    const buttons = selector.querySelectorAll(".tl-topic-btn");
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        buttons.forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        hiddenInput.value = btn.dataset.topic || "General Inquiry";
      });
    });
  }

  function initCharCounter() {
    const textarea = document.getElementById("contact-message");
    const counter = document.getElementById("contact-char-count");
    if (!textarea || !counter) return;

    textarea.addEventListener("input", () => {
      const len = textarea.value.length;
      counter.textContent = `${len} / 1000`;
      if (len > 900) {
        counter.style.color = "var(--tl-warning)";
      } else {
        counter.style.color = "var(--tl-text-secondary)";
      }
    });
  }

  function initCopyButtons() {
    const copyEmail = document.getElementById("copy-email-btn");
    const copyPhone = document.getElementById("copy-phone-btn");
    const emailLink = document.getElementById("support-email");
    const phoneLink = document.getElementById("support-phone");

    if (copyEmail && emailLink) {
      copyEmail.addEventListener("click", () => {
        const text = emailLink.textContent.trim();
        if (navigator.clipboard) {
          navigator.clipboard.writeText(text);
          window.TL.toast("Email copied to clipboard!", "success");
          copyEmail.textContent = "Copied ✓";
          setTimeout(() => (copyEmail.textContent = "Copy"), 2000);
        }
      });
    }

    if (copyPhone && phoneLink) {
      copyPhone.addEventListener("click", () => {
        const text = phoneLink.textContent.trim();
        if (navigator.clipboard) {
          navigator.clipboard.writeText(text);
          window.TL.toast("Phone number copied to clipboard!", "success");
          copyPhone.textContent = "Copied ✓";
          setTimeout(() => (copyPhone.textContent = "Copy"), 2000);
        }
      });
    }
  }

  function initFaqAccordions() {
    const items = document.querySelectorAll(".tl-faq-item");
    items.forEach((item) => {
      const header = item.querySelector(".tl-faq-header");
      if (header) {
        header.addEventListener("click", () => {
          const wasOpen = item.classList.contains("is-open");
          items.forEach((i) => i.classList.remove("is-open"));
          if (!wasOpen) {
            item.classList.add("is-open");
          }
        });
      }
    });
  }

  function renderHistory() {
    const mount = document.getElementById("contact-history-list");
    if (!mount) return;

    const history = window.TL.Contact.getHistory();
    if (!history || history.length === 0) {
      mount.innerHTML = `
        <div class="tl-empty-state" style="padding:32px 16px;text-align:center;">
          <div style="width:52px;height:52px;margin:0 auto 12px;border-radius:14px;background:rgba(34,211,238,0.12);color:var(--tl-cyan);display:flex;align-items:center;justify-content:center;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="tl-envelope-icon" aria-hidden="true">
              <rect width="20" height="16" x="2" y="4" rx="2"></rect>
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
            </svg>
          </div>
          <h5 style="font-size:15.5px;font-weight:700;margin-bottom:4px;color:var(--tl-text);">No messages sent yet</h5>
          <p class="tl-text-secondary" style="font-size:13px;margin:0;max-width:340px;margin:0 auto;line-height:1.5;">When you send an inquiry, a record of your submission will appear here.</p>
        </div>`;
      return;
    }

    mount.innerHTML = history.map((item) => {
      const dateStr = item.created_at
        ? new Date(item.created_at).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })
        : "Recently Sent";

      return `
        <div class="tl-history-card">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;gap:8px;">
            <strong style="font-size:14.5px;color:var(--tl-text);">${escapeHtml(item.subject || "Inquiry")}</strong>
            <span style="font-size:12px;color:var(--tl-text-secondary);">🗓️ ${escapeHtml(dateStr)}</span>
          </div>
          <p style="font-size:13.5px;color:var(--tl-text-secondary);line-height:1.6;margin:0;white-space:pre-wrap;">${escapeHtml(item.message)}</p>
        </div>
      `;
    }).join("");
  }

  async function loadWebsiteSettings() {
    const emailEl = document.getElementById("support-email");
    const phoneEl = document.getElementById("support-phone");
    const addressEl = document.getElementById("support-address");

    try {
      if (window.TL.Settings && typeof window.TL.Settings.all === "function") {
        const res = await window.TL.Settings.all();
        const settings = (res && (Array.isArray(res) ? res[0] : res.data || res)) || {};

        if (emailEl && (settings.email || settings.support_email)) {
          const email = settings.email || settings.support_email;
          emailEl.textContent = email;
          emailEl.href = `mailto:${email}`;
        }
        if (phoneEl && (settings.phone || settings.support_phone)) {
          const phone = settings.phone || settings.support_phone;
          phoneEl.textContent = phone;
          phoneEl.href = `tel:${phone}`;
        }
        if (addressEl && settings.address) {
          addressEl.textContent = settings.address;
        }
      }
    } catch (e) {
      // Best effort fallback
    }
  }

  function wireForm() {
    const form = document.getElementById("contact-form");
    const submitBtn = document.getElementById("contact-submit-btn");
    const messageInput = document.getElementById("contact-message");
    const subjectInput = document.getElementById("contact-subject");

    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      hideAlert();

      if (!window.TL.Auth.isAuthenticated()) {
        showAlert("Please sign in before sending a contact message.");
        window.TL.toast("Please sign in to send a contact message.", "warning");
        setTimeout(() => {
          window.location.href = "signin.html?next=contact.html";
        }, 1200);
        return;
      }

      const text = messageInput ? messageInput.value.trim() : "";
      const subject = subjectInput ? subjectInput.value.trim() : "General Inquiry";

      if (!text) {
        showAlert("Please enter your message before sending.");
        messageInput?.focus();
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span>Sending…</span>`;
      }

      try {
        const fullMessage = subject && subject !== "General Inquiry"
          ? `[Subject: ${subject}]\n${text}`
          : text;

        await window.TL.Contact.send({
          subject: subject,
          message: fullMessage
        });

        showAlert("Thank you! Your message has been sent successfully. Our support team will review it shortly.", "success");
        window.TL.toast("Contact message sent successfully!", "success");

        if (messageInput) messageInput.value = "";
        const charCount = document.getElementById("contact-char-count");
        if (charCount) charCount.textContent = "0 / 1000";

        renderHistory();
      } catch (err) {
        const msg = err?.message || err?.data?.message || "Failed to send your message. Please try again.";
        showAlert(msg, "error");
        window.TL.toast(msg, "error");
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `<span>Send Message</span> <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="tl-envelope-icon" aria-hidden="true" style="flex-shrink:0;"><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>`;
        }
      }
    });
  }

  function init() {
    initUserInfo();
    initTopicSelector();
    initCharCounter();
    initCopyButtons();
    initFaqAccordions();
    renderHistory();
    loadWebsiteSettings();
    wireForm();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
