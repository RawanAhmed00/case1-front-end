/**
 * TAILORA USER — AUTH
 *
 * Implements exactly what the two API docs specify:
 *  - POST /auth/register
 *  - POST /auth/login
 *  - POST /auth/forget-password
 *  - POST /auth/reset-password/{token}/{email}
 *  - GET  /auth/email/verify/{id}/{hash}
 *  - POST /auth/email/resend
 *  - GET  /auth/email/status
 *  - POST /logout            (Authentication & Profile, User API doc)
 *  - POST /refresh           (Authentication & Profile, User API doc)
 *  - GET  /me                (Authentication & Profile, User API doc)
 *
 * No session/cookie/refresh-token-rotation behavior is assumed beyond what's
 * documented: login returns a bearer token, and it's sent as
 * `Authorization: Bearer <token>` on every authenticated request.
 */
(function () {
  "use strict";

  const LOGIN_PAGE = "signin.html";
  const HOME_PAGE = "index.html";

  function isAuthenticated() {
    return !!window.TL.Api.getToken();
  }

  function getCachedUser() {
    try {
      const raw = localStorage.getItem(window.TL.Api.config.userKey);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function cacheUser(user) {
    if (!user) return;
    localStorage.setItem(window.TL.Api.config.userKey, JSON.stringify(user));
  }

  // The docs don't specify the exact shape of the token field name in the
  // response body, so we check the common possibilities defensively.
  function extractToken(response) {
    if (!response) return null;
    if (typeof response === "string") return response;
    return (
      response.token ||
      response.access_token ||
      (response.data && (response.data.token || response.data.access_token)) ||
      null
    );
  }

  function extractUser(response) {
    if (!response || typeof response !== "object") return null;
    return response.user || response.data || null;
  }

async function register({
    name,
    email,
    password,
    password_confirmation,
    age,
    dist_country,
    gender,
    phone_num
}) {
    const response = await window.TL.Api.post("/auth/register", {
        name,
        email,
        password,
        password_confirmation,
        age,
        dist_country,
        gender,
        phone_num
    });

    return response;
}

  async function login({ email, password }) {
    const response = await window.TL.Api.post("/auth/login", { email, password });

    const token = extractToken(response);
    if (!token) {
      throw new window.TL.Api.ApiError(
        "Signed in, but no authentication token was returned by the server.",
        200,
        response
      );
    }

    window.TL.Api.setToken(token);

    const user = extractUser(response);
    if (user) cacheUser(user);

    // Best-effort profile fetch so the UI has a name/email to show even if
    // /auth/login didn't include one.
    try {
      const me = await window.TL.Api.get("/me");
      const meUser = extractUser(me) || me;
      if (meUser) cacheUser(meUser);
    } catch (e) {
      /* Non-fatal — nav will fall back to email-only display. */
    }

    return response;
  }

  async function getCurrentUser() {
    const me = await window.TL.Api.get("/me");
    const user = extractUser(me) || me;
    if (user) cacheUser(user);
    return user;
  }

  async function logout() {
    const token = window.TL.Api.getToken();
    try {
      if (token) await window.TL.Api.post("/logout");
    } catch (e) {
      /* Clear locally regardless of backend response. */
    }
    window.TL.Api.clearToken();
    window.location.href = HOME_PAGE;
  }

  async function refreshToken() {
    const response = await window.TL.Api.post("/refresh");
    const token = extractToken(response);
    if (token) window.TL.Api.setToken(token);
    return response;
  }

  function handle401() {
    window.TL.Api.clearToken();
    if (!isAuthPage()) {
      const next = encodeURIComponent(window.location.pathname.split("/").pop());
      window.location.href = `${LOGIN_PAGE}?next=${next}`;
    }
  }

  function isAuthPage() {
    const path = window.location.pathname.split("/").pop();
    return ["signin.html", "signup.html", "forgot-password.html", "reset-password.html"].includes(path);
  }

  // Redirects unauthenticated visitors away from a protected page.
  function guard() {
    if (!isAuthenticated()) {
      const next = encodeURIComponent(window.location.pathname.split("/").pop());
      window.location.href = `${LOGIN_PAGE}?next=${next}`;
      return false;
    }
    return true;
  }

  async function forgotPassword(email) {
    return window.TL.Api.post("/auth/forget-password", { email });
  }

  async function resetPassword({ token, email, password, password_confirmation }) {
    const path = `/auth/reset-password/${encodeURIComponent(token)}/${encodeURIComponent(email)}`;
    return window.TL.Api.post(path, { password, password_confirmation });
  }

  async function verifyEmail(id, hash) {
    const path = `/auth/email/verify/${encodeURIComponent(id)}/${encodeURIComponent(hash)}`;
    return window.TL.Api.get(path);
  }

  async function resendVerificationEmail() {
    return window.TL.Api.post("/auth/email/resend");
  }

  async function getEmailVerificationStatus() {
    return window.TL.Api.get("/auth/email/status");
  }

  window.TL = window.TL || {};
  window.TL.Auth = {
    isAuthenticated,
    getCachedUser,
    cacheUser,
    register,
    login,
    logout,
    refreshToken,
    getCurrentUser,
    handle401,
    isAuthPage,
    guard,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerificationEmail,
    getEmailVerificationStatus
  };
})();
