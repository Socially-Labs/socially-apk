import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import type { Token, TradingContext, marketsApi } from '@/api/markets';
import { priceFreshness } from '@/api/markets';
import { activeMarketSession } from '@/api/active-market';
/** Renew only while a detail is visible; the server lease expires on background/disconnect. */
export function useActiveMarket(api:ReturnType<typeof marketsApi>,token:Token,context:TradingContext|null,subject:string|null,active:boolean,pollMs=5000) {
  const [state,setState]=useState<{key:string;token:Token;context:TradingContext|null;error:string|null}|null>(null);
  const latest=useRef({token,context});latest.current={token,context};
  const key=`${subject}:${context?.fund.id}:${token.mint}`;
  useEffect(()=>{
    if(!active||!subject||process.env.EXPO_PUBLIC_PAPER_DYNAMIC_MARKETS_ENABLED!=='true')return;
    const {token,context}=latest.current;
    let stopped=false,busy=false;const controller=new AbortController();
    const session=activeMarketSession(api,token,resolved=>{
      if(!stopped)setState(prior=>({key,token:resolved,context:prior?.key===key?prior.context:context,error:null}));
    });
    const refresh=async()=>{
      if(stopped||busy||AppState.currentState && AppState.currentState!=='active')return;busy=true;
      try {
        const resolved=await session.refresh(latest.current.context,controller.signal);
        if(!stopped&&resolved)setState({key,...resolved,error:null});
      } catch(e){if(!stopped)setState(prior=>({key,token:prior?.key===key?prior.token:token,context:prior?.key===key?prior.context:context,error:e instanceof Error?e.message:'Market is warming up.'}));}
      finally{busy=false;}
    };
    void refresh();const timer=setInterval(()=>void refresh(),pollMs);
    const listener=AppState.addEventListener('change',next=>{if(next==='active'){session.renew();void refresh();}});
    return()=>{stopped=true;controller.abort();session.dispose();clearInterval(timer);listener.remove();};
  },[api,key,active,subject,token.mint,token.instrumentId,context?.fund.id,context?.fund.phase,context?.accountingRevision,pollMs]);
  const current=state?.key===key?state:{token,context,error:null};
  const streamed = token.price?.source !== 'JUPITER_TOKENS_V2' && token.price?.sourceAt &&
    Date.parse(token.price.sourceAt) > Date.parse(current.token.price?.sourceAt ?? '') ? token.price : null;
  return {...current,token:{...current.token,price:priceFreshness(streamed ?? current.token.price)}};
}
