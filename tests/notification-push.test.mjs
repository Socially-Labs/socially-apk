import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const source = ts.transpileModule(
  readFileSync(new URL('../src/api/notification-push.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true } },
).outputText;

function loadPush(executionEnvironment) {
  const loaded = [];
  const calls = [];
  const notifications = {
    setNotificationHandler: () => calls.push('handler'),
    dismissAllNotificationsAsync: async () => calls.push('dismiss'),
  };
  const exports = {};
  runInNewContext(source, {
    exports,
    require(name) {
      loaded.push(name);
      if (name === 'expo-constants') return {
        executionEnvironment, ExecutionEnvironment: { StoreClient: 'storeClient' },
      };
      if (name === 'react-native') return { Platform: { OS: 'android' } };
      if (name === 'expo-crypto') return {};
      if (name === './market-order-storage') return { orderStorage: {} };
      if (name === 'expo-notifications') {
        assert.notEqual(executionEnvironment, 'storeClient', 'Expo Go must not evaluate the native notifications module');
        return notifications;
      }
      throw new Error(`Unexpected import: ${name}`);
    },
  });
  return { push: exports, loaded, calls };
}

test('Android Expo Go starts, observes and signs out without loading push notifications', async () => {
  const { push, loaded, calls } = loadPush('storeClient');
  const client = { request() { assert.fail('Expo Go must not register a push device'); } };
  assert.equal(await push.registerNotificationPush(client), false);
  await assert.rejects(push.registerNotificationPush(client, true), /unavailable in Expo Go/);
  push.observeNotificationPush(client, () => assert.fail(), () => assert.fail())();
  await push.revokeNotificationPush();
  assert.equal(loaded.includes('expo-notifications'), false);
  assert.deepEqual(calls, []);
});

test('installed Android builds retain the notification handler and native cleanup', async () => {
  const { push, loaded, calls } = loadPush('standalone');
  assert.equal(loaded.includes('expo-notifications'), true);
  assert.deepEqual(calls, ['handler']);
  assert.equal(await push.registerNotificationPush({}), false);
  await push.revokeNotificationPush();
  assert.deepEqual(calls, ['handler', 'dismiss']);
});
