import { HANCHAN_ROWS, KAZE_OPTIONS } from './constants.js';

// 半荘記録テーブルの行を動的生成
export function buildHanchanRows() {
  const tbody = document.getElementById('hanchan-tbody');
  const frag = document.createDocumentFragment();

  for (let i = 0; i < HANCHAN_ROWS; i++) {
    const tr = document.createElement('tr');

    const numTd = document.createElement('td');
    numTd.className = 'row-num';
    numTd.textContent = String(i + 1);
    tr.appendChild(numTd);

    for (let p = 0; p < 4; p++) {
      const kazeTd = document.createElement('td');
      const select = document.createElement('select');
      select.className = 'cell-select';
      select.dataset.row = String(i);
      select.dataset.player = String(p);
      select.dataset.kind = 'kaze';
      KAZE_OPTIONS.forEach((k) => {
        const opt = document.createElement('option');
        opt.value = k;
        opt.textContent = k || '―';
        select.appendChild(opt);
      });
      kazeTd.appendChild(select);
      tr.appendChild(kazeTd);

      const ptsTd = document.createElement('td');
      const input = document.createElement('input');
      input.type = 'number';
      input.className = 'cell-input';
      input.dataset.row = String(i);
      input.dataset.player = String(p);
      input.dataset.kind = 'points';
      input.placeholder = '0';
      ptsTd.appendChild(input);
      tr.appendChild(ptsTd);
    }
    frag.appendChild(tr);
  }
  tbody.appendChild(frag);
}

// プレイヤー名を取得
export function collectPlayers() {
  return [0, 1, 2, 3].map((i) =>
    (document.getElementById(`player-${i}`).value || '').trim()
  );
}

// 半荘記録を取得 (各行: [P1風, P1点, P2風, P2点, P3風, P3点, P4風, P4点])
export function collectHanchanRows() {
  const rows = [];
  for (let i = 0; i < HANCHAN_ROWS; i++) {
    const row = [];
    for (let p = 0; p < 4; p++) {
      const kazeEl = document.querySelector(
        `select[data-row="${i}"][data-player="${p}"][data-kind="kaze"]`
      );
      const ptsEl = document.querySelector(
        `input[data-row="${i}"][data-player="${p}"][data-kind="points"]`
      );
      row.push(kazeEl.value);
      const v = ptsEl.value;
      row.push(v === '' ? '' : Number(v));
    }
    rows.push(row);
  }
  return rows;
}

// 設定タブの値を取得
export function collectSettings() {
  return {
    kaeshi: Number(document.getElementById('kaeshi').value),
    rankPoints: [
      Number(document.getElementById('rank-1').value),
      Number(document.getElementById('rank-2').value),
      Number(document.getElementById('rank-3').value),
      Number(document.getElementById('rank-4').value),
    ],
    rate: Number(document.getElementById('rate').value),
    rentCost: Number(document.getElementById('rent-cost').value),
    rentPayer: document.getElementById('rent-payer').value,
    chipEnabled: document.getElementById('chip-enabled').checked,
    chipRate: Number(document.getElementById('chip-rate').value),
    chips: [0, 1, 2, 3].map((i) => {
      const v = document.querySelector(`.chip-input[data-chip="${i}"]`).value;
      return v === '' ? '' : Number(v);
    }),
  };
}
