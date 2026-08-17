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

    styles: []
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
    if (!date) return null;

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

    const start = new Date(
      `${state.startDate}T00:00:00Z`
    );

    const end = new Date(
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

    state.cities =
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

      console.log(
        "POST /trips:",
        tripPayload
      );

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

      const daysPayload =
        buildDaysPayload();

      await window.TL.Trips
        .selectCities(
          tripId,
          daysPayload
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

              state.attractionsByDay[
                tripDayId
              ] = {
                day,

                attractions:
                  extractAttractions(
                    response
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
                          .map((attraction) => {
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
                          })
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
                card.dataset.attractionId
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

            console.log(
              "TRAVELERS:",
              state.travelers
            );
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
        nextBtn.disabled = false;

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

      console.log(
        "PLANNER INITIAL DATA READY"
      );

      console.log(
        "Countries:",
        state.allCountries.length
      );

      console.log(
        "Cities:",
        state.allCities.length
      );

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
  }

  document.addEventListener(
    "DOMContentLoaded",
    init
  );

})();