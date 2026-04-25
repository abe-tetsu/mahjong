import { KAZE_INDEX } from './constants.js';

function isDuplicated(arr) {
  return new Set(arr).size !== arr.length;
}

function duplicatedValue(arr) {
  for (let i = 0; i < arr.length - 1; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[i] === arr[j]) return arr[i];
    }
  }
}

// CALCPOINTS 相当: 各半荘の精算点を計算
export function calcPoints(rawRows, rankPoints, kaeshi) {
  const result = [];
  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    const kaze = [];
    const pts = [];
    for (let p = 0; p < 4; p++) {
      const k = row[p * 2];
      kaze.push(k === '' ? '' : KAZE_INDEX[k]);
      pts.push(row[p * 2 + 1]);
    }

    if (pts.every((a) => a === '')) {
      result.push(null);
      continue;
    }
    if (pts.some((a) => a === '')) {
      result.push({ error: '点不足' });
      continue;
    }
    if (pts.reduce((s, x) => s + x, 0) !== 100000) {
      result.push({ error: '合計点不足' });
      continue;
    }

    const sorted = pts.slice().sort((a, b) => b - a);
    const ranks = pts.map((x) => sorted.indexOf(x));

    if (isDuplicated(pts)) {
      if (kaze.some((k) => k === '')) {
        result.push({ error: '風不足' });
        continue;
      }
      if (isDuplicated(kaze)) {
        result.push({ error: '風重複' });
        continue;
      }
      const dub = duplicatedValue(ranks);
      const idxs = [];
      ranks.forEach((v, idx) => {
        if (v === dub) idxs.push(idx);
      });
      // 起家から遠い (風の値が大きい) 方を下位に
      if (kaze[idxs[0]] > kaze[idxs[1]]) ranks[idxs[0]] = dub + 1;
      else ranks[idxs[1]] = dub + 1;
    }

    // 五捨六入で千点単位に丸めて、返しを引き、順位点を加算
    const settled = pts.map((p, j) => {
      const round56 = Math.round(Math.abs(p / 1000) - 0.1) * Math.sign(p);
      return round56 - kaeshi / 1000 + rankPoints[ranks[j]];
    });

    // 誤差をトップに押し付け
    const diff = settled.reduce((s, x) => s + x, 0);
    if (diff !== 0) {
      const top = Math.max(...settled);
      const topIdx = settled.indexOf(top);
      settled[topIdx] += -diff;
    }

    result.push(settled);
  }
  return result;
}

// 各半荘の精算点を合計
export function sumSettled(rows) {
  const total = [0, 0, 0, 0];
  let validCount = 0;
  for (const row of rows) {
    if (!row || row.error) continue;
    for (let i = 0; i < 4; i++) total[i] += row[i];
    validCount++;
  }
  return { total, validCount };
}

// RENTCOST 相当: 場代・チップ込みの円換算
export function rentCost(totalSettled, settings) {
  const { rate, rentCost, rentPayer, chips, chipRate, chipEnabled } = settings;
  const result = totalSettled.map((p) => p * rate);

  if (rentPayer === '' || rentPayer === null) return { yen: result };

  if (chipEnabled) {
    if (chips.some((c) => c === '')) return { error: 'チップ数が不足しています。' };
    if (chips.reduce((s, x) => s + x, 0) !== 0) return { error: 'チップの合計が0になっていません。' };
  }

  const payerIdx = Number(rentPayer);
  const costPer = rentCost / 4;
  for (let i = 0; i < 4; i++) {
    if (i === payerIdx) result[i] += costPer * 3;
    else result[i] -= costPer;
    if (chipEnabled) result[i] += chips[i] * chipRate;
  }
  return { yen: result };
}

// COUNTRANK 相当: 順位回数と平均順位を集計
export function countRank(settledRows) {
  const table = Array(4).fill(0).map(() => Array(5).fill(0));
  let hantyan = 0;
  for (const row of settledRows) {
    if (!row || row.error) continue;
    if (row.every((x) => x === 0)) continue;
    hantyan++;
    const sorted = row.slice().sort((a, b) => b - a);
    const ranks = row.map((x) => sorted.indexOf(x));
    for (let p = 0; p < 4; p++) table[p][ranks[p]]++;
  }
  for (let p = 0; p < 4; p++) {
    const sum = table[p].slice(0, 4).reduce((s, c, idx) => s + c * (idx + 1), 0);
    table[p][4] = hantyan > 0 ? Math.round((sum / hantyan) * 100) / 100 : 0;
  }
  return { table, hantyan };
}

// AVERAGEMAXPOINTS 相当: 平均得点と最高得点
export function averageMaxPoints(rawRows) {
  const validPts = [];
  for (const row of rawRows) {
    const r = [];
    for (let p = 0; p < 4; p++) r.push(row[p * 2 + 1]);
    if (r.some((x) => x === '')) continue;
    if (r.reduce((s, x) => s + x, 0) !== 100000) continue;
    validPts.push(r);
  }
  const avg = [0, 0, 0, 0];
  const max = [0, 0, 0, 0];
  if (validPts.length === 0) return { avg, max };
  for (const r of validPts) {
    for (let i = 0; i < 4; i++) {
      avg[i] += r[i];
      if (r[i] > max[i]) max[i] = r[i];
    }
  }
  for (let i = 0; i < 4; i++) avg[i] = Math.round(avg[i] / validPts.length);
  return { avg, max };
}
