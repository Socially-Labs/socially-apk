import assert from 'node:assert/strict';
import test from 'node:test';
import { sampleCaptainVaults } from '../src/constants/captain-dashboard.ts';
import { availableCash, defaultMarketFilters, marketSeries, maxTradeInput, previewTrade, selectMarkets, tokenBySymbol } from '../src/constants/captain-markets.ts';

const [horizon, momentum, paused] = sampleCaptainVaults;
const sol = tokenBySymbol('SOL'), jup = tokenBySymbol('JUP');
const base = { vault: horizon, tab: 'top', query: '', period: '24H', filters: defaultMarketFilters, savedOnly: false, saved: ['SOL'] };

test('switching vaults changes reserve and holdings without changing market prices', () => {
  assert.equal(availableCash(horizon), 120500);
  assert.equal(availableCash(momentum), 31000);
  assert.deepEqual(selectMarkets({ ...base, tab: 'invested' }).map(token => token.symbol), ['SOL', 'BTC', 'USDC']);
  assert.deepEqual(selectMarkets({ ...base, vault: momentum, tab: 'invested' }).map(token => token.symbol), ['SOL', 'USDC']);
  assert.equal(sol.price, 145.47);
});

test('token/mint search, saved markets and liquidity filters compose', () => {
  assert.deepEqual(selectMarkets({ ...base, query: sol.mint }).map(token => token.symbol), ['SOL']);
  assert.deepEqual(selectMarkets({ ...base, query: 'jupiter' }).map(token => token.symbol), ['JUP']);
  assert.deepEqual(selectMarkets({ ...base, savedOnly: true }).map(token => token.symbol), ['SOL']);
  assert.equal(selectMarkets({ ...base, query: 'not-a-token' }).length, 0);
  assert.deepEqual(selectMarkets({ ...base, filters: { ...defaultMarketFilters, category: 'Memecoins' } }).map(token => token.symbol), ['BONK']);
  assert.equal(selectMarkets({ ...base, filters: { ...defaultMarketFilters, liquidity: 100000000 } }).length, 0);
});

test('charts end at the displayed price and preserve the selected period return', () => {
  for (const period of ['1H', '24H', '7D', '30D']) {
    const series = marketSeries(sol, period);
    assert.equal(series.at(-1), sol.price);
    assert.ok(Math.abs((series.at(-1) / series[0] - 1) * 100 - sol.changes[period]) < 1e-9);
  }
});

test('buy review accounts for fees, slippage, position exposure and remaining reserve', () => {
  const quote = previewTrade(horizon, sol, 'buy', '1000');
  assert.equal(quote.error, null);
  assert.equal(quote.fee, 1);
  assert.equal(quote.remaining, 119500);
  assert.ok(quote.receive < 1000 / sol.price);
  assert.ok(quote.minimum < quote.receive);
  assert.ok(quote.after > quote.before);
  assert.equal(horizon.holdings[0].weight, 45, 'review never mutates fixtures');
});

test('invalid precision, insufficient reserves, position caps and unheld sells are blocked', () => {
  for (const input of ['', '0', '-1', '1e3', '1.234', '999999999999999']) assert.ok(previewTrade(horizon, sol, 'buy', input).error);
  assert.match(previewTrade(horizon, sol, 'buy', '120500.01').error, /available USDC/);
  assert.match(previewTrade(momentum, sol, 'buy', '1').error, /position limit/);
  assert.match(previewTrade(horizon, jup, 'sell', '1').error, /does not hold/);
  assert.equal(previewTrade(horizon, sol, 'buy', '10,50').error, null);
  assert.equal(previewTrade(paused, sol, 'buy', '100').error, null, 'paused deposits still allow trading');
});

test('Max respects the smaller of cash and position limit, and sells keep proceeds in USDC', () => {
  assert.equal(maxTradeInput(horizon, jup, 'buy'), 120500);
  assert.equal(maxTradeInput(momentum, sol, 'buy'), 0);
  const max = maxTradeInput(horizon, sol, 'sell'), sell = previewTrade(horizon, sol, 'sell', String(max));
  assert.equal(sell.error, null);
  assert.equal(sell.outputSymbol, 'USDC');
  assert.ok(sell.after < 0.000001);
  assert.ok(sell.remaining < 0.000001);
  assert.equal(previewTrade(horizon, tokenBySymbol('USDC'), 'buy', '1').error, 'Choose another market to trade with your USDC.');
});
