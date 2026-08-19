(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    const P = TL.Pages;

    const perPage = 10;
    let currentPage = 1;

    function values(form, prefix) {
      const data = {};
      form.querySelectorAll("[name]").forEach(function (el) {
        if (el.name === "hotel_id") return;
        if (!el.name.startsWith(prefix)) return;
        if (el.value !== "") {
          data[el.name.replace(prefix, "")] = el.value;
        }
      });
      return data;
    }

    function getHotelFromResponse(response) {
      if (response && response.data && !Array.isArray(response.data)) return response.data;
      return response || {};
    }

    async function submit(form, fn, msg, closeModalId) {
      P.clearErrors(form);
      const button = form.querySelector("button[type=submit]");
      P.setBusy(button, true);

      try {
        await fn();
        TL.showToast(msg, "success");
        form.reset();
        if (closeModalId) {
          const modalEl = document.getElementById(closeModalId);
          if (modalEl) bootstrap.Modal.getInstance(modalEl)?.hide();
        }
        await loadHotels(currentPage);
      } catch (e) {
        if (e instanceof TL.Api.ApiValidationError) {
          P.showValidation(form, e.errors);
        }
        TL.showToast(e.message || "Something went wrong.", "error");
      } finally {
        P.setBusy(button, false);
      }
    }

    // LOAD HOTELS
    async function loadHotels(page = 1) {
      const list = document.getElementById("hotelList");
      if (!list) return;
      currentPage = page;

      list.innerHTML = `
        <div class="tl-inline-loader">
          <div class="tl-spinner"></div>
        </div>
      `;

      try {
        const response = await TL.Hotels.getHotels({ page: currentPage, per_page: perPage });
        const { rows: hotels, meta } = P.extractPagination(response, currentPage, perPage);

        if (!hotels.length) {
          list.innerHTML = `
            <div style="padding: 24px;">
              ${P.empty("No hotels found", "No hotel listings added yet.", "bi-building")}
            </div>
          `;
          return;
        }

        const totalHotels = meta ? meta.total : hotels.length;
        const paginationHtml = P.buildPagination(meta, "data-hotel-page", "hotels", currentPage);

        list.innerHTML = `
          <div class="tl-card__head" style="padding: 24px 24px 0;">
            <div>
              <h2 class="tl-section-title">Hotel Directory</h2>
              <span class="tl-metadata">All active accommodations and partner hotels</span>
            </div>
            <span class="tl-badge tl-badge--info">${totalHotels} hotels</span>
          </div>

          <div style="padding: 0 24px 24px;">
            <div class="tl-table-wrap">
              <table class="tl-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>City</th>
                    <th>Price / Night</th>
                    <th>Rating</th>
                    <th>Available Rooms</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${hotels.map(function (hotel) {
                    return `
                      <tr>
                        <td><strong>#${P.escape(P.display(hotel.id))}</strong></td>
                        <td>${P.escape(P.display(hotel.name))}</td>
                        <td>${P.escape(P.display(hotel.city))}</td>
                        <td>${hotel.price_per_night != null ? `$${P.escape(hotel.price_per_night)}` : "—"}</td>
                        <td>
                          ${hotel.rating != null ? `<span class="tl-badge tl-badge--warning"><i class="bi bi-star-fill"></i> ${P.escape(hotel.rating)}</span>` : "—"}
                        </td>
                        <td>${P.escape(P.display(hotel.available_rooms))}</td>
                        <td>
                          <div class="tl-table-actions">
                            <button
                              type="button"
                              class="tl-btn tl-btn--outline tl-btn--sm hotel-edit-btn"
                              data-id="${P.escape(hotel.id)}"
                              title="Edit Hotel"
                            >
                              <i class="bi bi-pencil"></i>
                            </button>
                            <button
                              type="button"
                              class="tl-btn tl-btn--danger tl-btn--sm hotel-delete-btn"
                              data-id="${P.escape(hotel.id)}"
                              title="Delete Hotel"
                            >
                              <i class="bi bi-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    `;
                  }).join("")}
                </tbody>
              </table>
            </div>
          </div>
          ${paginationHtml}
        `;

        // Edit button listener
        list.querySelectorAll(".hotel-edit-btn").forEach(function (button) {
          button.addEventListener("click", function () {
            const id = button.dataset.id;
            if (!id) return TL.showToast("Invalid hotel ID.", "error");
            loadHotelForEdit(id);
          });
        });

        // Delete button listener
        list.querySelectorAll(".hotel-delete-btn").forEach(function (button) {
          button.addEventListener("click", async function () {
            const id = button.dataset.id;
            if (!id) return TL.showToast("Invalid hotel ID.", "error");
            if (!P.confirm("Delete this hotel? This cannot be undone.")) return;

            try {
              await TL.Hotels.deleteHotel(id);
              TL.showToast("Hotel deleted successfully.", "success");
              await loadHotels(currentPage);
            } catch (e) {
              TL.showToast(e.message || "Failed to delete hotel.", "error");
            }
          });
        });

        // Pagination buttons listener
        list.querySelectorAll("[data-hotel-page]").forEach(function (button) {
          button.addEventListener("click", function () {
            const target = parseInt(this.dataset.hotelPage, 10);
            if (!isNaN(target) && target >= 1 && target !== currentPage) {
              loadHotels(target);
            }
          });
        });

      } catch (e) {
        list.innerHTML = `
          <div style="padding: 24px;">
            ${P.error(e.message || "Failed to load hotels.")}
          </div>
        `;
      }
    }

    // Load Single Hotel for Edit
    async function loadHotelForEdit(id) {
      try {
        const response = await TL.Hotels.getHotel(id);
        const hotel = getHotelFromResponse(response);

        if (!hotel || !hotel.id) {
          return TL.showToast("Failed to fetch hotel details.", "error");
        }

        const idField = document.getElementById("edit_hotel_id");
        const nameField = document.getElementById("edit_name");
        const cityField = document.getElementById("edit_city");
        const addressField = document.getElementById("edit_address");
        const priceField = document.getElementById("edit_price_per_night");
        const roomsField = document.getElementById("edit_available_rooms");
        const ratingField = document.getElementById("edit_rating");
        const descriptionField = document.getElementById("edit_description");

        if (idField) idField.value = hotel.id;
        if (nameField) nameField.value = hotel.name || "";
        if (cityField) cityField.value = hotel.city || "";
        if (addressField) addressField.value = hotel.address || "";
        if (priceField) priceField.value = hotel.price_per_night != null ? hotel.price_per_night : "";
        if (roomsField) roomsField.value = hotel.available_rooms != null ? hotel.available_rooms : "";
        if (ratingField) ratingField.value = hotel.rating != null ? hotel.rating : "";
        if (descriptionField) descriptionField.value = hotel.description || "";

        const modalEl = document.getElementById("hotelEditModal");
        if (modalEl) {
          bootstrap.Modal.getOrCreateInstance(modalEl).show();
        }
      } catch (e) {
        TL.showToast(e.message || "Could not load hotel.", "error");
      }
    }

    // FORM: Create Hotel
    const createForm = document.getElementById("hotelCreateForm");
    if (createForm) {
      createForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const data = values(createForm, "create_");
        submit(
          createForm,
          function () {
            return TL.Hotels.createHotel(data);
          },
          "Hotel added successfully.",
          "hotelCreateModal"
        );
      });
    }

    // FORM: Edit Hotel
    const editForm = document.getElementById("hotelEditForm");
    if (editForm) {
      editForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const idField = document.getElementById("edit_hotel_id");
        const id = idField ? idField.value : null;
        if (!id) return TL.showToast("Missing hotel ID.", "error");

        const data = values(editForm, "edit_");
        submit(
          editForm,
          function () {
            return TL.Hotels.updateHotel(id, data);
          },
          "Hotel updated successfully.",
          "hotelEditModal"
        );
      });
    }

    const refreshBtn = document.getElementById("hotelsRefresh");
    if (refreshBtn) refreshBtn.addEventListener("click", () => loadHotels(currentPage));

    // Initial load
    loadHotels(1);
  });
})();