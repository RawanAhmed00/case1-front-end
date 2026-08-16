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
    { href: "chat.html", label: "Chat" }
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

      return Util.pick(
        obj,
        [
          "country",
          "country_name",
          "country.name",

          // Laravel Countries response
          "country_information.name"
        ],
        ""
      );
    },

    city(obj) {

      return Util.pick(
        obj,
        [
          "city",
          "city_name",
          "city.name"
        ],
        ""
      );
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

    escape(str) {

      const div =
        document.createElement(
          "div"
        );

      div.textContent =
        str == null
          ? ""
          : String(str);

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
    }
  };

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

    }
  );

  window.TL =
    window.TL || {};

  window.TL.toast =
    toast;

  window.TL.Util =
    Util;

})();