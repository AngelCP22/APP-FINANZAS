// ===== ESTADO GLOBAL =====
let state = {
  transactions: [], accounts: [], debts: [], goals: [], fixedExpenses: [], transfers: [],
  categories: {
    expense: [
      {id:'food',name:'Comida',emoji:'🍔'},{id:'transport',name:'Transporte',emoji:'🚗'},
      {id:'health',name:'Salud',emoji:'🏥'},{id:'entertainment',name:'Entretenimiento',emoji:'🎮'},
      {id:'education',name:'Educación',emoji:'📚'},{id:'clothing',name:'Ropa',emoji:'👕'},
      {id:'services',name:'Servicios',emoji:'💡'},{id:'rent',name:'Alquiler',emoji:'🏠'},
      {id:'tech',name:'Tecnología',emoji:'📱'},{id:'other',name:'Otros',emoji:'📦'}
    ],
    income: [
      {id:'salary',name:'Sueldo',emoji:'💼'},{id:'freelance',name:'Freelance',emoji:'💻'},
      {id:'bonus',name:'Bono',emoji:'🎁'},{id:'investment',name:'Inversión',emoji:'📈'},
      {id:'sale',name:'Venta',emoji:'🛍️'},{id:'other',name:'Otros',emoji:'💰'}
    ]
  },
  config: { currency:'S/', theme:'dark', accent:'#6C63FF', fontSize:'normal' },
  currentMonth: new Date().getMonth(), currentYear: new Date().getFullYear(),
  currentScreen: 'home', currentStatTab: 'current'
};

const BANKS = [
  {id:'bcp',name:'BCP',color:'#003DA5'},{id:'bbva',name:'BBVA',color:'#004481'},
  {id:'ibk',name:'Interbank',color:'#006F2E'},{id:'scotia',name:'Scotiabank',color:'#EC111A'},
  {id:'banbif',name:'BanBif',color:'#F05A28'},{id:'pichincha',name:'Pichincha',color:'#9B1915'},
  {id:'mibanco',name:'Mibanco',color:'#FF6600'},{id:'nacion',name:'Banco Nación',color:'#003876'},
  {id:'compartamos',name:'Compartamos',color:'#6B2D8B'},{id:'financieraoh',name:'Financiera Oh!',color:'#E8000D'},
  {id:'crediscotia',name:'Crediscotia',color:'#CC0000'},{id:'cajahuancayo',name:'Caja Huancayo',color:'#004B9B'},
  {id:'cajaarequipa',name:'Caja Arequipa',color:'#008000'},{id:'cajapiura',name:'Caja Piura',color:'#005A9C'},
  {id:'yape',name:'Yape',color:'#6C1D9E'},{id:'plin',name:'Plin',color:'#00A0E3'},
  {id:'tunki',name:'Tunki',color:'#FF6B00'},{id:'lukita',name:'Lukita',color:'#00B050'},
  {id:'falabella',name:'Falabella',color:'#3DB54A'},{id:'ripley',name:'Ripley',color:'#7B1FA2'},
  {id:'cencosud',name:'Cencosud',color:'#E31837'},{id:'alfin',name:'Alfin Banco',color:'#005F9E'},
  {id:'cmaccusco',name:'CMAC Cusco',color:'#FF6B00'},{id:'cmactacna',name:'CMAC Tacna',color:'#0055A5'},
  {id:'cmacmaynas',name:'CMAC Maynas',color:'#006837'},{id:'raiz',name:'Financiera Raíz',color:'#E67E22'},
  {id:'confianza',name:'F. Confianza',color:'#2980B9'},{id:'qapaq',name:'CRAC Raíz',color:'#8E44AD'},
  {id:'efectivo',name:'Efectivo',color:'#4B5563'},{id:'custom',name:'Personalizado',color:'#6C63FF'}
];
const ACCOUNT_TYPES = [
  {id:'savings',name:'Cuenta de ahorros'},{id:'current',name:'Cuenta corriente'},
  {id:'credit',name:'Tarjeta de crédito'},{id:'digital',name:'Billetera digital'},{id:'cash',name:'Efectivo'}
];
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function saveState() { try { localStorage.setItem('fincontrol_v4', JSON.stringify(state)); } catch(e) {} }
function loadState() {
  try {
    const saved = localStorage.getItem('fincontrol_v4');
    if (saved) { const p = JSON.parse(saved); state = {...state,...p}; state.currentMonth=new Date().getMonth(); state.currentYear=new Date().getFullYear(); }
  } catch(e) {}
}
function uid() { return Date.now().toString(36)+Math.random().toString(36).substr(2,5); }
function fmt(n) { return state.config.currency+' '+Number(n||0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g,','); }
function getMonthLabel() { return MONTHS[state.currentMonth]+' '+state.currentYear; }
function changeMonth(dir) {
  state.currentMonth+=dir;
  if(state.currentMonth>11){state.currentMonth=0;state.currentYear++;}
  if(state.currentMonth<0){state.currentMonth=11;state.currentYear--;}
  document.getElementById('month-label').textContent=getMonthLabel();
  renderCurrentScreen();
}
function getMonthTxs(m,y) { return state.transactions.filter(t=>{const d=new Date(t.date);return d.getMonth()===m&&d.getFullYear()===y;}); }
function getMonthIncome(m,y) { return getMonthTxs(m,y).filter(t=>t.type==='income').reduce((s,t)=>s+Number(t.amount),0); }
function getMonthExpense(m,y) { return getMonthTxs(m,y).filter(t=>t.type==='expense').reduce((s,t)=>s+Number(t.amount),0); }
function getAccountBalance(id) {
  const acc=state.accounts.find(a=>a.id===id); if(!acc) return 0;
  let bal=Number(acc.initialBalance||0);
  state.transactions.forEach(t=>{if(t.accountId===id) bal+=t.type==='income'?Number(t.amount):-Number(t.amount);});
  state.transfers.forEach(t=>{if(t.fromId===id)bal-=Number(t.amount);if(t.toId===id)bal+=Number(t.amount);});
  return bal;
}
function getBankById(id) { return BANKS.find(b=>b.id===id)||BANKS[BANKS.length-1]; }
function getCatById(type,id) { return state.categories[type]?.find(c=>c.id===id)||{name:'Otros',emoji:'📦'}; }

function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  document.getElementById('screen-'+name)?.classList.add('active');
  document.querySelector(`.nav-item[data-screen="${name}"]`)?.classList.add('active');
  state.currentScreen=name;
  document.getElementById('month-nav').style.display=['home','accounts','debts','goals'].includes(name)?'':'none';
  document.getElementById('fab-btn').style.display=name==='more'?'none':'';
  renderCurrentScreen();
}
function renderCurrentScreen() {
  switch(state.currentScreen){
    case 'home':renderHome();break; case 'accounts':renderAccounts();break;
    case 'debts':renderDebts();break; case 'goals':renderGoals();break;
    case 'stats':renderStats();break; case 'more':renderMore();break;
  }
}
function openModal(id,data) {
  if(id==='modal-add-tx')renderModalAddTx();
  if(id==='modal-add-account')renderModalAddAccount();
  if(id==='modal-add-debt')renderModalAddDebt(data);
  if(id==='modal-add-goal')renderModalAddGoal();
  if(id==='modal-add-fixed')renderModalAddFixed();
  if(id==='modal-transfer')renderModalTransfer();
  if(id==='modal-config')renderModalConfig();
  document.getElementById(id).classList.add('open');
}
function closeModal(id){document.getElementById(id).classList.remove('open');}
function closeModalOutside(e,id){if(e.target===e.currentTarget)closeModal(id);}

function calcHealthScore() {
  const assets=state.accounts.reduce((s,a)=>s+Math.max(0,getAccountBalance(a.id)),0);
  const debts=state.debts.reduce((s,d)=>s+Number(d.remaining||d.amount||0),0);
  if(assets===0)return 50;
  const r=debts/assets;
  if(r<=0.1)return 95;if(r<=0.3)return 80;if(r<=0.5)return 65;if(r<=0.8)return 45;if(r<=1.2)return 25;return 10;
}

function renderHome() {
  const m=state.currentMonth,y=state.currentYear,txs=getMonthTxs(m,y);
  const income=txs.filter(t=>t.type==='income').reduce((s,t)=>s+Number(t.amount),0);
  const expense=txs.filter(t=>t.type==='expense').reduce((s,t)=>s+Number(t.amount),0);
  const balance=income-expense;
  const totalAssets=state.accounts.reduce((s,a)=>s+getAccountBalance(a.id),0);
  const totalDebt=state.debts.reduce((s,d)=>s+Number(d.remaining||d.amount||0),0);
  const score=calcHealthScore();
  renderAlerts();
  const today=new Date(),daysLeft=new Date(y,m+1,0).getDate()-today.getDate()+1;
  const fixed=state.fixedExpenses.reduce((s,f)=>s+Number(f.amount),0);
  const loans=state.debts.filter(d=>d.type==='loan').reduce((s,d)=>s+Number(d.monthlyPayment||0),0);
  const dailyLimit=daysLeft>0?(totalAssets-fixed-loans)/daysLeft:0;
  document.getElementById('daily-limit-widget').innerHTML=`
    <div class="daily-limit">
      <div><div class="daily-limit-label">Puedes gastar hoy</div><div class="daily-limit-value">${fmt(dailyLimit)}</div><div style="font-size:11px;color:var(--text2)">${daysLeft} días restantes</div></div>
      <div style="text-align:right"><div style="font-size:10px;color:var(--text2)">Score</div><div style="font-size:28px;font-weight:800;color:${score>=70?'var(--green)':score>=40?'var(--yellow)':'var(--red)'}">${score}</div></div>
    </div>`;
  document.getElementById('hero-balance-widget').innerHTML=`
    <div class="hero-balance">
      <div class="balance-label">Balance del mes</div>
      <div class="balance-amount" style="color:${balance>=0?'var(--green)':'var(--red)'}">${fmt(balance)}</div>
      <div class="balance-row">
        <div class="balance-stat"><div class="balance-stat-label">💚 Ingresos</div><div class="balance-stat-value text-green">${fmt(income)}</div></div>
        <div class="balance-stat"><div class="balance-stat-label">❤️ Gastos</div><div class="balance-stat-value text-red">${fmt(expense)}</div></div>
        <div class="balance-stat"><div class="balance-stat-label">💎 Patrimonio</div><div class="balance-stat-value" style="color:${totalAssets-totalDebt>=0?'var(--green)':'var(--red)'}">${fmt(totalAssets-totalDebt)}</div></div>
      </div>
    </div>`;
  const accHtml=state.accounts.slice(0,3).map(a=>{
    const bank=getBankById(a.bankId),bal=getAccountBalance(a.id);
    return `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">
      <div style="width:36px;height:36px;border-radius:10px;background:${bank.color};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:white;flex-shrink:0">${bank.name.slice(0,3)}</div>
      <div style="flex:1"><div style="font-size:13px;font-weight:600">${a.name}</div><div style="font-size:11px;color:var(--text2)">${ACCOUNT_TYPES.find(t=>t.id===a.type)?.name||a.type}</div></div>
      <div style="font-size:14px;font-weight:700;color:${bal>=0?'var(--text)':'var(--red)'}">${fmt(bal)}</div>
    </div>`;
  }).join('');
  document.getElementById('home-accounts-summary').innerHTML=state.accounts.length
    ?`<div class="card card-sm">${accHtml}</div>`
    :`<div class="empty"><div class="empty-icon">🏦</div><div class="empty-text">Agrega tu primera cuenta</div></div>`;
  const recent=[...txs].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,5);
  document.getElementById('recent-transactions').innerHTML=recent.length
    ?`<div class="card card-sm">${recent.map(txItem).join('')}</div>`
    :`<div class="empty"><div class="empty-icon">💸</div><div class="empty-text">Sin movimientos este mes</div></div>`;
}

