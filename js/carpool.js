(() => {
  const $=id=>document.getElementById(id), KEY="autosetu_carpools";
  const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||"[]")}catch{return[]}}, write=v=>localStorage.setItem(KEY,JSON.stringify(v));
  $("cpDate").min = new Date().toISOString().slice(0,10);
  $("carpoolForm").addEventListener("submit",e=>{
    e.preventDefault();
    const trip={id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),from:$("cpFrom").value.trim(),to:$("cpTo").value.trim(),date:$("cpDate").value,time:$("cpTime").value,seats:Number($("cpSeats").value),cost:Number($("cpCost").value),notes:$("cpNotes").value.trim(),createdAt:new Date().toISOString()};
    const all=read();all.unshift(trip);write(all);$("cpMessage").classList.remove("hidden");$("cpMessage").textContent="Carpool published in this browser demo. It is not visible to other devices.";e.target.reset();$("cpDate").min=new Date().toISOString().slice(0,10);render();
  });
  $("filterFrom").addEventListener("input",render);$("filterTo").addEventListener("input",render);
  $("clearCarpools").addEventListener("click",()=>{$("filterFrom").value="";$("filterTo").value="";render();});
  function render(){
    const from=$("filterFrom").value.toLowerCase(),to=$("filterTo").value.toLowerCase();
    const trips=read().filter(t=>t.from.toLowerCase().includes(from)&&t.to.toLowerCase().includes(to));
    const list=$("carpoolList");list.innerHTML="";
    if(!trips.length){list.innerHTML='<div class="empty-state"><div class="empty-icon">⇄</div><strong>No matching carpools</strong><p>Post a trip or try another search.</p></div>';return;}
    trips.forEach(t=>{const card=document.createElement("article");card.className="request-card";card.innerHTML=`<div class="request-top"><span class="pill">${t.seats} seat(s) available</span><small>${esc(t.date)} · ${esc(t.time)}</small></div><div class="ride-route"><span class="route-dot"></span><div><small>FROM</small><strong>${esc(t.from)}</strong></div></div><div class="ride-route"><span class="route-diamond"></span><div><small>TO</small><strong>${esc(t.to)}</strong></div></div>${t.notes?`<p class="muted small">${esc(t.notes)}</p>`:""}<div class="request-bottom"><strong>₹${Number(t.cost).toLocaleString("en-IN")} / person</strong><button class="btn btn-outline btn-sm" data-id="${t.id}">Request seat</button></div>`;list.appendChild(card);});
    list.querySelectorAll("button").forEach(b=>b.onclick=()=>{const out=$("cpMessage");out.classList.remove("hidden");out.textContent="Seat interest saved locally. Contact/identity and seat confirmation are not yet connected in this demo.";});
  }
  function esc(s){return String(s||"").replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  render();
})();