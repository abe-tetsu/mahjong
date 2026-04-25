import { STORAGE_KEY } from './constants.js';
import { collectPlayers, collectHanchanRows, collectSettings } from './inputs.js';

export function saveState() {
  try {
    const state = {
      players: collectPlayers(),
      rows: collectHanchanRows(),
      settings: collectSettings(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (_) {
    /* noop */
  }
}

export function loadState() {
  const json = localStorage.getItem(STORAGE_KEY);
  if (!json) return;
  let state;
  try {
    state = JSON.parse(json);
  } catch (_) {
    return;
  }

  state.players?.forEach((name, i) => {
    const el = document.getElementById(`player-${i}`);
    if (el && name) el.value = name;
  });

  state.rows?.forEach((row, i) => {
    for (let p = 0; p < 4; p++) {
      const kazeEl = document.querySelector(
        `select[data-row="${i}"][data-player="${p}"][data-kind="kaze"]`
      );
      const ptsEl = document.querySelector(
        `input[data-row="${i}"][data-player="${p}"][data-kind="points"]`
      );
      if (kazeEl && row[p * 2] !== undefined) kazeEl.value = row[p * 2];
      if (ptsEl && row[p * 2 + 1] !== '' && row[p * 2 + 1] !== undefined) {
        ptsEl.value = row[p * 2 + 1];
      }
    }
  });

  const s = state.settings;
  if (!s) return;
  const setVal = (id, v) => {
    const el = document.getElementById(id);
    if (el && v !== undefined && v !== null) el.value = v;
  };
  setVal('kaeshi', s.kaeshi);
  setVal('rank-1', s.rankPoints?.[0]);
  setVal('rank-2', s.rankPoints?.[1]);
  setVal('rank-3', s.rankPoints?.[2]);
  setVal('rank-4', s.rankPoints?.[3]);
  setVal('rate', s.rate);
  setVal('rent-cost', s.rentCost);
  setVal('rent-payer', s.rentPayer);
  setVal('chip-rate', s.chipRate);
  const chipEl = document.getElementById('chip-enabled');
  if (chipEl) chipEl.checked = !!s.chipEnabled;
  s.chips?.forEach((c, i) => {
    const el = document.querySelector(`.chip-input[data-chip="${i}"]`);
    if (el && c !== '' && c !== undefined && c !== null) el.value = c;
  });
}
