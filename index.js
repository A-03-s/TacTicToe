import express from 'express';
const {pathname: rooty} = new URL('.', import.meta.url);

const app = express();
//const myDir = (rooty.replaceAll('/', '\\')).substring(1);

app.use(express.static('public')); // esta línea es fundamental en Ubuntu 

app.get( '/' , (req,res)=>{
   res.sendFile( 'index.html', { root: rooty }) // en Ubuntu cambiar myDir por rooty
});

import { createServer } from "http";
import { Server } from 'socket.io';

const httpServer = createServer(app);
const io = new Server( httpServer,{});

let clients = 0;
let players = [];


console.log(`Socket.io Server: Waiting clients connections...`);

io.on( 'connection', (socket) => {
  // Server receives a new connection request 
  clients++;
  console.log(`\nSocket.IO Server: connection()   <- A new client connected: socketId:${socket.id}`);

  console.log(`Socket.IO Server: new_connect()  -> Connection accept: socketId:${socket.id}`);
  console.log(`Socket.IO Server: new_connect() --- ${clients} clients connected...\n`);
  io.to(socket.id).emit( 'new_connect',{ description: 'Hey, welcome!'});
  io.emit( 'information', { description: clients + ' clients connected!'})
  // Lanzar un timer tal que si en 5sg no llega el connected del client se lo solicite.
  // con un nuevo mensaje (reconnect) al cual el cliente debe contestar con connected y sus datos.

  socket.on( 'disconnect', () => {
    // Server receives a disconnection request
    let player = players.find( player => player.socketId === socket.id);
    if( player != undefined) {
      let i = players.indexOf(player);
      // Si el player desconectado estaba jugando, se advierte al challenger que se cayó su partida
      // y por lo tanto debe reiniciar
      if( players[i].isPlaying === true) {
        io.to(players[i].socketIdRemote).emit( 'challenger_disconnect', 'The challenger was disconnected... The play will be restarted.');
      }
      console.log(`Socket.IO Server: disconnect()   -> Player index ${i} removed - Name:${player.name}`);
      players.splice(i, 1);
    }
    else {
      console.log(`Socket.IO Server: disconnect()   -> Player removed - Die before born, sorry...}`);
    }
    clients--;
    console.log(`Socket.IO Server: disconnect(): remains ${clients} clients connected yet... `);
    io.emit( 'information', { description: clients + ' clients connected!'})
  });

  socket.on( 'challenge', (msg) => {
    // Server receives a challenge request
    let player = players.find( player => player.socketId === socket.id);
    let i = players.indexOf(player);

    console.log( `Socket.IO Server: challenge()    -> Player index ${i} is challenging - Name:${player.name}`);

    // Search other player with challenge=true
    player = players.find( player => player.challenge === true);
    players[i].challenge = true; // Lo pone a true recién ahora para no interferir con la búsqueda anterior

    let j = -1;
    if( (j = playerCanPlay(player)) >= 0) {
      // let j = players.indexOf(player);
      let msg = {
        description: 'Ready to play!',
        challenger: players[j]
      };
      players[i].side = "der";
      players[i].isPlaying = true;
      players[j].isPlaying = true;
      players[i].socketIdRemote = players[j].socketId;
      players[j].socketIdRemote = players[i].socketId;
      io.to(players[i].socketId).emit( 'challenge_accept', msg);
      msg.challenger = players[i];
      io.to(players[j].socketId).emit( 'challenge_accept', msg);
      console.log( `Socket.IO Server: challenge_accept() -> Player index ${j} accept challenge - Name:${player.name}`);
    }
    else{
      let description = 'Waiting other player to play!';
      players[i].side = "izq";
      io.to(players[i].socketId).emit( 'waiting_challenger', description);
      console.log( `Socket.IO Server: waiting_challenger() -> Player index ${i} is waiting for a challenger - Name:${players[i].name}`);
    }
  });


  socket.on( 'move_remote', (msg) => {
// Implementar la búsqueda del jugador que movió y el reenvio del movimiento al remoto
    let player = players.find(player => player.socketId === socket.id);
    let i = players.indexOf(player);
    let data = {
      description: `Player ${players[i].name} moves: `,
      move: msg
    };
    io.to(players[i].socketIdRemote).emit('move_remote', data);
  });


  socket.on( 'connected', (msg) => {
    let player = {
      name: msg.nombre,
      net: msg.red,
      challenge: false,
      side: undefined,
      isPlaying: false,
      socketId: socket.id,
      socketIdRemote: null
    }

    console.log( `Socket.IO Server: connected()    <- Name: ${msg.nombre} - inRed: ${msg.red} - sessionId: ${msg.socketId}`);

    players.push(player);

    console.log( `Socket.IO Server: assigned()     -> Name: ${msg.nombre} - inRed: ${msg.red} - sessionId: ${socket.id}`);
    io.to(socket.id).emit( 'assigned', player);       // io.to(socket.id).emit: el mensaje se envía solo al cliente con socket.id
//    io.emit( 'assigned', player);                   // emit: el mensaje se reenvía a todos los clientes incluido el emisor
//    socket.broadcast.emit("chat message", msg);     // broadcast: el mensaje se reenvía a todos los clientes excepto el emisor
    });
    
});

const port = 7137;
httpServer.listen( port , ()=>{
   console.log(`My Server \"TacTicToe\" is running on port=${port} / folder=${rooty}\n`);
});

//////////////////////////
// playerCanPlay(): función que determina si un jugador puede aceptar una partida en red
// Parámetro:
// player: primer elemento encontrado con net=true en la lista de jugadores
// Retorno:
// j: índice del jugador dentro de la lista players
// -1: no se encontró ningún jugador que pueda jugar
/////////////////////////
function playerCanPlay( player) {
  let j = -1;

  if( player != undefined) {
    j = players.indexOf(player);
    if( j>=0 && players[j].isPlaying == false)
      return j;
    else
      return -1;
  }
}