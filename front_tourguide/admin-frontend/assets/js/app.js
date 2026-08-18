/* ==========================================================================
   TAILORA ADMIN — app.js
   Step 1 scope: global shell only.
   - Builds the reusable sidebar + topbar into every authenticated page
     from a single config, so no page hand-writes that markup twice.
   - Wires the desktop collapse toggle and the real Bootstrap 5 Offcanvas
     for mobile/tablet (no fake slide-in / overlay code).
   - Exposes showLoading()/hideLoading() and showToast() on window.TL,
     with no auto-fired toasts and the loader hidden by default.
   No API calls. No authentication logic. No fake data. That starts later.
   ========================================================================== */

(function () {
  "use strict";

  /* -----------------------------------------------------------------------
     1. NAVIGATION CONFIG
     Single source of truth for the sidebar. Each page declares which
     item is active via <body data-page="...">.
     ----------------------------------------------------------------------- */
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

  const LOGO_PATH = "assets/images/logo.png";

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

  /* -----------------------------------------------------------------------
     3. SIDEBAR RENDERING
     Rendered as a responsive Bootstrap Offcanvas:
     - Below the lg breakpoint (992px): real offcanvas — hidden by default,
       slides in with a backdrop, closes on backdrop click / Esc.
     - At lg and above: Bootstrap keeps it always visible in the layout;
       our own CSS then pins it to a fixed rail (see components.css).
     ----------------------------------------------------------------------- */
  function buildSidebarHtml(activePage) {
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
      <div class="offcanvas-header d-lg-none">
        <span class="tl-visually-hidden">Navigation</span>
        <button type="button" class="btn-close" data-bs-dismiss="offcanvas" data-bs-target="#tlSidebar" aria-label="Close navigation"></button>
      </div>
      <div class="offcanvas-body d-flex flex-column p-0">
        <div class="tl-sidebar__brand">
          <img src="${LOGO_PATH}" alt="Tailora">
          <span class="tl-sidebar__wordmark tl-body">Tailora</span>
        </div>
        <nav class="tl-sidebar__nav" aria-label="Primary">
          ${groups}
        </nav>
        <div class="tl-sidebar__footer">
          <div class="tl-admin-card">
            <div class="tl-avatar">A</div>
            <div class="tl-admin-card__meta">
              <div class="name">Admin</div>
              <div class="role">Administrator</div>
            </div>
          </div>
          <button type="button" class="tl-btn tl-btn--outline tl-btn--sm tl-logout-btn" id="tlLogoutBtn">
            <i class="bi bi-box-arrow-right"></i>
            <span>Log out</span>
          </button>
        </div>
      </div>`;
  }

  function renderSidebar(activePage) {
    const mount = qs("#tlSidebar");
    if (!mount) return;
    mount.innerHTML = buildSidebarHtml(activePage);
  }

  /* -----------------------------------------------------------------------
     4. TOPBAR RENDERING
     ----------------------------------------------------------------------- */
  function buildTopbarHtml(pageTitle, breadcrumbTrail) {
    const trail = (breadcrumbTrail || [])
      .map((crumb, i, arr) => {
        const isLast = i === arr.length - 1;
        return `<span>${escapeHtml(crumb)}</span>${isLast ? "" : ' <i class="bi bi-chevron-right tl-breadcrumb__chevron"></i> '}`;
      })
      .join("");

    return `
      <div class="tl-topbar__left">
        <button type="button" class="tl-sidebar-toggle" id="tlSidebarToggle" aria-label="Toggle navigation" data-bs-toggle="offcanvas" data-bs-target="#tlSidebar" aria-controls="tlSidebar">
          <i class="bi bi-list"></i>
        </button>
        <div class="tl-breadcrumb">
          <div class="tl-breadcrumb__trail">${trail}</div>
          <div class="tl-breadcrumb__title">${escapeHtml(pageTitle)}</div>
        </div>
      </div>
      <div class="tl-topbar__right">
        <button type="button" class="tl-icon-btn" id="tlNotificationBtn" aria-label="Notifications">
          <i class="bi bi-bell"></i>
          <span class="tl-icon-btn__dot" id="tlNotificationDot"></span>
        </button>
        <div class="dropdown">
          <button type="button" class="tl-profile-trigger" data-bs-toggle="dropdown" aria-expanded="false">
            <div class="tl-avatar">A</div>
            <span class="tl-profile-name tl-body">Admin</span>
            <i class="bi bi-chevron-down"></i>
          </button>
          <ul class="dropdown-menu dropdown-menu-end tl-dropdown-menu">
            <li><a class="dropdown-item text-light" href="settings.html"><i class="bi bi-gear me-2"></i>Settings</a></li>
            <li><hr class="dropdown-divider"></li>
            <li><button class="dropdown-item text-light" type="button" id="tlLogoutBtnTop"><i class="bi bi-box-arrow-right me-2"></i>Log out</button></li>
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
     5. DESKTOP COLLAPSE TOGGLE
     Below lg, the same toggle button opens the Bootstrap Offcanvas
     (handled declaratively by its data-bs-* attributes). At lg and
     above there is no offcanvas behavior, so we collapse the rail
     to icons instead.
     ----------------------------------------------------------------------- */
  function wireCollapseToggle() {
    document.addEventListener("click", function (e) {
      const btn = e.target.closest("#tlSidebarToggle");
      if (!btn) return;
      if (window.innerWidth >= 992) {
        // Bootstrap's offcanvas JS still fires for the data attributes even
        // at desktop width; harmless since our CSS keeps it visible. We
        // additionally toggle the collapsed rail state for desktop users.
        qs(".tl-app").classList.toggle("is-collapsed");
      }
    });
  }

  /* -----------------------------------------------------------------------
     6. LOADING OVERLAY
     ----------------------------------------------------------------------- */
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

  /* -----------------------------------------------------------------------
     7. TOAST SYSTEM (Bootstrap 5 Toast, Tailora-styled)
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

    const instance = new bootstrap.Toast(toastEl, { delay: 4200 });
    instance.show();
    toastEl.addEventListener("hidden.bs.toast", function () {
      toastEl.remove();
    });
  }

  /* -----------------------------------------------------------------------
     8. INIT
     Reads <body data-page="dashboard" data-page-title="Dashboard"
     data-breadcrumb="Overview,Dashboard"> to render the shell.
     ----------------------------------------------------------------------- */
  function init() {
    const body = document.body;
    const activePage = body.dataset.page || "";
    const pageTitle = body.dataset.pageTitle || "";
    const breadcrumb = (body.dataset.breadcrumb || "").split(",").map((s) => s.trim()).filter(Boolean);

    renderSidebar(activePage);
    renderTopbar(pageTitle, breadcrumb);
    wireCollapseToggle();
    ensureLoadingOverlay();
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
})();
