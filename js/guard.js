/* Role guard for protected pages. Requires Supabase auth + profiles role. */
(async () => {
  const cfg=window.AUTOSETU_CONFIG||{};
  const client=window.supabase&&cfg.supabaseUrl&&cfg.supabaseAnonKey?window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey):null;
  const page=location.pathname.split("/").pop()||"index.html";
  const allowed=page==="driver.html"?"driver":"passenger";
  if(!client) { location.replace("login.html"); return; }
  try {
    const {data:{session}}=await client.auth.getSession();
    if(!session){location.replace("login.html");return;}
    const {data:profile,error}=await client.from("profiles").select("role,full_name").eq("id",session.user.id).single();
    if(error||!profile){await client.auth.signOut();location.replace("login.html");return;}
    if(profile.role!==allowed){location.replace(profile.role==="driver"?"driver.html":"index.html");return;}
    window.AUTOSETU_SESSION={client,user:session.user,profile};
    document.documentElement.classList.add("auth-ready");
    document.dispatchEvent(new CustomEvent("autosetu:ready",{detail:window.AUTOSETU_SESSION}));
    const nav=document.querySelector(".top-actions");
    if(nav){nav.innerHTML=`<span class="muted small">${String(profile.full_name||session.user.email||"Account").replace(/[<>&"]/g,"")}</span><button class="btn btn-quiet" id="logoutBtn">Log out</button>`;document.getElementById("logoutBtn").onclick=async()=>{await client.auth.signOut();location.href="login.html";};}
  } catch { location.replace("login.html"); }
})();
