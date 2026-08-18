(function(){
"use strict";
document.addEventListener("DOMContentLoaded",function(){
 const P=TL.Pages,KEY="tailora_website_settings_id";
 const form=document.getElementById("settingsForm"),idDisplay=document.getElementById("settingsIdDisplay"),response=document.getElementById("settingsResponse");
 function getId(){try{return localStorage.getItem(KEY);}catch(_){return null;}}
 function setId(id){try{if(id)localStorage.setItem(KEY,String(id));}catch(_){}}
 function clearId(){try{localStorage.removeItem(KEY);}catch(_){}}
 function sync(){const id=getId();idDisplay.textContent=id?`Settings ID: ${id}`:"No settings ID in this browser session";document.getElementById("settingsUpdateBtn").disabled=!id;document.getElementById("settingsDeleteBtn").disabled=!id;}
function files() {

    const d = {
        site_name: form.site_name.value,
        email: form.email.value,
        phone: form.phone.value,
        address: form.address.value
    };

    // Collect social media links
    const socialRows = document.querySelectorAll(
        ".social-media-row"
    );

    const socialMediaLinks = [];

    socialRows.forEach(row => {

        const type = row.querySelector(
            ".social-media-type"
        ).value;

        const link = row.querySelector(
            ".social-media-link"
        ).value;

        if (type && link) {
            socialMediaLinks.push({
                type: type,
                link: link
            });
        }
    });

    if (socialMediaLinks.length > 0) {
        d.social_media_links = socialMediaLinks;
    }

    // Files
    if (form.logo.files[0]) {
        d.logo = form.logo.files[0];
    }

    if (form.homepage_banner.files[0]) {
        d.homepage_banner = form.homepage_banner.files[0];
    }

    return d;
} function capture(r){
    const d = P.data(r);
    if (d && d.id) {
        setId(d.id);
        // Only show the captured ID badge — do not render the full JSON response
        response.innerHTML = `<div class="tl-badge tl-badge--success mb-3">ID ${P.escape(d.id)} captured</div>`;
    } else {
        response.innerHTML = P.empty(
            "No settings ID returned",
            "The operation completed without a documented id in the response.",
            "bi-gear"
        );
    }
    sync();
}
 function preview(input,img){input.addEventListener("change",()=>{const f=input.files[0];if(!f){img.style.display="none";return;}const url=URL.createObjectURL(f);img.src=url;img.style.display="block";});}
 preview(form.logo,document.getElementById("logoPreview"));preview(form.homepage_banner,document.getElementById("bannerPreview"));
 const socialContainer = document.getElementById(
    "socialMediaLinksContainer"
);

const addSocialBtn = document.getElementById(
    "addSocialMediaBtn"
);

function updateSocialIndexes() {

    const rows = socialContainer.querySelectorAll(
        ".social-media-row"
    );

    rows.forEach((row, index) => {

        row.querySelector(".social-media-type").name =
            `social_media_links[${index}][type]`;

        row.querySelector(".social-media-link").name =
            `social_media_links[${index}][link]`;

    });
}


addSocialBtn.addEventListener("click", function () {

    const row = document.createElement("div");

    row.className =
        "social-media-row tl-flex tl-gap-sm mb-2";

    row.innerHTML = `
        <select
            class="tl-input social-media-type"
            required
        >
            <option value="">Select platform</option>
            <option value="facebook">Facebook</option>
            <option value="instagram">Instagram</option>
            <option value="twitter">Twitter</option>
            <option value="linkedin">LinkedIn</option>
            <option value="youtube">YouTube</option>
        </select>

        <input
            type="url"
            class="tl-input social-media-link"
            placeholder="https://..."
            required
        >

        <button
            type="button"
            class="tl-btn tl-btn--danger remove-social-btn"
        >
            Remove
        </button>
    `;

    socialContainer.appendChild(row);

    updateSocialIndexes();
});


socialContainer.addEventListener("click", function (event) {

    const btn = event.target.closest(".remove-social-btn");

    if (btn) {

        const rows =
            socialContainer.querySelectorAll(
                ".social-media-row"
            );

        // Don't remove the last row
        if (rows.length > 1) {
            btn.closest(
                ".social-media-row"
            ).remove();

            updateSocialIndexes();
        }
    }

});
 form.addEventListener("submit",async e=>{e.preventDefault();P.clearErrors(form);const b=document.getElementById("settingsCreateBtn");P.setBusy(b,true);try{const r=await TL.Settings.createWebsiteSettings(files());capture(r);TL.showToast("Website settings created.","success");}catch(err){if(err instanceof TL.Api.ApiValidationError)P.showValidation(form,err.errors);TL.showToast(err.message,"error");}finally{P.setBusy(b,false);}});
 document.getElementById("settingsUpdateBtn").addEventListener("click",async()=>{const id=getId();if(!id)return TL.showToast("Create the settings resource first; no GET endpoint exists to discover an ID.","warning");P.clearErrors(form);const b=document.getElementById("settingsUpdateBtn");P.setBusy(b,true);try{const r=await TL.Settings.updateWebsiteSettings(id,files());capture(r);TL.showToast("Website settings updated.","success");}catch(err){if(err instanceof TL.Api.ApiValidationError)P.showValidation(form,err.errors);TL.showToast(err.message,"error");}finally{P.setBusy(b,false);}});
 document.getElementById("settingsDeleteBtn").addEventListener("click",async()=>{const id=getId();if(!id)return TL.showToast("No settings ID is stored.","warning");if(!P.confirm("Delete the current website settings resource? This cannot be undone."))return;try{await TL.Settings.deleteWebsiteSettings(id);clearId();response.innerHTML=P.empty("Settings deleted","No settings resource ID is stored now.","bi-trash");sync();form.reset();}catch(err){TL.showToast(err.message,"error");}});
 sync();
});
})();