(function () {
    "use strict";

    function toFormData(fields) {
        if (fields instanceof FormData) return fields;

        const fd = new FormData();

        Object.entries(fields || {}).forEach(([key, value]) => {
            if (value === undefined || value === null) {
                return;
            }

            // Handle social media links array
            if (key === "social_media_links" && Array.isArray(value)) {
                value.forEach((social, index) => {
                    if (social.type) {
                        fd.append(
                            `social_media_links[${index}][type]`,
                            social.type
                        );
                    }
                    if (social.link) {
                        fd.append(
                            `social_media_links[${index}][link]`,
                            social.link
                        );
                    }
                });
                return;
            }

            fd.append(key, value);
        });

        return fd;
    }

    function getWebsiteSettings() {
        return window.TL.Api.get("/website-settings");
    }

    function getWebsiteSettingById(id) {
        return window.TL.Api.get(`/website-settings/${encodeURIComponent(id)}`);
    }

    function createWebsiteSettings(fields) {
        return window.TL.Api.postForm(
            "/website-settings",
            toFormData(fields)
        );
    }

    function updateWebsiteSettings(websiteSettingId, fields) {
        const fd = toFormData(fields);
        if (!fd.has("_method")) {
            fd.append("_method", "PUT");
        }
        return window.TL.Api.postForm(
            `/website-settings/${encodeURIComponent(websiteSettingId)}`,
            fd
        );
    }

    function deleteWebsiteSettings(websiteSettingId) {
        return window.TL.Api.delete(
            `/website-settings/${encodeURIComponent(websiteSettingId)}`
        );
    }

    window.TL = window.TL || {};

    window.TL.Settings = {
        getWebsiteSettings,
        getWebsiteSettingById,
        createWebsiteSettings,
        updateWebsiteSettings,
        deleteWebsiteSettings
    };

})();