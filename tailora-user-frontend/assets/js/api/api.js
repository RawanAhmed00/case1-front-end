/**
 * TAILORA USER — API CORE
 *
 * Central API client for the Tailora user-facing frontend.
 * Same architecture as the Admin frontend's assets/js/api/api.js so the two
 * apps share conventions, but namespaced separately (token key, storage)
 * so signing in on one never touches the other.
 */
(function () {
  "use strict";

  const API_CONFIG = {
    // Same Laravel backend as the Admin frontend. All User API endpoints in
    // the docs are given relative to /api, so that's the base here too.
    baseUrl: "http://127.0.0.1:8000/api",
    tokenKey: "tailora_user_token",
    userKey: "tailora_user_profile"
  };

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
      this.errors = body && body.errors ? body.errors : {};
    }
  }

  class ApiNetworkError extends ApiError {
    constructor(message) {
      super(message, 0, null);
      this.name = "ApiNetworkError";
    }
  }

  function getToken() {
    return localStorage.getItem(API_CONFIG.tokenKey);
  }

  function setToken(token) {
    if (!token) return false;
    localStorage.setItem(API_CONFIG.tokenKey, token);
    return true;
  }

  function clearToken() {
    localStorage.removeItem(API_CONFIG.tokenKey);
    localStorage.removeItem(API_CONFIG.userKey);
  }

  function buildUrl(path, query) {
    if (!path.startsWith("/")) path = "/" + path;
    const url = API_CONFIG.baseUrl.replace(/\/$/, "") + path;
    if (!query || Object.keys(query).length === 0) return url;
    const queryString = new URLSearchParams(
      Object.entries(query)
        .filter(([, v]) => v !== undefined && v !== null && v !== "")
        .map(([k, v]) => [k, String(v)])
    ).toString();
    return queryString ? `${url}?${queryString}` : url;
  }

  async function parseBody(response) {
    const text = await response.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch (e) {
      return text;
    }
  }

  async function handleResponse(response) {
    const body = await parseBody(response);

    if (response.status === 401) {
      if (window.TL && window.TL.Auth && typeof window.TL.Auth.handle401 === "function") {
        window.TL.Auth.handle401();
      }
      throw new ApiError(body && body.message ? body.message : "Session expired. Please sign in again.", 401, body);
    }

    if (response.status === 422) {
      throw new ApiValidationError(body && body.message ? body.message : "Validation failed.", 422, body);
    }

    if (!response.ok) {
      throw new ApiError(
        body && body.message ? body.message : `Request failed with status ${response.status}.`,
        response.status,
        body
      );
    }

    return body;
  }

  async function request(method, path, options = {}) {
    const { body, isFormData = false, query, headers: extraHeaders } = options;

    const headers = { Accept: "application/json" };

    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    if (body !== undefined && !isFormData) headers["Content-Type"] = "application/json";

    if (extraHeaders) Object.assign(headers, extraHeaders);

    const fetchOptions = { method, headers };
    if (body !== undefined) fetchOptions.body = isFormData ? body : JSON.stringify(body);

    let response;
    try {
      response = await fetch(buildUrl(path, query), fetchOptions);
    } catch (networkError) {
      throw new ApiNetworkError(
        "We couldn't reach Tailora's servers. Check your connection and that the API is running."
      );
    }

    return handleResponse(response);
  }

  const Api = {
    get(path, query) {
      return request("GET", path, { query });
    },
    post(path, body, options = {}) {
      return request("POST", path, Object.assign({ body }, options));
    },
    put(path, body, options = {}) {
      return request("PUT", path, Object.assign({ body }, options));
    },
    patch(path, body, options = {}) {
      return request("PATCH", path, Object.assign({ body }, options));
    },
    delete(path, options = {}) {
      return request("DELETE", path, options);
    },
    postForm(path, formData) {
      return request("POST", path, { body: formData, isFormData: true });
    },
    putForm(path, formData) {
      return request("PUT", path, { body: formData, isFormData: true });
    },
    getToken,
    setToken,
    clearToken,
    config: API_CONFIG,
    ApiError,
    ApiValidationError,
    ApiNetworkError
  };

  window.TL = window.TL || {};
  window.TL.Api = Api;
})();
