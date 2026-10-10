/** Revision-only authenticated invalidations. HTTP remains the source of dashboard data. */
export function subscribeCaptainChanges(options: {
 origin:string;getAccessToken:()=>Promise<string|null>;onRevision:(revision:string)=>void;onConnection:(ready:boolean)=>void;
 socketFactory?:(url:string)=>WebSocket;
}) {
 let stopped=false,socket:WebSocket|undefined,retry:ReturnType<typeof setTimeout>|undefined,revision:bigint|undefined;
 const connect=()=>{
  if(stopped)return;
  try{socket=(options.socketFactory??(url=>new WebSocket(url)))(`${options.origin.replace(/^http/,'ws').replace(/\/$/,'')}/v0/ws`);}catch{schedule();return;}
  const current=socket;
  current.onopen=()=>{void options.getAccessToken().then(token=>{if(!stopped&&socket===current&&current.readyState===1){if(token)current.send(JSON.stringify({type:'authenticate',accessToken:token}));else current.close();}}).catch(()=>current.close());};
  current.onmessage=event=>{
   if(stopped||socket!==current)return;
   try{const message=JSON.parse(String(event.data));
    if(message.type==='authenticated')current.send(JSON.stringify({type:'subscribe',channel:'captain.dashboard'}));
    else if(message.channel==='captain.dashboard'&&['resync_required','captain.updated'].includes(message.type)&&typeof message.revision==='string'&&/^\d+$/.test(message.revision)){
     const next=BigInt(message.revision);options.onConnection(true);
     if(message.type==='resync_required'||revision===undefined||next>revision){revision=next;options.onRevision(message.revision);}
    }else if(['auth_required','auth_expired','stream_unavailable','error'].includes(message.type)){options.onConnection(false);current.close();}
   }catch{ /* Malformed frames never mutate dashboard state. */ }
  };
  current.onerror=()=>current.close();current.onclose=()=>{if(socket!==current)return;options.onConnection(false);schedule();};
 };
 const schedule=()=>{if(!stopped)retry=setTimeout(connect,3000+Math.random()*2000);};
 connect();
 return()=>{stopped=true;clearTimeout(retry);if(socket){socket.onclose=null;socket.onmessage=null;socket.close();}options.onConnection(false);};
}
