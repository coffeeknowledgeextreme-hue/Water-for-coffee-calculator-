// same app as single-file, trimmed imports

/* global React, ReactDOM */
const {useState, useMemo, useRef} = React;
const M = { Ca: 40.078, Mg: 24.305, Na: 22.989, K: 39.0983, Cl: 35.453, S: 32.065, O: 15.999, H: 1.008, C: 12.011 };
const MM = (k)=>({ HCO3: M.H+M.C+3*M.O, CO3: M.C+3*M.O, SO4: M.S+4*M.O,
  "CaCl2·2H2O":147.014,"CaCl2":110.984,"CaSO4·2H2O":172.171,
  "MgSO4·7H2O":246.469,"MgCl2·6H2O":203.303,
  NaHCO3:84.007, KHCO3:100.115, Na2CO3:105.9888, K2CO3:138.205,
  NaCl:58.443, KCl:74.551, Na2SO4:142.04, K2SO4:174.26,
  "Na3C6H5O7·2H2O":294.10
}[k]);
const FRACTIONS = {
  "CaCl2·2H2O": { Ca: M.Ca/MM("CaCl2·2H2O"), Cl: (2*M.Cl)/MM("CaCl2·2H2O") },
  "CaCl2":      { Ca: M.Ca/MM("CaCl2"),      Cl: (2*M.Cl)/MM("CaCl2") },
  "CaSO4·2H2O": { Ca: M.Ca/MM("CaSO4·2H2O"), SO4: MM("SO4")/MM("CaSO4·2H2O") },
  "MgSO4·7H2O": { Mg: M.Mg/MM("MgSO4·7H2O"), SO4: MM("SO4")/MM("MgSO4·7H2O") },
  "MgCl2·6H2O": { Mg: M.Mg/MM("MgCl2·6H2O"), Cl: (2*M.Cl)/MM("MgCl2·6H2O") },
  NaHCO3: { Na: M.Na/MM("NaHCO3"), HCO3: MM("HCO3")/MM("NaHCO3") },
  KHCO3: { K: M.K/MM("KHCO3"), HCO3: MM("HCO3")/MM("KHCO3") },
  Na2CO3:{ Na:(2*M.Na)/MM("Na2CO3"), CO3: MM("CO3")/MM("Na2CO3") },
  K2CO3: { K:(2*M.K)/MM("K2CO3"), CO3: MM("CO3")/MM("K2CO3") },
  NaCl:  { Na:M.Na/MM("NaCl"), Cl:M.Cl/MM("NaCl") },
  KCl:   { K:M.K/MM("KCl"), Cl:M.Cl/MM("KCl") },
  Na2SO4:{ Na:(2*M.Na)/MM("Na2SO4"), SO4:MM("SO4")/MM("Na2SO4") },
  K2SO4: { K:(2*M.K)/MM("K2SO4"), SO4:MM("SO4")/MM("K2SO4") },
  "Na3C6H5O7·2H2O": { Na:(3*M.Na)/MM("Na3C6H5O7·2H2O") }
};
const SALT_CATALOG = Object.keys(FRACTIONS);
const EQW = { Ca: M.Ca/2, Mg: M.Mg/2, HCO3: 61.016, CO3:60.01 };
const PRESETS = [
  { name:"SCA mid", kind:"caco3", GH:75, Alk:40, CaShare:0.6, Sal:0 },
  { name:"Rao-style brew", kind:"caco3", GH:50, Alk:20, CaShare:0.3, Sal:0 },
  { name:"Low TDS filter", kind:"caco3", GH:40, Alk:20, CaShare:0.5, Sal:0 },
  { name:"Classic espresso", kind:"caco3", GH:120, Alk:50, CaShare:0.7, Sal:0 },
];
function frac(salt, ion){ return (FRACTIONS[salt]||{})[ion]||0; }
function nnls(A,b,maxIt=6000,lr=2e-4){
  const m=A.length, n=A[0].length; let x=new Array(n).fill(0);
  for(let it=0; it<maxIt; it++){
    const Ax=new Array(m).fill(0);
    for(let i=0;i<m;i++){ let s=0; for(let j=0;j<n;j++) s+=A[i][j]*x[j]; Ax[i]=s; }
    const grad=new Array(n).fill(0);
    for(let j=0;j<n;j++){ let s=0; for(let i=0;i<m;i++) s+=A[i][j]*(Ax[i]-b[i]); grad[j]=2*s; }
    let diff=0;
    for(let j=0;j<n;j++){ const nx=Math.max(0,x[j]-lr*grad[j]); diff=Math.max(diff,Math.abs(nx-x[j])); x[j]=nx; }
    if(diff<1e-9) break;
  }
  return x;
}
const Num = (n)=> Number.isFinite(n) ? (Math.abs(n)>=1? n.toFixed(2) : n.toFixed(4)) : "";
function App(){
  const [unitMode, setUnitMode] = useState("caco3");
  const [concDose, setConcDose] = useState(1), [concBottle, setConcBottle] = useState(1);
  const [conc, setConc] = useState({ GH:100, Alk:40, CaShare:0.7, Sal:0, SalSalt:"NaCl" });
  const concIons = React.useMemo(()=> unitMode==="caco3"? {
    Ca:(conc.GH*conc.CaShare)*(EQW.Ca/50),
    Mg:(conc.GH*(1-conc.CaShare))*(EQW.Mg/50),
    HCO3: conc.Alk*EQW.HCO3/50
  } : {Ca:0,Mg:0,HCO3:0}, [conc, unitMode]);
  const conc_gL = React.useMemo(()=>{
    const scale=concDose/1000, need={
      Ca: concIons.Ca/scale/1000, Mg: concIons.Mg/scale/1000, HCO3: concIons.HCO3/scale/1000, Sal: conc.Sal/scale/1000
    };
    return {
      Ca: need.Ca/Math.max(frac("CaCl2·2H2O","Ca"),1e-12),
      Mg: need.Mg/Math.max(frac("MgSO4·7H2O","Mg"),1e-12),
      Alk: need.HCO3/Math.max(frac("NaHCO3","HCO3"),1e-12),
      Sal: need.Sal
    };
  },[concIons, concDose, conc.Sal]);
  const [batchL, setBatchL] = useState(1);
  const [dir, setDir] = useState({ GH:100, Alk:40, CaShare:0.7, Sal:0, SalSalt:"NaCl" });
  const dirIons = React.useMemo(()=> unitMode==="caco3" ? {
    Ca:(dir.GH*dir.CaShare)*(EQW.Ca/50),
    Mg:(dir.GH*(1-dir.CaShare))*(EQW.Mg/50),
    HCO3: dir.Alk*EQW.HCO3/50
  } : {Ca:0,Mg:0,HCO3:0}, [dir, unitMode]);
  const dir_gL = React.useMemo(()=> ({
    Ca:(dirIons.Ca/1000)/Math.max(frac("CaCl2·2H2O","Ca"),1e-12),
    Mg:(dirIons.Mg/1000)/Math.max(frac("MgSO4·7H2O","Mg"),1e-12),
    Alk:(dirIons.HCO3/1000)/Math.max(frac("NaHCO3","HCO3"),1e-12),
    Sal: dir.Sal/1000
  }),[dirIons, dir.Sal]);
  const ionList=["Ca","Mg","Na","K","HCO3","Cl","SO4"];
  const [targets, setTargets] = useState({ Ca:20, Mg:5, Na:0, K:0, HCO3:50, Cl:0, SO4:0 });
  const [solverL, setSolverL] = useState(1);
  const [allowedSalts, setAllowedSalts] = useState(SALT_CATALOG);
  const A = React.useMemo(()=> ionList.map(ion => allowedSalts.map(s => 1000*((FRACTIONS[s]||{})[ion]||0))), [allowedSalts]);
  const b_mass = React.useMemo(()=> ionList.map(ion => targets[ion]||0), [targets]);
  const b_caco3 = React.useMemo(()=> { const o={...targets};
    o.Ca=(targets.Ca||0)*(EQW.Ca/50); o.Mg=(targets.Mg||0)*(EQW.Mg/50); o.HCO3=(targets.HCO3||0)*(EQW.HCO3/50);
    return ionList.map(i=> o[i]||0);
  },[targets]);
  const b = unitMode==="caco3"? b_caco3 : b_mass;
  const x_gL = React.useMemo(()=> nnls(A,b), [A,b]);
  const gramsSolved = React.useMemo(()=> x_gL.map(v=> v*solverL), [x_gL, solverL]);
  const [dose, setDose] = useState({ Ca:1, Mg:1, Alk:1, Sal:0 }), [stockBottle, setStockBottle] = useState(1);
  const [st, setSt] = useState({ GH:100, Alk:40, CaShare:0.7, Sal:0 });
  const stIons = React.useMemo(()=> unitMode==="caco3" ? {
    Ca:(st.GH*st.CaShare)*(EQW.Ca/50),
    Mg:(st.GH*(1-st.CaShare))*(EQW.Mg/50),
    HCO3: st.Alk*EQW.HCO3/50
  } : {Ca:0,Mg:0,HCO3:0}, [st, unitMode]);
  const stock_gL = React.useMemo(()=> ({
    Ca:(stIons.Ca/1000)/Math.max(frac("CaCl2·2H2O","Ca"),1e-12)/Math.max(dose.Ca,1e-9)*1000,
    Mg:(stIons.Mg/1000)/Math.max(frac("MgSO4·7H2O","Mg"),1e-12)/Math.max(dose.Mg,1e-9)*1000,
    Alk:(stIons.HCO3/1000)/Math.max(frac("NaHCO3","HCO3"),1e-12)/Math.max(dose.Alk,1e-9)*1000,
    Sal:(st.Sal/1000)/Math.max(dose.Sal,1e-9)*1000
  }),[stIons, dose, st.Sal]);
  const stock_grams = React.useMemo(()=> ({ Ca:stock_gL.Ca*stockBottle, Mg:stock_gL.Mg*stockBottle, Alk:stock_gL.Alk*stockBottle, Sal:stock_gL.Sal*stockBottle }), [stock_gL, stockBottle]);
  function applyPreset(p){
    setDir(d=>({...d, GH:p.GH, Alk:p.Alk, CaShare:p.CaShare, Sal:p.Sal}));
    setConc(c=>({...c, GH:p.GH, Alk:p.Alk, CaShare:p.CaShare, Sal:p.Sal}));
    setTargets(t=>({...t, Ca:p.GH*(p.CaShare??0.6), Mg:p.GH*(1-(p.CaShare??0.6)), HCO3:p.Alk }));
    setUnitMode(p.kind);
  }
  return (<div>
    <header className="toolbar">
      <div><h1>Coffee Water – Pro Mineral Calculator</h1><div className="sub">Color‑safe palette. Dark‑mode ready. Works offline.</div></div>
      <div className="row">
        <label className="pill"><span style={{paddingRight:8,fontWeight:700}}>Units</span>
          <select className="input" value={unitMode} onChange={e=>setUnitMode(e.target.value)}>
            <option value="caco3">ppm as CaCO₃</option><option value="mass">mg/L by ion</option>
          </select>
        </label>
      </div>
    </header>
    <section className="card" style={{marginTop:12}}>
      <span className="title">Presets</span>
      <div className="row" style={{marginTop:10, flexWrap:"wrap"}}>
        {PRESETS.map(p=>(<button key={p.name} className="btn" onClick={()=>applyPreset(p)}>{p.name}</button>))}
      </div>
    </section>
    <section className="card" style={{marginTop:12}}>
      <span className="title">1) Build a Concentrate</span>
      <div className="grid grid-5" style={{marginTop:12}}>
        <Field label="Dose (mL per 1.00 L water)" val={concDose} setVal={setConcDose} step="0.1"/>
        <Field label="Concentrate bottle size (L)" val={concBottle} setVal={setConcBottle} step="0.1"/>
        <Field label="Target GH (as CaCO₃)" val={conc.GH} setVal={v=>setConc({...conc, GH:v})}/>
        <Field label="Target Alkalinity (as CaCO₃)" val={conc.Alk} setVal={v=>setConc({...conc, Alk:v})}/>
        <Field label="Calcium share of GH (0–1)" val={conc.CaShare} setVal={v=>setConc({...conc, CaShare:v})} step="0.05"/>
      </div>
      <div className="grid grid-3" style={{marginTop:12}}>
        <Select label="Salinity salt" val={conc.SalSalt} setVal={v=>setConc({...conc, SalSalt:v})} opts={["NaCl","KCl"]}/>
        <Field label="Salinity target (mg/L as salt)" val={conc.Sal} setVal={v=>setConc({...conc, Sal:v})}/>
      </div>
      <div style={{overflowX:"auto", marginTop:12}}>
        <table><thead><tr><th>Component</th><th>Salt</th><th>g/L (concentrate)</th><th>Grams for bottle</th></tr></thead>
          <tbody>
            <Row cells={["Calcium","CaCl2·2H2O", Num(conc_gL.Ca), Num(conc_gL.Ca*concBottle)]}/>
            <Row cells={["Magnesium","MgSO4·7H2O", Num(conc_gL.Mg), Num(conc_gL.Mg*concBottle)]}/>
            <Row cells={["Alkalinity","NaHCO3", Num(conc_gL.Alk), Num(conc_gL.Alk*concBottle)]}/>
            <Row cells={["Salinity", conc.SalSalt, Num(conc_gL.Sal), Num(conc_gL.Sal*concBottle)]}/>
          </tbody></table>
      </div>
    </section>
    <section className="card" style={{marginTop:12}}>
      <span className="title">2) Direct Salts Into a Batch</span>
      <div className="grid grid-5" style={{marginTop:12}}>
        <Field label="Batch size (L)" val={batchL} setVal={setBatchL} step="0.1"/>
        <Field label="Target GH (as CaCO₃)" val={dir.GH} setVal={v=>setDir({...dir, GH:v})}/>
        <Field label="Target Alkalinity (as CaCO₃)" val={dir.Alk} setVal={v=>setDir({...dir, Alk:v})}/>
        <Field label="Calcium share of GH (0–1)" val={dir.CaShare} setVal={v=>setDir({...dir, CaShare:v})} step="0.05"/>
        <Select label="Salinity salt" val={dir.SalSalt} setVal={v=>setDir({...dir, SalSalt:v})} opts={["NaCl","KCl"]}/>
      </div>
      <div style={{overflowX:"auto", marginTop:12}}>
        <table><thead><tr><th>Component</th><th>Salt</th><th>g / L</th><th>g for batch</th></tr></thead>
          <tbody>
            <Row cells={["Calcium","CaCl2·2H2O", Num(dir_gL.Ca), Num(dir_gL.Ca*batchL)]}/>
            <Row cells={["Magnesium","MgSO4·7H2O", Num(dir_gL.Mg), Num(dir_gL.Mg*batchL)]}/>
            <Row cells={["Alkalinity","NaHCO3", Num(dir_gL.Alk), Num(dir_gL.Alk*batchL)]}/>
            <Row cells={["Salinity",dir.SalSalt, Num(dir_gL.Sal), Num(dir_gL.Sal*batchL)]}/>
          </tbody></table>
      </div>
    </section>
    <section className="card" style={{marginTop:12}}>
      <span className="title">3) Ion Solver</span>
      <div className="grid grid-4" style={{marginTop:12}}>
        {["Ca","Mg","Na","K","HCO3","Cl","SO4"].map(k=>(
          <Field key={k} label={`${k} target (${(unitMode==="caco3"&&(k==="Ca"||k==="Mg"||k==="HCO3"))?"as CaCO₃":"mg/L"})`} val={targets[k]||0} setVal={v=>setTargets({...targets,[k]:v})}/>
        ))}
        <Field label="Batch size (L)" val={solverL} setVal={setSolverL} step="0.1"/>
      </div>
      <div className="card" style={{marginTop:12}}>
        <div className="row" style={{marginBottom:8, alignItems:"center"}}><strong>Allowed salts for solver:</strong><small>&nbsp;(toggle any)</small></div>
        <div className="grid grid-4">
          {SALT_CATALOG.map(s=>(<label key={s} className="row" style={{alignItems:"center"}}>
            <input type="checkbox" checked={allowedSalts.includes(s)} onChange={(e)=>{
              setAllowedSalts(prev=> e.target.checked? [...prev,s] : prev.filter(x=>x!==s));
            }}/><span>{s}</span></label>))}
        </div>
      </div>
      <div style={{overflowX:"auto", marginTop:12}}>
        <table><thead><tr><th>Salt</th><th>g / L</th><th>g for batch</th></tr></thead>
          <tbody>{allowedSalts.map((s,j)=>(<Row key={s} cells={[s, Num(x_gL[j]), Num(gramsSolved[j])]} />))}</tbody>
        </table>
      </div>
    </section>
    <section className="card" style={{marginTop:12}}>
      <span className="title">4) Back‑Calculate Stock Strengths</span>
      <div className="grid grid-5" style={{marginTop:12}}>
        <Field label="Dose Ca stock (mL/L)" val={dose.Ca} setVal={v=>setDose({...dose, Ca:v})} step="0.1"/>
        <Field label="Dose Mg stock (mL/L)" val={dose.Mg} setVal={v=>setDose({...dose, Mg:v})} step="0.1"/>
        <Field label="Dose Alk stock (mL/L)" val={dose.Alk} setVal={v=>setDose({...dose, Alk:v})} step="0.1"/>
        <Field label="Dose Sal stock (mL/L)" val={dose.Sal} setVal={v=>setDose({...dose, Sal:v})} step="0.1"/>
        <Field label="Stock bottle size (L)" val={stockBottle} setVal={setStockBottle} step="0.1"/>
      </div>
      <div className="grid grid-4" style={{marginTop:12}}>
        <Field label="Target GH (as CaCO₃)" val={st.GH} setVal={v=>setSt({...st, GH:v})}/>
        <Field label="Target Alkalinity (as CaCO₃)" val={st.Alk} setVal={v=>setSt({...st, Alk:v})}/>
        <Field label="Calcium share of GH (0–1)" val={st.CaShare} setVal={v=>setSt({...st, CaShare:v})} step="0.05"/>
        <Field label="Salinity target (mg/L as salt)" val={st.Sal} setVal={v=>setSt({...st, Sal:v})}/>
      </div>
      <div style={{overflowX:"auto", marginTop:12}}>
        <table><thead><tr><th>Stock</th><th>Required strength (g/L)</th><th>Grams for bottle</th></tr></thead>
          <tbody>
            <Row cells={["Ca (CaCl2·2H2O)", Num(stock_gL.Ca), Num(stock_grams.Ca)]}/>
            <Row cells={["Mg (MgSO4·7H2O)", Num(stock_gL.Mg), Num(stock_grams.Mg)]}/>
            <Row cells={["Alk (NaHCO3)", Num(stock_gL.Alk), Num(stock_grams.Alk)]}/>
            <Row cells={["Salinity (selected salt)", Num(stock_gL.Sal), Num(stock_grams.Sal)]}/>
          </tbody></table>
      </div>
    </section>
  </div>);
}
function Field({label,val,setVal,step}){return(<div><div className="label">{label}</div><input className="input" type="number" step={step||1} value={val} onChange={e=>setVal(+e.target.value)} /></div>);}
function Select({label,val,setVal,opts}){return(<div><div className="label">{label}</div><select className="input" value={val} onChange={e=>setVal(e.target.value)}>{opts.map(o=><option key={o} value={o}>{o}</option>)}</select></div>);}
function Row({cells}){return <tr>{cells.map((c,i)=><td key={i}>{c}</td>)}</tr>;}
ReactDOM.createRoot(document.getElementById('app')).render(React.createElement(App));
  