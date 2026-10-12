import assert from 'node:assert/strict';
import test from 'node:test';
import { delegationError, delegationLimit, usdcDecimal, usdcUnits } from '../src/components/vaults/delegation-amount.ts';

test('delegation validates exact decimal input without rounding', () => {
  for (const value of ['', '.5', '50.', '1e3', '-50', '050', '50.0000001', 'NaN']) {
    assert.match(delegationError(value, '8500.000000', '20000.000000'), /decimal/);
  }
  assert.match(delegationError('49.999999', '8500.000000', '20000.000000'), /Minimum/);
  assert.equal(delegationError('50.000000', '50.000000', '50.000000'), null);
  assert.match(delegationError('50.000001', '50.000000', '20000.000000'), /balance/);
  assert.match(delegationError('50.000001', '8500.000000', '50.000000'), /capacity/);
  assert.match(delegationError('50', '8500', '20000', '100'), /100 USDC/);
  assert.match(delegationError('50', '8500', '20000', '100.500000'), /100.5 USDC/);
});

test('Max respects capacity and balance, including sub-minimum dust', () => {
  assert.equal(delegationLimit('8500.123456', '20000.000000'), '8500.123456');
  assert.equal(delegationLimit('8500.123456', '50.000001'), '50.000001');
  const dust = delegationLimit('8500', '49.999999');
  assert.match(delegationError(dust, '8500', '49.999999'), /Minimum/);
  assert.equal(delegationLimit('0', '20000'), '0.000000');
});

test('review subtraction stays exact beyond Number precision', () => {
  const available = '999999999999999999999999.123456';
  assert.equal(usdcDecimal(usdcUnits(available) - usdcUnits('500.000001')), '999999999999999999999499.123455');
  assert.equal(usdcDecimal(usdcUnits('8500') - usdcUnits('500')), '8000.000000');
});
