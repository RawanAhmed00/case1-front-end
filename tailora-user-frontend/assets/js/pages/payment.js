/**
 * TAILORA USER — PAYMENT PAGE
 * GET  /bookings/{id}          (best-effort summary)
 * POST /payments               { booking_id }  — idempotent on the backend,
 *                               but the button is still disabled immediately
 *                               and never re-enabled after success so a
 *                               double click/tap can't fire it twice.
 * POST /payments/{id}/checkout — only called if the create response didn't
 *                               already include a usable payment_url.
 *
 * No card fields are collected here — Tailora hands off to whatever
 * checkout/payment_url the backend returns (Paymob), and the Paymob
 * webhook itself is entirely server-side.
 */
(function () {
  "use strict";

  let paymentCreated = false;

  function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function findUrl(response) {
    return window.TL.Util.pick(
      response,
      ["payment_url", "checkout_url", "url", "data.payment_url", "data.checkout_url", "data.url"],
      null
    );
  }

  function showError(message) {
    const mount = document.getElementById("payment-error");
    if (!message) {
      mount.classList.add("tl-hidden");
      mount.innerHTML = "";
      return;
    }
    mount.classList.remove("tl-hidden");
    mount.innerHTML = `<div class="tl-auth-alert is-visible">${window.TL.Util.escape(message)}</div>`;
  }

  async function renderBookingSummary(bookingId) {
    const mount = document.getElementById("payment-details");
    try {
      const response = await window.TL.Bookings.get(bookingId);
      const booking = window.TL.Util.pick(response, ["data", "booking"], response);
      const status = window.TL.Util.pick(booking, ["status"], "pending");
      const amount = window.TL.Util.money(window.TL.Util.pick(booking, ["amount", "total", "price"], null));
      mount.innerHTML = `
        <div class="tl-payment-row"><span>Booking</span><span>#${window.TL.Util.escape(bookingId)}</span></div>
        <div class="tl-payment-row"><span>Status</span><span>${window.TL.Util.escape(status)}</span></div>
        ${amount ? `<div class="tl-payment-row"><span>Amount</span><strong>${window.TL.Util.escape(amount)}</strong></div>` : ""}`;
      document.getElementById("payment-subtitle").textContent = "Review your booking, then create your payment.";
    } catch (err) {
      // Best-effort — GET /bookings/{id} may not be reachable for this
      // booking; the payment can still be created from the booking_id alone.
      mount.innerHTML = `<div class="tl-payment-row"><span>Booking</span><span>#${window.TL.Util.escape(bookingId)}</span></div>`;
      document.getElementById("payment-subtitle").textContent = "Ready to create your payment.";
    }
  }

  async function proceedToCheckout(paymentId, createResponse) {
    const actions = document.getElementById("payment-checkout-actions");
    let url = findUrl(createResponse);

    if (!url && paymentId) {
      try {
        const checkoutResponse = await window.TL.Payments.checkout(paymentId);
        url = findUrl(checkoutResponse);
      } catch (err) {
        showError(err.message || "Payment was created, but checkout couldn't be started.");
        return;
      }
    }

    if (url) {
      actions.innerHTML = `<a class="tl-btn tl-btn--primary tl-btn--block" href="${window.TL.Util.escape(url)}" target="_top">Proceed to Checkout →</a>`;
    } else {
      actions.innerHTML = `<p class="tl-text-secondary" style="font-size:13px;">Your payment has been created. We'll update your booking status shortly.</p>`;
    }
  }

  function wireCreatePayment(bookingId) {
    const btn = document.getElementById("create-payment-btn");
    btn.addEventListener("click", async () => {
      if (paymentCreated) return; // guards against double-submit / idempotency
      paymentCreated = true;
      btn.disabled = true;
      btn.textContent = "Creating payment…";
      showError("");

      try {
        const response = await window.TL.Payments.create({ booking_id: bookingId });
        const payment = window.TL.Util.pick(response, ["data", "payment"], response);
        const paymentId = window.TL.Util.id(payment);

        btn.textContent = "✓ Payment Created";
        window.TL.toast("Payment created!");
        await proceedToCheckout(paymentId, response);
      } catch (err) {
        paymentCreated = false;
        btn.disabled = false;
        btn.textContent = "Create Payment";
        if (err.name === "ApiValidationError" && err.errors) {
          showError(Object.values(err.errors).flat().join(" ") || err.message);
        } else {
          showError(err.message || "Couldn't create your payment. Please try again.");
        }
        window.TL.toast(err.message || "Payment failed.", "error");
      }
    });
  }

  function init() {
    if (!window.TL.Auth.guard()) return;

    const noBooking = document.getElementById("payment-no-booking");
    const shell = document.getElementById("payment-shell");

    let bookingId = getParam("booking_id");
    if (!bookingId) {
      const cartBooking = window.TL.Cart.getBooking();
      bookingId = cartBooking ? window.TL.Util.id(cartBooking) : null;
    }

    if (!bookingId) {
      noBooking.classList.remove("tl-hidden");
      shell.classList.add("tl-hidden");
      return;
    }

    noBooking.classList.add("tl-hidden");
    shell.classList.remove("tl-hidden");

    renderBookingSummary(bookingId);
    wireCreatePayment(bookingId);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
