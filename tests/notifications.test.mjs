import assert from 'node:assert/strict';
import test from 'node:test';
import { homeNotification, parseNotifications, relativeNotificationTime } from '../src/api/notifications.ts';
const at = '2026-10-12T12:00:00Z';
const notification = { id: '1', fundId: 'vault', type: 'vault_contributed', payload: { username: 'poteto', vaultName: 'Ocean', amountUsdc: '0.000001' }, createdAt: at, readAt: null };
test('investment notices preserve small USDC amounts, username, date and hidden-balance copy', () => {
  const n = homeNotification(notification);
  assert.equal(n.copy, '@poteto invested $0.000001 USDC in Ocean.');
  assert.equal(n.privateCopy, '@poteto invested in Ocean.');
  assert.equal(n.createdAt, at);
  assert.equal(n.unread, true);
});
test('crew arrivals show the fleet message without disclosing the contributed amount', () => {
  const n = homeNotification({ ...notification, type: 'crew_joined' });
  assert.equal(n.copy, '@poteto joined your fleet');
  assert.equal(n.icon, 'crew');
  assert.equal(n.copy.includes('0.000001'), false);
});
test('relative timestamps cover just now, hours, days and older dates', () => {
  const ago = seconds => relativeNotificationTime(at, Date.parse(at) + seconds * 1000);
  assert.equal(ago(0), 'Just now'); assert.equal(ago(4 * 3600), '4 hrs ago');
  assert.equal(ago(24 * 3600), '24 hrs ago'); assert.equal(ago(7 * 86400), '7d ago');
  assert.match(ago(31 * 86400), /2026/);
});
test('notification contract rejects malformed cursors and timestamps', () => {
  const page = { notifications: [notification], nextCursor: '1', hasMore: true };
  assert.deepEqual(parseNotifications(page), page);
  assert.throws(() => parseNotifications({ ...page, nextCursor: 'oops' }));
  assert.throws(() => parseNotifications({ ...page, notifications: [{ ...notification, createdAt: 'invalid' }] }));
});
test('account wallet receipts preserve atomic precision and explicitly identify devnet',()=>{
 const n={...notification,fundId:null,cursor:'8',type:'wallet_received',payload:{token:'SOL',amountAtomic:'1',network:'devnet'}};
 assert.equal(parseNotifications({notifications:[n],nextCursor:null,hasMore:false}).notifications[0].fundId,null);
 assert.equal(homeNotification(n).copy,'0.000000001 SOL received on devnet');
 assert.equal(homeNotification(n).privateCopy,'SOL received in your wallet on devnet');
 assert.equal(homeNotification({...n,payload:{...n.payload,amountAtomic:'10000000000'}}).copy,'10 SOL received on devnet');
 assert.throws(()=>parseNotifications({notifications:[{...n,cursor:'-1'}],nextCursor:null,hasMore:false}));
});
