(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    const P = TL.Pages;

    // UI Elements
    const citiesListEl = document.getElementById("citiesList");
    const attractionsListEl = document.getElementById("attractionsList");

    const cityCreateForm = document.getElementById("cityCreateForm");
    const cityManageForm = document.getElementById("cityManageForm");
    const cityDeleteBtn = document.getElementById("cityDeleteBtn");

    const attractionCreateForm = document.getElementById("attractionCreateForm");
    const attractionManageForm = document.getElementById("attractionManageForm");
    const attractionDeleteBtn = document.getElementById("attractionDeleteBtn");

    // Extract Form Fields Helper
    function extractFormFields(form, prefix) {
      const data = {};
      form.querySelectorAll("[name]").forEach(el => {
        // Handle names that don't have a prefix (we removed prefixes in html for standard names)
        const key = el.name;
        if (!key || key === "id") return; // exclude ID from payload
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

    // Submit Helper
    async function submitAction(form, actionFn, successMsg, closeModalId, reloadFn) {
      P.clearErrors(form);
      const btn = form.querySelector("button[type=submit]");
      P.setBusy(btn, true);

      try {
        await actionFn();
        TL.showToast(successMsg, "success");
        form.reset();
        
        if (closeModalId) {
          const modalEl = document.getElementById(closeModalId);
          if (modalEl) bootstrap.Modal.getInstance(modalEl)?.hide();
        }

        if (reloadFn) await reloadFn();
      } catch (err) {
        if (err instanceof TL.Api.ApiValidationError) {
          P.showValidation(form, err.errors);
        }
        TL.showToast(err.message || "Request failed.", "error");
      } finally {
        P.setBusy(btn, false);
      }
    }

    // =========================================================================
    // CITIES
    // =========================================================================

    async function loadCities() {
      if (!citiesListEl) return;
      try {
        const response = await TL.Cities.getCities();
        const cities = response.data || response;
        renderCities(cities);
      } catch (err) {
        citiesListEl.innerHTML = P.empty("Failed to load cities", err.message, "bi-exclamation-triangle text-danger");
      }
    }

    function renderCities(cities) {
      if (!Array.isArray(cities) || cities.length === 0) {
        citiesListEl.innerHTML = P.empty("No cities found", "Add a city using the form below.");
        return;
      }

      let html = `<div class="table-responsive"><table class="table tl-table align-middle">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Country ID</th>
            <th class="text-end">Actions</th>
          </tr>
        </thead>
        <tbody>`;

      cities.forEach(city => {
        html += `
          <tr>
            <td><span class="tl-label">#${city.id}</span></td>
            <td class="fw-bold">${P.escape(city.name)}</td>
            <td>${P.escape(city.country_id)}</td>
            <td class="text-end">
              <button type="button" class="tl-btn tl-btn--outline tl-btn--sm city-edit-btn" 
                data-id="${city.id}" 
                data-name="${P.escape(city.name)}"
                data-country="${city.country_id}"
                data-desc="${P.escape(city.description || '')}">
                <i class="bi bi-pencil"></i> Edit
              </button>
            </td>
          </tr>`;
      });

      html += `</tbody></table></div>`;
      citiesListEl.innerHTML = html;
      bindCityActions();
    }

    function bindCityActions() {
      document.querySelectorAll(".city-edit-btn").forEach(btn => {
        btn.addEventListener("click", function () {
          const id = this.dataset.id;
          const name = this.dataset.name;
          const country = this.dataset.country;
          const desc = this.dataset.desc;

          if (cityManageForm) {
            P.clearErrors(cityManageForm);
            cityManageForm.reset();
            document.getElementById("city_update_id").value = id;
            document.getElementById("city_update_name").value = name;
            document.getElementById("city_update_country_id").value = country;
            document.getElementById("city_update_description").value = desc;
          }

          const modalEl = document.getElementById("cityEditModal");
          if (modalEl) bootstrap.Modal.getOrCreateInstance(modalEl).show();
        });
      });
    }

    // Create City
    if (cityCreateForm) {
      cityCreateForm.addEventListener("submit", e => {
        e.preventDefault();
        const payload = extractFormFields(cityCreateForm);
        submitAction(
          cityCreateForm,
          () => TL.Cities.createCity(payload),
          "City created successfully.",
          null,
          loadCities
        );
      });
    }

    // Update City
    if (cityManageForm) {
      cityManageForm.addEventListener("submit", e => {
        e.preventDefault();
        const id = document.getElementById("city_update_id").value;
        const payload = extractFormFields(cityManageForm);
        submitAction(
          cityManageForm,
          () => TL.Cities.updateCity(id, payload),
          "City updated successfully.",
          "cityEditModal",
          loadCities
        );
      });
    }

    // Delete City
    if (cityDeleteBtn) {
      cityDeleteBtn.addEventListener("click", async () => {
        const id = document.getElementById("city_update_id").value;
        if (!P.confirm(`Delete City #${id}? This cannot be undone.`)) return;

        P.setBusy(cityDeleteBtn, true);
        try {
          await TL.Cities.deleteCity(id);
          TL.showToast("City deleted successfully.", "success");
          const modalEl = document.getElementById("cityEditModal");
          if (modalEl) bootstrap.Modal.getInstance(modalEl)?.hide();
          loadCities();
        } catch (err) {
          TL.showToast(err.message || "Failed to delete city.", "error");
        } finally {
          P.setBusy(cityDeleteBtn, false);
        }
      });
    }

    // =========================================================================
    // ATTRACTIONS
    // =========================================================================

    async function loadAttractions() {
      if (!attractionsListEl) return;
      try {
        const response = await TL.Attractions.getAttractions();
        const attractions = response.data || response;
        renderAttractions(attractions);
      } catch (err) {
        attractionsListEl.innerHTML = P.empty("Failed to load attractions", err.message, "bi-exclamation-triangle text-danger");
      }
    }

    function renderAttractions(attractions) {
      if (!Array.isArray(attractions) || attractions.length === 0) {
        attractionsListEl.innerHTML = P.empty("No attractions found", "Add an attraction using the form below.");
        return;
      }

      let html = `<div class="table-responsive"><table class="table tl-table align-middle">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>City ID</th>
            <th>Price</th>
            <th class="text-end">Actions</th>
          </tr>
        </thead>
        <tbody>`;

      attractions.forEach(att => {
        html += `
          <tr>
            <td><span class="tl-label">#${att.id}</span></td>
            <td class="fw-bold">${P.escape(att.name)}</td>
            <td>${P.escape(att.city_id)}</td>
            <td>${att.price ? '$' + parseFloat(att.price).toFixed(2) : '-'}</td>
            <td class="text-end">
              <button type="button" class="tl-btn tl-btn--outline tl-btn--sm att-edit-btn" 
                data-id="${att.id}" 
                data-name="${P.escape(att.name)}"
                data-city="${att.city_id}"
                data-price="${att.price || ''}"
                data-lat="${att.latitude || ''}"
                data-lng="${att.longitude || ''}"
                data-desc="${P.escape(att.description || '')}"
                data-cat="${P.escape(att.categories ? att.categories.map(c => c.id || c).join(', ') : '')}">
                <i class="bi bi-pencil"></i> Edit
              </button>
            </td>
          </tr>`;
      });

      html += `</tbody></table></div>`;
      attractionsListEl.innerHTML = html;
      bindAttractionActions();
    }

    function bindAttractionActions() {
      document.querySelectorAll(".att-edit-btn").forEach(btn => {
        btn.addEventListener("click", function () {
          const ds = this.dataset;

          if (attractionManageForm) {
            P.clearErrors(attractionManageForm);
            attractionManageForm.reset();
            document.getElementById("att_update_id").value = ds.id;
            document.getElementById("att_update_name").value = ds.name;
            document.getElementById("att_update_city_id").value = ds.city;
            document.getElementById("att_update_price").value = ds.price;
            document.getElementById("att_update_latitude").value = ds.lat;
            document.getElementById("att_update_longitude").value = ds.lng;
            document.getElementById("att_update_description").value = ds.desc;
            document.getElementById("att_update_categories").value = ds.cat;
          }

          const modalEl = document.getElementById("attractionEditModal");
          if (modalEl) bootstrap.Modal.getOrCreateInstance(modalEl).show();
        });
      });
    }

    // Create Attraction
    if (attractionCreateForm) {
      attractionCreateForm.addEventListener("submit", e => {
        e.preventDefault();
        const payload = extractFormFields(attractionCreateForm);
        submitAction(
          attractionCreateForm,
          () => TL.Attractions.createAttraction(payload),
          "Attraction created successfully.",
          null,
          loadAttractions
        );
      });
    }

    // Update Attraction
    if (attractionManageForm) {
      attractionManageForm.addEventListener("submit", e => {
        e.preventDefault();
        const id = document.getElementById("att_update_id").value;
        const payload = extractFormFields(attractionManageForm);
        submitAction(
          attractionManageForm,
          () => TL.Attractions.updateAttraction(id, payload),
          "Attraction updated successfully.",
          "attractionEditModal",
          loadAttractions
        );
      });
    }

    // Delete Attraction
    if (attractionDeleteBtn) {
      attractionDeleteBtn.addEventListener("click", async () => {
        const id = document.getElementById("att_update_id").value;
        if (!P.confirm(`Delete Attraction #${id}? This cannot be undone.`)) return;

        P.setBusy(attractionDeleteBtn, true);
        try {
          await TL.Attractions.deleteAttraction(id);
          TL.showToast("Attraction deleted successfully.", "success");
          const modalEl = document.getElementById("attractionEditModal");
          if (modalEl) bootstrap.Modal.getInstance(modalEl)?.hide();
          loadAttractions();
        } catch (err) {
          TL.showToast(err.message || "Failed to delete attraction.", "error");
        } finally {
          P.setBusy(attractionDeleteBtn, false);
        }
      });
    }

    // INIT
    loadCities();
    loadAttractions();
  });
})();