/**
 * TAILORA USER — TRIP DETAILS / ITINERARY
 * GET /trips/trips/{id}/full  (falls back to GET /trips/{id})
 * GET /weather/trips/{tripId} (best-effort — not every trip will have it)
 * DELETE /trips/{id}
 *
 * The exact shape of a "complete trip" isn't documented, so day/city/
 * attraction data is read through TL.Util.pick with several candidate
 * field names rather than assumed.
 */
(function () {
  "use strict";

  const FALLBACK_IMG =
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=600&q=70";

  let currentDayIndex = 0;
  let days = [];

  function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function renderHeader(trip) {
    let countryName = window.TL.Util.pick(
      trip,
      ["country.name", "country_name", "countryName"],
      ""
    );
    if (typeof countryName === "object" && countryName !== null) {
      countryName = countryName.name || countryName.country_name || "";
    }
    if (!countryName && typeof trip.country === "string") {
      countryName = trip.country;
    }
    if (!countryName && Array.isArray(trip?.days)) {
      for (const day of trip.days) {
        const c = window.TL.Util.pick(day, ["country.name", "country_name", "country", "city.country.name", "city.country_name"], "");
        const cName = typeof c === "object" && c !== null ? (c.name || c.country_name) : c;
        if (cName && String(cName).trim() && String(cName).toLowerCase() !== "destination" && String(cName).toLowerCase() !== "custom trip") {
          countryName = String(cName).trim();
          break;
        }
      }
    }

    if (!countryName) {
      const destField = window.TL.Util.pick(trip, ["destination", "city"], "");
      if (typeof destField === "object" && destField !== null) {
        const dName = destField.country || destField.country_name || destField.name || "";
        if (dName && dName.toLowerCase() !== "destination") countryName = String(dName).trim();
      } else if (typeof destField === "string" && destField.trim() && destField.toLowerCase() !== "destination" && destField.toLowerCase() !== "custom trip") {
        countryName = destField.trim();
      }
    }

    const rawTitle = String(window.TL.Util.pick(trip, ["title", "name"], "")).trim();
    let title = countryName;
    if (!title && rawTitle && !rawTitle.toLowerCase().startsWith("untitled") && !rawTitle.toLowerCase().startsWith("trip #") && !rawTitle.toLowerCase().startsWith("custom trip") && rawTitle.toLowerCase() !== "your trip" && rawTitle.toLowerCase() !== "destination") {
      title = rawTitle.replace(/^trip to\s+/i, "").replace(/\s+trip$/i, "").trim();
    }
    if (!title) {
      title = "Trip";
    }

    const start = window.TL.Util.pick(
      trip,
      ["start_date", "starts_at"],
      ""
    );

    const end = window.TL.Util.pick(
      trip,
      ["end_date", "ends_at"],
      ""
    );

    const status = window.TL.Util.pick(
      trip,
      ["status"],
      ""
    );

    const budget = window.TL.Util.pick(
      trip,
      ["budget"],
      ""
    );

    const travelers = window.TL.Util.pick(
      trip,
      ["travelers"],
      ""
    );

    const formattedStart = start
      ? window.TL.Util.formatDate(start)
      : "";

    const formattedEnd = end
      ? window.TL.Util.formatDate(end)
      : "";

    document.getElementById("trip-header").innerHTML = `
      <span class="tl-eyebrow">Your Itinerary</span>

      <h1
        class="tl-display tl-mt-8"
        style="font-size:clamp(26px,3.6vw,40px);"
      >
        ${window.TL.Util.escape(title)}
      </h1>

      <div class="tl-chip-row tl-mt-16">

        ${
          countryName
            ? `<span class="tl-badge">
                📍 ${window.TL.Util.escape(countryName)}
              </span>`
            : ""
        }

        ${
          formattedStart
            ? `<span class="tl-badge">
                🗓️ ${formattedStart}${
                  formattedEnd
                    ? ` – ${formattedEnd}`
                    : ""
                }
              </span>`
            : ""
        }

        ${
          budget
            ? `<span class="tl-badge">
                💳 ${window.TL.Util.escape(budget)}
              </span>`
            : ""
        }

        ${
          travelers
            ? `<span class="tl-badge">
                🧳 ${window.TL.Util.escape(travelers)}
                traveler${Number(travelers) === 1 ? "" : "s"}
              </span>`
            : ""
        }

        ${
          status
            ? `<span class="tl-badge">
                ${window.TL.Util.escape(status)}
              </span>`
            : ""
        }

      </div>
    `;
  }

  async function renderWeather(tripId) {
    const mount = document.getElementById("trip-weather");

    try {
      const response =
        await window.TL.Weather.get(tripId);

      const entries =
        window.TL.Util.list(response);

      const list = entries.length
        ? entries
        : response &&
          typeof response === "object"
        ? [response]
        : [];

      if (!list.length) return;

      mount.innerHTML = list
        .slice(0, 7)
        .map((w) => {
          const date = window.TL.Util.pick(
            w,
            ["date"],
            ""
          );

          const temp = window.TL.Util.pick(
            w,
            ["temperature", "temp"],
            ""
          );

          const condition = window.TL.Util.pick(
            w,
            [
              "condition",
              "description",
              "summary"
            ],
            ""
          );

          return `
            <span class="tl-pill">

              ${
                date
                  ? window.TL.Util.escape(date) +
                    " · "
                  : ""
              }

              ${
                temp !== ""
                  ? `${window.TL.Util.escape(temp)}° `
                  : ""
              }

              ${window.TL.Util.escape(condition)}

            </span>
          `;
        })
        .join("");

    } catch (err) {
      /*
       * Weather is best-effort.
       * Silently omit if unavailable.
       */
    }
  }

  function extractDays(trip) {
    return (
      window.TL.Util.pick(
        trip,
        [
          "days",
          "trip_days",
          "itinerary"
        ],
        []
      ) || []
    );
  }

  // Format date for day tabs
  // Example:
  // 2026-08-18T00:00:00.000000Z
  // becomes:
  // Aug 18, 2026
  function dayLabel(day, index) {
    const date = window.TL.Util.pick(
      day,
      ["date"],
      ""
    );

    if (!date) {
      return `Day ${index + 1}`;
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return `Day ${index + 1}`;
    }

    return parsedDate.toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric"
      }
    );
  }

  function timelineItem(item) {
    const name =
      window.TL.Util.name(item);

    const time =
      window.TL.Util.pick(
        item,
        ["time", "start_time"],
        ""
      );

    const img =
      window.TL.Util.image(
        item,
        FALLBACK_IMG
      );

    const desc =
      window.TL.Util.description(item);

    return `
      <div class="tl-timeline-item">

        <div class="tl-timeline-dot"></div>

        <div class="tl-card tl-timeline-card">

          <div class="tl-timeline-media">
            <img
              src="${img}"
              alt=""
              onerror="this.src='${FALLBACK_IMG}'"
            >
          </div>

          <div class="tl-timeline-text">

            <strong>
              ${window.TL.Util.escape(name)}
            </strong>

            <span>
              ${
                desc
                  ? window.TL.Util.escape(desc)
                  : "Added to your itinerary"
              }
            </span>

          </div>

          ${
            time
              ? `<div class="tl-timeline-time">
                  ${window.TL.Util.escape(time)}
                </div>`
              : ""
          }

        </div>

      </div>
    `;
  }

  function renderDayTabs() {
    const mount =
      document.getElementById(
        "trip-day-tabs"
      );

    if (!days.length) {
      mount.innerHTML = "";
      return;
    }

    mount.innerHTML = days
      .map(
        (day, i) => `
          <button
            type="button"
            class="tl-pill${
              i === currentDayIndex
                ? " is-active"
                : ""
            }"
            data-day="${i}"
          >
            ${window.TL.Util.escape(
              dayLabel(day, i)
            )}
          </button>
        `
      )
      .join("");

    mount
      .querySelectorAll(
        "button[data-day]"
      )
      .forEach((btn) => {

        btn.addEventListener(
          "click",
          () => {

            currentDayIndex =
              Number(btn.dataset.day);

            renderDayTabs();

            renderTimeline();
          }
        );

      });
  }

  function renderTimeline() {
    const mount =
      document.getElementById(
        "trip-timeline"
      );

    if (!days.length) {

      mount.innerHTML =
        window.TL.Util.emptyState(
          "Your itinerary is still taking shape",
          "This trip doesn't have day-by-day details yet. Head back to the planner to add cities and experiences."
        ) +
        `
        <div class="tl-text-center">
          <a
            class="tl-btn tl-btn--primary tl-btn--sm"
            href="plan-trip.html"
          >
            Continue Planning
          </a>
        </div>
        `;

      return;
    }

    const day =
      days[currentDayIndex];

    const city =
      window.TL.Util.pick(
        day,
        [
          "city.name",
          "city_name"
        ],
        ""
      );

    const attractions =
      window.TL.Util.pick(
        day,
        [
          "attractions",
          "activities"
        ],
        []
      ) || [];

    const cityRow = city
      ? `
        <div class="tl-timeline-item">

          <div class="tl-timeline-dot"></div>

          <div class="tl-card tl-timeline-card">

            <div class="tl-timeline-text">

              <strong>
                📍 ${window.TL.Util.escape(city)}
              </strong>

              <span>
                Base for this day
              </span>

            </div>

          </div>

        </div>
      `
      : "";

    const items =
      Array.isArray(attractions)
        ? attractions
            .map(timelineItem)
            .join("")
        : "";

    mount.innerHTML = `
      <div class="tl-timeline">

        ${cityRow}

        ${
          items ||
          (
            city
              ? ""
              : window.TL.Util.emptyState(
                  "Nothing planned for this day yet",
                  "Add experiences from the Experiences page."
                )
          )
        }

      </div>
    `;
  }

  function renderFlowActions(tripId) {
    const mount =
      document.getElementById(
        "trip-flow-actions"
      );

    if (!mount) return;

    mount.innerHTML = `

      <a
        href="flights.html"
        class="tl-pill"
      >
        ✈ Flights
      </a>

      <a
        href="hotels.html"
        class="tl-pill"
      >
        🏨 Hotels
      </a>

      <a
        href="weather.html?tripId=${encodeURIComponent(
          tripId
        )}"
        class="tl-pill"
      >
        🌦 Weather
      </a>

      <a
        href="bookings.html"
        class="tl-pill"
      >
        🧾 Booking
      </a>

    `;
  }

  function wireDelete(tripId) {

    document
      .getElementById(
        "delete-trip-btn"
      )
      .addEventListener(
        "click",
        async () => {

          if (
            !window.confirm(
              "Delete this trip? This can't be undone."
            )
          ) {
            return;
          }

          try {

            await window.TL.Trips.remove(
              tripId
            );

            window.TL.toast(
              "Trip deleted"
            );

            window.location.href =
              "profile.html";

          } catch (err) {

            window.TL.toast(
              err.message ||
                "Couldn't delete this trip.",
              "error"
            );

          }

        }
      );
  }

  async function init() {

    if (!window.TL.Auth.guard()) {
      return;
    }

    const tripId =
      getParam("id");

    const loading =
      document.getElementById(
        "trip-loading"
      );

    const shell =
      document.getElementById(
        "trip-shell"
      );

    const errorMount =
      document.getElementById(
        "trip-error"
      );

    if (!tripId) {

      loading.classList.add(
        "tl-hidden"
      );

      errorMount.classList.remove(
        "tl-hidden"
      );

      errorMount.innerHTML =
        window.TL.Util.emptyState(
          "No trip selected",
          "Head back to your profile to pick a trip."
        );

      return;
    }

    try {

      let trip;

      try {

        trip =
          await window.TL.Trips.getFull(
            tripId
          );

      } catch (e) {

        trip =
          await window.TL.Trips.get(
            tripId
          );

      }

      trip =
        window.TL.Util.pick(
          trip,
          ["data", "trip"],
          trip
        );

      days =
        extractDays(trip);

      loading.classList.add(
        "tl-hidden"
      );

      shell.classList.remove(
        "tl-hidden"
      );

      renderHeader(trip);

      renderDayTabs();

      renderTimeline();

      renderWeather(tripId);

      renderFlowActions(tripId);

      if (window.TL.Cart) {

        window.TL.Cart.setActiveTripId(
          tripId
        );

      }

      wireDelete(tripId);

    } catch (err) {

      loading.classList.add(
        "tl-hidden"
      );

      errorMount.classList.remove(
        "tl-hidden"
      );

      errorMount.innerHTML =
        window.TL.Util.errorState(
          err.message
        );

    }
  }

  document.addEventListener(
    "DOMContentLoaded",
    init
  );

})();