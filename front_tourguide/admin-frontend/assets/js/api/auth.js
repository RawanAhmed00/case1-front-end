/**
 * TAILORA - Authentication Module
 *
 * Handles:
 * - Login
 * - Register
 * - Logout
 * - Token persistence
 * - Authentication guard
 * - 401 handling
 * - Forgot password
 * - Reset password
 * - Email verification
 *
 * Login form UI is handled by index.html.
 * This file only handles authentication logic and API communication.
 */

(function () {
    "use strict";


    /* -----------------------------------------------------------------------
     * 1. CONFIGURATION
     * --------------------------------------------------------------------- */

    const LOGIN_PAGE = "index.html";
    const DASHBOARD_PAGE = "dashboard.html";


    /* -----------------------------------------------------------------------
     * 2. TOKEN STORAGE
     *
     * api.js owns the actual localStorage implementation.
     * auth.js uses the same storage helpers.
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

        return false;
    }


    function getToken() {
        if (
            window.TL &&
            window.TL.Api &&
            typeof window.TL.Api.getToken === "function"
        ) {
            return window.TL.Api.getToken();
        }

        return null;
    }


    function clearToken() {
        if (
            window.TL &&
            window.TL.Api &&
            typeof window.TL.Api.clearToken === "function"
        ) {
            window.TL.Api.clearToken();
        }
    }


    function isAuthenticated() {
        return Boolean(getToken());
    }


    /* -----------------------------------------------------------------------
     * 3. TOKEN EXTRACTION
     *
     * Supports common response envelopes without assuming a single
     * undocumented response structure.
     * --------------------------------------------------------------------- */

    function extractToken(response) {
        if (!response) {
            return null;
        }


        /*
         * Example:
         *
         * {
         *     "token": "..."
         * }
         */
        if (
            typeof response === "object" &&
            response.token
        ) {
            return response.token;
        }


        /*
         * Example:
         *
         * {
         *     "access_token": "..."
         * }
         */
        if (
            typeof response === "object" &&
            response.access_token
        ) {
            return response.access_token;
        }


        /*
         * Example:
         *
         * {
         *     "data": {
         *         "token": "..."
         *     }
         * }
         */
        if (
            response.data &&
            typeof response.data === "object"
        ) {
            if (response.data.token) {
                return response.data.token;
            }

            if (response.data.access_token) {
                return response.data.access_token;
            }
        }


        return null;
    }


    /* -----------------------------------------------------------------------
     * 4. LOGIN
     * --------------------------------------------------------------------- */

    async function login({ email, password }) {

        if (!email || !password) {
            throw new Error(
                "Email and password are required."
            );
        }


        /*
         * Call:
         *
         * POST /auth/login
         */
        const response = await window.TL.Api.post(
            "/auth/login",
            {
                email,
                password
            }
        );


        /*
         * Extract the real token returned by the backend.
         */
        const token = extractToken(response);


        /*
         * Never redirect or claim authentication succeeded if the
         * backend did not return a usable token.
         */
        if (!token) {
            throw new Error(
                "Login succeeded but no authentication token was returned by the API."
            );
        }


        /*
         * Persist the real authentication token.
         */
        const stored = setToken(token);


        if (!stored) {
            throw new Error(
                "Login succeeded, but the authentication token could not be stored."
            );
        }


        /*
         * Keep the latest response available for other frontend code.
         */
        window.TL.Auth.lastLoginResponse = response;


        return response;
    }


    /* -----------------------------------------------------------------------
     * 5. REGISTER
     * --------------------------------------------------------------------- */

    async function register(payload) {

        const response = await window.TL.Api.post(
            "/auth/register",
            payload
        );


        /*
         * If the backend returns a token after registration,
         * persist it.
         */
        const token = extractToken(response);

        if (token) {
            setToken(token);
        }


        return response;
    }


    /* -----------------------------------------------------------------------
     * 6. LOGOUT
     * --------------------------------------------------------------------- */

    async function logout() {

        const token = getToken();


        try {

            /*
             * Only call the backend logout endpoint when we have
             * an authenticated session.
             */
            if (token) {
                await window.TL.Api.post("/auth/logout");
            }

        } catch (error) {

            /*
             * Local authentication must still be cleared even if
             * the backend logout request fails.
             */
            console.warn(
                "Logout request failed:",
                error
            );

        } finally {

            clearToken();

            /*
             * Replace instead of normal navigation so the user
             * cannot easily return to a protected page using history.
             */
            window.location.replace(
                LOGIN_PAGE
            );
        }
    }


    /* -----------------------------------------------------------------------
     * 7. 401 HANDLER
     * --------------------------------------------------------------------- */

    function handle401() {

        clearToken();


        /*
         * Don't redirect repeatedly if we're already on an
         * authentication page.
         */
        if (!isAuthPage()) {

            window.location.replace(
                LOGIN_PAGE
            );
        }
    }


    /* -----------------------------------------------------------------------
     * 8. AUTHENTICATION GUARD
     * --------------------------------------------------------------------- */

    function guard() {

        /*
         * Authentication pages are public.
         */
        if (isAuthPage()) {
            return;
        }


        /*
         * Every other admin page requires a token.
         */
        if (!isAuthenticated()) {

            window.location.replace(
                LOGIN_PAGE
            );
        }
    }


    /* -----------------------------------------------------------------------
     * 9. AUTH PAGE DETECTION
     * --------------------------------------------------------------------- */

    function isAuthPage() {

        const path =
            window.location.pathname.toLowerCase();


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

        return window.TL.Api.post(
            "/auth/forget-password",
            {
                email
            }
        );
    }


    /* -----------------------------------------------------------------------
     * 11. RESET PASSWORD
     * --------------------------------------------------------------------- */

    async function resetPassword({
        token,
        email,
        password,
        password_confirmation
    }) {

        const path =
            `/auth/reset-password/${encodeURIComponent(token)}/${encodeURIComponent(email)}`;


        return window.TL.Api.post(
            path,
            {
                password,
                password_confirmation
            }
        );
    }


    /* -----------------------------------------------------------------------
     * 12. VERIFY EMAIL
     * --------------------------------------------------------------------- */

    async function verifyEmail(id, hash) {

        const path =
            `/auth/email/verify/${encodeURIComponent(id)}/${encodeURIComponent(hash)}`;


        return window.TL.Api.get(path);
    }


    /* -----------------------------------------------------------------------
     * 13. RESEND VERIFICATION EMAIL
     * --------------------------------------------------------------------- */

    async function resendVerificationEmail() {

        return window.TL.Api.post(
            "/auth/email/resend"
        );
    }


    /* -----------------------------------------------------------------------
     * 14. EMAIL VERIFICATION STATUS
     * --------------------------------------------------------------------- */

    async function getEmailVerificationStatus() {

        return window.TL.Api.get(
            "/auth/email/status"
        );
    }


    /* -----------------------------------------------------------------------
     * 15. LOGOUT BUTTONS
     *
     * Login itself is handled by index.html.
     * --------------------------------------------------------------------- */

    function wireLogoutButtons() {

        document.addEventListener(
            "click",
            function (event) {

                const button =
                    event.target.closest(
                        "#tlLogoutBtn, #tlLogoutBtnTop"
                    );


                if (!button) {
                    return;
                }


                event.preventDefault();

                logout();
            }
        );
    }


    /* -----------------------------------------------------------------------
     * 16. INITIALIZATION
     * --------------------------------------------------------------------- */

    function init() {

        /*
         * Only wire logout controls here.
         *
         * The login form is intentionally NOT handled here because
         * index.html already owns its submit event.
         */
        wireLogoutButtons();


        /*
         * Protect admin pages.
         */
        guard();
    }


    if (
        document.readyState === "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            init
        );

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

        extractToken,

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

        /*
         * Useful for debugging / other frontend modules.
         */
        lastLoginResponse: null
    };

})();