function renderAlerts() {
  const alerts=[],today=new Date();
  state.fixedExpenses.forEach(f=>{const d=Number(f.day)-today.getDate();if(d>=0&&d<=3)alerts.push({type:'warning',msg:`⏰ ${f.name} vence en ${d===0?'hoy':d+' días'} (${fmt(f.amount)})`});});
  state.debts.filter(d=>d.type==='card').forEach(d=>{const p=(Number(d.used||0)/Number(d.limit||1))*100;if(p>=80)alerts.push({type:'danger',msg:`💳 ${d.name} al ${p.toFixed(0)}% de su límite`});});
  state.debts.filter(d=>d.dueDate).forEach(d=>{if(new Date(d.dueDate)<today&&d.status!=='paid')alerts.push({type:'danger',msg:`🔴 Deuda vencida: ${d.name}`});});
  state.transactions.filter(t=>t.reimbursable&&!t.reimbursed).forEach(t=>{if(Math.floor((today-new Date(t.date))/86400000)>30)alerts.push({type:'warning',msg:`💰 Reembolso +30 días: ${t.description} (${fmt(t.amount)})`});});
  document.getElementById('alerts-container').innerHTML=alerts.map(a=>`<div class="alert-banner ${a.type}">${a.msg}</div>`).join('');
}

function renderAccounts() {
  const list=document.getElementById('accounts-list');
  if(!state.accounts.length){list.innerHTML=`<div class="empty"><div class="empty-icon">🏦</div><div class="empty-text">Agrega tu primera cuenta</div></div>`;return;}
  list.innerHTML=state.accounts.map(a=>{
    const bank=getBankById(a.bankId),bal=getAccountBalance(a.id),isC=a.type==='credit';
    const creditHtml=isC?`<div class="credit-bar-wrap">
      <div class="credit-bar-labels"><span>Usado: ${fmt(a.creditUsed||0)}</span><span>Límite: ${fmt(a.creditLimit||0)}</span></div>
      <div class="credit-bar-track"><div class="credit-bar-fill ${(a.creditUsed/a.creditLimit)>0.8?'danger':(a.creditUsed/a.creditLimit)>0.6?'warn':''}" style="width:${Math.min(100,(a.creditUsed||0)/(a.creditLimit||1)*100)}%"></div></div>
      <div style="font-size:11px;color:rgba(255,255,255,0.7);margin-top:3px">Disponible: ${fmt((a.creditLimit||0)-(a.creditUsed||0))} · Corte: día ${a.cutDay||'--'} · Pago: día ${a.payDay||'--'}</div>
    </div>`:'';
    return `<div class="account-card" style="background:linear-gradient(135deg,${bank.color},${bank.color}cc)">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div><div class="account-name">${a.name}</div><div class="account-type">${bank.name} · ${ACCOUNT_TYPES.find(t=>t.id===a.type)?.name||a.type}</div></div>
        <div style="display:flex;gap:6px">
          <button onclick="openEditAccountModal('${a.id}')" style="background:rgba(255,255,255,0.15);border-radius:8px;padding:4px 8px;color:white;font-size:12px">✏️</button>
          <button onclick="deleteAccount('${a.id}')" style="background:rgba(255,255,255,0.15);border-radius:8px;padding:4px 8px;color:white;font-size:12px">✕</button>
        </div>
      </div>
      ${isC?'':` <div class="account-balance">${fmt(bal)}</div>`}
      ${creditHtml}
      <div class="account-actions">
        <button class="account-action-btn" onclick="openModalTxForAccount('${a.id}','income')">+ Ingreso</button>
        <button class="account-action-btn" onclick="openModalTxForAccount('${a.id}','expense')">- Gasto</button>
        <button class="account-action-btn" onclick="openModal('modal-transfer')">⇄ Transferir</button>
      </div>
    </div>`;
  }).join('');
  const recent=[...state.transfers].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,5);
  document.getElementById('transfers-list').innerHTML=recent.length?`<div class="card card-sm">${recent.map(t=>{
    const from=state.accounts.find(a=>a.id===t.fromId),to=state.accounts.find(a=>a.id===t.toId);
    return `<div class="tx-item"><div class="tx-icon" style="background:rgba(108,99,255,0.15)">⇄</div><div class="tx-info"><div class="tx-name">${from?.name||'?'} → ${to?.name||'?'}</div><div class="tx-meta">${new Date(t.date).toLocaleDateString('es-PE')}</div></div><div class="tx-amount">${fmt(t.amount)}</div></div>`;
  }).join('')}</div>`:`<div class="empty"><div class="empty-icon">⇄</div><div class="empty-text">Sin transferencias</div></div>`;
}
function deleteAccount(id){if(!confirm('¿Eliminar esta cuenta?'))return;state.accounts=state.accounts.filter(a=>a.id!==id);saveState();renderAccounts();}

// ===== EDITAR CUENTA =====
function openEditAccountModal(id) {
  const a = state.accounts.find(x=>x.id===id);
  if(!a) return;
  const bankOpts = BANKS.map(b=>`<option value="${b.id}"${b.id===a.bankId?' selected':''}>${b.name}</option>`).join('');
  const typeOpts = ACCOUNT_TYPES.map(t=>`<option value="${t.id}"${t.id===a.type?' selected':''}>${t.name}</option>`).join('');
  const creditHtml = a.type==='credit' ? `
    <div id="ea-credit-fields">
      <div class="form-row">
        <div class="form-group"><label class="form-label">Límite crédito</label><input class="form-input" id="ea-credit-limit" type="number" value="${a.creditLimit||0}"/></div>
        <div class="form-group"><label class="form-label">Usado actualmente</label><input class="form-input" id="ea-credit-used" type="number" value="${a.creditUsed||0}"/></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Día de corte</label><input class="form-input" id="ea-cut-day" type="number" value="${a.cutDay||''}" min="1" max="31"/></div>
        <div class="form-group"><label class="form-label">Día de pago</label><input class="form-input" id="ea-pay-day" type="number" value="${a.payDay||''}" min="1" max="31"/></div>
      </div>
    </div>` : '<div id="ea-credit-fields" style="display:none"></div>';
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay open';
  overlay.innerHTML = `<div class="modal">
    <div class="modal-handle"></div>
    <div class="modal-title">Editar cuenta</div>
    <div class="form-group"><label class="form-label">Nombre</label>
      <input class="form-input" id="ea-name" value="${a.name}"/>
    </div>
    <div class="form-group"><label class="form-label">Banco / Billetera</label>
      <select class="form-select" id="ea-bank">${bankOpts}</select>
    </div>
    <div class="form-group"><label class="form-label">Tipo</label>
      <select class="form-select" id="ea-type" onchange="onEditAccTypeChange()">${typeOpts}</select>
    </div>
    <div class="form-group"><label class="form-label">Saldo inicial</label>
      <input class="form-input" id="ea-balance" type="number" value="${a.initialBalance||0}" inputmode="decimal"/>
    </div>
    ${creditHtml}
    <button class="btn-primary" onclick="saveEditAccount('${id}', this.closest('.modal-overlay'))">Guardar cambios</button>
    <button class="btn-danger" style="margin-top:8px" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
  </div>`;
  overlay.onclick = e => { if(e.target===overlay) overlay.remove(); };
  document.body.appendChild(overlay);
}

function onEditAccTypeChange() {
  const type = document.getElementById('ea-type')?.value;
  const fields = document.getElementById('ea-credit-fields');
  if(!fields) return;
  fields.style.display = type==='credit' ? '' : 'none';
  if(type==='credit' && !fields.innerHTML.trim()) {
    fields.innerHTML = `
      <div class="form-row">
        <div class="form-group"><label class="form-label">Límite crédito</label><input class="form-input" id="ea-credit-limit" type="number" placeholder="0.00"/></div>
        <div class="form-group"><label class="form-label">Usado actualmente</label><input class="form-input" id="ea-credit-used" type="number" placeholder="0.00"/></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Día de corte</label><input class="form-input" id="ea-cut-day" type="number" placeholder="15" min="1" max="31"/></div>
        <div class="form-group"><label class="form-label">Día de pago</label><input class="form-input" id="ea-pay-day" type="number" placeholder="5" min="1" max="31"/></div>
      </div>`;
  }
}

function saveEditAccount(id, overlay) {
  const a = state.accounts.find(x=>x.id===id);
  if(!a) return;
  a.name           = document.getElementById('ea-name')?.value.trim() || a.name;
  a.bankId         = document.getElementById('ea-bank')?.value;
  a.type           = document.getElementById('ea-type')?.value;
  a.initialBalance = parseFloat(document.getElementById('ea-balance')?.value||0);
  if(a.type==='credit') {
    a.creditLimit = parseFloat(document.getElementById('ea-credit-limit')?.value||0);
    a.creditUsed  = parseFloat(document.getElementById('ea-credit-used')?.value||0);
    a.cutDay      = document.getElementById('ea-cut-day')?.value;
    a.payDay      = document.getElementById('ea-pay-day')?.value;
  }
  saveState(); overlay.remove(); renderAccounts();
}
function openModalTxForAccount(accountId,type){openModal('modal-add-tx');setTimeout(()=>{document.getElementById('tx-type-'+type)?.click();const s=document.getElementById('tx-account');if(s)s.value=accountId;},100);}

