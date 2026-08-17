/**
 * TAILORA TOUR GUIDE — AUTH PAGE CONTROLLER
 * Sign in form validation, submit handler, API error handling, and redirection.
 */

(function () {
  "use strict";

  function init() {
    const form = document.getElementById("tlLoginForm");
    if (!form) return;

    const emailInput = document.getElementById("tlEmail");
    const passInput = document.getElementById("tlPassword");
    const emailErr = document.getElementById("tlEmailError");
    const passErr = document.getElementById("tlPasswordError");
    const submitBtn = document.getElementById("tlLoginSubmitBtn");

    function clearErrors() {
      if (emailErr) emailErr.textContent = "";
      if (passErr) passErr.textContent = "";
    }

    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      clearErrors();

      const email = emailInput ? emailInput.value.trim() : "";
      const password = passInput ? passInput.value.trim() : "";
      let valid = true;

      if (!email) {
        if (emailErr) emailErr.textContent = "Please enter your email address.";
        valid = false;
      } else if (!email.includes("@")) {
        if (emailErr) emailErr.textContent = "Please enter a valid email address.";
        valid = false;
      }

      if (!password) {
        if (passErr) passErr.textContent = "Please enter your password.";
        valid = false;
      }

      if (!valid) return;

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span> Signing in...';
      }

      try {
        await window.TL.Auth.login({ email, password });
        if (window.TL.showToast) window.TL.showToast("Signed in successfully!", "success");
        setTimeout(() => {
          window.location.replace("dashboard.html");
        }, 500);
      } catch (err) {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i class="bi bi-box-arrow-in-right"></i> Sign In to Command Center';
        }

        if (err instanceof window.TL.Api.ApiValidationError) {
          if (err.errors.email && emailErr) emailErr.textContent = err.errors.email.join(" ");
          if (err.errors.password && passErr) passErr.textContent = err.errors.password.join(" ");
        } else {
          if (emailErr) emailErr.textContent = err.message || "Invalid credentials. Please try again.";
        }
      }
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
