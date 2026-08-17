(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    const P = TL.Pages;

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

    function getHotelsFromResponse(response) {
      if (response && Array.isArray(response.data)) return response.data;
      if (response && response.data && Array.isArray(response.data.data)) return response.data.data;
      if (Array.isArray(response)) return response;
      return [];
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
        await loadHotels();
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
    async function loadHotels() {
      const list = document.getElementById("hotelList");
      if (!list) return;

      list.innerHTML = `
        <div class="tl-inline-loader">
          <div class="tl-spinner"></div>
        </div>
      `;

      try {
        const response = await TL.Hotels.getHotels();
        const hotels = getHotelsFromResponse(response);

        if (!hotels.length) {
          list.innerHTML = `
            <div style="padding: 24px;">
              ${P.empty("No hotels found", "There are no hotels available in the database.", "bi-building")}
            </div>
          `;
          return;
        }

        list.innerHTML = `
          <div class="tl-card__head" style="padding: 24px 24px 0;">
            <div>
              <h2 class="tl-section-title">Hotel Directory</h2>
              <span class="tl-metadata">Hotels loaded directly from the database</span>
            </div>
            <span class="tl-badge tl-badge--info">${hotels.length} hotels</span>
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
              await loadHotels();
            } catch (e) {
              TL.showToast(e.message || "Failed to delete hotel.", "error");
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
        const form = document.getElementById("hotelManageForm");
        if (!form) return;

        if (form.hotel_id) form.hotel_id.value = hotel.id ?? "";
        if (form.hotel_u_name) form.hotel_u_name.value = hotel.name ?? "";
        if (form.hotel_u_city) form.hotel_u_city.value = hotel.city ?? "";
        if (form.hotel_u_neighborhood) form.hotel_u_neighborhood.value = hotel.neighborhood ?? "";
        if (form.hotel_u_distance_km) form.hotel_u_distance_km.value = hotel.distance_km ?? "";
        if (form.hotel_u_price_per_night) form.hotel_u_price_per_night.value = hotel.price_per_night ?? "";
        if (form.hotel_u_rating) form.hotel_u_rating.value = hotel.rating ?? "";
        if (form.hotel_u_review_count) form.hotel_u_review_count.value = hotel.review_count ?? "";
        if (form.hotel_u_amenities) form.hotel_u_amenities.value = hotel.amenities ?? "";
        if (form.hotel_u_available_rooms) form.hotel_u_available_rooms.value = hotel.available_rooms ?? "";

        P.clearErrors(form);
        const modalEl = document.getElementById("hotelEditModal");
        if (modalEl) {
          const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
          modal.show();
        }
      } catch (e) {
        TL.showToast(e.message || "Failed to load hotel.", "error");
      }
    }

    // Create Form
    const createForm = document.getElementById("hotelCreateForm");
    if (createForm) {
      createForm.addEventListener("submit", function (e) {
        e.preventDefault();
        submit(
          e.currentTarget,
          () => TL.Hotels.createHotel(values(e.currentTarget, "hotel_")),
          "Hotel created successfully."
        );
      });
    }

    // Update Form
    const manageForm = document.getElementById("hotelManageForm");
    if (manageForm) {
      manageForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const form = e.currentTarget;
        const id = form.hotel_id.value;
        if (!id) return TL.showToast("Enter a hotel ID.", "warning");

        submit(
          form,
          () => TL.Hotels.updateHotel(id, values(form, "hotel_u_")),
          "Hotel updated successfully.",
          "hotelEditModal"
        );
      });
    }

    // Delete Button from Manage Form (inside modal)
    const deleteButton = document.getElementById("hotelDeleteBtn");
    if (deleteButton) {
      deleteButton.addEventListener("click", async function () {
        const id = document.getElementById("hotel_id")?.value;
        if (!id) return TL.showToast("Enter a hotel ID.", "warning");
        if (!P.confirm("Delete this hotel? This cannot be undone.")) return;

        try {
          await TL.Hotels.deleteHotel(id);
          TL.showToast("Hotel deleted successfully.", "success");
          const modalEl = document.getElementById("hotelEditModal");
          if (modalEl) bootstrap.Modal.getInstance(modalEl)?.hide();
          if (manageForm) manageForm.reset();
          await loadHotels();
        } catch (e) {
          TL.showToast(e.message || "Failed to delete hotel.", "error");
        }
      });
    }

    loadHotels();
  });
})();