function renderModalAddTx() {
  const accOptions=state.accounts.map(a=>`<option value="${a.id}">${a.name}</option>`).join('');
  document.getElementById('modal-add-tx-body').innerHTML=`
    <div class="type-selector">
      <button class="type-btn income" id="tx-type-income" onclick="selectTxType('income')">💚 Ingreso</button>
      <button class="type-btn expense selected" id="tx-type-expense" onclick="selectTxType('expense')">❤️ Gasto</button>
    </div>
    <div class="form-group"><label class="form-label">Descripción</label><input class="form-input" id="tx-desc" placeholder="Ej: Almuerzo, Sueldo..."/></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Monto</label><input class="form-input" id="tx-amount" type="number" placeholder="0.00" inputmode="decimal"/></div>
      <div class="form-group"><label class="form-label">Fecha</label><input class="form-input" id="tx-date" type="date" value="${new Date().toISOString().split('T')[0]}"/></div>
    </div>
    <div class="form-group"><label class="form-label">Categoría</label><select class="form-select" id="tx-category"></select></div>
    <div class="form-group"><label class="form-label">Cuenta</label><select class="form-select" id="tx-account"><option value="">Sin cuenta</option>${accOptions}</select></div>
    <div class="toggle-row"><div><div class="toggle-label">¿Es reembolsable?</div><div class="toggle-sub">Te devolverán este dinero</div></div><div class="toggle" id="tx-reimb-toggle" onclick="this.classList.toggle('on')"></div></div>
    <div class="toggle-row"><div><div class="toggle-label">Ingreso extra</div><div class="toggle-sub">Asignar destino especial</div></div><div class="toggle" id="tx-extra-toggle" onclick="toggleExtraDestino()"></div></div>
    <div id="extra-destino" style="display:none;margin-top:8px">
      <div class="form-group"><label class="form-label">Destino</label>
        <select class="form-select" id="tx-extra-dest-type" onchange="renderExtraDestOptions()">
          <option value="account">Cuenta bancaria</option><option value="debt">Pagar deuda</option><option value="goal">Meta de ahorro</option>
        </select>
      </div>
      <div id="extra-dest-options"></div>
    </div>
    <div class="form-group" style="margin-top:14px"><label class="form-label">Nota (opcional)</label><input class="form-input" id="tx-note" placeholder="Nota adicional..."/></div>
    <button class="btn-primary" onclick="saveTx()">Guardar movimiento</button>`;
  selectTxType('expense');
}
function selectTxType(type) {
  document.getElementById('tx-type-income')?.classList.remove('selected');
  document.getElementById('tx-type-expense')?.classList.remove('selected');
  document.getElementById('tx-type-'+type)?.classList.add('selected');
  const cats=type==='income'?state.categories.income:state.categories.expense;
  const sel=document.getElementById('tx-category');
  if(sel)sel.innerHTML=cats.map(c=>`<option value="${c.id}">${c.emoji} ${c.name}</option>`).join('');
}
function toggleExtraDestino(){const t=document.getElementById('tx-extra-toggle');t.classList.toggle('on');document.getElementById('extra-destino').style.display=t.classList.contains('on')?'':'none';if(t.classList.contains('on'))renderExtraDestOptions();}
function renderExtraDestOptions(){
  const type=document.getElementById('tx-extra-dest-type')?.value,cont=document.getElementById('extra-dest-options');if(!cont)return;
  if(type==='account')cont.innerHTML=`<select class="form-select" id="tx-extra-dest-id">${state.accounts.map(a=>`<option value="${a.id}">${a.name}</option>`).join('')}</select>`;
  else if(type==='debt')cont.innerHTML=`<select class="form-select" id="tx-extra-dest-id">${state.debts.map(d=>`<option value="${d.id}">${d.name} (${fmt(d.remaining||d.amount||0)})</option>`).join('')}</select>`;
  else if(type==='goal')cont.innerHTML=`<select class="form-select" id="tx-extra-dest-id">${state.goals.map(g=>`<option value="${g.id}">${g.emoji||'🎯'} ${g.name}</option>`).join('')}</select>`;
}
function saveTx(){
  const type=document.getElementById('tx-type-income')?.classList.contains('selected')?'income':'expense';
  const desc=document.getElementById('tx-desc')?.value.trim();
  const amount=parseFloat(document.getElementById('tx-amount')?.value);
  const date=document.getElementById('tx-date')?.value;
  if(!desc||!amount||amount<=0||!date){alert('Completa descripción, monto y fecha');return;}
  const isExtra=document.getElementById('tx-extra-toggle')?.classList.contains('on');
  const tx={id:uid(),type,description:desc,amount,date,category:document.getElementById('tx-category')?.value,
    accountId:document.getElementById('tx-account')?.value,
    reimbursable:document.getElementById('tx-reimb-toggle')?.classList.contains('on'),
    note:document.getElementById('tx-note')?.value,isExtra,
    extraDestType:isExtra?document.getElementById('tx-extra-dest-type')?.value:null,
    extraDestId:isExtra?document.getElementById('tx-extra-dest-id')?.value:null,
    reimbursed:false,createdAt:Date.now()};
  state.transactions.push(tx);
  if(isExtra&&tx.extraDestType==='debt'&&tx.extraDestId){const d=state.debts.find(x=>x.id===tx.extraDestId);if(d)d.remaining=Math.max(0,(d.remaining||d.amount||0)-amount);}
  if(isExtra&&tx.extraDestType==='goal'&&tx.extraDestId){const g=state.goals.find(x=>x.id===tx.extraDestId);if(g)g.saved=(g.saved||0)+amount;}
  saveState();closeModal('modal-add-tx');renderCurrentScreen();
}
function deleteTx(id){state.transactions=state.transactions.filter(t=>t.id!==id);saveState();renderCurrentScreen();}
function txItem(t){
  const acc=state.accounts.find(a=>a.id===t.accountId),bank=acc?getBankById(acc.bankId):null;
  const cat=getCatById(t.type,t.category),dateStr=new Date(t.date).toLocaleDateString('es-PE',{day:'2-digit',month:'short'});
  return `<div class="tx-item">
    <div class="tx-icon" style="background:${t.type==='income'?'rgba(74,222,128,0.15)':'rgba(248,113,113,0.15)'}">${cat.emoji}</div>
    <div class="tx-info" onclick="openEditTxModal('${t.id}')" style="cursor:pointer">
      <div class="tx-name">${t.description}</div>
      <div class="tx-meta">${dateStr}${bank?`<span class="bank-chip" style="background:${bank.color}">${bank.name.slice(0,3)}</span>`:''}${t.reimbursable&&!t.reimbursed?`<span class="reimb-tag">Reembolsable</span>`:''}${t.isExtra?`<span class="tx-badge">Extra</span>`:''}</div>
    </div>
    <div style="display:flex;align-items:center;gap:4px">
      <div class="tx-amount ${t.type}">${t.type==='income'?'+':'-'}${fmt(t.amount)}</div>
      <button class="tx-delete" style="background:rgba(108,99,255,0.12);color:var(--accent)" onclick="openEditTxModal('${t.id}')">✏️</button>
      <button class="tx-delete" onclick="deleteTx('${t.id}')">🗑</button>
    </div>
  </div>`;
}

// ===== EDITAR TRANSACCIÓN =====
function openEditTxModal(id) {
  const t = state.transactions.find(x=>x.id===id);
  if(!t) return;
  const accOptions = state.accounts.map(a=>`<option value="${a.id}"${a.id===t.accountId?' selected':''}>${a.name}</option>`).join('');
  const buildCatOpts = (type) => state.categories[type].map(c=>`<option value="${c.id}"${c.id===t.category?' selected':''}>${c.emoji} ${c.name}</option>`).join('');

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay open';
  overlay.innerHTML = `<div class="modal">
    <div class="modal-handle"></div>
    <div class="modal-title">Editar movimiento</div>
    <div class="type-selector">
      <button class="type-btn income${t.type==='income'?' selected':''}" id="edit-tx-income" onclick="editSelectType('income')">💚 Ingreso</button>
      <button class="type-btn expense${t.type==='expense'?' selected':''}" id="edit-tx-expense" onclick="editSelectType('expense')">❤️ Gasto</button>
    </div>
    <div class="form-group"><label class="form-label">Descripción</label>
      <input class="form-input" id="edit-tx-desc" value="${t.description}"/>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Monto</label>
        <input class="form-input" id="edit-tx-amount" type="number" value="${t.amount}" inputmode="decimal"/>
      </div>
      <div class="form-group"><label class="form-label">Fecha</label>
        <input class="form-input" id="edit-tx-date" type="date" value="${t.date}"/>
      </div>
    </div>
    <div class="form-group"><label class="form-label">Categoría</label>
      <select class="form-select" id="edit-tx-category">
        ${buildCatOpts(t.type)}
      </select>
    </div>
    <div class="form-group"><label class="form-label">Cuenta</label>
      <select class="form-select" id="edit-tx-account">
        <option value="">Sin cuenta</option>${accOptions}
      </select>
    </div>
    <div class="form-group"><label class="form-label">Nota</label>
      <input class="form-input" id="edit-tx-note" value="${t.note||''}" placeholder="Nota opcional..."/>
    </div>
    <button class="btn-primary" onclick="saveEditTx('${id}', this.closest('.modal-overlay'))">Guardar cambios</button>
    <button class="btn-danger" style="margin-top:8px" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
  </div>`;
  overlay.onclick = e => { if(e.target===overlay) overlay.remove(); };
  document.body.appendChild(overlay);
}

function editSelectType(type) {
  document.getElementById('edit-tx-income')?.classList.toggle('selected', type==='income');
  document.getElementById('edit-tx-expense')?.classList.toggle('selected', type==='expense');
  const sel = document.getElementById('edit-tx-category');
  if(sel) sel.innerHTML = state.categories[type].map(c=>`<option value="${c.id}">${c.emoji} ${c.name}</option>`).join('');
}

function saveEditTx(id, overlay) {
  const t = state.transactions.find(x=>x.id===id);
  if(!t) return;
  const desc = document.getElementById('edit-tx-desc')?.value.trim();
  const amount = parseFloat(document.getElementById('edit-tx-amount')?.value);
  const date = document.getElementById('edit-tx-date')?.value;
  if(!desc||!amount||amount<=0||!date) { alert('Completa todos los campos requeridos'); return; }
  t.type        = document.getElementById('edit-tx-income')?.classList.contains('selected') ? 'income' : 'expense';
  t.description = desc;
  t.amount      = amount;
  t.date        = date;
  t.category    = document.getElementById('edit-tx-category')?.value;
  t.accountId   = document.getElementById('edit-tx-account')?.value;
  t.note        = document.getElementById('edit-tx-note')?.value;
  saveState(); overlay.remove(); renderCurrentScreen();
}

