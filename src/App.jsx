import { useState, useEffect, useCallback, useMemo } from "react";

const BRUHZ = [
  { id:1,name:"Dave Munford",year:"Fall 96",line:"Thunder",phone:"718-813-7266" },
  { id:2,name:"Nigel Rawlins",year:"Fall 03",line:"Solo",phone:"+1 646 861 8006" },
  { id:3,name:"Woody Victor",year:"Spr 10",line:"–",phone:"917-923-1553" },
  { id:4,name:"Eche",year:"Spr 14",line:"Deuce",phone:"917-609-0913" },
  { id:5,name:"G Marte",year:"Spr 14",line:"–",phone:"917-365-8769" },
  { id:6,name:"Greg Brito",year:"Spr 15",line:"Tr3",phone:"347-971-1216" },
  { id:7,name:"Garry",year:"Fall 18",line:"MD",phone:"718-541-2188" },
  { id:8,name:"Lennie James",year:"Spr 20",line:"–",phone:"+1 347 245 7800" },
  { id:9,name:"Devernier",year:"Spr 23",line:"Tr3",phone:"+1 917 570 9073" },
  { id:10,name:"Kwame",year:"Spr 23",line:"Deuce",phone:"646-698-9826" },
  { id:11,name:"Marcus Legette",year:"Spr 23",line:"–",phone:"917-324-8440" },
  { id:12,name:"Christian",year:"Spr 23",line:"–",phone:"516-401-0879" },
  { id:13,name:"Dame",year:"Spr 25",line:"Ace",phone:"929-701-3838" },
  { id:14,name:"Keenan",year:"Spr 25",line:"Deuce",phone:"+1 516 545 1482" },
  { id:15,name:"Omari",year:"Spr 25",line:"4/Tail",phone:"+1 646 831 2376" },
  { id:16,name:"Tj",year:"Spr 25",line:"Tre",phone:"+1 646 705 2929" },
  { id:17,name:"Darwin (Shea Butter)",year:"N/A",line:"–",phone:"917-420-2465" },
  { id:18,name:"Davon (Vice Basileus)",year:"N/A",line:"–",phone:"+1 347 317 1217" },
  { id:19,name:"Eddie Torres (Basileus)",year:"N/A",line:"–",phone:"646-623-0045" },
  { id:20,name:"Frank Alvarez",year:"N/A",line:"–",phone:"516-670-2203" },
  { id:21,name:"Jabron Felder",year:"N/A",line:"–",phone:"+1 646 256 0048" },
  { id:22,name:"Vlad",year:"N/A",line:"–",phone:"917-930-0518" },
];

const GOLD = "#c9a84c";
const GOLD_LIGHT = "#e8d5b7";
const PURPLE = "#4a1a6b";
const PURPLE_DARK = "#1a0a2e";
const PURPLE_MID = "#2d1450";
const WHITE = "#ffffff";
const GREEN = "#4ade80";
const AMBER = "#e8a838";
const RED = "#ef4444";

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const mon = new Date(d.setDate(diff));
  mon.setHours(0,0,0,0);
  return mon;
}

function weekKey(date) {
  const s = getWeekStart(date || new Date());
  return `${s.getFullYear()}-${String(s.getMonth()+1).padStart(2,"0")}-${String(s.getDate()).padStart(2,"0")}`;
}

function weekLabel(wk) {
  const [y,m,d] = wk.split("-").map(Number);
  const start = new Date(y,m-1,d);
  const end = new Date(start);
  end.setDate(start.getDate()+6);
  const fmt = (dt) => dt.toLocaleDateString("en-US",{month:"short",day:"numeric"});
  return `${fmt(start)} – ${fmt(end)}, ${y}`;
}

function monthKey(date) {
  const d = date || new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
}

function monthLabel(mk) {
  const [y,m] = mk.split("-").map(Number);
  return new Date(y,m-1,1).toLocaleDateString("en-US",{month:"long",year:"numeric"});
}

function prevWeekKey(wk) {
  const [y,m,d] = wk.split("-").map(Number);
  const dt = new Date(y,m-1,d);
  dt.setDate(dt.getDate()-7);
  return weekKey(dt);
}

function nextWeekKey(wk) {
  const [y,m,d] = wk.split("-").map(Number);
  const dt = new Date(y,m-1,d);
  dt.setDate(dt.getDate()+7);
  return weekKey(dt);
}

const STORAGE_KEY = "ko-bruhz-tracker-v2";

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { outreaches: [], customBruhz: [], notes: {}, followUps: {} };
}

