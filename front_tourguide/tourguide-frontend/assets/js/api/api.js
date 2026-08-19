/**
 * TAILORA TOUR GUIDE — API CORE
 * Central API client handling requests, headers, Bearer tokens,
 * JSON parsing, 401 Unauthorized, 422 Validation Errors, and network handling.
 */

(function () {
  "use strict";

  const API_CONFIG = {
    get baseUrl() {
      return (window.ENV && window.ENV.API_URL) ? window.ENV.API_URL : "https://reliable-laughter-production-a837.up.railway.app/api";
    },
    tokenKey: "tailora_guide_token",
    userKey: "tailora_guide_user"
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
    } catch {
      return text;
    }
  }

  async function handleResponse(response) {
    const body = await parseBody(response);

    function getErrorMessage(fallback) {
      if (!body) return fallback;
      if (typeof body === "string") return body;
      if (body.message) return body.message;
      if (body.error) return body.error;
      return fallback;
    }

    if (response.status === 401) {
      if (window.TL && window.TL.Auth && typeof window.TL.Auth.handle401 === "function") {
        window.TL.Auth.handle401();
      }
      throw new ApiError(getErrorMessage("Unauthenticated"), 401, body);
    }

    if (response.status === 422) {
      throw new ApiValidationError(getErrorMessage("Validation error"), 422, body);
    }

    if (!response.ok) {
      throw new ApiError(getErrorMessage(`Request failed status ${response.status}`), response.status, body);
    }

    return body;
  }

  async function request(method, path, options = {}) {
    const { body, isFormData = false, query, headers: extraHeaders } = options;

    const headers = {
      Accept: "application/json"
    };

    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    if (body !== undefined && !isFormData) {
      headers["Content-Type"] = "application/json";
    }

    if (extraHeaders) {
      Object.assign(headers, extraHeaders);
    }

    const fetchOptions = {
      method,
      headers
    };

    if (body !== undefined) {
      fetchOptions.body = isFormData ? body : JSON.stringify(body);
    }

    try {
      const response = await fetch(buildUrl(path, query), fetchOptions);
      return await handleResponse(response);
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new ApiNetworkError("Network error: Backend server unreachable.");
    }
  }

  const Api = {
    get(path, query) { return request("GET", path, { query }); },
    post(path, body, options = {}) { return request("POST", path, { body, ...options }); },
    put(path, body, options = {}) { return request("PUT", path, { body, ...options }); },
    patch(path, body, options = {}) { return request("PATCH", path, { body, ...options }); },
    delete(path, options = {}) { return request("DELETE", path, options); },
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
