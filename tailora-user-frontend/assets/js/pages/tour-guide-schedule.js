/**
 * TAILORA USER — TOUR GUIDE SCHEDULE PAGE
 */

(function () {
  "use strict";

  let schedules = [];
  let currentMonth = null;
  let selectedDate = null;

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ];

  function parseDate(dateString) {
    if (!dateString) return null;

    const date = new Date(dateString);

    return Number.isNaN(date.getTime())
      ? null
      : date;
  }

  function dateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  function formatSelectedDate(date) {
    return new Intl.DateTimeFormat("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric"
    }).format(date);
  }

  function formatTime(time) {
    if (!time) return "";

    const [hours, minutes] = time.split(":").map(Number);

    const date = new Date();
    date.setHours(hours, minutes, 0, 0);

    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit"
    }).format(date);
  }

  function getDuration(startTime, endTime) {
    if (!startTime || !endTime) return "";

    const start = startTime.split(":").map(Number);
    const end = endTime.split(":").map(Number);

    const startMinutes = start[0] * 60 + start[1];
    const endMinutes = end[0] * 60 + end[1];

    let difference = endMinutes - startMinutes;

    if (difference < 0) {
      difference += 24 * 60;
    }

    const hours = Math.floor(difference / 60);
    const minutes = difference % 60;

    if (minutes === 0) {
      return `${hours} ${hours === 1 ? "hour" : "hours"}`;
    }

    return `${hours}h ${minutes}m`;
  }

  function escapeHtml(value) {
    if (value === null || value === undefined) {
      return "";
    }

    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function schedulesForDate(date) {
    const key = dateKey(date);

    return schedules.filter((schedule) => {
      const scheduleDate = parseDate(schedule.tour_date);

      return scheduleDate && dateKey(scheduleDate) === key;
    });
  }

  function hasSchedule(date) {
    return schedulesForDate(date).length > 0;
  }

  function renderMonth() {
    const monthElement =
      document.getElementById("calendar-month");

    const grid =
      document.getElementById("calendar-grid");

    if (!monthElement || !grid || !currentMonth) {
      return;
    }

    monthElement.textContent =
      `${monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;

    grid.innerHTML = "";

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const firstWeekday = firstDay.getDay();

    const daysInMonth =
      new Date(year, month + 1, 0).getDate();

    // Empty cells before first day
    for (let i = 0; i < firstWeekday; i++) {
      const empty = document.createElement("div");

      empty.className =
        "tl-calendar-day is-empty";

      grid.appendChild(empty);
    }

    // Calendar days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);

      const button =
        document.createElement("button");

      button.type = "button";
      button.className = "tl-calendar-day";

      const key = dateKey(date);

      if (
        selectedDate &&
        key === dateKey(selectedDate)
      ) {
        button.classList.add("is-selected");
      }

      if (hasSchedule(date)) {
        button.classList.add("has-schedule");
      }

      const today = new Date();

      if (key === dateKey(today)) {
        button.classList.add("is-today");
      }

      button.innerHTML = `
        <span class="tl-calendar-day-number">
          ${day}
        </span>

        ${
          hasSchedule(date)
            ? `<span class="tl-calendar-dot"></span>`
            : ""
        }
      `;

      button.addEventListener("click", () => {
        selectedDate = date;

        renderMonth();
        renderSelectedDay();
      });

      grid.appendChild(button);
    }
  }

  function renderSelectedDay() {
    const dateElement =
      document.getElementById("selected-date");

    const list =
      document.getElementById("schedule-list");

    if (!dateElement || !list) {
      return;
    }

    if (!selectedDate) {
      dateElement.textContent = "Select a date";

      list.innerHTML = `
        <div class="tl-schedule-empty">
          <div class="tl-schedule-empty-icon">◦</div>

          <h3>No date selected</h3>

          <p>
            Select a date from the calendar to view
            tour guide schedules.
          </p>
        </div>
      `;

      return;
    }

    dateElement.textContent =
      formatSelectedDate(selectedDate);

    const items =
      schedulesForDate(selectedDate);

    if (!items.length) {
      list.innerHTML = `
        <div class="tl-schedule-empty">
          <div class="tl-schedule-empty-icon">◦</div>

          <h3>No schedules</h3>

          <p>
            There are no confirmed tour guide
            schedules for this day.
          </p>
        </div>
      `;

      return;
    }

    list.innerHTML =
      items.map(renderScheduleItem).join("");
  }

  function renderScheduleItem(schedule) {
    const guideName =
      schedule.tour_guide &&
      schedule.tour_guide.name
        ? schedule.tour_guide.name
        : "Tour Guide";

    const start =
      formatTime(schedule.start_time);

    const end =
      formatTime(schedule.end_time);

    const duration =
      getDuration(
        schedule.start_time,
        schedule.end_time
      );

    const initials =
      guideName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0))
        .join("")
        .toUpperCase();

    return `
      <article class="tl-schedule-item">

        <div class="tl-schedule-time">
          <strong>
            ${escapeHtml(start)} — ${escapeHtml(end)}
          </strong>

          <span class="tl-schedule-duration">
            ${escapeHtml(duration)}
          </span>
        </div>

        <div class="tl-guide-info">

          <div class="tl-guide-avatar">
            ${escapeHtml(initials || "TG")}
          </div>

          <div>
            <strong>
              ${escapeHtml(guideName)}
            </strong>

            <span>
              Tour Guide
            </span>
          </div>

        </div>

        <span class="tl-schedule-status">
          ${escapeHtml(
            schedule.status || "Confirmed"
          )}
        </span>

      </article>
    `;
  }

  function moveMonth(direction) {
    currentMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + direction,
      1
    );

    selectedDate = null;

    renderMonth();
    renderSelectedDay();
  }

  function setupNavigation() {
    const previousButton =
      document.getElementById("calendar-prev");

    const nextButton =
      document.getElementById("calendar-next");

    if (previousButton) {
      previousButton.addEventListener("click", () => {
        moveMonth(-1);
      });
    }

    if (nextButton) {
      nextButton.addEventListener("click", () => {
        moveMonth(1);
      });
    }
  }

  function getInitialDate() {
    if (schedules.length) {
      const firstDate =
        parseDate(schedules[0].tour_date);

      if (firstDate) {
        return firstDate;
      }
    }

    return new Date();
  }

  async function loadSchedule() {
    const grid =
      document.getElementById("calendar-grid");

    const list =
      document.getElementById("schedule-list");

    if (grid) {
      grid.innerHTML = `
        <div class="tl-schedule-loading">
          Loading schedule...
        </div>
      `;
    }

    if (list) {
      list.innerHTML = `
        <div class="tl-schedule-loading">
          Loading tour guide schedules...
        </div>
      `;
    }

    try {
      schedules =
        await window.TL.TourGuide.getSchedule();

      if (!Array.isArray(schedules)) {
        schedules = [];
      } else {
        schedules = (window.TL && window.TL.Util && typeof window.TL.Util.uniqueBy === "function")
          ? window.TL.Util.uniqueBy(schedules, (s) => `${s.id || ''}_${s.tour_date}_${s.start_time}_${s.end_time}`)
          : schedules;
      }

      const initialDate =
        getInitialDate();

      currentMonth = new Date(
        initialDate.getFullYear(),
        initialDate.getMonth(),
        1
      );

      if (schedules.length) {
        selectedDate = initialDate;
      }

      renderMonth();
      renderSelectedDay();

    } catch (error) {
      console.error(
        "Failed to load tour guide schedule:",
        error
      );

      if (grid) {
        grid.innerHTML = "";
      }

      if (list) {
        list.innerHTML = `
          <div class="tl-schedule-error">
            We couldn't load the tour guide schedule.
            Please try again later.
          </div>
        `;
      }
    }
  }

  async function init() {
    if (!window.TL.Auth.guard()) {
      return;
    }

    setupNavigation();

    await loadSchedule();
  }

  document.addEventListener(
    "DOMContentLoaded",
    init
  );
})();