import { useState, useMemo } from "react";

const PLANS = { Basic: 299, Standard: 499, Premium: 799, Business: 1299 };
const EXP_CATS = ["Bandwidth","Salaries","Equipment","Office","Marketing","Maintenance","Other"];
const PAY_METHODS = ["EFT","Cash","Card","SnapScan","Zapper"];

const HIST_BASE = [
  { month: "Oct '25", revenue: 2800, expenses: 14200 },
  { month: "Nov '25", revenue: 3400, expenses: 15100 },
  { month: "Dec '25", revenue: 3900, expenses: 15800 },
  { month: "Jan '26", revenue: 4200, expenses: 16500 },
  { month: "Feb '26", revenue: 4600, expenses: 17200 },
];

const INIT_CUSTOMERS = [
  { id:1, name:"Sipho Dlamini",    email:"sipho@gmail.com",       phone:"071 234 5678", plan:"Standard", dueDay:1,  status:"paid",    lastPaid:"2026-03-01", balance:0 },
  { id:2, name:"Priya Naidoo",     email:"priya@outlook.com",     phone:"082 345 6789", plan:"Premium",  dueDay:5,  status:"overdue", lastPaid:"2026-02-05", balance:799 },
  { id:3, name:"John Mokoena",     email:"jmokoena@yahoo.com",    phone:"060 456 7890", plan:"Basic",    dueDay:10, status:"paid",    lastPaid:"2026-03-10", balance:0 },
  { id:4, name:"Fatima Osman",     email:"fatima.o@gmail.com",    phone:"073 567 8901", plan:"Business", dueDay:1,  status:"overdue", lastPaid:"2026-02-01", balance:2598 },
  { id:5, name:"André du Plessis", email:"andre@icloud.com",      phone:"084 678 9012", plan:"Standard", dueDay:15, status:"pending", lastPaid:"2026-03-15", balance:0 },
  { id:6, name:"Nomvula Zulu",     email:"nomvula.z@gmail.com",   phone:"072 789 0123", plan:"Basic",    dueDay:20, status:"paid",    lastPaid:"2026-03-20", balance:0 },
  { id:7, name:"Ravi Pillay",      email:"ravi.p@webmail.com",    phone:"083 890 1234", plan:"Premium",  dueDay:3,  status:"overdue", lastPaid:"2026-02-03", balance:1598 },
  { id:8, name:"Lerato Khumalo",   email:"lerato.k@gmail.com",    phone:"065 901 2345", plan:"Standard", dueDay:25, status:"paid",    lastPaid:"2026-03-25", balance:0 },
];

const INIT_EXPENSES = [
  { id:1, date:"2026-03-01", category:"Bandwidth",   description:"Fibre upstream — March",   amount:4500 },
  { id:2, date:"2026-03-01", category:"Salaries",    description:"Support technician",        amount:8000 },
  { id:3, date:"2026-03-05", category:"Equipment",   description:"Router replacements (x2)",  amount:2400 },
  { id:4, date:"2026-03-12", category:"Office",      description:"Premises rent",             amount:3500 },
  { id:5, date:"2026-03-18", category:"Marketing",   description:"Facebook ads",              amount:800  },
  { id:6, date:"2026-03-22", category:"Bandwidth",   description:"Backup LTE link",           amount:1200 },
];

const INIT_PAYMENTS = [
  { id:1, customerId:1, customer:"Sipho Dlamini",    date:"2026-03-01", amount:499, method:"EFT",     ref:"SPD-0001" },
  { id:2, customerId:3, customer:"John Mokoena",     date:"2026-03-10", amount:299, method:"Card",    ref:"JMK-0002" },
  { id:3, customerId:6, customer:"Nomvula Zulu",     date:"2026-03-20", amount:299, method:"EFT",     ref:"NZL-0003" },
  { id:4, customerId:8, customer:"Lerato Khumalo",   date:"2026-03-25", amount:499, method:"Cash",    ref:"LKH-0004" },
  { id:5, customerId:5, customer:"André du Plessis", date:"2026-03-15", amount:499, method:"EFT",     ref:"ADP-0005" },
];

const SS = {
  paid:    { bg:"#eaf3de", color:"#3b6d11", label:"Paid"    },
  overdue: { bg:"#fcebeb", color:"#a32d2d", label:"Overdue" },
  pending: { bg:"#faeeda", color:"#854f0b", label:"Pending" },
};

function exportCSV(rows, filename) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const csv = [keys.join(","), ...rows.map(r => keys.map(k => `"${String(r[k]??'').replace(/"/g,'""')}"`).join(","))].join("\n");
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([csv],{type:"text/csv"})), download: filename });
  a.click(); URL.revokeObjectURL(a.href);
}

