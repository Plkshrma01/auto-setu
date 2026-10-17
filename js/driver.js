(() => {
  const A = window.AutoSetu || {read:k=>JSON.parse(localStorage.getItem(k)||"[]"),write:(k,v)=>localStorage.setItem(k,JSON.stringify(v)),KEYS:{rides:"autosetu_rides",reports:"autosetu_reports"}};
  const $ = id => document.getElementById(id);
  let online = localStorage.getItem("autosetu_online") === "true";
  function setOnline(value) {
    online = value; localStorage.setItem("autosetu_online", String(value));
    $("onlineToggle").checked = value; $("availabilityText").textContent = value ? "You're online" : "You're offline";
    $("availabilityHelp").textContent = value ? "You're available in this browser demo." : "Go online when you're ready to receive requests.";
    $("availabilityText").style.color = value ? "var(--teal)" : "var(--ink)";
    render();
  }
  $("onlineToggle").addEventListener("change", e => setOnline(e.target.checked));
  $("refreshRequests").addEventListener("click", render);
  function render() {
    const rides = A.read(A.KEYS.rides), target = $("driverRequests");
    const pending = rides.filter(r => ["Requested","Accepted","Driver arriving","In progress"].includes(r.status));
    $("todayRides").textContent = rides.filter(r => r.status === "Completed").length;
    target.innerHTML = "";
    if (!online) { target.innerHTML = '<div class="empty-state"><div class="empty-icon">◉</div><strong>You are offline</strong><p>Go online to review demo requests.</p></div>'; return; }
    if (!pending.length) { target.innerHTML = '<div class="empty-state"><div class="empty-icon">✓</div><strong>All caught up</strong><p>New demo requests will appear here when created on this browser.</p></div>'; return; }
    pending.forEach(r => {
      const card = document.createElement("article"); card.className = "request-card";
      card.innerHTML = `<div class="request-top"><span class="pill">${r.status}</span><small>${new Date(r.createdAt).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}</small></div><div class="ride-route"><span class="route-dot"></span><div><small>PICKUP</small><strong>${esc(r.pickup)}</strong></div></div><div class="ride-route"><span class="route-diamond"></span><div><small>DESTINATION</small><strong>${esc(r.destination)}</strong></div></div><div class="request-bottom"><strong>${esc(r.fare || "Fare to confirm")}</strong><span>${r.passengers || 1} passenger(s)</span></div><div class="form-row"><button class="btn btn-primary btn-sm" data-action="accept" data-id="${r.id}">${r.status === "Requested" ? "Accept ride" : "Open trip"}</button><button class="btn btn-outline btn-sm" data-action="reject" data-id="${r.id}">Reject</button></div>`;
      target.appendChild(card);
    });
    target.querySelectorAll("button").forEach(btn => btn.addEventListener("click", () => updateRide(btn.dataset.id, btn.dataset.action)));
    const active = rides.find(r => ["Accepted","Driver arriving","In progress"].includes(r.status));
    renderActive(active);
  }
  function updateRide(id, action) {
    const rides = A.read(A.KEYS.rides), r = rides.find(x => x.id === id); if (!r) return;
    if (action === "reject") r.status = "Rejected";
    else if (r.status === "Requested") r.status = "Accepted";
    A.write(A.KEYS.rides, rides); render();
  }
  function renderActive(r) {
    const box = $("driverActiveTrip"), actions = $("driverTripActions");
    if (!r) { box.classList.remove("hidden"); box.innerHTML = '<div class="empty-icon">↗</div><strong>No active trip yet</strong><p>Accept a request to see trip controls here.</p>'; actions.classList.add("hidden"); $("tripStatusPill").textContent = "No active trip"; return; }
    box.classList.remove("hidden"); box.innerHTML = `<div class="ride-route"><span class="route-dot"></span><div><small>PICKUP</small><strong>${esc(r.pickup)}</strong></div></div><div class="ride-route"><span class="route-diamond"></span><div><small>DESTINATION</small><strong>${esc(r.destination)}</strong></div></div><p class="muted small">Update status as your trip progresses.</p>`;
    actions.classList.remove("hidden"); actions.innerHTML = "";
    const steps = [{label:"Mark driver arriving",status:"Driver arriving"},{label:"Start trip",status:"In progress"},{label:"Complete trip",status:"Completed"}];
    steps.forEach(s => { const b=document.createElement("button"); b.className="btn "+(s.status==="Completed"?"btn-outline":"btn-primary")+" btn-wide"; b.textContent=s.label; b.disabled = (s.status==="Driver arriving" && r.status!=="Accepted") || (s.status==="In progress" && r.status!=="Driver arriving") || (s.status==="Completed" && r.status!=="In progress"); b.onclick=()=>{const rides=A.read(A.KEYS.rides);const found=rides.find(x=>x.id===r.id);if(found)found.status=s.status;A.write(A.KEYS.rides,rides);render();}; actions.appendChild(b); });
    $("tripStatusPill").textContent = r.status;
  }
  function esc(s){return String(s||"").replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  setOnline(online);
})();