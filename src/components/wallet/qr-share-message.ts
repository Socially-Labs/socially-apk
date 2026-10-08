/** Keep the full address in the message so recipients can copy it directly. */
export function qrShareMessage(details: { address: string; amount?: string; note: string }) {
  if (details.amount) return `Hello, here is my Solana payment request:\n\n${details.amount}\nWallet address: ${details.address}\n\n${details.note}`;
  return `Hello, here is my Solana wallet address:\n\n${details.address}`;
}
