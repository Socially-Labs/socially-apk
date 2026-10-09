export class QrSharingUnavailableError extends Error {
  constructor() {
    super('Image sharing is unavailable on this device. You can still copy your wallet address.');
    this.name = 'QrSharingUnavailableError';
  }
}