function daysAgo(ds) {
  if (!ds || ds === "-") return 0;
  return Math.floor((Date.now() - new Date(ds)) / 86400000);
}

const TABS = ["Dashboard","Customers","Payments","Expenses","History","Alerts"];

export default function App() {
  const [tab, setTab]             = useState("Dashboard");
  const [customers, setCustomers] = useState(INIT_CUSTOMERS);
  const [expenses, setExpenses]   = useState(INIT_EXPENSES);
  const [payments, setPayments]   = useState(INIT_PAYMENTS);
  const [filterSt, setFilterSt]   = useState("all");

  const [showAddC, setShowAddC]   = useState(false);
  const [showAddE, setShowAddE]   = useState(false);
  const [showAddP, setShowAddP]   = useState(false);
  const [showWACfg, setShowWACfg] = useState(false);

  const [newC, setNewC] = useState({ name:"", email:"", phone:"", plan:"Standard", dueDay:1 });
  const [newE, setNewE] = useState({ date:"", category:"Bandwidth", description:"", amount:"" });
  const [newP, setNewP] = useState({ customerId:"", amount:"", method:"EFT", date:"" });
  const [waCfg, setWACfg] = useState({ accountSid:"", token:"", from:"" });

  const [alertSt,  setAlertSt]  = useState({});
  const [alertMsg, setAlertMsg] = useState({});

  const totalRev  = useMemo(() => payments.reduce((s,p) => s+p.amount, 0), [payments]);
  const totalExp  = useMemo(() => expenses.reduce((s,e) => s+e.amount, 0), [expenses]);
  const overdue   = customers.filter(c => c.status === "overdue");
  const overdueAmt= overdue.reduce((s,c) => s+c.balance, 0);
  const mrr       = customers.reduce((s,c) => s+PLANS[c.plan], 0);
  const profit    = totalRev - totalExp;

  const histData  = [...HIST_BASE, { month:"Mar '26", revenue: totalRev, expenses: totalExp }];
  const maxHist   = Math.max(...histData.flatMap(h=>[h.revenue,h.expenses]), 1);
  const expByCat  = expenses.reduce((a,e) => ({...a,[e.category]:(a[e.category]||0)+e.amount}), {});
  const filtered  = filterSt==="all" ? customers : customers.filter(c=>c.status===filterSt);

  function addCustomer() {
    if (!newC.name||!newC.email) return;
    setCustomers(p=>[...p,{...newC,id:Date.now(),status:"pending",lastPaid:"-",balance:0,dueDay:+newC.dueDay}]);
    setNewC({name:"",email:"",phone:"",plan:"Standard",dueDay:1}); setShowAddC(false);
  }
  function addExpense() {
    if (!newE.description||!newE.amount||!newE.date) return;
    setExpenses(p=>[...p,{...newE,id:Date.now(),amount:+newE.amount}]);
    setNewE({date:"",category:"Bandwidth",description:"",amount:""}); setShowAddE(false);
  }
  function addPayment() {
    if (!newP.customerId||!newP.amount||!newP.date) return;
    const c = customers.find(c=>c.id===+newP.customerId); if (!c) return;
    setPayments(p=>[...p,{id:Date.now(),customerId:c.id,customer:c.name,date:newP.date,amount:+newP.amount,method:newP.method,ref:`PAY-${Date.now().toString().slice(-4)}`}]);
    setCustomers(p=>p.map(x=>x.id===c.id?{...x,status:"paid",lastPaid:newP.date,balance:0}:x));
    setNewP({customerId:"",amount:"",method:"EFT",date:""}); setShowAddP(false);
  }

  async function generateMsg(c) {
    setAlertSt(p=>({...p,[c.id]:"generating"}));
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514", max_tokens:300,
          messages:[{ role:"user", content:`Write a short WhatsApp message for a South African ISP customer who is overdue on payment. Friendly but firm. Under 220 characters. No hashtags or emojis. Details: Customer first name: ${c.name.split(" ")[0]}, Plan: ${c.plan}, Amount owed: R${c.balance}, Days since last payment: ${daysAgo(c.lastPaid)}. Reply with ONLY the message text.` }]
        })
      });
      const data = await res.json();
      const msg = data.content?.[0]?.text || `Hi ${c.name.split(" ")[0]}, your account is R${c.balance} overdue. Please make payment to avoid disconnection. Thank you.`;
      setAlertMsg(p=>({...p,[c.id]:msg.trim()}));
      setAlertSt(p=>({...p,[c.id]:"ready"}));
    } catch {
      setAlertMsg(p=>({...p,[c.id]:`Hi ${c.name.split(" ")[0]}, your internet is R${c.balance} overdue. Please pay to avoid disconnection. Thank you.`}));
      setAlertSt(p=>({...p,[c.id]:"ready"}));
    }
  }

  async function sendWA(c) {
    if (!waCfg.token||!waCfg.from||!waCfg.accountSid) { setShowWACfg(true); return; }
    setAlertSt(p=>({...p,[c.id]:"sending"}));
    try {
      const body = new URLSearchParams({ From:`whatsapp:${waCfg.from}`, To:`whatsapp:${c.phone.replace(/\s/g,"")}`, Body:alertMsg[c.id] });
      await fetch(`https://api.twilio.com/2010-04-01/Accounts/${waCfg.accountSid}/Messages.json`, {
        method:"POST",
        headers:{ Authorization:`Basic ${btoa(waCfg.accountSid+":"+waCfg.token)}`, "Content-Type":"application/x-www-form-urlencoded" },
        body
      });
      setAlertSt(p=>({...p,[c.id]:"sent"}));
    } catch {
      setAlertSt(p=>({...p,[c.id]:"error"}));
    }
  }

  const card   = { background:"var(--color-background-primary)", border:"0.5px solid var(--color-border-tertiary)", borderRadius:"var(--border-radius-lg)", padding:"1rem 1.25rem" };
  const met    = { background:"var(--color-background-secondary)", borderRadius:"var(--border-radius-md)", padding:"1rem" };
  const inp    = { width:"100%", padding:"8px 10px", border:"0.5px solid var(--color-border-secondary)", borderRadius:"var(--border-radius-md)", background:"var(--color-background-primary)", color:"var(--color-text-primary)", fontSize:14, fontFamily:"inherit" };
  const btn    = (a,c) => ({ padding:"8px 14px", borderRadius:"var(--border-radius-md)", border:a?"none":"0.5px solid var(--color-border-secondary)", background:a?(c||"#185fa5"):"transparent", color:a?"#fff":"var(--color-text-primary)", cursor:"pointer", fontSize:13, fontFamily:"inherit" });
  const smBtn  = (active) => ({...btn(), background:active?"var(--color-background-info)":"transparent", color:active?"var(--color-text-info)":"var(--color-text-secondary)", fontSize:12, padding:"4px 12px"});
  const th     = { textAlign:"left", paddingBottom:8, fontWeight:400, color:"var(--color-text-secondary)" };
  const tdPad  = { padding:"9px 0" };

  return (
    <div style={{ fontFamily:"inherit", boxSizing:"border-box", padding:"1rem 0", color:"var(--color-text-primary)" }}>

      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1.25rem" }}>
        <div>
          <h2 style={{ margin:0, fontSize:20, fontWeight:500 }}>ISP Finance & Billing</h2>
          <p style={{ margin:0, fontSize:13, color:"var(--color-text-secondary)" }}>March 2026</p>
        </div>
        <span style={{ background:"#e6f1fb", color:"#185fa5", fontSize:12, padding:"4px 10px", borderRadius:"var(--border-radius-md)", fontWeight:500 }}>{customers.length} customers</span>
      </div>

      <div style={{ display:"flex", gap:0, marginBottom:"1.25rem", borderBottom:"0.5px solid var(--color-border-tertiary)" }}>
        {TABS.map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{ background:"none", border:"none", borderBottom:tab===t?"2px solid #185fa5":"2px solid transparent", borderRadius:0, padding:"6px 14px", color:tab===t?"#185fa5":"var(--color-text-secondary)", fontWeight:tab===t?500:400, cursor:"pointer", fontSize:13, fontFamily:"inherit" }}>
            {t}{t==="Alerts"&&overdue.length>0&&<span style={{ background:"#e24b4a", color:"#fff", borderRadius:"50%", fontSize:10, padding:"1px 5px", marginLeft:4 }}>{overdue.length}</span>}
          </button>
        ))}
      </div>

      {showWACfg && (
        <div style={{ ...card, marginBottom:"1rem", background:"var(--color-background-secondary)", borderLeft:"3px solid #185fa5", borderRadius:0 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <p style={{ margin:0, fontWeight:500, fontSize:14 }}>WhatsApp (Twilio) configuration</p>
            <button onClick={()=>setShowWACfg(false)} style={{ ...btn(), padding:"4px 10px", fontSize:12 }}>Done</button>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:8 }}>
            {[["Account SID","ACxxxxxxxxxxxxxxxx","accountSid","text"],["Auth token","Your auth token","token","password"],["From number","+27XXXXXXXXX","from","text"]].map(([lbl,ph,key,type])=>(
              <div key={key}>
                <p style={{ margin:"0 0 4px", fontSize:12, color:"var(--color-text-secondary)" }}>{lbl}</p>
                <input style={inp} type={type} placeholder={ph} value={waCfg[key]} onChange={e=>setWACfg(p=>({...p,[key]:e.target.value}))} />
              </div>
            ))}
          </div>
          <p style={{ margin:0, fontSize:11, color:"var(--color-text-tertiary)" }}>Get credentials from console.twilio.com — enable WhatsApp on your Twilio number first. Note: direct browser calls to Twilio may require a server-side proxy in production.</p>
        </div>
      )}

      {tab==="Dashboard" && (
        <div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,minmax(0,1fr))", gap:12, marginBottom:"1.25rem" }}>
            {[
              { label:"Revenue collected", val:`R ${totalRev.toLocaleString()}`,          sub:"this month" },
              { label:"Total expenses",    val:`R ${totalExp.toLocaleString()}`,          sub:"this month" },
              { label:"Net profit",        val:`R ${Math.abs(profit).toLocaleString()}`,  sub:profit>=0?"profit":"loss", color:profit>=0?"#3b6d11":"#a32d2d" },
              { label:"Outstanding",       val:`R ${overdueAmt.toLocaleString()}`,        sub:`${overdue.length} overdue`, color:"#a32d2d" },
            ].map(m=>(
              <div key={m.label} style={met}>
                <p style={{ margin:0, fontSize:12, color:"var(--color-text-secondary)", marginBottom:4 }}>{m.label}</p>
                <p style={{ margin:0, fontSize:22, fontWeight:500, color:m.color||"var(--color-text-primary)" }}>{m.val}</p>
                <p style={{ margin:0, fontSize:11, color:"var(--color-text-tertiary)", marginTop:2 }}>{m.sub}</p>
              </div>
            ))}
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:"1.25rem" }}>
            <div style={card}>
              <p style={{ margin:"0 0 12px", fontWeight:500, fontSize:14 }}>Expenses by category</p>
              {Object.entries(expByCat).map(([cat,amt])=>{
                const pct=Math.round((amt/totalExp)*100);
                return <div key={cat} style={{ marginBottom:10 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:3 }}>
                    <span>{cat}</span><span style={{ color:"var(--color-text-secondary)" }}>R {amt.toLocaleString()}</span>
                  </div>
                  <div style={{ height:6, background:"var(--color-background-secondary)", borderRadius:3 }}>
                    <div style={{ height:6, width:`${pct}%`, background:"#378add", borderRadius:3 }} />
                  </div>
                </div>;
              })}
            </div>

            <div style={card}>
              <p style={{ margin:"0 0 12px", fontWeight:500, fontSize:14 }}>Customer status</p>
              {["paid","overdue","pending"].map(st=>{
                const n=customers.filter(c=>c.status===st).length;
                const pct=Math.round((n/customers.length)*100);
                return <div key={st} style={{ marginBottom:10 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:3 }}>
                    <span style={{ background:SS[st].bg, color:SS[st].color, fontSize:11, padding:"2px 8px", borderRadius:"var(--border-radius-md)" }}>{SS[st].label}</span>
                    <span style={{ color:"var(--color-text-secondary)" }}>{n} / {customers.length}</span>
                  </div>
                  <div style={{ height:6, background:"var(--color-background-secondary)", borderRadius:3 }}>
                    <div style={{ height:6, width:`${pct}%`, background:st==="paid"?"#639922":st==="overdue"?"#e24b4a":"#ef9f27", borderRadius:3 }} />
                  </div>
                </div>;
              })}
              <div style={{ borderTop:"0.5px solid var(--color-border-tertiary)", marginTop:14, paddingTop:10, display:"flex", justifyContent:"space-between", fontSize:13 }}>
                <span style={{ color:"var(--color-text-secondary)" }}>Expected MRR</span>
                <span style={{ fontWeight:500 }}>R {mrr.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div style={card}>
            <p style={{ margin:"0 0 12px", fontWeight:500, fontSize:14 }}>Recent payments</p>
            <table style={{ width:"100%", fontSize:13, borderCollapse:"collapse" }}>
              <thead><tr>{["Customer","Date","Amount","Method"].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>{[...payments].reverse().slice(0,5).map(p=>(
                <tr key={p.id} style={{ borderTop:"0.5px solid var(--color-border-tertiary)" }}>
                  <td style={tdPad}>{p.customer}</td>
                  <td style={{ color:"var(--color-text-secondary)" }}>{p.date}</td>
                  <td style={{ fontWeight:500 }}>R {p.amount.toLocaleString()}</td>
                  <td style={{ color:"var(--color-text-secondary)" }}>{p.method}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {tab==="Customers" && (
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem" }}>
            <div style={{ display:"flex", gap:6 }}>
              {["all","paid","overdue","pending"].map(f=><button key={f} onClick={()=>setFilterSt(f)} style={smBtn(filterSt===f)}>{f.charAt(0).toUpperCase()+f.slice(1)}</button>)}
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={()=>exportCSV(customers.map(c=>({Name:c.name,Email:c.email,Phone:c.phone,Plan:c.plan,Rate:PLANS[c.plan],Status:c.status,Balance:c.balance,LastPaid:c.lastPaid,DueDay:c.dueDay})),"customers.csv")} style={{ ...btn(), fontSize:12 }}>Export CSV</button>
              <button onClick={()=>setShowAddC(!showAddC)} style={btn(true)}>+ Add customer</button>
            </div>
          </div>

          {showAddC && (
            <div style={{ ...card, marginBottom:"1rem", background:"var(--color-background-secondary)" }}>
              <p style={{ margin:"0 0 12px", fontWeight:500, fontSize:14 }}>New customer</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:10 }}>
                {[["Full name","name"],["Email address","email"],["Phone number","phone"]].map(([ph,k])=>(
                  <input key={k} style={inp} placeholder={ph} value={newC[k]} onChange={e=>setNewC(p=>({...p,[k]:e.target.value}))} />
                ))}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
                <select style={inp} value={newC.plan} onChange={e=>setNewC(p=>({...p,plan:e.target.value}))}>
                  {Object.entries(PLANS).map(([k,v])=><option key={k} value={k}>{k} — R {v}/mo</option>)}
                </select>
                <input style={inp} type="number" placeholder="Payment due day (1-31)" min={1} max={31} value={newC.dueDay} onChange={e=>setNewC(p=>({...p,dueDay:e.target.value}))} />
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={addCustomer} style={btn(true)}>Save</button>
                <button onClick={()=>setShowAddC(false)} style={btn()}>Cancel</button>
              </div>
            </div>
          )}

          <div style={card}>
            <table style={{ width:"100%", fontSize:13, borderCollapse:"collapse", tableLayout:"fixed" }}>
              <thead><tr>{["Customer","Plan","Due","Status","Balance","Last paid"].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>{filtered.map(c=>(
                <tr key={c.id} style={{ borderTop:"0.5px solid var(--color-border-tertiary)" }}>
                  <td style={tdPad}>
                    <p style={{ margin:0, fontWeight:500 }}>{c.name}</p>
                    <p style={{ margin:0, color:"var(--color-text-secondary)", fontSize:11 }}>{c.email}</p>
                  </td>
                  <td>{c.plan}<br/><span style={{ fontSize:11, color:"var(--color-text-secondary)" }}>R {PLANS[c.plan]}/mo</span></td>
                  <td>Day {c.dueDay}</td>
                  <td><span style={{ background:SS[c.status].bg, color:SS[c.status].color, fontSize:11, padding:"2px 8px", borderRadius:"var(--border-radius-md)" }}>{SS[c.status].label}</span></td>
                  <td style={{ color:c.balance>0?"#a32d2d":"var(--color-text-secondary)" }}>{c.balance>0?`R ${c.balance.toLocaleString()}`:"—"}</td>
                  <td style={{ color:"var(--color-text-secondary)" }}>{c.lastPaid}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {tab==="Payments" && (
        <div>
          <div style={{ display:"flex", justifyContent:"flex-end", gap:8, marginBottom:"1rem" }}>
            <button onClick={()=>exportCSV(payments.map(p=>({Ref:p.ref,Customer:p.customer,Date:p.date,Amount:p.amount,Method:p.method})),"payments.csv")} style={{ ...btn(), fontSize:12 }}>Export CSV</button>
            <button onClick={()=>setShowAddP(!showAddP)} style={btn(true)}>+ Record payment</button>
          </div>

          {showAddP && (
            <div style={{ ...card, marginBottom:"1rem", background:"var(--color-background-secondary)" }}>
              <p style={{ margin:"0 0 12px", fontWeight:500, fontSize:14 }}>Record payment</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:10, marginBottom:12 }}>
                <select style={inp} value={newP.customerId} onChange={e=>setNewP(p=>({...p,customerId:e.target.value}))}>
                  <option value="">Select customer</option>
                  {customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input style={inp} type="number" placeholder="Amount (R)" value={newP.amount} onChange={e=>setNewP(p=>({...p,amount:e.target.value}))} />
                <select style={inp} value={newP.method} onChange={e=>setNewP(p=>({...p,method:e.target.value}))}>
                  {PAY_METHODS.map(m=><option key={m}>{m}</option>)}
                </select>
                <input style={inp} type="date" value={newP.date} onChange={e=>setNewP(p=>({...p,date:e.target.value}))} />
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={addPayment} style={btn(true)}>Record</button>
                <button onClick={()=>setShowAddP(false)} style={btn()}>Cancel</button>
              </div>
            </div>
          )}

          <div style={card}>
            <table style={{ width:"100%", fontSize:13, borderCollapse:"collapse" }}>
              <thead><tr>{["Ref","Customer","Date","Amount","Method"].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>{[...payments].reverse().map(p=>(
                <tr key={p.id} style={{ borderTop:"0.5px solid var(--color-border-tertiary)" }}>
                  <td style={{ ...tdPad, color:"var(--color-text-secondary)", fontFamily:"monospace", fontSize:12 }}>{p.ref}</td>
                  <td>{p.customer}</td>
                  <td style={{ color:"var(--color-text-secondary)" }}>{p.date}</td>
                  <td style={{ fontWeight:500 }}>R {p.amount.toLocaleString()}</td>
                  <td><span style={{ background:"var(--color-background-secondary)", fontSize:11, padding:"2px 8px", borderRadius:"var(--border-radius-md)", color:"var(--color-text-secondary)" }}>{p.method}</span></td>
                </tr>
              ))}</tbody>
            </table>
            <div style={{ borderTop:"0.5px solid var(--color-border-tertiary)", marginTop:10, paddingTop:10, display:"flex", justifyContent:"flex-end", gap:8 }}>
              <span style={{ fontSize:13, color:"var(--color-text-secondary)" }}>Total collected:</span>
              <span style={{ fontSize:14, fontWeight:500 }}>R {totalRev.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {tab==="Expenses" && (
        <div>
          <div style={{ display:"flex", justifyContent:"flex-end", gap:8, marginBottom:"1rem" }}>
            <button onClick={()=>exportCSV(expenses.map(e=>({Date:e.date,Category:e.category,Description:e.description,Amount:e.amount})),"expenses.csv")} style={{ ...btn(), fontSize:12 }}>Export CSV</button>
            <button onClick={()=>setShowAddE(!showAddE)} style={btn(true)}>+ Add expense</button>
          </div>

          {showAddE && (
            <div style={{ ...card, marginBottom:"1rem", background:"var(--color-background-secondary)" }}>
              <p style={{ margin:"0 0 12px", fontWeight:500, fontSize:14 }}>New expense</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:10, marginBottom:12 }}>
                <input style={inp} type="date" value={newE.date} onChange={e=>setNewE(p=>({...p,date:e.target.value}))} />
                <select style={inp} value={newE.category} onChange={e=>setNewE(p=>({...p,category:e.target.value}))}>
                  {EXP_CATS.map(c=><option key={c}>{c}</option>)}
                </select>
                <input style={inp} placeholder="Description" value={newE.description} onChange={e=>setNewE(p=>({...p,description:e.target.value}))} />
                <input style={inp} type="number" placeholder="Amount (R)" value={newE.amount} onChange={e=>setNewE(p=>({...p,amount:e.target.value}))} />
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={addExpense} style={btn(true)}>Save</button>
                <button onClick={()=>setShowAddE(false)} style={btn()}>Cancel</button>
              </div>
            </div>
          )}

          <div style={card}>
            <table style={{ width:"100%", fontSize:13, borderCollapse:"collapse" }}>
              <thead><tr>{["Date","Category","Description","Amount"].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>{expenses.map(e=>(
                <tr key={e.id} style={{ borderTop:"0.5px solid var(--color-border-tertiary)" }}>
                  <td style={{ ...tdPad, color:"var(--color-text-secondary)" }}>{e.date}</td>
                  <td><span style={{ background:"var(--color-background-secondary)", fontSize:11, padding:"2px 8px", borderRadius:"var(--border-radius-md)", color:"var(--color-text-secondary)" }}>{e.category}</span></td>
                  <td>{e.description}</td>
                  <td style={{ fontWeight:500, color:"#a32d2d" }}>R {e.amount.toLocaleString()}</td>
                </tr>
              ))}</tbody>
            </table>
            <div style={{ borderTop:"0.5px solid var(--color-border-tertiary)", marginTop:10, paddingTop:10, display:"flex", justifyContent:"flex-end", gap:8 }}>
              <span style={{ fontSize:13, color:"var(--color-text-secondary)" }}>Total expenses:</span>
              <span style={{ fontSize:14, fontWeight:500, color:"#a32d2d" }}>R {totalExp.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {tab==="History" && (
        <div>
          <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:"1rem" }}>
            <button onClick={()=>exportCSV(histData.map(h=>({Month:h.month,Revenue:h.revenue,Expenses:h.expenses,Profit:h.revenue-h.expenses,Margin:h.revenue>0?Math.round(((h.revenue-h.expenses)/h.revenue)*100)+"%":"—"})),"monthly-history.csv")} style={{ ...btn(), fontSize:12 }}>Export CSV</button>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,minmax(0,1fr))", gap:12, marginBottom:"1.25rem" }}>
            {[
              { label:"Avg monthly revenue", val:`R ${Math.round(histData.reduce((s,h)=>s+h.revenue,0)/histData.length).toLocaleString()}` },
              { label:"Avg monthly expenses", val:`R ${Math.round(histData.reduce((s,h)=>s+h.expenses,0)/histData.length).toLocaleString()}` },
              { label:"6-month net", val:`R ${Math.abs(histData.reduce((s,h)=>s+(h.revenue-h.expenses),0)).toLocaleString()}`, color:histData.reduce((s,h)=>s+(h.revenue-h.expenses),0)>=0?"#3b6d11":"#a32d2d", sub:histData.reduce((s,h)=>s+(h.revenue-h.expenses),0)>=0?"cumulative profit":"cumulative loss" },
            ].map(m=>(
              <div key={m.label} style={met}>
                <p style={{ margin:0, fontSize:12, color:"var(--color-text-secondary)", marginBottom:4 }}>{m.label}</p>
                <p style={{ margin:0, fontSize:22, fontWeight:500, color:m.color||"var(--color-text-primary)" }}>{m.val}</p>
                {m.sub && <p style={{ margin:0, fontSize:11, color:"var(--color-text-tertiary)", marginTop:2 }}>{m.sub}</p>}
              </div>
            ))}
          </div>

          <div style={{ ...card, marginBottom:"1.25rem" }}>
            <p style={{ margin:"0 0 16px", fontWeight:500, fontSize:14 }}>Revenue vs expenses — 6 months</p>
            <div style={{ display:"flex", alignItems:"flex-end", gap:6, height:150, paddingBottom:24, position:"relative" }}>
              {histData.map((h,i)=>(
                <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", height:"100%", justifyContent:"flex-end", position:"relative" }}>
                  <div style={{ width:"100%", display:"flex", gap:2, alignItems:"flex-end", height:"calc(100% - 20px)" }}>
                    <div title={`Revenue: R${h.revenue.toLocaleString()}`} style={{ flex:1, background:"#b5d4f4", borderRadius:"3px 3px 0 0", height:`${Math.round((h.revenue/maxHist)*100)}%`, minHeight:2 }} />
                    <div title={`Expenses: R${h.expenses.toLocaleString()}`} style={{ flex:1, background:"#f09595", borderRadius:"3px 3px 0 0", height:`${Math.round((h.expenses/maxHist)*100)}%`, minHeight:2 }} />
                  </div>
                  <span style={{ fontSize:10, color:"var(--color-text-secondary)", position:"absolute", bottom:0, whiteSpace:"nowrap" }}>{h.month}</span>
                </div>
              ))}
            </div>
            <div style={{ display:"flex", gap:16, marginTop:4 }}>
              {[["#b5d4f4","Revenue"],["#f09595","Expenses"]].map(([bg,lbl])=>(
                <span key={lbl} style={{ fontSize:12, display:"flex", alignItems:"center", gap:6 }}>
                  <span style={{ width:12, height:8, background:bg, display:"inline-block", borderRadius:2 }} />{lbl}
                </span>
              ))}
            </div>
          </div>

          <div style={card}>
            <p style={{ margin:"0 0 12px", fontWeight:500, fontSize:14 }}>Month-by-month breakdown</p>
            <table style={{ width:"100%", fontSize:13, borderCollapse:"collapse" }}>
              <thead><tr>{["Month","Revenue","Expenses","Profit / Loss","Margin"].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>{histData.map((h,i)=>{
                const pl=h.revenue-h.expenses;
                const mg=h.revenue>0?Math.round((pl/h.revenue)*100):0;
                const isCurrent=i===histData.length-1;
                return <tr key={i} style={{ borderTop:"0.5px solid var(--color-border-tertiary)" }}>
                  <td style={{ ...tdPad, fontWeight:isCurrent?500:400 }}>
                    {h.month}{isCurrent&&<span style={{ fontSize:11, color:"#185fa5", marginLeft:6 }}>current</span>}
                  </td>
                  <td style={{ color:"#3b6d11" }}>R {h.revenue.toLocaleString()}</td>
                  <td style={{ color:"#a32d2d" }}>R {h.expenses.toLocaleString()}</td>
                  <td style={{ color:pl>=0?"#3b6d11":"#a32d2d", fontWeight:500 }}>{pl>=0?"+":""}{pl.toLocaleString()}</td>
                  <td><span style={{ background:mg>=0?"#eaf3de":"#fcebeb", color:mg>=0?"#3b6d11":"#a32d2d", fontSize:11, padding:"2px 8px", borderRadius:"var(--border-radius-md)" }}>{mg}%</span></td>
                </tr>;
              })}</tbody>
            </table>
          </div>
        </div>
      )}

      {tab==="Alerts" && (
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem", gap:12 }}>
            {overdue.length>0 ? (
              <div style={{ flex:1, padding:"10px 14px", background:"#fcebeb", border:"0.5px solid #f7c1c1", borderRadius:"var(--border-radius-md)", fontSize:13, color:"#791f1f" }}>
                <strong>{overdue.length} customers</strong> overdue — R {overdueAmt.toLocaleString()} outstanding
              </div>
            ) : <div style={{flex:1}} />}
            <button onClick={()=>setShowWACfg(!showWACfg)} style={{ ...btn(), fontSize:12, whiteSpace:"nowrap" }}>⚙ WhatsApp setup</button>
          </div>

          {overdue.map(c=>{
            const st  = alertSt[c.id];
            const msg = alertMsg[c.id];
            return (
              <div key={c.id} style={{ ...card, marginBottom:10 }}>
                <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12 }}>
                  <div>
                    <p style={{ margin:0, fontWeight:500, fontSize:14 }}>{c.name}</p>
                    <p style={{ margin:"2px 0 0", fontSize:12, color:"var(--color-text-secondary)" }}>{c.phone} · {c.email}</p>
                    <p style={{ margin:"6px 0 0", fontSize:12, color:"var(--color-text-secondary)" }}>
                      {c.plan} · Overdue: <span style={{ color:"#a32d2d", fontWeight:500 }}>R {c.balance.toLocaleString()}</span> · {daysAgo(c.lastPaid)} days since last payment
                    </p>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:6, minWidth:190 }}>
                    {!st && <button onClick={()=>generateMsg(c)} style={{ ...btn(true), fontSize:12 }}>Generate message (AI)</button>}
                    {st==="generating" && <button style={{ ...btn(), fontSize:12, color:"var(--color-text-secondary)" }} disabled>Generating with AI...</button>}
                    {st==="ready" && <button onClick={()=>sendWA(c)} style={{ ...btn(true,undefined), fontSize:12, background:"#25D366" }}>Send via WhatsApp</button>}
                    {st==="sending" && <button style={{ ...btn(), fontSize:12 }} disabled>Sending...</button>}
                    {st==="sent" && <button style={{ ...btn(), fontSize:12, color:"#3b6d11", borderColor:"#c0dd97" }} disabled>✓ Message sent</button>}
                    {st==="error" && <button onClick={()=>sendWA(c)} style={{ ...btn(), fontSize:12, color:"#a32d2d" }}>Retry send</button>}
                    {(st==="ready"||st==="sent"||st==="error") && (
                      <button onClick={()=>{setAlertSt(p=>({...p,[c.id]:undefined}));setAlertMsg(p=>({...p,[c.id]:undefined}));}} style={{ ...btn(), fontSize:12, padding:"4px 10px" }}>Regenerate</button>
                    )}
                  </div>
                </div>

                {msg && (
                  <div style={{ marginTop:10, padding:"10px 12px", background:"var(--color-background-secondary)", borderRadius:"var(--border-radius-md)", fontSize:13, borderLeft:"3px solid #25D366" }}>
                    <p style={{ margin:"0 0 4px", fontSize:11, color:"var(--color-text-secondary)", fontWeight:500 }}>Message preview — WhatsApp</p>
                    <p style={{ margin:0, lineHeight:1.6 }}>{msg}</p>
                  </div>
                )}
              </div>
            );
          })}

          {overdue.length===0 && (
            <div style={{ textAlign:"center", padding:"3rem 0", color:"var(--color-text-secondary)", fontSize:14 }}>
              No overdue customers — all accounts are in good standing.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