function saveData(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

export default function BruhzTracker() {
  const [data, setData] = useState(loadData);
  const [view, setView] = useState("dashboard");
  const [selectedWeek, setSelectedWeek] = useState(weekKey());
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [showLog, setShowLog] = useState(false);
  const [logForm, setLogForm] = useState({ bruhId:null, type:"phone", minutes:"", note:"", date:"" });
  const [showAddBruh, setShowAddBruh] = useState(false);
  const [newBruh, setNewBruh] = useState({ name:"",year:"",line:"",phone:"" });
  const [noteInput, setNoteInput] = useState("");
  const [followInput, setFollowInput] = useState("");

  const currentWeek = weekKey();
  const isCurrentWeek = selectedWeek === currentWeek;

  const persist = useCallback((newData) => {
    setData(newData);
    saveData(newData);
  }, []);

  const allBruhz = useMemo(() => [...BRUHZ, ...(data.customBruhz||[])], [data.customBruhz]);

  // Outreach helpers
  const weekOutreaches = useMemo(() => {
    return (data.outreaches||[]).filter(o => {
      const d = new Date(o.timestamp);
      return weekKey(d) === selectedWeek;
    });
  }, [data.outreaches, selectedWeek]);

  const prevWeekOutreaches = useMemo(() => {
    const pw = prevWeekKey(selectedWeek);
    return (data.outreaches||[]).filter(o => weekKey(new Date(o.timestamp)) === pw);
  }, [data.outreaches, selectedWeek]);

  const monthOutreaches = useMemo(() => {
    const [y,m] = selectedWeek.split("-").map(Number);
    const mk = `${y}-${String(m).padStart(2,"0")}`;
    return (data.outreaches||[]).filter(o => {
      const d = new Date(o.timestamp);
      return monthKey(d) === mk;
    });
  }, [data.outreaches, selectedWeek]);

  // Stats calculators
  function calcStats(outreaches) {
    const total = outreaches.length;
    const phoneCalls = outreaches.filter(o=>o.type==="phone");
    const inPerson = outreaches.filter(o=>o.type==="in-person");
    const totalMins = outreaches.reduce((s,o)=>s+(o.minutes||0),0);
    const phoneMins = phoneCalls.reduce((s,o)=>s+(o.minutes||0),0);
    const inPersonMins = inPerson.reduce((s,o)=>s+(o.minutes||0),0);
    const uniqueBruhz = new Set(outreaches.map(o=>o.bruhId)).size;
    return { total, phoneCalls:phoneCalls.length, inPerson:inPerson.length, totalMins, phoneMins, inPersonMins, uniqueBruhz };
  }

  const weekStats = useMemo(()=>calcStats(weekOutreaches),[weekOutreaches]);
  const prevStats = useMemo(()=>calcStats(prevWeekOutreaches),[prevWeekOutreaches]);
  const monthStats = useMemo(()=>calcStats(monthOutreaches),[monthOutreaches]);

  function pctChange(curr, prev) {
    if (prev === 0 && curr === 0) return 0;
    if (prev === 0) return 100;
    return Math.round(((curr - prev) / prev) * 100);
  }

  // Per-bruh stats for current selected week
  function bruhWeekStats(bruhId) {
    const outs = weekOutreaches.filter(o=>o.bruhId===bruhId);
    return {
      total: outs.length,
      phone: outs.filter(o=>o.type==="phone").length,
      inPerson: outs.filter(o=>o.type==="in-person").length,
      totalMins: outs.reduce((s,o)=>s+(o.minutes||0),0),
    };
  }

  // Log outreach
  function logOutreach() {
    if (!logForm.bruhId || !logForm.minutes || !logForm.date) return;
    const entry = {
      id: Date.now(),
      bruhId: logForm.bruhId,
      type: logForm.type,
      minutes: parseInt(logForm.minutes)||0,
      note: logForm.note.trim(),
      timestamp: new Date(logForm.date + "T12:00:00").toISOString(),
    };
    persist({ ...data, outreaches: [...(data.outreaches||[]), entry] });
    setLogForm({ bruhId:null, type:"phone", minutes:"", note:"", date:"" });
    setShowLog(false);
  }

  function deleteOutreach(id) {
    persist({ ...data, outreaches: (data.outreaches||[]).filter(o=>o.id!==id) });
  }

  // Add/remove bruhz
  function addBruh() {
    if (!newBruh.name.trim()) return;
    const maxId = allBruhz.reduce((mx,b)=>Math.max(mx,b.id),0);
    const entry = { id:maxId+1, name:newBruh.name.trim(), year:newBruh.year.trim()||"N/A", line:newBruh.line.trim()||"–", phone:newBruh.phone.trim()||"–" };
    persist({ ...data, customBruhz:[...(data.customBruhz||[]),entry] });
    setNewBruh({ name:"",year:"",line:"",phone:"" });
    setShowAddBruh(false);
  }

  // Notes & follow-ups
  function addNote(bruhId) {
    if (!noteInput.trim()) return;
    const existing = data.notes?.[bruhId] || [];
    const entry = { text:noteInput.trim(), date:new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}) };
    persist({ ...data, notes:{...data.notes,[bruhId]:[...existing,entry]} });
    setNoteInput("");
  }

  function addFollowUp(bruhId) {
    if (!followInput.trim()) return;
    const existing = data.followUps?.[bruhId] || [];
    const entry = { text:followInput.trim(), done:false, date:new Date().toLocaleDateString("en-US",{month:"short",day:"numeric"}) };
    persist({ ...data, followUps:{...data.followUps,[bruhId]:[...existing,entry]} });
    setFollowInput("");
  }

  function toggleFollowUp(bruhId, idx) {
    const items = [...(data.followUps?.[bruhId]||[])];
    items[idx] = {...items[idx], done:!items[idx].done};
    persist({ ...data, followUps:{...data.followUps,[bruhId]:items} });
  }

  // Week navigation
  const allWeeks = useMemo(() => {
    const weeks = new Set([currentWeek]);
    (data.outreaches||[]).forEach(o => weeks.add(weekKey(new Date(o.timestamp))));
    return [...weeks].sort().reverse();
  }, [data.outreaches, currentWeek]);

  // Filtered bruhz
  const filteredBruhz = allBruhz.filter(b => {
    if (search && !b.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === "contacted") return bruhWeekStats(b.id).total > 0;
    if (filter === "not-contacted") return bruhWeekStats(b.id).total === 0;
    if (filter === "followup") return (data.followUps?.[b.id]||[]).some(f=>!f.done);
    return true;
  });

  const pctEng = pctChange(weekStats.totalMins, prevStats.totalMins);
  const pctOut = pctChange(weekStats.total, prevStats.total);

  const inputStyle = { padding:"10px 14px",background:"rgba(255,255,255,.06)",border:`1px solid ${PURPLE}`,color:GOLD_LIGHT,fontSize:14,borderRadius:6,outline:"none",fontFamily:"inherit",width:"100%" };
  const btnGold = { padding:"10px 20px",background:GOLD,color:PURPLE_DARK,border:"none",fontSize:13,fontWeight:600,cursor:"pointer",borderRadius:6 };
  const btnOutline = { padding:"8px 16px",background:"transparent",color:GOLD,border:`1px solid ${PURPLE}`,fontSize:12,fontWeight:500,cursor:"pointer",borderRadius:6 };

  function StatCard({label,value,sub,color}) {
    return (
      <div style={{ flex:"1 1 140px",background:"rgba(255,255,255,.03)",border:`1px solid ${PURPLE}`,borderRadius:12,padding:"16px",textAlign:"center" }}>
        <div style={{ fontSize:28,fontWeight:700,color:color||GOLD,fontFamily:"'Playfair Display',serif" }}>{value}</div>
        <div style={{ fontSize:11,letterSpacing:1.5,textTransform:"uppercase",opacity:.5,marginTop:4 }}>{label}</div>
        {sub && <div style={{ fontSize:12,marginTop:6,color:sub.includes("↑")?GREEN:sub.includes("↓")?RED:GOLD_LIGHT,opacity:.8 }}>{sub}</div>}
      </div>
    );
  }

  return (
    <div style={{ minHeight:"100vh",background:`linear-gradient(145deg, ${PURPLE_DARK} 0%, #16213e 50%, #0f3460 100%)`,color:GOLD_LIGHT,fontFamily:"'Libre Franklin','Helvetica Neue',sans-serif",padding:"0 0 60px" }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Libre+Franklin:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`
        .tab{transition:all .2s;cursor:pointer;border:none;outline:none}
        .tab:hover{background:rgba(201,168,76,.15)!important}
        input::placeholder,textarea::placeholder{color:rgba(232,213,183,.3)}
        select option{color:#333;background:#fff}
      `}</style>

      {/* HEADER */}
      <div style={{ textAlign:"center",padding:"28px 16px 20px",borderBottom:`1px solid ${PURPLE}` }}>
        <div style={{ fontSize:13,letterSpacing:5,textTransform:"uppercase",color:GOLD,fontWeight:600,marginBottom:4 }}>Kappa Omicron Chapter</div>
        <div style={{ fontFamily:"'Playfair Display',serif",fontSize:28,fontWeight:900,color:WHITE,letterSpacing:1,marginBottom:4 }}>Bruhz Outreach Tracker</div>
        <div style={{ fontSize:12,color:GOLD,opacity:.7,letterSpacing:2,marginBottom:6 }}>ΩΨΦ — FRIENDSHIP IS ESSENTIAL TO THE SOUL</div>
        <div style={{ fontSize:10,color:GOLD_LIGHT,opacity:.3,letterSpacing:1.5 }}>Powered by <a href="https://qfsg.ai" target="_blank" rel="noopener noreferrer" style={{ color:GOLD,textDecoration:"none",opacity:.7 }}>Quantum Flight Strategy Group</a></div>
      </div>

      {/* WEEK SELECTOR */}
      <div style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:12,padding:"16px",borderBottom:`1px solid ${PURPLE}` }}>
        <button onClick={()=>{ const pw=prevWeekKey(selectedWeek); setSelectedWeek(pw); }} style={{...btnOutline,padding:"6px 12px",fontSize:18}}>←</button>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:14,fontWeight:600,color:isCurrentWeek?GREEN:GOLD_LIGHT }}>{isCurrentWeek?"THIS WEEK":"PAST WEEK"}</div>
          <div style={{ fontSize:12,opacity:.6,marginTop:2 }}>{weekLabel(selectedWeek)}</div>
        </div>
        <button onClick={()=>{ const nw=nextWeekKey(selectedWeek); if(nw<=currentWeek) setSelectedWeek(nw); }} style={{...btnOutline,padding:"6px 12px",fontSize:18,opacity:isCurrentWeek?.3:1}}>→</button>
      </div>

      {/* VIEW TABS */}
      <div style={{ display:"flex",justifyContent:"center",gap:6,padding:"16px",flexWrap:"wrap" }}>
        {[{k:"dashboard",l:"Dashboard"},{k:"bruhz",l:"Bruhz"},{k:"log",l:"Activity Log"},{k:"monthly",l:"Monthly"}].map(t=>(
          <button key={t.k} className="tab" onClick={()=>setView(t.k)} style={{ padding:"8px 20px",borderRadius:4,background:view===t.k?GOLD:"transparent",color:view===t.k?PURPLE_DARK:GOLD_LIGHT,fontSize:12,fontWeight:600,letterSpacing:1.5,textTransform:"uppercase" }}>{t.l}</button>
        ))}
      </div>

      <div style={{ maxWidth:800,margin:"0 auto",padding:"0 16px" }}>

        {/* ===== DASHBOARD ===== */}
        {view==="dashboard" && (
          <div>
            {/* Log button - available on any week */}
            <div style={{ textAlign:"center",marginBottom:24 }}>
              <button onClick={()=>{setLogForm({...logForm,bruhId:null,type:"phone",minutes:"",note:"",date:""});setShowLog(true);}} style={{ ...btnGold,fontSize:16,padding:"14px 40px",borderRadius:8 }}>+ Log Outreach</button>
            </div>

            {/* Weekly Stats */}
            <div style={{ fontSize:11,letterSpacing:3,textTransform:"uppercase",color:GOLD,fontWeight:600,marginBottom:12 }}>WEEKLY SUMMARY</div>
            <div style={{ display:"flex",gap:10,flexWrap:"wrap",marginBottom:20 }}>
              <StatCard label="Total Outreaches" value={weekStats.total} sub={prevStats.total>0||weekStats.total>0?`${pctOut>=0?"↑":"↓"} ${Math.abs(pctOut)}% vs last week`:null} />
              <StatCard label="Total Minutes" value={weekStats.totalMins} sub={prevStats.totalMins>0||weekStats.totalMins>0?`${pctEng>=0?"↑":"↓"} ${Math.abs(pctEng)}% vs last week`:null} />
              <StatCard label="Bruhz Reached" value={weekStats.uniqueBruhz} color={weekStats.uniqueBruhz>=allBruhz.length?GREEN:GOLD} />
            </div>

            {/* Phone vs In-Person breakdown */}
            <div style={{ display:"flex",gap:10,flexWrap:"wrap",marginBottom:28 }}>
              <div style={{ flex:"1 1 200px",background:"rgba(255,255,255,.03)",border:`1px solid ${PURPLE}`,borderRadius:12,padding:"16px" }}>
                <div style={{ fontSize:12,opacity:.5,letterSpacing:1.5,textTransform:"uppercase",marginBottom:8 }}>Phone Calls</div>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"baseline" }}>
                  <span style={{ fontSize:24,fontWeight:700,color:GOLD,fontFamily:"'Playfair Display',serif" }}>{weekStats.phoneCalls}</span>
                  <span style={{ fontSize:13,color:GOLD_LIGHT,opacity:.7 }}>{weekStats.phoneMins} mins</span>
                </div>
              </div>
              <div style={{ flex:"1 1 200px",background:"rgba(255,255,255,.03)",border:`1px solid ${PURPLE}`,borderRadius:12,padding:"16px" }}>
                <div style={{ fontSize:12,opacity:.5,letterSpacing:1.5,textTransform:"uppercase",marginBottom:8 }}>In-Person</div>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"baseline" }}>
                  <span style={{ fontSize:24,fontWeight:700,color:AMBER,fontFamily:"'Playfair Display',serif" }}>{weekStats.inPerson}</span>
                  <span style={{ fontSize:13,color:GOLD_LIGHT,opacity:.7 }}>{weekStats.inPersonMins} mins</span>
                </div>
              </div>
            </div>

            {/* Summary sentence */}
            {weekStats.total > 0 && (
              <div style={{ background:"rgba(201,168,76,.06)",border:`1px solid rgba(201,168,76,.15)`,borderRadius:8,padding:"14px 18px",marginBottom:28,fontSize:14,lineHeight:1.6,color:GOLD_LIGHT }}>
                <strong style={{color:GOLD}}>{weekStats.phoneMins} mins</strong> via phone calls and <strong style={{color:AMBER}}>{weekStats.inPersonMins} mins</strong> in-person time with the bruhz this week, for a total of <strong style={{color:WHITE}}>{weekStats.totalMins} minutes</strong> across <strong>{weekStats.total} outreaches</strong>.
              </div>
            )}

            {/* Top Bruhz this week */}
            <div style={{ fontSize:11,letterSpacing:3,textTransform:"uppercase",color:GOLD,fontWeight:600,marginBottom:12 }}>PER-BRUH BREAKDOWN</div>
            <div style={{ marginBottom:20 }}>
              {allBruhz.map(b => {
                const s = bruhWeekStats(b.id);
                if (s.total === 0) return null;
                return (
                  <div key={b.id} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 12px",borderBottom:`1px solid rgba(74,26,107,.3)`,flexWrap:"wrap",gap:8 }}>
                    <div>
                      <div style={{ fontSize:14,fontWeight:500,color:WHITE }}>{b.name}</div>
                      <div style={{ fontSize:12,opacity:.5 }}>{s.phone} calls · {s.inPerson} in-person</div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:16,fontWeight:700,color:GOLD,fontFamily:"'Playfair Display',serif" }}>{s.totalMins} min</div>
                      <div style={{ fontSize:11,opacity:.4 }}>{s.total} outreaches</div>
                    </div>
                  </div>
                );
              })}
              {weekStats.total===0 && <div style={{ textAlign:"center",padding:24,opacity:.4,fontSize:14 }}>No outreaches logged this week yet</div>}
            </div>
          </div>
        )}

        {/* ===== BRUHZ LIST ===== */}
        {view==="bruhz" && (
          <div>
            {/* Search, filter, add */}
            <div style={{ display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center" }}>
              <input type="text" placeholder="Search bruhz..." value={search} onChange={e=>setSearch(e.target.value)} style={{...inputStyle,flex:"1 1 160px"}} />
              <select value={filter} onChange={e=>setFilter(e.target.value)} style={{...inputStyle,flex:"0 0 160px",appearance:"auto"}}>
                <option value="all">All Bruhz</option>
                <option value="contacted">Contacted This Week</option>
                <option value="not-contacted">Not Contacted</option>
                <option value="followup">Pending Follow-Up</option>
              </select>
              <button onClick={()=>setShowAddBruh(!showAddBruh)} style={btnGold}>{showAddBruh?"✕ Cancel":"+ Add Bruh"}</button>
            </div>

            {showAddBruh && (
              <div style={{ padding:16,border:`1px solid ${GOLD}`,borderRadius:8,background:"rgba(201,168,76,.06)",marginBottom:16 }}>
                <div style={{ fontSize:11,letterSpacing:2,textTransform:"uppercase",color:GOLD,fontWeight:600,marginBottom:10 }}>Add New Bruh</div>
                <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
                  <input placeholder="Name *" value={newBruh.name} onChange={e=>setNewBruh({...newBruh,name:e.target.value})} style={{...inputStyle,flex:"2 1 140px"}} />
                  <input placeholder="Phone" value={newBruh.phone} onChange={e=>setNewBruh({...newBruh,phone:e.target.value})} style={{...inputStyle,flex:"2 1 120px"}} />
                  <input placeholder="Year" value={newBruh.year} onChange={e=>setNewBruh({...newBruh,year:e.target.value})} style={{...inputStyle,flex:"1 1 80px"}} />
                  <input placeholder="Line" value={newBruh.line} onChange={e=>setNewBruh({...newBruh,line:e.target.value})} style={{...inputStyle,flex:"1 1 70px"}} />
                  <button onClick={addBruh} style={btnGold}>ADD</button>
                </div>
              </div>
            )}

            {/* Bruhz cards */}
            {filteredBruhz.map(b => {
              const isOpen = selected===b.id;
              const s = bruhWeekStats(b.id);
              const notes = data.notes?.[b.id]||[];
              const follows = data.followUps?.[b.id]||[];
              const hasFollow = follows.some(f=>!f.done);
              return (
                <div key={b.id} style={{ border:`1px solid ${isOpen?GOLD:PURPLE}`,marginBottom:8,borderRadius:8,background:isOpen?"rgba(201,168,76,.04)":"rgba(255,255,255,.02)",transition:"all .2s" }}>
                  <div onClick={()=>setSelected(isOpen?null:b.id)} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px",cursor:"pointer",flexWrap:"wrap",gap:8 }}>
                    <div>
                      <div style={{ fontSize:15,fontWeight:600,color:WHITE }}>
                        {b.name}
                        {hasFollow && <span style={{ display:"inline-block",width:7,height:7,borderRadius:"50%",background:AMBER,marginLeft:8,verticalAlign:"middle" }} />}
                      </div>
                      <div style={{ fontSize:12,opacity:.5,marginTop:2 }}>{b.year}{b.line!=="–"?` · ${b.line}`:""}</div>
                    </div>
                    <div style={{ display:"flex",alignItems:"center",gap:12 }}>
                      {s.total>0 && <div style={{ fontSize:12,color:GOLD }}>{s.total} · {s.totalMins}min</div>}
                      <a href={`tel:${b.phone.replace(/\s/g,"")}`} onClick={e=>e.stopPropagation()} style={{ fontSize:12,color:GOLD,textDecoration:"none",padding:"4px 10px",border:`1px solid ${GOLD}`,borderRadius:4 }}>📞</a>
                      <div style={{ fontSize:16,color:GOLD,transform:isOpen?"rotate(180deg)":"rotate(0)",transition:"transform .2s" }}>▾</div>
                    </div>
                  </div>

                  {isOpen && (
                    <div style={{ padding:"0 16px 16px",borderTop:`1px solid ${PURPLE}` }}>
                      <div style={{ padding:"10px 0",fontSize:13,opacity:.7 }}>📱 {b.phone}</div>

                      {/* Quick log for this bruh */}
                      <button onClick={()=>{setLogForm({...logForm,bruhId:b.id,type:"phone",minutes:"",note:"",date:""});setShowLog(true);}} style={{...btnOutline,marginBottom:12,width:"100%",textAlign:"center"}}>+ Log Outreach with {b.name.split(" ")[0]}</button>

                      {/* This week's activity */}
                      {s.total>0 && (
                        <div style={{ marginBottom:12 }}>
                          <div style={{ fontSize:11,letterSpacing:2,textTransform:"uppercase",color:GOLD,fontWeight:600,marginBottom:6 }}>This Week</div>
                          <div style={{ fontSize:13,color:GOLD_LIGHT }}>{s.phone} phone ({weekOutreaches.filter(o=>o.bruhId===b.id&&o.type==="phone").reduce((s,o)=>s+o.minutes,0)} min) · {s.inPerson} in-person ({weekOutreaches.filter(o=>o.bruhId===b.id&&o.type==="in-person").reduce((s,o)=>s+o.minutes,0)} min)</div>
                        </div>
                      )}

                      {/* Notes */}
                      <div style={{ marginBottom:12 }}>
                        <div style={{ fontSize:11,letterSpacing:2,textTransform:"uppercase",color:GOLD,fontWeight:600,marginBottom:6 }}>Notes</div>
                        {notes.map((n,i)=>(
                          <div key={i} style={{ padding:"5px 0",borderBottom:`1px solid rgba(74,26,107,.2)`,fontSize:13 }}>
                            <span style={{ opacity:.5,fontSize:11,marginRight:8 }}>{n.date}</span>{n.text}
                          </div>
                        ))}
                        <div style={{ display:"flex",gap:6,marginTop:8 }}>
                          <input placeholder="Add a note..." value={selected===b.id?noteInput:""} onChange={e=>setNoteInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addNote(b.id)} style={{...inputStyle,flex:1}} />
                          <button onClick={()=>addNote(b.id)} style={btnGold}>+</button>
                        </div>
                      </div>

                      {/* Follow-ups */}
                      <div>
                        <div style={{ fontSize:11,letterSpacing:2,textTransform:"uppercase",color:AMBER,fontWeight:600,marginBottom:6 }}>Follow-Ups</div>
                        {follows.map((f,i)=>(
                          <div key={i} style={{ display:"flex",alignItems:"center",gap:8,padding:"5px 0",borderBottom:`1px solid rgba(74,26,107,.2)`,fontSize:13 }}>
                            <button onClick={()=>toggleFollowUp(b.id,i)} style={{ width:18,height:18,border:`1.5px solid ${f.done?GREEN:AMBER}`,background:f.done?GREEN:"transparent",color:f.done?PURPLE_DARK:"transparent",fontSize:11,fontWeight:700,cursor:"pointer",borderRadius:3,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>{f.done?"✓":""}</button>
                            <span style={{ textDecoration:f.done?"line-through":"none",opacity:f.done?.4:1,flex:1 }}>
                              <span style={{ opacity:.5,fontSize:11,marginRight:6 }}>{f.date}</span>{f.text}
                            </span>
                          </div>
                        ))}
                        <div style={{ display:"flex",gap:6,marginTop:8 }}>
                          <input placeholder="Add follow-up..." value={selected===b.id?followInput:""} onChange={e=>setFollowInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addFollowUp(b.id)} style={{...inputStyle,flex:1}} />
                          <button onClick={()=>addFollowUp(b.id)} style={{...btnGold,background:AMBER}}>+</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ===== ACTIVITY LOG ===== */}
        {view==="log" && (
          <div>
            <div style={{ fontSize:11,letterSpacing:3,textTransform:"uppercase",color:GOLD,fontWeight:600,marginBottom:12 }}>ACTIVITY LOG — {weekLabel(selectedWeek)}</div>
            {weekOutreaches.length===0 && <div style={{ textAlign:"center",padding:32,opacity:.4 }}>No outreaches logged this week</div>}
            {[...weekOutreaches].reverse().map(o => {
              const b = allBruhz.find(br=>br.id===o.bruhId);
              const dt = new Date(o.timestamp);
              return (
                <div key={o.id} style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"12px 14px",borderBottom:`1px solid rgba(74,26,107,.3)`,gap:12 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14,fontWeight:500,color:WHITE }}>{b?.name||"Unknown"}</div>
                    <div style={{ fontSize:12,marginTop:2 }}>
                      <span style={{ color:o.type==="phone"?GOLD:AMBER,fontWeight:600 }}>{o.type==="phone"?"📞 Phone Call":"🤝 In-Person"}</span>
                      <span style={{ opacity:.5,marginLeft:8 }}>{o.minutes} min</span>
                    </div>
                    {o.note && <div style={{ fontSize:12,opacity:.6,marginTop:4,fontStyle:"italic" }}>"{o.note}"</div>}
                  </div>
                  <div style={{ textAlign:"right",flexShrink:0 }}>
                    <div style={{ fontSize:11,opacity:.4 }}>{dt.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}</div>
                    <div style={{ fontSize:11,opacity:.3 }}>{dt.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"})}</div>
                    <button onClick={()=>deleteOutreach(o.id)} style={{ background:"none",border:"none",color:RED,opacity:.4,cursor:"pointer",fontSize:11,marginTop:4 }}>delete</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ===== MONTHLY ===== */}
        {view==="monthly" && (
          <div>
            <div style={{ fontSize:11,letterSpacing:3,textTransform:"uppercase",color:GOLD,fontWeight:600,marginBottom:12 }}>MONTHLY SUMMARY — {monthLabel(selectedWeek.substring(0,7))}</div>
            <div style={{ display:"flex",gap:10,flexWrap:"wrap",marginBottom:20 }}>
              <StatCard label="Total Outreaches" value={monthStats.total} />
              <StatCard label="Total Minutes" value={monthStats.totalMins} />
              <StatCard label="Bruhz Reached" value={monthStats.uniqueBruhz} />
            </div>
            <div style={{ display:"flex",gap:10,flexWrap:"wrap",marginBottom:28 }}>
              <div style={{ flex:"1 1 200px",background:"rgba(255,255,255,.03)",border:`1px solid ${PURPLE}`,borderRadius:12,padding:"16px" }}>
                <div style={{ fontSize:12,opacity:.5,letterSpacing:1.5,textTransform:"uppercase",marginBottom:8 }}>Phone Calls</div>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"baseline" }}>
                  <span style={{ fontSize:24,fontWeight:700,color:GOLD,fontFamily:"'Playfair Display',serif" }}>{monthStats.phoneCalls}</span>
                  <span style={{ fontSize:13,opacity:.7 }}>{monthStats.phoneMins} mins</span>
                </div>
              </div>
              <div style={{ flex:"1 1 200px",background:"rgba(255,255,255,.03)",border:`1px solid ${PURPLE}`,borderRadius:12,padding:"16px" }}>
                <div style={{ fontSize:12,opacity:.5,letterSpacing:1.5,textTransform:"uppercase",marginBottom:8 }}>In-Person</div>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"baseline" }}>
                  <span style={{ fontSize:24,fontWeight:700,color:AMBER,fontFamily:"'Playfair Display',serif" }}>{monthStats.inPerson}</span>
                  <span style={{ fontSize:13,opacity:.7 }}>{monthStats.inPersonMins} mins</span>
                </div>
              </div>
            </div>
            {monthStats.total > 0 && (
              <div style={{ background:"rgba(201,168,76,.06)",border:`1px solid rgba(201,168,76,.15)`,borderRadius:8,padding:"14px 18px",marginBottom:20,fontSize:14,lineHeight:1.6 }}>
                This month: <strong style={{color:GOLD}}>{monthStats.phoneMins} mins</strong> via phone and <strong style={{color:AMBER}}>{monthStats.inPersonMins} mins</strong> in-person for a total of <strong style={{color:WHITE}}>{monthStats.totalMins} minutes</strong> across <strong>{monthStats.total} outreaches</strong> with <strong>{monthStats.uniqueBruhz} bruhz</strong>.
              </div>
            )}

            {/* Per bruh monthly */}
            <div style={{ fontSize:11,letterSpacing:3,textTransform:"uppercase",color:GOLD,fontWeight:600,marginBottom:12 }}>PER-BRUH MONTHLY TOTALS</div>
            {allBruhz.map(b => {
              const outs = monthOutreaches.filter(o=>o.bruhId===b.id);
              if (outs.length===0) return null;
              const mins = outs.reduce((s,o)=>s+(o.minutes||0),0);
              return (
                <div key={b.id} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 12px",borderBottom:`1px solid rgba(74,26,107,.2)` }}>
                  <div style={{ fontSize:14,color:WHITE }}>{b.name}</div>
                  <div style={{ fontSize:13,color:GOLD }}>{outs.length} outreaches · {mins} min</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* LOG OUTREACH MODAL */}
      {showLog && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.7)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:16 }} onClick={()=>setShowLog(false)}>
          <div onClick={e=>e.stopPropagation()} style={{ background:PURPLE_DARK,border:`1px solid ${GOLD}`,borderRadius:16,padding:28,maxWidth:420,width:"100%" }}>
            <div style={{ fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:WHITE,marginBottom:20 }}>Log Outreach</div>

            {/* Bruh selector */}
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:11,letterSpacing:2,color:GOLD,marginBottom:6,fontWeight:600 }}>BRUH</div>
              <select value={logForm.bruhId||""} onChange={e=>setLogForm({...logForm,bruhId:parseInt(e.target.value)})} style={{...inputStyle,appearance:"auto"}}>
                <option value="">Select a bruh...</option>
                {allBruhz.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>

            {/* Date */}
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:11,letterSpacing:2,color:GOLD,marginBottom:6,fontWeight:600 }}>DATE OF OUTREACH</div>
              {(() => {
                const [y,m,d] = selectedWeek.split("-").map(Number);
                const weekStart = new Date(y,m-1,d);
                const days = [];
                for (let i=0; i<7; i++) {
                  const day = new Date(weekStart);
                  day.setDate(weekStart.getDate()+i);
                  days.push(day);
                }
                return (
                  <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
                    {days.map((day,i) => {
                      const val = day.toISOString().split("T")[0];
                      const isSelected = logForm.date === val;
                      const dayName = day.toLocaleDateString("en-US",{weekday:"short"});
                      const dayNum = day.getDate();
                      return (
                        <button key={i} onClick={()=>setLogForm({...logForm,date:val})} style={{ flex:"1 1 40px",padding:"8px 4px",border:`1.5px solid ${isSelected?GOLD:PURPLE}`,background:isSelected?GOLD:"transparent",color:isSelected?PURPLE_DARK:GOLD_LIGHT,borderRadius:6,cursor:"pointer",textAlign:"center",minWidth:44 }}>
                          <div style={{ fontSize:10,opacity:isSelected?1:.5,fontWeight:600 }}>{dayName}</div>
                          <div style={{ fontSize:16,fontWeight:700,marginTop:2 }}>{dayNum}</div>
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Type */}
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:11,letterSpacing:2,color:GOLD,marginBottom:6,fontWeight:600 }}>TYPE</div>
              <div style={{ display:"flex",gap:8 }}>
                <button onClick={()=>setLogForm({...logForm,type:"phone"})} style={{ flex:1,padding:"10px",border:`1.5px solid ${logForm.type==="phone"?GOLD:PURPLE}`,background:logForm.type==="phone"?GOLD:"transparent",color:logForm.type==="phone"?PURPLE_DARK:GOLD_LIGHT,borderRadius:6,cursor:"pointer",fontSize:14,fontWeight:600 }}>📞 Phone Call</button>
                <button onClick={()=>setLogForm({...logForm,type:"in-person"})} style={{ flex:1,padding:"10px",border:`1.5px solid ${logForm.type==="in-person"?AMBER:PURPLE}`,background:logForm.type==="in-person"?AMBER:"transparent",color:logForm.type==="in-person"?PURPLE_DARK:GOLD_LIGHT,borderRadius:6,cursor:"pointer",fontSize:14,fontWeight:600 }}>🤝 In-Person</button>
              </div>
            </div>

            {/* Minutes */}
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:11,letterSpacing:2,color:GOLD,marginBottom:6,fontWeight:600 }}>DURATION (MINUTES)</div>
              <input type="number" placeholder="e.g. 15" value={logForm.minutes} onChange={e=>setLogForm({...logForm,minutes:e.target.value})} style={inputStyle} />
            </div>

            {/* Note */}
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:11,letterSpacing:2,color:GOLD,marginBottom:6,fontWeight:600 }}>NOTE (OPTIONAL)</div>
              <textarea placeholder="What did you talk about?" value={logForm.note} onChange={e=>setLogForm({...logForm,note:e.target.value})} rows={3} style={{...inputStyle,resize:"vertical"}} />
            </div>

            <div style={{ display:"flex",gap:10 }}>
              <button onClick={()=>setShowLog(false)} style={{...btnOutline,flex:1,textAlign:"center"}}>Cancel</button>
              <button onClick={logOutreach} style={{...btnGold,flex:1,textAlign:"center",opacity:logForm.bruhId&&logForm.minutes&&logForm.date?1:.4}}>Log Outreach</button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div style={{ textAlign:"center",padding:"40px 16px 20px" }}>
        <div style={{ fontSize:11,opacity:.2,letterSpacing:2,marginBottom:16 }}>KO BRUHZ OUTREACH TRACKER · ΩΨΦ</div>
        <div style={{ fontSize:10,opacity:.25,letterSpacing:1 }}>A product of <a href="https://qfsg.ai" target="_blank" rel="noopener noreferrer" style={{ color:GOLD,textDecoration:"none",opacity:.6 }}>QFSG</a></div>
      </div>
    </div>
  );
}
