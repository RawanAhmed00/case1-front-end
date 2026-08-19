(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    const P = TL.Pages;

    // ============================================================
    // Helpers
    // ============================================================

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
      // Laravel Resource Collection:
      // { data: [ ... ], links: {...}, meta: {...} }

      if (response && Array.isArray(response.data)) {
        return response.data;
      }

      // In case TL.Api wraps the Laravel response:
      // { data: { data: [...] } }
      if (
        response &&
        response.data &&
        Array.isArray(response.data.data)
      ) {
        return response.data.data;
      }

      return [];
    }

    function getHotelFromResponse(response) {
      // Laravel single Resource:
      // { data: { id, name, city, ... } }

      if (
        response &&
        response.data &&
        !Array.isArray(response.data)
      ) {
        return response.data;
      }

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

        TL.showToast(
          e.message || "Something went wrong.",
          "error"
        );
      } finally {
        P.setBusy(button, false);
      }
    }

    // ============================================================
    // HOTEL LIST
    // ============================================================

    async function loadHotels() {
      const list = document.getElementById("hotelList");

      if (!list) {
        console.error("hotelList element was not found.");
        return;
      }

      list.innerHTML = `
        <div class="tl-empty">
          <div class="tl-empty__icon">
            <i class="bi bi-hourglass-split"></i>
          </div>
          <div class="tl-section-title">Loading hotels...</div>
        </div>
      `;

      try {
        const response = await TL.Hotels.getHotels();

        console.log("Hotels API response:", response);

        const hotels = getHotelsFromResponse(response);

        console.log("Hotels extracted:", hotels);

        if (!hotels.length) {
          list.innerHTML = `
            <div class="tl-empty">
              <div class="tl-empty__icon">
                <i class="bi bi-building"></i>
              </div>

              <div class="tl-section-title">
                No hotels found
              </div>

              <p class="tl-text-secondary">
                There are no hotels available in the database.
              </p>
            </div>
          `;

          return;
        }

        list.innerHTML = `
          <div class="tl-card__head">
            <div>
              <div class="tl-section-title">
                Hotel List
              </div>

              <p class="tl-text-secondary mb-0">
                Hotels loaded directly from the database.
              </p>
            </div>

            <span class="tl-metadata">
              ${hotels.length} hotels
            </span>
          </div>

          <div class="table-responsive">
            <table class="table tl-table">

              <thead>
                <tr>
                  <th>ID</th>
                  <th>NAME</th>
                  <th>CITY</th>
                  <th>PRICE / NIGHT</th>
                  <th>RATING</th>
                  <th>ROOMS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>

              <tbody>

                ${hotels.map(function (hotel) {
                  return `
                    <tr>

                      <td>
                        ${hotel.id ?? "—"}
                      </td>

                      <td>
                        ${hotel.name ?? "—"}
                      </td>

                      <td>
                        ${hotel.city ?? "—"}
                      </td>

                      <td>
                        ${hotel.price_per_night ?? "—"}
                      </td>

                      <td>
                        ${hotel.rating ?? "—"}
                      </td>

                      <td>
                        ${hotel.available_rooms ?? "—"}
                      </td>

                      <td>
                        <div class="tl-flex tl-gap-sm">

                          <button
                            type="button"
                            class="tl-btn tl-btn--secondary hotel-edit-btn"
                            data-id="${hotel.id}">
                            <i class="bi bi-pencil"></i>
                          </button>

                          <button
                            type="button"
                            class="tl-btn tl-btn--danger hotel-delete-btn"
                            data-id="${hotel.id}">
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
        `;

        // ========================================================
        // EDIT BUTTONS
        // ========================================================

        list
          .querySelectorAll(".hotel-edit-btn")
          .forEach(function (button) {
            button.addEventListener("click", function () {
              const id = button.dataset.id;

              if (!id) {
                TL.showToast(
                  "Invalid hotel ID.",
                  "error"
                );
                return;
              }

              loadHotelForEdit(id);
            });
          });

        // ========================================================
        // DELETE BUTTONS
        // ========================================================

        list
          .querySelectorAll(".hotel-delete-btn")
          .forEach(function (button) {
            button.addEventListener("click", async function () {
              const id = button.dataset.id;

              if (!id) {
                TL.showToast(
                  "Invalid hotel ID.",
                  "error"
                );
                return;
              }

              if (
                !P.confirm(
                  "Delete this hotel? This cannot be undone."
                )
              ) {
                return;
              }

              try {
                await TL.Hotels.deleteHotel(id);

                TL.showToast(
                  "Hotel deleted successfully.",
                  "success"
                );

                await loadHotels();
              } catch (e) {
                TL.showToast(
                  e.message || "Failed to delete hotel.",
                  "error"
                );
              }
            });
          });

      } catch (e) {
        console.error(
          "Failed to load hotels:",
          e
        );

        list.innerHTML = `
          <div class="tl-empty">

            <div class="tl-empty__icon">
              <i class="bi bi-exclamation-triangle"></i>
            </div>

            <div class="tl-section-title">
              Failed to load hotels
            </div>

            <p class="tl-text-secondary">
              ${
                e.message ||
                "Unable to load hotel data."
              }
            </p>

          </div>
        `;

        TL.showToast(
          e.message || "Failed to load hotels.",
          "error"
        );
      }
    }

    // ============================================================
    // LOAD SINGLE HOTEL
    // ============================================================

    async function loadHotelForEdit(id) {
      try {
        const response =
          await TL.Hotels.getHotel(id);

        console.log(
          "Single hotel response:",
          response
        );

        const hotel =
          getHotelFromResponse(response);

        const form =
          document.getElementById(
            "hotelManageForm"
          );

        if (!form) return;

        if (form.hotel_id) {
          form.hotel_id.value =
            hotel.id ?? "";
        }

        if (form.hotel_u_name) {
          form.hotel_u_name.value =
            hotel.name ?? "";
        }

        if (form.hotel_u_city) {
          form.hotel_u_city.value =
            hotel.city ?? "";
        }

        if (form.hotel_u_neighborhood) {
          form.hotel_u_neighborhood.value =
            hotel.neighborhood ?? "";
        }

        if (form.hotel_u_distance_km) {
          form.hotel_u_distance_km.value =
            hotel.distance_km ?? "";
        }

        if (form.hotel_u_price_per_night) {
          form.hotel_u_price_per_night.value =
            hotel.price_per_night ?? "";
        }

        if (form.hotel_u_rating) {
          form.hotel_u_rating.value =
            hotel.rating ?? "";
        }

        if (form.hotel_u_review_count) {
          form.hotel_u_review_count.value =
            hotel.review_count ?? "";
        }

        if (form.hotel_u_amenities) {
          form.hotel_u_amenities.value =
            hotel.amenities ?? "";
        }

        if (form.hotel_u_available_rooms) {
          form.hotel_u_available_rooms.value =
            hotel.available_rooms ?? "";
        }

        form.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });

        TL.showToast(
          "Hotel loaded for editing.",
          "success"
        );

      } catch (e) {
        console.error(
          "Failed to load hotel:",
          e
        );

        TL.showToast(
          e.message ||
            "Failed to load hotel.",
          "error"
        );
      }
    }

    // ============================================================
    // CREATE HOTEL
    // ============================================================

    const createForm =
      document.getElementById(
        "hotelCreateForm"
      );

    if (createForm) {
      createForm.addEventListener(
        "submit",
        function (e) {
          e.preventDefault();

          submit(
            e.currentTarget,
            function () {
              return TL.Hotels.createHotel(
                values(
                  e.currentTarget,
                  "hotel_"
                )
              );
            },
            "Hotel created successfully.",
            "hotelCreateModal"
          );
        }
      );
    }

    // ============================================================
    // UPDATE HOTEL
    // ============================================================

    const manageForm =
      document.getElementById(
        "hotelManageForm"
      );

    if (manageForm) {
      manageForm.addEventListener(
        "submit",
        function (e) {
          e.preventDefault();

          const form = e.currentTarget;
          const id = form.hotel_id.value;

          if (!id) {
            TL.showToast(
              "Enter a hotel ID.",
              "warning"
            );
            return;
          }

          submit(
            form,
            function () {
              return TL.Hotels.updateHotel(
                id,
                values(
                  form,
                  "hotel_u_"
                )
              );
            },
            "Hotel updated successfully."
          );
        }
      );
    }

    // ============================================================
    // DELETE FROM MANAGE FORM
    // ============================================================

    const deleteButton =
      document.getElementById(
        "hotelDeleteBtn"
      );

    if (deleteButton) {
      deleteButton.addEventListener(
        "click",
        async function () {
          const id =
            document.getElementById(
              "hotel_id"
            )?.value;

          if (!id) {
            TL.showToast(
              "Enter a hotel ID.",
              "warning"
            );
            return;
          }

          if (
            !P.confirm(
              "Delete this hotel? This cannot be undone."
            )
          ) {
            return;
          }

          try {
            await TL.Hotels.deleteHotel(id);

            TL.showToast(
              "Hotel deleted successfully.",
              "success"
            );

            if (manageForm) {
              manageForm.reset();
            }

            await loadHotels();

          } catch (e) {
            TL.showToast(
              e.message ||
                "Failed to delete hotel.",
              "error"
            );
          }
        }
      );
    }

    // ============================================================
    // INITIAL LOAD
    // ============================================================

    loadHotels();
  });
})();