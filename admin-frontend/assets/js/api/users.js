/* ==========================================================================
   TAILORA ADMIN — assets/js/api/users.js
   Owns: /admin/users (6 documented endpoints).

   NOTE — "Get All Users", "Get User By ID", "Create User" (201) and
   "Update User" responses are all documented only as a bare `string`
   schema (Postman placeholders, not real payload samples). This module
   returns whatever the centralized client parses, unshaped.

   NOTE — "Change User Status" (PATCH /admin/users/{id}/status) documents
   no request body at all — not even a field name for what "status" means
   (e.g. is_active, blocked, a string enum). changeUserStatus() accepts an
   optional payload and passes it through as-is rather than inventing a
   field name — see the Step 3 handoff notes for this gap.
   ========================================================================== */

(function () {
  "use strict";

  // GET /admin/users
  function getUsers(query) {
    return window.TL.Api.get("/users", query);
  }

  // GET /admin/users/{id}
  function getUser(id) {
    return window.TL.Api.get(`/users/${encodeURIComponent(id)}`);
  }

  // POST /admin/users
  // body: { name, email, password, age, dist_country, gender, role, phone_num }
  function createUser(data) {
    return window.TL.Api.post("/users", data);
  }

  // PUT /admin/users/{id}
  // body: { name, email, password, age, dist_country, gender, role, phone_num }
  function updateUser(id, data) {
    return window.TL.Api.put(`/users/${encodeURIComponent(id)}`, data);
  }

  // DELETE /admin/users/{id}
  function deleteUser(id) {
    return window.TL.Api.delete(`/users/${encodeURIComponent(id)}`);
  }

  // PATCH /admin/users/{id}/status — undocumented body shape; pass through as-is
  function changeUserStatus(id, payload) {
    return window.TL.Api.patch(`/users/${encodeURIComponent(id)}/status`, payload);
  }

  window.TL = window.TL || {};
  window.TL.Users = {
    getUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
    changeUserStatus,
  };
})();