function renderModalAddAccount(){
  const bankOpts=BANKS.map(b=>`<option value="${b.id}">${b.name}</option>`).join('');
  const typeOpts=ACCOUNT_TYPES.map(t=>`<option value="${t.id}">${t.name}</option>`).join('');
  document.getElementById('modal-add-account-body').innerHTML=`
    <div class="form-group"><label class="form-label">Nombre</label><input class="form-input" id="acc-name" placeholder="Ej: Mi BCP ahorros"/></div>
    <div class="form-group"><label class="form-label">Banco / Billetera</label><select class="form-select" id="acc-bank">${bankOpts}</select></div>
    <div class="form-group"><label class="form-label">Tipo</label><select class="form-select" id="acc-type" onchange="onAccTypeChange()">${typeOpts}</select></div>
    <div class="form-group"><label class="form-label">Saldo inicial</label><input class="form-input" id="acc-balance" type="number" placeholder="0.00" inputmode="decimal"/></div>
    <div id="credit-fields" style="display:none">
      <div class="form-row">
        <div class="form-group"><label class="form-label">Límite crédito</label><input class="form-input" id="acc-credit-limit" type="number" placeholder="0.00"/></div>
        <div class="form-group"><label class="form-label">Usado actualmente</label><input class="form-input" id="acc-credit-used" type="number" placeholder="0.00"/></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Día de corte</label><input class="form-input" id="acc-cut-day" type="number" placeholder="15" min="1" max="31"/></div>
        <div class="form-group"><label class="form-label">Día de pago</label><input class="form-input" id="acc-pay-day" type="number" placeholder="5" min="1" max="31"/></div>
      </div>
    </div>
    <button class="btn-primary" onclick="saveAccount()">Guardar cuenta</button>`;
}
function onAccTypeChange(){document.getElementById('credit-fields').style.display=document.getElementById('acc-type')?.value==='credit'?'':'none';}
function saveAccount(){
  const name=document.getElementById('acc-name')?.value.trim();
  if(!name){alert('Ingresa un nombre');return;}
  const acc={id:uid(),name,bankId:document.getElementById('acc-bank')?.value,type:document.getElementById('acc-type')?.value,initialBalance:parseFloat(document.getElementById('acc-balance')?.value||0),createdAt:Date.now()};
  if(acc.type==='credit'){acc.creditLimit=parseFloat(document.getElementById('acc-credit-limit')?.value||0);acc.creditUsed=parseFloat(document.getElementById('acc-credit-used')?.value||0);acc.cutDay=document.getElementById('acc-cut-day')?.value;acc.payDay=document.getElementById('acc-pay-day')?.value;}
  state.accounts.push(acc);saveState();closeModal('modal-add-account');renderCurrentScreen();
}

function renderModalTransfer(){
  if(state.accounts.length<2){document.getElementById('modal-transfer-body').innerHTML=`<div class="empty"><div class="empty-icon">🏦</div><div class="empty-text">Necesitas al menos 2 cuentas</div></div>`;return;}
  const opts=state.accounts.map(a=>`<option value="${a.id}">${a.name}</option>`).join('');
  document.getElementById('modal-transfer-body').innerHTML=`
    <div class="form-group"><label class="form-label">Desde</label><select class="form-select" id="tr-from">${opts}</select></div>
    <div class="form-group"><label class="form-label">Hacia</label><select class="form-select" id="tr-to">${opts}</select></div>
    <div class="form-group"><label class="form-label">Monto</label><input class="form-input" id="tr-amount" type="number" placeholder="0.00" inputmode="decimal"/></div>
    <div class="form-group"><label class="form-label">Fecha</label><input class="form-input" id="tr-date" type="date" value="${new Date().toISOString().split('T')[0]}"/></div>
    <div class="form-group"><label class="form-label">Nota</label><input class="form-input" id="tr-note" placeholder="Opcional..."/></div>
    <button class="btn-primary" onclick="saveTransfer()">Transferir</button>`;
}
function saveTransfer(){
  const fromId=document.getElementById('tr-from')?.value,toId=document.getElementById('tr-to')?.value;
  const amount=parseFloat(document.getElementById('tr-amount')?.value);
  if(fromId===toId){alert('Selecciona cuentas diferentes');return;}
  if(!amount||amount<=0){alert('Ingresa un monto válido');return;}
  state.transfers.push({id:uid(),fromId,toId,amount,date:document.getElementById('tr-date')?.value,note:document.getElementById('tr-note')?.value,createdAt:Date.now()});
  saveState();closeModal('modal-transfer');renderCurrentScreen();
}
// ===== RENDER DEUDAS =====
function renderDebts() {
  const totalCards    = state.debts.filter(d=>d.type==='card').reduce((s,d)=>s+Number(d.used||0),0);
  const totalLoans    = state.debts.filter(d=>d.type==='loan').reduce((s,d)=>s+Number(d.remaining||d.amount||0),0);
  const totalPersonal = state.debts.filter(d=>d.type==='personal').reduce((s,d)=>s+Number(d.remaining||d.amount||0),0);
  const totalAll      = totalCards + totalLoans + totalPersonal;

  document.getElementById('debt-summary').innerHTML = `
    <div class="card card-sm" style="margin-bottom:12px">
      <div class="card-title">Resumen de deudas</div>
      <div class="stat-grid">
        <div class="stat-box"><div class="stat-box-label">Tarjetas</div><div class="stat-box-value text-red">${fmt(totalCards)}</div></div>
        <div class="stat-box"><div class="stat-box-label">Préstamos</div><div class="stat-box-value text-red">${fmt(totalLoans)}</div></div>
        <div class="stat-box"><div class="stat-box-label">Personales</div><div class="stat-box-value text-yellow">${fmt(totalPersonal)}</div></div>
        <div class="stat-box"><div class="stat-box-label">Total deuda</div><div class="stat-box-value text-red">${fmt(totalAll)}</div></div>
      </div>
    </div>`;

  // Tarjetas
  const cards = state.debts.filter(d=>d.type==='card');
  document.getElementById('debts-cards').innerHTML = cards.length
    ? cards.map(d=>debtCard(d)).join('')
    : `<div class="empty" style="padding:20px"><div class="empty-icon">💳</div><div class="empty-text">Sin tarjetas registradas</div></div>`;

  // Préstamos
  const loans = state.debts.filter(d=>d.type==='loan');
  document.getElementById('debts-loans').innerHTML = loans.length
    ? loans.map(d=>debtCard(d)).join('')
    : `<div class="empty" style="padding:20px"><div class="empty-icon">🏦</div><div class="empty-text">Sin préstamos registrados</div></div>`;

  // Personales
  const personal = state.debts.filter(d=>d.type==='personal');
  document.getElementById('debts-personal').innerHTML = personal.length
    ? personal.map(d=>debtCard(d)).join('')
    : `<div class="empty" style="padding:20px"><div class="empty-icon">🤝</div><div class="empty-text">Sin deudas personales</div></div>`;

  // Reembolsos pendientes
  const reimbs = state.transactions.filter(t=>t.reimbursable && !t.reimbursed);
  document.getElementById('reimbursables-list').innerHTML = reimbs.length
    ? `<div class="card card-sm">${reimbs.map(t=>`
        <div class="tx-item">
          <div class="tx-icon" style="background:rgba(251,191,36,0.15)">💰</div>
          <div class="tx-info">
            <div class="tx-name">${t.description}</div>
            <div class="tx-meta">${new Date(t.date).toLocaleDateString('es-PE')} · <span class="reimb-tag">Pendiente</span></div>
          </div>
          <div style="display:flex;align-items:center;gap:6px">
            <div class="tx-amount" style="color:var(--yellow)">${fmt(t.amount)}</div>
            <button class="pay-btn" onclick="markReimbursed('${t.id}')">✓ Cobrado</button>
          </div>
        </div>`).join('')}</div>`
    : `<div class="empty" style="padding:20px"><div class="empty-icon">✅</div><div class="empty-text">Sin reembolsos pendientes</div></div>`;
}

function debtCard(d) {
  const today = new Date();
  const isDue  = d.dueDate && new Date(d.dueDate) < today;
  const isSoon = d.dueDate && !isDue && (new Date(d.dueDate)-today) < 7*86400000;
  const status = isDue ? 'danger' : isSoon ? 'warn' : 'ok';
  const statusTxt = isDue ? 'Vencido' : isSoon ? 'Próximo' : 'Al día';

  let pct = 0, barHtml = '';
  if (d.type==='card') {
    pct = Math.min(100, (Number(d.used||0)/Number(d.limit||1))*100);
    const barClass = pct>80?'danger':pct>60?'warn':'';
    barHtml = `
      <div class="credit-bar-wrap">
        <div class="credit-bar-labels"><span>Usado: ${fmt(d.used||0)}</span><span>Límite: ${fmt(d.limit||0)}</span></div>
        <div class="credit-bar-track"><div class="credit-bar-fill ${barClass}" style="width:${pct}%"></div></div>
        <div style="font-size:11px;color:var(--text2);margin-top:3px">Disponible: ${fmt((d.limit||0)-(d.used||0))} · Corte: día ${d.cutDay||'--'} · Pago: día ${d.payDay||'--'}</div>
      </div>`;
  } else {
    const total = Number(d.amount||0);
    const rem   = Number(d.remaining||total);
    pct = total>0 ? Math.min(100,((total-rem)/total)*100) : 0;
    barHtml = `
      <div class="progress-wrap">
        <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text2);margin-bottom:4px">
          <span>Pagado: ${fmt(total-rem)}</span><span>Restante: ${fmt(rem)}</span>
        </div>
        <div class="progress-track"><div class="progress-fill" style="width:${pct}%;background:var(--green)"></div></div>
        ${d.monthlyPayment?`<div style="font-size:11px;color:var(--text2);margin-top:3px">Cuota mensual: ${fmt(d.monthlyPayment)}</div>`:''}
      </div>`;
  }

  return `<div class="debt-card">
    <div class="debt-header">
      <div>
        <div class="debt-name">${d.name}</div>
        ${d.dueDate?`<div style="font-size:11px;color:var(--text2);margin-top:2px">Vence: ${new Date(d.dueDate).toLocaleDateString('es-PE')}</div>`:''}
      </div>
      <div style="display:flex;gap:6px;align-items:center">
        <span class="debt-status ${status}">${statusTxt}</span>
        <button onclick="openEditDebtModal('${d.id}')" style="background:rgba(108,99,255,0.12);border-radius:6px;padding:4px 8px;color:var(--accent);font-size:12px">✏️</button>
        <button onclick="deleteDebt('${d.id}')" style="background:rgba(248,113,113,0.1);border-radius:6px;padding:4px 8px;color:var(--red);font-size:12px">✕</button>
      </div>
    </div>
    ${barHtml}
    ${d.note?`<div style="font-size:11px;color:var(--text2);margin-top:6px">📝 ${d.note}</div>`:''}
    <div style="display:flex;gap:8px;margin-top:10px">
      <button class="btn-sm" style="flex:1;background:var(--card2);color:var(--text)" onclick="openPayDebtModal('${d.id}')">💳 Registrar pago</button>
    </div>
  </div>`;
}

function deleteDebt(id) {
  if(!confirm('¿Eliminar esta deuda?')) return;
  state.debts = state.debts.filter(d=>d.id!==id);
  saveState(); renderDebts();
}

