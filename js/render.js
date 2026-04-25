import { collectPlayers } from './inputs.js';

// 半荘テーブル / 結果テーブル / 場代債務者セレクトの P1〜P4 表示をプレイヤー名に置換
export function applyPlayerNames() {
  const players = collectPlayers();
  document.querySelectorAll('.player-head, .result-head').forEach((th) => {
    const idx = Number(th.dataset.head);
    th.textContent = players[idx] || `P${idx + 1}`;
  });
  const payer = document.getElementById('rent-payer');
  if (payer) {
    const current = payer.value;
    Array.from(payer.options).forEach((opt) => {
      if (opt.value === '') return;
      const idx = Number(opt.value);
      opt.textContent = players[idx] || `P${idx + 1}`;
    });
    payer.value = current;
  }
}

function fmtPts(n) {
  if (n === 0) return '±0';
  const sign = n > 0 ? '+' : '−';
  return sign + Math.abs(Math.round(n * 10) / 10).toLocaleString();
}

function fmtYen(n) {
  if (n === 0) return '±¥0';
  const sign = n > 0 ? '+' : '−';
  return sign + '¥' + Math.abs(Math.round(n)).toLocaleString();
}

function colorize(td, n) {
  if (n < 0) td.classList.add('val-negative');
  else if (n > 0) td.classList.add('val-positive');
}

function renderSettleTable(settledRows, total) {
  const tbody = document.getElementById('settle-tbody');
  tbody.innerHTML = '';
  let any = false;
  for (let i = 0; i < settledRows.length; i++) {
    const row = settledRows[i];
    if (!row) continue;
    any = true;
    const tr = document.createElement('tr');
    const numTd = document.createElement('td');
    numTd.className = 'row-num';
    numTd.textContent = String(i + 1);
    tr.appendChild(numTd);
    if (row.error) {
      const td = document.createElement('td');
      td.colSpan = 4;
      td.textContent = row.error;
      td.classList.add('val-error');
      tr.appendChild(td);
    } else {
      for (let p = 0; p < 4; p++) {
        const td = document.createElement('td');
        td.textContent = fmtPts(row[p]);
        colorize(td, row[p]);
        tr.appendChild(td);
      }
    }
    tbody.appendChild(tr);
  }
  if (!any) {
    tbody.innerHTML =
      '<tr><td colspan="5" class="placeholder">入力データがありません</td></tr>';
    return;
  }
  const totalTr = document.createElement('tr');
  totalTr.className = 'row-total';
  const th = document.createElement('th');
  th.textContent = '合計';
  totalTr.appendChild(th);
  for (let p = 0; p < 4; p++) {
    const td = document.createElement('td');
    td.textContent = fmtPts(total[p]);
    colorize(td, total[p]);
    totalTr.appendChild(td);
  }
  tbody.appendChild(totalTr);
}

function renderCostTable(cost) {
  const tbody = document.getElementById('cost-tbody');
  tbody.innerHTML = '';
  if (cost.error) {
    tbody.innerHTML = `<tr><td colspan="4" class="val-error">${cost.error}</td></tr>`;
    return;
  }
  const tr = document.createElement('tr');
  for (let p = 0; p < 4; p++) {
    const td = document.createElement('td');
    td.textContent = fmtYen(cost.yen[p]);
    colorize(td, cost.yen[p]);
    tr.appendChild(td);
  }
  tbody.appendChild(tr);
}

function renderRankTable(rankTable, players) {
  const tbody = document.getElementById('rank-tbody');
  tbody.innerHTML = '';
  for (let p = 0; p < 4; p++) {
    const tr = document.createElement('tr');
    const th = document.createElement('th');
    th.textContent = players[p] || `P${p + 1}`;
    tr.appendChild(th);
    for (let r = 0; r < 4; r++) {
      const td = document.createElement('td');
      td.textContent = String(rankTable[p][r]);
      tr.appendChild(td);
    }
    const avgTd = document.createElement('td');
    avgTd.textContent = rankTable[p][4].toFixed(2);
    avgTd.style.fontWeight = '700';
    tr.appendChild(avgTd);
    tbody.appendChild(tr);
  }
}

function renderStatsTable(stats) {
  const tbody = document.getElementById('stats-tbody');
  tbody.innerHTML = '';
  const statRows = [
    { label: '平均得点', data: stats.avg },
    { label: '最高得点', data: stats.max },
  ];
  for (const { label, data } of statRows) {
    const tr = document.createElement('tr');
    const th = document.createElement('th');
    th.textContent = label;
    tr.appendChild(th);
    for (let p = 0; p < 4; p++) {
      const td = document.createElement('td');
      td.textContent = data[p].toLocaleString();
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
}

// 結果タブの全テーブルを更新
export function renderResults({ players, settledRows, total, cost, rankTable, stats }) {
  applyPlayerNames();
  renderSettleTable(settledRows, total);
  renderCostTable(cost);
  renderRankTable(rankTable, players);
  renderStatsTable(stats);
}
