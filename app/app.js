/* 記帳 PWA：單機、離線、資料存在 IndexedDB */
'use strict';

// ---------- 基本工具 ----------
const $ = (sel, root = document) => root.querySelector(sel);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
const pad = (n) => String(n).padStart(2, '0');
const toDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => toDate(new Date());
const thisMonth = () => today().slice(0, 7);
const fmt = (n) => Math.abs(Math.round(n)).toLocaleString('zh-TW');
const signed = (n) => (n < 0 ? '−' : '') + fmt(n);
const WEEK = ['日', '一', '二', '三', '四', '五', '六'];
const dayLabel = (d) => { const [y, m, dd] = d.split('-').map(Number); const w = new Date(y, m - 1, dd).getDay(); return `${m}/${dd}（${WEEK[w]}）`; };
const shortDate = (d) => { const [, m, dd] = d.split('-').map(Number); return `${m}/${dd}`; };
const monthLabel = (ym) => { const [y, m] = ym.split('-').map(Number); return `${y} 年 ${m} 月`; };
const shiftMonth = (ym, k) => { const [y, m] = ym.split('-').map(Number); const d = new Date(y, m - 1 + k, 1); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; };

const COLORS = [
  { fg: '#C4471F', bg: '#FDE9E1' }, { fg: '#2F5A8A', bg: '#E8EEF6' }, { fg: '#6E3F86', bg: '#F3ECF6' },
  { fg: '#56632E', bg: '#EEF1E6' }, { fg: '#7A5A12', bg: '#FBF1DC' }, { fg: '#8A2F45', bg: '#F8E9EC' },
  { fg: '#23606F', bg: '#E6F1F4' }, { fg: '#4A524E', bg: '#EEEFED' }, { fg: '#127A68', bg: '#E2F3EF' },
  { fg: '#5B3FD1', bg: '#ECE8FB' },
];
const KIND = { cash: '現金', bank: '銀行', credit_card: '信用卡' };

const I = {
  home: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11l8-7 8 7v9H4z"/><path d="M10 20v-5h4v5"/></svg>',
  book: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h14v16H5z"/><path d="M9 9h6M9 13h6M9 17h3"/></svg>',
  plus: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  receipt: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/></svg>',
  gear: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/></svg>',
  left: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M15 6l-6 6 6 6"/></svg>',
  right: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 6l6 6-6 6"/></svg>',
  chev: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 6l6 6-6 6"/></svg>',
  search: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/></svg>',
  back: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6h11v12H9l-6-6z"/><path d="M12 10l4 4M16 10l-4 4"/></svg>',
  transfer: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h14l-3-3M20 16H6l3 3"/></svg>',
  upload: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>',
  up: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 15l6-6 6 6"/></svg>',
  down: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>',
};

// ---------- 狀態 ----------
const S = { accounts: [], categories: [], txs: [], invoices: [], rules: [], meta: {} };
const UI = {
  month: thisMonth(),
  draft: null,
  ledger: { q: '', type: 'all', accountId: '' },
  remember: {},
  catType: 'expense',
  pendingRestore: null,
  exportFrom: '', exportTo: '',
};

const DEFAULT_CATS = [
  ['飲食', 'expense', 0], ['交通', 'expense', 1], ['購物', 'expense', 2], ['居家', 'expense', 3],
  ['娛樂', 'expense', 4], ['醫療', 'expense', 5], ['學習', 'expense', 6], ['其他', 'expense', 7],
  ['薪資', 'income', 8], ['獎金', 'income', 4], ['投資', 'income', 1], ['其他收入', 'income', 7],
];

async function load() {
  await DB.open();
  for (const name of ['accounts', 'categories', 'txs', 'invoices', 'rules']) S[name] = await DB.all(name);
  S.meta = Object.fromEntries((await DB.all('meta')).map((m) => [m.key, m.value]));
  if (!S.meta.seeded) {
    S.categories = DEFAULT_CATS.map(([name, type, color], i) => ({ id: uid(), name, type, color, sort: i }));
    S.accounts = [{ id: uid(), name: '錢包', kind: 'cash', opening: 0, sort: 0, isDefault: true, archived: false }];
    await DB.putMany('categories', S.categories);
    await DB.putMany('accounts', S.accounts);
    await setMeta('seeded', true);
  }
}
async function setMeta(key, value) { S.meta[key] = value; await DB.put('meta', { key, value }); }
async function save(store, obj) {
  const list = S[store];
  const key = store === 'invoices' ? 'invNum' : 'id';
  const i = list.findIndex((x) => x[key] === obj[key]);
  if (i >= 0) list[i] = obj; else list.push(obj);
  await DB.put(store, obj);
}
async function remove(store, keyVal) {
  const key = store === 'invoices' ? 'invNum' : 'id';
  S[store] = S[store].filter((x) => x[key] !== keyVal);
  await DB.del(store, keyVal);
}

// ---------- 查詢 ----------
const cat = (id) => S.categories.find((c) => c.id === id);
const acct = (id) => S.accounts.find((a) => a.id === id);
const catsOf = (type) => S.categories.filter((c) => c.type === type).sort((a, b) => a.sort - b.sort);
const activeAccounts = () => S.accounts.filter((a) => !a.archived).sort((a, b) => a.sort - b.sort);
const defaultAccount = () => activeAccounts().find((a) => a.isDefault) || activeAccounts()[0];
const confirmed = () => S.txs.filter((t) => t.status !== 'pending');
const pendingInvoiceTxs = () => S.txs.filter((t) => t.status === 'pending').sort((a, b) => (a.date < b.date ? 1 : -1));
function balance(a) {
  let b = Number(a.opening) || 0;
  for (const t of confirmed()) {
    if (t.type === 'income' && t.accountId === a.id) b += t.amount;
    if (t.type === 'expense' && t.accountId === a.id) b -= t.amount;
    if (t.type === 'transfer') { if (t.accountId === a.id) b -= t.amount; if (t.toAccountId === a.id) b += t.amount; }
  }
  return b;
}
function monthTotals(ym) {
  let inc = 0, exp = 0;
  for (const t of confirmed()) {
    if (!t.date.startsWith(ym)) continue;
    if (t.type === 'income') inc += t.amount;
    if (t.type === 'expense') exp += t.amount;
  }
  return { inc, exp, net: inc - exp };
}
const sortTx = (a, b) => (a.date === b.date ? (b.createdAt || '').localeCompare(a.createdAt || '') : (a.date < b.date ? 1 : -1));

