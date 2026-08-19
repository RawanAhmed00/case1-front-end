(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    const P = TL.Pages;
    const form = document.getElementById("settingsForm");
    const socialContainer = document.getElementById("socialMediaLinksContainer");
    const addSocialBtn = document.getElementById("addSocialMediaBtn");
    const deleteBtn = document.getElementById("settingsDeleteBtn");
    const saveBtn = document.getElementById("settingsSaveBtn");

    const logoInput = document.getElementById("logo");
    const logoPreview = document.getElementById("logoPreview");
    const logoPlaceholder = document.getElementById("logoPlaceholder");

    const bannerInput = document.getElementById("homepage_banner");
    const bannerPreview = document.getElementById("bannerPreview");
    const bannerPlaceholder = document.getElementById("bannerPlaceholder");

    let currentSettingsId = null;

    // Image preview helper
    function setupImagePreview(input, img, placeholder) {
      if (!input || !img) return;
      input.addEventListener("change", function () {
        const file = input.files && input.files[0];
        if (file) {
          const url = URL.createObjectURL(file);
          img.src = url;
          img.style.display = "block";
          if (placeholder) placeholder.style.display = "none";
        }
      });
    }

    setupImagePreview(logoInput, logoPreview, logoPlaceholder);
    setupImagePreview(bannerInput, bannerPreview, bannerPlaceholder);

    function createSocialRow(typeValue = "", linkValue = "") {
      const row = document.createElement("div");
      row.className = "social-media-row d-flex align-items-center gap-2 mb-2";
      row.innerHTML = `
        <select class="tl-select social-media-type" style="width: 140px; flex-shrink: 0;" required>
          <option value="">Platform</option>
          <option value="facebook" ${typeValue === "facebook" ? "selected" : ""}>Facebook</option>
          <option value="instagram" ${typeValue === "instagram" ? "selected" : ""}>Instagram</option>
          <option value="twitter" ${typeValue === "twitter" ? "selected" : ""}>Twitter / X</option>
          <option value="linkedin" ${typeValue === "linkedin" ? "selected" : ""}>LinkedIn</option>
          <option value="youtube" ${typeValue === "youtube" ? "selected" : ""}>YouTube</option>
        </select>

        <input
          type="url"
          class="tl-input social-media-link flex-grow-1"
          placeholder="https://..."
          value="${P.escape(linkValue)}"
          required
        >

        <button
          type="button"
          class="tl-btn tl-btn--danger tl-btn--sm remove-social-btn"
          title="Remove link"
          style="padding: 7px 10px;"
        >
          <i class="bi bi-trash"></i>
        </button>
      `;

      socialContainer.appendChild(row);
    }

    if (addSocialBtn) {
      addSocialBtn.addEventListener("click", function () {
        createSocialRow();
      });
    }

    if (socialContainer) {
      socialContainer.addEventListener("click", function (event) {
        const btn = event.target.closest(".remove-social-btn");
        if (btn) {
          const row = btn.closest(".social-media-row");
          if (row) {
            row.remove();
          }
        }
      });
    }

    function collectData() {
      const d = {
        site_name: form.site_name.value.trim(),
        email: form.email.value.trim(),
        phone: form.phone.value.trim(),
        address: form.address.value.trim(),
      };

      // Collect social media links
      const socialRows = socialContainer.querySelectorAll(".social-media-row");
      const socialMediaLinks = [];

      socialRows.forEach(row => {
        const typeEl = row.querySelector(".social-media-type");
        const linkEl = row.querySelector(".social-media-link");
        const type = typeEl ? typeEl.value : "";
        const link = linkEl ? linkEl.value.trim() : "";

        if (type && link) {
          socialMediaLinks.push({ type, link });
        }
      });

      if (socialMediaLinks.length > 0) {
        d.social_media_links = socialMediaLinks;
      }

      // Files
      if (form.logo && form.logo.files[0]) {
        d.logo = form.logo.files[0];
      }

      if (form.homepage_banner && form.homepage_banner.files[0]) {
        d.homepage_banner = form.homepage_banner.files[0];
      }

      return d;
    }

    async function loadSettings() {
      try {
        const r = await TL.Settings.getWebsiteSettings();
        let item = null;

        if (Array.isArray(r)) {
          item = r[0];
        } else if (r && Array.isArray(r.data)) {
          item = r.data[0];
        } else if (r && r.data && typeof r.data === "object") {
          item = r.data;
        }

        if (item && item.id) {
          currentSettingsId = item.id;
          form.site_name.value = item.site_name || "";
          form.email.value = item.email || "";
          form.phone.value = item.phone || "";
          form.address.value = item.address || "";

          if (item.logo) {
            logoPreview.src = item.logo;
            logoPreview.style.display = "block";
            if (logoPlaceholder) logoPlaceholder.style.display = "none";
          }

          if (item.homepage_banner) {
            bannerPreview.src = item.homepage_banner;
            bannerPreview.style.display = "block";
            if (bannerPlaceholder) bannerPlaceholder.style.display = "none";
          }

          socialContainer.innerHTML = "";
          if (Array.isArray(item.social_media_links) && item.social_media_links.length > 0) {
            item.social_media_links.forEach(s => {
              createSocialRow(s.type, s.link);
            });
          } else {
            createSocialRow();
          }
        } else {
          currentSettingsId = null;
          socialContainer.innerHTML = "";
          createSocialRow();
        }
      } catch (err) {
        // First time or empty
        socialContainer.innerHTML = "";
        createSocialRow();
      }
    }

    // Save Settings
    if (form) {
      form.addEventListener("submit", async function (e) {
        e.preventDefault();
        P.clearErrors(form);
        P.setBusy(saveBtn, true);

        try {
          const data = collectData();
          let r;

          if (currentSettingsId) {
            r = await TL.Settings.updateWebsiteSettings(currentSettingsId, data);
            TL.showToast("Website settings updated successfully.", "success");
          } else {
            r = await TL.Settings.createWebsiteSettings(data);
            TL.showToast("Website settings created successfully.", "success");
          }

          const d = P.data(r);
          if (d && d.id) {
            currentSettingsId = d.id;
          }

          await loadSettings();
        } catch (err) {
          if (err instanceof TL.Api.ApiValidationError) {
            P.showValidation(form, err.errors);
          }
          TL.showToast(err.message || "Failed to save website settings.", "error");
        } finally {
          P.setBusy(saveBtn, false);
        }
      });
    }

    // Delete Current Settings Button
    if (deleteBtn) {
      deleteBtn.addEventListener("click", async function () {
        if (!currentSettingsId) {
          TL.showToast("No active website settings to delete.", "warning");
          return;
        }

        if (!P.confirm("Are you sure you want to delete the current website settings? This action cannot be undone.")) {
          return;
        }

        P.setBusy(deleteBtn, true);

        try {
          await TL.Settings.deleteWebsiteSettings(currentSettingsId);
          currentSettingsId = null;
          form.reset();

          if (logoPreview) {
            logoPreview.src = "";
            logoPreview.style.display = "none";
          }
          if (logoPlaceholder) logoPlaceholder.style.display = "block";

          if (bannerPreview) {
            bannerPreview.src = "";
            bannerPreview.style.display = "none";
          }
          if (bannerPlaceholder) bannerPlaceholder.style.display = "block";

          socialContainer.innerHTML = "";
          createSocialRow();

          TL.showToast("Website settings deleted successfully.", "success");
        } catch (err) {
          TL.showToast(err.message || "Failed to delete website settings.", "error");
        } finally {
          P.setBusy(deleteBtn, false);
        }
      });
    }

    loadSettings();
  });
})();