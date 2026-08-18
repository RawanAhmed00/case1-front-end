(function () {
  "use strict";

  function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function showAlert(message, type = "error") {
    const alertEl = document.getElementById("auth-alert");
    if (!alertEl) return;
    alertEl.textContent = message;
    alertEl.className = `tl-auth-alert is-visible${type === "success" ? " tl-auth-alert--success" : ""}`;
  }

  function clearFieldErrors(form) {
    form.querySelectorAll(".tl-field").forEach((f) => {
      f.classList.remove("has-error");
      const err = f.querySelector(".tl-field-error");
      if (err) err.textContent = "";
    });
  }

  function applyValidationErrors(form, errors) {
    Object.entries(errors || {}).forEach(([key, messages]) => {
      const field = document.getElementById(`field-${key}`);
      if (!field) return;
      field.classList.add("has-error");
      const err = field.querySelector(".tl-field-error");
      if (err) err.textContent = Array.isArray(messages) ? messages[0] : messages;
    });
  }

  function setLoading(btn, loading, label) {
    if (!btn) return;
    btn.disabled = loading;
    btn.textContent = loading ? "Please wait…" : label;
  }

  async function handleSubmit(form, submitBtn, defaultLabel, action) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearFieldErrors(form);
      const alertEl = document.getElementById("auth-alert");
      if (alertEl) alertEl.className = "tl-auth-alert";
      setLoading(submitBtn, true);
      try {
        await action(new FormData(form));
      } catch (err) {
        if (err && err.name === "ApiValidationError") {
          applyValidationErrors(form, err.errors);
          showAlert(err.message || "Please check the highlighted fields.");
        } else {
          showAlert((err && err.message) || "Something went wrong. Please try again.");
        }
      } finally {
        setLoading(submitBtn, false, defaultLabel);
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    const next = getParam("next") || "index.html";

    // Sign in
    const signinForm = document.getElementById("signin-form");
    if (signinForm) {
      handleSubmit(signinForm, document.getElementById("signin-submit"), "Sign In", async (data) => {
        await window.TL.Auth.login({ email: data.get("email"), password: data.get("password") });
        window.TL.toast("Welcome back!");
        window.location.href = next === "signin.html" ? "index.html" : next;
      });
    }

    // Sign up
    const signupForm = document.getElementById("signup-form");
    if (signupForm) {
      handleSubmit(signupForm, document.getElementById("signup-submit"), "Create Account", async (data) => {
      await window.TL.Auth.register({
      name: data.get("name"),
      email: data.get("email"),
      password: data.get("password"),
     password_confirmation: data.get("password_confirmation"),
      age: data.get("age"),
     dist_country: data.get("dist_country"),
     gender: data.get("gender"),
    phone_num: data.get("phone_num")
     });
        showAlert("Account created! You can now sign in.", "success");
        setTimeout(() => (window.location.href = "signin.html"), 1200);
      });
    }

    // Forgot password
    const forgotForm = document.getElementById("forgot-form");
    if (forgotForm) {
      handleSubmit(forgotForm, document.getElementById("forgot-submit"), "Send Reset Link", async (data) => {
        await window.TL.Auth.forgotPassword(data.get("email"));
        showAlert("If that email exists, a reset link is on its way.", "success");
      });
    }

    // Reset password
    const resetForm = document.getElementById("reset-form");
    if (resetForm) {
      const emailFromUrl = getParam("email");
      const tokenFromUrl = getParam("token");
      if (emailFromUrl) document.getElementById("email").value = emailFromUrl;

      handleSubmit(resetForm, document.getElementById("reset-submit"), "Reset Password", async (data) => {
        if (!tokenFromUrl) {
          showAlert("This reset link is missing its token. Please use the link from your email.");
          return;
        }
        await window.TL.Auth.resetPassword({
          token: tokenFromUrl,
          email: data.get("email"),
          password: data.get("password"),
          password_confirmation: data.get("password_confirmation")
        });
        showAlert("Password reset! Redirecting to sign in…", "success");
        setTimeout(() => (window.location.href = "signin.html"), 1200);
      });
    }

    // If already signed in, bounce away from auth pages.
    if (window.TL.Auth.isAuthenticated() && (signinForm || signupForm)) {
      window.location.href = "index.html";
    }
  });
})();
