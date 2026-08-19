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

  P.extractPagination = function (response, currentPageNum = 1, perPageNum = 10) {
    let raw = P.parse(response);
    if (typeof raw === "string") {
      try { raw = JSON.parse(raw); } catch (_) {}
    }
    
    let rows = [];
    let meta = {
      current_page: currentPageNum,
      last_page: 1,
      per_page: perPageNum,
      total: 0
    };

    if (!raw || typeof raw !== "object") {
      return { rows: [], meta };
    }

    if (Array.isArray(raw)) {
      const total = raw.length;
      const last_page = Math.max(1, Math.ceil(total / perPageNum));
      const start = (currentPageNum - 1) * perPageNum;
      rows = raw.slice(start, start + perPageNum);
      meta = {
        current_page: currentPageNum,
        last_page: last_page,
        per_page: perPageNum,
        total: total
      };
      return { rows, meta };
    }

    if (Array.isArray(raw.data)) {
      rows = raw.data;
      if (raw.meta && typeof raw.meta === "object") {
        meta = {
          current_page: Number(raw.meta.current_page) || currentPageNum,
          last_page: Number(raw.meta.last_page) || 1,
          per_page: Number(raw.meta.per_page) || perPageNum,
          total: Number(raw.meta.total) != null ? Number(raw.meta.total) : rows.length
        };
      } else if (raw.current_page !== undefined || raw.last_page !== undefined || raw.total !== undefined) {
        meta = {
          current_page: Number(raw.current_page) || currentPageNum,
          last_page: Number(raw.last_page) || 1,
          per_page: Number(raw.per_page) || perPageNum,
          total: Number(raw.total) != null ? Number(raw.total) : rows.length
        };
      } else {
        meta = {
          current_page: currentPageNum,
          last_page: 1,
          per_page: perPageNum,
          total: rows.length
        };
      }
      return { rows, meta };
    }

    if (raw.data && typeof raw.data === "object" && Array.isArray(raw.data.data)) {
      rows = raw.data.data;
      const pSource = raw.data.meta || raw.data;
      meta = {
        current_page: Number(pSource.current_page) || currentPageNum,
        last_page: Number(pSource.last_page) || 1,
        per_page: Number(pSource.per_page) || perPageNum,
        total: Number(pSource.total) != null ? Number(pSource.total) : rows.length
      };
      return { rows, meta };
    }

    return { rows, meta };
  };

  P.buildPagination = function (meta, pageAttr, itemLabel = "items", currentPageNum = 1) {
    const cur = meta ? (meta.current_page || currentPageNum) : currentPageNum;
    const last = meta ? Math.max(1, meta.last_page || 1) : 1;
    const total = meta ? (meta.total != null ? meta.total : 0) : 0;
    const perPage = meta ? (meta.per_page || 10) : 10;

    let pageButtons = "";
    const maxPagesToShow = 5;
    let startPage = Math.max(1, cur - 2);
    let endPage = Math.min(last, startPage + maxPagesToShow - 1);
    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let p = startPage; p <= endPage; p++) {
      pageButtons += `
        <button type="button" class="tl-page-btn ${p === cur ? 'is-active' : ''}" ${pageAttr}="${p}">
          ${p}
        </button>
      `;
    }

    return `
      <div class="tl-pagination" style="padding: 14px 24px;">
        <span class="tl-metadata">
          Showing page <strong>${cur}</strong> of <strong>${last}</strong> (${total} total ${itemLabel}, ${perPage} per page)
        </span>
        <div class="d-flex align-items-center gap-1">
          <button type="button" class="tl-page-btn" ${cur <= 1 ? 'disabled' : ''} ${cur > 1 ? `${pageAttr}="${cur - 1}"` : ''}>
            <i class="bi bi-chevron-left"></i> Prev
          </button>
          ${pageButtons}
          <button type="button" class="tl-page-btn" ${cur >= last ? 'disabled' : ''} ${cur < last ? `${pageAttr}="${cur + 1}"` : ''}>
            Next <i class="bi bi-chevron-right"></i>
          </button>
        </div>
      </div>
    `;
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

  P.date = function (value) {
    if (value === null || value === undefined || value === "") return "Data unavailable";
    const str = String(value).trim();
    const match = str.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];
    try {
      const d = new Date(str);
      if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
    } catch (_) {}
    return str;
  };

  P.badge = function (value) {
    const text = P.display(value);
    const lower = text.toLowerCase();
    let cls = "tl-badge--neutral";
    if (["inactive","deactivated","unactive","disabled","rejected","cancelled","blocked","deleted","failed"].some(x => lower === x || lower.includes(x))) cls = "tl-badge--danger";
    else if (["active","approved","success","verified","read","confirmed"].some(x => lower === x || lower.includes(x))) cls = "tl-badge--success";
    else if (["pending","warning","unread","processing"].some(x => lower === x || lower.includes(x))) cls = "tl-badge--warning";
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
