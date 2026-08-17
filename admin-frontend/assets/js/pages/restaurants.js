(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    const P = TL.Pages;

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

    function getRestaurantsFromResponse(response) {
      if (response && Array.isArray(response.data)) return response.data;
      if (response && response.data && Array.isArray(response.data.data)) return response.data.data;
      if (Array.isArray(response)) return response;
      return [];
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
        await loadRestaurants();
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
    async function loadRestaurants() {
      const list = document.getElementById("restaurantList");
      if (!list) return;

      list.innerHTML = `
        <div class="tl-inline-loader">
          <div class="tl-spinner"></div>
        </div>
      `;

      try {
        const response = await TL.Restaurants.getRestaurants();
        const restaurants = getRestaurantsFromResponse(response);

        if (!restaurants.length) {
          list.innerHTML = `
            <div style="padding: 24px;">
              ${P.empty("No restaurants found", "There are no restaurants available in the database.", "bi-shop")}
            </div>
          `;
          return;
        }

        list.innerHTML = `
          <div class="tl-card__head" style="padding: 24px 24px 0;">
            <div>
              <h2 class="tl-section-title">Restaurant Directory</h2>
              <span class="tl-metadata">Restaurants loaded directly from the database</span>
            </div>
            <span class="tl-badge tl-badge--info">${restaurants.length} restaurants</span>
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
              await loadRestaurants();
            } catch (e) {
              TL.showToast(e.message || "Failed to delete restaurant.", "error");
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
        const form = document.getElementById("restaurantManageForm");
        if (!form) return;

        if (form.restaurant_id) form.restaurant_id.value = restaurant.id ?? "";
        if (form.restaurant_u_name) form.restaurant_u_name.value = restaurant.name ?? "";
        if (form.restaurant_u_city) form.restaurant_u_city.value = restaurant.city ?? "";
        if (form.restaurant_u_address) form.restaurant_u_address.value = restaurant.address ?? "";
        if (form.restaurant_u_locality) form.restaurant_u_locality.value = restaurant.locality ?? "";
        if (form.restaurant_u_latitude) form.restaurant_u_latitude.value = restaurant.latitude ?? "";
        if (form.restaurant_u_longitude) form.restaurant_u_longitude.value = restaurant.longitude ?? "";
        if (form.restaurant_u_cuisines) form.restaurant_u_cuisines.value = restaurant.cuisines ?? "";
        if (form.restaurant_u_currency) form.restaurant_u_currency.value = restaurant.currency ?? "";
        if (form.restaurant_u_average_cost_for_two) form.restaurant_u_average_cost_for_two.value = restaurant.average_cost_for_two ?? "";
        if (form.restaurant_u_price_range) form.restaurant_u_price_range.value = restaurant.price_range ?? "";
        if (form.restaurant_u_has_table_booking) form.restaurant_u_has_table_booking.value = String(restaurant.has_table_booking ?? "");
        if (form.restaurant_u_has_online_delivery) form.restaurant_u_has_online_delivery.value = String(restaurant.has_online_delivery ?? "");
        if (form.restaurant_u_is_delivering_now) form.restaurant_u_is_delivering_now.value = String(restaurant.is_delivering_now ?? "");
        if (form.restaurant_u_rating) form.restaurant_u_rating.value = restaurant.rating ?? "";
        if (form.restaurant_u_votes) form.restaurant_u_votes.value = restaurant.votes ?? "";

        P.clearErrors(form);
        const modalEl = document.getElementById("restaurantEditModal");
        if (modalEl) {
          const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
          modal.show();
        }
      } catch (e) {
        TL.showToast(e.message || "Failed to load restaurant.", "error");
      }
    }

    // Create Form
    const createForm = document.getElementById("restaurantCreateForm");
    if (createForm) {
      createForm.addEventListener("submit", function (e) {
        e.preventDefault();
        submit(
          e.currentTarget,
          () => TL.Restaurants.createRestaurant(vals(e.currentTarget, "restaurant_")),
          "Restaurant created successfully."
        );
      });
    }

    // Update Form
    const manageForm = document.getElementById("restaurantManageForm");
    if (manageForm) {
      manageForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const form = e.currentTarget;
        const id = form.restaurant_id.value;
        if (!id) return TL.showToast("Enter a restaurant ID.", "warning");

        submit(
          form,
          () => TL.Restaurants.updateRestaurant(id, vals(form, "restaurant_u_")),
          "Restaurant updated successfully.",
          "restaurantEditModal"
        );
      });
    }

    // Delete Button from Manage Form (inside modal)
    const deleteButton = document.getElementById("restaurantDeleteBtn");
    if (deleteButton) {
      deleteButton.addEventListener("click", async function () {
        const id = document.getElementById("restaurant_id")?.value;
        if (!id) return TL.showToast("Enter a restaurant ID.", "warning");
        if (!P.confirm("Delete this restaurant? This cannot be undone.")) return;

        try {
          await TL.Restaurants.deleteRestaurant(id);
          TL.showToast("Restaurant deleted successfully.", "success");
          const modalEl = document.getElementById("restaurantEditModal");
          if (modalEl) bootstrap.Modal.getInstance(modalEl)?.hide();
          if (manageForm) manageForm.reset();
          await loadRestaurants();
        } catch (e) {
          TL.showToast(e.message || "Failed to delete restaurant.", "error");
        }
      });
    }

    loadRestaurants();
  });
})();