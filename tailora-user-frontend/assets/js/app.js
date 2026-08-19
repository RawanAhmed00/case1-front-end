/**
 * TAILORA USER — APP SHELL
 * Shared navigation, footer, theme toggle, mobile drawer,
 * toast notifications, scroll reveal and shared API utilities.
 */

(function () {
  "use strict";

  const NAV_LINKS = [
    { href: "index.html", label: "Home" },
    { href: "destinations.html", label: "Destinations" },
    { href: "plan-trip.html", label: "Plan a Trip" },
    { href: "flights.html", label: "Flights" },
    { href: "experiences.html", label: "Experiences" },
    { href: "hotels.html", label: "Hotels" },
    { href: "restaurants.html", label: "Restaurants" },
    { href: "maps.html", label: "Interactive Map" },
    { href: "chat.html", label: "Chat" },
    { href: "contact.html", label: "Contact Us" }
  ];

  function currentPage() {
    return window.location.pathname.split("/").pop() || "index.html";
  }

  function initials(name) {
    if (!name) return "T";

    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0])
      .join("")
      .toUpperCase();
  }

  function renderNav() {
    const mount = document.getElementById("tl-nav-mount");
    if (!mount) return;

    const page = currentPage();
    const authed = window.TL.Auth.isAuthenticated();
    const user = window.TL.Auth.getCachedUser();

    const displayName =
      (user &&
        (user.name ||
          user.full_name ||
          user.email)) ||
      "Traveler";

    const links = NAV_LINKS.map(
      (l) =>
        `<a href="${l.href}" class="${
          l.href === page ? "is-active" : ""
        }">${l.label}</a>`
    ).join("");

    const authActions = authed
      ? `
        <div class="tl-user-menu">

          <button
            class="tl-user-trigger"
            id="tl-user-trigger"
            aria-haspopup="true"
            aria-expanded="false"
          >
            <span class="tl-user-avatar">
              ${initials(displayName)}
            </span>

            <span class="tl-user-name">
              ${displayName.split(" ")[0]}
            </span>
          </button>

          <div
            class="tl-user-dropdown"
            id="tl-user-dropdown"
            role="menu"
          >
            <a href="profile.html" role="menuitem">
              👤 My Profile
            </a>

            <a href="favorites.html" role="menuitem">
              ♥️ Favorites
            </a>

            <a href="chat.html" role="menuitem">
              💬 Chat
            </a>

            <a href="plan-trip.html" role="menuitem">
              ✦ Plan a Trip
            </a>

            <a href="bookings.html" role="menuitem">
              🧾 My Booking
            </a>

            <a href="weather.html" role="menuitem">
              🌦 Trip Weather
            </a>

            <a href="contact.html" role="menuitem">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="tl-envelope-icon" aria-hidden="true" style="margin-right:6px;vertical-align:-2px;"><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg> Contact Us
            </a>

            <hr>

            <button
              type="button"
              id="tl-logout-btn"
              role="menuitem"
            >
              ⎋ Sign Out
            </button>
          </div>

        </div>
      `
      : `
        <a
          href="signin.html"
          class="tl-btn tl-btn--ghost tl-btn--sm"
        >
          Sign In
        </a>

        <a
          href="signup.html"
          class="tl-btn tl-btn--primary tl-btn--sm"
        >
          Get Started
        </a>
      `;

    mount.innerHTML = `
      <nav class="tl-nav" id="tl-nav">

        <div class="tl-nav-inner">

        <a href="index.html" class="tl-brand">
  <picture class="tl-brand-logo">
    <img
      src="assets/images/logo-light.png"
      alt="Tailora"
      class="tl-logo-light"
    >
    <img
      src="assets/images/logo-dark.png"
      alt="Tailora"
      class="tl-logo-dark"
    >
  </picture>
 
</a>
          <div class="tl-nav-links">
            ${links}
          </div>

          <div class="tl-nav-actions">

            <button
              class="tl-icon-btn"
              id="tl-theme-toggle"
              aria-label="Toggle color theme"
            >
              🌙
            </button>

            ${authActions}

            <button
              class="tl-nav-toggle"
              id="tl-nav-drawer-open"
              aria-label="Open menu"
            >
              ☰
            </button>

          </div>

        </div>

      </nav>

      <div class="tl-drawer" id="tl-drawer">

        <div
          class="tl-drawer-backdrop"
          id="tl-drawer-backdrop"
        ></div>

        <div class="tl-drawer-panel">

          <button
            class="tl-icon-btn tl-drawer-close"
            id="tl-drawer-close"
            aria-label="Close menu"
          >
            ✕
          </button>

          ${NAV_LINKS.map(
            (l) =>
              `<a href="${l.href}">${l.label}</a>`
          ).join("")}

          <div class="tl-drawer-actions">

            ${
              authed
                ? `
                  <a
                    href="profile.html"
                    class="tl-btn tl-btn--ghost"
                  >
                    My Profile
                  </a>

                  <button
                    class="tl-btn tl-btn--outline"
                    id="tl-drawer-logout"
                  >
                    Sign Out
                  </button>
                `
                : `
                  <a
                    href="signin.html"
                    class="tl-btn tl-btn--ghost"
                  >
                    Sign In
                  </a>

                  <a
                    href="signup.html"
                    class="tl-btn tl-btn--primary"
                  >
                    Get Started
                  </a>
                `
            }

          </div>

        </div>

      </div>
    `;

    wireNav();
  }

  function wireNav() {
    const nav = document.getElementById("tl-nav");

    if (nav) {
      window.addEventListener("scroll", () => {
        if (window.scrollY > 24) {
          nav.classList.add("is-scrolled");
        } else {
          nav.classList.remove("is-scrolled");
        }
      });
    }

    const trigger =
      document.getElementById("tl-user-trigger");

    const dropdown =
      document.getElementById("tl-user-dropdown");

    if (trigger && dropdown) {
      trigger.addEventListener("click", (e) => {
        e.stopPropagation();

        dropdown.classList.toggle("is-open");
      });

      document.addEventListener("click", () => {
        dropdown.classList.remove("is-open");
      });
    }

    const logoutBtn =
      document.getElementById("tl-logout-btn");

    if (logoutBtn) {
      logoutBtn.addEventListener(
        "click",
        () => window.TL.Auth.logout()
      );
    }

    const drawerLogout =
      document.getElementById(
        "tl-drawer-logout"
      );

    if (drawerLogout) {
      drawerLogout.addEventListener(
        "click",
        () => window.TL.Auth.logout()
      );
    }

    const drawer =
      document.getElementById("tl-drawer");

    const openBtn =
      document.getElementById(
        "tl-nav-drawer-open"
      );

    const closeBtn =
      document.getElementById(
        "tl-drawer-close"
      );

    const backdrop =
      document.getElementById(
        "tl-drawer-backdrop"
      );

    if (openBtn && drawer) {
      openBtn.addEventListener(
        "click",
        () => drawer.classList.add("is-open")
      );
    }

    if (closeBtn && drawer) {
      closeBtn.addEventListener(
        "click",
        () => drawer.classList.remove("is-open")
      );
    }

    if (backdrop && drawer) {
      backdrop.addEventListener(
        "click",
        () => drawer.classList.remove("is-open")
      );
    }

    const themeToggle =
      document.getElementById(
        "tl-theme-toggle"
      );

    if (themeToggle) {
      themeToggle.addEventListener(
        "click",
        toggleTheme
      );

      themeToggle.textContent =
        document.documentElement.getAttribute(
          "data-theme"
        ) === "light"
          ? "☀️"
          : "🌙";
    }
  }

  function toggleTheme() {
    const root =
      document.documentElement;

    const next =
      root.getAttribute("data-theme") ===
      "light"
        ? "dark"
        : "light";

    if (next === "light") {
      root.setAttribute(
        "data-theme",
        "light"
      );
    } else {
      root.removeAttribute(
        "data-theme"
      );
    }

    localStorage.setItem(
      "tailora_theme",
      next
    );

    const btn =
      document.getElementById(
        "tl-theme-toggle"
      );

    if (btn) {
      btn.textContent =
        next === "light"
          ? "☀️"
          : "🌙";
    }
  }

  function applyStoredTheme() {
    const stored =
      localStorage.getItem(
        "tailora_theme"
      );

    if (stored === "light") {
      document.documentElement.setAttribute(
        "data-theme",
        "light"
      );
    }
  }

  function renderFooter() {
    const mount =
      document.getElementById(
        "tl-footer-mount"
      );

    if (!mount) return;

    const year =
      new Date().getFullYear();

    mount.innerHTML = `
      <footer class="tl-footer">

        <div class="tl-container">

          <div class="tl-footer-grid">

            <div class="tl-footer-brand">

            <a href="index.html" class="tl-brand">
               <picture class="tl-brand-logo">
            <img
              src="assets/images/logo-light.png"
               alt="Tailora"
              class="tl-logo-light"
         >
          <img
           src="assets/images/logo-dark.png"
             alt="Tailora"
           class="tl-logo-dark"
                    >
             </picture>
      
                </a>

              <p>
                AI-crafted trips tailored to how
                you actually want to travel —
                your pace, your budget, your aura.
              </p>

            </div>

            <div class="tl-footer-col">

              <h4>Explore</h4>

              <a href="destinations.html">
                Destinations
              </a>

              <a href="hotels.html">
                Hotels
              </a>

              <a href="restaurants.html">
                Restaurants
              </a>

              <a href="experiences.html">
                Experiences
              </a>

            </div>

            <div class="tl-footer-col">

              <h4>Plan</h4>

              <a href="plan-trip.html">
                Plan a Trip
              </a>

              <a href="flights.html">
                Flights
              </a>

              <a href="bookings.html">
                My Booking
              </a>

              <a href="weather.html">
                Trip Weather
              </a>

              <a href="favorites.html">
                Favorites
              </a>

              <a href="chat.html">
                Chat
              </a>

              <a href="profile.html">
                My Trips
              </a>

            </div>

            <div class="tl-footer-col">

              <h4>Account</h4>

              <a href="signin.html">
                Sign In
              </a>

              <a href="signup.html">
                Create Account
              </a>

              <a href="index.html#about">
                About Tailora
              </a>

              <a href="contact.html">
                Contact Support
              </a>

            </div>

          </div>

          <div class="tl-footer-bottom">

            <span>
              © ${year} Tailora.
              All journeys, tailored.
            </span>

            <div class="tl-footer-social">

              <a
                href="#"
                class="tl-icon-btn"
                aria-label="Instagram"
              >
                ◎
              </a>

              <a
                href="#"
                class="tl-icon-btn"
                aria-label="X"
              >
                ✕
              </a>

              <a
                href="#"
                class="tl-icon-btn"
                aria-label="TikTok"
              >
                ♪
              </a>

            </div>

          </div>

        </div>

      </footer>
    `;
  }

  function initReveal() {
    const els =
      document.querySelectorAll(
        ".tl-reveal"
      );

    if (
      !("IntersectionObserver" in window) ||
      !els.length
    ) {
      els.forEach((el) =>
        el.classList.add("is-visible")
      );

      return;
    }

    const io =
      new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {

              entry.target.classList.add(
                "is-visible"
              );

              io.unobserve(
                entry.target
              );
            }
          });
        },
        {
          threshold: 0.12
        }
      );

    els.forEach((el) =>
      io.observe(el)
    );
  }

  function toast(
    message,
    type = "success"
  ) {
    let region =
      document.getElementById(
        "tl-toast-region"
      );

    if (!region) {
      region =
        document.createElement(
          "div"
        );

      region.id =
        "tl-toast-region";

      document.body.appendChild(
        region
      );
    }

    const el =
      document.createElement(
        "div"
      );

    el.className =
      `tl-toast tl-toast--${type}`;

    el.textContent =
      message;

    region.appendChild(el);

    setTimeout(
      () => el.remove(),
      4200
    );
  }

  /* ================================================================
   * UTIL
   * ================================================================ */

  const Util = {

    pick(obj, keys, fallback) {

      if (!obj) {
        return fallback;
      }

      for (const key of keys) {

        const value =
          key.split(".").reduce(
            (acc, part) => {

              if (
                acc &&
                acc[part] !== undefined
              ) {
                return acc[part];
              }

              return undefined;

            },
            obj
          );

        if (
          value !== undefined &&
          value !== null &&
          value !== ""
        ) {
          return value;
        }
      }

      return fallback;
    },

    /*
     * Normal objects:
     * name
     *
     * Countries returned by Laravel:
     * country_information.name
     */

    name(
      obj,
      fallback = "Untitled"
    ) {

      return Util.pick(
        obj,
        [

          "name",
          "title",
          "city_name",
          "hotel_name",
          "restaurant_name",

          // Laravel Countries response
          "country_information.name",

          // Raw Countries API response
          "names.common",
          "names.official",

          // Extra fallback
          "country_information.official_name"

        ],
        fallback
      );
    },

    /*
     * Normal objects:
     * image / image_url / photo...
     *
     * Countries:
     * flag.png
     */

    image(
      obj,
      fallback
    ) {

      return Util.pick(
        obj,
        [

          "image",
          "image_url",
          "photo",
          "photo_url",
          "cover_image",
          "thumbnail",
          "main_image",

          "images.0",
          "images.0.url",

          // Laravel Countries response
          "flag.png",

          // Raw Countries API response
          "flag.url_png"

        ],
        fallback
      );
    },

    price(obj) {

      return Util.pick(
        obj,
        [
          "price_per_night",
          "price",
          "average_price",
          "cost",
          "average_cost"
        ],
        null
      );
    },

    rating(obj) {

      return Util.pick(
        obj,
        [
          "rating",
          "average_rating",
          "stars"
        ],
        null
      );
    },

    country(obj) {
      if (!obj) return "";
      const val = Util.pick(
        obj,
        [
          "country.name",
          "country_name",
          "country.country_name",
          "country.common",
          "country_information.name",
          "names.common",
          "names.official",
          "country_information.official_name",
          "country"
        ],
        ""
      );
      if (typeof val === "object" && val !== null) {
        return val.name || val.common || val.country_name || "";
      }
      return typeof val === "string" ? val : (val ? String(val) : "");
    },

    city(obj) {
      if (!obj) return "";
      const val = Util.pick(
        obj,
        [
          "city.name",
          "city_name",
          "city.city_name",
          "locality",
          "location.city",
          "city"
        ],
        ""
      );
      if (typeof val === "object" && val !== null) {
        return val.name || val.city_name || "";
      }
      return typeof val === "string" ? val : (val ? String(val) : "");
    },

    description(obj) {

      return Util.pick(
        obj,
        [
          "description",
          "summary",
          "about",
          "details"
        ],
        ""
      );
    },

    /*
     * Country ID:
     * Prefer actual database id if available.
     * Otherwise use country code.
     */

    id(obj) {

      return Util.pick(
        obj,
        [

          "id",
          "uuid",
          "_id",

          // Laravel Countries response
          "country_information.code2",
          "country_information.code3",

          // Raw Countries API response
          "codes.alpha_2",
          "codes.alpha_3"

        ],
        null
      );
    },

    /*
     * Normalize API list responses.
     */

    list(response) {

      // Response is already an array
      if (
        Array.isArray(response)
      ) {
        return response;
      }

      // Laravel Resource:
      // { data: [...] }
      if (
        response &&
        Array.isArray(
          response.data
        )
      ) {
        return response.data;
      }

      // Generic:
      // { results: [...] }
      if (
        response &&
        Array.isArray(
          response.results
        )
      ) {
        return response.results;
      }

      // Countries API:
      // { data: { objects: [...] } }
      if (
        response &&
        response.data &&
        Array.isArray(
          response.data.objects
        )
      ) {
        return response.data.objects;
      }

      // Extra possible wrapper
      if (
        response &&
        response.data &&
        response.data.data &&
        Array.isArray(
          response.data.data
        )
      ) {
        return response.data.data;
      }

      return [];
    },

    uniqueBy(items, keyFn) {
      if (!Array.isArray(items)) return [];
      const seen = new Set();
      const result = [];
      for (const item of items) {
        if (!item) continue;
        let key;
        if (typeof keyFn === "function") {
          key = keyFn(item);
        } else if (typeof keyFn === "string") {
          key = Util.pick(item, [keyFn], "");
        } else {
          key = Util.name(item);
        }
        key = String(key || "").trim().toLowerCase();
        if (key && !seen.has(key)) {
          seen.add(key);
          result.push(item);
        }
      }
      return result;
    },

    escape(str) {
      if (str === null || str === undefined) return "";
      if (typeof str === "object") {
        str = str.name || str.title || str.label || "";
      }
      const div = document.createElement("div");
      div.textContent = String(str);
      return div.innerHTML;
    },

    money(
      value,
      currency = "$"
    ) {

      if (
        value === null ||
        value === undefined ||
        value === ""
      ) {
        return null;
      }

      const n =
        Number(value);

      return Number.isFinite(n)
        ? `${currency}${n.toLocaleString()}`
        : String(value);
    },

    skeletonCards(
      count,
      className =
        "tl-place-card"
    ) {

      return Array.from({
        length: count
      })
        .map(
          () => `
            <div
              class="${className} tl-card"
            >

              <div
                class="tl-skel"
                style="aspect-ratio:4/3;"
              ></div>

              <div
                style="padding:18px;"
              >

                <div
                  class="tl-skel"
                  style="
                    height:16px;
                    width:70%;
                    margin-bottom:10px;
                  "
                ></div>

                <div
                  class="tl-skel"
                  style="
                    height:12px;
                    width:45%;
                  "
                ></div>

              </div>

            </div>
          `
        )
        .join("");
    },

    errorState(
      message,
      retry
    ) {

      return `
        <div class="tl-state">

          <div class="tl-state-icon">
            ⚠️
          </div>

          <h3>
            Something went off course
          </h3>

          <p>
            ${Util.escape(
              message ||
              "We couldn't load this right now. Please try again."
            )}
          </p>

          ${
            retry
              ? `
                <button
                  class="tl-btn tl-btn--outline"
                  onclick="(${retry})()"
                >
                  Try Again
                </button>
              `
              : ""
          }

        </div>
      `;
    },

    emptyState(
      title,
      message
    ) {

      return `
        <div class="tl-state">

          <div class="tl-state-icon">
            🧭
          </div>

          <h3>
            ${Util.escape(title)}
          </h3>

          <p>
            ${Util.escape(message)}
          </p>

        </div>
      `;
    },

    /*
     * Format dates consistently:
     * "17 Aug 2026" for dates only
     * "17 Aug 2026 • 2:30 PM" for dates with time
     */
    formatDate(
      dateStr,
      includeTime = false
    ) {
      if (!dateStr) return "—";

      try {
        const date = new Date(dateStr);

        if (Number.isNaN(date.getTime())) {
          return dateStr;
        }

        if (includeTime) {
          const dateStr = date.toLocaleString(
            "en-US",
            {
              day: "numeric",
              month: "short",
              year: "numeric"
            }
          );
          const timeStr = date.toLocaleString(
            "en-US",
            {
              hour: "numeric",
              minute: "2-digit",
              hour12: true
            }
          );
          return `${dateStr} • ${timeStr}`;
        } else {
          return date.toLocaleString(
            "en-US",
            {
              day: "numeric",
              month: "short",
              year: "numeric"
            }
          );
        }
      } catch (_) {
        return String(dateStr);
      }
    }
  };

  /* ================================================================
   * TOUR GUIDE CHAT NOTIFICATIONS (Only when tour guide sends message)
   * ================================================================ */

  async function checkUnreadChatNotifications() {
    if (!window.TL?.Auth?.isAuthenticated()) return;
    try {
      if (!window.TL?.Api) return;
      const res = await window.TL.Api.get("/chats");
      const chats = (res && (Array.isArray(res) ? res : res.data)) || [];
      if (!Array.isArray(chats)) return;

      const user = (window.TL.Auth.getCachedUser && window.TL.Auth.getCachedUser()) || {};
      const currentUserId = String(user.id || "");

      let guideUnreadTotal = 0;

      const currentUserName = (user.name || user.full_name || user.username || "").toLowerCase();

      for (const c of chats) {
        const partner = c.partner || c.guide || c.tour_guide || c.user || c.traveler || {};
        const partnerId = partner.id || partner.user_id || c.guide_id || c.user_id || c.id;
        if (!partnerId) continue;

        try {
          const msgRes = await window.TL.Api.get(`/chats/${partnerId}`);
          const msgs = (msgRes && (Array.isArray(msgRes) ? msgRes : (msgRes.data || msgRes.messages))) || [];
          if (Array.isArray(msgs)) {
            msgs.forEach((m) => {
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
              const isSentByCurrentUser = Boolean(
                (currentUserId && mSenderId === currentUserId) ||
                m.is_sender === true ||
                m.sent_by_me === true ||
                String(m.is_sender) === "1" ||
                String(m.sent_by_me) === "1" ||
                (currentUserName && m.sender?.name && String(m.sender.name).toLowerCase() === currentUserName)
              );
              const isFromTourGuide = !isSentByCurrentUser;

              // ONLY count messages sent by the tour guide
              if (isFromTourGuide && !isRead) {
                guideUnreadTotal++;
              }
            });
          }
        } catch (e) {}
      }

      updateNavChatBadge(guideUnreadTotal);
    } catch (e) {}
  }

  function updateNavChatBadge(count) {
    const parsed = parseInt(count, 10) || 0;
    const chatLinks = document.querySelectorAll('a[href="chat.html"]');
    chatLinks.forEach((link) => {
      let badge = link.querySelector(".tl-nav-chat-badge");
      if (parsed > 0) {
        if (!badge) {
          badge = document.createElement("span");
          badge.className = "tl-nav-chat-badge";
          badge.style.cssText = "display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;padding:0 5px;background:#ef4444;color:#fff;font-size:11px;font-weight:700;border-radius:10px;margin-left:6px;vertical-align:middle;";
          link.appendChild(badge);
        }
        badge.textContent = String(parsed);
        badge.style.display = "inline-flex";
      } else if (badge) {
        badge.remove();
      }
    });
  }

  /* ================================================================
   * INITIALIZE
   * ================================================================ */

  document.addEventListener(
    "DOMContentLoaded",
    () => {

      applyStoredTheme();

      renderNav();

      renderFooter();

      initReveal();

      if (window.location.pathname.indexOf("chat.html") === -1) {
        checkUnreadChatNotifications();
        setInterval(checkUnreadChatNotifications, 15000);
      }

    }
  );

  window.TL =
    window.TL || {};

  window.TL.checkUnreadMessages =
    checkUnreadChatNotifications;

  window.TL.toast =
    toast;

  window.TL.Util =
    Util;

})();