// ===== EDITAR DEUDA =====
function openEditDebtModal(id) {
  const d = state.debts.find(x=>x.id===id);
  if(!d) return;
  let extraFields = '';
  if(d.type==='card') {
    extraFields = `
      <div class="form-row">
        <div class="form-group"><label class="form-label">Límite de crédito</label><input class="form-input" id="ed-limit" type="number" value="${d.limit||0}"/></div>
        <div class="form-group"><label class="form-label">Monto usado</label><input class="form-input" id="ed-used" type="number" value="${d.used||0}"/></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Día de corte</label><input class="form-input" id="ed-cut" type="number" value="${d.cutDay||''}" min="1" max="31"/></div>
        <div class="form-group"><label class="form-label">Día de pago</label><input class="form-input" id="ed-pay" type="number" value="${d.payDay||''}" min="1" max="31"/></div>
      </div>`;
  } else {
    extraFields = `
      <div class="form-row">
        <div class="form-group"><label class="form-label">Monto total</label><input class="form-input" id="ed-amount" type="number" value="${d.amount||0}"/></div>
        <div class="form-group"><label class="form-label">Saldo restante</label><input class="form-input" id="ed-remaining" type="number" value="${d.remaining||0}"/></div>
      </div>
      ${d.type==='loan'?`<div class="form-group"><label class="form-label">Cuota mensual</label><input class="form-input" id="ed-monthly" type="number" value="${d.monthlyPayment||0}"/></div>`:''}`;
  }
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay open';
  overlay.innerHTML = `<div class="modal">
    <div class="modal-handle"></div>
    <div class="modal-title">Editar: ${d.name}</div>
    <div class="form-group"><label class="form-label">Nombre</label>
      <input class="form-input" id="ed-name" value="${d.name}"/>
    </div>
    ${extraFields}
    <div class="form-group"><label class="form-label">Fecha de vencimiento</label>
      <input class="form-input" id="ed-due" type="date" value="${d.dueDate||''}"/>
    </div>
    <div class="form-group"><label class="form-label">Nota</label>
      <input class="form-input" id="ed-note" value="${d.note||''}" placeholder="Entidad, tasa, etc..."/>
    </div>
    <button class="btn-primary" onclick="saveEditDebt('${id}', this.closest('.modal-overlay'))">Guardar cambios</button>
    <button class="btn-danger" style="margin-top:8px" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
  </div>`;
  overlay.onclick = e => { if(e.target===overlay) overlay.remove(); };
  document.body.appendChild(overlay);
}

function saveEditDebt(id, overlay) {
  const d = state.debts.find(x=>x.id===id);
  if(!d) return;
  d.name    = document.getElementById('ed-name')?.value.trim() || d.name;
  d.dueDate = document.getElementById('ed-due')?.value;
  d.note    = document.getElementById('ed-note')?.value;
  if(d.type==='card') {
    d.limit  = parseFloat(document.getElementById('ed-limit')?.value||0);
    d.used   = parseFloat(document.getElementById('ed-used')?.value||0);
    d.cutDay = document.getElementById('ed-cut')?.value;
    d.payDay = document.getElementById('ed-pay')?.value;
  } else {
    d.amount    = parseFloat(document.getElementById('ed-amount')?.value||0);
    d.remaining = parseFloat(document.getElementById('ed-remaining')?.value||0);
    if(d.type==='loan') d.monthlyPayment = parseFloat(document.getElementById('ed-monthly')?.value||0);
  }
  saveState(); overlay.remove(); renderDebts();
}

function markReimbursed(txId) {
  const tx = state.transactions.find(t=>t.id===txId);
  if(tx) { tx.reimbursed = true; saveState(); renderDebts(); }
}

function openPayDebtModal(debtId) {
  const debt = state.debts.find(d=>d.id===debtId);
  if(!debt) return;
  const accOpts = state.accounts.map(a=>`<option value="${a.id}">${a.name}</option>`).join('');
  const modal = document.createElement('div');
  modal.className = 'modal-overlay open';
  modal.innerHTML = `<div class="modal">
    <div class="modal-handle"></div>
    <div class="modal-title">Pagar: ${debt.name}</div>
    <div class="form-group"><label class="form-label">Monto del pago</label>
      <input class="form-input" id="pay-amount" type="number" placeholder="${debt.monthlyPayment||'0.00'}" inputmode="decimal" value="${debt.monthlyPayment||''}"/>
    </div>
    <div class="form-group"><label class="form-label">Desde cuenta</label>
      <select class="form-select" id="pay-account"><option value="">Sin cuenta</option>${accOpts}</select>
    </div>
    <div class="form-group"><label class="form-label">Fecha</label>
      <input class="form-input" id="pay-date" type="date" value="${new Date().toISOString().split('T')[0]}"/>
    </div>
    <button class="btn-primary" onclick="confirmDebtPayment('${debtId}',this.closest('.modal-overlay'))">Confirmar pago</button>
    <button class="btn-secondary" style="margin-top:8px" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
  </div>`;
  modal.onclick = e => { if(e.target===modal) modal.remove(); };
  document.body.appendChild(modal);
}

function confirmDebtPayment(debtId, overlay) {
  const amount  = parseFloat(document.getElementById('pay-amount')?.value);
  const accId   = document.getElementById('pay-account')?.value;
  const date    = document.getElementById('pay-date')?.value;
  if(!amount||amount<=0) { alert('Ingresa un monto válido'); return; }
  const debt = state.debts.find(d=>d.id===debtId);
  if(!debt) return;
  if(debt.type==='card') {
    debt.used = Math.max(0,(debt.used||0)-amount);
  } else {
    debt.remaining = Math.max(0,(debt.remaining||debt.amount||0)-amount);
  }
  state.transactions.push({id:uid(), type:'expense', description:`Pago: ${debt.name}`, amount, date, category:'services', accountId:accId, reimbursable:false, reimbursed:false, note:'Pago de deuda', createdAt:Date.now()});
  saveState(); overlay.remove(); renderDebts();
}

// ===== MODAL: AGREGAR DEUDA =====
function renderModalAddDebt(data) {
  const type = data?.type || 'card';
  const titles = {card:'Nueva tarjeta de crédito', loan:'Nuevo préstamo', personal:'Nueva deuda personal'};
  document.getElementById('modal-add-debt-title').textContent = titles[type] || 'Nueva deuda';

  let extraFields = '';
  if(type==='card') {
    extraFields = `
      <div class="form-row">
        <div class="form-group"><label class="form-label">Límite de crédito</label><input class="form-input" id="debt-limit" type="number" placeholder="0.00" inputmode="decimal"/></div>
        <div class="form-group"><label class="form-label">Monto usado</label><input class="form-input" id="debt-used" type="number" placeholder="0.00" inputmode="decimal"/></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Día de corte</label><input class="form-input" id="debt-cut" type="number" placeholder="15" min="1" max="31"/></div>
        <div class="form-group"><label class="form-label">Día de pago</label><input class="form-input" id="debt-pay" type="number" placeholder="5" min="1" max="31"/></div>
      </div>`;
  } else if(type==='loan') {
    extraFields = `
      <div class="form-row">
        <div class="form-group"><label class="form-label">Monto total</label><input class="form-input" id="debt-amount" type="number" placeholder="0.00" inputmode="decimal"/></div>
        <div class="form-group"><label class="form-label">Saldo restante</label><input class="form-input" id="debt-remaining" type="number" placeholder="0.00" inputmode="decimal"/></div>
      </div>
      <div class="form-group"><label class="form-label">Cuota mensual</label><input class="form-input" id="debt-monthly" type="number" placeholder="0.00" inputmode="decimal"/></div>`;
  } else {
    extraFields = `
      <div class="form-group"><label class="form-label">Monto</label><input class="form-input" id="debt-amount" type="number" placeholder="0.00" inputmode="decimal"/></div>`;
  }

  document.getElementById('modal-add-debt-body').innerHTML = `
    <div class="form-group"><label class="form-label">Nombre / Descripción</label><input class="form-input" id="debt-name" placeholder="Ej: BCP Visa, Préstamo personal..."/></div>
    ${extraFields}
    <div class="form-group"><label class="form-label">Fecha de vencimiento (próximo pago)</label><input class="form-input" id="debt-due" type="date"/></div>
    <div class="form-group"><label class="form-label">Nota (opcional)</label><input class="form-input" id="debt-note" placeholder="Entidad, tasa, etc..."/></div>
    <button class="btn-primary" onclick="saveDebt('${type}')">Guardar deuda</button>`;
}

function saveDebt(type) {
  const name = document.getElementById('debt-name')?.value.trim();
  if(!name) { alert('Ingresa un nombre'); return; }
  const debt = { id:uid(), type, name, dueDate: document.getElementById('debt-due')?.value, note: document.getElementById('debt-note')?.value, createdAt:Date.now() };
  if(type==='card') {
    debt.limit  = parseFloat(document.getElementById('debt-limit')?.value||0);
    debt.used   = parseFloat(document.getElementById('debt-used')?.value||0);
    debt.cutDay = document.getElementById('debt-cut')?.value;
    debt.payDay = document.getElementById('debt-pay')?.value;
  } else {
    debt.amount    = parseFloat(document.getElementById('debt-amount')?.value||0);
    debt.remaining = type==='loan' ? parseFloat(document.getElementById('debt-remaining')?.value||debt.amount) : debt.amount;
    if(type==='loan') debt.monthlyPayment = parseFloat(document.getElementById('debt-monthly')?.value||0);
  }
  state.debts.push(debt);
  saveState(); closeModal('modal-add-debt'); renderDebts();
}

