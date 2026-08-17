(function () {
  "use strict";

  async function init() {
    if (document.body.dataset.page !== "profile") return;

    let user = {};

    try {
      const res = await window.TL.TourGuideApi.getProfile();
      console.log("SUCCESS Response:", res);
      
      user = res.user || res.data?.user || res.data || res || {};
    } catch (err) {
      console.error("ERROR in getProfile:", err);
      user = window.TL.Auth.getCachedUser() || {};
    }

    console.log("Final User Object to Fill Inputs:", user);

    const nameInput = document.getElementById("profileNameInput");
    const emailInput = document.getElementById("profileEmailInput");
    const ageInput = document.getElementById("profileAgeInput");
    const countryInput = document.getElementById("profileCountryInput");
    const genderInput = document.getElementById("profileGenderInput");
    const phoneInput = document.getElementById("profilePhoneInput");

    if (nameInput) nameInput.value = user.name || "";
    if (emailInput) emailInput.value = user.email || "";
    if (ageInput) ageInput.value = user.age || "";
    if (countryInput) countryInput.value = user.dist_country || "";
    
    // ضبط اختيار الـ Gender ليطابق الحروف الكبيرة والصغيرة تلقائياً
    if (genderInput && user.gender) {
      const val = user.gender.toLowerCase();
      for (let option of genderInput.options) {
        if (option.value.toLowerCase() === val || option.text.toLowerCase() === val) {
          genderInput.value = option.value;
          break;
        }
      }
    }

    if (phoneInput) phoneInput.value = user.phone_num || "";

    document.getElementById("profileForm")?.addEventListener("submit", async function (e) {
      e.preventDefault();

      const formData = {
        name: nameInput.value.trim(),
        email: emailInput.value.trim(),
        age: ageInput.value.trim(),
        dist_country: countryInput.value.trim(),
        gender: genderInput ? genderInput.value.trim() : "",
        phone_num: phoneInput.value.trim()
      };

      try {
        await window.TL.TourGuideApi.updateProfile(formData);
        window.TL.Auth.setCachedUser({ ...user, ...formData });
        window.TL.showToast("Profile settings updated successfully!", "success");
        setTimeout(() => window.location.reload(), 800);
      } catch (err) {
        window.TL.showToast("Failed to update profile", "error");
      }
    });

  document.getElementById("securityForm")?.addEventListener("submit", async function (e) {
  e.preventDefault();

  const current_password = document.getElementById("currPassInput").value.trim();
  const password = document.getElementById("newPassInput").value.trim(); // لازم اسمها password
  const password_confirmation = document.getElementById("confirmPassInput").value.trim(); // لازم اسمها password_confirmation

  try {
    await window.TL.TourGuideApi.updatePassword({
      current_password,
      password,
      password_confirmation
    });

    window.TL.showToast("Password updated successfully!", "success");
    document.getElementById("securityForm").reset();
  } catch (err) {
   
    window.TL.showToast(err.message || "Failed to update password", "error");
  }
});
  }

  document.addEventListener("DOMContentLoaded", init);
})();