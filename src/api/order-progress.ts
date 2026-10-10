import type { ExecutionProgress } from './generated/paper-trading-contracts.ts';
export function orderProgressMessage(progress?:ExecutionProgress):string{
 if(!progress)return 'Waiting for a fresh market price. The order can take up to two minutes.';
 switch(progress.stage){
  case 'WAITING_DELAY':return 'Your order is queued for the simulated execution delay.';
  case 'WAITING_VALUATION':return 'Waiting for fresh prices for your vault holdings before checking trade limits.';
  case 'WAITING_PRICE':return 'Waiting for a fresh market price after the execution delay. The order expires after two minutes.';
  case 'READY':return 'Checking your vault balance and trade limits.';
  default:return 'Order processed.';
 }
}
