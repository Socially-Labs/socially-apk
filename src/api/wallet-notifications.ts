import { ApiError, type createApiClient } from './client.ts';

/** Only stop retrying after the backend confirms it owns and watches this wallet. */
export async function registerWalletDepositAlerts(client: Pick<ReturnType<typeof createApiClient>, 'request'>, address: string, signal?: AbortSignal) {
  const result=await client.request('/v0/me/wallet-notifications',{method:'PUT',body:{address},signal});
  if(!result || typeof result!=='object' || !('watching' in result) || result.watching!==true || !('network' in result) || result.network!=='devnet') {
    throw new ApiError('invalid_response','The server did not confirm wallet deposit alerts.');
  }
}
