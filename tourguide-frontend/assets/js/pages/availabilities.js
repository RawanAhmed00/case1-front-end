/**
 * TAILORA TOUR GUIDE — AVAILABILITIES PAGE CONTROLLER
 * Full management of availability slots: CREATE, READ, UPDATE, DELETE (CRUD API endpoints).
 */

(function () {
  "use strict";

  let availabilities = [];

  async function loadAvailabilities() {
    window.TL.showLoading();
    try {
      const res = await window.TL.TourGuideApi.getAvailabilities();
      availabilities = Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
      renderAvailabilities();
    } catch (err) {
      window.TL.showToast("Failed to load availabilities: " + err.message, "error");
    } finally {
      window.TL.hideLoading();
    }
  }

  function calculateOperatingHours(start, end) {
    if (!start || !end) return "8 Hours";
    const [sH, sM] = start.split(":").map(Number);
    const [eH, eM] = end.split(":").map(Number);
    let totalMinutes = (eH * 60 + (eM || 0)) - (sH * 60 + (sM || 0));
    if (totalMinutes <= 0) totalMinutes += 24 * 60;
    const hours = (totalMinutes / 60).toFixed(1).replace(/\.0$/, "");
    return `${hours} ${hours === "1" ? "Hour" : "Hours"}`;
  }

  function renderAvailabilities() {
    const container = document.getElementById("availabilitiesList");
    if (!container) return;

    if (availabilities.length === 0) {
      container.innerHTML = `
        <div class="col-12">
          <div class="tl-card tl-empty-state">
            <i class="bi bi-clock-history fs-1 text-teal"></i>
            <h5>No Availability Slots Defined</h5>
            <p class="tl-text-secondary">Set up your availability slots so travelers can book your tours.</p>
            <button class="tl-btn tl-btn--primary mt-3" id="emptyAddBtn">
              <i class="bi bi-plus-lg me-1"></i> Add Your First Availability Slot
            </button>
          </div>
        </div>`;
      document.getElementById("emptyAddBtn")?.addEventListener("click", openAddModal);
      return;
    }

    container.innerHTML = availabilities.map(slot => {
      const formattedDate = slot.date ? slot.date.split('T')[0] : "Available Date";
      const startTime = slot.start_time ? slot.start_time.substring(0, 5) : "09:00";
      const endTime = slot.end_time ? slot.end_time.substring(0, 5) : "17:00";
      const operatingHoursStr = calculateOperatingHours(startTime, endTime);

      return `
        <div class="col-md-6 col-lg-4">
          <div class="tl-card tl-card--hover">
            <div class="tl-card__head">
              <div class="d-flex align-items-center gap-2">
                <i class="bi bi-calendar-check fs-4 text-teal"></i>
                <h5 class="mb-0 text-light">${formattedDate}</h5>
              </div>
              <span class="tl-badge tl-badge--success">Available</span>
            </div>

            <div class="my-3 p-3 rounded-3 tl-card-snippet">
              <div class="d-flex align-items-center justify-content-between mb-2">
                <span class="tl-metadata"><i class="bi bi-clock me-1 text-teal"></i>Operating Hours</span>
                <span class="fw-bold text-light">${startTime} - ${endTime}</span>
              </div>
              <div class="d-flex align-items-center justify-content-between pt-2 border-top border-secondary border-opacity-25">
                <span class="tl-metadata"><i class="bi bi-hourglass-split me-1 text-teal"></i>Total Hours</span>
                <span class="tl-badge tl-badge--info">${operatingHoursStr}</span>
              </div>
            </div>

            <div class="d-flex justify-content-end gap-2 pt-2 border-top border-secondary border-opacity-25">
              <button class="tl-btn tl-btn--outline tl-btn--sm edit-slot-btn" data-id="${slot.id}">
                <i class="bi bi-pencil me-1"></i> Edit
              </button>
              <button class="tl-btn tl-btn--danger tl-btn--sm delete-slot-btn" data-id="${slot.id}">
                <i class="bi bi-trash me-1"></i> Delete
              </button>
            </div>
          </div>
        </div>
      `;
    }).join("");

    container.querySelectorAll(".edit-slot-btn").forEach(b => b.addEventListener("click", () => openEditModal(b.dataset.id)));
    container.querySelectorAll(".delete-slot-btn").forEach(b => b.addEventListener("click", () => confirmDelete(b.dataset.id)));
  }

  function openAddModal() {
    const modalEl = document.getElementById("availabilityModal");
    if (!modalEl) return;

    document.getElementById("availModalTitle").textContent = "Add Availability Slot";
    document.getElementById("availForm").reset();
    document.getElementById("availIdInput").value = "";

    const bsModal = new bootstrap.Modal(modalEl);
    bsModal.show();
  }

  function openEditModal(id) {
    const slot = availabilities.find(a => String(a.id) === String(id));
    if (!slot) return;

    document.getElementById("availModalTitle").textContent = "Edit Availability Slot";
    document.getElementById("availIdInput").value = slot.id;
    
    document.getElementById("availDateInput").value = slot.date ? slot.date.split('T')[0] : "";
    document.getElementById("availStartTimeInput").value = slot.start_time ? slot.start_time.substring(0, 5) : "09:00";
    document.getElementById("availEndTimeInput").value = slot.end_time ? slot.end_time.substring(0, 5) : "17:00";

    const bsModal = new bootstrap.Modal(document.getElementById("availabilityModal"));
    bsModal.show();
  }

  function buildAvailabilityPayload() {
    return {
      date: document.getElementById("availDateInput").value,
      start_time: document.getElementById("availStartTimeInput").value,
      end_time: document.getElementById("availEndTimeInput").value,
      is_available: true
    };
  }

  function showValidationMessage(err) {
    let message = "Validation failed.";

    if (err && err.errors && typeof err.errors === "object") {
      const detailMessages = Object.values(err.errors)
        .flatMap(value => Array.isArray(value) ? value : [value])
        .filter(Boolean);

      if (detailMessages.length) {
        message = detailMessages.join(" ");
      }
    } else if (err && err.message) {
      message = err.message;
    }

    window.TL.showToast(message, "error");
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    e.stopPropagation();

    const form = e.currentTarget;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const id = document.getElementById("availIdInput").value;
    const payload = buildAvailabilityPayload();

    if (!payload.date || !payload.start_time || !payload.end_time) {
      window.TL.showToast("Please fill in the date and time fields.", "error");
      return;
    }

    window.TL.showLoading();
    try {
      if (id) {
        await window.TL.TourGuideApi.updateAvailability(id, payload);
        window.TL.showToast("Availability slot updated successfully!", "success");
      } else {
        await window.TL.TourGuideApi.createAvailability(payload);
        window.TL.showToast("New availability slot created!", "success");
      }

      const bsModal = bootstrap.Modal.getInstance(document.getElementById("availabilityModal"));
      if (bsModal) bsModal.hide();
      await loadAvailabilities();
    } catch (err) {
      if (err && err.name === "ApiValidationError") {
        showValidationMessage(err);
      } else {
        window.TL.showToast("Failed to save availability: " + (err && err.message ? err.message : "Unknown error"), "error");
      }
    } finally {
      window.TL.hideLoading();
    }
  }

  async function confirmDelete(id) {
    if (!confirm("Are you sure you want to delete this availability slot?")) return;

    window.TL.showLoading();
    try {
      await window.TL.TourGuideApi.deleteAvailability(id);
      window.TL.showToast("Availability slot deleted successfully.", "info");
      await loadAvailabilities();
    } catch (err) {
      window.TL.showToast("Failed to delete availability: " + err.message, "error");
    } finally {
      window.TL.hideLoading();
    }
  }

  function init() {
    if (document.body.dataset.page !== "availabilities") return;

    loadAvailabilities();

    document.getElementById("addAvailabilityBtn")?.addEventListener("click", openAddModal);
    document.getElementById("availForm")?.addEventListener("submit", handleFormSubmit);
  }

  document.addEventListener("DOMContentLoaded", init);
})();