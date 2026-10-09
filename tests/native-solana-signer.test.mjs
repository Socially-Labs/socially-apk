import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { Keypair, TransactionMessage, VersionedTransaction } from '@solana/web3.js';
import { linkedSolanaAddress } from '../src/auth/solana-address.ts';

const owner = Keypair.generate();
const other = Keypair.generate();
const address = owner.publicKey.toBase58();
const otherAddress = other.publicKey.toBase58();
const transaction = new VersionedTransaction(new TransactionMessage({
  payerKey: owner.publicKey, recentBlockhash: otherAddress, instructions: [],
}).compileToV0Message());

function session(wallets, linkedAddress = address, status = 'connected') {
  const source = readFileSync(new URL('../src/auth/auth-provider.tsx', import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
  } });
  const exports = {};
  const jsx = (type, props) => ({ type, props });
  vm.runInNewContext(outputText, { exports, require(name) {
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
    if (name === 'react') return { useEffect: () => {}, useRef: () => ({ current: null }) };
    if (name === './config') return { privyConfig: { appId: 'test', clientId: 'test' } };
    if (name === './session') return { AuthContext: { Provider: 'context' } };
    if (name === './solana-address') return { linkedSolanaAddress };
    if (name === '@solana/web3.js') return { VersionedTransaction };
    if (name === '@privy-io/expo') return {
      PrivyProvider: 'privy',
      usePrivy: () => ({ isReady: true, user: { id: 'test', linked_accounts: linkedAddress
        ? [{ type: 'wallet', chain_type: 'solana', wallet_client_type: 'privy', address: linkedAddress }] : [] } }),
      useEmbeddedSolanaWallet: () => ({ status, wallets, publicKey: otherAddress,
        getProvider: () => { throw new Error('Deprecated provider must never be used'); } }),
      useLoginWithEmail: () => ({}), useLoginWithOAuth: () => ({ state: { status: 'initial' } }),
    };
    throw new Error(`Unexpected module: ${name}`);
  } });
  const bridge = exports.AuthProvider({}).props.children;
  return bridge.type(bridge.props).props.value;
}

function signer() {
  const calls = [];
  return { calls, wallet: { address, getProvider: async () => {
    calls.push('provider');
    return { request: async ({ method, params }) => {
      calls.push(method);
      params.transaction.sign([owner]);
      return { signedTransaction: params.transaction };
    } };
  } } };
}
const wrongWallet = { address: otherAddress, getProvider: () => { throw new Error('Wrong wallet selected'); } };

for (const matchingFirst of [true, false]) {
  test(`native signing uses the matching wallet provider regardless of deprecated publicKey (matching first: ${matchingFirst})`, async () => {
    const { wallet, calls } = signer();
    const auth = session(matchingFirst ? [wallet, wrongWallet] : [wrongWallet, wallet]);
    const signed = await auth.signSolanaTransaction(transaction.serialize(), address);
    const expected = VersionedTransaction.deserialize(transaction.serialize());
    expected.sign([owner]);
    assert.deepEqual(signed, expected.serialize());
    assert.deepEqual(calls, ['provider', 'signTransaction']);
    assert.equal(auth.solanaAddress, address);
  });
}

test('a missing matching signer refuses to use another wallet', async () => {
  await assert.rejects(session([wrongWallet]).signSolanaTransaction(transaction.serialize(), address), /still connecting/);
});

test('a changed account refuses signing even when the old signer is connected', async () => {
  const { wallet, calls } = signer();
  await assert.rejects(session([wallet], otherAddress).signSolanaTransaction(transaction.serialize(), address), /wallet changed/);
  assert.deepEqual(calls, []);
});

test('a session awaiting linked accounts uses the connected wallet address rather than deprecated publicKey', async () => {
  const { wallet } = signer();
  const auth = session([wallet], null);
  assert.equal(auth.solanaAddress, address);
  await assert.doesNotReject(auth.signSolanaTransaction(transaction.serialize(), address));
});

test('a disconnected session with no wallet list fails safely', async () => {
  await assert.rejects(session(undefined, address, 'disconnected').signSolanaTransaction(transaction.serialize(), address), /still connecting/);
});
