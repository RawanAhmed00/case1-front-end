/* ==========================================================================
   TAILORA ADMIN — app.js
   Global shell, dynamic authenticated user/guide name & role, persistent
   sidebar visibility toggle (shown by default), Dark & Light theme,
   loading overlay, and toasts.
   ========================================================================== */

(function () {
  "use strict";

  /* -----------------------------------------------------------------------
     1. CONSTANTS & STORAGE KEYS
     ----------------------------------------------------------------------- */
  const THEME_KEY = "tailora_theme";
  const SIDEBAR_HIDDEN_KEY = "tailora_sidebar_hidden";
  const LOGO_PATH = "images/logo.png";
  const LOGO_LIGHT = "images/logo-light.png"; // light-mode logo (if present)
  const LOGO_DARK = "images/logo-dark.png"; // dark-mode logo (if present)

  const NAV_SECTIONS = [
    {
      label: "Overview",
      items: [
        { id: "dashboard", label: "Dashboard", href: "dashboard.html", icon: "bi-speedometer2" },
      ],
    },
    {
      label: "Management",
      items: [
        { id: "users", label: "Users", href: "users.html", icon: "bi-people" },
        { id: "trips", label: "Trips", href: "trips.html", icon: "bi-map" },
        { id: "destinations", label: "Destinations", href: "destinations.html", icon: "bi-geo-alt" },
        { id: "hotels", label: "Hotels", href: "hotels.html", icon: "bi-building" },
        { id: "restaurants", label: "Restaurants", href: "restaurants.html", icon: "bi-cup-hot" },
        { id: "categories", label: "Categories", href: "categories.html", icon: "bi-grid" },
        { id: "reviews", label: "Reviews", href: "reviews.html", icon: "bi-star" },
        { id: "bookings", label: "Bookings", href: "bookings.html", icon: "bi-calendar-check" },
        { id: "messages", label: "Contact Messages", href: "messages.html", icon: "bi-envelope" },
      ],
    },
    {
      label: "Insights & System",
      items: [
        { id: "analytics", label: "Analytics", href: "analytics.html", icon: "bi-graph-up" },
        { id: "settings", label: "Website Settings", href: "settings.html", icon: "bi-gear" },
      ],
    },
  ];

  /* -----------------------------------------------------------------------
     2. HELPERS
     ----------------------------------------------------------------------- */
  function qs(sel, ctx) {
    return (ctx || document).querySelector(sel);
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  function getUserInfo() {
    let name = "Admin";
    let role = "Administrator";

    if (window.TL && window.TL.Auth) {
      if (typeof window.TL.Auth.getUserName === "function") {
        name = window.TL.Auth.getUserName() || "Admin";
      }
      if (typeof window.TL.Auth.getUser === "function") {
        const user = window.TL.Auth.getUser();
        if (user && user.role) {
          if (user.role === "t_guide") role = "Tour Guide";
          else if (user.role === "admin") role = "Administrator";
          else role = user.role.charAt(0).toUpperCase() + user.role.slice(1);
        }
      }
    }

    const initial = (name.charAt(0) || "A").toUpperCase();
    return { name, role, initial };
  }

  /* -----------------------------------------------------------------------
     3. THEME SYSTEM (Dark / Light Mode)
     ----------------------------------------------------------------------- */
  function getTheme() {
    try {
      return localStorage.getItem(THEME_KEY) || "dark";
    } catch (_) {
      return "dark";
    }
  }

  function setTheme(theme) {
    const validTheme = theme === "light" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", validTheme);
    try {
      localStorage.setItem(THEME_KEY, validTheme);
    } catch (_) {}

    const themeBtn = qs("#tlThemeToggle");
    if (themeBtn) {
      themeBtn.innerHTML = `<i class="bi ${validTheme === "light" ? "bi-moon-stars" : "bi-sun"}"></i>`;
      themeBtn.setAttribute("title", validTheme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode");
    }
  }

  function toggleTheme() {
    const current = getTheme();
    const next = current === "light" ? "dark" : "light";
    setTheme(next);
    showToast(`Switched to ${next === "light" ? "Light" : "Dark"} Mode`, "info");
  }

  /* -----------------------------------------------------------------------
     4. SIDEBAR RENDERING & VISIBILITY STATE (Shown by default)
     ----------------------------------------------------------------------- */
  function isSidebarHidden() {
    try {
      return localStorage.getItem(SIDEBAR_HIDDEN_KEY) === "true";
    } catch (_) {
      return false; // Default: Shown
    }
  }

  function setSidebarHidden(hidden) {
    try {
      localStorage.setItem(SIDEBAR_HIDDEN_KEY, hidden ? "true" : "false");
    } catch (_) {}
  }

  function applySidebarState() {
    const app = qs(".tl-app");
    if (!app) return;

    if (window.innerWidth >= 992) {
      app.classList.remove("is-sidebar-mobile-open");
      if (isSidebarHidden()) {
        app.classList.add("is-sidebar-hidden");
      } else {
        app.classList.remove("is-sidebar-hidden");
      }
    } else {
      app.classList.remove("is-sidebar-hidden");
    }
  }

  function buildSidebarHtml(activePage) {
    const { name: userName, role: userRole, initial: userInitial } = getUserInfo();

    const groups = NAV_SECTIONS.map((section) => {
      const links = section.items
        .map((item) => {
          const active = item.id === activePage ? " is-active" : "";
          const ariaCurrent = item.id === activePage ? ' aria-current="page"' : "";
          return `
            <a href="${item.href}" class="tl-nav-link${active}"${ariaCurrent} data-nav-id="${item.id}">
              <i class="bi ${item.icon}"></i>
              <span class="tl-nav-link__label">${escapeHtml(item.label)}</span>
            </a>`;
        })
        .join("");

      return `
        <div class="tl-nav-group">
          <div class="tl-nav-group__label">${escapeHtml(section.label)}</div>
          ${links}
        </div>`;
    }).join("");

    return `
      <div class="tl-sidebar__brand">
        <span class="tl-brand-logo">
          <img src="${LOGO_LIGHT}" alt="Tailora" class="tl-logo-light" onerror="this.onerror=null;this.src='${LOGO_PATH}'">
          <img src="${LOGO_DARK}" alt="Tailora" class="tl-logo-dark" onerror="this.onerror=null;this.src='${LOGO_PATH}'">
        </span>

        <button type="button" class="tl-sidebar-close" id="tlSidebarCloseBtn" aria-label="Close sidebar">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>
      <nav class="tl-sidebar__nav" aria-label="Primary">
        ${groups}
      </nav>
      <div class="tl-sidebar__footer">
        <div class="tl-admin-card">
          <div class="tl-avatar">${escapeHtml(userInitial)}</div>
          <div class="tl-admin-card__meta">
            <div class="name">${escapeHtml(userName)}</div>
            <div class="role">${escapeHtml(userRole)}</div>
          </div>
        </div>
        <button type="button" class="tl-btn tl-btn--outline tl-btn--sm tl-logout-btn" id="tlLogoutBtn">
          <i class="bi bi-box-arrow-right"></i>
          <span>Log out</span>
        </button>
      </div>`;
  }

  function ensureBackdrop() {
    let backdrop = qs(".tl-sidebar-backdrop");
    if (!backdrop) {
      backdrop = document.createElement("div");
      backdrop.className = "tl-sidebar-backdrop";
      document.body.appendChild(backdrop);
    }
    return backdrop;
  }

  function renderSidebar(activePage) {
    const mount = qs("#tlSidebar");
    if (!mount) return;
    mount.innerHTML = buildSidebarHtml(activePage);
  }

  /* -----------------------------------------------------------------------
     5. TOPBAR RENDERING
     ----------------------------------------------------------------------- */
  function buildTopbarHtml(pageTitle, breadcrumbTrail) {
    const { name: userName, initial: userInitial } = getUserInfo();
    const currentTheme = getTheme();

    const trail = (breadcrumbTrail || [])
      .map((crumb, i, arr) => {
        const isLast = i === arr.length - 1;
        return `<span>${escapeHtml(crumb)}</span>${isLast ? "" : ' <i class="bi bi-chevron-right tl-breadcrumb__chevron"></i> '}`;
      })
      .join("");

    return `
      <div class="tl-topbar__left">
        <button type="button" class="tl-sidebar-toggle" id="tlSidebarToggle" aria-label="Toggle navigation" title="Toggle Sidebar">
          <i class="bi bi-list"></i>
        </button>
        <div class="tl-breadcrumb">
          <div class="tl-breadcrumb__trail">${trail}</div>
          <div class="tl-breadcrumb__title">${escapeHtml(pageTitle)}</div>
        </div>
      </div>
      <div class="tl-topbar__right">
        <!-- Theme Switcher -->
        <button type="button" class="tl-icon-btn" id="tlThemeToggle" aria-label="Toggle Theme" title="${currentTheme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}">
          <i class="bi ${currentTheme === 'light' ? 'bi-moon-stars' : 'bi-sun'}"></i>
        </button>

        <!-- Notification Bell -->
        <button type="button" class="tl-icon-btn" id="tlNotificationBtn" aria-label="Notifications">
          <i class="bi bi-bell"></i>
          <span class="tl-icon-btn__dot" id="tlNotificationDot"></span>
        </button>

        <!-- User Profile Dropdown -->
        <div class="dropdown">
          <button type="button" class="tl-profile-trigger" data-bs-toggle="dropdown" aria-expanded="false">
            <div class="tl-avatar">${escapeHtml(userInitial)}</div>
            <span class="tl-profile-name tl-body">${escapeHtml(userName)}</span>
            <i class="bi bi-chevron-down"></i>
          </button>
          <ul class="dropdown-menu dropdown-menu-end tl-dropdown-menu">
            <li><a class="dropdown-item" href="settings.html"><i class="bi bi-gear me-2"></i>Settings</a></li>
            <li><button class="dropdown-item" type="button" id="tlThemeToggleMenu"><i class="bi bi-circle-half me-2"></i>Toggle Theme</button></li>
            <li><hr class="dropdown-divider"></li>
            <li><button class="dropdown-item" type="button" id="tlLogoutBtnTop"><i class="bi bi-box-arrow-right me-2"></i>Log out</button></li>
          </ul>
        </div>
      </div>`;
  }

  function renderTopbar(pageTitle, breadcrumbTrail) {
    const mount = qs("#tlTopbar");
    if (!mount) return;
    mount.innerHTML = buildTopbarHtml(pageTitle, breadcrumbTrail);
  }

  /* -----------------------------------------------------------------------
     6. WIRE SIDEBAR & THEME LISTENERS
     ----------------------------------------------------------------------- */
  function wireEventListeners() {
    document.addEventListener("click", function (e) {
      // Toggle button in Topbar
      const toggleBtn = e.target.closest("#tlSidebarToggle");
      if (toggleBtn) {
        const app = qs(".tl-app");
        if (!app) return;

        if (window.innerWidth >= 992) {
          const isHiddenNow = app.classList.toggle("is-sidebar-hidden");
          setSidebarHidden(isHiddenNow);
        } else {
          app.classList.toggle("is-sidebar-mobile-open");
        }
        return;
      }

      // Close button or Mobile Backdrop click
      const closeTarget = e.target.closest("#tlSidebarCloseBtn, .tl-sidebar-backdrop");
      if (closeTarget) {
        const app = qs(".tl-app");
        if (app) {
          app.classList.remove("is-sidebar-mobile-open");
        }
        return;
      }

      // Theme Toggle Buttons
      const themeBtn = e.target.closest("#tlThemeToggle, #tlThemeToggleMenu");
      if (themeBtn) {
        toggleTheme();
        return;
      }
    });

    window.addEventListener("resize", function () {
      applySidebarState();
    });
  }

  /* -----------------------------------------------------------------------
     7. LOADING OVERLAY
     ----------------------------------------------------------------------- */
  function ensureLoadingOverlay() {
    let el = qs("#tlLoadingOverlay");
    if (!el) {
      el = document.createElement("div");
      el.id = "tlLoadingOverlay";
      el.className = "tl-loading-overlay";
      el.innerHTML = '<div class="tl-spinner" role="status" aria-label="Loading"></div>';
      document.body.appendChild(el);
    }
    return el;
  }

  function showLoading() {
    const el = ensureLoadingOverlay();
    el.classList.add("is-visible");
  }

  function hideLoading() {
    const el = qs("#tlLoadingOverlay");
    if (el) {
      el.classList.remove("is-visible");
    }
    document.querySelectorAll(".tl-loading-overlay.is-visible").forEach(o => o.classList.remove("is-visible"));
  }

  /* -----------------------------------------------------------------------
     8. TOAST SYSTEM
     ----------------------------------------------------------------------- */
  const TOAST_META = {
    success: { icon: "bi-check-lg", cls: "tl-toast--success" },
    error: { icon: "bi-x-lg", cls: "tl-toast--error" },
    warning: { icon: "bi-exclamation-lg", cls: "tl-toast--warning" },
    info: { icon: "bi-info-lg", cls: "tl-toast--info" },
  };

  function ensureToastContainer() {
    let el = qs("#tlToastContainer");
    if (!el) {
      el = document.createElement("div");
      el.id = "tlToastContainer";
      el.className = "tl-toast-container";
      document.body.appendChild(el);
    }
    return el;
  }

  function showToast(message, type) {
    const meta = TOAST_META[type] || TOAST_META.info;
    const container = ensureToastContainer();

    const toastEl = document.createElement("div");
    toastEl.className = `toast tl-toast ${meta.cls}`;
    toastEl.setAttribute("role", "status");
    toastEl.setAttribute("aria-live", "polite");
    toastEl.setAttribute("aria-atomic", "true");
    toastEl.innerHTML = `
      <div class="toast-body">
        <span class="tl-toast__icon"><i class="bi ${meta.icon}"></i></span>
        <div class="flex-grow-1">${escapeHtml(message)}</div>
        <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>`;

    container.appendChild(toastEl);

    if (window.bootstrap && window.bootstrap.Toast) {
      const instance = new window.bootstrap.Toast(toastEl, { delay: 4200 });
      instance.show();
      toastEl.addEventListener("hidden.bs.toast", function () {
        toastEl.remove();
      });
    }
  }

  /* -----------------------------------------------------------------------
     9. INIT
     ----------------------------------------------------------------------- */
  function init() {
    // Apply saved theme immediately
    setTheme(getTheme());

    const body = document.body;
    const activePage = body.dataset.page || "";
    const pageTitle = body.dataset.pageTitle || "";
    const breadcrumb = (body.dataset.breadcrumb || "").split(",").map((s) => s.trim()).filter(Boolean);

    ensureBackdrop();
    renderSidebar(activePage);
    renderTopbar(pageTitle, breadcrumb);
    applySidebarState();
    wireEventListeners();
    hideLoading();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  /* Public API */
  window.TL = window.TL || {};
  window.TL.showLoading = showLoading;
  window.TL.hideLoading = hideLoading;
  window.TL.showToast = showToast;
  window.TL.toggleTheme = toggleTheme;
  window.TL.setTheme = setTheme;
  window.TL.getTheme = getTheme;
  window.TL.renderShell = function() {
    const body = document.body;
    renderSidebar(body.dataset.page || "");
    renderTopbar(body.dataset.pageTitle || "", (body.dataset.breadcrumb || "").split(",").map((s) => s.trim()).filter(Boolean));
    applySidebarState();
  };
})();
