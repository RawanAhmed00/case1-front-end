(function(){
"use strict";
document.addEventListener("DOMContentLoaded",function(){
 const P=TL.Pages;
 function fdFrom(form,prefix){
  const fd={}; form.querySelectorAll("[name]").forEach(el=>{if(el.type==="file"){if(el.files[0])fd[el.name.replace(prefix+"_","")]=el.files[0];}else if(el.value!=="")fd[el.name.replace(prefix+"_","")]=el.value;});return fd;
 }
 async function submitForm(form,fn,success,closeModalId){
  P.clearErrors(form);const btn=form.querySelector("button[type=submit]");P.setBusy(btn,true);
  try{await fn();TL.showToast(success,"success");form.reset();if(closeModalId){const m=document.getElementById(closeModalId);if(m)bootstrap.Modal.getInstance(m)?.hide();}}catch(e){if(e instanceof TL.Api.ApiValidationError)P.showValidation(form,e.errors);TL.showToast(e.message,"error");}finally{P.setBusy(btn,false);}
 }
 document.getElementById("cityCreateForm").addEventListener("submit",e=>{e.preventDefault();submitForm(e.currentTarget,()=>TL.Cities.createCity(fdFrom(e.currentTarget,"city")),"City created successfully.","cityCreateModal");});
 document.getElementById("cityManageForm").addEventListener("submit",e=>{e.preventDefault();const f=e.currentTarget;const id=f.city_id.value;submitForm(f,()=>TL.Cities.updateCity(id,fdFrom(f,"city_update")),"City updated successfully.");});
 document.getElementById("cityDeleteBtn").addEventListener("click",async()=>{const id=document.getElementById("city_id").value;if(!id)return TL.showToast("Enter a city ID.","warning");if(!P.confirm("Delete this city? This cannot be undone."))return;try{await TL.Cities.deleteCity(id);TL.showToast("City deleted.","success");document.getElementById("cityManageForm").reset();}catch(e){TL.showToast(e.message,"error");}});
 document.getElementById("attractionCreateForm").addEventListener("submit",e=>{e.preventDefault();submitForm(e.currentTarget,()=>TL.Attractions.createAttraction(fdFrom(e.currentTarget,"att")),"Attraction created successfully.","attractionCreateModal");});
 document.getElementById("attractionManageForm").addEventListener("submit",e=>{e.preventDefault();const f=e.currentTarget;const id=f.att_id.value;submitForm(f,()=>TL.Attractions.updateAttraction(id,fdFrom(f,"att_update")),"Attraction updated successfully.");});
 document.getElementById("attractionDeleteBtn").addEventListener("click",async()=>{const id=document.getElementById("att_id").value;if(!id)return TL.showToast("Enter an attraction ID.","warning");if(!P.confirm("Delete this attraction? This cannot be undone."))return;try{await TL.Attractions.deleteAttraction(id);TL.showToast("Attraction deleted.","success");document.getElementById("attractionManageForm").reset();}catch(e){TL.showToast(e.message,"error");}});
});
})();