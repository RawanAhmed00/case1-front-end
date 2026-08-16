/**
 * TAILORA USER — PAYMENTS API
 *
 * Endpoints:
 * POST /payments               ({ booking_id })  — idempotent on the backend
 * POST /payments/{id}/checkout — continues to the actual checkout flow
 *
 * The frontend only ever initiates these two calls. Card capture and the
 * Paymob webhook are backend/server-side concerns and are never
 * implemented here.
 */
(function () {
  "use strict";

  const Payments = {
    create(payload) {
      return window.TL.Api.post("/payments", payload);
    },
    checkout(paymentId) {
      return window.TL.Api.post(`/payments/${paymentId}/checkout`);
    }
  };

  window.TL = window.TL || {};
  window.TL.Payments = Payments;
})();
