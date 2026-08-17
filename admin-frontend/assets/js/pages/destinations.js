(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    const P = TL.Pages;

    function extractFormFields(form, prefix) {
      const data = {};
      form.querySelectorAll("[name]").forEach(el => {
        const key = el.name.replace(prefix + "_", "");
        if (el.type === "file") {
          if (el.files && el.files[0]) {
            data[key] = el.files[0];
          }
        } else {
          const val = el.value.trim();
          if (val !== "") {
            data[key] = val;
          }
        }
      });
      return data;
    }

    async function submitAction(form, actionFn, successMsg) {
      P.clearErrors(form);
      const btn = form.querySelector("button[type=submit]");
      P.setBusy(btn, true);

      try {
        await actionFn();
        TL.showToast(successMsg, "success");
        form.reset();
      } catch (err) {
        if (err instanceof TL.Api.ApiValidationError) {
          P.showValidation(form, err.errors);
        }
        TL.showToast(err.message || "Request failed.", "error");
      } finally {
        P.setBusy(btn, false);
      }
    }

    // 1. Create City
    const cityCreateForm = document.getElementById("cityCreateForm");
    if (cityCreateForm) {
      cityCreateForm.addEventListener("submit", e => {
        e.preventDefault();
        const payload = extractFormFields(cityCreateForm, "city");
        if (!payload.country_id || !payload.name) {
          TL.showToast("Please fill in Country ID and City Name.", "warning");
          return;
        }
        submitAction(
          cityCreateForm,
          () => TL.Cities.createCity(payload),
          "City created and inserted into database successfully."
        );
      });
    }

    // 2. Update City
    const cityManageForm = document.getElementById("cityManageForm");
    if (cityManageForm) {
      cityManageForm.addEventListener("submit", e => {
        e.preventDefault();
        const id = document.getElementById("city_id")?.value.trim();
        if (!id) {
          TL.showToast("Please enter a valid City ID.", "warning");
          return;
        }
        const payload = extractFormFields(cityManageForm, "city_update");
        submitAction(
          cityManageForm,
          () => TL.Cities.updateCity(id, payload),
          "City updated successfully."
        );
      });
    }

    // 3. Delete City
    const cityDeleteBtn = document.getElementById("cityDeleteBtn");
    if (cityDeleteBtn) {
      cityDeleteBtn.addEventListener("click", async () => {
        const id = document.getElementById("city_id")?.value.trim();
        if (!id) {
          TL.showToast("Please enter a Target City ID to delete.", "warning");
          return;
        }
        if (!P.confirm(`Are you sure you want to delete City #${id}? This cannot be undone.`)) {
          return;
        }
        P.setBusy(cityDeleteBtn, true);
        try {
          await TL.Cities.deleteCity(id);
          TL.showToast("City deleted successfully.", "success");
          if (cityManageForm) cityManageForm.reset();
        } catch (err) {
          TL.showToast(err.message || "Failed to delete city.", "error");
        } finally {
          P.setBusy(cityDeleteBtn, false);
        }
      });
    }

    // 4. Create Attraction
    const attractionCreateForm = document.getElementById("attractionCreateForm");
    if (attractionCreateForm) {
      attractionCreateForm.addEventListener("submit", e => {
        e.preventDefault();
        const payload = extractFormFields(attractionCreateForm, "att");
        if (!payload.city_id || !payload.name) {
          TL.showToast("Please fill in City ID and Attraction Name.", "warning");
          return;
        }
        submitAction(
          attractionCreateForm,
          () => TL.Attractions.createAttraction(payload),
          "Attraction created and inserted into database successfully."
        );
      });
    }

    // 5. Update Attraction
    const attractionManageForm = document.getElementById("attractionManageForm");
    if (attractionManageForm) {
      attractionManageForm.addEventListener("submit", e => {
        e.preventDefault();
        const id = document.getElementById("att_id")?.value.trim();
        if (!id) {
          TL.showToast("Please enter a valid Attraction ID.", "warning");
          return;
        }
        const payload = extractFormFields(attractionManageForm, "att_update");
        submitAction(
          attractionManageForm,
          () => TL.Attractions.updateAttraction(id, payload),
          "Attraction updated successfully."
        );
      });
    }

    // 6. Delete Attraction
    const attractionDeleteBtn = document.getElementById("attractionDeleteBtn");
    if (attractionDeleteBtn) {
      attractionDeleteBtn.addEventListener("click", async () => {
        const id = document.getElementById("att_id")?.value.trim();
        if (!id) {
          TL.showToast("Please enter a Target Attraction ID to delete.", "warning");
          return;
        }
        if (!P.confirm(`Are you sure you want to delete Attraction #${id}? This cannot be undone.`)) {
          return;
        }
        P.setBusy(attractionDeleteBtn, true);
        try {
          await TL.Attractions.deleteAttraction(id);
          TL.showToast("Attraction deleted successfully.", "success");
          if (attractionManageForm) attractionManageForm.reset();
        } catch (err) {
          TL.showToast(err.message || "Failed to delete attraction.", "error");
        } finally {
          P.setBusy(attractionDeleteBtn, false);
        }
      });
    }
  });
})();