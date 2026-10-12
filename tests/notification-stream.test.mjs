import assert from 'node:assert/strict';
import test from 'node:test';
import { subscribeNotificationChanges } from '../src/api/notification-stream.ts';
test('stream authenticates without a URL token, subscribes with cursor v2 and rejects malformed frames',async()=>{
 const sockets=[],sent=[],connections=[];let changes=0,walletChanges=0;
 const stop=subscribeNotificationChanges({origin:'https://api.example',getAccessToken:async()=>'secret',cursor:()=> '42',onConnection:v=>connections.push(v),onChange:()=>changes++,onWalletChange:()=>walletChanges++,socketFactory:url=>{
  assert.equal(url,'wss://api.example/v0/ws');const socket={readyState:1,send:value=>sent.push(JSON.parse(value)),close(){this.closed=true;}};sockets.push(socket);return socket;
 }});
 const socket=sockets[0];socket.onopen();await new Promise(resolve=>setImmediate(resolve));assert.deepEqual(sent[0],{type:'authenticate',accessToken:'secret'});
 socket.onmessage({data:JSON.stringify({type:'authenticated',expiresAt:new Date(Date.now()+3600000).toISOString()})});
 assert.deepEqual(sent[1],{type:'subscribe',channel:'account.notifications',cursorVersion:2,after:'42'});
 socket.onmessage({data:'bad JSON'});assert.equal(changes,0);
 socket.onmessage({data:JSON.stringify({type:'subscribed',channel:'account.notifications'})});assert.equal(connections.at(-1),true);assert.equal(changes,1);
 socket.onmessage({data:JSON.stringify({type:'resync_required',channel:'account.notifications'})});assert.equal(changes,2);
 socket.onmessage({data:JSON.stringify({type:'wallet.updated',channel:'public'})});assert.equal(walletChanges,0);
 socket.onmessage({data:JSON.stringify({type:'wallet.updated',channel:'account.notifications'})});assert.equal(walletChanges,1);assert.equal(changes,2);
 stop();assert.equal(socket.closed,true);assert.equal(socket.onmessage,null);assert.equal(connections.at(-1),false);
});