// ---------- 共用畫面片段 ----------
function badgeFor(t) {
  if (t.type === 'transfer') return `<div class="badge" style="background:var(--primary-tint);color:var(--primary)">${I.transfer}</div>`;
  const c = cat(t.categoryId);
  const col = COLORS[(c?.color ?? 7) % COLORS.length];
  return `<div class="badge" style="background:${col.bg};color:${col.fg}">${esc((c?.name || '？').slice(0, 1))}</div>`;
}
function txTitle(t) { return t.type === 'transfer' ? '轉帳' : (cat(t.categoryId)?.name || '未分類'); }
function txSub(t, withDate) {
  const parts = [];
  if (withDate) parts.push(shortDate(t.date));
  if (t.type === 'transfer') parts.push(`${acct(t.accountId)?.name || '？'} → ${acct(t.toAccountId)?.name || '？'}`);
  else parts.push(acct(t.accountId)?.name || '？');
  if (t.note) parts.push(t.note);
  if (t.source === 'invoice') { const inv = S.invoices.find((i) => i.invNum === t.invoiceId); parts.push(inv?.seller ? `發票 · ${inv.seller}` : '發票'); }
  return parts.map(esc).join(' · ');
}
function txAmount(t) {
  if (t.type === 'income') return `<div class="amt in">+${fmt(t.amount)}</div>`;
  if (t.type === 'transfer') return `<div class="amt tr">${fmt(t.amount)}</div>`;
  return `<div class="amt out">−${fmt(t.amount)}</div>`;
}
function txRow(t, withDate) {
  return `<button class="item" data-act="edit-tx" data-id="${t.id}">${badgeFor(t)}<div class="main"><div class="t">${esc(txTitle(t))}</div><div class="s">${txSub(t, withDate)}</div></div>${txAmount(t)}</button>`;
}
function topbar(title, { back, backLabel = '返回', end = '' } = {}) {
  const left = back ? `<a class="link-btn" href="${back}">${I.left}${esc(backLabel)}</a>` : '';
  return `<div class="topbar"><div class="side">${left}</div><div class="title">${esc(title)}</div><div class="side end">${end}</div></div>`;
}
function monthNav(prefix) {
  return `<div class="topbar"><button class="icon-btn" data-act="month" data-k="-1" aria-label="上個月">${I.left}</button><div class="title">${esc(prefix)}${monthLabel(UI.month)}</div><button class="icon-btn" data-act="month" data-k="1" aria-label="下個月">${I.right}</button></div>`;
}
function accountOptions(selected, { includeArchived = false } = {}) {
  const list = includeArchived ? S.accounts : activeAccounts();
  return list.map((a) => `<option value="${a.id}" ${a.id === selected ? 'selected' : ''}>${esc(a.name)}（${KIND[a.kind]}）</option>`).join('');
}
function categoryOptions(type, selected) {
  return catsOf(type).map((c) => `<option value="${c.id}" ${c.id === selected ? 'selected' : ''}>${esc(c.name)}</option>`).join('');
}

// ---------- 畫面：首頁 ----------
function viewHome() {
  const t = monthTotals(UI.month);
  const accts = activeAccounts();
  const recent = confirmed().filter((x) => x.date.startsWith(UI.month)).sort(sortTx).slice(0, 5);
  const pending = pendingInvoiceTxs().length;
  return `<div class="stack">
    ${monthNav('')}
    <div class="card summary">
      <div><div class="muted small">本月結餘</div><div class="big">NT$ ${t.net < 0 ? '−' : ''}${fmt(t.net)}</div></div>
      <div class="split">
        <div class="pill in"><span class="small">收入</span><b>${fmt(t.inc)}</b></div>
        <div class="pill out"><span class="small">支出</span><b>${fmt(t.exp)}</b></div>
      </div>
    </div>
    <div>
      <div class="row-between" style="margin-bottom:8px"><h2>我的帳戶</h2><a href="#accounts" class="small">管理</a></div>
      <div class="acct-strip">${accts.map((a) => { const b = balance(a); return `<a class="acct-chip" href="#accounts"><span>${esc(a.name)}</span><b class="${b < 0 ? 'amt neg' : ''}">${signed(b)}</b></a>`; }).join('')}</div>
    </div>
    ${pending ? `<button class="banner" data-act="go" data-href="#invoices">${I.receipt}<span>${pending} 張發票待確認分類</span>${I.right}</button>` : ''}
    <div class="row-between"><h2>最近紀錄</h2><a href="#ledger" class="small">看全部</a></div>
    ${recent.length ? `<div class="card list">${recent.map((x) => txRow(x, true)).join('')}</div>` : `<div class="card empty">這個月還沒有紀錄，按下方「＋」記第一筆</div>`}
  </div>`;
}

