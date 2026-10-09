import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { createRequire } from 'node:module';
import { Keypair, TransactionMessage, VersionedTransaction } from '@solana/web3.js';

const require = createRequire(import.meta.url);
// Resolve the same JS implementation as Metro, rather than Node's built-in Buffer.
const { Buffer } = require('buffer/');
const source = readFileSync(new URL('../src/auth/polyfills.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: {
  module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
} }).outputText;

function nativeRuntime(existingBuffer) {
  const context = vm.createContext({ exports: {}, ...(existingBuffer ? { Buffer: existingBuffer } : {}), require(name) {
    if (name === 'buffer') return { Buffer };
    if (['fast-text-encoding', 'react-native-get-random-values', '@ethersproject/shims'].includes(name)) return {};
    throw new Error(`Unexpected module: ${name}`);
  } });
  vm.runInContext(`(function () { ${compiled}\n})()`, context);
  return context;
}

test('native startup installs Buffer before loading Expo Router and wallet SDKs', () => {
  const context = nativeRuntime();
  const entrypoint = readFileSync(new URL('../entrypoint.js', import.meta.url), 'utf8');
  const entry = ts.transpileModule(entrypoint, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const imports = [];
  delete context.Buffer;
  context.require = name => {
    imports.push(name);
    if (name === 'buffer') return { Buffer };
    if (name === './src/auth/polyfills') vm.runInContext(`(function () { ${compiled}\n})()`, context);
    if (name === 'expo-router/entry') assert.equal(vm.runInContext("Buffer.from('wallet').toString('base64')", context), 'd2FsbGV0');
  };
  vm.runInContext(entry, context);
  assert.deepEqual(imports, ['./src/auth/polyfills', 'fast-text-encoding', 'react-native-get-random-values', '@ethersproject/shims', 'buffer', 'expo-router/entry']);
});

test('the native global supports Privy message encoding and signature decoding for a real V0 transaction', () => {
  const context = nativeRuntime();
  const wallet = Keypair.generate();
  const unsigned = new VersionedTransaction(new TransactionMessage({
    payerKey: wallet.publicKey, recentBlockhash: wallet.publicKey.toBase58(), instructions: [],
  }).compileToV0Message());
  const signed = VersionedTransaction.deserialize(unsigned.serialize());
  signed.sign([wallet]);
  context.message = unsigned.message.serialize();
  context.signature = Buffer.from(signed.signatures[0]).toString('base64');
  assert.equal(vm.runInContext("Buffer.from(message).toString('base64')", context), Buffer.from(unsigned.message.serialize()).toString('base64'));
  const decoded = vm.runInContext("Buffer.from(signature, 'base64')", context);
  unsigned.addSignature(wallet.publicKey, decoded);
  assert.deepEqual(unsigned.serialize(), signed.serialize());
});

test('native startup preserves an existing Buffer implementation', () => {
  const existing = { from: () => 'existing' };
  assert.equal(nativeRuntime(existing).Buffer, existing);
});
