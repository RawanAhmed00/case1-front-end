(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", async function () {
    const P = TL.Pages;

    const list = document.getElementById("categoriesList");
    const count = document.getElementById("categoriesCount");

    async function loadCategories() {
      if (!list) return;

      list.innerHTML = `
        <div class="tl-empty">
          <div class="tl-empty__icon">
            <i class="bi bi-arrow-repeat"></i>
          </div>
          <h3 class="tl-section-title">Loading categories...</h3>
          <p class="tl-text-secondary">
            Fetching categories from the API.
          </p>
        </div>
      `;

      try {
        const response = await TL.Categories.getCategories();

        const data = P.data(response);

        let categories = [];

        if (Array.isArray(data)) {
          categories = data;
        } else if (Array.isArray(data?.data)) {
          categories = data.data;
        } else if (Array.isArray(response?.data)) {
          categories = response.data;
        } else if (Array.isArray(response)) {
          categories = response;
        }

        if (count) {
          count.textContent = categories.length;
        }

        if (!categories.length) {
          list.innerHTML = P.empty(
            "No categories found",
            "The categories endpoint returned no records.",
            "bi-tags"
          );
          return;
        }

        list.innerHTML = `
          <div class="tl-table-wrap">
            <table class="tl-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                ${categories
                  .map(
                    (category) => `
                      <tr>
                        <td>
                          ${P.escape(
                            P.display(category.id)
                          )}
                        </td>

                        <td>
                          ${P.escape(
                            P.display(category.name)
                          )}
                        </td>

                        <td>
                          <div class="tl-flex tl-gap-sm">

                            <button
                              type="button"
                              class="tl-btn tl-btn--outline tl-btn--sm category-edit-btn"
                              data-id="${P.escape(
                                P.display(category.id)
                              )}"
                              data-name="${P.escape(
                                P.display(category.name)
                              )}"
                            >
                              <i class="bi bi-pencil"></i>
                            </button>

                            <button
                              type="button"
                              class="tl-btn tl-btn--danger tl-btn--sm category-delete-btn"
                              data-id="${P.escape(
                                P.display(category.id)
                              )}"
                            >
                              <i class="bi bi-trash"></i>
                            </button>

                          </div>
                        </td>
                      </tr>
                    `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        `;

        bindCategoryActions();

      } catch (e) {
        list.innerHTML = P.error(
          e?.message || "Failed to load categories."
        );

        if (count) {
          count.textContent = "—";
        }
      }
    }

    function bindCategoryActions() {
      document
        .querySelectorAll(".category-edit-btn")
        .forEach((button) => {
          button.addEventListener("click", function () {
            const id = this.dataset.id;
            const name = this.dataset.name;

            const idInput =
              document.getElementById("category_id");

            const nameInput =
              document.getElementById("category_update_name");

            if (idInput) {
              idInput.value = id;
            }

            if (nameInput) {
              nameInput.value = name;
              nameInput.focus();
            }

            window.scrollTo({
              top: document.body.scrollHeight,
              behavior: "smooth",
            });
          });
        });

      document
        .querySelectorAll(".category-delete-btn")
        .forEach((button) => {
          button.addEventListener("click", async function () {
            const id = this.dataset.id;

            if (!id) return;

            if (
              !P.confirm(
                "Delete this category? This cannot be undone."
              )
            ) {
              return;
            }

            try {
              await TL.Categories.deleteCategory(id);

              TL.showToast(
                "Category deleted.",
                "success"
              );

              await loadCategories();

            } catch (e) {
              TL.showToast(
                e?.message || "Failed to delete category.",
                "error"
              );
            }
          });
        });
    }

    async function submit(form, fn, message, closeModalId) {

      P.clearErrors(form);

      const button =
        form.querySelector('button[type="submit"]');

      P.setBusy(button, true);

      try {
        await fn();

        TL.showToast(message, "success");

        form.reset();

        if (closeModalId) {
          const modalEl = document.getElementById(closeModalId);
          if (modalEl) bootstrap.Modal.getInstance(modalEl)?.hide();
        }

        await loadCategories();

      } catch (e) {
        if (e instanceof TL.Api.ApiValidationError) {
          P.showValidation(form, e.errors);
        }

        TL.showToast(
          e?.message || "Request failed.",
          "error"
        );

      } finally {
        P.setBusy(button, false);
      }
    }

    // CREATE
    const createForm =
      document.getElementById("categoryCreateForm");

    if (createForm) {
      createForm.addEventListener(
        "submit",
        function (e) {
          e.preventDefault();

          submit(
            e.currentTarget,
            () =>
              TL.Categories.createCategory({
                name:
                  e.currentTarget.category_create_name.value,
              }),
            "Category created successfully.",
            "categoryCreateModal"
          );
        }
      );
    }

    // UPDATE
    const manageForm =
      document.getElementById("categoryManageForm");

    if (manageForm) {
      manageForm.addEventListener(
        "submit",
        function (e) {
          e.preventDefault();

          const form = e.currentTarget;

          submit(
            form,
            () =>
              TL.Categories.updateCategory(
                form.category_id.value,
                {
                  name:
                    form.category_update_name.value,
                }
              ),
            "Category updated successfully."
          );
        }
      );
    }

    // DELETE from manual ID form
    const deleteButton =
      document.getElementById("categoryDeleteBtn");

    if (deleteButton) {
      deleteButton.addEventListener(
        "click",
        async function () {
          const id =
            document.getElementById(
              "category_id"
            )?.value;

          if (!id) {
            TL.showToast(
              "Enter a category ID.",
              "warning"
            );
            return;
          }

          if (
            !P.confirm(
              "Delete this category? This cannot be undone."
            )
          ) {
            return;
          }

          try {
            await TL.Categories.deleteCategory(id);

            TL.showToast(
              "Category deleted.",
              "success"
            );

            manageForm?.reset();

            await loadCategories();

          } catch (e) {
            TL.showToast(
              e?.message || "Failed to delete category.",
              "error"
            );
          }
        }
      );
    }

    // Initial load
    await loadCategories();
  });
})();