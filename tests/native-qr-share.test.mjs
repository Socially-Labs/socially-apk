import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { QrSharingUnavailableError } from '../src/components/wallet/qr-share-error.ts';

function nativeSharing(available = true, fallbackAvailable = true, clipboardWorks = true) {
  const calls = [];
  const source = readFileSync(new URL('../src/components/wallet/share-qr-image.ts', import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } });
  const exports = {};
  vm.runInNewContext(outputText, { exports, require(name) {
    if (name === 'react-native') return { Platform: { OS: 'android' }, ToastAndroid: { LONG: 1, show: notice => calls.push(['toast', notice]) }, TurboModuleRegistry: { get: () => available ? {} : null } };
    if (name === 'expo-sharing') return { isAvailableAsync: async () => fallbackAvailable, shareAsync: async (uri, options) => calls.push(['expoShare', uri, options.mimeType]) };
    if (name === 'expo-clipboard') return { setStringAsync: async message => { calls.push(['copy', message]); if (!clipboardWorks) throw new Error('clipboard unavailable'); return true; } };
    if (name === './qr-share-error') return { QrSharingUnavailableError };
    if (name === 'react-native-share') {
      calls.push('loadNativeShare');
      if (!available) throw new Error('getEnforcing must never be called without RNShare');
      return { open: async options => { calls.push(options); } };
    }
    if (name === 'react-native-view-shot') return { captureRef: async () => { calls.push('capture'); return 'file:///cache/qr.png'; }, releaseCapture: uri => calls.push(['release', uri]) };
    throw new Error(`Unexpected module: ${name}`);
  } });
  return { share: exports.shareQrImage, calls };
}

test('an older native binary never imports the enforcing RNShare module', async () => {
  const { share, calls } = nativeSharing(false, false);
  await assert.rejects(share({ current: {} }, 588, () => true, 360, 'caption'), QrSharingUnavailableError);
  assert.deepEqual(calls, []);
});

test('native chooser receives the PNG and exact wallet greeting together', async () => {
  const { share, calls } = nativeSharing();
  await share({ current: {} }, 588, () => true, 360, 'Hello, here is my Solana wallet address:\n\nfull-address');
  const options = calls.find(value => typeof value === 'object');
  assert.equal(options.url, 'file:///cache/qr.png');
  assert.equal(options.type, 'image/png');
  assert.equal(options.message, 'Hello, here is my Solana wallet address:\n\nfull-address');
  assert.equal(options.failOnCancel, false);
});

test('an invalidated wallet cannot launch the native chooser and releases capture', async () => {
  const { share, calls } = nativeSharing();
  await assert.rejects(share({ current: {} }, 588, () => false, 360, 'caption'), /request has ended/);
  assert.deepEqual(calls, ['loadNativeShare', 'capture', ['release', 'file:///cache/qr.png']]);
});


test('Expo Go shares the PNG without importing RNShare and copies the exact caption', async () => {
  const { share, calls } = nativeSharing(false);
  let notice;
  const message = 'Hello, here is my Solana wallet address:\n\nfull-address';
  await share({ current: {} }, 588, () => true, 360, message, value => { notice = value; });
  assert(!calls.includes('loadNativeShare'));
  assert(calls.some(value => Array.isArray(value) && value[0] === 'copy' && value[1] === message));
  assert(calls.some(value => Array.isArray(value) && value[0] === 'expoShare' && value[1] === 'file:///cache/qr.png' && value[2] === 'image/png'));
  assert.match(notice, /Paste them as the image caption/);
});

test('Expo Go can still share its image when clipboard access fails', async () => {
  const { share, calls } = nativeSharing(false, true, false);
  let notice;
  await share({ current: {} }, 588, () => true, 360, 'caption', value => { notice = value; });
  assert(calls.some(value => Array.isArray(value) && value[0] === 'expoShare'));
  assert.equal(notice, 'The QR image includes your full wallet address.');
});