// ---------- 畫面：新增／編輯 ----------
function newDraft(type = 'expense') {
  const last = S.meta.lastAccountId && acct(S.meta.lastAccountId) && !acct(S.meta.lastAccountId).archived ? S.meta.lastAccountId : defaultAccount()?.id;
  const others = activeAccounts().filter((a) => a.id !== last);
  return { id: null, type, expr: '', categoryId: catsOf(type === 'income' ? 'income' : 'expense')[0]?.id, accountId: last, toAccountId: others[0]?.id || '', date: today(), note: '' };
}
function draftFromTx(t) {
  return { id: t.id, type: t.type, expr: String(t.amount), categoryId: t.categoryId, accountId: t.accountId, toAccountId: t.toAccountId || '', date: t.date, note: t.note || '', source: t.source, invoiceId: t.invoiceId, createdAt: t.createdAt };
}
function evalExpr(expr) {
  const s = expr.replace(/−/g, '-');
  if (!/^[0-9+\-]*$/.test(s) || !s) return 0;
  const parts = s.match(/[+\-]?[0-9]+/g) || [];
  return parts.reduce((sum, p) => sum + parseInt(p, 10), 0);
}
function amountDisplay() {
  const d = UI.draft;
  const val = evalExpr(d.expr);
  const showExpr = /[+−]/.test(d.expr);
  return `<span class="cur">NT$</span><span class="num">${val ? fmt(val) : '0'}</span>${showExpr ? `<span class="expr">${esc(d.expr)}</span>` : ''}`;
}
function viewAdd() {
  const d = UI.draft || (UI.draft = newDraft());
  const isTr = d.type === 'transfer';
  const catType = d.type === 'income' ? 'income' : 'expense';
  const cats = catsOf(catType);
  const seg = ['expense', 'income', 'transfer'].map((k) => `<button data-act="draft-type" data-type="${k}" aria-pressed="${d.type === k}">${{ expense: '支出', income: '收入', transfer: '轉帳' }[k]}</button>`).join('');
  const catGrid = isTr ? '' : `<div class="card cat-grid">${cats.map((c) => { const col = COLORS[c.color % COLORS.length]; return `<button class="cat" data-act="draft-cat" data-id="${c.id}" aria-pressed="${d.categoryId === c.id}"><span class="badge" style="background:${col.bg};color:${col.fg}">${esc(c.name.slice(0, 1))}</span>${esc(c.name)}</button>`; }).join('')}<a class="cat" href="#categories" data-act="cat-manage" data-type="${catType}"><span class="badge" style="background:var(--soft);color:var(--sub)">＋</span>管理</a></div>`;
  const acctFields = isTr
    ? `<label class="field"><span>轉出</span><select data-bind="accountId">${accountOptions(d.accountId)}</select></label>
       <label class="field"><span>轉入</span><select data-bind="toAccountId">${accountOptions(d.toAccountId)}</select></label>`
    : `<label class="field"><span>帳戶</span><select data-bind="accountId">${accountOptions(d.accountId)}</select></label>`;
  const keys = ['1', '2', '3', 'del', '4', '5', '6', '+', '7', '8', '9', '−', '00', '0', 'clear', 'save'];
  const keypad = keys.map((k) => {
    if (k === 'del') return `<button class="key" data-act="key" data-k="del" aria-label="刪除一位">${I.back}</button>`;
    if (k === 'clear') return `<button class="key" data-act="key" data-k="clear" style="font-size:16px">清除</button>`;
    if (k === 'save') return `<button class="key save" data-act="save-tx">${d.id ? '更新' : '儲存'}</button>`;
    return `<button class="key" data-act="key" data-k="${k}">${k}</button>`;
  }).join('');
  const del = d.id ? `<button class="link-btn" data-act="delete-tx" style="color:var(--expense)">刪除</button>` : '';
  return `<div class="stack" style="gap:12px">
    ${topbar(d.id ? '編輯紀錄' : '新增紀錄', { back: '#home', backLabel: '取消', end: del })}
    <div class="seg" role="group" aria-label="收支類型">${seg}</div>
    <div class="amount-display" id="amount">${amountDisplay()}</div>
    ${catGrid}
    <div class="card fields">
      ${acctFields}
      <label class="field"><span>日期</span><input type="date" data-bind="date" value="${esc(d.date)}"></label>
      <label class="field"><span>備註</span><input type="text" data-bind="note" value="${esc(d.note)}" placeholder="例如：早餐" maxlength="60"></label>
    </div>
    <div class="keypad">${keypad}</div>
  </div>`;
}
function pressKey(k) {
  const d = UI.draft;
  if (k === 'del') d.expr = d.expr.slice(0, -1);
  else if (k === 'clear') d.expr = '';
  else if (k === '+' || k === '−') { if (d.expr && !/[+−]$/.test(d.expr)) d.expr += k; }
  else if (d.expr.replace(/[+−]/g, '').length < 12) d.expr = (d.expr === '0' ? '' : d.expr) + k;
  $('#amount').innerHTML = amountDisplay();
}
async function saveDraft() {
  const d = UI.draft;
  const amount = evalExpr(d.expr);
  if (amount <= 0) return toast('請輸入大於 0 的金額');
  if (!d.accountId) return toast('請先建立帳戶');
  if (d.type === 'transfer') {
    if (!d.toAccountId || d.toAccountId === d.accountId) return toast('轉出與轉入帳戶需不同');
  } else if (!d.categoryId) return toast('請選分類');
  const now = new Date().toISOString();
  const t = {
    id: d.id || uid(), type: d.type, amount, accountId: d.accountId,
    toAccountId: d.type === 'transfer' ? d.toAccountId : null,
    categoryId: d.type === 'transfer' ? null : d.categoryId,
    date: d.date || today(), note: d.note.trim(), source: d.source || 'manual', invoiceId: d.invoiceId || null,
    status: 'confirmed', createdAt: d.createdAt || now, updatedAt: now,
  };
  await save('txs', t);
  await setMeta('lastAccountId', d.accountId);
  UI.month = t.date.slice(0, 7);
  UI.draft = null;
  toast(d.id ? '已更新' : '已記下一筆');
  go(d.id ? '#ledger' : '#home');
}