// ===== RENDER METAS =====
function renderGoals() {
  // Proyección basada en últimos 3 meses
  let savings3 = [];
  for(let i=1;i<=3;i++) {
    let m = state.currentMonth-i, y = state.currentYear;
    if(m<0){m+=12;y--;}
    const inc = getMonthIncome(m,y);
    const exp = getMonthExpense(m,y);
    if(inc>0||exp>0) savings3.push(inc-exp);
  }
  const avgSaving = savings3.length ? savings3.reduce((s,v)=>s+v,0)/savings3.length : 0;

  document.getElementById('goals-projection').innerHTML = `
    <div class="card card-sm" style="margin-bottom:12px">
      <div class="card-title">Proyección de ahorro</div>
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div>
          <div style="font-size:11px;color:var(--text2)">Promedio últimos 3 meses</div>
          <div style="font-size:22px;font-weight:800;color:${avgSaving>=0?'var(--green)':'var(--red)'}">${fmt(avgSaving)}/mes</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:11px;color:var(--text2)">Proyección anual</div>
          <div style="font-size:16px;font-weight:700;color:${avgSaving>=0?'var(--green)':'var(--red)'}">${fmt(avgSaving*12)}</div>
        </div>
      </div>
    </div>`;

  const list = document.getElementById('goals-list');
  if(!state.goals.length) {
    list.innerHTML = `<div class="empty"><div class="empty-icon">🎯</div><div class="empty-text">Agrega tu primera meta</div></div>`;
    return;
  }
  list.innerHTML = state.goals.map(g => {
    const saved  = Number(g.saved||0);
    const target = Number(g.target||1);
    const pct    = Math.min(100, (saved/target)*100);
    const monthsLeft = avgSaving>0 ? Math.ceil((target-saved)/avgSaving) : null;
    const bankTags = (g.bankIds||[]).map(bid=>{
      const acc = state.accounts.find(a=>a.id===bid);
      if(!acc) return '';
      const bank = getBankById(acc.bankId);
      return `<span class="bank-chip" style="background:${bank.color}">${bank.name.slice(0,3)}</span>`;
    }).join('');

    return `<div class="goal-card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div class="goal-header" style="margin-bottom:0">
          <div class="goal-icon">${g.emoji||'🎯'}</div>
          <div>
            <div class="goal-title">${g.name}</div>
            <div class="goal-subtitle">${g.description||''}</div>
          </div>
        </div>
        <button onclick="openEditGoalModal('${g.id}')" style="background:rgba(108,99,255,0.12);border-radius:6px;padding:4px 8px;color:var(--accent);font-size:12px;margin-right:4px">✏️</button>
        <button onclick="deleteGoal('${g.id}')" style="background:rgba(248,113,113,0.1);border-radius:6px;padding:4px 8px;color:var(--red);font-size:12px">✕</button>
      </div>
      ${bankTags?`<div style="display:flex;gap:4px;flex-wrap:wrap;margin:8px 0">${bankTags}</div>`:''}
      <div class="progress-wrap" style="margin-top:10px">
        <div class="progress-track"><div class="progress-fill" style="width:${pct}%;background:${pct>=100?'var(--green)':'var(--accent)'}"></div></div>
      </div>
      <div class="goal-amounts">
        <span>${fmt(saved)} ahorrado</span>
        <span style="font-weight:700;color:${pct>=100?'var(--green)':'var(--text)'}">${pct.toFixed(0)}%</span>
        <span>Meta: ${fmt(target)}</span>
      </div>
      ${monthsLeft&&pct<100?`<div style="font-size:11px;color:var(--text2);margin-top:6px">📅 A este ritmo, llegarás en ~${monthsLeft} mes${monthsLeft>1?'es':''}</div>`:''}
      ${pct>=100?`<div class="alert-banner success" style="margin-top:8px;padding:8px 12px">🎉 ¡Meta alcanzada!</div>`:''}
    </div>`;
  }).join('');
}

function deleteGoal(id) {
  if(!confirm('¿Eliminar esta meta?')) return;
  state.goals = state.goals.filter(g=>g.id!==id);
  saveState(); renderGoals();
}

// ===== EDITAR META =====
function openEditGoalModal(id) {
  const g = state.goals.find(x=>x.id===id);
  if(!g) return;
  const accOpts = state.accounts.map(a=>`
    <label style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border);cursor:pointer">
      <input type="checkbox" value="${a.id}" ${(g.bankIds||[]).includes(a.id)?'checked':''} style="width:16px;height:16px;accent-color:var(--accent)">
      <span style="font-size:14px">${a.name}</span>
    </label>`).join('');
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay open';
  overlay.innerHTML = `<div class="modal">
    <div class="modal-handle"></div>
    <div class="modal-title">Editar meta</div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Emoji</label>
        <input class="form-input" id="eg-emoji" value="${g.emoji||'🎯'}" maxlength="2" style="font-size:22px;text-align:center"/>
      </div>
      <div class="form-group" style="flex:3"><label class="form-label">Nombre</label>
        <input class="form-input" id="eg-name" value="${g.name}"/>
      </div>
    </div>
    <div class="form-group"><label class="form-label">Descripción</label>
      <input class="form-input" id="eg-desc" value="${g.description||''}"/>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Monto objetivo</label>
        <input class="form-input" id="eg-target" type="number" value="${g.target}" inputmode="decimal"/>
      </div>
      <div class="form-group"><label class="form-label">Ya ahorrado</label>
        <input class="form-input" id="eg-saved" type="number" value="${g.saved||0}" inputmode="decimal"/>
      </div>
    </div>
    <div class="form-group"><label class="form-label">Fecha límite</label>
      <input class="form-input" id="eg-deadline" type="date" value="${g.deadline||''}"/>
    </div>
    <div class="form-group">
      <label class="form-label">Cuentas asignadas</label>
      <div style="background:var(--card);border-radius:var(--radius-sm);border:1px solid var(--border);padding:8px 12px">
        ${accOpts||'<div style="font-size:13px;color:var(--text2)">Sin cuentas</div>'}
      </div>
    </div>
    <button class="btn-primary" onclick="saveEditGoal('${id}', this.closest('.modal-overlay'))">Guardar cambios</button>
    <button class="btn-danger" style="margin-top:8px" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
  </div>`;
  overlay.onclick = e => { if(e.target===overlay) overlay.remove(); };
  document.body.appendChild(overlay);
}

function saveEditGoal(id, overlay) {
  const g = state.goals.find(x=>x.id===id);
  if(!g) return;
  const target = parseFloat(document.getElementById('eg-target')?.value);
  if(!target||target<=0) { alert('Ingresa un monto objetivo válido'); return; }
  g.emoji       = document.getElementById('eg-emoji')?.value || '🎯';
  g.name        = document.getElementById('eg-name')?.value.trim() || g.name;
  g.description = document.getElementById('eg-desc')?.value;
  g.target      = target;
  g.saved       = parseFloat(document.getElementById('eg-saved')?.value||0);
  g.deadline    = document.getElementById('eg-deadline')?.value;
  g.bankIds     = [...overlay.querySelectorAll('input[type=checkbox]:checked')].map(cb=>cb.value);
  saveState(); overlay.remove(); renderGoals();
}

// ===== MODAL: AGREGAR META =====
function renderModalAddGoal() {
  const accOpts = state.accounts.map(a=>`
    <label style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border);cursor:pointer">
      <input type="checkbox" value="${a.id}" style="width:16px;height:16px;accent-color:var(--accent)">
      <span style="font-size:14px">${a.name}</span>
    </label>`).join('');

  document.getElementById('modal-add-goal-body').innerHTML = `
    <div class="form-row">
      <div class="form-group"><label class="form-label">Emoji</label><input class="form-input" id="goal-emoji" placeholder="🎯" maxlength="2" style="font-size:22px;text-align:center"/></div>
      <div class="form-group" style="flex:3"><label class="form-label">Nombre de la meta</label><input class="form-input" id="goal-name" placeholder="Ej: Viaje a Cusco, Auto..."/></div>
    </div>
    <div class="form-group"><label class="form-label">Descripción (opcional)</label><input class="form-input" id="goal-desc" placeholder="Cuéntame sobre esta meta..."/></div>
    <div class="form-group"><label class="form-label">Monto objetivo</label><input class="form-input" id="goal-target" type="number" placeholder="0.00" inputmode="decimal"/></div>
    <div class="form-group"><label class="form-label">Ya tengo ahorrado</label><input class="form-input" id="goal-saved" type="number" placeholder="0.00" inputmode="decimal"/></div>
    <div class="form-group"><label class="form-label">Fecha límite (opcional)</label><input class="form-input" id="goal-deadline" type="date"/></div>
    <div class="form-group">
      <label class="form-label">Cuentas asignadas (opcional)</label>
      <div style="background:var(--card);border-radius:var(--radius-sm);border:1px solid var(--border);padding:8px 12px" id="goal-banks-list">
        ${accOpts||'<div style="font-size:13px;color:var(--text2);padding:8px 0">Sin cuentas registradas</div>'}
      </div>
    </div>
    <button class="btn-primary" onclick="saveGoal()">Guardar meta</button>`;
}

function saveGoal() {
  const name   = document.getElementById('goal-name')?.value.trim();
  const target = parseFloat(document.getElementById('goal-target')?.value);
  if(!name) { alert('Ingresa un nombre'); return; }
  if(!target||target<=0) { alert('Ingresa un monto objetivo'); return; }
  const bankIds = [...document.querySelectorAll('#goal-banks-list input[type=checkbox]:checked')].map(cb=>cb.value);
  state.goals.push({
    id:uid(), name, emoji: document.getElementById('goal-emoji')?.value||'🎯',
    description: document.getElementById('goal-desc')?.value,
    target, saved: parseFloat(document.getElementById('goal-saved')?.value||0),
    deadline: document.getElementById('goal-deadline')?.value,
    bankIds, createdAt:Date.now()
  });
  saveState(); closeModal('modal-add-goal'); renderGoals();
}

// ===== RENDER GASTOS FIJOS =====
function renderFixedExpenses() {
  const list = document.getElementById('fixed-expenses-list');
  if(!state.fixedExpenses.length) {
    list.innerHTML = `<div class="empty" style="padding:24px"><div class="empty-icon">📋</div><div class="empty-text">Sin gastos fijos registrados</div></div>`;
    return;
  }
  const today = new Date().getDate();
  list.innerHTML = state.fixedExpenses.map(f=>{
    const daysUntil = f.day - today;
    const isOverdue = daysUntil < 0;
    const isSoon    = daysUntil >= 0 && daysUntil <= 3;
    const acc = state.accounts.find(a=>a.id===f.accountId);
    return `<div class="fixed-item">
      <div class="fixed-icon">${f.emoji||'📋'}</div>
      <div class="fixed-info">
        <div class="fixed-name">${f.name}</div>
        <div class="fixed-meta">
          ${f.phone?`📞 ${f.phone} · `:''}
          ${f.holder?`👤 ${f.holder} · `:''}
          ${acc?`🏦 ${acc.name}`:'Sin cuenta'}
        </div>
      </div>
      <div class="fixed-right">
        <div class="fixed-amount text-red">${fmt(f.amount)}</div>
        <div class="fixed-day" style="color:${isOverdue?'var(--red)':isSoon?'var(--yellow)':'var(--text2)'}">
          ${isOverdue?`Venció hace ${Math.abs(daysUntil)}d`:isSoon?`Vence en ${daysUntil}d`:`Día ${f.day}`}
        </div>
        <button class="pay-btn" onclick="payFixedExpense('${f.id}')">Pagar ahora</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:4px;margin-left:4px">
        <button onclick="openEditFixedModal('${f.id}')" style="background:rgba(108,99,255,0.12);border-radius:6px;padding:4px 6px;color:var(--accent);font-size:12px">✏️</button>
        <button onclick="deleteFixed('${f.id}')" style="background:rgba(248,113,113,0.1);border-radius:6px;padding:4px 6px;color:var(--red);font-size:12px">✕</button>
      </div>
    </div>`;
  }).join('');
}

