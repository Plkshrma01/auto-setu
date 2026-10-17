(() => {
  const $=id=>document.getElementById(id);
  const read=k=>{try{return JSON.parse(localStorage.getItem(k)||"[]")}catch{return[]}};
  function render(){
    const rides=read("autosetu_rides"), cps=read("autosetu_carpools"), reports=read("autosetu_reports");
    $("adminRideCount").textContent=rides.length;$("adminCarpoolCount").textContent=cps.length;$("adminActiveCount").textContent=rides.filter(r=>!["Completed","Cancelled","Rejected"].includes(r.status)).length;$("adminReportCount").textContent=reports.length;
    const box=$("adminRides");box.innerHTML="";
    if(!rides.length)box.innerHTML='<div class="empty-state"><strong>No ride activity yet</strong><p>Create a demo ride from the passenger page.</p></div>';
    rides.forEach(r=>{const el=document.createElement("div");el.className="table-row";el.innerHTML=`<div><strong>${esc(r.pickup)} → ${esc(r.destination)}</strong><small>${new Date(r.createdAt).toLocaleString()}</small></div><span class="pill">${esc(r.status)}</span>`;box.appendChild(el);});
    const rb=$("adminReports");rb.innerHTML=reports.length?reports.map(r=>`<div class="table-row"><div><strong>${esc(r.subject||"Report")}</strong><small>${esc(r.description||"No details")}</small></div><span class="pill">${esc(r.status||"New")}</span></div>`).join(""):'<div class="empty-state"><strong>No reports</strong><p>Safety report submission will be added in a later milestone.</p></div>';
  }
  $("refreshAdmin").addEventListener("click",render);
  $("exportData").addEventListener("click",()=>{const data={rides:read("autosetu_rides"),carpools:read("autosetu_carpools"),reports:read("autosetu_reports"),exportedAt:new Date().toISOString()};const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="autosetu-demo-export.json";a.click();URL.revokeObjectURL(url);});
  function esc(s){return String(s||"").replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  render();
})();