// ---------- 畫面：帳本 ----------
function viewLedger() {
  const f = UI.ledger;
  const q = f.q.trim().toLowerCase();
  const list = confirmed().filter((t) => {
    if (!t.date.startsWith(UI.month)) return false;
    if (f.type !== 'all' && t.type !== f.type) return false;
    if (f.accountId && t.accountId !== f.accountId && t.toAccountId !== f.accountId) return false;
    if (q) {
      const inv = t.invoiceId ? S.invoices.find((i) => i.invNum === t.invoiceId) : null;
      const hay = [t.note, txTitle(t), acct(t.accountId)?.name, inv?.seller].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }).sort(sortTx);
  const m = monthTotals(UI.month);
  const groups = [];
  for (const t of list) {
    const g = groups[groups.length - 1];
    if (g && g.date === t.date) g.items.push(t); else groups.push({ date: t.date, items: [t] });
  }
  const typeChip = (k, label) => `<button class="chip" data-act="ledger-type" data-type="${k}" aria-pressed="${f.type === k}">${label}</button>`;
  const body = groups.length ? groups.map((g) => {
    const net = g.items.reduce((s, t) => s + (t.type === 'income' ? t.amount : t.type === 'expense' ? -t.amount : 0), 0);
    const onlyTr = g.items.every((t) => t.type === 'transfer');
    return `<div><div class="day-head"><span>${dayLabel(g.date)}</span><span>${onlyTr ? '不計收支' : (net > 0 ? '+' : net < 0 ? '−' : '') + fmt(net)}</span></div><div class="card list">${g.items.map((t) => txRow(t, false)).join('')}</div></div>`;
  }).join('') : `<div class="card empty">${q || f.type !== 'all' || f.accountId ? '沒有符合條件的紀錄' : '這個月還沒有紀錄'}</div>`;
  return `<div class="stack" style="gap:12px">
    ${monthNav('帳本 · ')}
    <label class="search">${I.search}<input type="search" data-act="ledger-q" placeholder="搜尋備註、分類或店家" value="${esc(f.q)}" aria-label="搜尋"></label>
    <div class="chips">${typeChip('all', '全部')}${typeChip('expense', '支出')}${typeChip('income', '收入')}${typeChip('transfer', '轉帳')}
      <select class="chip" data-act="ledger-acct" aria-label="篩選帳戶"><option value="">所有帳戶</option>${accountOptions(f.accountId, { includeArchived: true })}</select></div>
    <div class="totals"><span>收入 <b style="color:var(--income)">${fmt(m.inc)}</b></span><span>支出 <b style="color:var(--expense)">${fmt(m.exp)}</b></span><span>結餘 <b style="color:var(--ink)">${m.net < 0 ? '−' : ''}${fmt(m.net)}</b></span></div>
    ${body}
  </div>`;
}

// ---------- 發票匯入 ----------
function parseCSV(text) {
  text = text.replace(/^﻿/, '');
  const rows = []; let row = []; let cell = ''; let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else inQ = false; }
      else cell += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      if (row.some((c) => c !== '')) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c !== '')) rows.push(row);
  return rows;
}
function parseInvoiceFile(text) {
  const rows = parseCSV(text);
  if (!rows.length) throw new Error('檔案是空的');
  const head = rows[0].map((h) => h.trim());
  const col = (name) => head.indexOf(name);
  const need = ['消費時間', '發票號碼', '店家名稱', '總計'];
  const missing = need.filter((n) => col(n) < 0);
  if (missing.length) throw new Error(`找不到欄位：${missing.join('、')}，請確認是財政部平台下載的發票檔`);
  const c = { time: col('消費時間'), num: col('發票號碼'), seller: col('店家名稱'), ban: col('賣方統編'), item: col('消費品項'), price: col('單價'), qty: col('個數'), sub: col('小計'), total: col('總計') };
  const map = new Map();
  for (const r of rows.slice(1)) {
    const num = (r[c.num] || '').trim();
    if (!num) continue;
    let inv = map.get(num);
    if (!inv) {
      const raw = (r[c.time] || '').trim();
      const m = raw.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
      if (!m) continue;
      const date = `${m[1]}-${pad(m[2])}-${pad(m[3])}`;
      const time = m[4] ? `${pad(m[4])}:${m[5]}` : null;
      inv = { invNum: num, date, time: time === '23:59' && m[6] === '59' ? null : time, seller: (r[c.seller] || '').trim(), ban: c.ban >= 0 ? (r[c.ban] || '').trim() : '', amount: null, items: [] };
      map.set(num, inv);
    }
    const totalRaw = (r[c.total] || '').trim();
    if (totalRaw !== '' && inv.amount === null) inv.amount = Math.round(Number(totalRaw.replace(/,/g, '')));
    if (c.item >= 0 && (r[c.item] || '').trim()) {
      inv.items.push({ name: r[c.item].trim(), price: Number(r[c.price]) || 0, qty: Number(r[c.qty]) || 0, subtotal: Number(r[c.sub]) || 0 });
    }
  }
  const list = [...map.values()];
  for (const inv of list) {
    const sum = Math.round(inv.items.reduce((s, it) => s + it.subtotal, 0));
    if (inv.amount === null || Number.isNaN(inv.amount)) inv.amount = sum;
    inv.mismatch = inv.items.length > 0 && sum !== inv.amount;
  }
  return list;
}
function findRule(inv) {
  return S.rules.find((r) => r.ban && inv.ban && r.ban === inv.ban) || S.rules.find((r) => r.keyword && inv.seller.includes(r.keyword));
}
async function importInvoices(file) {
  const text = await file.text();
  let list;
  try { list = parseInvoiceFile(text); } catch (e) { return toast(e.message); }
  const otherCat = catsOf('expense').find((c) => c.name === '其他') || catsOf('expense')[0];
  const fallbackAcct = (S.meta.invoiceAccountId && acct(S.meta.invoiceAccountId)) ? S.meta.invoiceAccountId : defaultAccount()?.id;
  let added = 0, skipped = 0;
  const now = new Date().toISOString();
  for (const inv of list) {
    if (S.invoices.some((x) => x.invNum === inv.invNum)) { skipped++; continue; }
    const rule = findRule(inv);
    const tx = {
      id: uid(), type: 'expense', amount: inv.amount, accountId: rule?.accountId && acct(rule.accountId) ? rule.accountId : fallbackAcct,
      toAccountId: null, categoryId: rule?.categoryId && cat(rule.categoryId) ? rule.categoryId : otherCat?.id,
      date: inv.date, note: '', source: 'invoice', invoiceId: inv.invNum, status: 'pending', createdAt: now, updatedAt: now,
    };
    await save('invoices', { ...inv, importedAt: now, txId: tx.id });
    if (inv.amount > 0) { await save('txs', tx); added++; }
    else skipped++;
  }
  await setMeta('lastImport', { file: file.name, at: today(), added, skipped });
  toast(`新增 ${added} 張，略過 ${skipped} 張`);
  render();
}
function viewInvoices() {
  const pending = pendingInvoiceTxs();
  const li = S.meta.lastImport;
  const cards = pending.map((t) => {
    const inv = S.invoices.find((i) => i.invNum === t.invoiceId) || { items: [] };
    const rem = UI.remember[t.id] !== false;
    const items = inv.items.length ? `<details><summary>${inv.items.length} 個品項</summary>${inv.items.map((it) => `<div class="line"><span>${esc(it.name)}${it.qty > 1 ? ` × ${it.qty}` : ''}</span><span>${it.subtotal < 0 ? '−' : ''}${fmt(it.subtotal)}</span></div>`).join('')}</details>` : '';
    return `<div class="card inv">
      <div class="row-between" style="align-items:flex-start"><div><div style="font-weight:700">${esc(inv.seller || t.note)}</div><div class="small muted">${shortDate(t.date)}${inv.time ? ' ' + inv.time : ''} · ${esc(t.invoiceId)}</div></div><div class="amt" style="font-size:17px">−${fmt(t.amount)}</div></div>
      ${inv.mismatch ? '<div class="warn">品項小計加總與發票總計不符，已以總計為準</div>' : ''}
      ${items}
      <div class="pickers">
        <label>分類<select data-act="inv-cat" data-id="${t.id}">${categoryOptions('expense', t.categoryId)}</select></label>
        <label>付款帳戶<select data-act="inv-acct" data-id="${t.id}">${accountOptions(t.accountId)}</select></label>
      </div>
      <div class="actions">
        <label><input type="checkbox" data-act="inv-remember" data-id="${t.id}" ${rem ? 'checked' : ''}>記住此店家的分類與帳戶</label>
        <button class="btn ghost" data-act="inv-ignore" data-id="${t.id}" style="height:40px">略過</button>
        <button class="btn" data-act="inv-confirm" data-id="${t.id}" style="height:40px">確認</button>
      </div>
    </div>`;
  }).join('');
  return `<div class="stack">
    <div class="topbar"><h1>發票</h1><button class="btn" data-act="import" style="height:40px;display:flex;align-items:center;gap:6px">${I.upload}匯入發票檔</button></div>
    <div class="card pad" style="padding:12px 14px">${li ? `<div class="small muted">上次匯入 · ${esc(li.at)}</div><div style="font-size:14px;overflow-wrap:anywhere">${esc(li.file)} · 新增 ${li.added} 張，略過 ${li.skipped} 張</div>` : `<div style="font-size:14px">到財政部電子發票整合服務平台下載載具消費明細 CSV，再按「匯入發票檔」。重複的發票會自動略過。</div>`}</div>
    <label class="card fields"><span class="field" style="border:0"><span style="width:auto">新發票預設付款帳戶</span><select data-act="inv-default-acct" style="text-align:right">${accountOptions(S.meta.invoiceAccountId && acct(S.meta.invoiceAccountId) ? S.meta.invoiceAccountId : defaultAccount()?.id)}</select></span></label>
    <div class="row-between"><h2>待確認 ${pending.length} 張</h2><span class="small muted">確認後才計入支出</span></div>
    ${cards || '<div class="card empty">沒有待確認的發票</div>'}
    ${pending.length > 1 ? `<div class="sticky-actions"><button class="btn dark block" data-act="inv-confirm-all">全部確認（${pending.length}）</button></div>` : ''}
  </div>`;
}
async function confirmInvoiceTx(id, quiet) {
  const t = S.txs.find((x) => x.id === id);
  if (!t) return;
  t.status = 'confirmed'; t.updatedAt = new Date().toISOString();
  await save('txs', t);
  const inv = S.invoices.find((i) => i.invNum === t.invoiceId);
  if (inv && UI.remember[id] !== false) {
    let rule = findRule(inv);
    if (!rule) rule = { id: uid(), keyword: inv.seller, ban: inv.ban };
    rule.categoryId = t.categoryId; rule.accountId = t.accountId;
    await save('rules', rule);
    for (const p of pendingInvoiceTxs()) {
      const pi = S.invoices.find((i) => i.invNum === p.invoiceId);
      if (pi && findRule(pi) === rule && !p.touched) { p.categoryId = rule.categoryId; p.accountId = rule.accountId; await save('txs', p); }
    }
  }
  delete UI.remember[id];
  if (!quiet) { toast('已確認'); render(); }
}

