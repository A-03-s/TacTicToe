import { player1NickName,inNet } from "./modal.js";
import { wndReload } from "./main.js";

let socket = io();
let errorSocketNumber = 0;
export let socketSt = 0;
let dataConnect = {};
export let dataChallenger = {};
export let moveRemote = false;
export let remoteMove = {};


console.log( `Socket.IO Client: socket init    <- connecting...`)

socket.on( "connect_error", (err) => {
    console.log(`event: connect_error | reason: ${err.message}`);
    errorSocketNumber++;
});

socket.on( 'information', function(data){
  console.log(`Socket.IO Client: information() <- ${data.description}`);
});

socket.on( 'new_connect', function(data){
  console.log(`Socket.IO Client: new_connect() <- ${data.description} - socket.Id:${socket.id}`);
  if( errorSocketNumber > 3) {
    console.log(`Socket.IO Client: new_connect(): errorSocketNumber = ${errorSocketNumber} ==> RELOAD <==`);
    wndReload();
  }
  if( socketSt == 1) {
    console.log(`Socket.IO Client: new_connect(): Se está reconectando...`);
    sendMsg( "connected", dataConnect);
  }
});

socket.on( 'assigned', function(data){
  console.log(`Socket.IO Client: assigned():           <- Name:${data.name} - inNet:${data.net} - socketId:${data.socketId}`);
  socketSt = 1;
});

socket.on( 'waiting_challenger', function(description){
  console.log(`Socket.IO Client: waiting_challenger(): <- ${description}`);
});

socket.on( 'challenge_accept', function(data){
  console.log(`Socket.IO Client: challenge_accept():   <- ${data.description} with ${data.challenger.name} - side:${data.challenger.side} - socketId:${data.challenger.socketId}`);
  dataChallenger = data.challenger;
  socketSt = 2;
});

socket.on( 'challenger_disconnect', function(description){
  console.log(`Socket.IO Client: challenge_disconnect():   <- ${description}`);
  socketSt = 3;
});

socket.on( 'move_remote', function(data){
  console.log(`Socket.IO Client: move_remote():        <- ${data.description} CellOrg:${data.move.cellOrg} - CellDst:${data.move.cellDst}`);
  remoteMove = {
    cellOrg: data.move.cellOrg,
    cellDst: data.move.cellDst
  };
  moveRemote = true;
});


export function sendMsg( type, data) {
  dataConnect = data;   // guarda los datos del mensaje "connected" enviado para luego ser incorporados al mensaje "challenge"
  data.socketId = socket.id;
  socket.emit( type, data);
  console.log( `Socket.IO Client: ${type}()   -> Name:${data.nombre} - inNet:${data.red} - socketId: ${data.socketId} conectado...`);
}

export function sendMove( sqOrg, sqDst) {
  let move = {
    cellOrg: sqOrg,
    cellDst: sqDst
  };
  socket.emit( 'move_remote', move);
  console.log( `Socket.IO Client: move_remote()   -> Cell Org:${move.cellOrg} - Cell Dst:${move.cellDst}`);
}

export function setMoveRemote(value) {
  moveRemote = value;
}

export function set_socketSt(value){
  socketSt=value;
}
