(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", async function () {
    const P = TL.Pages;

    const list = document.getElementById("categoriesList");
    const perPage = 10;
    let currentPage = 1;

    async function loadCategories(page = 1) {
      if (!list) return;
      currentPage = page;

      list.innerHTML = `
        <div class="tl-inline-loader">
          <div class="tl-spinner"></div>
        </div>
      `;

      try {
        const response = await TL.Categories.getCategories({ page: currentPage, per_page: perPage });
        const { rows: allCategories, meta } = P.extractPagination(response, currentPage, perPage);

        if (!allCategories.length) {
          list.innerHTML = `
            <div style="padding: 24px;">
              ${P.empty("No categories found", "No categories have been created yet.", "bi-tags")}
            </div>
          `;
          return;
        }

        const totalCategories = meta ? meta.total : allCategories.length;
        const paginationHtml = P.buildPagination(meta, "data-category-page", "categories", currentPage);

        list.innerHTML = `
          <div class="tl-card__head" style="padding: 24px 24px 0;">
            <div>
              <h2 class="tl-section-title">Category Directory</h2>
              <span class="tl-metadata">All active attraction and activity categories</span>
            </div>
            <span class="tl-badge tl-badge--info">${totalCategories} categories</span>
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
                  ${allCategories.map(function (category) {
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
          ${paginationHtml}
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
            await loadCategories(currentPage);
          } catch (e) {
            TL.showToast(e?.message || "Failed to delete category.", "error");
          }
        });
      });

      list.querySelectorAll("[data-category-page]").forEach(function (button) {
        button.addEventListener("click", function () {
          const target = parseInt(this.dataset.categoryPage, 10);
          if (!isNaN(target) && target >= 1 && target !== currentPage) {
            loadCategories(target);
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
        await loadCategories(currentPage);
      } catch (e) {
        if (e instanceof TL.Api.ApiValidationError) {
          P.showValidation(form, e.errors);
        }
        TL.showToast(e?.message || "Something went wrong.", "error");
      } finally {
        P.setBusy(button, false);
      }
    }

    const createForm = document.getElementById("categoryCreateForm");
    if (createForm) {
      createForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const name = (document.getElementById("create_category_name")?.value || "").trim();
        const image = document.getElementById("create_category_image")?.files[0];

        const data = {};
        if (name) data.name = name;
        if (image) data.image = image;

        submit(
          createForm,
          function () {
            return TL.Categories.createCategory(data);
          },
          "Category created successfully.",
          "categoryCreateModal"
        );
      });
    }

    const manageForm = document.getElementById("categoryManageForm");
    if (manageForm) {
      manageForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const id = document.getElementById("category_id")?.value;
        const name = (document.getElementById("category_update_name")?.value || "").trim();
        const image = document.getElementById("category_update_image")?.files[0];

        if (!id) {
          TL.showToast("Category ID is required.", "error");
          return;
        }

        const data = {};
        if (name) data.name = name;
        if (image) data.image = image;

        submit(
          manageForm,
          function () {
            return TL.Categories.updateCategory(id, data);
          },
          "Category updated successfully.",
          "categoryEditModal"
        );
      });
    }

    const refreshBtn = document.getElementById("categoriesRefresh");
    if (refreshBtn) refreshBtn.addEventListener("click", () => loadCategories(currentPage));

    loadCategories(1);
  });
})();