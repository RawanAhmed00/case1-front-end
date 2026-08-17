(function () {
  "use strict";

  const TOTAL_STEPS = 5;

  const state = {
    step: 1,

    allCountries: [],
    country: null,

    startDate: "",
    endDate: "",

    allCities: [],
    cities: [],

    selectedCities: [],

    tripId: null,

    attractionsByDay: {},

    budget: null,

    travelers: 1,

    styles: [],

    // AI
    aiConversationId: null,
    aiBusy: false,
    selectedAiPlan: null
  };

  /* =========================================================
     HELPERS
  ========================================================= */

  function normalizeText(value) {
    return String(value || "")
      .trim()
      .toLowerCase();
  }

  function toIsoDate(date) {
    if (!date) {
      return null;
    }

    return new Date(
      `${date}T00:00:00Z`
    ).toISOString();
  }

  function calculateDays() {
    if (
      !state.startDate ||
      !state.endDate
    ) {
      return 0;
    }

    const start =
      new Date(
        `${state.startDate}T00:00:00Z`
      );

    const end =
      new Date(
        `${state.endDate}T00:00:00Z`
      );

    const oneDay =
      24 * 60 * 60 * 1000;

    const diff =
      end.getTime() -
      start.getTime();

    if (diff < 0) {
      return 0;
    }

    return (
      Math.floor(
        diff / oneDay
      ) + 1
    );
  }

  function extractCountryId(country) {
    if (!country) {
      return null;
    }

    const value =
      country.id ??
      country.country_id ??
      country.countryId ??
      country.CountryId ??
      country.Id ??
      null;

    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return null;
    }

    const id =
      Number(value);

    return Number.isFinite(id)
      ? id
      : null;
  }

  /* =========================================================
     STEP UI
  ========================================================= */

  function updateStepUI() {
    document
      .querySelectorAll(
        ".tl-planner-step"
      )
      .forEach((el) => {
        const step =
          Number(
            el.dataset.step
          );

        el.classList.toggle(
          "is-active",
          step === state.step
        );

        el.classList.toggle(
          "is-done",
          step < state.step
        );
      });

    document
      .querySelectorAll(
        ".tl-planner-content"
      )
      .forEach((el) => {
        el.classList.toggle(
          "tl-hidden",
          Number(
            el.dataset.content
          ) !== state.step
        );
      });

    const backBtn =
      document.getElementById(
        "planner-back"
      );

    const nextBtn =
      document.getElementById(
        "planner-next"
      );

    if (backBtn) {
      backBtn.disabled =
        state.step === 1;
    }

    if (nextBtn) {
      nextBtn.textContent =
        state.step === TOTAL_STEPS
          ? "Create My Trip"
          : "Continue";
    }
  }

  /* =========================================================
     VALIDATION
  ========================================================= */

  function validateStep() {
    if (state.step === 1) {
      if (!state.country) {
        window.TL.toast(
          "Choose a country",
          "error"
        );

        return false;
      }

      if (!state.country.id) {
        window.TL.toast(
          "Invalid country ID",
          "error"
        );

        return false;
      }
    }

    if (state.step === 2) {
      if (
        !state.startDate ||
        !state.endDate
      ) {
        window.TL.toast(
          "Choose the start and end dates",
          "error"
        );

        return false;
      }

      if (
        state.endDate <
        state.startDate
      ) {
        window.TL.toast(
          "End date must be after start date",
          "error"
        );

        return false;
      }
    }

    if (state.step === 3) {
      const totalDays =
        calculateDays();

      if (!totalDays) {
        window.TL.toast(
          "Invalid trip dates",
          "error"
        );

        return false;
      }

      if (
        state.selectedCities.length !==
        totalDays
      ) {
        window.TL.toast(
          "Choose a city for every day",
          "error"
        );

        return false;
      }

      const hasMissingCity =
        state.selectedCities.some(
          (day) =>
            !day.cityId
        );

      if (hasMissingCity) {
        window.TL.toast(
          "Choose a city for every day",
          "error"
        );

        return false;
      }
    }

    if (state.step === 5) {
      if (!state.budget) {
        window.TL.toast(
          "Choose your budget",
          "error"
        );

        return false;
      }

      if (
        state.travelers < 1
      ) {
        window.TL.toast(
          "Choose at least one traveler",
          "error"
        );

        return false;
      }

      if (
        state.styles.length === 0
      ) {
        window.TL.toast(
          "Choose at least one travel style",
          "error"
        );

        return false;
      }
    }

    return true;
  }

  /* =========================================================
     NAVIGATION
  ========================================================= */

  async function handleNext() {
    if (!validateStep()) {
      return;
    }

    if (
      state.step === 3 &&
      !state.tripId
    ) {
      await createTripAndDays();

      if (!state.tripId) {
        return;
      }

      await loadAttractionsForDays();
    }

    if (
      state.step <
      TOTAL_STEPS
    ) {
      state.step++;

      updateStepUI();

      return;
    }

    await finishTrip();
  }

  function handleBack() {
    if (state.step === 1) {
      return;
    }

    state.step--;

    updateStepUI();
  }

  /* =========================================================
     LOAD COUNTRIES
  ========================================================= */

  async function loadCountries() {
    try {
      const response =
        await window.TL.Countries.all();

      state.allCountries =
        Array.isArray(response)
          ? response
          : window.TL.Util.list(
              response
            );

      console.log(
        "ALL COUNTRIES:",
        state.allCountries.length
      );

    } catch (err) {
      console.error(
        "Countries error:",
        err
      );

      state.allCountries = [];

      window.TL.toast(
        "Couldn't load countries",
        "error"
      );
    }
  }

  /* =========================================================
     LOAD ALL CITIES
  ========================================================= */

  async function loadAllCities() {
    try {
      console.log(
        "Loading all cities..."
      );

      const response =
        await window.TL.Cities.allFull();

      state.allCities =
        Array.isArray(response)
          ? response
          : [];

      console.log(
        "ALL CITIES LOADED:",
        state.allCities.length
      );

    } catch (err) {
      console.error(
        "Cities loading error:",
        err
      );

      state.allCities = [];

      window.TL.toast(
        "Couldn't load cities",
        "error"
      );
    }
  }

  /* =========================================================
     STEP 1 — COUNTRY
  ========================================================= */

  function wireCountrySearch() {
    const input =
      document.getElementById(
        "plan-country"
      );

    const box =
      document.getElementById(
        "plan-country-suggest"
      );

    if (!input || !box) {
      return;
    }

    input.addEventListener(
      "input",
      () => {
        state.country = null;

        renderSelectedCountry();

        const query =
          normalizeText(
            input.value
          );

        if (!query) {
          box.classList.remove(
            "is-open"
          );

          return;
        }

        const matches =
          state.allCountries
            .filter((country) => {
              const name =
                normalizeText(
                  window.TL.Util.name(
                    country
                  )
                );

              const officialName =
                normalizeText(
                  country?.official_name
                );

              return (
                name.includes(query) ||
                officialName.includes(query)
              );
            })
            .slice(0, 10);

        if (!matches.length) {
          box.innerHTML = `
            <button
              type="button"
              disabled
            >
              No countries found
            </button>
          `;
        } else {
          box.innerHTML =
            matches
              .map((country) => {
                const id =
                  window.TL.Util.id(
                    country
                  );

                const name =
                  window.TL.Util.name(
                    country
                  );

                return `
                  <button
                    type="button"
                    data-country-id="${window.TL.Util.escape(
                      id
                    )}"
                  >
                    ${window.TL.Util.escape(
                      name
                    )}
                  </button>
                `;
              })
              .join("");
        }

        box.classList.add(
          "is-open"
        );
      }
    );

    box.addEventListener(
      "click",
      (e) => {
        const btn =
          e.target.closest(
            "button[data-country-id]"
          );

        if (!btn) {
          return;
        }

        const country =
          state.allCountries.find(
            (item) =>
              String(
                window.TL.Util.id(
                  item
                )
              ) ===
              String(
                btn.dataset.countryId
              )
          );

        if (!country) {
          return;
        }

        selectCountry(
          country
        );
      }
    );

    document.addEventListener(
      "click",
      (e) => {
        if (
          !box.contains(
            e.target
          ) &&
          e.target !== input
        ) {
          box.classList.remove(
            "is-open"
          );
        }
      }
    );
  }

  function selectCountry(country) {
    state.country = {
      id:
        extractCountryId(
          country
        ),

      name:
        window.TL.Util.name(
          country
        )
    };

    const input =
      document.getElementById(
        "plan-country"
      );

    if (input) {
      input.value =
        state.country.name;
    }

    const box =
      document.getElementById(
        "plan-country-suggest"
      );

    if (box) {
      box.classList.remove(
        "is-open"
      );
    }

    state.cities = [];
    state.selectedCities = [];
    state.tripId = null;
    state.attractionsByDay = {};

    renderSelectedCountry();

    filterCitiesForCountry();
  }

  function renderSelectedCountry() {
    const mount =
      document.getElementById(
        "plan-country-selected"
      );

    if (!mount) {
      return;
    }

    if (!state.country) {
      mount.innerHTML = "";

      return;
    }

    mount.innerHTML = `
      <div
        class="tl-badge tl-mt-16"
        style="
          font-size:13px;
          padding:8px 14px;
        "
      >
        🌍
        ${window.TL.Util.escape(
          state.country.name
        )}
        selected
      </div>
    `;
  }

  /* =========================================================
     FILTER CITIES BY COUNTRY
  ========================================================= */

  function filterCitiesForCountry() {
    if (!state.country) {
      state.cities = [];

      renderCityDays();

      return;
    }

    const selectedCountryName =
      normalizeText(
        state.country.name
      );

    const matchedCities =
      state.allCities.filter(
        (city) => {
          const cityCountryName =
            normalizeText(
              city?.country?.name
            );

          return (
            cityCountryName ===
            selectedCountryName
          );
        }
      );

    state.cities =
      window.TL.Util.uniqueBy(
        matchedCities,
        (city) => window.TL.Util.name(city)
      );

    console.log(
      `CITIES FOR ${state.country.name}:`,
      state.cities.length
    );

    renderCityDays();
  }

  /* =========================================================
     STEP 2 — DATES
  ========================================================= */

  function wireDates() {
    const start =
      document.getElementById(
        "plan-start"
      );

    const end =
      document.getElementById(
        "plan-end"
      );

    const today =
      new Date()
        .toISOString()
        .split("T")[0];

    if (start) {
      start.min = today;

      start.addEventListener(
        "change",
        (e) => {
          state.startDate =
            e.target.value;

          if (end) {
            end.min =
              state.startDate ||
              today;

            if (
              end.value &&
              end.value <
                state.startDate
            ) {
              end.value = "";

              state.endDate = "";
            }
          }

          resetDaySelections();
        }
      );
    }

    if (end) {
      end.min = today;

      end.addEventListener(
        "change",
        (e) => {
          state.endDate =
            e.target.value;

          resetDaySelections();
        }
      );
    }
  }

  function resetDaySelections() {
    state.selectedCities = [];
    state.tripId = null;
    state.attractionsByDay = {};

    renderCityDays();
  }

  /* =========================================================
     STEP 3 — CITIES
  ========================================================= */

  function renderCityDays() {
    const mount =
      document.getElementById(
        "plan-city-days"
      );

    if (!mount) {
      return;
    }

    const totalDays =
      calculateDays();

    if (!totalDays) {
      mount.innerHTML =
        window.TL.Util.emptyState(
          "Choose your dates first",
          "Select the start and end dates before choosing cities."
        );

      return;
    }

    if (!state.country) {
      mount.innerHTML =
        window.TL.Util.emptyState(
          "Choose a country first",
          "Select your destination country before choosing cities."
        );

      return;
    }

    if (!state.cities.length) {
      mount.innerHTML =
        window.TL.Util.emptyState(
          "No cities found",
          `No cities are available for ${state.country.name}.`
        );

      return;
    }

    if (
      state.selectedCities.length !==
      totalDays
    ) {
      state.selectedCities =
        Array.from(
          {
            length:
              totalDays
          },
          (_, index) => ({
            dayNumber:
              index + 1,

            cityId:
              null
          })
        );
    }

    mount.innerHTML =
      state.selectedCities
        .map((day) => {
          return `
            <div
              class="tl-card"
              style="
                padding:18px;
                margin-bottom:14px;
              "
            >
              <div class="tl-field">

                <label>
                  Day ${day.dayNumber}
                </label>

                <select
                  class="tl-input"
                  data-day-city="${day.dayNumber}"
                >
                  <option value="">
                    Choose city
                  </option>

                  ${state.cities
                    .map((city) => {
                      const cityId =
                        window.TL.Util.id(
                          city
                        );

                      const cityName =
                        window.TL.Util.name(
                          city
                        );

                      const selected =
                        String(
                          day.cityId
                        ) ===
                        String(
                          cityId
                        );

                      return `
                        <option
                          value="${window.TL.Util.escape(
                            cityId
                          )}"
                          ${
                            selected
                              ? "selected"
                              : ""
                          }
                        >
                          ${window.TL.Util.escape(
                            cityName
                          )}
                        </option>
                      `;
                    })
                    .join("")}
                </select>

              </div>
            </div>
          `;
        })
        .join("");

    mount
      .querySelectorAll(
        "select[data-day-city]"
      )
      .forEach((select) => {
        select.addEventListener(
          "change",
          () => {
            const dayNumber =
              Number(
                select.dataset.dayCity
              );

            const day =
              state.selectedCities.find(
                (item) =>
                  item.dayNumber ===
                  dayNumber
              );

            if (!day) {
              return;
            }

            day.cityId =
              select.value
                ? Number(
                    select.value
                  )
                : null;
          }
        );
      });
  }

  /* =========================================================
     PAYLOADS
  ========================================================= */

  function buildTripPayload() {
    return {
      country_id:
        Number(
          state.country.id
        ),

      start_date:
        toIsoDate(
          state.startDate
        ),

      end_date:
        toIsoDate(
          state.endDate
        ),

      budget:
        state.budget || 1,

      travel_style:
        state.styles[0] ||
        "Culture",

      interests:
        state.styles.slice(1),

      travelers:
        state.travelers
    };
  }

  function buildDaysPayload() {
    return {
      days:
        state.selectedCities.map(
          (day) => ({
            day_number:
              day.dayNumber,

            city_id:
              Number(
                day.cityId
              )
          })
        )
    };
  }

  /* =========================================================
     CREATE TRIP + DAYS
  ========================================================= */

  async function createTripAndDays() {
    const nextBtn =
      document.getElementById(
        "planner-next"
      );

    if (nextBtn) {
      nextBtn.disabled = true;
      nextBtn.textContent =
        "Preparing attractions…";
    }

    try {
      const tripPayload =
        buildTripPayload();

      const tripResponse =
        await window.TL.Trips.create(
          tripPayload
        );

      const trip =
        window.TL.Util.pick(
          tripResponse,
          [
            "data.trip",
            "trip",
            "data"
          ],
          tripResponse
        );

      const tripId =
        window.TL.Util.id(
          trip
        );

      if (!tripId) {
        throw new Error(
          "Trip ID was not returned."
        );
      }

      state.tripId =
        tripId;

      await window.TL.Trips
        .selectCities(
          tripId,
          buildDaysPayload()
        );

    } catch (err) {
      console.error(
        "Trip creation error:",
        err
      );

      state.tripId = null;

      window.TL.toast(
        err.message ||
          "Couldn't prepare the trip.",
        "error"
      );

    } finally {
      if (nextBtn) {
        nextBtn.disabled = false;
        nextBtn.textContent =
          "Continue";
      }
    }
  }

  /* =========================================================
     STEP 4 — ATTRACTIONS
  ========================================================= */

  function extractTripDays(response) {
    const trip =
      window.TL.Util.pick(
        response,
        [
          "data.trip",
          "trip",
          "data"
        ],
        response
      );

    const list =
      window.TL.Util.pick(
        trip,
        [
          "days",
          "trip_days",
          "tripDays",
          "itinerary"
        ],
        []
      );

    return Array.isArray(list)
      ? list
      : [];
  }

  function extractAttractions(response) {
    if (!response) {
      return [];
    }

    const list =
      window.TL.Util.pick(
        response,
        [
          "attractions",
          "data.attractions",
          "data"
        ],
        null
      );

    if (Array.isArray(list)) {
      return list;
    }

    const utilList =
      window.TL.Util.list(
        response
      );

    return Array.isArray(
      utilList
    )
      ? utilList
      : [];
  }

  async function loadAttractionsForDays() {
    if (!state.tripId) {
      return;
    }

    const mount =
      document.getElementById(
        "plan-attraction-days"
      );

    if (mount) {
      mount.innerHTML = `
        <div
          class="tl-state"
          style="padding:24px;"
        >
          <div class="tl-state-icon">
            ⏳
          </div>

          <p>
            Loading attractions...
          </p>
        </div>
      `;
    }

    try {
      const fullResponse =
        await window.TL.Trips.getFull(
          state.tripId
        );

      const tripDays =
        extractTripDays(
          fullResponse
        );

      state.attractionsByDay = {};

      await Promise.all(
        tripDays.map(
          async (day) => {
            const tripDayId =
              window.TL.Util.id(
                day
              );

            if (!tripDayId) {
              return;
            }

            try {
              const response =
                await window.TL.Trips
                  .getDayAttractions(
                    tripDayId
                  );

              const rawAttractions =
                extractAttractions(
                  response
                );

              state.attractionsByDay[
                tripDayId
              ] = {
                day,
                attractions:
                  window.TL.Util.uniqueBy(
                    rawAttractions,
                    (a) => window.TL.Util.name(a)
                  ),
                selectedIds: []
              };

            } catch (err) {
              state.attractionsByDay[
                tripDayId
              ] = {
                day,
                attractions: [],
                selectedIds: []
              };
            }
          }
        )
      );

      renderAttractionDays();

    } catch (err) {
      console.error(
        "Full trip error:",
        err
      );

      state.attractionsByDay = {};

      renderAttractionDays();

      window.TL.toast(
        "Couldn't load attractions",
        "error"
      );
    }
  }

  function renderAttractionDays() {
    const mount =
      document.getElementById(
        "plan-attraction-days"
      );

    if (!mount) {
      return;
    }

    const entries =
      Object.entries(
        state.attractionsByDay
      );

    if (!entries.length) {
      mount.innerHTML =
        window.TL.Util.emptyState(
          "No attractions available",
          "There are currently no attractions available for this itinerary."
        );

      return;
    }

    mount.innerHTML =
      entries
        .map(
          ([
            tripDayId,
            info
          ]) => {
            const dayNumber =
              window.TL.Util.pick(
                info.day,
                [
                  "day_number",
                  "dayNumber"
                ],
                ""
              );

            const cityName =
              window.TL.Util.pick(
                info.day,
                [
                  "city.name",
                  "city_name",
                  "cityName"
                ],
                ""
              );

            return `
              <div
                class="tl-card"
                style="
                  padding:20px;
                  margin-bottom:18px;
                "
              >

                <h3>
                  Day ${window.TL.Util.escape(
                    dayNumber
                  )}

                  ${
                    cityName
                      ? ` — ${window.TL.Util.escape(
                          cityName
                        )}`
                      : ""
                  }
                </h3>

                ${
                  info.attractions.length
                    ? `
                      <div
                        class="tl-option-cards tl-mt-16"
                      >
                        ${info.attractions
                          .map(
                            (attraction) => {
                              const attractionId =
                                window.TL.Util.id(
                                  attraction
                                );

                              const name =
                                window.TL.Util.name(
                                  attraction
                                );

                              const description =
                                window.TL.Util.description(
                                  attraction
                                );

                              const image =
                                window.TL.Util.image(
                                  attraction,
                                  ""
                                );

                              return `
                                <button
                                  type="button"
                                  class="tl-option-card"
                                  data-trip-day="${window.TL.Util.escape(
                                    tripDayId
                                  )}"
                                  data-attraction-id="${window.TL.Util.escape(
                                    attractionId
                                  )}"
                                >

                                  ${
                                    image
                                      ? `
                                        <img
                                          src="${window.TL.Util.escape(
                                            image
                                          )}"
                                          alt=""
                                          style="
                                            width:100%;
                                            height:140px;
                                            object-fit:cover;
                                            border-radius:12px;
                                            margin-bottom:12px;
                                          "
                                        >
                                      `
                                      : ""
                                  }

                                  <strong>
                                    ${window.TL.Util.escape(
                                      name
                                    )}
                                  </strong>

                                  ${
                                    description
                                      ? `
                                        <p>
                                          ${window.TL.Util.escape(
                                            description
                                          )}
                                        </p>
                                      `
                                      : ""
                                  }

                                </button>
                              `;
                            }
                          )
                          .join("")}
                      </div>
                    `
                    : `
                      <p
                        class="tl-text-secondary tl-mt-16"
                      >
                        No attractions found for this day.
                      </p>
                    `
                }

              </div>
            `;
          }
        )
        .join("");

    mount
      .querySelectorAll(
        "[data-attraction-id]"
      )
      .forEach((card) => {
        card.addEventListener(
          "click",
          () => {
            const tripDayId =
              card.dataset.tripDay;

            const attractionId =
              Number(
                card.dataset
                  .attractionId
              );

            const info =
              state.attractionsByDay[
                tripDayId
              ];

            if (!info) {
              return;
            }

            card.classList.toggle(
              "is-selected"
            );

            if (
              card.classList.contains(
                "is-selected"
              )
            ) {
              if (
                !info.selectedIds.includes(
                  attractionId
                )
              ) {
                info.selectedIds.push(
                  attractionId
                );
              }

            } else {
              info.selectedIds =
                info.selectedIds.filter(
                  (id) =>
                    id !==
                    attractionId
                );
            }
          }
        );
      });
  }

  /* =========================================================
     STEP 5 — PREFERENCES
  ========================================================= */

  function wireBudget() {
    document
      .querySelectorAll(
        "#plan-budget-cards [data-budget]"
      )
      .forEach((card) => {
        card.addEventListener(
          "click",
          () => {
            document
              .querySelectorAll(
                "#plan-budget-cards [data-budget]"
              )
              .forEach((item) =>
                item.classList.remove(
                  "is-selected"
                )
              );

            card.classList.add(
              "is-selected"
            );

            state.budget =
              Number(
                card.dataset.budget
              );
          }
        );
      });
  }

  function wireTravelers() {
    document
      .querySelectorAll(
        "[data-adjust='travelers']"
      )
      .forEach((btn) => {
        btn.addEventListener(
          "click",
          () => {
            const dir =
              Number(
                btn.dataset.dir
              );

            state.travelers =
              Math.max(
                1,
                state.travelers +
                  dir
              );

            const count =
              document.getElementById(
                "plan-travelers-count"
              );

            if (count) {
              count.textContent =
                state.travelers;
            }
          }
        );
      });
  }

  function wireStyles() {
    document
      .querySelectorAll(
        "#plan-style-cards [data-style]"
      )
      .forEach((card) => {
        card.addEventListener(
          "click",
          () => {
            const style =
              card.dataset.style;

            card.classList.toggle(
              "is-selected"
            );

            if (
              card.classList.contains(
                "is-selected"
              )
            ) {
              if (
                !state.styles.includes(
                  style
                )
              ) {
                state.styles.push(
                  style
                );
              }

            } else {
              state.styles =
                state.styles.filter(
                  (item) =>
                    item !== style
                );
            }
          }
        );
      });
  }

  /* =========================================================
     AI ASSISTANT
  ========================================================= */

  function findAiInput() {
    return (
      document.getElementById(
        "ai-input"
      ) ||
      document.querySelector(
        "[data-ai-input]"
      )
    );
  }

  function findAiSendButton() {
    return (
      document.getElementById(
        "ai-send"
      ) ||
      document.querySelector(
        "[data-ai-send]"
      )
    );
  }

  function findAiForm() {
    return document.getElementById(
      "ai-form"
    );
  }

  function findAiOutput() {
    return (
      document.getElementById(
        "ai-messages"
      ) ||
      document.querySelector(
        "[data-ai-response]"
      )
    );
  }

  function extractAiText(response) {
    if (!response) {
      return "";
    }

    if (
      typeof response ===
      "string"
    ) {
      return response;
    }

    return (
      response.question ||
      response?.data?.question ||
      response.recommendation ||
      response?.data?.recommendation ||
      response.answer ||
      response?.data?.answer ||
      response.message ||
      response?.data?.message ||
      response.text ||
      response?.data?.text ||
      ""
    );
  }

  function extractConversationId(
    response
  ) {
    if (!response) {
      return null;
    }

    return (
      response.conversation_id ??
      response.conversationId ??
      response?.data?.conversation_id ??
      response?.data?.conversationId ??
      response?.conversation?.id ??
      response?.data?.conversation?.id ??
      null
    );
  }

  function renderAiMessage(
    text,
    type = "assistant"
  ) {
    const output =
      findAiOutput();

    if (
      !output ||
      !text
    ) {
      return;
    }

    const message =
      document.createElement(
        "div"
      );

    message.className =
      type === "user"
        ? "tl-ai-msg tl-ai-msg--user"
        : "tl-ai-msg tl-ai-msg--ai";

    message.textContent =
      String(text);

    output.appendChild(
      message
    );

    output.scrollTop =
      output.scrollHeight;
  }

  function buildAiPayload(message) {
    const payload = {
      message:
        String(message).trim()
    };

    if (
      state.aiConversationId
    ) {
      payload.conversation_id =
        state.aiConversationId;
    }

    return payload;
  }

  /* =========================================================
     AI PLANS
  ========================================================= */

  function extractPlans(response) {
    if (!response) {
      return [];
    }

    if (
      Array.isArray(
        response.plans
      )
    ) {
      return response.plans;
    }

    if (
      Array.isArray(
        response?.data?.plans
      )
    ) {
      return response.data.plans;
    }

    if (
      Array.isArray(
        response?.data?.data?.plans
      )
    ) {
      return response.data.data.plans;
    }

    return [];
  }

  /*
   * Get the real database ID of the AI plan.
   *
   * The /choose endpoint requires:
   *
   * {
   *   "plan_id": ID
   * }
   */
  function extractAiPlanId(plan) {
    if (!plan) {
      return null;
    }

    const value =
      plan.plan_id ??
      plan.planId ??
      plan.id ??
      plan.Id ??
      plan?.data?.plan_id ??
      plan?.data?.id ??
      null;

    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return null;
    }

    const numericId =
      Number(value);

    return Number.isFinite(
      numericId
    )
      ? numericId
      : value;
  }

  function getAiPlansMount() {
    let mount =
      document.getElementById(
        "ai-plans"
      );

    if (mount) {
      return mount;
    }

    const assistantCard =
      document.getElementById(
        "ai-assistant-card"
      );

    if (!assistantCard) {
      console.error(
        "#ai-assistant-card not found"
      );

      return null;
    }

    mount =
      document.createElement(
        "div"
      );

    mount.id =
      "ai-plans";

    mount.className =
      "tl-mt-32";

    assistantCard.appendChild(
      mount
    );

    return mount;
  }

  function buildAiDayCard(day) {
    const dayNumber =
      day?.day_number ??
      day?.dayNumber ??
      "";

    const rawCity =
      day?.city_name ??
      day?.cityName ??
      day?.city ??
      "";

    const cityName =
      typeof rawCity ===
      "string"
        ? rawCity
        : (
            rawCity?.name ||
            rawCity?.city_name ||
            ""
          );

    const activities =
      day?.activities ??
      day?.activity ??
      day?.description ??
      "";

    let activitiesHtml = "";

    if (
      typeof activities ===
        "string" &&
      activities
    ) {
      activitiesHtml = `
        <p
          class="tl-text-secondary"
          style="
            margin-top:8px;
            line-height:1.6;
          "
        >
          ${window.TL.Util.escape(
            activities
          )}
        </p>
      `;
    }

    if (
      Array.isArray(
        activities
      )
    ) {
      activitiesHtml = `
        <ul
          class="tl-text-secondary"
          style="
            margin-top:8px;
            padding-left:20px;
            line-height:1.7;
          "
        >
          ${activities
            .map(
              (activity) => {
                const value =
                  typeof activity ===
                  "string"
                    ? activity
                    : (
                        activity?.name ||
                        activity
                          ?.description ||
                        ""
                      );

                return `
                  <li>
                    ${window.TL.Util.escape(
                      value
                    )}
                  </li>
                `;
              }
            )
            .join("")}
        </ul>
      `;
    }

    return `
      <div
        style="
          padding:14px;
          border:
            1px solid
            rgba(255,255,255,.08);
          border-radius:12px;
          background:
            rgba(255,255,255,.03);
        "
      >

        <strong>
          Day ${window.TL.Util.escape(
            dayNumber
          )}

          ${
            cityName
              ? ` — ${window.TL.Util.escape(
                  cityName
                )}`
              : ""
          }
        </strong>

        ${activitiesHtml}

      </div>
    `;
  }

  function buildAiPlanCard(
    plan,
    index
  ) {
    const planId =
      extractAiPlanId(
        plan
      );

    const planName =
      plan?.plan_name ||
      plan?.name ||
      plan?.title ||
      `Travel Plan ${index + 1}`;

    const description =
      plan?.description ||
      plan?.summary ||
      "";

    const cities =
      Array.isArray(
        plan?.cities
      )
        ? plan.cities
        : [];

    const itinerary =
      Array.isArray(
        plan?.itinerary
      )
        ? plan.itinerary
        : [];

    return `
      <div
        class="tl-card"
        data-ai-plan-card="${index}"
        data-ai-plan-id="${window.TL.Util.escape(
          planId ?? ""
        )}"
        style="
          padding:22px;
          height:100%;
        "
      >

        <span class="tl-badge">
          ✦ Plan ${index + 1}
        </span>

        <h3
          style="
            margin-top:14px;
            margin-bottom:10px;
            font-size:20px;
          "
        >
          ${window.TL.Util.escape(
            planName
          )}
        </h3>

        ${
          description
            ? `
              <p
                class="tl-text-secondary"
                style="
                  line-height:1.7;
                  margin-bottom:18px;
                "
              >
                ${window.TL.Util.escape(
                  description
                )}
              </p>
            `
            : ""
        }

        ${
          cities.length
            ? `
              <div
                style="
                  margin-bottom:20px;
                "
              >

                <strong>
                  🏙️ Cities
                </strong>

                <div
                  style="
                    display:flex;
                    flex-wrap:wrap;
                    gap:8px;
                    margin-top:10px;
                  "
                >
                  ${cities
                    .map(
                      (city) => {
                        const cityName =
                          typeof city ===
                          "string"
                            ? city
                            : (
                                city?.name ||
                                city
                                  ?.city_name ||
                                ""
                              );

                        return `
                          <span class="tl-badge">
                            ${window.TL.Util.escape(
                              cityName
                            )}
                          </span>
                        `;
                      }
                    )
                    .join("")}
                </div>

              </div>
            `
            : ""
        }

        ${
          itinerary.length
            ? `
              <div>

                <strong>
                  📅 Itinerary
                </strong>

                <div
                  style="
                    display:flex;
                    flex-direction:column;
                    gap:10px;
                    margin-top:12px;
                  "
                >
                  ${itinerary
                    .map(
                      (day) =>
                        buildAiDayCard(
                          day
                        )
                    )
                    .join("")}
                </div>

              </div>
            `
            : `
              <p
                class="tl-text-secondary"
                style="
                  margin-top:16px;
                "
              >
                No itinerary details available.
              </p>
            `
        }

        <button
          type="button"
          class="
            tl-btn
            tl-btn--primary
          "
          data-ai-plan-index="${index}"
          data-ai-plan-id="${window.TL.Util.escape(
            planId ?? ""
          )}"
          style="
            width:100%;
            margin-top:20px;
          "
        >
          Choose Plan ${index + 1}
        </button>

      </div>
    `;
  }

  function renderAiPlans(plans) {
    const mount =
      getAiPlansMount();

    if (!mount) {
      return;
    }

    console.log(
      "RENDERING AI PLANS:",
      plans
    );

    console.table(
      plans.map(
        (plan, index) => ({
          index,
          id:
            extractAiPlanId(
              plan
            ),
          name:
            plan?.plan_name ||
            plan?.name ||
            plan?.title ||
            ""
        })
      )
    );

    if (
      !Array.isArray(plans) ||
      plans.length === 0
    ) {
      mount.innerHTML = `
        <div
          class="tl-card"
          style="
            padding:24px;
            margin-top:24px;
          "
        >
          <p class="tl-text-secondary">
            No travel plans were generated.
          </p>
        </div>
      `;

      return;
    }

    mount.innerHTML = `
      <div
        style="
          margin-top:32px;
          margin-bottom:20px;
        "
      >

        <span class="tl-badge">
          ✦ AI Generated Plans
        </span>

        <h2
          style="
            margin-top:14px;
            margin-bottom:8px;
          "
        >
          Choose your travel plan
        </h2>

        <p class="tl-text-secondary">
          Here are ${plans.length}
          travel plans created for you.
        </p>

      </div>

      <div
        id="ai-plans-grid"
        style="
          display:grid;
          grid-template-columns:
            repeat(
              auto-fit,
              minmax(300px,1fr)
            );
          gap:20px;
          align-items:start;
        "
      >

        ${plans
          .map(
            (plan, index) =>
              buildAiPlanCard(
                plan,
                index
              )
          )
          .join("")}

      </div>
    `;

    wireAiPlanButtons(
      plans
    );

    setTimeout(
      () => {
        mount.scrollIntoView({
          behavior:
            "smooth",
          block:
            "start"
        });
      },
      100
    );
  }

  /* =========================================================
     SAVE CHOSEN AI PLAN
  ========================================================= */

  async function saveChosenAiPlan(
    selectedPlan,
    index,
    button
  ) {
    if (
      !state.aiConversationId
    ) {
      console.error(
        "Missing AI conversation ID."
      );

      window.TL.toast(
        "Conversation ID is missing.",
        "error"
      );

      return;
    }

    if (
      !window.TL?.Ai?.choosePlan ||
      typeof window.TL.Ai
        .choosePlan !==
        "function"
    ) {
      console.error(
        "TL.Ai.choosePlan() is missing."
      );

      window.TL.toast(
        "Choose plan API is not available.",
        "error"
      );

      return;
    }

    /*
     * IMPORTANT:
     * Get REAL plan ID.
     */
    const planId =
      extractAiPlanId(
        selectedPlan
      );

    console.log(
      "======================================"
    );

    console.log(
      "SELECTED PLAN OBJECT:",
      selectedPlan
    );

    console.log(
      "SELECTED PLAN INDEX:",
      index
    );

    console.log(
      "SELECTED PLAN ID:",
      planId
    );

    console.log(
      "CONVERSATION ID:",
      state.aiConversationId
    );

    /*
     * Do not use index as plan ID.
     */
    if (
      planId === null ||
      planId === undefined ||
      planId === ""
    ) {
      console.error(
        "PLAN DOES NOT HAVE AN ID:",
        selectedPlan
      );

      window.TL.toast(
        "This plan does not have a plan ID.",
        "error"
      );

      return;
    }

    const oldText =
      button.textContent;

    document
      .querySelectorAll(
        "[data-ai-plan-index]"
      )
      .forEach((item) => {
        item.disabled =
          true;
      });

    button.textContent =
      "Saving trip...";

    try {
      /*
       * This is EXACTLY what backend requested:
       *
       * {
       *   "plan_id": 123
       * }
       */
      const payload = {
        plan_id:
          planId
      };

      console.log(
        `POST /ai/travel/${state.aiConversationId}/choose`
      );

      console.log(
        "CHOOSE PLAN PAYLOAD:",
        payload
      );

      const response =
        await window.TL.Ai
          .choosePlan(
            state.aiConversationId,
            payload
          );

      console.log(
        "CHOOSE PLAN RESPONSE:",
        response
      );

      state.selectedAiPlan =
        selectedPlan;

      /*
       * Extract created Trip ID.
       */
      const tripId =
        response?.trip_id ??
        response?.tripId ??
        response?.data?.trip_id ??
        response?.data?.tripId ??
        response?.trip?.id ??
        response?.data?.trip?.id ??
        null;

      console.log(
        "SAVED TRIP ID:",
        tripId
      );

      if (tripId) {
        state.tripId =
          tripId;
      }

      /*
       * Reset buttons.
       */
      document
        .querySelectorAll(
          "[data-ai-plan-index]"
        )
        .forEach((item) => {
          const itemIndex =
            Number(
              item.dataset
                .aiPlanIndex
            );

          item.disabled =
            false;

          item.textContent =
            `Choose Plan ${
              itemIndex + 1
            }`;
        });

      button.textContent =
        "✓ Selected & Saved";

      button.disabled =
        true;

      window.TL.toast(
        "Trip saved successfully!"
      );

      /*
       * Redirect if backend returned trip_id.
       */
      if (tripId) {
        setTimeout(
          () => {
            window.location.href =
              `trip-details.html?id=${encodeURIComponent(
                tripId
              )}`;
          },
          700
        );
      }

    } catch (err) {
      console.error(
        "CHOOSE PLAN ERROR:",
        err
      );

      document
        .querySelectorAll(
          "[data-ai-plan-index]"
        )
        .forEach((item) => {
          item.disabled =
            false;
        });

      button.textContent =
        oldText ||
        `Choose Plan ${index + 1}`;

      const errorMessage =
        err?.message ||
        err?.data?.message ||
        "Couldn't save the selected trip.";

      window.TL.toast(
        errorMessage,
        "error"
      );

      renderAiMessage(
        errorMessage,
        "assistant"
      );
    }
  }

  /* =========================================================
     AI PLAN BUTTONS
  ========================================================= */

  function wireAiPlanButtons(
    plans
  ) {
    document
      .querySelectorAll(
        "[data-ai-plan-index]"
      )
      .forEach((button) => {
        button.addEventListener(
          "click",
          async () => {
            const index =
              Number(
                button.dataset
                  .aiPlanIndex
              );

            if (
              !Number.isInteger(
                index
              )
            ) {
              return;
            }

            const selectedPlan =
              plans[index];

            if (!selectedPlan) {
              console.error(
                "Selected AI plan not found:",
                index
              );

              window.TL.toast(
                "Plan not found.",
                "error"
              );

              return;
            }

            await saveChosenAiPlan(
              selectedPlan,
              index,
              button
            );
          }
        );
      });
  }

  function showPlansLoading() {
    const mount =
      getAiPlansMount();

    if (!mount) {
      return;
    }

    mount.innerHTML = `
      <div
        class="tl-card tl-state"
        style="
          padding:28px;
          margin-top:24px;
        "
      >

        <div class="tl-state-icon">
          ✦
        </div>

        <h3>
          Creating your travel plans
        </h3>

        <p>
          AI is preparing 3 different options for you...
        </p>

      </div>
    `;
  }

  function handlePlansReady(
    response
  ) {
    const plans =
      extractPlans(
        response
      );

    console.log(
      "PLANS READY RESPONSE:",
      response
    );

    console.log(
      "EXTRACTED PLANS:",
      plans
    );

    if (!plans.length) {
      renderAiMessage(
        "Your information is complete, but no travel plans were returned.",
        "assistant"
      );

      return;
    }

    renderAiMessage(
      `✦ Your ${plans.length} travel plans are ready!`,
      "assistant"
    );

    renderAiPlans(
      plans
    );
  }

  async function generateAiPlans(
    travelData = {}
  ) {
    if (
      !state.aiConversationId
    ) {
      console.error(
        "Missing AI conversation ID."
      );

      return;
    }

    if (
      !window.TL?.Ai
        ?.generatePlans ||
      typeof window.TL.Ai
        .generatePlans !==
        "function"
    ) {
      console.error(
        "generatePlans() is not available."
      );

      return;
    }

    showPlansLoading();

    try {
      const response =
        await window.TL.Ai
          .generatePlans(
            state.aiConversationId,
            travelData
          );

      console.log(
        "GENERATE PLANS RESPONSE:",
        response
      );

      handlePlansReady(
        response
      );

    } catch (err) {
      console.error(
        "Generate plans error:",
        err
      );

      const mount =
        getAiPlansMount();

      if (mount) {
        mount.innerHTML = "";
      }

      renderAiMessage(
        err?.message ||
          "Couldn't generate travel plans.",
        "assistant"
      );
    }
  }

  /* =========================================================
     AI SEND
  ========================================================= */

  async function sendAiMessage() {
    const input =
      findAiInput();

    const sendBtn =
      findAiSendButton();

    if (
      !input ||
      !sendBtn
    ) {
      return;
    }

    if (state.aiBusy) {
      return;
    }

    const userMessage =
      input.value.trim();

    if (!userMessage) {
      input.focus();

      return;
    }

    if (
      !window.TL?.Ai?.travel ||
      typeof window.TL.Ai
        .travel !==
        "function"
    ) {
      window.TL.toast(
        "AI service is not available",
        "error"
      );

      return;
    }

    state.aiBusy = true;

    const oldText =
      sendBtn.textContent;

    sendBtn.disabled =
      true;

    sendBtn.textContent =
      "Thinking…";

    renderAiMessage(
      userMessage,
      "user"
    );

    input.value = "";
    input.disabled = true;

    try {
      const payload =
        buildAiPayload(
          userMessage
        );

      console.log(
        "AI REQUEST:",
        payload
      );

      const response =
        await window.TL.Ai.travel(
          payload
        );

      console.log(
        "AI RESPONSE:",
        response
      );

      const conversationId =
        extractConversationId(
          response
        );

      if (conversationId) {
        state.aiConversationId =
          conversationId;

        console.log(
          "AI CONVERSATION ID:",
          state.aiConversationId
        );
      }

      /*
       * Plans may already be included.
       */
      const returnedPlans =
        extractPlans(
          response
        );

      if (
        response?.status ===
          "plans_ready" ||
        returnedPlans.length > 0
      ) {
        handlePlansReady(
          response
        );

        return;
      }

      const text =
        extractAiText(
          response
        );

      if (text) {
        renderAiMessage(
          text,
          "assistant"
        );
      }

      if (
        response?.status ===
        "complete"
      ) {
        if (!text) {
          renderAiMessage(
            "Perfect! I have all the information I need.",
            "assistant"
          );
        }

        if (
          window.TL?.Ai
            ?.generatePlans &&
          typeof window.TL.Ai
            .generatePlans ===
            "function"
        ) {
          renderAiMessage(
            "✦ Creating 3 travel plans for you...",
            "assistant"
          );

          await generateAiPlans(
            response?.data || {}
          );
        }

        return;
      }

      if (!text) {
        renderAiMessage(
          "I received your information. Please continue.",
          "assistant"
        );
      }

    } catch (err) {
      console.error(
        "AI ERROR:",
        err
      );

      const errorMessage =
        err?.message ||
        err?.data?.message ||
        "Sorry, I couldn't process your request.";

      renderAiMessage(
        errorMessage,
        "assistant"
      );

      window.TL.toast(
        errorMessage,
        "error"
      );

    } finally {
      state.aiBusy =
        false;

      sendBtn.disabled =
        false;

      sendBtn.textContent =
        oldText ||
        "Send";

      input.disabled =
        false;

      input.focus();
    }
  }

  function wireAiAssistant() {
    const form =
      findAiForm();

    const input =
      findAiInput();

    const sendBtn =
      findAiSendButton();

    const output =
      findAiOutput();

    if (
      !input ||
      !sendBtn ||
      !output
    ) {
      console.error(
        "AI elements missing.",
        {
          form,
          input,
          sendBtn,
          output
        }
      );

      return;
    }

    if (form) {
      form.addEventListener(
        "submit",
        (event) => {
          event.preventDefault();

          sendAiMessage();
        }
      );

    } else {
      sendBtn.addEventListener(
        "click",
        (event) => {
          event.preventDefault();

          sendAiMessage();
        }
      );

      input.addEventListener(
        "keydown",
        (event) => {
          if (
            event.key ===
              "Enter" &&
            !event.shiftKey
          ) {
            event.preventDefault();

            sendAiMessage();
          }
        }
      );
    }

    console.log(
      "AI Assistant ready."
    );
  }

  /* =========================================================
     SAVE ATTRACTIONS
  ========================================================= */

  async function saveAttractions() {
    const entries =
      Object.entries(
        state.attractionsByDay
      );

    for (
      const [
        tripDayId,
        info
      ] of entries
    ) {
      if (
        !info.selectedIds.length
      ) {
        continue;
      }

      const payload = {
        attraction_ids:
          info.selectedIds.map(
            Number
          )
      };

      await window.TL.Trips
        .selectDayAttractions(
          tripDayId,
          payload
        );
    }
  }

  /* =========================================================
     FINISH
  ========================================================= */

  async function finishTrip() {
    const nextBtn =
      document.getElementById(
        "planner-next"
      );

    if (nextBtn) {
      nextBtn.disabled = true;

      nextBtn.textContent =
        "Saving trip…";
    }

    try {
      await saveAttractions();

      window.TL.toast(
        "Your trip is ready!"
      );

      window.location.href =
        `trip-details.html?id=${encodeURIComponent(
          state.tripId
        )}`;

    } catch (err) {
      console.error(
        "Finish trip error:",
        err
      );

      window.TL.toast(
        err.message ||
          "Couldn't finish the trip.",
        "error"
      );

      if (nextBtn) {
        nextBtn.disabled =
          false;

        nextBtn.textContent =
          "Create My Trip";
      }
    }
  }

  /* =========================================================
     INIT
  ========================================================= */

  async function init() {
    const signedOut =
      document.getElementById(
        "planner-signed-out"
      );

    const shell =
      document.getElementById(
        "planner-shell"
      );

    if (
      !window.TL.Auth
        .isAuthenticated()
    ) {
      if (signedOut) {
        signedOut.classList.remove(
          "tl-hidden"
        );
      }

      if (shell) {
        shell.classList.add(
          "tl-hidden"
        );
      }

      return;
    }

    if (signedOut) {
      signedOut.classList.add(
        "tl-hidden"
      );
    }

    if (shell) {
      shell.classList.remove(
        "tl-hidden"
      );
    }

    try {
      await loadCountries();

      await loadAllCities();

    } catch (err) {
      console.error(
        "Planner initial load error:",
        err
      );
    }

    wireCountrySearch();

    wireDates();

    wireBudget();

    wireTravelers();

    wireStyles();

    wireAiAssistant();

    renderCityDays();

    updateStepUI();

    const nextBtn =
      document.getElementById(
        "planner-next"
      );

    const backBtn =
      document.getElementById(
        "planner-back"
      );

    if (nextBtn) {
      nextBtn.addEventListener(
        "click",
        handleNext
      );
    }

    if (backBtn) {
      backBtn.addEventListener(
        "click",
        handleBack
      );
    }

    console.log(
      "PLAN TRIP INITIALIZED"
    );
  }

  document.addEventListener(
    "DOMContentLoaded",
    init
  );

})();