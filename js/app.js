(() => {
  const $ = (id) => document.getElementById(id);
  const KEYS = { rides: "autosetu_rides", carpools: "autosetu_carpools", reports: "autosetu_reports" };
  const read = (key) => { try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; } };
  const write = (key, data) => localStorage.setItem(key, JSON.stringify(data));
  const cfg = window.AUTOSETU_CONFIG || {};
  let supabase = null;
  if (cfg.supabaseUrl && cfg.supabaseAnonKey && window.supabase?.createClient) {
    try { supabase = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey); } catch (e) { console.warn(e); }
  }
  window.AutoSetu = { $, KEYS, read, write, supabase };
  const fmt = (d) => new Date(d).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  const modal = $("authModal");
  const openModal = () => modal?.classList.remove("hidden");
  const closeModal = () => modal?.classList.add("hidden");
  $("signInBtn")?.addEventListener("click", openModal);
  $("closeModal")?.addEventListener("click", closeModal);
  modal?.addEventListener("click", e => { if (e.target === modal) closeModal(); });
  async function auth(mode) {
    const email = $("authEmail").value.trim(), password = $("authPassword").value;
    const out = $("authMessage"); out.classList.remove("hidden");
    if (!supabase) { out.textContent = "Demo mode: configure supabaseUrl and supabaseAnonKey in js/config.js to enable real email authentication."; return; }
    try {
      const result = mode === "signup" ? await supabase.auth.signUp({ email, password }) : await supabase.auth.signInWithPassword({ email, password });
      if (result.error) throw result.error;
      out.textContent = mode === "signup" ? "Account created. Check your email if confirmation is enabled." : "Signed in successfully.";
      $("authStatus").textContent = email;
      if (mode === "signin") setTimeout(closeModal, 900);
    } catch (err) { out.textContent = err.message || "Authentication failed."; }
  }
  $("authForm")?.addEventListener("submit", e => { e.preventDefault(); auth("signin"); });
  $("signUpBtn")?.addEventListener("click", () => auth("signup"));
  if (supabase) supabase.auth.getUser().then(({data}) => { if (data?.user) $("authStatus").textContent = data.user.email || "Signed in"; });
  $("rideType")?.addEventListener("change", updateFare);
  $("passengers")?.addEventListener("change", updateFare);
  function updateFare() {
    const shared = $("rideType").value === "shared", count = Number($("passengers").value);
    $("fareEstimate").textContent = shared ? `₹ ${Math.max(20, 45 * count)}–${Math.max(30, 65 * count)}` : "₹ 80–120";
  }
  const rideForm = $("rideForm");
  if (rideForm) rideForm.addEventListener("submit", async e => {
    e.preventDefault();
    const ride = { id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), pickup: $("pickup").value.trim(), destination: $("destination").value.trim(), rideType: $("rideType").value, passengers: Number($("passengers").value), fare: $("fareEstimate").textContent, status: "Requested", createdAt: new Date().toISOString() };
    const rides = read(KEYS.rides); rides.unshift(ride); write(KEYS.rides, rides);
    const out = $("rideMessage"); out.classList.remove("hidden"); out.textContent = "Ride request saved in this browser demo. Open Driver Centre in this same browser to accept it. No real driver has been notified.";
    renderActiveRide(ride);
    if (supabase) {
      try {
        const { error } = await supabase.from("rides").insert({ pickup_text: ride.pickup, destination_text: ride.destination, ride_type: ride.rideType, passenger_count: ride.passengers, estimated_fare_text: ride.fare, status: "requested" });
        if (error) { out.textContent += " Cloud sync unavailable: " + error.message; }
        else out.textContent = "Ride request sent to the AutoSetu database. A driver still needs to accept it.";
      } catch (err) { out.textContent += " Cloud sync unavailable."; }
    }
  });
  function renderActiveRide(ride) {
    const el = $("activeRide"); if (!el) return;
    el.classList.remove("hidden");
    el.innerHTML = `<div class="ride-route"><span class="route-dot"></span><div><small>FROM</small><strong>${escapeHtml(ride.pickup)}</strong></div></div><div class="ride-route"><span class="route-diamond"></span><div><small>TO</small><strong>${escapeHtml(ride.destination)}</strong></div></div><div class="ride-footer"><span class="pill">${escapeHtml(ride.status)}</span><button class="btn btn-quiet btn-sm" id="cancelRide">Cancel request</button></div>`;
    $("cancelRide")?.addEventListener("click", () => { const list = read(KEYS.rides); const r = list.find(x => x.id === ride.id); if (r) r.status = "Cancelled"; write(KEYS.rides, list); renderActiveRide(r || {...ride,status:"Cancelled"}); });
  }
  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  if ($("map") && window.L) {
    const map = L.map("map").setView([30.901, 75.8573], 12);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
    L.circleMarker([30.901,75.8573], {radius:8,color:"#0f766e",fillColor:"#14b8a6",fillOpacity:.9}).addTo(map).bindPopup("AutoSetu demo centre · Ludhiana");
    let userMarker;
    $("locateBtn")?.addEventListener("click", () => {
      if (!navigator.geolocation) { alert("Geolocation is not supported by this browser."); return; }
      navigator.geolocation.getCurrentPosition(pos => {
        const p = [pos.coords.latitude, pos.coords.longitude]; map.setView(p, 15);
        if (userMarker) userMarker.remove();
        userMarker = L.marker(p).addTo(map).bindPopup("Your current location").openPopup();
      }, () => alert("Could not access location. Check browser permission and try again."), {enableHighAccuracy:true, timeout:10000});
    });
  }
})();