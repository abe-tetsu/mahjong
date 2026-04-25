import {
  buildHanchanRows,
  collectPlayers,
  collectHanchanRows,
  collectSettings,
} from './inputs.js';
import {
  calcPoints,
  sumSettled,
  rentCost,
  countRank,
  averageMaxPoints,
} from './calc.js';
import { applyPlayerNames, renderResults } from './render.js';
import { saveState, loadState } from './storage.js';

function setupTabs() {
  const tabs = document.querySelectorAll('.tab');
  const contents = document.querySelectorAll('.tab-content');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      tabs.forEach((t) => t.classList.toggle('is-active', t === tab));
      contents.forEach((c) => c.classList.toggle('is-active', c.id === target));
    });
  });
}

function activateTab(name) {
  const tab = document.querySelector(`.tab[data-tab="${name}"]`);
  if (tab) tab.click();
}

function calculate() {
  const players = collectPlayers();
  const rawRows = collectHanchanRows();
  const settings = collectSettings();

  const settledRows = calcPoints(rawRows, settings.rankPoints, settings.kaeshi);
  const { total } = sumSettled(settledRows);
  const cost = rentCost(total, settings);
  const { table: rankTable } = countRank(settledRows);
  const stats = averageMaxPoints(rawRows);

  renderResults({ players, settledRows, total, cost, rankTable, stats });
  saveState();
  activateTab('result');
}

function setupButtons() {
  document.getElementById('btn-calc')?.addEventListener('click', calculate);
  document.getElementById('btn-reset')?.addEventListener('click', () => {
    if (!confirm('入力した半荘記録をリセットしますか?(プレイヤー名・設定は残ります)')) return;
    document
      .querySelectorAll('#hanchan-tbody .cell-input')
      .forEach((el) => (el.value = ''));
    document
      .querySelectorAll('#hanchan-tbody .cell-select')
      .forEach((el) => (el.selectedIndex = 0));
    saveState();
  });
}

function setupAutoSave() {
  document.addEventListener('change', (e) => {
    if (e.target.closest('#input, #settings')) saveState();
  });
}

function setupPlayerNameSync() {
  for (let i = 0; i < 4; i++) {
    const el = document.getElementById(`player-${i}`);
    el?.addEventListener('input', applyPlayerNames);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  setupTabs();
  buildHanchanRows();
  setupButtons();
  loadState();
  applyPlayerNames();
  setupPlayerNameSync();
  setupAutoSave();
});
