(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", async function () {
    const P = TL.Pages;

    const list = document.getElementById("categoriesList");

    async function loadCategories() {
      if (!list) return;

      list.innerHTML = `
        <div class="tl-inline-loader">
          <div class="tl-spinner"></div>
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

        if (!categories.length) {
          list.innerHTML = `
            <div style="padding: 24px;">
              ${P.empty("No categories found", "The categories endpoint returned no records.", "bi-tags")}
            </div>
          `;
          return;
        }

        list.innerHTML = `
          <div class="tl-card__head" style="padding: 24px 24px 0;">
            <div>
              <h2 class="tl-section-title">Category Directory</h2>
              <span class="tl-metadata">Taxonomy items loaded directly from the database</span>
            </div>
            <span class="tl-badge tl-badge--info">${categories.length} categories</span>
          </div>

          <div style="padding: 0 24px 24px;">
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
                  ${categories.map(function (category) {
                    return `
                      <tr>
                        <td><strong>#${P.escape(P.display(category.id))}</strong></td>
                        <td>${P.escape(P.display(category.name))}</td>
                        <td>
                          <div class="tl-table-actions">
                            <button
                              type="button"
                              class="tl-btn tl-btn--outline tl-btn--sm category-edit-btn"
                              data-id="${P.escape(P.display(category.id))}"
                              data-name="${P.escape(P.display(category.name))}"
                              title="Edit Category"
                            >
                              <i class="bi bi-pencil"></i>
                            </button>
                            <button
                              type="button"
                              class="tl-btn tl-btn--danger tl-btn--sm category-delete-btn"
                              data-id="${P.escape(P.display(category.id))}"
                              title="Delete Category"
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

        bindCategoryActions();

      } catch (e) {
        list.innerHTML = `
          <div style="padding: 24px;">
            ${P.error(e?.message || "Failed to load categories.")}
          </div>
        `;
      }
    }

    function bindCategoryActions() {
      document.querySelectorAll(".category-edit-btn").forEach(function (button) {
        button.addEventListener("click", function () {
          const id = this.dataset.id;
          const name = this.dataset.name;

          const idInput = document.getElementById("category_id");
          const nameInput = document.getElementById("category_update_name");
          const imageInput = document.getElementById("category_update_image");
          const form = document.getElementById("categoryManageForm");

          if (idInput) idInput.value = id;
          if (nameInput) nameInput.value = name;
          if (imageInput) imageInput.value = "";
          if (form) P.clearErrors(form);

          const modalEl = document.getElementById("categoryEditModal");
          if (modalEl) {
            const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
            modal.show();
          }
        });
      });

      document.querySelectorAll(".category-delete-btn").forEach(function (button) {
        button.addEventListener("click", async function () {
          const id = this.dataset.id;
          if (!id) return;
          if (!P.confirm("Delete this category? This cannot be undone.")) return;

          try {
            await TL.Categories.deleteCategory(id);
            TL.showToast("Category deleted.", "success");
            await loadCategories();
          } catch (e) {
            TL.showToast(e?.message || "Failed to delete category.", "error");
          }
        });
      });
    }

    async function submit(form, fn, message, closeModalId) {
      P.clearErrors(form);
      const button = form.querySelector('button[type="submit"]');
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
        TL.showToast(e?.message || "Request failed.", "error");
      } finally {
        P.setBusy(button, false);
      }
    }

    // CREATE
    const createForm = document.getElementById("categoryCreateForm");
    if (createForm) {
      createForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const form = e.currentTarget;
        const nameVal = form.querySelector("#category_name")?.value || form.name?.value;
        const fileInput = form.querySelector("#category_image");

        const data = { name: nameVal };
        if (fileInput && fileInput.files[0]) {
          data.image = fileInput.files[0];
        }

        submit(
          form,
          () => TL.Categories.createCategory(data),
          "Category created successfully."
        );
      });
    }

    // UPDATE
    const manageForm = document.getElementById("categoryManageForm");
    if (manageForm) {
      manageForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const form = e.currentTarget;
        const id = form.querySelector("#category_id")?.value;
        if (!id) return TL.showToast("Enter a category ID.", "warning");

        const nameVal = form.querySelector("#category_update_name")?.value;
        const fileInput = form.querySelector("#category_update_image");

        const data = {};
        if (nameVal) data.name = nameVal;
        if (fileInput && fileInput.files[0]) data.image = fileInput.files[0];

        submit(
          form,
          () => TL.Categories.updateCategory(id, data),
          "Category updated successfully.",
          "categoryEditModal"
        );
      });
    }

    // DELETE from modal
    const deleteButton = document.getElementById("categoryDeleteBtn");
    if (deleteButton) {
      deleteButton.addEventListener("click", async function () {
        const id = document.getElementById("category_id")?.value;
        if (!id) {
          TL.showToast("Enter a category ID.", "warning");
          return;
        }

        if (!P.confirm("Delete this category? This cannot be undone.")) return;

        try {
          await TL.Categories.deleteCategory(id);
          TL.showToast("Category deleted.", "success");
          const modalEl = document.getElementById("categoryEditModal");
          if (modalEl) bootstrap.Modal.getInstance(modalEl)?.hide();
          manageForm?.reset();
          await loadCategories();
        } catch (e) {
          TL.showToast(e?.message || "Failed to delete category.", "error");
        }
      });
    }

    await loadCategories();
  });
})();