(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    const P = TL.Pages;

    const perPage = 10;
    let currentPage = 1;

    function vals(form, prefix) {
      const data = {};
      form.querySelectorAll("[name]").forEach(function (el) {
        if (el.name === "restaurant_id") return;
        if (!el.name.startsWith(prefix)) return;
        if (el.value !== "") {
          data[el.name.replace(prefix, "")] =
            el.value === "true" ? true : el.value === "false" ? false : el.value;
        }
      });
      return data;
    }

    function getRestaurantFromResponse(response) {
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
        await loadRestaurants(currentPage);
      } catch (e) {
        if (e instanceof TL.Api.ApiValidationError) {
          P.showValidation(form, e.errors);
        }
        TL.showToast(e.message || "Something went wrong.", "error");
      } finally {
        P.setBusy(button, false);
      }
    }

    // LOAD RESTAURANTS
    async function loadRestaurants(page = 1) {
      const list = document.getElementById("restaurantList");
      if (!list) return;
      currentPage = page;

      list.innerHTML = `
        <div class="tl-inline-loader">
          <div class="tl-spinner"></div>
        </div>
      `;

      try {
        const response = await TL.Restaurants.getRestaurants({ page: currentPage, per_page: perPage });
        const { rows: restaurants, meta } = P.extractPagination(response, currentPage, perPage);

        if (!restaurants.length) {
          list.innerHTML = `
            <div style="padding: 24px;">
              ${P.empty("No restaurants found", "No restaurant listings added yet.", "bi-shop")}
            </div>
          `;
          return;
        }

        const totalRestaurants = meta ? meta.total : restaurants.length;
        const paginationHtml = P.buildPagination(meta, "data-restaurant-page", "restaurants", currentPage);

        list.innerHTML = `
          <div class="tl-card__head" style="padding: 24px 24px 0;">
            <div>
              <h2 class="tl-section-title">Restaurant Directory</h2>
              <span class="tl-metadata">All registered restaurants and dining spots</span>
            </div>
            <span class="tl-badge tl-badge--info">${totalRestaurants} restaurants</span>
          </div>

          <div style="padding: 0 24px 24px;">
            <div class="tl-table-wrap">
              <table class="tl-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>City</th>
                    <th>Address</th>
                    <th>Avg. Cost</th>
                    <th>Rating</th>
                    <th>Votes</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${restaurants.map(function (restaurant) {
                    return `
                      <tr>
                        <td><strong>#${P.escape(P.display(restaurant.id))}</strong></td>
                        <td>${P.escape(P.display(restaurant.name))}</td>
                        <td>${P.escape(P.display(restaurant.city))}</td>
                        <td>${P.escape(P.display(restaurant.address))}</td>
                        <td>${restaurant.average_cost_for_two != null ? `$${P.escape(restaurant.average_cost_for_two)}` : "—"}</td>
                        <td>
                          ${restaurant.rating != null ? `<span class="tl-badge tl-badge--warning"><i class="bi bi-star-fill"></i> ${P.escape(restaurant.rating)}</span>` : "—"}
                        </td>
                        <td>${P.escape(P.display(restaurant.votes))}</td>
                        <td>
                          <div class="tl-table-actions">
                            <button
                              type="button"
                              class="tl-btn tl-btn--outline tl-btn--sm restaurant-edit-btn"
                              data-id="${P.escape(restaurant.id)}"
                              title="Edit Restaurant"
                            >
                              <i class="bi bi-pencil"></i>
                            </button>
                            <button
                              type="button"
                              class="tl-btn tl-btn--danger tl-btn--sm restaurant-delete-btn"
                              data-id="${P.escape(restaurant.id)}"
                              title="Delete Restaurant"
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
        list.querySelectorAll(".restaurant-edit-btn").forEach(function (button) {
          button.addEventListener("click", function () {
            const id = button.dataset.id;
            if (!id) return TL.showToast("Invalid restaurant ID.", "error");
            loadRestaurantForEdit(id);
          });
        });

        // Delete button listener
        list.querySelectorAll(".restaurant-delete-btn").forEach(function (button) {
          button.addEventListener("click", async function () {
            const id = button.dataset.id;
            if (!id) return TL.showToast("Invalid restaurant ID.", "error");
            if (!P.confirm("Delete this restaurant? This cannot be undone.")) return;

            try {
              await TL.Restaurants.deleteRestaurant(id);
              TL.showToast("Restaurant deleted successfully.", "success");
              await loadRestaurants(currentPage);
            } catch (e) {
              TL.showToast(e.message || "Failed to delete restaurant.", "error");
            }
          });
        });

        // Pagination buttons listener
        list.querySelectorAll("[data-restaurant-page]").forEach(function (button) {
          button.addEventListener("click", function () {
            const target = parseInt(this.dataset.restaurantPage, 10);
            if (!isNaN(target) && target >= 1 && target !== currentPage) {
              loadRestaurants(target);
            }
          });
        });

      } catch (e) {
        list.innerHTML = `
          <div style="padding: 24px;">
            ${P.error(e.message || "Failed to load restaurants.")}
          </div>
        `;
      }
    }

    // Load Single Restaurant for Edit
    async function loadRestaurantForEdit(id) {
      try {
        const response = await TL.Restaurants.getRestaurant(id);
        const restaurant = getRestaurantFromResponse(response);

        if (!restaurant || !restaurant.id) {
          return TL.showToast("Failed to fetch restaurant details.", "error");
        }

        const idField = document.getElementById("edit_restaurant_id");
        const nameField = document.getElementById("edit_name");
        const cityField = document.getElementById("edit_city");
        const addressField = document.getElementById("edit_address");
        const costField = document.getElementById("edit_average_cost_for_two");
        const ratingField = document.getElementById("edit_rating");
        const votesField = document.getElementById("edit_votes");
        const hasTableField = document.getElementById("edit_has_table_booking");
        const isDeliveringField = document.getElementById("edit_is_delivering_now");

        if (idField) idField.value = restaurant.id;
        if (nameField) nameField.value = restaurant.name || "";
        if (cityField) cityField.value = restaurant.city || "";
        if (addressField) addressField.value = restaurant.address || "";
        if (costField) costField.value = restaurant.average_cost_for_two != null ? restaurant.average_cost_for_two : "";
        if (ratingField) ratingField.value = restaurant.rating != null ? restaurant.rating : "";
        if (votesField) votesField.value = restaurant.votes != null ? restaurant.votes : "";
        if (hasTableField) hasTableField.value = restaurant.has_table_booking ? "true" : "false";
        if (isDeliveringField) isDeliveringField.value = restaurant.is_delivering_now ? "true" : "false";

        const modalEl = document.getElementById("restaurantEditModal");
        if (modalEl) {
          bootstrap.Modal.getOrCreateInstance(modalEl).show();
        }
      } catch (e) {
        TL.showToast(e.message || "Could not load restaurant.", "error");
      }
    }

    // FORM: Create Restaurant
    const createForm = document.getElementById("restaurantCreateForm");
    if (createForm) {
      createForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const data = vals(createForm, "create_");
        submit(
          createForm,
          function () {
            return TL.Restaurants.createRestaurant(data);
          },
          "Restaurant added successfully.",
          "restaurantCreateModal"
        );
      });
    }

    // FORM: Edit Restaurant
    const editForm = document.getElementById("restaurantEditForm");
    if (editForm) {
      editForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const idField = document.getElementById("edit_restaurant_id");
        const id = idField ? idField.value : null;
        if (!id) return TL.showToast("Missing restaurant ID.", "error");

        const data = vals(editForm, "edit_");
        submit(
          editForm,
          function () {
            return TL.Restaurants.updateRestaurant(id, data);
          },
          "Restaurant updated successfully.",
          "restaurantEditModal"
        );
      });
    }

    const refreshBtn = document.getElementById("restaurantsRefresh");
    if (refreshBtn) refreshBtn.addEventListener("click", () => loadRestaurants(currentPage));

    // Initial load
    loadRestaurants(1);
  });
})();