// ---------- 畫面：設定 ----------
function viewSettings() {
  const lb = S.meta.lastBackup;
  return `<div class="stack">
    <div class="topbar"><h1>設定</h1></div>
    <div><div class="section-label">記帳</div><div class="card list">
      <a class="srow" href="#accounts"><span class="main">帳戶管理</span><span class="small muted">${activeAccounts().length} 個</span>${I.chev}</a>
      <a class="srow" href="#categories" data-act="cat-manage" data-type="expense"><span class="main">支出分類</span><span class="small muted">${catsOf('expense').length} 個</span>${I.chev}</a>
      <a class="srow" href="#categories" data-act="cat-manage" data-type="income"><span class="main">收入分類</span><span class="small muted">${catsOf('income').length} 個</span>${I.chev}</a>
      <a class="srow" href="#rules"><span class="main">自動分類規則</span><span class="small muted">${S.rules.length} 條</span>${I.chev}</a>
    </div></div>
    <div><div class="section-label">資料</div><div class="card list">
      <a class="srow" href="#export"><span class="main"><span>匯出 CSV</span><span class="s">選擇日期區間，Excel 可直接開啟</span></span>${I.chev}</a>
      <button class="srow" data-act="backup"><span class="main"><span>備份資料</span><span class="s">上次備份：${lb ? esc(lb) : '尚未備份'}</span></span>${I.chev}</button>
      <button class="srow" data-act="restore"><span class="main"><span>從備份還原</span><span class="s">換手機時使用，會覆蓋目前資料</span></span>${I.chev}</button>
    </div></div>
    <div class="note">資料只存在這台手機的瀏覽器裡。建議每月備份一次，把備份檔存到雲端硬碟或電腦。清除瀏覽器資料會刪掉所有紀錄。</div>
    <div class="small muted" style="text-align:center">記帳 PWA · 版本 1.0</div>
  </div>`;
}

// ---------- 畫面：帳戶管理 ----------
function viewAccounts() {
  const list = activeAccounts();
  const archived = S.accounts.filter((a) => a.archived);
  const net = list.reduce((s, a) => s + balance(a), 0);
  const row = (a) => { const b = balance(a); const col = a.kind === 'credit_card' ? COLORS[0] : a.kind === 'bank' ? COLORS[8] : COLORS[4]; return `<button class="item" data-act="edit-acct" data-id="${a.id}"><div class="badge" style="background:${col.bg};color:${col.fg}">${esc(a.name.slice(0, 1))}</div><div class="main"><div class="t">${esc(a.name)}</div><div class="s">${KIND[a.kind]}${a.isDefault ? ' · 預設帳戶' : ''}${a.kind === 'credit_card' && b < 0 ? ' · 未繳' : ''}</div></div><div class="amt ${b < 0 ? 'neg' : ''}">${signed(b)}</div></button>`; };
  return `<div class="stack">
    ${topbar('帳戶管理', { back: '#settings', backLabel: '設定' })}
    <div style="background:var(--primary);color:#fff;border-radius:26px;padding:18px 20px"><div class="small" style="opacity:.85">淨資產（資產 − 信用卡未繳）</div><div style="font-size:32px;font-weight:700">NT$ ${signed(net)}</div></div>
    <div class="card list">${list.map(row).join('') || '<div class="empty">還沒有帳戶</div>'}</div>
    ${archived.length ? `<div><div class="section-label">已封存</div><div class="card list">${archived.map(row).join('')}</div></div>` : ''}
    <button class="btn block" data-act="edit-acct" data-id="">＋ 新增帳戶</button>
  </div>`;
}
function acctSheet(a) {
  const isNew = !a;
  a = a || { name: '', kind: 'bank', opening: 0, isDefault: false, archived: false };
  const used = !isNew && S.txs.some((t) => t.accountId === a.id || t.toAccountId === a.id);
  return `<div class="sheet form" role="dialog" aria-modal="true" aria-label="${isNew ? '新增帳戶' : '編輯帳戶'}">
    <h2>${isNew ? '新增帳戶' : '編輯帳戶'}</h2>
    <label class="lbl">名稱<input class="input" id="f-name" value="${esc(a.name)}" placeholder="例如：郵局帳戶" maxlength="20"></label>
    <div class="lbl" style="display:flex;flex-direction:column;gap:6px;font-size:12px;color:var(--sub)">類型<div class="chips" role="group" aria-label="帳戶類型">${Object.entries(KIND).map(([k, v]) => `<button class="chip" data-act="pick-kind" data-kind="${k}" aria-pressed="${a.kind === k}">${v}</button>`).join('')}</div></div>
    <label class="lbl">期初餘額（信用卡未繳請填負數）<input class="input" id="f-opening" inputmode="numeric" value="${esc(a.opening)}"></label>
    <label style="display:flex;align-items:center;gap:8px;min-height:44px"><input type="checkbox" id="f-default" ${a.isDefault ? 'checked' : ''} style="width:20px;height:20px;accent-color:var(--primary)">設為預設帳戶</label>
    ${isNew ? '' : `<label style="display:flex;align-items:center;gap:8px;min-height:44px"><input type="checkbox" id="f-archived" ${a.archived ? 'checked' : ''} style="width:20px;height:20px;accent-color:var(--primary)">封存（不再出現在選單，保留舊紀錄）</label>`}
    <div class="btn-row"><button class="btn ghost" data-act="close">取消</button><button class="btn" data-act="save-acct" data-id="${isNew ? '' : a.id}">儲存</button></div>
    ${isNew ? '' : used ? '<div class="small muted">此帳戶已有紀錄，無法刪除，可改用封存。</div>' : `<button class="btn danger block" data-act="delete-acct" data-id="${a.id}">刪除帳戶</button>`}
  </div>`;
}

