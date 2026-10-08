import test from 'node:test';
import assert from 'node:assert/strict';
import { qrShareMessage } from '../src/components/wallet/qr-share-message.ts';

test('wallet share greeting contains the complete current address for copying', () => {
  for (const address of ['2xv2aWMUEesXsbTwFwQcxNrJn4HebPVBCrYihQ8K3Zvg', 'So11111111111111111111111111111111111111112']) {
    assert.equal(qrShareMessage({ address, note: '' }), `Hello, here is my Solana wallet address:\n\n${address}`);
  }
});

test('payment shares preserve the exact amount and devnet instructions', () => {
  const message = qrShareMessage({ address: 'recipient', amount: '23.456789 Test USDC', note: 'Devnet only. Include the payment reference.' });
  assert.match(message, /23\.456789 Test USDC/);
  assert.match(message, /Wallet address: recipient/);
  assert.match(message, /Devnet only\. Include the payment reference\./);
});
