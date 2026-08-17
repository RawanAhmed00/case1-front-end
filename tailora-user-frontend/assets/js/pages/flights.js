/**
 * TAILORA USER — FLIGHTS PAGE
 *
 * Endpoints:
 *   POST /flights/one-way
 *   POST /flights/round-trip
 *   POST /flights/search
 *   POST /flights/select
 */
(function () {
  "use strict";

  let legCount = 0;
  let lastSelectedCard = null;

  /* =========================================================
     HELPERS
  ========================================================= */

  function inputValue(id) {
    const element =
      document.getElementById(id);

    return element
      ? element.value.trim()
      : "";
  }

  function normalizeAirport(value) {
    return String(value || "")
      .trim()
      .toUpperCase();
  }

  function normalizeHour(value, fallback) {
    const number =
      Number(value);

    if (!Number.isFinite(number)) {
      return fallback;
    }

    return Math.max(
      0,
      Math.min(
        23,
        number
      )
    );
  }

  function parseAirlineList(value) {
    return String(value || "")
      .split(",")
      .map((item) =>
        item
          .trim()
          .toUpperCase()
      )
      .filter(Boolean);
  }

  function formatDuration(minutes) {
    const total =
      Number(minutes);

    if (
      !Number.isFinite(total) ||
      total <= 0
    ) {
      return "";
    }

    const hours =
      Math.floor(
        total / 60
      );

    const mins =
      total % 60;

    if (hours && mins) {
      return `${hours}h ${mins}m`;
    }

    if (hours) {
      return `${hours}h`;
    }

    return `${mins}m`;
  }

  function formatFlightDateTime(value) {
    if (!value) {
      return "";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return value;
    }

    return date.toLocaleString(
      undefined,
      {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }
    );
  }

  function formatCabinClass(value) {
    return String(value || "")
      .replace(
        /_/g,
        " "
      )
      .replace(
        /\b\w/g,
        (char) =>
          char.toUpperCase()
      );
  }

  /* =========================================================
     MODES
  ========================================================= */

  function wireModes() {
    document
      .querySelectorAll(
        "#flight-modes button[data-mode]"
      )
      .forEach((button) => {
        button.addEventListener(
          "click",
          () => {
            document
              .querySelectorAll(
                "#flight-modes button[data-mode]"
              )
              .forEach((item) => {
                item.classList.remove(
                  "is-active"
                );
              });

            document
              .querySelectorAll(
                ".tl-flight-panel"
              )
              .forEach((panel) => {
                panel.classList.remove(
                  "is-active"
                );
              });

            button.classList.add(
              "is-active"
            );

            const panel =
              document.querySelector(
                `.tl-flight-panel[data-panel="${button.dataset.mode}"]`
              );

            if (panel) {
              panel.classList.add(
                "is-active"
              );
            }
          }
        );
      });
  }

  /* =========================================================
     MULTI CITY LEGS
  ========================================================= */

  function legTemplate(index) {
    return `
      <div
        class="tl-leg"
        data-leg="${index}"
      >

        <div class="tl-leg-title">

          <strong>
            Flight ${index}
          </strong>

          ${
            index > 2
              ? `
                <button
                  type="button"
                  class="tl-leg-remove"
                  data-remove-leg="${index}"
                  aria-label="Remove flight"
                >
                  ✕
                </button>
              `
              : ""
          }

        </div>

        <div class="tl-leg-row">

          <div class="tl-field">

            <label>
              From
            </label>

            <input
              class="tl-input"
              type="text"
              id="mc-origin-${index}"
              placeholder="e.g. CAI"
              required
            >

          </div>

          <div class="tl-field">

            <label>
              To
            </label>

            <input
              class="tl-input"
              type="text"
              id="mc-destination-${index}"
              placeholder="e.g. DXB"
              required
            >

          </div>

          <div class="tl-field">

            <label>
              Departure
            </label>

            <input
              class="tl-input"
              type="date"
              id="mc-date-${index}"
              required
            >

          </div>

          <div class="tl-field">

            <label>
              Max Stops
            </label>

            <select
              class="tl-select tl-input"
              id="mc-max-stops-${index}"
            >
              <option value="0">
                Direct only
              </option>

              <option value="1">
                Up to 1 stop
              </option>

              <option value="2">
                Up to 2 stops
              </option>

              <option value="3">
                Up to 3 stops
              </option>
            </select>

          </div>

        </div>

        <div class="tl-leg-time-row">

          <div class="tl-field">
            <label>
              Departure earliest
            </label>

            <input
              class="tl-input"
              type="number"
              id="mc-depart-earliest-${index}"
              min="0"
              max="23"
              value="0"
            >
          </div>

          <div class="tl-field">
            <label>
              Departure latest
            </label>

            <input
              class="tl-input"
              type="number"
              id="mc-depart-latest-${index}"
              min="0"
              max="23"
              value="23"
            >
          </div>

          <div class="tl-field">
            <label>
              Arrival earliest
            </label>

            <input
              class="tl-input"
              type="number"
              id="mc-arrival-earliest-${index}"
              min="0"
              max="23"
              value="0"
            >
          </div>

          <div class="tl-field">
            <label>
              Arrival latest
            </label>

            <input
              class="tl-input"
              type="number"
              id="mc-arrival-latest-${index}"
              min="0"
              max="23"
              value="23"
            >
          </div>

        </div>

      </div>
    `;
  }

  function addLeg() {
    legCount += 1;

    const mount =
      document.getElementById(
        "mc-legs"
      );

    if (!mount) {
      return;
    }

    mount.insertAdjacentHTML(
      "beforeend",
      legTemplate(
        legCount
      )
    );

    const today =
      new Date()
        .toISOString()
        .slice(
          0,
          10
        );

    const dateInput =
      document.getElementById(
        `mc-date-${legCount}`
      );

    if (dateInput) {
      dateInput.min =
        today;
    }

    wireLegRemoval();
  }

  function wireLegRemoval() {
    document
      .querySelectorAll(
        "[data-remove-leg]"
      )
      .forEach((button) => {
        button.onclick =
          () => {
            const legs =
              document.querySelectorAll(
                "#mc-legs .tl-leg"
              );

            if (
              legs.length <= 2
            ) {
              window.TL.toast(
                "Multi-city needs at least two flights.",
                "error"
              );

              return;
            }

            const leg =
              document.querySelector(
                `.tl-leg[data-leg="${button.dataset.removeLeg}"]`
              );

            if (leg) {
              leg.remove();
            }
          };
      });
  }

  function initMultiCity() {
    addLeg();
    addLeg();

    const addButton =
      document.getElementById(
        "mc-add-leg"
      );

    if (addButton) {
      addButton.addEventListener(
        "click",
        addLeg
      );
    }
  }

  /* =========================================================
     RESPONSE EXTRACTION
  ========================================================= */

  function extractItineraries(response) {
    if (!response) {
      return [];
    }

    let list = [];
    if (
      Array.isArray(
        response?.data?.itineraries
      )
    ) {
      list = response.data.itineraries;
    } else if (
      Array.isArray(
        response?.itineraries
      )
    ) {
      list = response.itineraries;
    } else if (
      Array.isArray(
        response?.data?.flights
      )
    ) {
      list = response.data.flights;
    } else if (
      Array.isArray(
        response?.flights
      )
    ) {
      list = response.flights;
    } else if (
      Array.isArray(response)
    ) {
      list = response;
    }

    return (window.TL && window.TL.Util && typeof window.TL.Util.uniqueBy === "function")
      ? window.TL.Util.uniqueBy(list, (item) => flightIgnavId(item) || `${item?.id}_${item?.origin}_${item?.destination}_${item?.departure_date}`)
      : list;
  }

  /* =========================================================
     MONEY
  ========================================================= */

  function money(item) {
    const amount =
      item?.price?.amount ??
      null;

    const currency =
      item?.price?.currency ??
      "";

    if (
      amount === null ||
      amount === undefined
    ) {
      return "";
    }

    const number =
      Number(amount);

    const formatted =
      Number.isFinite(number)
        ? number.toLocaleString()
        : String(amount);

    return currency
      ? `${formatted} ${currency}`
      : formatted;
  }

  /* =========================================================
     IDENTIFIER
  ========================================================= */

  function flightIgnavId(item) {
    return (
      item?.ignav_id ??
      item?.ignavId ??
      null
    );
  }

  /* =========================================================
     SEGMENT HTML
  ========================================================= */

  function segmentHtml(segment) {
    const airline =
      segment?.operating_carrier_name ||
      "";

    const airlineCode =
      segment?.marketing_carrier_code ||
      "";

    const flightNumber =
      segment?.flight_number ||
      "";

    const origin =
      segment?.departure_airport ||
      "";

    const destination =
      segment?.arrival_airport ||
      "";

    const departure =
      segment?.departure_time_local ||
      "";

    const arrival =
      segment?.arrival_time_local ||
      "";

    const aircraft =
      segment?.aircraft ||
      "";

    const duration =
      formatDuration(
        segment?.duration_minutes
      );

    return `
      <div
        style="
          padding:12px 14px;
          border:1px solid var(--tl-border);
          border-radius:12px;
          background:rgba(255,255,255,.02);
        "
      >

        <div
          style="
            display:flex;
            justify-content:space-between;
            gap:12px;
            flex-wrap:wrap;
          "
        >

          <strong>
            ${window.TL.Util.escape(
              origin
            )}
            →
            ${window.TL.Util.escape(
              destination
            )}
          </strong>

          ${
            duration
              ? `
                <span class="tl-text-secondary">
                  ${window.TL.Util.escape(
                    duration
                  )}
                </span>
              `
              : ""
          }

        </div>

        <div
          class="tl-text-secondary"
          style="
            margin-top:6px;
            font-size:13px;
          "
        >

          ${
            airline
              ? window.TL.Util.escape(
                  airline
                )
              : ""
          }

          ${
            airlineCode ||
            flightNumber
              ? `
                ${window.TL.Util.escape(
                  airlineCode
                )}
                ${window.TL.Util.escape(
                  flightNumber
                )}
              `
              : ""
          }

          ${
            aircraft
              ? `
                ·
                ${window.TL.Util.escape(
                  aircraft
                )}
              `
              : ""
          }

        </div>

        <div
          class="tl-text-secondary"
          style="
            margin-top:5px;
            font-size:13px;
          "
        >

          ${
            departure
              ? window.TL.Util.escape(
                  formatFlightDateTime(
                    departure
                  )
                )
              : ""
          }

          →

          ${
            arrival
              ? window.TL.Util.escape(
                  formatFlightDateTime(
                    arrival
                  )
                )
              : ""
          }

        </div>

      </div>
    `;
  }

  /* =========================================================
     FLIGHT CARD
  ========================================================= */

  function flightCard(item, index) {
    const outbound =
      item?.outbound || {};

    const segments =
      Array.isArray(
        outbound?.segments
      )
        ? outbound.segments
        : [];

    const firstSegment =
      segments.length
        ? segments[0]
        : {};

    const lastSegment =
      segments.length
        ? segments[
            segments.length - 1
          ]
        : {};

    const carrier =
      outbound?.carrier ||
      firstSegment?.operating_carrier_name ||
      "";

    const origin =
      firstSegment?.departure_airport ||
      "";

    const destination =
      lastSegment?.arrival_airport ||
      "";

    const departure =
      firstSegment?.departure_time_local ||
      "";

    const arrival =
      lastSegment?.arrival_time_local ||
      "";

    const durationMinutes =
      Number(
        outbound?.duration_minutes ||
        0
      );

    const duration =
      formatDuration(
        durationMinutes
      );

    const stops =
      Math.max(
        0,
        segments.length - 1
      );

    const cabin =
      item?.cabin_class ||
      "";

    const price =
      money(item);

    const ignavId =
      flightIgnavId(item);

    const carryOn =
      item?.bags?.carry_on;

    const checked =
      item?.bags?.checked;

    const selfTransfer =
      item?.requires_self_transfer ===
      true;

    return `
      <div
        class="tl-card tl-flight-result"
        data-result-index="${index}"
      >

        <div class="tl-flight-result-top">

          <div style="flex:1;">

            <div class="tl-flight-route">

              <strong>
                ${window.TL.Util.escape(
                  origin || "?"
                )}
              </strong>

              <span class="tl-flight-arrow">
                →
              </span>

              <strong>
                ${window.TL.Util.escape(
                  destination || "?"
                )}
              </strong>

            </div>

            <div
              class="tl-flight-meta-row tl-mt-8"
            >

              ${
                carrier
                  ? `
                    <span class="tl-pill">
                      ✈
                      ${window.TL.Util.escape(
                        carrier
                      )}
                    </span>
                  `
                  : ""
              }

              ${
                departure
                  ? `
                    <span class="tl-pill">
                      🛫
                      ${window.TL.Util.escape(
                        formatFlightDateTime(
                          departure
                        )
                      )}
                    </span>
                  `
                  : ""
              }

              ${
                arrival
                  ? `
                    <span class="tl-pill">
                      🛬
                      ${window.TL.Util.escape(
                        formatFlightDateTime(
                          arrival
                        )
                      )}
                    </span>
                  `
                  : ""
              }

              ${
                duration
                  ? `
                    <span class="tl-pill">
                      ⏱
                      ${window.TL.Util.escape(
                        duration
                      )}
                    </span>
                  `
                  : ""
              }

              <span class="tl-pill">
                ${
                  stops === 0
                    ? "Direct"
                    : `${stops} stop${
                        stops === 1
                          ? ""
                          : "s"
                      }`
                }
              </span>

              ${
                cabin
                  ? `
                    <span class="tl-pill">
                      ${window.TL.Util.escape(
                        formatCabinClass(
                          cabin
                        )
                      )}
                    </span>
                  `
                  : ""
              }

              ${
                carryOn !== undefined
                  ? `
                    <span class="tl-pill">
                      🧳 ${window.TL.Util.escape(
                        carryOn
                      )} carry-on
                    </span>
                  `
                  : ""
              }

              ${
                checked !== undefined
                  ? `
                    <span class="tl-pill">
                      🛄 ${window.TL.Util.escape(
                        checked
                      )} checked
                    </span>
                  `
                  : ""
              }

              ${
                selfTransfer
                  ? `
                    <span class="tl-pill">
                      Self transfer
                    </span>
                  `
                  : ""
              }

            </div>

            ${
              segments.length
                ? `
                  <div
                    style="
                      margin-top:16px;
                      display:flex;
                      flex-direction:column;
                      gap:8px;
                    "
                  >

                    ${segments
                      .map(
                        (segment) =>
                          segmentHtml(
                            segment
                          )
                      )
                      .join("")}

                  </div>
                `
                : ""
            }

          </div>

          <div class="tl-flight-price-col">

            ${
              price
                ? `
                  <span
                    class="tl-price"
                    style="font-size:22px;"
                  >
                    ${window.TL.Util.escape(
                      price
                    )}
                  </span>
                `
                : ""
            }

            ${
              item?.price?.status
                ? `
                  <span
                    class="tl-text-secondary"
                    style="font-size:12px;"
                  >
                    ${window.TL.Util.escape(
                      item.price.status
                    )}
                  </span>
                `
                : ""
            }

            <button
              type="button"
              class="
                tl-btn
                tl-btn--primary
                tl-btn--sm
              "
              data-select-flight="${index}"
              ${ignavId ? "" : "disabled"}
            >
              ${
                ignavId
                  ? "Select Flight"
                  : "Unavailable"
              }
            </button>

          </div>

        </div>

      </div>
    `;
  }

  /* =========================================================
     SELECT FLIGHT
  ========================================================= */

  async function selectFlight(
    item,
    card
  ) {
    if (
      !window.TL.Auth
        .isAuthenticated()
    ) {
      window.location.href =
        "signin.html?next=flights.html";

      return;
    }

    const ignavId =
      flightIgnavId(
        item
      );

    if (!ignavId) {
      window.TL.toast(
        "This flight can't be selected — missing identifier.",
        "error"
      );

      return;
    }

    const button =
      card.querySelector(
        "[data-select-flight]"
      );

    const oldText =
      button.textContent;

    button.disabled =
      true;

    button.textContent =
      "Selecting…";

    try {
      const response =
        await window.TL.Flights
          .select(
            ignavId
          );

      const selected =
        window.TL.Util.pick(
          response,
          [
            "data",
            "flight"
          ],
          response
        ) || item;

      if (
        lastSelectedCard
      ) {
        lastSelectedCard
          .classList
          .remove(
            "is-selected"
          );
      }

      card.classList.add(
        "is-selected"
      );

      lastSelectedCard =
        card;

      button.textContent =
        "✓ Selected";

      window.TL.Cart.setFlight(
        Object.assign(
          {},
          item,
          selected,
          {
            ignav_id:
              ignavId
          }
        )
      );

      window.TL.toast(
        "Flight selected!"
      );

      renderSelectedBanner();

    } catch (err) {
      console.error(
        "Select flight error:",
        err
      );

      button.disabled =
        false;

      button.textContent =
        oldText;

      window.TL.toast(
        err?.message ||
          "Couldn't select this flight.",
        "error"
      );
    }
  }

  /* =========================================================
     RENDER RESULTS
  ========================================================= */

  function renderResults(list) {
    const mount =
      document.getElementById(
        "flights-results"
      );

    if (!mount) {
      return;
    }

    if (
      !Array.isArray(list) ||
      !list.length
    ) {
      mount.innerHTML =
        window.TL.Util.emptyState(
          "No flights found",
          "Try different dates or locations."
        );

      return;
    }

    mount.innerHTML = `
      <div
        class="tl-section-head"
        style="margin-bottom:20px;"
      >
        <h2
          style="font-size:20px;"
        >
          Flights (${list.length})
        </h2>
      </div>

      ${list
        .map(
          (item, index) =>
            flightCard(
              item,
              index
            )
        )
        .join("")}
    `;

    mount
      .querySelectorAll(
        "[data-select-flight]"
      )
      .forEach((button) => {
        button.addEventListener(
          "click",
          () => {
            const index =
              Number(
                button.dataset
                  .selectFlight
              );

            const card =
              mount.querySelector(
                `[data-result-index="${index}"]`
              );

            selectFlight(
              list[index],
              card
            );
          }
        );
      });
  }

  /* =========================================================
     SELECTED BANNER
  ========================================================= */

  function renderSelectedBanner() {
    const mount =
      document.getElementById(
        "flight-selected-banner"
      );

    if (!mount) {
      return;
    }

    const flight =
      window.TL.Cart
        .getFlight();

    if (!flight) {
      mount.innerHTML =
        "";

      return;
    }

    const segments =
      flight?.outbound?.segments ||
      [];

    const firstSegment =
      segments[0] || {};

    const lastSegment =
      segments.length
        ? segments[
            segments.length - 1
          ]
        : {};

    const origin =
      firstSegment?.departure_airport ||
      "";

    const destination =
      lastSegment?.arrival_airport ||
      "";

    mount.innerHTML = `
      <div
        class="tl-card"
        style="
          padding:18px 22px;
          margin-bottom:24px;
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:14px;
          flex-wrap:wrap;
          border-color:var(--tl-cyan);
        "
      >

        <span>
          ✈ Flight selected

          ${
            origin &&
            destination
              ? `: ${window.TL.Util.escape(
                  origin
                )} → ${window.TL.Util.escape(
                  destination
                )}`
              : ""
          }
        </span>

        <div
          class="
            tl-flex
            tl-gap-12
          "
        >

          <a
            href="hotels.html"
            class="
              tl-btn
              tl-btn--outline
              tl-btn--sm
            "
          >
            Add a Hotel
          </a>

          <a
            href="bookings.html"
            class="
              tl-btn
              tl-btn--primary
              tl-btn--sm
            "
          >
            Go to Booking
          </a>

        </div>

      </div>
    `;
  }

  /* =========================================================
     RUN SEARCH
  ========================================================= */

  async function runSearch(
    searchFn,
    payload,
    button
  ) {
    if (
      typeof searchFn !==
      "function"
    ) {
      window.TL.toast(
        "Flight search API is not available.",
        "error"
      );

      return;
    }

    console.log(
      "FLIGHT SEARCH PAYLOAD:",
      payload
    );

    const oldText =
      button.textContent;

    button.disabled =
      true;

    button.textContent =
      "Searching…";

    const mount =
      document.getElementById(
        "flights-results"
      );

    if (mount) {
      mount.innerHTML =
        window.TL.Util.skeletonCards(
          4,
          "tl-flight-result"
        );
    }

    try {
      const response =
        await searchFn(
          payload
        );

      console.log(
        "FLIGHT SEARCH RESPONSE:",
        response
      );

      const list =
        extractItineraries(
          response
        );

      console.log(
        "EXTRACTED ITINERARIES:",
        list
      );

      renderResults(
        list
      );

    } catch (err) {
      console.error(
        "Flight search error:",
        err
      );

      if (mount) {
        mount.innerHTML =
          window.TL.Util.errorState(
            err?.message ||
            "Flight search failed."
          );
      }

      window.TL.toast(
        err?.message ||
          "Flight search failed.",
        "error"
      );

    } finally {
      button.disabled =
        false;

      button.textContent =
        oldText;
    }
  }

  /* =========================================================
     ONE WAY
  ========================================================= */

  function wireOneWay() {
    const form =
      document.getElementById(
        "form-one-way"
      );

    if (!form) {
      return;
    }

    form.addEventListener(
      "submit",
      (event) => {
        event.preventDefault();

        const origin =
          normalizeAirport(
            inputValue(
              "ow-origin"
            )
          );

        const destination =
          normalizeAirport(
            inputValue(
              "ow-destination"
            )
          );

        const departureDate =
          inputValue(
            "ow-departure"
          );

        if (
          !origin ||
          !destination
        ) {
          window.TL.toast(
            "Enter From and To.",
            "error"
          );

          return;
        }

        if (
          origin ===
          destination
        ) {
          window.TL.toast(
            "Origin and destination cannot be the same.",
            "error"
          );

          return;
        }

        if (!departureDate) {
          window.TL.toast(
            "Choose departure date.",
            "error"
          );

          return;
        }

        const payload = {
          origin,

          destination,

          departure_date:
            departureDate,

          adults:
            Number(
              inputValue(
                "ow-adults"
              )
            ) || 1,

          cabin_class:
            inputValue(
              "ow-cabin"
            ) ||
            "economy"
        };

        runSearch(
          window.TL.Flights
            .oneWay,

          payload,

          event.target
            .querySelector(
              "button[type=submit]"
            )
        );
      }
    );
  }

  /* =========================================================
     ROUND TRIP
  ========================================================= */

  function wireRoundTrip() {
    const form =
      document.getElementById(
        "form-round-trip"
      );

    if (!form) {
      return;
    }

    form.addEventListener(
      "submit",
      (event) => {
        event.preventDefault();

        const origin =
          normalizeAirport(
            inputValue(
              "rt-origin"
            )
          );

        const destination =
          normalizeAirport(
            inputValue(
              "rt-destination"
            )
          );

        const departure =
          inputValue(
            "rt-departure"
          );

        const returnDate =
          inputValue(
            "rt-return"
          );

        if (
          !origin ||
          !destination
        ) {
          window.TL.toast(
            "Enter From and To.",
            "error"
          );

          return;
        }

        if (
          origin ===
          destination
        ) {
          window.TL.toast(
            "Origin and destination cannot be the same.",
            "error"
          );

          return;
        }

        if (
          !departure ||
          !returnDate
        ) {
          window.TL.toast(
            "Choose departure and return dates.",
            "error"
          );

          return;
        }

        if (
          returnDate <
          departure
        ) {
          window.TL.toast(
            "Return date must be after departure date.",
            "error"
          );

          return;
        }

        const payload = {
          origin,

          destination,

          departure_date:
            departure,

          return_date:
            returnDate,

          adults:
            Number(
              inputValue(
                "rt-adults"
              )
            ) || 1,

          cabin_class:
            inputValue(
              "rt-cabin"
            ) ||
            "economy"
        };

        runSearch(
          window.TL.Flights
            .roundTrip,

          payload,

          event.target
            .querySelector(
              "button[type=submit]"
            )
        );
      }
    );
  }

  /* =========================================================
     MULTI CITY
  ========================================================= */

  function wireMultiCity() {
    const form =
      document.getElementById(
        "form-multi-city"
      );

    if (!form) {
      return;
    }

    form.addEventListener(
      "submit",
      (event) => {
        event.preventDefault();

        const legElements =
          Array.from(
            document.querySelectorAll(
              "#mc-legs .tl-leg"
            )
          );

        const legs =
          legElements.map(
            (legElement) => {
              const index =
                legElement.dataset.leg;

              return {
                origin:
                  normalizeAirport(
                    inputValue(
                      `mc-origin-${index}`
                    )
                  ),

                destination:
                  normalizeAirport(
                    inputValue(
                      `mc-destination-${index}`
                    )
                  ),

                departure_date:
                  inputValue(
                    `mc-date-${index}`
                  ),

                max_stops:
                  String(
                    inputValue(
                      `mc-max-stops-${index}`
                    ) ||
                    "0"
                  ),

                departure_time_range: {
                  earliest_hour:
                    normalizeHour(
                      inputValue(
                        `mc-depart-earliest-${index}`
                      ),
                      0
                    ),

                  latest_hour:
                    normalizeHour(
                      inputValue(
                        `mc-depart-latest-${index}`
                      ),
                      23
                    ),

                  arrival_earliest_hour:
                    normalizeHour(
                      inputValue(
                        `mc-arrival-earliest-${index}`
                      ),
                      0
                    ),

                  arrival_latest_hour:
                    normalizeHour(
                      inputValue(
                        `mc-arrival-latest-${index}`
                      ),
                      23
                    )
                }
              };
            }
          );

        if (
          legs.length < 2
        ) {
          window.TL.toast(
            "Multi-city needs at least two flights.",
            "error"
          );

          return;
        }

        if (
          legs.some(
            (leg) =>
              !leg.origin ||
              !leg.destination ||
              !leg.departure_date
          )
        ) {
          window.TL.toast(
            "Complete From, To and date for every flight.",
            "error"
          );

          return;
        }

        if (
          legs.some(
            (leg) =>
              leg.origin ===
              leg.destination
          )
        ) {
          window.TL.toast(
            "Origin and destination cannot be the same.",
            "error"
          );

          return;
        }

        const invalidTime =
          legs.some(
            (leg) =>
              leg
                .departure_time_range
                .latest_hour <
              leg
                .departure_time_range
                .earliest_hour ||
              leg
                .departure_time_range
                .arrival_latest_hour <
              leg
                .departure_time_range
                .arrival_earliest_hour
          );

        if (invalidTime) {
          window.TL.toast(
            "Latest hour must be greater than or equal to earliest hour.",
            "error"
          );

          return;
        }

        const payload = {
          legs,

          adults:
            Number(
              inputValue(
                "mc-adults"
              )
            ) || 1,

          children:
            Number(
              inputValue(
                "mc-children"
              )
            ) || 0,

          infants_in_seat:
            Number(
              inputValue(
                "mc-infants-seat"
              )
            ) || 0,

          infants_on_lap:
            Number(
              inputValue(
                "mc-infants-lap"
              )
            ) || 0,

          cabin_class:
            inputValue(
              "mc-cabin"
            ) ||
            "economy",

          min_carry_on_bags:
            Number(
              inputValue(
                "mc-carry-on"
              )
            ) || 0,

          min_checked_bags:
            Number(
              inputValue(
                "mc-checked-bags"
              )
            ) || 0,

          max_price:
            Number(
              inputValue(
                "mc-max-price"
              )
            ) || 0,

          airlines_include:
            parseAirlineList(
              inputValue(
                "mc-airlines-include"
              )
            ),

          airlines_exclude:
            parseAirlineList(
              inputValue(
                "mc-airlines-exclude"
              )
            ),

          allow_self_transfer:
            Boolean(
              document.getElementById(
                "mc-self-transfer"
              )?.checked
            ),

          market:
            inputValue(
              "mc-market"
            )
        };

        console.log(
          "MULTI CITY PAYLOAD:",
          payload
        );

        runSearch(
          window.TL.Flights
            .multiCity,

          payload,

          event.target
            .querySelector(
              "button[type=submit]"
            )
        );
      }
    );
  }

  /* =========================================================
     DATES
  ========================================================= */

  function initDates() {
    const today =
      new Date()
        .toISOString()
        .slice(
          0,
          10
        );

    [
      "ow-departure",
      "rt-departure",
      "rt-return"
    ].forEach((id) => {
      const input =
        document.getElementById(
          id
        );

      if (input) {
        input.min =
          today;
      }
    });

    const departure =
      document.getElementById(
        "rt-departure"
      );

    const returnInput =
      document.getElementById(
        "rt-return"
      );

    if (
      departure &&
      returnInput
    ) {
      departure.addEventListener(
        "change",
        () => {
          returnInput.min =
            departure.value ||
            today;

          if (
            returnInput.value &&
            returnInput.value <
              departure.value
          ) {
            returnInput.value =
              "";
          }
        }
      );
    }
  }

  /* =========================================================
     INIT
  ========================================================= */

  document.addEventListener(
    "DOMContentLoaded",
    () => {
      wireModes();

      initMultiCity();

      wireOneWay();

      wireRoundTrip();

      wireMultiCity();

      renderSelectedBanner();

      initDates();

      console.log(
        "FLIGHTS PAGE INITIALIZED"
      );
    }
  );

})();