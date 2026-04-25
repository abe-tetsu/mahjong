import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  calcPoints,
  sumSettled,
  rentCost,
  countRank,
  averageMaxPoints,
} from '../js/calc.js';

const RANK_POINTS = [30, 10, -10, -30];
const KAESHI = 25000;

// 半荘1行を組み立てるヘルパー
function row(k1, p1, k2, p2, k3, p3, k4, p4) {
  return [k1, p1, k2, p2, k3, p3, k4, p4];
}
const EMPTY = ['', '', '', '', '', '', '', ''];

describe('calcPoints', () => {
  test('標準的な1半荘 (28k/32k/18k/22k)', () => {
    const result = calcPoints(
      [row('東', 28000, '南', 32000, '西', 18000, '北', 22000)],
      RANK_POINTS,
      KAESHI
    );
    assert.deepEqual(result, [[13, 37, -37, -13]]);
    assert.equal(
      result[0].reduce((s, x) => s + x, 0),
      0,
      '合計は 0 になる'
    );
  });

  test('1位がトップ独占 (50k/30k/20k/0)', () => {
    const result = calcPoints(
      [row('東', 50000, '南', 30000, '西', 20000, '北', 0)],
      RANK_POINTS,
      KAESHI
    );
    assert.deepEqual(result, [[55, 15, -15, -55]]);
  });

  test('全空欄行は null', () => {
    const result = calcPoints([EMPTY], RANK_POINTS, KAESHI);
    assert.deepEqual(result, [null]);
  });

  test('一部空欄は「点不足」エラー', () => {
    const result = calcPoints(
      [row('東', 28000, '南', '', '西', 18000, '北', 22000)],
      RANK_POINTS,
      KAESHI
    );
    assert.deepEqual(result, [{ error: '点不足' }]);
  });

  test('合計≠100,000 は「合計点不足」エラー', () => {
    const result = calcPoints(
      [row('東', 28000, '南', 32000, '西', 18000, '北', 30000)],
      RANK_POINTS,
      KAESHI
    );
    assert.deepEqual(result, [{ error: '合計点不足' }]);
  });

  test('同順位で風が無記入なら「風不足」エラー', () => {
    const result = calcPoints(
      [row('', 25000, '', 25000, '', 25000, '', 25000)],
      RANK_POINTS,
      KAESHI
    );
    assert.deepEqual(result, [{ error: '風不足' }]);
  });

  test('同順位で風が重複なら「風重複」エラー', () => {
    const result = calcPoints(
      [row('東', 25000, '東', 25000, '西', 25000, '北', 25000)],
      RANK_POINTS,
      KAESHI
    );
    assert.deepEqual(result, [{ error: '風重複' }]);
  });

  test('同順位は起家に近い (風が小さい) 方を上位とする', () => {
    // P1(東=0) と P2(南=1) が同点 30000 → 起家近い P1 が 1位、P2 が 2位
    // P3(西=2)=25000 が 3位、P4(北=3)=15000 が 4位
    const result = calcPoints(
      [row('東', 30000, '南', 30000, '西', 25000, '北', 15000)],
      RANK_POINTS,
      KAESHI
    );
    // 五捨六入: 30→5, 30→5, 25→0, 15→-10
    // 順位点: P1: 5+30=35, P2: 5+10=15, P3: 0-10=-10, P4: -10-30=-40
    assert.deepEqual(result, [[35, 15, -10, -40]]);
    assert.equal(result[0].reduce((s, x) => s + x, 0), 0);
  });

  test('同順位ペアの順位は風の数値が大きい方を下位にする', () => {
    // 風を入れ替え: P1=南(1) 30000, P2=東(0) 30000 → 東(0) の方が起家
    // → 同順位ペアでは P2 が 1位、P1 が 2位 になる
    const result = calcPoints(
      [row('南', 30000, '東', 30000, '西', 25000, '北', 15000)],
      RANK_POINTS,
      KAESHI
    );
    // 順位点: P1: 5+10=15, P2: 5+30=35, P3: 0-10=-10, P4: -10-30=-40
    assert.deepEqual(result, [[15, 35, -10, -40]]);
  });

  test('五捨六入 - 端数 .5 は切り捨て', () => {
    // 25500 → 5捨 → 25 → 0 (返し25k引き後)
    // 32500 → 5捨 → 32 → 7
    // 18500 → 5捨 → 18 → -7  (5捨だが小数で言うと18.5未満なので18)
    // 23500 → 5捨 → 23 → -2
    // 合計: 25500+32500+18500+23500 = 100000 ✓
    const result = calcPoints(
      [row('東', 25500, '南', 32500, '西', 18500, '北', 23500)],
      RANK_POINTS,
      KAESHI
    );
    // sorted: 32500(P2), 25500(P1), 23500(P4), 18500(P3)
    // ranks: P1=1位, P2=0位, P3=3位, P4=2位
    // 順位点: P1: 0+10=10, P2: 7+30=37, P3: -7-30=-37, P4: -2-10=-12
    // 合計: 10+37-37-12 = -2 → トップ(P2=37)に+2 → 39
    assert.deepEqual(result, [[10, 39, -37, -12]]);
    assert.equal(result[0].reduce((s, x) => s + x, 0), 0);
  });

  test('五捨六入 - 端数 .6 は切り上げ', () => {
    // 25600 → 6入 → 26 → 1
    // 32400 → 5捨 → 32 → 7
    // 18400 → 5捨 → 18 → -7
    // 23600 → 6入 → 24 → -1
    // 合計: 25600+32400+18400+23600 = 100000 ✓
    const result = calcPoints(
      [row('東', 25600, '南', 32400, '西', 18400, '北', 23600)],
      RANK_POINTS,
      KAESHI
    );
    // sorted: 32400, 25600, 23600, 18400
    // 順位: P1=1位, P2=0位, P3=3位, P4=2位
    // 順位点: P1: 1+10=11, P2: 7+30=37, P3: -7-30=-37, P4: -1-10=-11
    // 合計: 0
    assert.deepEqual(result, [[11, 37, -37, -11]]);
  });

  test('マイナス点もマイナス方向に丸める', () => {
    // -2300 → Math.round(2.2) * -1 = -2
    const result = calcPoints(
      [row('東', 60000, '南', 22300, '西', 20000, '北', -2300)],
      RANK_POINTS,
      KAESHI
    );
    // sorted: 60000, 22300, 20000, -2300
    // P1=1位, P2=2位, P3=3位, P4=4位
    // 五捨六入:
    //   60→35 (60-25)
    //   22(round(22.3-0.1)=22)→-3
    //   20→-5
    //   -2→-27 (-2-25)
    // 順位点: P1: 35+30=65, P2: -3+10=7, P3: -5-10=-15, P4: -27-30=-57
    assert.deepEqual(result, [[65, 7, -15, -57]]);
    assert.equal(result[0].reduce((s, x) => s + x, 0), 0);
  });

  test('複数行を独立に処理する', () => {
    const result = calcPoints(
      [
        row('東', 28000, '南', 32000, '西', 18000, '北', 22000),
        EMPTY,
        row('東', 50000, '南', 30000, '西', 20000, '北', 0),
        row('東', 28000, '南', '', '西', 18000, '北', 22000),
      ],
      RANK_POINTS,
      KAESHI
    );
    assert.equal(result.length, 4);
    assert.deepEqual(result[0], [13, 37, -37, -13]);
    assert.equal(result[1], null);
    assert.deepEqual(result[2], [55, 15, -15, -55]);
    assert.deepEqual(result[3], { error: '点不足' });
  });
});

