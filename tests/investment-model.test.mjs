import assert from 'node:assert/strict';
import test from 'node:test';
import { amountInCents, estimateShares, investmentError, formatInvestmentAmount } from '../src/components/discover/investment-model.ts';

test('amounts preserve cents, including decimal-comma keyboards', () => {
  assert.equal(amountInCents('4230.50'), 423050);
  assert.equal(amountInCents('0.29'), 29);
  assert.equal(amountInCents('250,75'), 25075);
  assert.equal(amountInCents('.50'), 50);
  assert.equal(amountInCents('500.'), 50000);
});

test('pasted malformed amounts never become a valid positive deposit', () => {
  for (const value of ['-500', '1e3', '1,000.00', '500 USDC', '1.234', 'Infinity', '9007199254740991']) {
    assert.equal(amountInCents(value), null, value);
    assert.ok(investmentError(value, 423050));
  }
});

test('review requires a positive amount within the available balance', () => {
  assert.ok(investmentError('', 423050));
  assert.ok(investmentError('0', 423050));
  assert.ok(investmentError('4230.51', 423050));
  assert.equal(investmentError('4230.50', 423050), null);
  assert.equal(investmentError('0.01', 423050), null);
  assert.ok(investmentError('0.01', 0));
});

test('share estimates scale with the amount without rounding the quote early', () => {
  assert.equal(estimateShares(100000), estimateShares(50000) * 2);
  assert.equal(estimateShares(0), 0);
  assert.equal(estimateShares(50000).toFixed(2), '487.12');
  assert.equal(formatInvestmentAmount(423050), '4,230.50');
  assert.equal(formatInvestmentAmount(50000), '500');
});