// ---------- 畫面：分類管理 ----------
function viewCategories() {
  const type = UI.catType;
  const list = catsOf(type);
  return `<div class="stack">
    ${topbar(type === 'income' ? '收入分類' : '支出分類', { back: '#settings', backLabel: '設定' })}
    <div class="seg" style="grid-template-columns:repeat(2,minmax(0,1fr))"><button data-act="cat-type" data-type="expense" aria-pressed="${type === 'expense'}">支出分類</button><button data-act="cat-type" data-type="income" aria-pressed="${type === 'income'}">收入分類</button></div>
    <div class="card list">${list.map((c, i) => { const col = COLORS[c.color % COLORS.length]; const n = S.txs.filter((t) => t.categoryId === c.id).length; return `<div class="item" style="padding:8px 8px 8px 14px"><div class="badge" style="background:${col.bg};color:${col.fg}">${esc(c.name.slice(0, 1))}</div><div class="main"><div class="t">${esc(c.name)}</div><div class="s">${n} 筆紀錄</div></div><button class="icon-btn" data-act="cat-move" data-id="${c.id}" data-k="-1" aria-label="上移" ${i === 0 ? 'disabled' : ''}>${I.up}</button><button class="icon-btn" data-act="cat-move" data-id="${c.id}" data-k="1" aria-label="下移" ${i === list.length - 1 ? 'disabled' : ''}>${I.down}</button><button class="link-btn" data-act="edit-cat" data-id="${c.id}">編輯</button></div>`; }).join('')}</div>
    <button class="btn block" data-act="edit-cat" data-id="">＋ 新增分類</button>
  </div>`;
}
function catSheet(c) {
  const isNew = !c;
  c = c || { name: '', color: 9, type: UI.catType };
  const usedN = isNew ? 0 : S.txs.filter((t) => t.categoryId === c.id).length;
  const others = isNew ? [] : catsOf(c.type).filter((x) => x.id !== c.id);
  return `<div class="sheet form" role="dialog" aria-modal="true" aria-label="${isNew ? '新增分類' : '編輯分類'}">
    <h2>${isNew ? '新增' : '編輯'}${c.type === 'income' ? '收入' : '支出'}分類</h2>
    <label class="lbl">名稱<input class="input" id="f-name" value="${esc(c.name)}" placeholder="例如：寵物" maxlength="8"></label>
    <div style="display:flex;flex-direction:column;gap:6px;font-size:12px;color:var(--sub)">顏色<div class="swatches" role="group" aria-label="顏色">${COLORS.map((col, i) => `<button class="swatch" data-act="pick-color" data-i="${i}" aria-pressed="${c.color === i}" aria-label="顏色 ${i + 1}" style="background:${col.bg};color:${col.fg}">${esc((c.name || '字').slice(0, 1))}</button>`).join('')}</div></div>
    <div class="btn-row"><button class="btn ghost" data-act="close">取消</button><button class="btn" data-act="save-cat" data-id="${isNew ? '' : c.id}">儲存</button></div>
    ${isNew ? '' : others.length === 0 ? '<div class="small muted">至少要保留一個分類。</div>' : `<div class="card pad form" style="border-color:var(--expense-tint)"><div style="font-size:14px">刪除此分類${usedN ? `，並把 ${usedN} 筆紀錄改到：` : ''}</div>${usedN ? `<select class="input" id="f-move">${categoryOptions(c.type, others[0].id).replace(new RegExp(`<option value="${c.id}"[^<]*</option>`), '')}</select>` : ''}<button class="btn danger block" data-act="delete-cat" data-id="${c.id}">刪除分類</button></div>`}
  </div>`;
}

// ---------- 畫面：自動分類規則 ----------
function viewRules() {
  return `<div class="stack">
    ${topbar('自動分類規則', { back: '#settings', backLabel: '設定' })}
    <div class="note">確認發票時勾選「記住此店家」就會新增規則。之後匯入同一家店的發票，會自動帶入分類與付款帳戶。</div>
    ${S.rules.length ? `<div class="card list">${S.rules.map((r) => `<div class="item" style="padding:10px 8px 10px 14px"><div class="main"><div class="t">${esc(r.keyword || r.ban)}</div><div class="s">${esc(cat(r.categoryId)?.name || '—')} · ${esc(acct(r.accountId)?.name || '—')}${r.ban ? ' · 統編 ' + esc(r.ban) : ''}</div></div><button class="link-btn" data-act="delete-rule" data-id="${r.id}" style="color:var(--expense)">刪除</button></div>`).join('')}</div>` : '<div class="card empty">還沒有規則</div>'}
  </div>`;
}