function payFixedExpense(id) {
  const f = state.fixedExpenses.find(x=>x.id===id);
  if(!f) return;
  state.transactions.push({
    id:uid(), type:'expense', description:f.name, amount:f.amount,
    date:new Date().toISOString().split('T')[0], category:'services',
    accountId:f.accountId, reimbursable:false, reimbursed:false,
    note:'Pago gasto fijo', createdAt:Date.now()
  });
  saveState(); renderMore();
  alert(`✅ Pago de ${f.name} registrado: ${fmt(f.amount)}`);
}

function deleteFixed(id) {
  if(!confirm('¿Eliminar este gasto fijo?')) return;
  state.fixedExpenses = state.fixedExpenses.filter(f=>f.id!==id);
  saveState(); renderMore();
}

// ===== EDITAR GASTO FIJO =====
function openEditFixedModal(id) {
  const f = state.fixedExpenses.find(x=>x.id===id);
  if(!f) return;
  const accOpts = state.accounts.map(a=>`<option value="${a.id}"${a.id===f.accountId?' selected':''}>${a.name}</option>`).join('');
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay open';
  overlay.innerHTML = `<div class="modal">
    <div class="modal-handle"></div>
    <div class="modal-title">Editar gasto fijo</div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Emoji</label>
        <input class="form-input" id="ef-emoji" value="${f.emoji||'📋'}" maxlength="2" style="font-size:22px;text-align:center"/>
      </div>
      <div class="form-group" style="flex:3"><label class="form-label">Nombre</label>
        <input class="form-input" id="ef-name" value="${f.name}"/>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Monto mensual</label>
        <input class="form-input" id="ef-amount" type="number" value="${f.amount}" inputmode="decimal"/>
      </div>
      <div class="form-group"><label class="form-label">Día de cobro</label>
        <input class="form-input" id="ef-day" type="number" value="${f.day}" min="1" max="31"/>
      </div>
    </div>
    <div class="form-group"><label class="form-label">Teléfono / N° cuenta servicio</label>
      <input class="form-input" id="ef-phone" value="${f.phone||''}" placeholder="Opcional"/>
    </div>
    <div class="form-group"><label class="form-label">Titular</label>
      <input class="form-input" id="ef-holder" value="${f.holder||''}" placeholder="Opcional"/>
    </div>
    <div class="form-group"><label class="form-label">Cuenta bancaria para débito</label>
      <select class="form-select" id="ef-account">
        <option value="">Sin cuenta</option>${accOpts}
      </select>
    </div>
    <button class="btn-primary" onclick="saveEditFixed('${id}', this.closest('.modal-overlay'))">Guardar cambios</button>
    <button class="btn-danger" style="margin-top:8px" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
  </div>`;
  overlay.onclick = e => { if(e.target===overlay) overlay.remove(); };
  document.body.appendChild(overlay);
}

function saveEditFixed(id, overlay) {
  const f = state.fixedExpenses.find(x=>x.id===id);
  if(!f) return;
  const amount = parseFloat(document.getElementById('ef-amount')?.value);
  const day    = parseInt(document.getElementById('ef-day')?.value);
  if(!amount||amount<=0) { alert('Ingresa un monto válido'); return; }
  if(!day||day<1||day>31) { alert('Ingresa un día válido (1-31)'); return; }
  f.emoji     = document.getElementById('ef-emoji')?.value || '📋';
  f.name      = document.getElementById('ef-name')?.value.trim() || f.name;
  f.amount    = amount;
  f.day       = day;
  f.phone     = document.getElementById('ef-phone')?.value;
  f.holder    = document.getElementById('ef-holder')?.value;
  f.accountId = document.getElementById('ef-account')?.value;
  saveState(); overlay.remove(); renderMore();
}

// ===== MODAL: GASTO FIJO =====
function renderModalAddFixed() {
  const accOpts = state.accounts.map(a=>`<option value="${a.id}">${a.name}</option>`).join('');
  document.getElementById('modal-add-fixed-body').innerHTML = `
    <div class="form-row">
      <div class="form-group"><label class="form-label">Emoji</label><input class="form-input" id="fixed-emoji" placeholder="📋" maxlength="2" style="font-size:22px;text-align:center"/></div>
      <div class="form-group" style="flex:3"><label class="form-label">Nombre del servicio</label><input class="form-input" id="fixed-name" placeholder="Ej: Netflix, Claro, Alquiler..."/></div>
    </div>
    <div class="form-group"><label class="form-label">Monto mensual</label><input class="form-input" id="fixed-amount" type="number" placeholder="0.00" inputmode="decimal"/></div>
    <div class="form-group"><label class="form-label">Día de cobro</label><input class="form-input" id="fixed-day" type="number" placeholder="Ej: 15" min="1" max="31"/></div>
    <div class="form-group"><label class="form-label">Teléfono / N° de cuenta del servicio</label><input class="form-input" id="fixed-phone" placeholder="Ej: 999-123-456 (opcional)"/></div>
    <div class="form-group"><label class="form-label">Titular del servicio</label><input class="form-input" id="fixed-holder" placeholder="Nombre del titular (opcional)"/></div>
    <div class="form-group"><label class="form-label">Cuenta bancaria para débito</label>
      <select class="form-select" id="fixed-account"><option value="">Sin cuenta</option>${accOpts}</select>
    </div>
    <button class="btn-primary" onclick="saveFixed()">Guardar gasto fijo</button>`;
}

function saveFixed() {
  const name   = document.getElementById('fixed-name')?.value.trim();
  const amount = parseFloat(document.getElementById('fixed-amount')?.value);
  const day    = parseInt(document.getElementById('fixed-day')?.value);
  if(!name) { alert('Ingresa el nombre'); return; }
  if(!amount||amount<=0) { alert('Ingresa el monto'); return; }
  if(!day||day<1||day>31) { alert('Ingresa un día válido (1-31)'); return; }
  state.fixedExpenses.push({
    id:uid(), name, emoji: document.getElementById('fixed-emoji')?.value||'📋',
    amount, day, phone: document.getElementById('fixed-phone')?.value,
    holder: document.getElementById('fixed-holder')?.value,
    accountId: document.getElementById('fixed-account')?.value, createdAt:Date.now()
  });
  saveState(); closeModal('modal-add-fixed'); renderMore();
}

// ===== RENDER MORE =====
function renderMore() {
  renderFixedExpenses();
  renderHistory();
}

// ===== HISTORIAL =====
function renderHistory() {
  const filter = document.getElementById('hist-filter-type')?.value || 'all';
  let txs = [...state.transactions].sort((a,b)=>new Date(b.date)-new Date(a.date));
  if(filter!=='all') txs = txs.filter(t=>t.type===filter);
  const list = document.getElementById('history-list');
  list.innerHTML = txs.length
    ? `<div class="card card-sm">${txs.map(txItem).join('')}</div>`
    : `<div class="empty"><div class="empty-icon">📂</div><div class="empty-text">Sin movimientos</div></div>`;
}

// ===== RENDER STATS =====
function renderStats() {
  switchStatTab(state.currentStatTab);
}

