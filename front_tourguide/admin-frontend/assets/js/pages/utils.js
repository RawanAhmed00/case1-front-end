/* Tailora final shared page utilities. No API calls are made here. */
(function () {
  "use strict";
  window.TL = window.TL || {};
  const P = {};

  P.escape = function (value) {
    const d = document.createElement("div");
    d.textContent = value == null ? "" : String(value);
    return d.innerHTML;
  };

  P.parse = function (value) {
    if (typeof value !== "string") return value;
    const text = value.trim();
    if (!text) return "";
    try { return JSON.parse(text); } catch (_) { return value; }
  };

  P.data = function (response) {
    const parsed = P.parse(response);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed) && Object.prototype.hasOwnProperty.call(parsed, "data")) {
      return P.parse(parsed.data);
    }
    return parsed;
  };

  P.list = function (response) {
    const value = P.data(response);
    if (Array.isArray(value)) return value;
    if (value && typeof value === "object") {
      if (Array.isArray(value.data)) return value.data;
      if (Array.isArray(value.items)) return value.items;
      if (Array.isArray(value.results)) return value.results;
    }
    return null;
  };

  P.value = function (obj, key) {
    return obj && obj[key] !== undefined && obj[key] !== null && obj[key] !== "" ? obj[key] : null;
  };

  P.display = function (value) {
    if (value === null || value === undefined || value === "") return "Data unavailable";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  P.badge = function (value) {
    const text = P.display(value);
    const lower = text.toLowerCase();
    let cls = "tl-badge--neutral";
    if (["active","approved","success","verified","read","confirmed"].some(x => lower === x || lower.includes(x))) cls = "tl-badge--success";
    else if (["pending","warning","unread","processing"].some(x => lower === x || lower.includes(x))) cls = "tl-badge--warning";
    else if (["rejected","cancelled","blocked","deleted","failed"].some(x => lower === x || lower.includes(x))) cls = "tl-badge--danger";
    else if (["info","user","admin"].some(x => lower === x || lower.includes(x))) cls = "tl-badge--info";
    return `<span class="tl-badge ${cls}">${P.escape(text)}</span>`;
  };

  P.empty = function (title, desc, icon) {
    return `<div class="tl-empty"><div class="tl-empty__icon"><i class="bi ${icon || "bi-database-x"}"></i></div><div class="tl-empty__title">${P.escape(title || "Data unavailable")}</div><p class="tl-empty__desc">${P.escape(desc || "The API did not provide a renderable dataset for this section.")}</p></div>`;
  };

  P.error = function (message) {
    return P.empty("Unable to load data", message || "The request failed. Please try again.");
  };

  P.setBusy = function (button, busy) {
    if (!button) return;
    button.disabled = !!busy;
    button.classList.toggle("is-disabled", !!busy);
    if (busy) button.dataset.originalHtml = button.innerHTML, button.innerHTML = '<span class="spinner-border spinner-border-sm" aria-hidden="true"></span> Working…';
    else if (button.dataset.originalHtml) button.innerHTML = button.dataset.originalHtml;
  };

  P.clearErrors = function (form) {
    form.querySelectorAll(".tl-input.is-invalid,.tl-select.is-invalid,.tl-textarea.is-invalid").forEach(el => el.classList.remove("is-invalid"));
    form.querySelectorAll(".tl-field-error").forEach(el => { el.textContent = ""; el.classList.remove("is-visible"); });
  };

  P.showValidation = function (form, errors) {
    Object.entries(errors || {}).forEach(([field, messages]) => {
      const input = form.querySelector(`[name="${CSS.escape(field)}"]`);
      const error = form.querySelector(`[data-error-for="${CSS.escape(field)}"]`);
      if (input) input.classList.add("is-invalid");
      if (error) {
        error.textContent = Array.isArray(messages) ? messages[0] : String(messages);
        error.classList.add("is-visible");
      }
    });
  };

  P.modal = function (id) {
    const el = document.getElementById(id);
    return el ? bootstrap.Modal.getOrCreateInstance(el) : null;
  };

  P.confirm = function (message) {
    return window.confirm(message);
  };

  P.refresh = function () { window.location.reload(); };

  window.TL.Pages = P;
})();