// ---------- 畫面：匯出 CSV ----------
function viewExport() {
  if (!UI.exportFrom) { UI.exportFrom = `${UI.month}-01`; const [y, m] = UI.month.split('-').map(Number); UI.exportTo = toDate(new Date(y, m, 0)); }
  const n = confirmed().filter((t) => t.date >= UI.exportFrom && t.date <= UI.exportTo).length;
  return `<div class="stack">
    ${topbar('匯出 CSV', { back: '#settings', backLabel: '設定' })}
    <div class="card pad form">
      <label class="lbl">起日<input class="input" type="date" data-act="exp-from" value="${UI.exportFrom}"></label>
      <label class="lbl">訖日<input class="input" type="date" data-act="exp-to" value="${UI.exportTo}"></label>
      <div class="small muted" id="exp-count">共 ${n} 筆紀錄（不含待確認發票）</div>
      <button class="btn block" data-act="do-export">匯出</button>
    </div>
    <div class="note">檔案為 UTF-8 編碼，用 Excel 開啟中文不會亂碼。欄位：日期、類型、分類、金額、帳戶、轉入帳戶、備註、來源、發票號碼、商店。</div>
  </div>`;
}
function csvCell(v) { const s = String(v ?? ''); return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }
function doExport() {
  const from = UI.exportFrom, to = UI.exportTo;
  if (from > to) return toast('起日不能晚於訖日');
  const rows = confirmed().filter((t) => t.date >= from && t.date <= to).sort((a, b) => (a.date === b.date ? (a.createdAt || '').localeCompare(b.createdAt || '') : a.date < b.date ? -1 : 1));
  const head = ['日期', '類型', '分類', '金額', '帳戶', '轉入帳戶', '備註', '來源', '發票號碼', '商店'];
  const lines = [head.join(',')];
  for (const t of rows) {
    const inv = t.invoiceId ? S.invoices.find((i) => i.invNum === t.invoiceId) : null;
    lines.push([t.date, { income: '收入', expense: '支出', transfer: '轉帳' }[t.type], t.type === 'transfer' ? '' : cat(t.categoryId)?.name, t.amount, acct(t.accountId)?.name, t.type === 'transfer' ? acct(t.toAccountId)?.name : '', t.note, t.source === 'invoice' ? '發票' : '手動', t.invoiceId || '', inv?.seller || ''].map(csvCell).join(','));
  }
  download(`jizhang_${from.replace(/-/g, '')}_${to.replace(/-/g, '')}.csv`, '﻿' + lines.join('\r\n'), 'text/csv;charset=utf-8');
  toast(`已匯出 ${rows.length} 筆`);
}
function download(name, content, type) {
  const blob = new Blob([content], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
async function doBackup() {
  const data = {};
  for (const n of ['accounts', 'categories', 'txs', 'invoices', 'rules']) data[n] = S[n];
  data.meta = Object.entries(S.meta).filter(([k]) => k !== 'lastBackup').map(([key, value]) => ({ key, value }));
  const stamp = today();
  download(`jizhang_backup_${stamp.replace(/-/g, '')}.json`, JSON.stringify({ app: 'jizhang', version: 1, exportedAt: new Date().toISOString(), data }), 'application/json');
  await setMeta('lastBackup', stamp);
  toast('備份檔已下載，請存到雲端硬碟或電腦');
  render();
}
async function readRestore(file) {
  try {
    const obj = JSON.parse(await file.text());
    if (obj.app !== 'jizhang' || !obj.data) throw new Error();
    UI.pendingRestore = obj;
    const n = (obj.data.txs || []).length;
    openSheet(`<div class="sheet form" role="dialog" aria-modal="true" aria-label="還原備份"><h2>還原備份？</h2><div style="font-size:14px">備份時間：${esc((obj.exportedAt || '').slice(0, 10))}，共 ${n} 筆紀錄。<br>目前手機上的資料會被<b>全部取代</b>。</div><div class="btn-row"><button class="btn ghost" data-act="close">取消</button><button class="btn" data-act="do-restore">還原</button></div></div>`);
  } catch { toast('這不是記帳的備份檔'); }
}

// ---------- 對話框、提示、導覽 ----------
let toastTimer;
function toast(msg) {
  const el = $('#toast'); el.textContent = msg; el.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.hidden = true; }, 2400);
}
let sheetState = {};
function openSheet(html, state = {}) { sheetState = state; const m = $('#modal'); m.innerHTML = html; m.hidden = false; const f = m.querySelector('input'); if (f) setTimeout(() => f.focus(), 50); }
function closeSheet() { const m = $('#modal'); m.hidden = true; m.innerHTML = ''; sheetState = {}; }
function go(hash) { if (location.hash === hash) render(); else location.hash = hash; }

const TABS = [['#home', '首頁', I.home], ['#ledger', '帳本', I.book], ['#add', '', I.plus], ['#invoices', '發票', I.receipt], ['#settings', '設定', I.gear]];
function route() { return (location.hash || '#home').split('?')[0]; }
function render() {
  const r = route();
  const views = { '#home': viewHome, '#add': viewAdd, '#ledger': viewLedger, '#invoices': viewInvoices, '#settings': viewSettings, '#accounts': viewAccounts, '#categories': viewCategories, '#rules': viewRules, '#export': viewExport };
  const fn = views[r] || viewHome;
  const showNav = ['#home', '#ledger', '#invoices', '#settings'].includes(r) || !views[r];
  const view = $('#view');
  view.innerHTML = fn();
  view.classList.toggle('no-nav', !showNav);
  const nav = $('#tabbar');
  nav.hidden = !showNav;
  const pending = pendingInvoiceTxs().length;
  nav.innerHTML = TABS.map(([h, label, icon]) => h === '#add'
    ? `<button class="fab" data-act="new-tx" aria-label="新增紀錄">${icon}</button>`
    : `<a class="tab" href="${h}" ${r === h ? 'aria-current="page"' : ''}>${icon}${label}${h === '#invoices' && pending ? `<span class="sr-only">，${pending} 張待確認</span>` : ''}</a>`).join('');
}

