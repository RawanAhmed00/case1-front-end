/**
 * TAILORA ADMIN - API CORE
 *
 * Central API client for the Tailora Admin frontend.
 *
 * Responsibilities:
 * - API base URL
 * - GET / POST / PUT / PATCH / DELETE
 * - JSON requests
 * - FormData requests
 * - Bearer token handling
 * - localStorage token persistence
 * - API error handling
 * - 401 / 422 handling
 */

(function () {
    "use strict";


    /* =====================================================================
     * 1. API CONFIGURATION
     * =================================================================== */

    const API_CONFIG = {
        baseUrl: "http://127.0.0.1:8000/api",
        tokenKey: "tailora_token"
    };


    /* =====================================================================
     * 2. ERROR CLASSES
     * =================================================================== */

    class ApiError extends Error {

        constructor(message, status = 0, body = null) {
            super(message);

            this.name = "ApiError";
            this.status = status;
            this.body = body;
        }
    }


    class ApiValidationError extends ApiError {

        constructor(message, status = 422, body = null) {
            super(message, status, body);

            this.name = "ApiValidationError";

            this.errors =
                body && body.errors
                    ? body.errors
                    : {};
        }
    }


    class ApiNetworkError extends ApiError {

        constructor(message) {
            super(message, 0, null);

            this.name = "ApiNetworkError";
        }
    }


    /* =====================================================================
     * 3. TOKEN STORAGE
     *
     * This is the single source of truth for authentication.
     *
     * Local Storage:
     *
     * tailora_token = <JWT/token returned by Laravel>
     * =================================================================== */

    function getToken() {

        return localStorage.getItem(
            API_CONFIG.tokenKey
        );
    }


    function setToken(token) {

        if (!token) {
            return false;
        }

        localStorage.setItem(
            API_CONFIG.tokenKey,
            token
        );

        return true;
    }


    function clearToken() {

        localStorage.removeItem(
            API_CONFIG.tokenKey
        );
    }


    /* =====================================================================
     * 4. BUILD API URL
     * =================================================================== */

    function buildUrl(path, query) {

        /*
         * Make sure the path starts with /
         */
        if (!path.startsWith("/")) {
            path = "/" + path;
        }


        /*
         * Remove duplicate slash between baseUrl and path.
         */
        const url =
            API_CONFIG.baseUrl.replace(/\/$/, "") +
            path;


        /*
         * No query parameters.
         */
        if (!query || Object.keys(query).length === 0) {
            return url;
        }


        const queryString =
            new URLSearchParams(
                Object.entries(query)
                    .filter(
                        ([, value]) =>
                            value !== undefined &&
                            value !== null &&
                            value !== ""
                    )
                    .map(
                        ([key, value]) =>
                            [key, String(value)]
                    )
            ).toString();


        if (!queryString) {
            return url;
        }


        return `${url}?${queryString}`;
    }


    /* =====================================================================
     * 5. PARSE RESPONSE BODY
     *
     * Handles:
     * - JSON
     * - Empty responses
     * - Plain text
     * =================================================================== */

    async function parseBody(response) {

        const text =
            await response.text();


        /*
         * Empty response.
         */
        if (!text) {
            return null;
        }


        /*
         * Try JSON first.
         */
        try {

            return JSON.parse(text);

        } catch (error) {

            /*
             * Not JSON.
             * Return raw text instead of crashing.
             */
            return text;
        }
    }


    /* =====================================================================
     * 6. HANDLE HTTP RESPONSE
     * =================================================================== */

    async function handleResponse(response) {

        const body =
            await parseBody(response);


        /* ---------------------------------------------------------------
         * 401 - Unauthorized
         * ------------------------------------------------------------- */

        if (response.status === 401) {

            /*
             * Let auth.js clear the token and redirect.
             */
            if (
                window.TL &&
                window.TL.Auth &&
                typeof window.TL.Auth.handle401 === "function"
            ) {

                window.TL.Auth.handle401();
            }


            throw new ApiError(
                body && body.message
                    ? body.message
                    : "Session expired. Please sign in again.",
                401,
                body
            );
        }


        /* ---------------------------------------------------------------
         * 422 - Validation error
         * ------------------------------------------------------------- */

        if (response.status === 422) {

            throw new ApiValidationError(
                body && body.message
                    ? body.message
                    : "Validation failed.",
                422,
                body
            );
        }


        /* ---------------------------------------------------------------
         * Other HTTP errors
         * ------------------------------------------------------------- */

        if (!response.ok) {

            throw new ApiError(
                body && body.message
                    ? body.message
                    : `Request failed with status ${response.status}.`,
                response.status,
                body
            );
        }


        /*
         * Successful response.
         */
        return body;
    }


    /* =====================================================================
     * 7. CORE REQUEST FUNCTION
     * =================================================================== */

    async function request(
        method,
        path,
        options = {}
    ) {

        const {
            body,
            isFormData = false,
            query,
            headers: extraHeaders
        } = options;


        /* ---------------------------------------------------------------
         * Default headers
         * ------------------------------------------------------------- */

        const headers = {

            Accept: "application/json"
        };


        /* ---------------------------------------------------------------
         * Authentication token
         * ------------------------------------------------------------- */

        const token =
            getToken();


        if (token) {

            headers.Authorization =
                `Bearer ${token}`;
        }


        /* ---------------------------------------------------------------
         * JSON Content-Type
         *
         * NEVER manually set Content-Type for FormData.
         * Browser must create multipart boundary.
         * ------------------------------------------------------------- */

        if (
            body !== undefined &&
            !isFormData
        ) {

            headers["Content-Type"] =
                "application/json";
        }


        /* ---------------------------------------------------------------
         * Additional headers
         * ------------------------------------------------------------- */

        if (extraHeaders) {

            Object.assign(
                headers,
                extraHeaders
            );
        }


        /* ---------------------------------------------------------------
         * Fetch options
         * ------------------------------------------------------------- */

        const fetchOptions = {

            method,

            headers
        };


        /* ---------------------------------------------------------------
         * Request body
         * ------------------------------------------------------------- */

        if (body !== undefined) {

            fetchOptions.body =
                isFormData
                    ? body
                    : JSON.stringify(body);
        }


        /* ---------------------------------------------------------------
         * Execute request
         * ------------------------------------------------------------- */

        let response;


        try {

            response =
                await fetch(
                    buildUrl(path, query),
                    fetchOptions
                );

        } catch (networkError) {

            throw new ApiNetworkError(
                "Network error — the backend could not be reached. Check that Laravel is running on http://127.0.0.1:8000."
            );
        }


        /* ---------------------------------------------------------------
         * Handle response
         * ------------------------------------------------------------- */

        return handleResponse(
            response
        );
    }


    /* =====================================================================
     * 8. PUBLIC API METHODS
     * =================================================================== */

    const Api = {


        /* ---------------------------------------------------------------
         * GET
         * ------------------------------------------------------------- */

        get(path, query) {

            return request(
                "GET",
                path,
                {
                    query
                }
            );
        },


        /* ---------------------------------------------------------------
         * POST
         * ------------------------------------------------------------- */

        post(
            path,
            body,
            options = {}
        ) {

            return request(
                "POST",
                path,
                Object.assign(
                    {
                        body
                    },
                    options
                )
            );
        },


        /* ---------------------------------------------------------------
         * PUT
         * ------------------------------------------------------------- */

        put(
            path,
            body,
            options = {}
        ) {

            return request(
                "PUT",
                path,
                Object.assign(
                    {
                        body
                    },
                    options
                )
            );
        },


        /* ---------------------------------------------------------------
         * PATCH
         * ------------------------------------------------------------- */

        patch(
            path,
            body,
            options = {}
        ) {

            return request(
                "PATCH",
                path,
                Object.assign(
                    {
                        body
                    },
                    options
                )
            );
        },


        /* ---------------------------------------------------------------
         * DELETE
         * ------------------------------------------------------------- */

        delete(
            path,
            options = {}
        ) {

            return request(
                "DELETE",
                path,
                options
            );
        },


        /* ---------------------------------------------------------------
         * POST FormData
         * ------------------------------------------------------------- */

        postForm(
            path,
            formData
        ) {

            return request(
                "POST",
                path,
                {
                    body: formData,
                    isFormData: true
                }
            );
        },


        /* ---------------------------------------------------------------
         * PUT FormData
         * ------------------------------------------------------------- */

        putForm(
            path,
            formData
        ) {
            if (formData instanceof FormData) {
                if (!formData.has("_method")) {
                    formData.append("_method", "PUT");
                }
                return request(
                    "POST",
                    path,
                    {
                        body: formData,
                        isFormData: true
                    }
                );
            }

            return request(
                "PUT",
                path,
                {
                    body: formData,
                    isFormData: true
                }
            );
        },


        /* ---------------------------------------------------------------
         * Authentication storage
         *
         * auth.js uses these.
         * ------------------------------------------------------------- */

        getToken,

        setToken,

        clearToken,


        /* ---------------------------------------------------------------
         * Configuration
         * ------------------------------------------------------------- */

        config: API_CONFIG,


        /* ---------------------------------------------------------------
         * Error classes
         * ------------------------------------------------------------- */

        ApiError,

        ApiValidationError,

        ApiNetworkError
    };


    /* =====================================================================
     * 9. EXPOSE GLOBAL TAILORA API
     * =================================================================== */

    window.TL =
        window.TL || {};


    window.TL.Api =
        Api;


})();