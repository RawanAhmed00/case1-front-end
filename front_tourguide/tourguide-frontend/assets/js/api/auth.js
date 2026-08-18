/**
 * TAILORA TOUR GUIDE — AUTH MODULE
 * Manages login, logout, session persistence, and authentication guard for protected pages.
 */

(function () {
  "use strict";

  const LOGIN_PAGE = "index.html";
  const DASHBOARD_PAGE = "dashboard.html";

  function setToken(token) {
    return window.TL.Api.setToken(token);
  }

  function getToken() {
    return window.TL.Api.getToken();
  }

  function clearToken() {
    window.TL.Api.clearToken();
  }

  function isAuthenticated() {
    return Boolean(getToken());
  }

  function getCachedUser() {
    const raw = localStorage.getItem(window.TL.Api.config.userKey);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function setCachedUser(user) {
    if (user) {
      localStorage.setItem(window.TL.Api.config.userKey, JSON.stringify(user));
    }
  }

  function extractToken(res) {
    if (!res) return null;
    if (res.token) return res.token;
    if (res.access_token) return res.access_token;
    if (res.data && res.data.token) return res.data.token;
    if (res.data && res.data.access_token) return res.data.access_token;
    return null;
  }

  async function login({ email, password }) {
    if (!email || !password) {
      throw new Error("Email and password are required.");
    }

    const response = await window.TL.Api.post("/auth/login", { email, password });
    const token = extractToken(response);
    if (!token) {
      throw new Error("Invalid authentication response: Token missing.");
    }
    setToken(token);

    const user = (response.data && response.data.user) || response.user || {
      name: email.split("@")[0],
      email: email
    };
    setCachedUser(user);
    return response;
  }

  async function logout() {
    try {
      if (getToken()) {
        await window.TL.Api.post("/auth/logout");
      }
    } catch (e) {
      console.warn("Logout request skipped or failed:", e);
    } finally {
      clearToken();
      window.location.replace(LOGIN_PAGE);
    }
  }

  function handle401() {
    clearToken();
    if (!isAuthPage()) {
      window.location.replace(LOGIN_PAGE);
    }
  }

  function isAuthPage() {
    const path = window.location.pathname.toLowerCase();
    return (
      path.endsWith("/index.html") ||
      path.endsWith("/forgot-password.html") ||
      path.endsWith("/reset-password.html") ||
      path.endsWith("/") ||
      path.includes("index.html") ||
      path.includes("forgot-password.html") ||
      path.includes("reset-password.html")
    );
  }

  async function forgotPassword(email) {
    if (!email) throw new Error("Email address is required.");
    return await window.TL.Api.post("/auth/forget-password", { email });
  }

  async function resetPassword({ token, email, password, password_confirmation }) {
    if (!token || !email || !password) throw new Error("Token, email, and new password are required.");
    const path = `/auth/reset-password/${encodeURIComponent(token)}/${encodeURIComponent(email)}`;
    return await window.TL.Api.post(path, { password, password_confirmation });
  }

  function guard() {
    const body = document.body;
    const requiresAuth = body.dataset.requiresAuth === "true";
    const guestOnly = body.dataset.guestOnly === "true";

    if (requiresAuth && !isAuthenticated()) {
      window.location.replace(LOGIN_PAGE);
    } else if (guestOnly && isAuthenticated()) {
      window.location.replace(DASHBOARD_PAGE);
    }
  }

  window.TL = window.TL || {};
  window.TL.Auth = {
    login,
    logout,
    forgotPassword,
    resetPassword,
    getToken,
    setToken,
    clearToken,
    isAuthenticated,
    getCachedUser,
    setCachedUser,
    handle401,
    guard
  };

  document.addEventListener("DOMContentLoaded", guard);
})();
