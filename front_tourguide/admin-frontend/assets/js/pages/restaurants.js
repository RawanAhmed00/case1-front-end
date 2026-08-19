(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {

    const P = TL.Pages;


    // ============================================================
    // HELPERS
    // ============================================================

    function vals(form, prefix) {

      const data = {};

      form.querySelectorAll("[name]").forEach(function (el) {

        if (el.name === "restaurant_id") {
          return;
        }

        if (!el.name.startsWith(prefix)) {
          return;
        }

        if (el.value !== "") {

          data[el.name.replace(prefix, "")] =
            el.value === "true"
              ? true
              : el.value === "false"
                ? false
                : el.value;

        }

      });

      return data;
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

        loadRestaurants();

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
    // RESTAURANT LIST
    // ============================================================

    async function loadRestaurants() {

      const list = document.getElementById("restaurantList");

      if (!list) {
        return;
      }


      list.innerHTML = `
        <div class="tl-empty">
          <div class="tl-empty__icon">
            <i class="bi bi-hourglass-split"></i>
          </div>

          <div class="tl-section-title">
            Loading restaurants...
          </div>
        </div>
      `;


      try {

        const response =
          await TL.Restaurants.getRestaurants();


        const restaurants =
          response?.data?.data ||
          response?.data ||
          response ||
          [];


        if (
          !Array.isArray(restaurants) ||
          restaurants.length === 0
        ) {

          list.innerHTML = `
            <div class="tl-empty">

              <div class="tl-empty__icon">
                <i class="bi bi-shop"></i>
              </div>

              <div class="tl-section-title">
                No restaurants found
              </div>

              <p class="tl-text-secondary">
                There are no restaurants available in the database.
              </p>

            </div>
          `;

          return;
        }


        list.innerHTML = `

          <div class="tl-card__head">

            <div>

              <div class="tl-section-title">
                Restaurant List
              </div>

              <p class="tl-text-secondary mb-0">
                Restaurants loaded directly from the database.
              </p>

            </div>

            <span class="tl-metadata">
              ${restaurants.length} restaurants
            </span>

          </div>


          <div class="table-responsive">

            <table class="table tl-table">

              <thead>

                <tr>

                  <th>ID</th>
                  <th>NAME</th>
                  <th>CITY</th>
                  <th>ADDRESS</th>
                  <th>AVERAGE COST</th>
                  <th>RATING</th>
                  <th>VOTES</th>
                  <th>ACTIONS</th>

                </tr>

              </thead>


              <tbody>

                ${restaurants.map(function (restaurant) {

                  return `

                    <tr>

                      <td>
                        ${restaurant.id ?? ""}
                      </td>


                      <td>
                        ${restaurant.name ?? "—"}
                      </td>


                      <td>
                        ${restaurant.city ?? "—"}
                      </td>


                      <td>
                        ${restaurant.address ?? "—"}
                      </td>


                      <td>
                        ${restaurant.average_cost_for_two ?? "—"}
                      </td>


                      <td>
                        ${restaurant.rating ?? "—"}
                      </td>


                      <td>
                        ${restaurant.votes ?? "—"}
                      </td>


                      <td>

                        <div class="tl-flex tl-gap-sm">

                          <button
                            type="button"
                            class="tl-btn tl-btn--secondary restaurant-edit-btn"
                            data-id="${restaurant.id}">
                            <i class="bi bi-pencil"></i>
                          </button>


                          <button
                            type="button"
                            class="tl-btn tl-btn--danger restaurant-delete-btn"
                            data-id="${restaurant.id}">
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
          .querySelectorAll(".restaurant-edit-btn")
          .forEach(function (button) {

            button.addEventListener("click", function () {

              const id = button.dataset.id;

              loadRestaurantForEdit(id);

            });

          });


        // ========================================================
        // DELETE BUTTONS
        // ========================================================

        list
          .querySelectorAll(".restaurant-delete-btn")
          .forEach(function (button) {

            button.addEventListener(
              "click",
              async function () {

                const id = button.dataset.id;


                if (
                  !P.confirm(
                    "Delete this restaurant? This cannot be undone."
                  )
                ) {
                  return;
                }


                try {

                  await TL.Restaurants.deleteRestaurant(id);


                  TL.showToast(
                    "Restaurant deleted successfully.",
                    "success"
                  );


                  loadRestaurants();

                } catch (e) {

                  TL.showToast(
                    e.message || "Failed to delete restaurant.",
                    "error"
                  );

                }

              }
            );

          });


      } catch (e) {

        console.error(
          "Failed to load restaurants:",
          e
        );


        list.innerHTML = `

          <div class="tl-empty">

            <div class="tl-empty__icon">
              <i class="bi bi-exclamation-triangle"></i>
            </div>


            <div class="tl-section-title">
              Failed to load restaurants
            </div>


            <p class="tl-text-secondary">
              ${e.message || "Unable to load restaurant data."}
            </p>

          </div>

        `;


        TL.showToast(
          e.message || "Failed to load restaurants.",
          "error"
        );

      }

    }


    // ============================================================
    // LOAD SINGLE RESTAURANT FOR EDIT
    // ============================================================

    async function loadRestaurantForEdit(id) {

      try {

        const response =
          await TL.Restaurants.getRestaurant(id);


        const restaurant =
          response?.data?.data ||
          response?.data ||
          response;


        const form =
          document.getElementById(
            "restaurantManageForm"
          );


        if (!form) {
          return;
        }


        if (form.restaurant_id) {
          form.restaurant_id.value =
            restaurant.id ?? "";
        }


        if (form.restaurant_u_name) {
          form.restaurant_u_name.value =
            restaurant.name ?? "";
        }


        if (form.restaurant_u_city) {
          form.restaurant_u_city.value =
            restaurant.city ?? "";
        }


        if (form.restaurant_u_address) {
          form.restaurant_u_address.value =
            restaurant.address ?? "";
        }


        if (form.restaurant_u_average_cost_for_two) {
          form.restaurant_u_average_cost_for_two.value =
            restaurant.average_cost_for_two ?? "";
        }


        if (form.restaurant_u_price_range) {
          form.restaurant_u_price_range.value =
            restaurant.price_range ?? "";
        }


        if (form.restaurant_u_locality) {
          form.restaurant_u_locality.value =
            restaurant.locality ?? "";
        }


        if (form.restaurant_u_latitude) {
          form.restaurant_u_latitude.value =
            restaurant.latitude ?? "";
        }


        if (form.restaurant_u_longitude) {
          form.restaurant_u_longitude.value =
            restaurant.longitude ?? "";
        }


        if (form.restaurant_u_cuisines) {
          form.restaurant_u_cuisines.value =
            restaurant.cuisines ?? "";
        }


        if (form.restaurant_u_currency) {
          form.restaurant_u_currency.value =
            restaurant.currency ?? "";
        }


        if (form.restaurant_u_rating) {
          form.restaurant_u_rating.value =
            restaurant.rating ?? "";
        }


        if (form.restaurant_u_votes) {
          form.restaurant_u_votes.value =
            restaurant.votes ?? "";
        }


        window.scrollTo({
          top: form.offsetTop - 100,
          behavior: "smooth"
        });


        TL.showToast(
          "Restaurant loaded for editing.",
          "success"
        );


      } catch (e) {

        TL.showToast(
          e.message || "Failed to load restaurant.",
          "error"
        );

      }

    }


    // ============================================================
    // CREATE RESTAURANT
    // ============================================================

    const createForm =
      document.getElementById(
        "restaurantCreateForm"
      );


    if (createForm) {

      createForm.addEventListener(
        "submit",
        function (e) {

          e.preventDefault();


          submit(
            e.currentTarget,

            function () {

              return TL.Restaurants.createRestaurant(
                vals(
                  e.currentTarget,
                  "restaurant_"
                )
              );

            },

            "Restaurant created successfully.",
            "restaurantCreateModal"
          );

        }
      );

    }


    // ============================================================
    // UPDATE RESTAURANT
    // ============================================================

    const manageForm =
      document.getElementById(
        "restaurantManageForm"
      );


    if (manageForm) {

      manageForm.addEventListener(
        "submit",
        function (e) {

          e.preventDefault();


          const form = e.currentTarget;

          const id =
            form.restaurant_id.value;


          if (!id) {

            TL.showToast(
              "Enter a restaurant ID.",
              "warning"
            );

            return;

          }


          submit(
            form,

            function () {

              return TL.Restaurants.updateRestaurant(
                id,
                vals(
                  form,
                  "restaurant_u_"
                )
              );

            },

            "Restaurant updated successfully."
          );

        }
      );

    }


    // ============================================================
    // DELETE FROM MANAGE FORM
    // ============================================================

    const deleteButton =
      document.getElementById(
        "restaurantDeleteBtn"
      );


    if (deleteButton) {

      deleteButton.addEventListener(
        "click",
        async function () {

          const id =
            document.getElementById(
              "restaurant_id"
            )?.value;


          if (!id) {

            TL.showToast(
              "Enter a restaurant ID.",
              "warning"
            );

            return;

          }


          if (
            !P.confirm(
              "Delete this restaurant? This cannot be undone."
            )
          ) {
            return;
          }


          try {

            await TL.Restaurants.deleteRestaurant(id);


            TL.showToast(
              "Restaurant deleted successfully.",
              "success"
            );


            if (manageForm) {
              manageForm.reset();
            }


            loadRestaurants();

          } catch (e) {

            TL.showToast(
              e.message || "Failed to delete restaurant.",
              "error"
            );

          }

        }
      );

    }


    // ============================================================
    // INITIAL LOAD
    // ============================================================

    loadRestaurants();

  });

})();