/**
 * TAILORA TOUR GUIDE — GLOBAL APP SHELL
 * Renders reusable sidebar, topbar, theme switcher, unread message notifications,
 * toast alerts, loading overlay, and logout handlers.
 */

(function () {
  "use strict";

  const NAV_SECTIONS = [
    {
      label: "Overview",
      items: [
        { id: "dashboard", label: "Dashboard", href: "dashboard.html", icon: "bi-speedometer2" }
      ]
    },
    {
      label: "Tour Operations",
      items: [
        { id: "requests", label: "Booking Requests", href: "requests.html", icon: "bi-inbox" },
        { id: "schedule", label: "Tour Schedule", href: "schedule.html", icon: "bi-calendar3" },
        { id: "availabilities", label: "Availabilities", href: "availabilities.html", icon: "bi-clock-history" }
      ]
    },
    {
      label: "Growth & Messages",
      items: [
        { id: "messages", label: "Messages & Chat", href: "messages.html", icon: "bi-chat-dots" },
        { id: "reviews", label: "Ratings & Reviews", href: "reviews.html", icon: "bi-star" },
        { id: "earnings", label: "Earnings & Financials", href: "earnings.html", icon: "bi-cash-stack" }
      ]
    },
    {
      label: "Account",
      items: [
        { id: "profile", label: "Profile & Settings", href: "profile.html", icon: "bi-person-gear" }
      ]
    }
  ];

  const LOGO_DARK_PATH = "assets/images/logo.png";
  const LOGO_LIGHT_PATH = "assets/images/logo-light.png";

  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  function getTheme() {
    return localStorage.getItem("tailora_theme") || "dark";
  }

  function getLogoPath() {
    return getTheme() === "light" ? LOGO_LIGHT_PATH : LOGO_DARK_PATH;
  }

  function applyStoredTheme() {
    const theme = getTheme();
    if (theme === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "light" ? "dark" : "light";

    if (next === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }

    localStorage.setItem("tailora_theme", next);

    const btnIcon = qs("#tlThemeToggleIcon");
    if (btnIcon) {
      btnIcon.className = next === "light" ? "bi bi-sun-fill" : "bi bi-moon-stars-fill";
    }

    const logoImg = qs("#tlSidebarLogo");
    if (logoImg) {
      logoImg.src = next === "light" ? LOGO_LIGHT_PATH : LOGO_DARK_PATH;
    }
  }

  function buildSidebarHtml(activePage) {
    const user = (window.TL.Auth && window.TL.Auth.getCachedUser()) || { name: "Tour Guide", role: "Tour Guide" };
    const initial = ((user && user.name) || "T")[0].toUpperCase();

    const groups = NAV_SECTIONS.map(section => {
      const links = section.items.map(item => {
        const active = item.id === activePage ? " is-active" : "";
        const ariaCurrent = item.id === activePage ? ' aria-current="page"' : "";
        return `
          <a href="${item.href}" class="tl-nav-link${active}"${ariaCurrent} data-nav-id="${item.id}" title="${escapeHtml(item.label)}">
            <i class="bi ${item.icon}"></i>
            <span class="tl-nav-link__label">${escapeHtml(item.label)}</span>
          </a>`;
      }).join("");

      return `
        <div class="tl-nav-group">
          <div class="tl-nav-group__label">${escapeHtml(section.label)}</div>
          ${links}
        </div>`;
    }).join("");

    return `
      <div class="offcanvas-header d-lg-none p-3 border-bottom border-secondary border-opacity-25">
        <span class="fw-bold text-light">Navigation Menu</span>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas" data-bs-target="#tlSidebar" aria-label="Close navigation"></button>
      </div>
      <div class="offcanvas-body d-flex flex-column p-0">
        <div class="tl-sidebar__brand">
          <img src="${getLogoPath()}" alt="Tailora Logo" id="tlSidebarLogo">
          <span class="tl-sidebar__wordmark">Tailora</span>
          <span class="tl-sidebar__badge">Guide</span>
        </div>
        <nav class="tl-sidebar__nav" aria-label="Primary">
          ${groups}
        </nav>
        <div class="tl-sidebar__footer">
          <div class="tl-user-card">
            <div class="tl-avatar">${initial}</div>
            <div class="tl-user-card__meta">
              <div class="name">${escapeHtml((user && user.name) || "Tour Guide")}</div>
              <div class="role">${escapeHtml((user && user.role) || "Tour Guide")}</div>
            </div>
          </div>
          <button type="button" class="tl-btn tl-btn--outline tl-btn--sm tl-btn--block" id="tlLogoutBtn">
            <i class="bi bi-box-arrow-right"></i>
            <span>Sign Out</span>
          </button>
        </div>
      </div>`;
  }

  function renderSidebar(activePage) {
    const mount = qs("#tlSidebar");
    if (mount) mount.innerHTML = buildSidebarHtml(activePage);
  }

  function buildTopbarHtml(pageTitle, breadcrumbTrail) {
    const user = (window.TL.Auth && window.TL.Auth.getCachedUser()) || { name: "Tour Guide" };
    const initial = ((user && user.name) || "T")[0].toUpperCase();
    const currentTheme = getTheme();
    const themeIcon = currentTheme === "light" ? "bi-sun-fill" : "bi-moon-stars-fill";

    const trail = (breadcrumbTrail || []).map((crumb, i, arr) => {
      const isLast = i === arr.length - 1;
      return `<span>${escapeHtml(crumb)}</span>${isLast ? "" : ' <i class="bi bi-chevron-right tl-breadcrumb__chevron ms-1 me-1"></i> '}`;
    }).join("");

    return `
      <div class="tl-topbar__left">
        <button type="button" class="tl-sidebar-toggle" id="tlSidebarToggle" aria-label="Toggle navigation">
          <i class="bi bi-list"></i>
        </button>
        <div class="tl-breadcrumb">
          <div class="tl-breadcrumb__trail">${trail}</div>
          <div class="tl-breadcrumb__title">${escapeHtml(pageTitle)}</div>
        </div>
      </div>
      <div class="tl-topbar__right">
        <!-- Theme Toggle Button -->
        <button type="button" class="tl-icon-btn" id="tlThemeToggleBtn" aria-label="Toggle light/dark theme" title="Toggle Light/Dark Theme">
          <i class="bi ${themeIcon}" id="tlThemeToggleIcon"></i>
        </button>

        <!-- Notification / Unread Messages Button -->
        <a href="messages.html" class="tl-icon-btn" id="tlNotificationBtn" aria-label="Messages & Notifications" title="View Messages">
          <i class="bi bi-bell"></i>
          <span class="tl-icon-btn__dot" id="tlNotificationDot"></span>
        </a>

        <!-- User Dropdown Menu -->
        <div class="dropdown">
          <button type="button" class="tl-profile-trigger" data-bs-toggle="dropdown" aria-expanded="false">
            <div class="tl-avatar">${initial}</div>
            <span class="tl-profile-name tl-body">${escapeHtml(user.name.split(" ")[0])}</span>
            <i class="bi bi-chevron-down ms-1" style="font-size: 11px;"></i>
          </button>
          <ul class="dropdown-menu dropdown-menu-end tl-dropdown-menu">
            <li><a class="dropdown-item" href="profile.html"><i class="bi bi-person me-2"></i>Guide Profile</a></li>
            <li><a class="dropdown-item" href="messages.html"><i class="bi bi-chat-dots me-2"></i>Messages</a></li>
            <li><hr class="dropdown-divider border-secondary opacity-25"></li>
            <li><button class="dropdown-item text-danger" type="button" id="tlLogoutBtnTop"><i class="bi bi-box-arrow-right me-2"></i>Sign Out</button></li>
          </ul>
        </div>
      </div>`;
  }

  function renderTopbar(pageTitle, breadcrumbTrail) {
    const mount = qs("#tlTopbar");
    if (mount) mount.innerHTML = buildTopbarHtml(pageTitle, breadcrumbTrail);
  }

  function applyStoredSidebarState() {
    const isCollapsed = localStorage.getItem("tailora_sidebar_collapsed") === "true";
    const app = qs(".tl-app");
    if (app) {
      if (isCollapsed) {
        app.classList.add("is-collapsed");
      } else {
        app.classList.remove("is-collapsed");
      }
    }
  }

  function wireCollapseToggle() {
    document.addEventListener("click", function (e) {
      const btn = e.target.closest("#tlSidebarToggle");
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();

      if (window.innerWidth >= 992) {
        const app = qs(".tl-app");
        if (app) {
          app.classList.toggle("is-collapsed");
          const isCollapsed = app.classList.contains("is-collapsed");
          localStorage.setItem("tailora_sidebar_collapsed", isCollapsed ? "true" : "false");
        }
      } else {
        const sidebarEl = qs("#tlSidebar");
        if (sidebarEl && window.bootstrap) {
          const bsOffcanvas = window.bootstrap.Offcanvas.getOrCreateInstance(sidebarEl);
          bsOffcanvas.toggle();
        }
      }
    });

    document.addEventListener("click", function (e) {
      if (e.target.closest("#tlThemeToggleBtn")) {
        toggleTheme();
      }
      if (e.target.closest("#tlLogoutBtn") || e.target.closest("#tlLogoutBtnTop")) {
        if (window.TL.Auth) window.TL.Auth.logout();
      }
    });
  }

  function ensureLoadingOverlay() {
    if (qs("#tlLoadingOverlay")) return;
    const el = document.createElement("div");
    el.id = "tlLoadingOverlay";
    el.className = "tl-loading-overlay";
    el.innerHTML = '<div class="tl-spinner" role="status" aria-label="Loading"></div>';
    document.body.appendChild(el);
  }

  function showLoading() {
    ensureLoadingOverlay();
    qs("#tlLoadingOverlay").classList.add("is-visible");
  }

  function hideLoading() {
    const el = qs("#tlLoadingOverlay");
    if (el) el.classList.remove("is-visible");
  }

  function showToast(message, type = "info") {
    let container = qs("#tlToastContainer");
    if (!container) {
      container = document.createElement("div");
      container.id = "tlToastContainer";
      container.className = "tl-toast-container";
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `tl-toast tl-toast--${type}`;
    const iconCls = type === "success" ? "bi-check-circle-fill text-success" : type === "error" ? "bi-exclamation-triangle-fill text-danger" : "bi-info-circle-fill text-info";
    toast.innerHTML = `
      <i class="bi ${iconCls} fs-5"></i>
      <div class="flex-grow-1">${escapeHtml(message)}</div>
      <button type="button" class="btn-close btn-close-white ms-2" aria-label="Close"></button>
    `;

    toast.querySelector(".btn-close").addEventListener("click", () => toast.remove());
    container.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) toast.remove();
    }, 4500);
  }

  let unreadPollInterval = null;

  function startUnreadPolling() {
    if (unreadPollInterval) {
      clearInterval(unreadPollInterval);
      unreadPollInterval = null;
    }
    unreadPollInterval = setInterval(() => {
      checkUnreadMessages();
    }, 15000);
  }

  function stopUnreadPolling() {
    if (unreadPollInterval) {
      clearInterval(unreadPollInterval);
      unreadPollInterval = null;
    }
  }

  async function checkUnreadMessages() {
    if (!window.TL.ChatApi || !window.TL.Auth || !window.TL.Auth.isAuthenticated()) {
      stopUnreadPolling();
      return;
    }

    try {
      let count = 0;
      const currentUser = window.TL.Auth.getCachedUser() || {};
      const guideId = String(currentUser.id || "");

      // 1. Primary: Aggregation from GET /chats
      const chatsRes = await window.TL.ChatApi.getChats().catch(() => null);
      if (chatsRes) {
        const chatsList = Array.isArray(chatsRes.data) ? chatsRes.data : (Array.isArray(chatsRes) ? chatsRes : (chatsRes.chats || []));
        chatsList.forEach(c => {
          const senderId = String(c.sender_id || c.last_message_sender_id || c.from_id || "");
          if (guideId && senderId === guideId) {
            return;
          }

          let uCount = 0;
          if (c.unread_count !== undefined) uCount = parseInt(c.unread_count) || 0;
          else if (c.unreadCount !== undefined) uCount = parseInt(c.unreadCount) || 0;
          else if (c.unread_messages_count !== undefined) uCount = parseInt(c.unread_messages_count) || 0;
          else if (c.unread === true || c.is_read === false || c.read === false || c.has_unread === true) uCount = 1;
          else if (typeof c.unread === "number") uCount = c.unread;

          count += uCount;
        });
      }

      // 2. Secondary: Check GET /chats/unread-count
      const res = await window.TL.ChatApi.getUnreadCount().catch(() => null);
      if (res) {
        const rawCount = res.unread_count !== undefined ? res.unread_count : (res.count !== undefined ? res.count : (res.data && res.data.unread_count !== undefined ? res.data.unread_count : (res.data && res.data.count !== undefined ? res.data.count : 0)));
        const apiCount = parseInt(rawCount) || 0;
        count = Math.max(count, apiCount);
      }

      const dot = qs("#tlNotificationDot");
      if (!dot) return;

      if (count > 0) {
        dot.textContent = count > 99 ? "99+" : String(count);
        dot.classList.add("is-visible");
      } else {
        dot.textContent = "";
        dot.classList.remove("is-visible");
      }
    } catch {}
  }

  function init() {
    applyStoredTheme();
    applyStoredSidebarState();
    const body = document.body;
    const activePage = body.dataset.page || "";
    const pageTitle = body.dataset.pageTitle || "";
    const breadcrumb = (body.dataset.breadcrumb || "").split(",").map(s => s.trim()).filter(Boolean);

    if (body.dataset.requiresAuth === "true") {
      renderSidebar(activePage);
      renderTopbar(pageTitle, breadcrumb);
      wireCollapseToggle();
      ensureLoadingOverlay();
      checkUnreadMessages();
      startUnreadPolling();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.TL = window.TL || {};
  window.TL.escapeHtml = escapeHtml;
  window.TL.showLoading = showLoading;
  window.TL.hideLoading = hideLoading;
  window.TL.showToast = showToast;
  window.TL.checkUnreadMessages = checkUnreadMessages;
  window.TL.stopUnreadPolling = stopUnreadPolling;
})();