// ---------- 事件 ----------
document.addEventListener('click', async (e) => {
  const el = e.target.closest('[data-act]');
  if (!el) { if (e.target.id === 'modal') closeSheet(); return; }
  const act = el.dataset.act;
  const id = el.dataset.id;
  switch (act) {
    case 'go': go(el.dataset.href); break;
    case 'month': UI.month = shiftMonth(UI.month, Number(el.dataset.k)); render(); break;
    case 'new-tx': UI.draft = newDraft(); go('#add'); break;
    case 'edit-tx': { const t = S.txs.find((x) => x.id === id); if (t) { UI.draft = draftFromTx(t); go('#add'); } break; }
    case 'draft-type': {
      const d = UI.draft; d.type = el.dataset.type;
      const ct = d.type === 'income' ? 'income' : 'expense';
      if (d.type !== 'transfer' && !catsOf(ct).some((c) => c.id === d.categoryId)) d.categoryId = catsOf(ct)[0]?.id;
      if (d.type === 'transfer' && (!d.toAccountId || d.toAccountId === d.accountId)) d.toAccountId = activeAccounts().find((a) => a.id !== d.accountId)?.id || '';
      render(); break;
    }
    case 'draft-cat': UI.draft.categoryId = id; document.querySelectorAll('.cat[data-act="draft-cat"]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.id === id)); break;
    case 'key': pressKey(el.dataset.k); break;
    case 'save-tx': await saveDraft(); break;
    case 'delete-tx':
      openSheet(`<div class="sheet form" role="dialog" aria-modal="true" aria-label="刪除紀錄"><h2>刪除這筆紀錄？</h2><div class="btn-row"><button class="btn ghost" data-act="close">取消</button><button class="btn" style="background:var(--expense)" data-act="confirm-delete-tx">刪除</button></div></div>`);
      break;
    case 'confirm-delete-tx': {
      const d = UI.draft; closeSheet();
      if (d?.id) {
        const t = S.txs.find((x) => x.id === d.id);
        if (t?.invoiceId) { const inv = S.invoices.find((i) => i.invNum === t.invoiceId); if (inv) { inv.ignored = true; await save('invoices', inv); } }
        await remove('txs', d.id);
      }
      UI.draft = null; toast('已刪除'); go('#ledger'); break;
    }
    case 'ledger-type': UI.ledger.type = el.dataset.type; render(); break;
    case 'cat-manage': UI.catType = el.dataset.type || 'expense'; break;
    case 'cat-type': UI.catType = el.dataset.type; render(); break;
    case 'cat-move': {
      const list = catsOf(UI.catType); const i = list.findIndex((c) => c.id === id); const j = i + Number(el.dataset.k);
      if (j < 0 || j >= list.length) break;
      [list[i], list[j]] = [list[j], list[i]];
      list.forEach((c, k) => { c.sort = k; });
      await DB.putMany('categories', list); render(); break;
    }
    case 'edit-cat': openSheet(catSheet(id ? cat(id) : null), { color: id ? cat(id).color : 9 }); break;
    case 'pick-color': sheetState.color = Number(el.dataset.i); document.querySelectorAll('.swatch').forEach((b) => b.setAttribute('aria-pressed', b.dataset.i === el.dataset.i)); break;
    case 'save-cat': {
      const name = $('#f-name').value.trim();
      if (!name) return toast('請輸入名稱');
      const c = id ? cat(id) : { id: uid(), type: UI.catType, sort: catsOf(UI.catType).length };
      if (S.categories.some((x) => x.type === c.type && x.name === name && x.id !== c.id)) return toast('已有同名分類');
      c.name = name; c.color = sheetState.color ?? 9;
      await save('categories', c); closeSheet(); toast('已儲存'); render(); break;
    }
    case 'delete-cat': {
      const c = cat(id); const moveTo = $('#f-move')?.value;
      for (const t of S.txs.filter((x) => x.categoryId === id)) { t.categoryId = moveTo; await save('txs', t); }
      for (const r of S.rules.filter((x) => x.categoryId === id)) { r.categoryId = moveTo || null; await save('rules', r); }
      await remove('categories', c.id); closeSheet(); toast('已刪除分類'); render(); break;
    }
    case 'edit-acct': openSheet(acctSheet(id ? acct(id) : null), { kind: id ? acct(id).kind : 'bank' }); break;
    case 'pick-kind': sheetState.kind = el.dataset.kind; document.querySelectorAll('[data-act="pick-kind"]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.kind === sheetState.kind)); break;
    case 'save-acct': {
      const name = $('#f-name').value.trim();
      if (!name) return toast('請輸入名稱');
      const opening = Math.round(Number(($('#f-opening').value || '0').replace(/[,\s]/g, '').replace('−', '-')));
      if (Number.isNaN(opening)) return toast('期初餘額請輸入數字');
      const a = id ? acct(id) : { id: uid(), sort: S.accounts.length, archived: false };
      a.name = name; a.kind = sheetState.kind || 'bank'; a.opening = opening;
      a.isDefault = $('#f-default').checked;
      if ($('#f-archived')) a.archived = $('#f-archived').checked;
      if (a.isDefault) { for (const o of S.accounts) if (o.id !== a.id && o.isDefault) { o.isDefault = false; await save('accounts', o); } }
      await save('accounts', a); closeSheet(); toast('已儲存'); render(); break;
    }
    case 'delete-acct': await remove('accounts', id); closeSheet(); toast('已刪除帳戶'); render(); break;
    case 'import': $('#file-invoice').click(); break;
    case 'inv-confirm': await confirmInvoiceTx(id); break;
    case 'inv-confirm-all': { const ids = pendingInvoiceTxs().map((t) => t.id); for (const x of ids) await confirmInvoiceTx(x, true); toast(`已確認 ${ids.length} 張`); render(); break; }
    case 'inv-ignore': {
      const t = S.txs.find((x) => x.id === id);
      const inv = S.invoices.find((i) => i.invNum === t?.invoiceId);
      if (inv) { inv.ignored = true; await save('invoices', inv); }
      await remove('txs', id); toast('已略過，之後匯入也不會再出現'); render(); break;
    }
    case 'delete-rule': await remove('rules', id); render(); break;
    case 'do-export': doExport(); break;
    case 'backup': await doBackup(); break;
    case 'restore': $('#file-restore').click(); break;
    case 'do-restore': {
      const obj = UI.pendingRestore; if (!obj) break;
      await DB.replaceAll(obj.data);
      for (const n of ['accounts', 'categories', 'txs', 'invoices', 'rules']) S[n] = obj.data[n] || [];
      S.meta = Object.fromEntries((obj.data.meta || []).map((m) => [m.key, m.value]));
      await setMeta('seeded', true);
      UI.pendingRestore = null; closeSheet(); toast('已還原'); go('#home'); break;
    }
    case 'close': closeSheet(); break;
  }
});

document.addEventListener('input', (e) => {
  const el = e.target;
  if (el.dataset.bind && UI.draft) UI.draft[el.dataset.bind] = el.value;
  if (el.dataset.act === 'ledger-q') {
    UI.ledger.q = el.value;
    const pos = el.selectionStart; render();
    const n = $('[data-act="ledger-q"]'); n.focus(); n.setSelectionRange(pos, pos);
  }
});
document.addEventListener('change', async (e) => {
  const el = e.target;
  const act = el.dataset.act;
  if (el.dataset.bind && UI.draft) UI.draft[el.dataset.bind] = el.value;
  if (act === 'ledger-acct') { UI.ledger.accountId = el.value; render(); }
  if (act === 'inv-cat' || act === 'inv-acct') {
    const t = S.txs.find((x) => x.id === el.dataset.id);
    if (t) { if (act === 'inv-cat') t.categoryId = el.value; else t.accountId = el.value; t.touched = true; await save('txs', t); }
  }
  if (act === 'inv-remember') UI.remember[el.dataset.id] = el.checked;
  if (act === 'inv-default-acct') { await setMeta('invoiceAccountId', el.value); toast('之後匯入的發票會預設用這個帳戶'); }
  if (act === 'exp-from' || act === 'exp-to') {
    if (act === 'exp-from') UI.exportFrom = el.value; else UI.exportTo = el.value;
    const n = confirmed().filter((t) => t.date >= UI.exportFrom && t.date <= UI.exportTo).length;
    $('#exp-count').textContent = `共 ${n} 筆紀錄（不含待確認發票）`;
  }
  if (el.id === 'file-invoice' && el.files[0]) { await importInvoices(el.files[0]); el.value = ''; }
  if (el.id === 'file-restore' && el.files[0]) { await readRestore(el.files[0]); el.value = ''; }
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#modal').hidden) closeSheet(); });
window.addEventListener('hashchange', () => {
  if (route() === '#add' && !UI.draft) UI.draft = newDraft();
  if (route() !== '#add') UI.draft = null;
  closeSheet(); render(); window.scrollTo(0, 0);
});

// ---------- 啟動 ----------
(async () => {
  try {
    await load();
    if (navigator.storage?.persist) navigator.storage.persist().catch(() => {});
  } catch (err) {
    $('#view').innerHTML = `<div class="card pad">無法開啟資料庫：${esc(err.message || err)}</div>`;
    return;
  }
  render();
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