function switchStatTab(tab, btn) {
  state.currentStatTab = tab;
  if(btn) {
    document.querySelectorAll('#screen-stats .type-btn').forEach(b=>b.classList.remove('selected'));
    btn.classList.add('selected');
  }
  const m = state.currentMonth, y = state.currentYear;
  const txs     = getMonthTxs(m,y);
  const income  = getMonthIncome(m,y);
  const expense = getMonthExpense(m,y);
  const cont = document.getElementById('stats-content');

  if(tab==='current') {
    const cats = {};
    txs.filter(t=>t.type==='expense').forEach(t=>{
      cats[t.category] = (cats[t.category]||0)+Number(t.amount);
    });
    const catEntries = Object.entries(cats).sort((a,b)=>b[1]-a[1]);
    const colors = ['#6C63FF','#FF6584','#4ade80','#fbbf24','#60a5fa','#f97316','#a78bfa','#34d399','#fb923c','#38bdf8'];

    cont.innerHTML = `
      <div class="stat-grid">
        <div class="stat-box"><div class="stat-box-label">Ingresos</div><div class="stat-box-value text-green">${fmt(income)}</div></div>
        <div class="stat-box"><div class="stat-box-label">Gastos</div><div class="stat-box-value text-red">${fmt(expense)}</div></div>
        <div class="stat-box"><div class="stat-box-label">Balance</div><div class="stat-box-value" style="color:${income-expense>=0?'var(--green)':'var(--red)'}">${fmt(income-expense)}</div></div>
        <div class="stat-box"><div class="stat-box-label">Movimientos</div><div class="stat-box-value">${txs.length}</div></div>
      </div>
      <div class="card">
        <div class="card-title">Gastos por categoría</div>
        <div class="cat-list">
          ${catEntries.length ? catEntries.map(([catId,amt],i)=>{
            const cat = getCatById('expense',catId);
            const pct = expense>0?(amt/expense*100).toFixed(0):0;
            return `<div class="cat-item">
              <div class="cat-dot" style="background:${colors[i%colors.length]}"></div>
              <span class="cat-name">${cat.emoji} ${cat.name}</span>
              <span class="cat-pct">${pct}%</span>
              <span class="cat-amount text-red">${fmt(amt)}</span>
            </div>
            <div class="progress-track" style="margin-bottom:6px">
              <div class="progress-fill" style="width:${pct}%;background:${colors[i%colors.length]}"></div>
            </div>`;
          }).join('') : '<div style="color:var(--text2);font-size:13px">Sin gastos este mes</div>'}
        </div>
      </div>`;
  }

  else if(tab==='compare') {
    let pm = m-1, py = y;
    if(pm<0){pm=11;py--;}
    const pi = getMonthIncome(pm,py), pe = getMonthExpense(pm,py);
    const months = [];
    for(let i=5;i>=0;i--) {
      let mm=m-i,yy=y; if(mm<0){mm+=12;yy--;}
      months.push({m:mm,y:yy,l:MONTHS_SHORT[mm],inc:getMonthIncome(mm,yy),exp:getMonthExpense(mm,yy)});
    }
    const maxVal = Math.max(...months.map(x=>Math.max(x.inc,x.exp)),1);
    cont.innerHTML = `
      <div class="stat-grid">
        <div class="stat-box"><div class="stat-box-label">Mes anterior ing.</div><div class="stat-box-value text-green">${fmt(pi)}</div><div class="stat-box-change ${income>=pi?'up':'down'}">${income>=pi?'▲':'▼'} ${fmt(Math.abs(income-pi))}</div></div>
        <div class="stat-box"><div class="stat-box-label">Mes anterior gts.</div><div class="stat-box-value text-red">${fmt(pe)}</div><div class="stat-box-change ${expense<=pe?'up':'down'}">${expense<=pe?'▼':'▲'} ${fmt(Math.abs(expense-pe))}</div></div>
      </div>
      <div class="card">
        <div class="card-title">Últimos 6 meses</div>
        <div class="bar-chart">
          ${months.map(x=>`<div class="bar-group">
            <div class="bar income" style="height:${maxVal>0?(x.inc/maxVal*76):0}px"></div>
            <div class="bar expense" style="height:${maxVal>0?(x.exp/maxVal*76):0}px"></div>
          </div>`).join('')}
        </div>
        <div class="bar-labels">${months.map(x=>`<div class="bar-label">${x.l}</div>`).join('')}</div>
        <div style="display:flex;gap:12px;margin-top:8px;font-size:11px;color:var(--text2)">
          <span>🟢 Ingresos</span><span>🔴 Gastos</span>
        </div>
      </div>`;
  }

  else if(tab==='annual') {
    let totalInc=0,totalExp=0;
    const months=[];
    for(let mm=0;mm<12;mm++){
      const i=getMonthIncome(mm,y),e=getMonthExpense(mm,y);
      totalInc+=i; totalExp+=e;
      months.push({l:MONTHS_SHORT[mm],inc:i,exp:e,bal:i-e});
    }
    cont.innerHTML = `
      <div class="stat-grid">
        <div class="stat-box"><div class="stat-box-label">Ingresos ${y}</div><div class="stat-box-value text-green">${fmt(totalInc)}</div></div>
        <div class="stat-box"><div class="stat-box-label">Gastos ${y}</div><div class="stat-box-value text-red">${fmt(totalExp)}</div></div>
        <div class="stat-box"><div class="stat-box-label">Ahorro neto</div><div class="stat-box-value" style="color:${totalInc-totalExp>=0?'var(--green)':'var(--red)'}">${fmt(totalInc-totalExp)}</div></div>
        <div class="stat-box"><div class="stat-box-label">Promedio/mes</div><div class="stat-box-value">${fmt((totalInc-totalExp)/12)}</div></div>
      </div>
      <div class="card">
        <div class="card-title">Mes a mes ${y}</div>
        ${months.map(x=>`<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border)">
          <div style="width:32px;font-size:11px;color:var(--text2);font-weight:600">${x.l}</div>
          <div style="flex:1">
            <div class="progress-track" style="margin-bottom:3px"><div class="progress-fill" style="width:${totalInc>0?(x.inc/totalInc*100):0}%;background:rgba(74,222,128,0.7)"></div></div>
            <div class="progress-track"><div class="progress-fill" style="width:${totalExp>0?(x.exp/totalExp*100):0}%;background:rgba(248,113,113,0.7)"></div></div>
          </div>
          <div style="text-align:right;font-size:11px;font-weight:700;color:${x.bal>=0?'var(--green)':'var(--red)'};min-width:70px">${fmt(x.bal)}</div>
        </div>`).join('')}
      </div>`;
  }

  else if(tab==='top') {
    const expCats={}, incCats={};
    state.transactions.filter(t=>t.type==='expense').forEach(t=>{ expCats[t.category]=(expCats[t.category]||0)+Number(t.amount); });
    state.transactions.filter(t=>t.type==='income').forEach(t=>{ incCats[t.category]=(incCats[t.category]||0)+Number(t.amount); });
    const topExp = Object.entries(expCats).sort((a,b)=>b[1]-a[1]).slice(0,5);
    const topInc = Object.entries(incCats).sort((a,b)=>b[1]-a[1]).slice(0,5);
    const totalExp2 = topExp.reduce((s,x)=>s+x[1],0)||1;
    const totalInc2 = topInc.reduce((s,x)=>s+x[1],0)||1;
    cont.innerHTML = `
      <div class="card">
        <div class="card-title">Top categorías de gasto (histórico)</div>
        ${topExp.map(([catId,amt])=>{
          const cat=getCatById('expense',catId);
          return `<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border)">
            <span style="font-size:20px">${cat.emoji}</span>
            <div style="flex:1"><div style="font-size:13px;font-weight:600">${cat.name}</div>
              <div class="progress-track" style="margin-top:4px"><div class="progress-fill" style="width:${(amt/totalExp2*100).toFixed(0)}%;background:rgba(248,113,113,0.7)"></div></div>
            </div>
            <div style="text-align:right"><div style="font-size:13px;font-weight:700;color:var(--red)">${fmt(amt)}</div><div style="font-size:10px;color:var(--text2)">${(amt/totalExp2*100).toFixed(0)}%</div></div>
          </div>`;
        }).join('')||'<div style="color:var(--text2);font-size:13px">Sin datos</div>'}
      </div>
      <div class="card">
        <div class="card-title">Top categorías de ingreso (histórico)</div>
        ${topInc.map(([catId,amt])=>{
          const cat=getCatById('income',catId);
          return `<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border)">
            <span style="font-size:20px">${cat.emoji}</span>
            <div style="flex:1"><div style="font-size:13px;font-weight:600">${cat.name}</div>
              <div class="progress-track" style="margin-top:4px"><div class="progress-fill" style="width:${(amt/totalInc2*100).toFixed(0)}%;background:rgba(74,222,128,0.7)"></div></div>
            </div>
            <div style="text-align:right"><div style="font-size:13px;font-weight:700;color:var(--green)">${fmt(amt)}</div><div style="font-size:10px;color:var(--text2)">${(amt/totalInc2*100).toFixed(0)}%</div></div>
          </div>`;
        }).join('')||'<div style="color:var(--text2);font-size:13px">Sin datos</div>'}
      </div>`;
  }
}

// ===== CONFIGURACIÓN =====
function renderModalConfig() {
  const accents = ['#6C63FF','#FF6584','#4ade80','#fbbf24','#60a5fa','#f97316','#a78bfa','#ec4899'];
  document.getElementById('modal-config-body').innerHTML = `
    <div class="form-group">
      <label class="form-label">Moneda</label>
      <select class="form-select" id="cfg-currency" onchange="updateConfig()">
        <option value="S/" ${state.config.currency==='S/'?'selected':''}>S/ Soles (PEN)</option>
        <option value="$"  ${state.config.currency==='$'?'selected':''}>$ Dólares (USD)</option>
        <option value="€"  ${state.config.currency==='€'?'selected':''}>€ Euros (EUR)</option>
        <option value="CLP$" ${state.config.currency==='CLP$'?'selected':''}>CLP$ Pesos chilenos</option>
        <option value="COP$" ${state.config.currency==='COP$'?'selected':''}>COP$ Pesos colombianos</option>
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Tema</label>
      <div class="type-selector">
        <button class="type-btn ${state.config.theme==='dark'?'selected':''}" onclick="setThemeMode('dark',this)">🌙 Oscuro</button>
        <button class="type-btn ${state.config.theme==='light'?'selected':''}" onclick="setThemeMode('light',this)">☀️ Claro</button>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Color de acento</label>
      <div class="color-picker">
        ${accents.map(c=>`<div class="color-dot ${state.config.accent===c?'selected':''}" style="background:${c}" onclick="setAccent('${c}',this)"></div>`).join('')}
      </div>
    </div>
    <div style="border-top:1px solid var(--border);padding-top:16px;margin-top:8px">
      <button class="btn-danger" onclick="clearAllData()">🗑 Borrar todos los datos</button>
    </div>`;
}

function updateConfig() {
  state.config.currency = document.getElementById('cfg-currency')?.value || state.config.currency;
  saveState(); renderCurrentScreen();
}

function setThemeMode(mode, btn) {
  state.config.theme = mode;
  document.querySelectorAll('#modal-config-body .type-btn').forEach(b=>b.classList.remove('selected'));
  btn.classList.add('selected');
  applyTheme(); saveState();
}

function setAccent(color, dot) {
  state.config.accent = color;
  document.querySelectorAll('.color-dot').forEach(d=>d.classList.remove('selected'));
  dot.classList.add('selected');
  document.documentElement.style.setProperty('--accent', color);
  saveState();
}

function applyTheme() {
  document.documentElement.setAttribute('data-theme', state.config.theme||'dark');
  if(state.config.accent) document.documentElement.style.setProperty('--accent', state.config.accent);
}

function clearAllData() {
  if(!confirm('¿Seguro que quieres borrar TODOS los datos? Esta acción no se puede deshacer.')) return;
  state.transactions=[];state.accounts=[];state.debts=[];state.goals=[];state.fixedExpenses=[];state.transfers=[];
  saveState(); closeModal('modal-config'); renderCurrentScreen();
  alert('Datos eliminados correctamente.');
}

// ===== EXPORTAR / IMPORTAR =====
function exportCSV() {
  if(!state.transactions.length){alert('Sin movimientos para exportar');return;}
  const rows=[['Fecha','Tipo','Descripción','Monto','Categoría','Cuenta','Reembolsable','Nota']];
  state.transactions.forEach(t=>{
    const acc=state.accounts.find(a=>a.id===t.accountId);
    const cat=getCatById(t.type,t.category);
    rows.push([t.date,t.type,t.description,t.amount,cat.name,acc?.name||'',t.reimbursable?'Sí':'No',t.note||'']);
  });
  const csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);
  a.download=`FinControl_${new Date().toISOString().split('T')[0]}.csv`;a.click();
}

function exportBackup() {
  const data=JSON.stringify({...state,exportDate:new Date().toISOString(),version:'4.0'});
  const blob=new Blob([data],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);
  a.download=`FinControl_backup_${new Date().toISOString().split('T')[0]}.json`;a.click();
}

function importBackup(e) {
  const file=e.target.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=ev=>{
    try {
      const data=JSON.parse(ev.target.result);
      if(!data.transactions&&!data.accounts){alert('Archivo de backup inválido');return;}
      if(!confirm(`¿Importar backup del ${data.exportDate?.split('T')[0]||'fecha desconocida'}? Se reemplazarán los datos actuales.`))return;
      state.transactions  = data.transactions||[];
      state.accounts      = data.accounts||[];
      state.debts         = data.debts||[];
      state.goals         = data.goals||[];
      state.fixedExpenses = data.fixedExpenses||[];
      state.transfers     = data.transfers||[];
      if(data.config) state.config = {...state.config,...data.config};
      saveState();applyTheme();renderCurrentScreen();
      alert('✅ Backup importado correctamente');
    } catch(err){alert('Error al leer el archivo: '+err.message);}
  };
  reader.readAsText(file);
  e.target.value='';
}
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  applyTheme();
  document.getElementById('month-label').textContent = getMonthLabel();
  // Splash screen: esperar animación de carga (1.8s) luego ocultar
  setTimeout(() => {
    const splash = document.getElementById('splash-screen');
    if (splash) {
      splash.classList.add('hide');
      setTimeout(() => splash.remove(), 500);
    }
    showScreen('home');
  }, 1800);
});
