(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    const P = TL.Pages;
    const state = document.getElementById("usersState");

    let currentPage = 1;
    const perPage = 20;
    let currentUsersList = [];

    function renderTable(rows, meta) {
      currentUsersList = rows || [];

      if (!rows) {
        state.innerHTML = P.empty(
          "User data unavailable",
          "The API did not return user records.",
          "bi-people"
        );
        return;
      }

      if (!rows.length) {
        state.innerHTML = P.empty(
          "No users available",
          "No registered user accounts found.",
          "bi-people"
        );
        return;
      }

      const tableHtml = `
        <div class="tl-table-wrap">
          <table class="tl-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Country</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map(u => {
                const isActive = u.is_active === 1 || u.is_active === true || u.is_active === "1" || String(u.status || "").toLowerCase() === "active" || u.is_active === undefined;
                return `
                <tr>
                  <td><strong>#${P.escape(P.display(u.id))}</strong></td>
                  <td><strong>${P.escape(P.display(u.name))}</strong></td>
                  <td>${P.escape(P.display(u.email))}</td>
                  <td>${P.escape(P.display(u.dist_country || u.country || "—"))}</td>
                  <td>${P.badge(u.role || "user")}</td>
                  <td>${P.badge(isActive ? "Active" : "Inactive")}</td>
                  <td>
                    <div class="tl-table-actions">
                      <button class="tl-btn tl-btn--outline tl-btn--sm" data-user-edit="${P.escape(u.id)}" title="Edit User">
                        <i class="bi bi-pencil"></i>
                      </button>
                      <button class="tl-btn tl-btn--outline tl-btn--sm" data-user-status="${P.escape(u.id)}" title="${isActive ? 'Deactivate User' : 'Activate User'}">
                        <i class="bi ${isActive ? 'bi-toggle2-on text-success' : 'bi-toggle2-off text-danger'}"></i>
                      </button>
                      <button class="tl-btn tl-btn--danger tl-btn--sm" data-user-delete="${P.escape(u.id)}" title="Delete User">
                        <i class="bi bi-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              `;}).join("")}
            </tbody>
          </table>
        </div>
      `;

      let paginationHtml = "";
      if (meta && meta.last_page > 1) {
        const cur = meta.current_page || currentPage;
        const last = meta.last_page || 1;
        const total = meta.total || rows.length;

        let pageButtons = "";
        const maxPagesToShow = 5;
        let startPage = Math.max(1, cur - 2);
        let endPage = Math.min(last, startPage + maxPagesToShow - 1);
        if (endPage - startPage < maxPagesToShow - 1) {
          startPage = Math.max(1, endPage - maxPagesToShow + 1);
        }

        for (let p = startPage; p <= endPage; p++) {
          pageButtons += `
            <button type="button" class="tl-page-btn ${p === cur ? 'is-active' : ''}" data-page-target="${p}">
              ${p}
            </button>
          `;
        }

        paginationHtml = `
          <div class="tl-pagination">
            <span class="tl-metadata">
              Showing page <strong>${cur}</strong> of <strong>${last}</strong> (${total} total users, 20 per page)
            </span>
            <div class="d-flex align-items-center gap-1">
              <button type="button" class="tl-page-btn" data-page-target="${cur - 1}" ${cur <= 1 ? 'disabled' : ''}>
                <i class="bi bi-chevron-left"></i> Prev
              </button>
              ${pageButtons}
              <button type="button" class="tl-page-btn" data-page-target="${cur + 1}" ${cur >= last ? 'disabled' : ''}>
                Next <i class="bi bi-chevron-right"></i>
              </button>
            </div>
          </div>
        `;
      } else {
        const total = meta ? meta.total || rows.length : rows.length;
        paginationHtml = `
          <div class="tl-pagination">
            <span class="tl-metadata">Showing ${rows.length} of ${total} total users</span>
          </div>
        `;
      }

      state.innerHTML = tableHtml + paginationHtml;
    }

    async function load(page = 1) {
      currentPage = page;
      state.innerHTML = '<div class="tl-inline-loader"><div class="tl-spinner"></div></div>';

      try {
        const res = await TL.Users.getUsers({ page: currentPage, per_page: perPage });
        
        let rows = [];
        let meta = null;

        const raw = P.parse(res);
        if (raw && typeof raw === "object") {
          if (Array.isArray(raw)) {
            rows = raw;
          } else if (Array.isArray(raw.data)) {
            rows = raw.data;
            meta = {
              current_page: raw.current_page || currentPage,
              last_page: raw.last_page || 1,
              per_page: raw.per_page || perPage,
              total: raw.total || rows.length,
            };
          } else if (raw.data && typeof raw.data === "object" && Array.isArray(raw.data.data)) {
            rows = raw.data.data;
            meta = {
              current_page: raw.data.current_page || currentPage,
              last_page: raw.data.last_page || 1,
              per_page: raw.data.per_page || perPage,
              total: raw.data.total || rows.length,
            };
          } else if (raw.meta && Array.isArray(raw.data)) {
            rows = raw.data;
            meta = raw.meta;
          } else {
            rows = P.list(raw) || [];
          }
        }

        renderTable(rows, meta);
      } catch (err) {
        state.innerHTML = P.error(err.message || "Failed to load users list.");
      }
    }

    function extractFormData(prefix, form) {
      const get = name => {
        const el = form.querySelector(`[name="${prefix}_${name}"]`);
        return el ? el.value.trim() : "";
      };

      const data = {
        name: get("name"),
        email: get("email"),
        password: get("password"),
        age: get("age"),
        dist_country: get("dist_country"),
        gender: get("gender"),
        role: get("role") || (prefix === "create" ? "t_guide" : "user"),
        phone_num: get("phone_num"),
      };

      if (!data.age || data.age === "") delete data.age;
      if (!data.password || data.password === "") delete data.password;
      if (!data.gender || data.gender === "") delete data.gender;
      if (!data.dist_country || data.dist_country === "") delete data.dist_country;
      if (!data.phone_num || data.phone_num === "") delete data.phone_num;

      Object.keys(data).forEach(k => {
        if (data[k] === "" || data[k] === undefined || data[k] === null) {
          delete data[k];
        }
      });

      return data;
    }

    function showMappedValidation(form, prefix, errors) {
      const mapped = {};
      Object.entries(errors || {}).forEach(([field, msgs]) => {
        mapped[`${prefix}_${field}`] = msgs;
      });
      P.showValidation(form, mapped);
    }

    // Refresh Button
    const refreshBtn = document.getElementById("usersRefresh");
    if (refreshBtn) refreshBtn.addEventListener("click", () => load(currentPage));

    // Open Create Modal Button listener
    const openCreateBtn = document.getElementById("openCreateUserBtn");
    if (openCreateBtn) {
      openCreateBtn.addEventListener("click", () => {
        const createForm = document.getElementById("userCreateForm");
        if (createForm) {
          P.clearErrors(createForm);
          createForm.reset();
        }
        P.modal("userCreateModal")?.show();
      });
    }

    // Create User Form Submit
    const createForm = document.getElementById("userCreateForm");
    if (createForm) {
      createForm.addEventListener("submit", async e => {
        e.preventDefault();
        P.clearErrors(createForm);

        const payload = extractFormData("create", createForm);

        if (!payload.name || !payload.email || !payload.password) {
          TL.showToast("Please fill in Name, Email, and Password (min 8 chars).", "warning");
          return;
        }

        const btn = createForm.querySelector("button[type=submit]");
        P.setBusy(btn, true);

        try {
          await TL.Users.createUser(payload);
          TL.showToast("User created successfully.", "success");
          
          const modal = P.modal("userCreateModal");
          if (modal) modal.hide();
          createForm.reset();
          load(1);
        } catch (err) {
          if (err instanceof TL.Api.ApiValidationError) {
            showMappedValidation(createForm, "create", err.errors);
          }
          TL.showToast(err.message || "Failed to create user.", "error");
        } finally {
          P.setBusy(btn, false);
        }
      });
    }

    // Edit User Form Submit
    const editForm = document.getElementById("userEditForm");
    if (editForm) {
      editForm.addEventListener("submit", async e => {
        e.preventDefault();
        P.clearErrors(editForm);
        const id = document.getElementById("edit_user_id").value;
        if (!id) {
          TL.showToast("User ID is missing.", "error");
          return;
        }

        const btn = editForm.querySelector("button[type=submit]");
        P.setBusy(btn, true);

        try {
          const payload = extractFormData("edit", editForm);
          await TL.Users.updateUser(id, payload);
          TL.showToast("User updated successfully.", "success");
          
          const modal = P.modal("userEditModal");
          if (modal) modal.hide();
          load(currentPage);
        } catch (err) {
          if (err instanceof TL.Api.ApiValidationError) {
            showMappedValidation(editForm, "edit", err.errors);
          }
          TL.showToast(err.message || "Failed to update user.", "error");
        } finally {
          P.setBusy(btn, false);
        }
      });
    }

    // Event Delegation: View, Edit, Status, Delete, Pagination
    state.addEventListener("click", async e => {
      // Pagination clicks
      const pageTargetBtn = e.target.closest("[data-page-target]");
      if (pageTargetBtn && !pageTargetBtn.disabled) {
        const targetPage = parseInt(pageTargetBtn.dataset.pageTarget, 10);
        if (!isNaN(targetPage) && targetPage > 0 && targetPage !== currentPage) {
          load(targetPage);
        }
        return;
      }

      

      // Edit
      const editBtn = e.target.closest("[data-user-edit]");
      if (editBtn) {
        const id = editBtn.dataset.userEdit;
        const editFormEl = document.getElementById("userEditForm");
        if (editFormEl) P.clearErrors(editFormEl);

        let userData = currentUsersList.find(x => String(x.id) === String(id)) || {};

        try {
          const r = await TL.Users.getUser(id);
          const d = P.data(r);
          if (d && typeof d === "object") userData = Object.assign({}, userData, d);
        } catch (_) {
          // Use row data if direct get fails
        }

        document.getElementById("edit_user_id").value = userData.id || id;
        document.getElementById("edit_name").value = userData.name ?? "";
        document.getElementById("edit_email").value = userData.email ?? "";
        document.getElementById("edit_age").value = userData.age ?? "";
        document.getElementById("edit_dist_country").value = userData.dist_country ?? "";
        
        const g = String(userData.gender || "").trim().toLowerCase();
        document.getElementById("edit_gender").value = (g === "male" || g === "female") ? g : "";

        document.getElementById("edit_role").value = userData.role ?? "user";
        document.getElementById("edit_phone_num").value = userData.phone_num ?? "";
        document.getElementById("edit_password").value = "";

        P.modal("userEditModal")?.show();
        return;
      }

      // Status Toggle (Direct activate / deactivate)
      const statBtn = e.target.closest("[data-user-status]");
      if (statBtn) {
        const id = statBtn.dataset.userStatus;
        const userData = currentUsersList.find(x => String(x.id) === String(id)) || {};
        const isCurrentlyActive = userData.is_active === 1 || userData.is_active === true || userData.is_active === "1" || String(userData.status || "").toLowerCase() === "active" || userData.is_active === undefined;
        const nextState = isCurrentlyActive ? 0 : 1;

        P.setBusy(statBtn, true);
        try {
          await TL.Users.changeUserStatus(id, { is_active: nextState, status: nextState ? "active" : "inactive" });
          TL.showToast(nextState ? "Account activated successfully." : "Account deactivated successfully.", "success");
          await load(currentPage);
        } catch (err) {
          TL.showToast(err.message || "Failed to change user status.", "error");
        } finally {
          P.setBusy(statBtn, false);
        }
        return;
      }

      // Delete
      const delBtn = e.target.closest("[data-user-delete]");
      if (delBtn) {
        const id = delBtn.dataset.userDelete;
        if (P.confirm(`Are you sure you want to delete User #${id}? This action cannot be undone.`)) {
          try {
            await TL.Users.deleteUser(id);
            TL.showToast("User deleted successfully.", "success");
            load(currentPage);
          } catch (err) {
            TL.showToast(err.message || "Failed to delete user.", "error");
          }
        }
        return;
      }
    });

    // Initial Load
    load(1);
  });
})();