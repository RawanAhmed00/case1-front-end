(function(){
"use strict";
document.addEventListener("DOMContentLoaded",function(){
 const P=TL.Pages,state=document.getElementById("tripsState");
 let currentTripsList = [];
 async function load(){
  state.innerHTML='<div class="tl-inline-loader"><div class="tl-spinner"></div></div>';
  try{
   const [listRes,statsRes]=await Promise.all([TL.Trips.getTrips(),TL.Trips.getTripStatistics()]);
   const d=P.data(statsRes)||{};
   // Populate User dropdown for create/edit forms
   (async function populateUsers(){
    try{
      const usersRes = await TL.Users.getUsers({ per_page: 1000 });
      const users = P.list(usersRes) || P.data(usersRes) || [];
      const userSelect = document.getElementById("trip_user_id");
      if(userSelect){
        const opts = ["<option value=''>Select user</option>"];
        users.forEach(u=>{
          const id = u && (u.id !== undefined?String(u.id):"");
          const label = u && (u.name || u.email) ? `${P.escape(u.name || `User #${id}`)}${u.email? ' — ' + P.escape(u.email) : ''}` : `User #${id}`;
          opts.push(`<option value="${id}">${label}</option>`);
        });
        userSelect.innerHTML = opts.join("");
      }
    }catch(e){console.warn("Failed to load users for trip form:", e && e.message?e.message:e);} 
   })();
   document.getElementById("tripTotal").textContent=P.display(d.total_trips);
   document.getElementById("tripToday").textContent=P.display(d.trips_created_today);
   document.getElementById("tripMonth").textContent=P.display(d.trips_this_month);
  const rows=P.list(listRes);
  const raw=P.parse(listRes);
   const meta=raw&&typeof raw==="object"?raw.meta:null;
  document.getElementById("tripMeta").textContent=meta?`${P.display(meta.current_page)} / ${P.display(meta.last_page)}`:"Data unavailable";
  // cache rows for edit handler
  currentTripsList = rows || [];
   if(!rows){state.innerHTML=P.empty("Trip data unavailable","The runtime response did not expose the documented trip array.","bi-map");return;}
   if(!rows.length){state.innerHTML=P.empty("No trips available","The API returned an empty trip collection.","bi-map");return;}
    state.innerHTML=`<div class="tl-table-wrap"><table class="tl-table"><thead><tr><th>ID</th><th>User</th><th>Destination</th><th>Style</th><th>Days</th><th>Budget</th><th>Travelers</th><th>Created</th><th>Actions</th></tr></thead><tbody>${rows.map(t=>`<tr><td>${P.escape(P.display(t.id))}</td><td>${P.escape(P.display(t.user?.name))}</td><td>${P.escape(P.display(t.dis_country))}</td><td>${P.escape(P.display(t.travel_style))}</td><td>${P.escape(P.display(t.num_days))}</td><td>${P.escape(P.display(t.budget))}</td><td>${P.escape(P.display(t.number_of_travelers))}</td><td>${P.escape(P.date(t.created_at))}</td><td><div class="tl-table-actions"><button class="tl-btn tl-btn--outline tl-btn--sm" data-trip-edit="${P.escape(t.id)}"><i class="bi bi-pencil"></i></button><button class="tl-btn tl-btn--danger tl-btn--sm" data-trip-delete="${P.escape(t.id)}"><i class="bi bi-trash"></i></button></div></td></tr>`).join("")}</tbody></table></div><div class="tl-pagination"><span class="tl-metadata">Pagination metadata is documented. Request parameter names are not documented, so no guessed page controls are sent.</span></div>`;
  }catch(e){state.innerHTML=P.error(e.message);["tripTotal","tripToday","tripMonth","tripMeta"].forEach(id=>document.getElementById(id).textContent="Data unavailable");}
 }
 document.getElementById("tripsRefresh").addEventListener("click",load);
 state.addEventListener("click",async e=>{
  const edit=e.target.closest("[data-trip-edit]"),del=e.target.closest("[data-trip-delete]");
  if(edit){
    try{
      const t = currentTripsList.find(x=>String(x.id)===String(edit.dataset.tripEdit));
      if(!t){ TL.showToast("Trip details unavailable in the current list response.","warning"); return; }
      document.getElementById("trip_id").value=t.id;
      document.getElementById("trip_num_days").value=t.num_days??"";
      document.getElementById("trip_travel_style").value=t.travel_style??"";
      document.getElementById("trip_dis_country").value=t.dis_country??"";
      document.getElementById("trip_budget").value=t.budget??"";
      document.getElementById("trip_interst").value=t.interst??t.interests??"";
      document.getElementById("trip_number_of_travelers").value=t.number_of_travelers??"";
      document.getElementById("trip_user_id").value=t.user?.id??t.user_id??"";
      P.modal("tripEditModal")?.show();
    }catch(err){ TL.showToast(err.message,"error"); }
  }

  if(del && P.confirm("Delete this trip? This cannot be undone.")){
    try{ await TL.Trips.deleteTrip(del.dataset.tripDelete); TL.showToast("Trip deleted.","success"); load(); }catch(err){ TL.showToast(err.message,"error"); }
  }
 });
 document.getElementById("tripEditForm").addEventListener("submit",async e=>{e.preventDefault();const f=e.currentTarget;P.clearErrors(f);const id=document.getElementById("trip_id").value;const data={num_days:f.trip_num_days.value,travel_style:f.trip_travel_style.value,dis_country:f.trip_dis_country.value,budget:f.trip_budget.value,interst:f.trip_interst.value,number_of_travelers:f.trip_number_of_travelers.value,user_id:f.trip_user_id.value};const btn=f.querySelector("button[type=submit]");P.setBusy(btn,true);try{await TL.Trips.updateTrip(id,data);TL.showToast("Trip updated.","success");P.modal("tripEditModal")?.hide();load();}catch(err){if(err instanceof TL.Api.ApiValidationError)P.showValidation(f,err.errors);TL.showToast(err.message,"error");}finally{P.setBusy(btn,false);}});
 load();
});
})();