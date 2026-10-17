(() => {
  const $ = id => document.getElementById(id);
  let mode = "login";
  const cfg = window.AUTOSETU_CONFIG || {};
  const client = window.supabase && cfg.supabaseUrl && cfg.supabaseAnonKey
    ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey) : null;
  const notice = (msg, bad=false) => { const n=$("authNotice"); n.textContent=msg; n.classList.remove("hidden"); n.style.borderColor=bad?"#dc7777":""; };
  const role = () => document.querySelector('input[name="role"]:checked').value;
  function syncMode(next) {
    mode=next; $("tabLogin").classList.toggle("active",mode==="login"); $("tabSignup").classList.toggle("active",mode==="signup");
    $("nameWrap").hidden=mode!=="signup"; $("fullName").required=mode==="signup";
    $("formTitle").textContent=mode==="login"?"Welcome back":"Create your AutoSetu account";
    $("submitBtn").textContent=(mode==="login"?"Sign in as ":"Create ")+(role()==="driver"?"driver":"passenger")+(mode==="login"?" →":" account →");
    $("authNotice").classList.add("hidden");
  }
  $("tabLogin").onclick=()=>syncMode("login"); $("tabSignup").onclick=()=>syncMode("signup");
  document.querySelectorAll('input[name="role"]').forEach(x=>x.addEventListener("change",()=>syncMode(mode)));
  function go(r){ location.href = r==="driver" ? "driver.html" : "index.html"; }
  async function readRole(user) {
    let {data,error}=await client.from("profiles").select("role,full_name").eq("id",user.id).maybeSingle();
    if(error) throw error;
    if(!data) {
      const metadataRole=user.user_metadata?.role;
      if(!["passenger","driver"].includes(metadataRole)) throw new Error("Your account profile is missing. Please create the account again or run the AutoSetu role setup SQL.");
      const {data:created,error:insertError}=await client.from("profiles").insert({id:user.id,role:metadataRole,full_name:user.user_metadata?.full_name||""}).select("role").single();
      if(insertError) throw insertError;
      data=created;
    }
    return data.role;
  }
  $("accountForm").addEventListener("submit",async e=>{
    e.preventDefault(); $("submitBtn").disabled=true; $("submitBtn").textContent="Please wait…";
    try {
      if(!client) throw new Error("Supabase is not configured. Check js/config.js and reload the page.");
      const email=$("email").value.trim(), password=$("password").value, selected=role();
      if(mode==="signup") {
        const {data,error}=await client.auth.signUp({email,password,options:{data:{role:selected,full_name:$("fullName").value.trim()},emailRedirectTo:location.origin+location.pathname.replace(/login\.html$/,"index.html")}});
        if(error) throw error;
        if(!data.session) { notice("Account created. Check your email to confirm it, then return here and sign in as "+selected+"."); return; }
        const {error:profileError}=await client.from("profiles").upsert({id:data.user.id,role:selected,full_name:$("fullName").value.trim()},{onConflict:"id"});
        if(profileError) throw profileError;
        if(selected==="driver") { const {error:driverError}=await client.from("drivers").upsert({user_id:data.user.id,verification_status:"pending"},{onConflict:"user_id"}); if(driverError) throw driverError; }
        notice("Account created. Opening your "+selected+" workspace…"); go(selected);
      } else {
        const {data,error}=await client.auth.signInWithPassword({email,password}); if(error) throw error;
        const savedRole=await readRole(data.user);
        if(savedRole!==selected) { await client.auth.signOut(); throw new Error("This account is registered as "+savedRole+". Select "+savedRole+" to sign in; account roles cannot be switched at login."); }
        go(savedRole);
      }
    } catch(err) { notice(err.message||"Something went wrong. Please try again.",true); }
    finally { $("submitBtn").disabled=false; syncMode(mode); }
  });
  syncMode("login");
})();
