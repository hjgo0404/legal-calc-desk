(function(){
"use strict";
/* ---------- date utils ---------- */
const DOW=["일","월","화","수","목","금","토"];
const D=(y,m,d)=>new Date(y,m-1,d,12);
const parse=s=>{if(!s)return null;const[a,b,c]=s.split("-").map(Number);return D(a,b,c)};
const key=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const fmt=d=>`${d.getFullYear()}. ${d.getMonth()+1}. ${d.getDate()}. (${DOW[d.getDay()]})`;
const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
const dim=(y,m0)=>new Date(y,m0+1,0).getDate();
const diffDays=(a,b)=>Math.round((b-a)/864e5);
const today=()=>{const t=new Date();return D(t.getFullYear(),t.getMonth()+1,t.getDate())};
/* months period from start day (start counted as day 1) */
function monthsEnd(start,n){
  const y=start.getFullYear(),m0=start.getMonth()+n,ty=y+Math.floor(m0/12),tm=((m0%12)+12)%12;
  if(start.getDate()>dim(ty,tm))return new Date(ty,tm,dim(ty,tm),12);
  return addDays(new Date(ty,tm,start.getDate(),12),-1);
}

/* ---------- holidays 2025–2027 ---------- */
const HOL={
"2025-01-01":"신정","2025-01-27":"임시공휴일","2025-01-28":"설날 연휴","2025-01-29":"설날","2025-01-30":"설날 연휴","2025-03-01":"삼일절","2025-03-03":"대체공휴일","2025-05-05":"어린이날·부처님오신날","2025-05-06":"대체공휴일","2025-06-03":"대통령선거일","2025-06-06":"현충일","2025-08-15":"광복절","2025-10-03":"개천절","2025-10-05":"추석 연휴","2025-10-06":"추석","2025-10-07":"추석 연휴","2025-10-08":"대체공휴일","2025-10-09":"한글날","2025-12-25":"성탄절",
"2026-01-01":"신정","2026-02-16":"설날 연휴","2026-02-17":"설날","2026-02-18":"설날 연휴","2026-03-01":"삼일절","2026-03-02":"대체공휴일","2026-05-01":"노동절","2026-05-05":"어린이날","2026-05-24":"부처님오신날","2026-05-25":"대체공휴일","2026-06-03":"지방선거일","2026-06-06":"현충일","2026-07-17":"제헌절","2026-08-15":"광복절","2026-08-17":"대체공휴일","2026-09-24":"추석 연휴","2026-09-25":"추석","2026-09-26":"추석 연휴","2026-10-03":"개천절","2026-10-05":"대체공휴일","2026-10-09":"한글날","2026-12-25":"성탄절",
"2027-01-01":"신정","2027-02-06":"설날 연휴","2027-02-07":"설날","2027-02-08":"설날 연휴","2027-02-09":"대체공휴일","2027-03-01":"삼일절","2027-05-01":"노동절","2027-05-03":"대체공휴일","2027-05-05":"어린이날","2027-05-13":"부처님오신날","2027-06-06":"현충일","2027-07-17":"제헌절","2027-07-19":"대체공휴일","2027-08-15":"광복절","2027-08-16":"대체공휴일","2027-09-14":"추석 연휴","2027-09-15":"추석","2027-09-16":"추석 연휴","2027-10-03":"개천절","2027-10-04":"대체공휴일","2027-10-09":"한글날","2027-10-11":"대체공휴일","2027-12-25":"성탄절","2027-12-27":"대체공휴일"};
const isOff=d=>d.getDay()===0||d.getDay()===6||!!HOL[key(d)];
const offName=d=>HOL[key(d)]||(d.getDay()===6?"토요일":d.getDay()===0?"일요일":"");
const covered=d=>d.getFullYear()>=2025&&d.getFullYear()<=2027;

/* ---------- procedures ---------- */
const CATS=[["civ","민사"],["cr","형사"],["ad","행정"],["fa","가사·상속"],["direct","직접 입력"]];
const P=[
 {id:"civ-appeal",c:"civ",t:"항소",n:14,u:"d",lbl:"2주",from:"판결서를 송달받은 날",law:"민사소송법 제396조",inv:1,srv:1},
 {id:"civ-appeal-brief",c:"civ",t:"항소이유서 제출",n:40,u:"d",lbl:"40일",from:"항소기록접수 통지를 받은 날",law:"민사소송법 제402조의2",ext:1},
 {id:"civ-final",c:"civ",t:"상고",n:14,u:"d",lbl:"2주",from:"판결서를 송달받은 날",law:"민사소송법 제425조·제396조",inv:1,srv:1},
 {id:"civ-final-brief",c:"civ",t:"상고이유서 제출",n:20,u:"d",lbl:"20일",from:"상고기록접수 통지를 받은 날",law:"민사소송법 제427조"},
 {id:"civ-imm",c:"civ",t:"즉시항고",n:7,u:"d",lbl:"1주",from:"재판을 고지받은 날",law:"민사소송법 제444조",inv:1},
 {id:"civ-payorder",c:"civ",t:"지급명령 이의신청",n:14,u:"d",lbl:"2주",from:"지급명령을 송달받은 날",law:"민사소송법 제470조",inv:1,srv:1},
 {id:"civ-recon",c:"civ",t:"화해권고결정 이의신청",n:14,u:"d",lbl:"2주",from:"결정서 정본을 송달받은 날",law:"민사소송법 제226조",inv:1,srv:1},
 {id:"civ-med",c:"civ",t:"조정을 갈음하는 결정 이의신청",n:14,u:"d",lbl:"2주",from:"조서 정본을 송달받은 날",law:"민사조정법 제34조",inv:1,srv:1},
 {id:"civ-small",c:"civ",t:"이행권고결정 이의신청",n:14,u:"d",lbl:"2주",from:"결정서 등본을 송달받은 날",law:"소액사건심판법 제5조의4",inv:1,srv:1},
 {id:"civ-answer",c:"civ",t:"답변서 제출",n:30,u:"d",lbl:"30일",from:"소장 부본을 송달받은 날",law:"민사소송법 제256조",srv:1},
 {id:"civ-cure",c:"civ",t:"추후보완",n:14,u:"d",lbl:"2주 (외국 30일)",from:"책임질 수 없는 사유가 없어진 날",law:"민사소송법 제173조",foreign:1},
 {id:"civ-retrial",c:"civ",t:"재심의 소",n:30,u:"d",lbl:"30일",from:"판결 확정 뒤 재심사유를 안 날",law:"민사소송법 제456조",inv:1},
 {id:"cr-appeal",c:"cr",t:"항소",n:7,u:"d",lbl:"7일",from:"판결을 선고한 날",law:"형사소송법 제358조"},
 {id:"cr-appeal-brief",c:"cr",t:"항소이유서 제출",n:20,u:"d",lbl:"20일",from:"소송기록접수 통지를 받은 날",law:"형사소송법 제361조의3"},
 {id:"cr-final",c:"cr",t:"상고",n:7,u:"d",lbl:"7일",from:"판결을 선고한 날",law:"형사소송법 제374조"},
 {id:"cr-final-brief",c:"cr",t:"상고이유서 제출",n:20,u:"d",lbl:"20일",from:"소송기록접수 통지를 받은 날",law:"형사소송법 제379조"},
 {id:"cr-imm",c:"cr",t:"즉시항고",n:7,u:"d",lbl:"7일",from:"결정을 고지받은 날",law:"형사소송법 제405조"},
 {id:"cr-summary",c:"cr",t:"정식재판청구",n:7,u:"d",lbl:"7일",from:"약식명령을 고지(송달)받은 날",law:"형사소송법 제453조"},
 {id:"cr-retrial",c:"cr",t:"재심청구",none:1,lbl:"기한 없음",from:"형의 집행이 끝난 뒤에도 가능",law:"형사소송법 제427조"},
 {id:"ad-know",c:"ad",t:"취소소송 (안 날부터)",n:90,u:"d",lbl:"90일",from:"처분이 있음을 안 날",law:"행정소송법 제20조 제1항",inv:1},
 {id:"ad-was",c:"ad",t:"취소소송 (있은 날부터)",n:1,u:"y",lbl:"1년",from:"처분이 있은 날",law:"행정소송법 제20조 제2항"},
 {id:"ad-after",c:"ad",t:"행정심판·소청 뒤 취소소송",n:90,u:"d",lbl:"90일",from:"재결서 정본을 송달받은 날",law:"행정소송법 제20조 제1항 단서",srv:1},
 {id:"ad-trial-know",c:"ad",t:"행정심판 청구 (안 날부터)",n:90,u:"d",lbl:"90일",from:"처분이 있음을 알게 된 날",law:"행정심판법 제27조 제1항"},
 {id:"ad-trial-was",c:"ad",t:"행정심판 청구 (있었던 날부터)",n:180,u:"d",lbl:"180일",from:"처분이 있었던 날",law:"행정심판법 제27조 제3항"},
 {id:"ad-land-obj",c:"ad",t:"토지 수용재결 이의신청",n:30,u:"d",lbl:"30일",from:"재결서 정본을 받은 날",law:"토지보상법 제83조 제3항"},
 {id:"ad-land-suit",c:"ad",t:"수용재결 불복 행정소송",n:90,u:"d",lbl:"90일",from:"재결서를 받은 날",law:"토지보상법 제85조 제1항"},
 {id:"ad-land-suit2",c:"ad",t:"이의재결 불복 행정소송",n:60,u:"d",lbl:"60일",from:"이의신청에 대한 재결서를 받은 날",law:"토지보상법 제85조 제1항"},
 {id:"ad-teacher",c:"ad",t:"교원소청 결정 불복 소송",n:30,u:"d",lbl:"30일",from:"결정서를 송달받은 날",law:"교원지위법 제10조 제4항",srv:1},
 {id:"fa-appeal",c:"fa",t:"가사소송 판결 항소",n:14,u:"d",lbl:"14일",from:"판결정본을 송달받은 날",law:"가사소송법 제19조",inv:1,srv:1},
 {id:"fa-renounce",c:"fa",t:"상속포기 · 한정승인",n:3,u:"m",lbl:"3개월",from:"상속개시가 있음을 안 날",law:"민법 제1019조 제1항"},
 {id:"fa-special",c:"fa",t:"특별한정승인",n:3,u:"m",lbl:"3개월",from:"상속채무 초과 사실을 안 날",law:"민법 제1019조 제3항"},
 {id:"fa-division",c:"fa",t:"재산분할 청구",n:2,u:"y",lbl:"2년",from:"이혼한 날",law:"민법 제839조의2 제3항"},
 {id:"fa-reserve",c:"fa",t:"유류분 반환청구",n:1,u:"y",lbl:"1년",from:"상속 개시와 반환할 증여·유증을 안 날",law:"민법 제1117조"}
];
const byId=id=>P.find(p=>p.id===id);

/* ---------- storage ---------- */
const LS={get(k,f){try{const v=localStorage.getItem(k);return v?JSON.parse(v):f}catch(e){return f}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};

/* ---------- state ---------- */
const $=s=>document.querySelector(s);
let cat="civ", procId="civ-appeal", calMonth=null, lastResult=null;
const st=LS.get("ld-state",null);
if(st&&byId(st.p)){procId=st.p;cat=byId(st.p).c}else if(st&&st.p==="direct"){procId="direct";cat="direct"}
$("#baseDate").value=key(addDays(today(),-7));

function renderChips(){
  $("#catChips").innerHTML=CATS.map(([k,v])=>`<button type="button" class="chip" data-c="${k}" aria-pressed="${k===cat}">${v}</button>`).join("");
}
function renderProcSel(){
  const sel=$("#procSel");
  if(cat==="direct"){sel.hidden=true;$("#directBox").hidden=false}
  else{sel.hidden=false;$("#directBox").hidden=true;
    sel.innerHTML=P.filter(p=>p.c===cat).map(p=>`<option value="${p.id}" ${p.id===procId?"selected":""}>${p.t} · ${p.lbl}</option>`).join("");
    if(!byId(procId)||byId(procId).c!==cat){procId=sel.value}
  }
  renderProcOpts();
}
function renderProcOpts(){
  const p=cat==="direct"?null:byId(procId);
  let h="";
  if(p){
    $("#baseLabel").textContent=p.from;
    if(p.ext||p.srv||p.foreign){
      h+=`<div class="opt">`;
      if(p.ext)h+=`<label class="check"><input type="checkbox" id="oExt">1개월 연장 신청이 받아들여졌습니다 (40일째부터 1개월, 대법원 2025마9429)</label>`;
      if(p.foreign)h+=`<label class="check"><input type="checkbox" id="oForeign">외국에 있던 당사자입니다 (30일)</label>`;
      if(p.srv)h+=`<label class="check"><input type="checkbox" id="oEsrv">전자소송에서 1주 안에 열어 보지 않았습니다 (송달 간주)</label><label class="f" id="oNoticeWrap" hidden>등재 통지를 받은 날<input type="date" id="oNotice"></label>`;
      h+=`</div>`;
    }
  }else{$("#baseLabel").textContent="기준일"}
  $("#procOpts").innerHTML=h;
}

function compute(){
  const base=parse($("#baseDate").value);
  const r={lines:[],warn:[]};
  let p=cat==="direct"?null:byId(procId);
  if(p&&p.none){r.none=1;r.p=p;return r}
  let n,u,incFirst=false,extend=true,title,law="",inv=false;
  if(p){n=p.n;u=p.u;title=`${CATS.find(c=>c[0]===p.c)[1]} ${p.t}`;law=p.law;inv=!!p.inv;
    if(p.foreign&&$("#oForeign")?.checked){n=30;r.lines.push("외국 거주자: 30일 적용")}
  }else{n=Math.max(1,parseInt($("#dN").value)||1);u=$("#dU").value;incFirst=$("#dFirst").checked;extend=!$("#dNoExt").checked;
    title=`직접 입력 ${n}${{d:"일",w:"주",m:"개월",y:"년"}[u]}`}
  let b=base;
  if(p&&p.srv&&$("#oEsrv")?.checked){
    const nt=parse($("#oNotice")?.value);
    if(!nt){r.need="등재 통지를 받은 날을 넣어 주세요.";return r}
    b=addDays(nt,7);
    r.lines.push(`송달 간주: ${fmt(addDays(nt,8))} 오전 0시 (통지일 다음 날부터 7일 경과, 그날부터 기간 산입)`);
  }
  if(!b){r.need="기준일을 넣거나 달력에서 날짜를 누르세요.";return r}
  const start=incFirst?b:addDays(b,1);
  let end;
  if(u==="d")end=addDays(start,n-1);else if(u==="w")end=addDays(start,n*7-1);else if(u==="m")end=monthsEnd(start,n);else end=monthsEnd(start,n*12);
  r.lines.unshift(`기산일 ${fmt(start)}${incFirst?" (첫날 산입)":" (첫날 불산입)"}`);
  if(p&&p.ext&&$("#oExt")?.checked){
    r.lines.push(`40일째 ${fmt(end)} → 그다음 날부터 1개월 연장`);
    end=monthsEnd(addDays(end,1),1);
  }
  const raw=end;
  if(extend){while(isOff(end))end=addDays(end,1)}
  if(+raw!==+end)r.lines.push(`말일 ${fmt(raw)}은 ${offName(raw)} → 다음 평일로 연장`);
  else if(!extend&&isOff(raw))r.lines.push(`말일이 ${offName(raw)}이지만 연장하지 않음`);
  if(!covered(raw)||!covered(end))r.warn.push("2025~2027년 밖의 날짜가 걸립니다. 그해 공휴일은 반영되지 않았으니 달력으로 확인하세요.");
  Object.assign(r,{end,base:b,start,title,law,inv,p});
  return r;
}

function ddayInfo(end){
  const d=diffDays(today(),end);
  if(d<0)return{t:`${-d}일 지남`,c:"past"};
  if(d===0)return{t:"오늘 마감",c:"urgent"};
  return{t:`D-${d}`,c:d<=3?"urgent":""};
}

function renderResult(){
  const r=compute();lastResult=r;
  const el=$("#dlResult");
  LS.set("ld-state",{p:cat==="direct"?"direct":procId});
  if(r.none){el.innerHTML=`<div class="result"><div class="res-kicker">${r.p.t}</div><div class="res-date">기한 없음</div><ul class="res-lines"><li>${r.p.from}</li><li>근거 ${r.p.law}</li></ul></div>`;renderCal();return}
  if(r.need){el.innerHTML=`<div class="result"><div class="res-kicker">마감일</div><div class="res-date" style="color:var(--muted)">—</div><p class="small-note">${r.need}</p></div>`;renderCal();return}
  const dd=ddayInfo(r.end);
  el.innerHTML=`<div class="result">
    <div class="res-kicker">${r.title}${r.inv?'<span class="badge strong">불변기간</span>':""}</div>
    <div><div class="res-date num">${fmt(r.end)}</div><div style="margin-top:8px;display:flex;gap:8px;align-items:center;flex-wrap:wrap"><span class="dday ${dd.c} num">${dd.t}</span><span class="small-note">이날 24시까지</span></div></div>
    <ul class="res-lines num">${r.lines.map(l=>`<li>${l}</li>`).join("")}${r.law?`<li>근거 ${r.law}</li>`:""}</ul>
    ${r.warn.map(w=>`<div class="warnbox">${w}</div>`).join("")}
    <label class="f">사건명 메모 (저장용)<input type="text" id="memo" placeholder="예: 2026가합1234 김○○"></label>
    <div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn" id="saveDl">내 기한에 추가</button><button type="button" class="btn ghost" id="copyDl">결과 복사</button></div>
  </div>`;
  calMonth=calMonth||[r.end.getFullYear(),r.end.getMonth()];
  renderCal();
}

function renderCal(){
  const base=parse($("#baseDate").value)||today();
  if(!calMonth)calMonth=[base.getFullYear(),base.getMonth()];
  const [y,m0]=calMonth;const first=new Date(y,m0,1,12);const s=addDays(first,-first.getDay());
  const tk=key(today()),bk=lastResult&&lastResult.base?key(lastResult.base):$("#baseDate").value,ek=lastResult&&lastResult.end?key(lastResult.end):"";
  let cells="";
  for(let i=0;i<42;i++){const d=addDays(s,i),k=key(d);
    const cls=[d.getMonth()!==m0?"other":"",isOff(d)?"off":"",k===bk?"base":"",k===ek?"dead":"",k===tk?"today":""].join(" ");
    cells+=`<button type="button" class="${cls}" data-d="${k}" title="${HOL[k]||""}" aria-label="${fmt(d)}${HOL[k]?" "+HOL[k]:""}">${d.getDate()}</button>`}
  $("#cal").innerHTML=`<div class="cal-head"><button type="button" data-cm="-1" aria-label="이전 달">‹</button><span class="num">${y}년 ${m0+1}월</span><button type="button" data-cm="1" aria-label="다음 달">›</button></div>
  <div class="cal-grid">${DOW.map(w=>`<div class="dow">${w}</div>`).join("")}${cells}</div>
  <div class="cal-legend"><span><i style="outline:1.5px solid var(--accent)"></i>기준일</span><span><i style="background:var(--btn)"></i>마감일</span><span style="color:var(--hol)">빨간 숫자 휴일</span><span>날짜를 누르면 기준일로</span></div>`;
}

function renderTable(){
  $("#procTable").innerHTML=CATS.filter(c=>c[0]!=="direct").map(([k,v])=>`<tr><td colspan="4" class="tcat">${v}</td></tr>`+P.filter(p=>p.c===k).map(p=>`<tr class="click" data-p="${p.id}" tabindex="0"><td>${p.t}${p.inv?'<span class="badge">불변</span>':""}</td><td class="num">${p.lbl}${p.ext?" · 연장 1개월":""}</td><td>${p.from}</td><td>${p.law}</td></tr>`).join("")).join("");
}

/* events */
document.addEventListener("click",e=>{
  const c=e.target.closest("[data-c]");if(c){cat=c.dataset.c;if(cat!=="direct")procId=P.find(p=>p.c===cat).id;renderChips();renderProcSel();renderResult();return}
  const q=e.target.closest("[data-q]");if(q){$("#baseDate").value=key(addDays(today(),+q.dataset.q));calMonth=null;renderResult();return}
  const cm=e.target.closest("[data-cm]");if(cm){let[y,m]=calMonth;m+=+cm.dataset.cm;if(m<0){m=11;y--}if(m>11){m=0;y++}calMonth=[y,m];renderCal();return}
  const cd=e.target.closest(".cal-grid button");if(cd){$("#baseDate").value=cd.dataset.d;const keep=calMonth;renderResult();calMonth=keep;renderCal();return}
  const tr=e.target.closest("tr[data-p]");if(tr){selectProc(tr.dataset.p);return}
  if(e.target.id==="saveDl")saveDeadline();
  if(e.target.id==="copyDl")copyText(resultText(),"결과를 복사했습니다");
});
document.addEventListener("keydown",e=>{const tr=e.target.closest&&e.target.closest("tr[data-p]");if(tr&&(e.key==="Enter"||e.key===" ")){e.preventDefault();selectProc(tr.dataset.p)}});
function selectProc(id){procId=id;cat=byId(id).c;renderChips();renderProcSel();calMonth=null;renderResult();$("#deadline").scrollIntoView({behavior:"smooth"})}
$("#procSel").addEventListener("change",e=>{procId=e.target.value;renderProcOpts();calMonth=null;renderResult()});
$("#baseDate").addEventListener("change",()=>{calMonth=null;renderResult()});
["dN","dU","dFirst","dNoExt"].forEach(id=>$("#"+id).addEventListener("input",()=>{calMonth=null;renderResult()}));
$("#procOpts").addEventListener("change",e=>{if(e.target.id==="oEsrv"){$("#oNoticeWrap").hidden=!e.target.checked;if(e.target.checked&&!$("#oNotice").value)$("#oNotice").value=$("#baseDate").value}calMonth=null;renderResult()});

function resultText(){const r=lastResult;if(!r||!r.end)return"";return`[${r.title}] 마감 ${fmt(r.end)} 24시\n${r.lines.join("\n")}${r.law?"\n근거 "+r.law:""}`}
function toast(t){const d=document.createElement("div");d.className="toast";d.textContent=t;document.body.appendChild(d);setTimeout(()=>d.remove(),1800)}
function copyText(t,msg){try{navigator.clipboard.writeText(t).then(()=>toast(msg),()=>fallbackCopy(t))}catch(e){fallbackCopy(t)}}
function fallbackCopy(t){const ta=document.createElement("textarea");ta.value=t;document.body.appendChild(ta);ta.select();try{document.execCommand("copy");toast("복사했습니다")}catch(e){toast("복사가 막혀 있습니다. 직접 선택해 주세요")}ta.remove()}

/* ---------- my deadlines ---------- */
let mine=LS.get("ld-mine",null);
if(!mine){mine=[{id:1,memo:"(예시) 2026가단5678 항소",t:"민사 항소",end:key(addDays(today(),5)),ex:1}];}
function saveDeadline(){const r=lastResult;if(!r||!r.end)return;mine.push({id:Date.now(),memo:($("#memo").value||"").trim()||r.title,t:r.title,end:key(r.end)});mine=mine.filter(x=>!x.ex);LS.set("ld-mine",mine);renderMine();toast("내 기한에 추가했습니다")}
function renderMine(){
  const list=[...mine].sort((a,b)=>a.end.localeCompare(b.end));
  $("#mine").innerHTML=list.length?list.map(x=>{const e=parse(x.end),dd=ddayInfo(e);return`<div class="mine-item"><div class="t">${esc(x.memo)}</div><div class="s num">${x.t} · ${fmt(e)}</div><div class="r"><span class="dday ${dd.c} num">${dd.t}</span><button type="button" class="del" data-del="${x.id}">삭제</button></div></div>`}).join(""):`<div class="empty">아직 저장한 기한이 없습니다. 마감일을 계산한 뒤 "내 기한에 추가"를 누르세요.</div>`;
}
$("#mine").addEventListener("click",e=>{const b=e.target.closest("[data-del]");if(!b)return;mine=mine.filter(x=>String(x.id)!==b.dataset.del);LS.set("ld-mine",mine);renderMine()});
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

function renderSide(){
  $("#todayTxt").textContent=fmt(today());
  const tk=key(today());
  const up=Object.keys(HOL).filter(k=>k>=tk).sort().slice(0,5);
  $("#holList").innerHTML=up.map(k=>{const d=parse(k);return`<li><span>${d.getMonth()+1}. ${d.getDate()}. (${DOW[d.getDay()]})</span><span>${HOL[k]}</span></li>`}).join("");
}

/* ================= 민사·가사 계산기 ================= */
const won=n=>(Math.round(n)).toLocaleString("ko-KR")+"원";
const v=id=>{const x=parseFloat(String(document.getElementById(id)?.value||"").replace(/,/g,""));return isFinite(x)?x:0};
function stampBase(x){if(x<=0)return 0;let s;if(x<1e7)s=x*0.005;else if(x<1e8)s=x*0.0045+5000;else if(x<1e9)s=x*0.004+55000;else s=x*0.0035+555000;return s}
const fin=s=>Math.max(1000,Math.floor(s/100)*100);
function lawyerFee(x){const T=[[3e6,0,3e5,0],[2e7,3e6,3e5,.10],[5e7,2e7,2e6,.08],[1e8,5e7,4.4e6,.06],[1.5e8,1e8,7.4e6,.04],[2e8,1.5e8,9.4e6,.02],[5e8,2e8,1.04e7,.01],[Infinity,5e8,1.34e7,.005]];for(const[lim,from,b,r]of T){if(x<=lim)return b+(x-from)*r}}
const CS=[[621000,752000,945000,1098000,1245000,1401000,1582000,1789000,1997000,2095000,2207000],[631000,759000,949000,1113000,1266000,1422000,1598000,1807000,2017000,2116000,2245000],[648000,767000,959000,1140000,1292000,1479000,1614000,1850000,2065000,2137000,2312000],[667000,782000,988000,1163000,1318000,1494000,1630000,1887000,2137000,2180000,2405000],[679000,790000,998000,1280000,1423000,1598000,1711000,1984000,2159000,2223000,2476000],[703000,957000,1227000,1402000,1604000,1794000,1964000,2163000,2246000,2540000,2883000]];
const BANDS=["0~199만원","200~299만원","300~399만원","400~499만원","500~599만원","600~699만원","700~799만원","800~899만원","900~999만원","1,000~1,199만원","1,200만원 이상"];
const bandIdx=m=>m<200?0:m<300?1:m<400?2:m<500?3:m<600?4:m<700?5:m<800?6:m<900?7:m<1000?8:m<1200?9:10;
const ageRow=a=>a<=2?0:a<=5?1:a<=8?2:a<=11?3:a<=14?4:5;
const AGE_L=["0~2세","3~5세","6~8세","9~11세","12~14세","15~18세"];
const ageAt=(b,d)=>{let a=d.getFullYear()-b.getFullYear();if(d.getMonth()<b.getMonth()||(d.getMonth()===b.getMonth()&&d.getDate()<b.getDate()))a--;return a};
function fracParse(s){s=String(s).trim();if(s.includes("/")){const[a,b]=s.split("/").map(Number);return b?a/b:0}const x=parseFloat(s);return isFinite(x)?(x>1?x/100:x):0}
const pct=x=>(x*100).toFixed(2).replace(/\.?0+$/,"")+"%";

const CALCS=[
 {grp:"소송비용"},
 {id:"stamp",t:"소장·상소 인지대",basis:"민사소송 등 인지법 제2조·제3조, 제7조 · 지급명령 1/10, 민사조정 1/5",
  form:`<label class="f">소송목적의 값 (소가)<div class="unit"><input type="number" id="s1" value="100000000"><span>원</span></div></label>
  <div class="grid2"><label class="f">절차<select id="s2"><option value="1">제1심 소장</option><option value="1.5">항소장 (1.5배)</option><option value="2">상고장 (2배)</option><option value="0.1">지급명령 신청 (1/10)</option><option value="0.2">민사조정 신청 (1/5)</option></select></label></div>
  <label class="check"><input type="checkbox" id="s3">전자소송으로 냅니다 (인지액 10% 감액)</label>`,
  run(){const x=v("s1"),m=+document.getElementById("s2").value,e=document.getElementById("s3").checked;const b=stampBase(x);let s=b*m;if(e)s*=0.9;const f=x>0?fin(s):0;
   return`<div class="res-kicker">납부할 인지액</div><div class="big num">${won(f)}</div><dl class="kv num"><dt>1심 기준 인지액</dt><dd>${won(Math.floor(b/100)*100)}</dd><dt>절차 배수</dt><dd>× ${m}</dd>${e?"<dt>전자소송 감액</dt><dd>× 0.9</dd>":""}<dt class="sum">인지액 (100원 미만 버림, 최저 1,000원)</dt><dd class="sum">${won(f)}</dd></dl><p class="small-note">항소·상고는 불복하는 범위의 금액을 소가로 넣으세요. 송달료는 별도입니다.</p>`}},
 {id:"fee",t:"소송비용 산입 변호사보수",basis:"변호사보수의 소송비용 산입에 관한 규칙 제3조 별표",
  form:`<label class="f">소송목적의 값 (소가)<div class="unit"><input type="number" id="f1" value="100000000"><span>원</span></div></label>
  <label class="f">실제 지급한 보수 (선택, 이보다 많이 산입되지 않음)<div class="unit"><input type="number" id="f2" placeholder="예: 5500000"><span>원</span></div></label>`,
  run(){const x=v("f1"),paid=v("f2");const a=x>0?lawyerFee(x):0;const r=paid>0?Math.min(a,paid):a;
   return`<div class="res-kicker">한 심급에 산입되는 보수</div><div class="big num">${won(r)}</div><dl class="kv num"><dt>별표 기준액</dt><dd>${won(a)}</dd>${paid>0?`<dt>실제 지급액</dt><dd>${won(paid)}</dd>`:""}</dl><p class="small-note">심급마다 따로 계산합니다. 소가를 산정할 수 없는 사건, 가압류·가처분 등은 규칙의 별도 기준을 확인하세요.</p>`}},
 {id:"interest",t:"판결금 지연이자",basis:"민법 제379조(연 5%), 상법 제54조(연 6%), 소송촉진법 제3조(연 12%)",
  form:`<label class="f">원금<div class="unit"><input type="number" id="i1" value="30000000"><span>원</span></div></label>
  <div class="grid2"><label class="f">이자 시작일 (그날부터)<input type="date" id="i2" value="2025-03-11"></label><label class="f">다 갚는 날 (그날까지)<input type="date" id="i3" value="2026-10-29"></label></div>
  <div class="grid2"><label class="f">판결 선고일 (선택)<input type="date" id="i4" value="2025-09-18"></label><label class="f">선고일까지 이율<div class="unit"><input type="number" id="i5" value="5" step="0.1"><span>%</span></div></label><label class="f">그 다음 날부터 이율<div class="unit"><input type="number" id="i6" value="12" step="0.1"><span>%</span></div></label></div>`,
  run(){const P0=v("i1"),a=parse(document.getElementById("i2").value),b=parse(document.getElementById("i3").value),s=parse(document.getElementById("i4").value),r1=v("i5")/100,r2=v("i6")/100;
   if(!a||!b||b<a)return`<p class="small-note">시작일과 종료일을 확인하세요.</p>`;
   const seg=[];if(s&&s>=a&&s<b){seg.push([a,s,r1]);seg.push([addDays(s,1),b,r2])}else if(s&&s>=b){seg.push([a,b,r1])}else seg.push([a,b,r2]);
   let tot=0;const rows=seg.map(([x,y,r])=>{const d=diffDays(x,y)+1,i=Math.floor(P0*r*d/365);tot+=i;return`<dt>${fmt(x)} ~ ${fmt(y)}<br>${d}일 × 연 ${pct(r)}</dt><dd>${won(i)}</dd>`}).join("");
   return`<div class="res-kicker">지연이자 합계</div><div class="big num">${won(tot)}</div><dl class="kv num">${rows}<dt class="sum">원리금 합계</dt><dd class="sum">${won(P0+tot)}</dd></dl><p class="small-note">1년 365일 일할 계산, 구간별 원 단위 버림. 소송촉진법 이율은 2019. 6. 1.부터 연 12%입니다.</p>`}},
 {grp:"집행"},
 {id:"garnish",t:"급여 압류 한도",basis:"민사집행법 제246조, 같은 법 시행령 제3조·제4조",
  form:`<label class="f">월 실수령액 (세금·4대보험 공제 후)<div class="unit"><input type="number" id="g1" value="4200000"><span>원</span></div></label>
  <label class="f">적용 기준<select id="g2"><option value="250">2026. 2. 1. 이후 접수 (최저생계비 250만원)</option><option value="185">그 전 접수 (185만원)</option></select></label>`,
  run(){const x=v("g1"),L=+document.getElementById("g2").value*1e4;let g,rule;
   if(x<=L){g=0;rule=`${won(L)} 이하: 압류 불가`}else if(x<=2*L){g=x-L;rule=`${won(L)} 초과 ${won(2*L)} 이하: 월급 − ${won(L)}`}else if(x<=6e6){g=x/2;rule=`${won(2*L)} 초과 600만원 이하: 월급의 1/2`}else{g=x-(3e6+(x/2-3e6)/2);rule="600만원 초과: 월급 − [300만원 + (월급÷2 − 300만원)÷2]"}
   return`<div class="res-kicker">압류 가능액 (월)</div><div class="big num">${won(g)}</div><dl class="kv num"><dt>압류금지액</dt><dd>${won(x-g)}</dd><dt>적용 구간</dt><dd style="text-align:right;font-weight:400">${rule}</dd></dl><p class="small-note">채권자가 여럿이어도 압류 가능 총액은 같습니다. 이미 진행 중인 압류는 범위변경 신청으로 조정을 구할 수 있습니다.</p>`}},
 {grp:"가사"},
 {id:"child",t:"양육비 (월액·총액)",basis:"서울가정법원 2021 양육비산정기준표 (2026년 현재 적용)",
  form:`<div class="grid2"><label class="f">양육자 월 소득 (세전)<div class="unit"><input type="number" id="c1" value="250"><span>만원</span></div></label><label class="f">비양육자 월 소득 (세전)<div class="unit"><input type="number" id="c2" value="450"><span>만원</span></div></label><label class="f">자녀 거주 지역<select id="c3"><option value="1">표준</option><option value="1.079">도시 (+7.9%)</option><option value="0.835">농어촌 (−16.5%)</option></select></label></div>
  <div class="small-note" style="margin-top:4px">자녀 생년월일 (총액은 기준일부터 만 19세 생일 전날까지)</div>
  <div class="rows" id="kids"></div><div><button type="button" class="btn ghost sm" id="addKid">자녀 추가</button></div>
  <label class="f">총액 계산 기준일<input type="date" id="c4"></label>`,
  init(){const k=document.getElementById("kids");const add=d=>{const w=document.createElement("div");w.className="rowline";w.style.gridTemplateColumns="1fr 42px";w.innerHTML=`<input type="date" class="kidb" value="${d}" aria-label="자녀 생년월일"><button type="button" class="x" aria-label="삭제">×</button>`;k.appendChild(w)};
   if(!k.children.length){add("2017-05-20");add("2021-11-03")}document.getElementById("c4").value=document.getElementById("c4").value||key(today());
   document.getElementById("addKid").onclick=()=>{add(key(addDays(today(),-365*5)));runCalc()};k.onclick=e=>{if(e.target.classList.contains("x")&&k.children.length>1){e.target.parentElement.remove();runCalc()}}},
  run(){const a=v("c1"),b=v("c2"),reg=+document.getElementById("c3").value,ref=parse(document.getElementById("c4").value)||today();
   const kids=[...document.querySelectorAll(".kidb")].map(i=>parse(i.value)).filter(Boolean);if(!kids.length)return`<p class="small-note">자녀 생년월일을 넣어 주세요.</p>`;
   const tot=a+b,bi=bandIdx(tot),nk=kids.length,mult=nk===1?1.065:nk>=3?0.776:1,share=tot>0?b/tot:0;
   const perChild=(age)=>{const std=CS[ageRow(age)][bi];const adj=std*mult*reg;let pay=adj*share;const min=CS[ageRow(age)][0]/2;let minApplied=false;if(pay<min){pay=min;minApplied=true}return{std,adj,pay,minApplied}};
   let monthly=0,minAny=false;const rows=kids.map((k,i)=>{const age=ageAt(k,ref);if(age>=19)return`<tr><td>자녀 ${i+1}</td><td>만 ${age}세</td><td colspan="2">성년, 제외</td></tr>`;const c=perChild(age);monthly+=c.pay;minAny=minAny||c.minApplied;return`<tr><td>자녀 ${i+1}</td><td>만 ${age}세 (${AGE_L[ageRow(age)]})</td><td class="num">${won(c.adj)}</td><td class="num">${won(c.pay)}${c.minApplied?" *":""}</td></tr>`}).join("");
   let total=0,months=0;kids.forEach(k=>{let d=new Date(ref);const end=new Date(k.getFullYear()+19,k.getMonth(),k.getDate(),12);while(d<end){const age=ageAt(k,d);total+=perChild(age).pay;months++;d=new Date(d.getFullYear(),d.getMonth()+1,d.getDate(),12)}});
   return`<div class="res-kicker">비양육자 월 지급액</div><div class="big num">${won(Math.floor(monthly/1000)*1000)}<small>/월</small></div>
   <dl class="kv num"><dt>부모 합산 소득구간</dt><dd>${BANDS[bi]} (${tot.toLocaleString()}만원)</dd><dt>자녀 수 보정</dt><dd>× ${mult}</dd><dt>지역 보정</dt><dd>× ${reg}</dd><dt>비양육자 분담 비율</dt><dd>${pct(share)}</dd><dt class="sum">기준일부터 성년까지 총액 (${months}개월분)</dt><dd class="sum">${won(total)}</dd></dl>
   <div class="otable"><table><thead><tr><th>자녀</th><th>나이 구간</th><th>보정 양육비 총액</th><th>비양육자 부담</th></tr></thead><tbody>${rows}</tbody></table></div>
   <p class="small-note">${minAny?"* 최소양육비(최저 소득구간 양육비의 1/2) 적용. ":""}총액은 나이 구간이 바뀌는 달부터 금액을 바꿔 합산한 값이며, 일시금 할인(중간이자 공제)은 하지 않았습니다.</p>`}},
 {id:"division",t:"이혼 재산분할",basis:"민법 제839조의2 · 순재산 × 기여도 − 본인 명의 순재산",
  form:`<div class="grid2"><label class="f">본인 명의 재산<div class="unit"><input type="number" id="d1" value="180000000"><span>원</span></div></label><label class="f">본인 명의 채무<div class="unit"><input type="number" id="d2" value="30000000"><span>원</span></div></label><label class="f">상대방 명의 재산<div class="unit"><input type="number" id="d3" value="520000000"><span>원</span></div></label><label class="f">상대방 명의 채무<div class="unit"><input type="number" id="d4" value="120000000"><span>원</span></div></label><label class="f">본인 기여도<div class="unit"><input type="number" id="d5" value="40"><span>%</span></div></label></div>`,
  run(){const mine=v("d1")-v("d2"),oth=v("d3")-v("d4"),t=mine+oth,r=v("d5")/100,should=t*r,diff=should-mine;
   return`<div class="res-kicker">${diff>=0?"상대방에게서 받을 분할금":"상대방에게 줄 분할금"}</div><div class="big num">${won(Math.abs(diff))}</div><dl class="kv num"><dt>본인 순재산</dt><dd>${won(mine)}</dd><dt>상대방 순재산</dt><dd>${won(oth)}</dd><dt>분할 대상 순재산 합계</dt><dd>${won(t)}</dd><dt class="sum">본인 몫 (${pct(r)})</dt><dd class="sum">${won(should)}</dd></dl><p class="small-note">특유재산 포함 여부, 기준 시점, 기여도는 재판부가 정합니다.</p>`}},
 {id:"famfee",t:"이혼·재산분할 인지 수수료",basis:"민사소송 등 인지법 제2조, 가사소송수수료규칙 (재산분할·상속재산분할은 인지액의 1/2)",
  form:`<label class="check"><input type="checkbox" id="h1" checked>이혼 청구 (나류, 20,000원)</label>
  <label class="f">위자료 청구액<div class="unit"><input type="number" id="h2" value="30000000"><span>원</span></div></label>
  <label class="f">재산분할 청구액<div class="unit"><input type="number" id="h3" value="200000000"><span>원</span></div></label>
  <div class="grid2"><label class="f">상속재산분할: 상속재산 가액<div class="unit"><input type="number" id="h4" value="0"><span>원</span></div></label><label class="f">청구인 상속분 (예: 2/7)<input type="text" id="h5" value="2/7"></label></div>`,
  run(){const a=document.getElementById("h1").checked?20000:0,w=v("h2"),p=v("h3"),est=v("h4"),sh=fracParse(document.getElementById("h5").value);
   const wf=w>0?fin(stampBase(w)):0,pf=p>0?fin(stampBase(p)/2):0,ev=est*sh,ef=ev>0?fin(stampBase(ev)/2):0;
   return`<div class="res-kicker">항목별 합계</div><div class="big num">${won(a+wf+pf+ef)}</div><dl class="kv num">${a?"<dt>이혼 청구</dt><dd>20,000원</dd>":""}${w>0?`<dt>위자료 (인지법 기준)</dt><dd>${won(wf)}</dd>`:""}${p>0?`<dt>재산분할 (1/2)</dt><dd>${won(pf)}</dd>`:""}${ev>0?`<dt>상속재산분할 (${won(ev)}의 1/2)</dt><dd>${won(ef)}</dd>`:""}</dl><p class="small-note">여러 청구를 병합할 때의 산정과 송달료는 접수 법원 안내로 확인하세요.</p>`}},
 {grp:"상속"},
 {id:"inherit",t:"법정 상속지분",basis:"민법 제1000조·제1003조·제1009조",
  form:`<label class="f">상속재산<div class="unit"><input type="number" id="h_e" value="700000000"><span>원</span></div></label>
  <label class="check"><input type="checkbox" id="h_s" checked>배우자가 있습니다</label>
  <div class="grid2"><label class="f">1순위 자녀 등 직계비속<div class="unit"><input type="number" id="h_1" value="2" min="0"><span>명</span></div></label><label class="f">2순위 부모 등 직계존속<div class="unit"><input type="number" id="h_2" value="0" min="0"><span>명</span></div></label><label class="f">3순위 형제자매<div class="unit"><input type="number" id="h_3" value="0" min="0"><span>명</span></div></label><label class="f">4순위 4촌 이내 방계혈족<div class="unit"><input type="number" id="h_4" value="0" min="0"><span>명</span></div></label></div>`,
  run(){const E=v("h_e"),sp=document.getElementById("h_s").checked,n=[v("h_1"),v("h_2"),v("h_3"),v("h_4")].map(x=>Math.max(0,Math.floor(x)));
   let ord=-1;for(let i=0;i<4;i++)if(n[i]>0){ord=i;break}
   let heirs=[];const ON=["직계비속","직계존속","형제자매","4촌 이내 방계혈족"];
   if(sp&&(ord===0||ord===1)){const den=2*n[ord]+3;heirs.push(["배우자",3,den]);for(let i=0;i<n[ord];i++)heirs.push([`${ON[ord]} ${i+1}`,2,den])}
   else if(sp){heirs.push(["배우자 (단독)",1,1])}
   else if(ord>=0){for(let i=0;i<n[ord];i++)heirs.push([`${ON[ord]} ${i+1}`,1,n[ord]])}
   if(!heirs.length)return`<p class="small-note">상속인이 없으면 특별연고자 분여 또는 국가 귀속 절차로 갑니다 (민법 제1057조의2·제1058조).</p>`;
   return`<div class="res-kicker">상속인 ${heirs.length}명</div><div class="otable"><table><thead><tr><th>상속인</th><th>지분</th><th>비율</th><th>예상 상속액</th></tr></thead><tbody>${heirs.map(([nm,a,b])=>`<tr><td>${nm}</td><td class="num">${a}/${b}</td><td class="num">${pct(a/b)}</td><td class="num">${won(E*a/b)}</td></tr>`).join("")}</tbody></table></div><p class="small-note">${sp&&ord>=2?"배우자는 3·4순위 혈족보다 앞서 단독 상속합니다. ":""}배우자 몫은 함께 상속하는 직계비속·직계존속 몫에 5할을 더합니다. 대습상속, 상속포기는 반영하지 않았습니다.</p>`}},
 {id:"estate",t:"상속재산분할 (특별수익·기여분)",basis:"민법 제1008조·제1008조의2 · 간주상속재산 방식",
  form:`<label class="f">상속개시 당시 상속재산<div class="unit"><input type="number" id="e0" value="700000000"><span>원</span></div></label>
  <div class="small-note">상속인별 법정상속분 · 생전 증여 등 특별수익 · 기여분</div>
  <div class="rows" id="heirs"></div><div><button type="button" class="btn ghost sm" id="addHeir">상속인 추가</button></div>`,
  init(){const h=document.getElementById("heirs");const add=(n,s,g,c)=>{const w=document.createElement("div");w.className="rowline";w.style.gridTemplateColumns="minmax(0,1.1fr) minmax(0,.7fr) minmax(0,1.3fr) minmax(0,1.3fr) 42px";w.innerHTML=`<label class="f">이름<input type="text" class="hn" value="${n}"></label><label class="f">상속분<input type="text" class="hs" value="${s}"></label><label class="f">특별수익<input type="number" class="hg" value="${g}"></label><label class="f">기여분<input type="number" class="hc" value="${c}"></label><button type="button" class="x" aria-label="삭제">×</button>`;h.appendChild(w)};
   if(!h.children.length){add("배우자","3/7",0,50000000);add("장남","2/7",200000000,0);add("차녀","2/7",0,0)}
   document.getElementById("addHeir").onclick=()=>{add("상속인","0",0,0);runCalc()};h.onclick=e=>{if(e.target.classList.contains("x")&&h.children.length>1){e.target.parentElement.remove();runCalc()}}},
  run(){const E=v("e0");const H=[...document.querySelectorAll("#heirs .rowline")].map(r=>({n:r.querySelector(".hn").value,s:fracParse(r.querySelector(".hs").value),g:+r.querySelector(".hg").value||0,c:+r.querySelector(".hc").value||0}));
   const G=H.reduce((a,x)=>a+x.g,0),C=H.reduce((a,x)=>a+x.c,0),deemed=E+G-C;
   H.forEach(x=>{x.raw=deemed*x.s-x.g+x.c});
   let over=H.filter(x=>x.raw<0),deficit=-over.reduce((a,x)=>a+x.raw,0);
   const pos=H.filter(x=>x.raw>=0),posSum=pos.reduce((a,x)=>a+x.raw,0);
   H.forEach(x=>{x.fin=x.raw<0?0:(posSum>0?x.raw-deficit*(x.raw/posSum):0)});
   const ssum=H.reduce((a,x)=>a+x.s,0);
   return`<div class="res-kicker">간주상속재산</div><div class="big num">${won(deemed)}</div><dl class="kv num"><dt>상속재산</dt><dd>${won(E)}</dd><dt>+ 특별수익 합계</dt><dd>${won(G)}</dd><dt>− 기여분 합계</dt><dd>${won(C)}</dd></dl>
   <div class="otable"><table><thead><tr><th>상속인</th><th>상속분</th><th>계산상 몫</th><th>실제 취득액</th></tr></thead><tbody>${H.map(x=>`<tr><td>${esc(x.n)}</td><td class="num">${pct(x.s)}</td><td class="num">${won(x.raw)}</td><td class="num"><b>${won(x.fin)}</b></td></tr>`).join("")}</tbody></table></div>
   <p class="small-note">계산상 몫 = 간주상속재산 × 상속분 − 특별수익 + 기여분. ${over.length?"특별수익이 몫을 넘는 상속인은 0으로 하고, 모자라는 부분은 나머지 상속인이 계산상 몫의 비율로 나눠 부담했습니다. ":""}${Math.abs(ssum-1)>0.001?`<b style="color:var(--warn)">상속분 합계가 ${pct(ssum)}입니다. 100%가 되도록 확인하세요.</b>`:""}</p>`}}
];
let calcId=LS.get("ld-calc","stamp");if(!CALCS.find(c=>c.id===calcId))calcId="stamp";
function renderCalcList(){$("#calcList").innerHTML=CALCS.map(c=>c.grp?`<div class="grp">${c.grp}</div>`:`<button type="button" role="tab" aria-selected="${c.id===calcId}" data-calc="${c.id}">${c.t}</button>`).join("")}
function renderCalc(){const c=CALCS.find(x=>x.id===calcId);$("#calcPane").innerHTML=`<h3>${c.t}</h3><div class="basis">${c.basis}</div><form id="cf" novalidate>${c.form}</form><div class="out" id="cout" aria-live="polite"></div>`;if(c.init)c.init();runCalc()}
function runCalc(){const c=CALCS.find(x=>x.id===calcId);try{$("#cout").innerHTML=c.run()}catch(e){$("#cout").innerHTML=`<p class="small-note">입력값을 확인하세요.</p>`}}
$("#calcList").addEventListener("click",e=>{const b=e.target.closest("[data-calc]");if(!b)return;calcId=b.dataset.calc;LS.set("ld-calc",calcId);renderCalcList();renderCalc()});
$("#calcPane").addEventListener("input",runCalc);
$("#calcPane").addEventListener("submit",e=>e.preventDefault());

/* boot */
renderChips();renderProcSel();renderResult();renderTable();renderMine();renderSide();renderCalcList();renderCalc();
window.__test={compute,monthsEnd,stampBase,lawyerFee,parse,key,isOff};
})();