describe('sumSettled', () => {
  test('複数行を集計', () => {
    const { total, validCount } = sumSettled([
      [13, 37, -37, -13],
      [55, 15, -15, -55],
    ]);
    assert.deepEqual(total, [68, 52, -52, -68]);
    assert.equal(validCount, 2);
  });

  test('null とエラー行はスキップ', () => {
    const { total, validCount } = sumSettled([
      [13, 37, -37, -13],
      null,
      { error: '点不足' },
      [55, 15, -15, -55],
    ]);
    assert.deepEqual(total, [68, 52, -52, -68]);
    assert.equal(validCount, 2);
  });

  test('空配列は 0 のまま', () => {
    const { total, validCount } = sumSettled([]);
    assert.deepEqual(total, [0, 0, 0, 0]);
    assert.equal(validCount, 0);
  });
});

describe('rentCost', () => {
  const baseSettings = {
    rate: 50,
    rentCost: 3000,
    rentPayer: '0',
    chips: ['', '', '', ''],
    chipRate: 100,
    chipEnabled: false,
  };

  test('債務者未指定はレート換算のみ', () => {
    const result = rentCost([10, 20, -15, -15], {
      ...baseSettings,
      rentPayer: '',
    });
    assert.deepEqual(result, { yen: [500, 1000, -750, -750] });
  });

  test('場代を1人が払い、3人から徴収', () => {
    // 合計0精算点で場代3000円: P1が払う → +2250 / -750 / -750 / -750
    const result = rentCost([0, 0, 0, 0], baseSettings);
    assert.deepEqual(result, { yen: [2250, -750, -750, -750] });
  });

  test('精算点 + 場代が組み合わさる', () => {
    // [50,20,-30,-40] * 50円 = [2500, 1000, -1500, -2000]
    // P1 が場代: +2250 / -750 / -750 / -750
    // 合計: [4750, 250, -2250, -2750]
    const result = rentCost([50, 20, -30, -40], baseSettings);
    assert.deepEqual(result, { yen: [4750, 250, -2250, -2750] });
    assert.equal(result.yen.reduce((s, x) => s + x, 0), 0);
  });

  test('チップ有: チップ枚数×レートを加算', () => {
    const result = rentCost([0, 0, 0, 0], {
      ...baseSettings,
      rentCost: 0,
      chips: [5, -2, -1, -2],
      chipEnabled: true,
    });
    assert.deepEqual(result, { yen: [500, -200, -100, -200] });
  });

  test('チップ有でチップ未入力はエラー', () => {
    const result = rentCost([0, 0, 0, 0], {
      ...baseSettings,
      chips: [5, '', -1, -2],
      chipEnabled: true,
    });
    assert.deepEqual(result, { error: 'チップ数が不足しています。' });
  });

  test('チップ合計が 0 でないとエラー', () => {
    const result = rentCost([0, 0, 0, 0], {
      ...baseSettings,
      chips: [5, 0, 0, 0],
      chipEnabled: true,
    });
    assert.deepEqual(result, { error: 'チップの合計が0になっていません。' });
  });
});

