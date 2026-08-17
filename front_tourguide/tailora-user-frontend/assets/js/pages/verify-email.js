/**
 * TAILORA USER — EMAIL VERIFICATION
 * GET /auth/email/verify/{id}/{hash}
 * POST /auth/email/resend (requires auth)
 */
(function () {
  "use strict";

  function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function show(id) {
    ["verify-loading", "verify-success", "verify-error"].forEach((el) => {
      document.getElementById(el).classList.toggle("tl-hidden", el !== id);
    });
  }

  async function init() {
    const id = getParam("id");
    const hash = getParam("hash");

    if (!id || !hash) {
      show("verify-error");
      document.getElementById("verify-error-message").textContent =
        "This verification link is missing its ID or signature. Please use the link from your email exactly as sent.";
    } else {
      try {
        await window.TL.Auth.verifyEmail(id, hash);
        show("verify-success");
      } catch (err) {
        show("verify-error");
        document.getElementById("verify-error-message").textContent =
          err.message || "This verification link may have expired or already been used.";
      }
    }

    const resendBtn = document.getElementById("resend-btn");
    resendBtn.addEventListener("click", async () => {
      if (!window.TL.Auth.isAuthenticated()) {
        window.location.href = "signin.html?next=verify-email.html";
        return;
      }
      resendBtn.disabled = true;
      resendBtn.textContent = "Sending…";
      try {
        await window.TL.Auth.resendVerificationEmail();
        window.TL.toast("Verification email sent — check your inbox.");
      } catch (err) {
        window.TL.toast(err.message || "Couldn't resend the verification email.", "error");
      } finally {
        resendBtn.disabled = false;
        resendBtn.textContent = "Resend Verification Email";
      }
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
