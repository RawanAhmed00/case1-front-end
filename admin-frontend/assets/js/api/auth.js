/**
 * TAILORA - Authentication Module
 *
 * Handles:
 * - Login
 * - Register
 * - Logout
 * - Token & User persistence
 * - Dynamic Admin user name extraction
 * - Authentication guard
 * - 401 handling
 * - Forgot password
 * - Reset password
 * - Email verification
 *
 * Login form UI is handled by index.html.
 * This file handles authentication logic, API communication and authenticated user data.
 */

(function () {
    "use strict";

    /* -----------------------------------------------------------------------
     * 1. CONFIGURATION
     * --------------------------------------------------------------------- */

    const LOGIN_PAGE = "index.html";
    const DASHBOARD_PAGE = "dashboard.html";
    const USER_KEY = "tailora_user";

    /* -----------------------------------------------------------------------
     * 2. TOKEN & USER STORAGE
     * --------------------------------------------------------------------- */

    function setToken(token) {
        if (!token) {
            return false;
        }

        if (
            window.TL &&
            window.TL.Api &&
            typeof window.TL.Api.setToken === "function"
        ) {
            window.TL.Api.setToken(token);
            return true;
        }

        try {
            localStorage.setItem("tailora_token", token);
            return true;
        } catch (_) {
            return false;
        }
    }

    function getToken() {
        if (
            window.TL &&
            window.TL.Api &&
            typeof window.TL.Api.getToken === "function"
        ) {
            return window.TL.Api.getToken();
        }

        try {
            return localStorage.getItem("tailora_token");
        } catch (_) {
            return null;
        }
    }

    function clearToken() {
        if (
            window.TL &&
            window.TL.Api &&
            typeof window.TL.Api.clearToken === "function"
        ) {
            window.TL.Api.clearToken();
        }

        try {
            localStorage.removeItem("tailora_token");
        } catch (_) {}

        clearUser();
    }

    function setUser(user) {
        if (!user) {
            clearUser();
            return;
        }

        try {
            localStorage.setItem(USER_KEY, JSON.stringify(user));
        } catch (_) {}
    }

    function getUser() {
        try {
            const raw = localStorage.getItem(USER_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (_) {
            return null;
        }
    }

    function clearUser() {
        try {
            localStorage.removeItem(USER_KEY);
        } catch (_) {}
    }

    function isAuthenticated() {
        return Boolean(getToken());
    }

    /* -----------------------------------------------------------------------
     * 3. JWT & USER DATA EXTRACTION
     * --------------------------------------------------------------------- */

    function parseJwt(token) {
        if (!token || typeof token !== "string") return null;
        try {
            const parts = token.split(".");
            if (parts.length !== 3) return null;
            const base64Url = parts[1];
            const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split("")
                    .map(function (c) {
                        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
                    })
                    .join("")
            );
            return JSON.parse(jsonPayload);
        } catch (_) {
            return null;
        }
    }

    function extractToken(response) {
        if (!response) {
            return null;
        }

        if (typeof response === "object") {
            if (response.token) return response.token;
            if (response.access_token) return response.access_token;
            if (response.data && typeof response.data === "object") {
                if (response.data.token) return response.data.token;
                if (response.data.access_token) return response.data.access_token;
            }
        }

        return null;
    }

    function extractUser(response, token) {
        let user = null;

        if (response && typeof response === "object") {
            if (response.user && typeof response.user === "object") {
                user = response.user;
            } else if (response.data && response.data.user && typeof response.data.user === "object") {
                user = response.data.user;
            } else if (response.data && typeof response.data === "object" && (response.data.name || response.data.email)) {
                user = response.data;
            } else if (response.name || response.email || response.username) {
                user = response;
            }
        }

        if (!user && token) {
            const jwt = parseJwt(token);
            if (jwt) {
                if (jwt.user && typeof jwt.user === "object") {
                    user = jwt.user;
                } else if (jwt.name || jwt.username || jwt.email) {
                    user = jwt;
                }
            }
        }

        return user;
    }

    function getUserName() {
        const user = getUser();
        if (user) {
            if (user.name && typeof user.name === "string" && user.name.trim()) {
                return user.name.trim();
            }
            if (user.first_name || user.last_name) {
                const full = `${user.first_name || ""} ${user.last_name || ""}`.trim();
                if (full) return full;
            }
            if (user.username && typeof user.username === "string" && user.username.trim()) {
                return user.username.trim();
            }
            if (user.email && typeof user.email === "string" && user.email.trim()) {
                return user.email.split("@")[0];
            }
        }

        const token = getToken();
        if (token) {
            const jwt = parseJwt(token);
            if (jwt) {
                if (jwt.name && typeof jwt.name === "string" && jwt.name.trim()) return jwt.name.trim();
                if (jwt.username && typeof jwt.username === "string" && jwt.username.trim()) return jwt.username.trim();
                if (jwt.email && typeof jwt.email === "string" && jwt.email.trim()) return jwt.email.split("@")[0];
            }
        }

        return "Admin";
    }

    /* -----------------------------------------------------------------------
     * 4. LOGIN
     * --------------------------------------------------------------------- */

    async function login({ email, password }) {
        if (!email || !password) {
            throw new Error("Email and password are required.");
        }

        const response = await window.TL.Api.post("/auth/login", {
            email,
            password
        });

        const token = extractToken(response);

        if (!token) {
            throw new Error(
                "Login succeeded but no authentication token was returned by the API."
            );
        }

        const stored = setToken(token);

        if (!stored) {
            throw new Error(
                "Login succeeded, but the authentication token could not be stored."
            );
        }

        // Extract and persist authenticated admin user info
        let user = extractUser(response, token);
        if (!user) {
            // Store at least the email provided at login if no user object was returned
            user = { email: email };
        }
        setUser(user);

        window.TL.Auth.lastLoginResponse = response;

        return response;
    }

    /* -----------------------------------------------------------------------
     * 5. REGISTER
     * --------------------------------------------------------------------- */

    async function register(payload) {
        const response = await window.TL.Api.post("/auth/register", payload);

        const token = extractToken(response);
        if (token) {
            setToken(token);
            const user = extractUser(response, token) || { name: payload.name, email: payload.email };
            setUser(user);
        }

        return response;
    }

    /* -----------------------------------------------------------------------
     * 6. LOGOUT
     * --------------------------------------------------------------------- */

    async function logout() {
        const token = getToken();

        try {
            if (token) {
                await window.TL.Api.post("/auth/logout");
            }
        } catch (error) {
            console.warn("Logout request failed:", error);
        } finally {
            clearToken();
            window.location.replace(LOGIN_PAGE);
        }
    }

    /* -----------------------------------------------------------------------
     * 7. 401 HANDLER
     * --------------------------------------------------------------------- */

    function handle401() {
        clearToken();
        if (!isAuthPage()) {
            window.location.replace(LOGIN_PAGE);
        }
    }

    /* -----------------------------------------------------------------------
     * 8. AUTHENTICATION GUARD
     * --------------------------------------------------------------------- */

    function guard() {
        if (isAuthPage()) {
            return;
        }

        if (!isAuthenticated()) {
            window.location.replace(LOGIN_PAGE);
        }
    }

    /* -----------------------------------------------------------------------
     * 9. AUTH PAGE DETECTION
     * --------------------------------------------------------------------- */

    function isAuthPage() {
        const path = window.location.pathname.toLowerCase();
        return (
            path.endsWith("/index.html") ||
            path.endsWith("/forgot-password.html") ||
            path.endsWith("/reset-password.html") ||
            path.endsWith("/")
        );
    }

    /* -----------------------------------------------------------------------
     * 10. FORGOT PASSWORD
     * --------------------------------------------------------------------- */

    async function forgotPassword(email) {
        return window.TL.Api.post("/auth/forget-password", { email });
    }

    /* -----------------------------------------------------------------------
     * 11. RESET PASSWORD
     * --------------------------------------------------------------------- */

    async function resetPassword({ token, email, password, password_confirmation }) {
        const path = `/auth/reset-password/${encodeURIComponent(token)}/${encodeURIComponent(email)}`;
        return window.TL.Api.post(path, {
            password,
            password_confirmation
        });
    }

    /* -----------------------------------------------------------------------
     * 12. VERIFY EMAIL
     * --------------------------------------------------------------------- */

    async function verifyEmail(id, hash) {
        const path = `/auth/email/verify/${encodeURIComponent(id)}/${encodeURIComponent(hash)}`;
        return window.TL.Api.get(path);
    }

    /* -----------------------------------------------------------------------
     * 13. RESEND VERIFICATION EMAIL
     * --------------------------------------------------------------------- */

    async function resendVerificationEmail() {
        return window.TL.Api.post("/auth/email/resend");
    }

    /* -----------------------------------------------------------------------
     * 14. EMAIL VERIFICATION STATUS
     * --------------------------------------------------------------------- */

    async function getEmailVerificationStatus() {
        return window.TL.Api.get("/auth/email/status");
    }

    /* -----------------------------------------------------------------------
     * 15. LOGOUT BUTTONS
     * --------------------------------------------------------------------- */

    function wireLogoutButtons() {
        document.addEventListener("click", function (event) {
            const button = event.target.closest("#tlLogoutBtn, #tlLogoutBtnTop");
            if (!button) return;
            event.preventDefault();
            logout();
        });
    }

    /* -----------------------------------------------------------------------
     * 16. INITIALIZATION
     * --------------------------------------------------------------------- */

    function init() {
        wireLogoutButtons();
        guard();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

    /* -----------------------------------------------------------------------
     * 17. PUBLIC TAILORA AUTH API
     * --------------------------------------------------------------------- */

    window.TL = window.TL || {};

    window.TL.Auth = {
        isAuthenticated,
        setToken,
        getToken,
        clearToken,
        setUser,
        getUser,
        clearUser,
        getUserName,
        extractToken,
        extractUser,
        guard,
        handle401,
        logout,
        register,
        login,
        forgotPassword,
        resetPassword,
        verifyEmail,
        resendVerificationEmail,
        getEmailVerificationStatus,
        lastLoginResponse: null
    };
})();