describe('countRank', () => {
  test('順位回数と平均順位を集計', () => {
    // 3半荘: [13,37,-37,-13], [55,15,-15,-55], [-70,10,30,30]
    // P1: 2位, 1位, 4位 (1回, 1回, 0回, 1回) avg=(2+1+4)/3=2.33
    // P2: 1位, 2位, 3位 (1回, 1回, 1回, 0回) avg=2
    // P3: 4位, 3位, 1位 (1回, 0回, 1回, 1回) avg=(4+3+1)/3=2.67
    // P4: 3位, 4位, 1位 (1回, 0回, 1回, 1回) avg=(3+4+1)/3=2.67
    const { table, hantyan } = countRank([
      [13, 37, -37, -13],
      [55, 15, -15, -55],
      [-70, 10, 30, 30],
    ]);
    assert.equal(hantyan, 3);
    assert.deepEqual(table[0], [1, 1, 0, 1, 2.33]);
    assert.deepEqual(table[1], [1, 1, 1, 0, 2]);
    assert.deepEqual(table[2], [1, 0, 1, 1, 2.67]);
    assert.deepEqual(table[3], [1, 0, 1, 1, 2.67]);
  });

  test('null とエラー行はスキップ', () => {
    const { hantyan } = countRank([
      [13, 37, -37, -13],
      null,
      { error: '点不足' },
    ]);
    assert.equal(hantyan, 1);
  });

  test('全 0 の行は集計対象外', () => {
    const { hantyan } = countRank([
      [13, 37, -37, -13],
      [0, 0, 0, 0],
    ]);
    assert.equal(hantyan, 1);
  });

  test('空入力は平均順位 0', () => {
    const { table } = countRank([]);
    assert.equal(table[0][4], 0);
  });
});

describe('averageMaxPoints', () => {
  test('平均と最高を計算', () => {
    const { avg, max } = averageMaxPoints([
      ['東', 28000, '南', 32000, '西', 18000, '北', 22000],
      ['東', 50000, '南', 30000, '西', 20000, '北', 0],
    ]);
    // avg: (28+50)/2=39000, (32+30)/2=31000, (18+20)/2=19000, (22+0)/2=11000
    // max: 50000, 32000, 20000, 22000
    assert.deepEqual(avg, [39000, 31000, 19000, 11000]);
    assert.deepEqual(max, [50000, 32000, 20000, 22000]);
  });

  test('合計≠100k や空欄行はスキップ', () => {
    const { avg, max } = averageMaxPoints([
      ['東', 28000, '南', 32000, '西', 18000, '北', 22000],
      ['東', 28000, '南', '', '西', 18000, '北', 22000], // 空欄
      ['東', 28000, '南', 32000, '西', 18000, '北', 30000], // 合計違い
    ]);
    assert.deepEqual(avg, [28000, 32000, 18000, 22000]);
    assert.deepEqual(max, [28000, 32000, 18000, 22000]);
  });

  test('有効な半荘がない場合は 0', () => {
    const { avg, max } = averageMaxPoints([
      ['', '', '', '', '', '', '', ''],
    ]);
    assert.deepEqual(avg, [0, 0, 0, 0]);
    assert.deepEqual(max, [0, 0, 0, 0]);
  });
});
