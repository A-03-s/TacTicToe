import { setNickName, initModal,botonModalClick,player1NickName,inNet,setInNet } from "./modal.js";
import { initTemas,botonTemasClick,setTema,getTema } from "./temas.js";
//import * as vModal from "./modal.js";
import { initConfetti,botonConfiClick } from "./confi.js";
import { sendMsg,sendMove,socketSt,dataChallenger,moveRemote,remoteMove,setMoveRemote,set_socketSt } from "./sock.js";

/* gameSt: Variable que almacena el estado de la partida 
0: no empezó 
1: empezó pero aún se están distribuyendo las 3 fichas de cada jugador en el tablero
2 (hay 1 ficha colocada de cada jugador)
3 (hay 2 fichas colocadas de cada jugador)
4 (están las 3 fichas de cada jugador en el tablero)
9: partida terminada
*/
let gameSt = 0;		

/*  moveSt: Variable que indica si hay un movimiento en curso
false: No hay un movimiento en curso
true: se hizo click sobre la ficha a mover pero aún no se hizo click sobre la celda destino ni se venció el timer (3sg)
Se pone en true en las funciones: moveOrg() y mngCellClick(), si se detecta que se hizo click sobre una celda origen
Vuelve a false en el procedimiento getImgByCellOrg() cuando se confirma el movimiento de la ficha,
o automáticamente cuando se vence el timer timerId en la función moveTimerReset().
*/
let moveSt = false;

/* cellSt: arreglo que almacena el estado de las 9 celdas del tablero
0: libre
1: celda ocupada por una ficha del Jugador_1
2: celda ocupada por una ficha del Jugador_2
La función getImgByCellOrg() es la que modifica el estado de cada celda en cellSt[c]
y la función mngCellClick() es la que lo consulta para verificar si la casilla donde se
hizo click tiene alguna ficha para mover.
También lo consulta isTacTicToe() para comprobar si las 3 fichas del jugador que movió
están alineadas y logró hacer TaTeTi
*/
let cellSt = [0,0,0,0,0,0,0,0,0];

/* cellOrg: Variable que almacena el elemento correspondiente a la celda sobre la cual
se hizo click con intención de moverla.
Es cargada en los siguiente casos:
gameSt = [1-3] -> la función MoveOrg() 
gameSt = 4 -> la función MoveDst[c]() donde c es la celda clickeada 
null: No hay ninguna ficha en movimiento. 
Es puesta a null por la función MoveDst[c]() cuando el movimiento es efectivo o por setTimeout, 
en moveOrg(), si después de 3 segundos no se selecciona una casilla válida de destino.
*/
let cellOrg = null;

/* cellOrgIndex: Variable que almacena el índice (de 0 a 8) dentro de la lista de elementos
correspondientes a las celdas del tablero.
Se carga en cada función moveDst[c]() cuando el estado del juego gameSt es 4 y la celda es
clickeada como celda origen y tiene una ficha para mover.
Para las celdas de los token iniciales (gameSt < 4) el valor será 9, 10 y 11 y se setea 
en moveOrg()
*/
let cellOrgIndex = 9;

/* cellDstList: Variable que almacena la lista de elementos correspondientes a las
celdas del tablero.
Se carga y se utiliza en cada función moveDst[c]() y también se utiliza en getImgByCellOrg().
 */
let cellDstList = null;

/* turnPlay: Variable que lleva el nombre del jugador ("Jugador_1" o "Jugador_2") al que le toca jugar. */
let turnPlay = "";

/* cellMsj: Variable que identifica el elemento destinado a mensajes de ayuda para el usuario. */
let cellMsj = null;

/* MOVE_TIMER: Constante dedicada al tiempo máximo en milisegundos desde el click a la ficha 
que se desea mover y el click a la celda destino a la cual se pretende llevar.
Vencido este timer el jugador deberá hacer click nuevamente sobre la ficha que desea mover */
const MOVE_TIMER = 5000;

/* timerId: Identificador del temporizador de movimiento que actúa cuando se selecciona una
ficha para mover y se cancela una vez que se efectiviza el movimiento o si se cancela.
Se inicializa en moveOrg() o en mngCellClick() 
	timerId = setTimeout( moveTimerReset, MOVE_TIMER, 0);  
La función moveTimerReset() es quien cancela el timer cuando corresponde.
*/
let timerId = null;

/* backgroundMusic: Identificador del archivo de audio principal utilizado 
Se inicializa en la playSound() llamada desde initScript() y se accede en los siguientes casos:
- Al presionar el botón "Jugar" desde DisplayBoard()
- Al seleccionar el menú, parar controlar el volumen, desde frezzePlay() y unfrezzePlay() 
*/
let backgroundMusic = null;
let ovationMusic = null;
let gameoverMusic = null;

/* interClock: Identificador del temporizador de reloj de juego para ambos jugadores.
Cada segundo este temporizador llama a la función update() que es la encargada de modificar 
el reloj de cada jugador según corresponda
*/
let interClock = null;			// la callback es update()
let interWaitChallenger = null; // Intervalo vigente mientras se espera la aparición de un retador. La callback es waitChallenger()
let interMove = null;			// Intervalo para implementar una máquina de estados para cuando la partida es en red. La callback es waitChallengerMove()

/* buttonStart: Identificador para el elemento con id="buttonStart" que corresponde
al botón que permite iniciar y suspender el juego
*/
let buttonStart = null;
export let buttonMenu = null;

/* inMenu: variable toggle para saber si el menú está abierto o no
true: el menú está abierto
false: el menú está cerrado (default)
*/ 
let inMenu = false;

/* safeMenu: variable que se utiliza para indicarle a la función frezzePlay() cuándo 
el llamado fue por la simulación de un click realizado para cerrar el menú en caso
que haya quedado abierto desde la instancia anterior
*/
let safeMenu = false;

/* validCell: arreglo que tiene las celdas de destino válidas según la celda de origen
Por ejemplo, si la ficha está en la celda 0, puede moverse a la 1, la 3 o la 4
El valor 9 es inválido porque las celdas van del 0 al 8
*/
let validCell = [
   [1, 3, 4, 9, 9, 9, 9, 9, 9] ,   /* Casillas permitidas desde la Casilla 1 */
   [0, 2, 4, 9, 9, 9, 9, 9, 9] ,   /* Casillas permitidas desde la Casilla 2 */
   [1, 4, 5, 9, 9, 9, 9, 9, 9] ,
   [0, 4, 6, 9, 9, 9, 9, 9, 9] ,
   [0, 1, 2, 3, 5, 6, 7, 8, 9] ,
   [2, 4, 8, 9, 9, 9, 9, 9, 9] ,
   [3, 4, 7, 9, 9, 9, 9, 9, 9] ,
   [6, 4, 8, 9, 9, 9, 9, 9, 9] ,
   [7, 4, 5, 9, 9, 9, 9, 9, 9]     /* Casillas permitidas desde la Casilla 9 */
];

/* gameoverTacTicToe: arreglo que contiene las 8 combinaciones de celdas que implican 
que un jugador ganó la partida porque sus 3 fichas están alineadas en forma horizontal,
vertical u oblicua
*/
let gameoverTacTicToe = [
   [0, 1, 2],
   [3, 4, 5],
   [6, 7, 8],
   [0, 3, 6],
   [1, 4, 7],
   [2, 5, 8],
   [0, 4, 8],
   [2, 4, 6]
];

/* tk: objeto compuesto por dos arreglos (array1 y array2) destinado a almacenar los identificadores de las 3 fichas 
creadas para cada jugador
*/
let array1 = [];
let array2 = [];
let tk = {
	player1: array1,
	player2: array2
};


/**************************
 * Inicialización de la App 
window.addEventListener('DOMContentLoaded', function(event) {});
	At this point our DOM has been loaded and parsed and we are ready to work with it through 
	the JavaScript DOM API, e.g. document.querySelector(), etc. 
	This is the most common pattern used to initialize web apps. 
	In case you need other resources (images, links, etc.) to be ready, checkout the 2nd pattern below.
*/
window.addEventListener('DOMContentLoaded', function(event){

	buttonStart = document.getElementById(`buttonStart`);
	// OJO: la siguiente declaración de la función displayBoard asociada al evento onClick
	// del buttonStart lo solicitó cuando se declaró el script como type=module
	buttonStart.onclick = displayBoard;

	buttonMenu = document.getElementById(`botonMenu`);
	buttonMenu.onclick = abreMenu;

	// Control de apertura indeseada del menú
	let myMenu = localStorage.getItem('inMenu'); 	// localStorage mantiene el estado de un item luego de una actualización de la página
													// o de un location.reload()
	if( myMenu === "true") {
		safeMenu = true;
		buttonMenu.click(); // simula un click en el elemento "botonMenu" para cerrar el menú
		safeMenu = false;
	}
	else
		localStorage.removeItem('inMenu');

	let menuConfig = document.getElementById(`menuConfig`);
	menuConfig.onclick = botonModalClick;

	let temasConfig = document.getElementById(`temasConfig`);
	temasConfig.onclick = botonTemasClick;

	let acercaConfig = document.getElementById(`acercaConfig`);
	acercaConfig.onclick = botonAcercaClick;

	////////////////////////
	// Carga los eventos onclick de cada celda con las funciones asociadas que se identifican con el número de celda
	cellDstList = document.getElementsByClassName(`Cell`);
	let moveDstArray = [moveDst1,moveDst2,moveDst3,moveDst4,moveDst5,moveDst6,moveDst7,moveDst8,moveDst9];
	for( let i=0; i<9; i++) {
		cellDstList[i].onclick = moveDstArray[i];
	}
	////////////////////////

	////////////////////////
	// Lee las cookies guardadas si las hay
	let myCookieR = readCookie( "Nick1");
	if( myCookieR !== "") {
		setNickName(myCookieR);
		console.log("Nick Jugador 1: ", myCookieR);
		document.getElementById(`pj1`).innerHTML = `<h3>${myCookieR}</h3>`;
		document.getElementById(`pj2`).innerHTML = `<h3>Jugador 2</h3>`;
	}
	else {
		document.getElementById(`pj1`).innerHTML = `<h3>Jugador 1</h3>`;
		document.getElementById(`pj2`).innerHTML = `<h3>Jugador 2</h3>`;
	}

	myCookieR = readCookie( "Red");
	console.log("red: ", myCookieR);
	if( myCookieR !== "") {
		if( myCookieR == "true")
			setInNet(true);
		else
			setInNet(false);
	}
	else {
		setInNet(false);
	}
	console.log("inNet: ", inNet);

	myCookieR = readCookie( "Tema");
	console.log("tema: ", myCookieR);
	if( myCookieR === "") {
		setTema("Básico");
	}
	else {
		setTema(myCookieR);
	}
	console.log("Tema: ", getTema());

	////////////////////////

	////////////////////////
	// Envía mensaje de conexión al server, sea que se haya o no configurado inNet=true
	let propMsg = {
        nombre: player1NickName,
        red: inNet
    }
	sendMsg( "connected", propMsg);
	////////////////////////

	let wrapper = document.querySelector('.start');	
	wrapper.addEventListener('mouseover', displayTxt);
	wrapper.addEventListener('mouseout', removeTxt);

	playSound('../sounds/cartoon.wav');
	console.log("arranca musica");

	cellMsj = document.getElementById(`messg`);

	gameSt = 0;

	inMenu = false;
	localStorage.setItem('inMenu', 'false');

	initModal();
	initTemas();

	initConfetti();

	console.log("Arrancó...");
});


/////////////////////////////
// Funciones displayTxt() y removeTxt(): dedicadas a actualizar el status y hover del botón Start
///////////////////////////// 
function displayTxt(evt) {
	console.log("Display Text");
    buttonStart.innerHTML = "Dale Play";
}

function removeTxt(evt) {
	console.log("Remove Text");
    buttonStart.innerHTML = "Jugar";
}

function displayTxt1(evt) {
	console.log("Display1 Text");
    buttonStart.innerHTML = "Parar";
}

function removeTxt1(evt) {
	console.log("Remove1 Text");
    buttonStart.innerHTML = "Jugando";
}

function displayTxt2(evt) {
	console.log("Display2 Text");
    buttonStart.innerHTML = "Reiniciar";
}

function removeTxt2(evt) {
	console.log("Remove2 Text");
    buttonStart.innerHTML = "Juego Terminado";
}


///////////////////////////
// Funciones playSound(): dedicadas a cargar los tracks de sonido
///////////////////////////
function playSound( track) {
	backgroundMusic = new Audio(track);
	backgroundMusic.loop = true;
	backgroundMusic.volume = "0.1";
//	backgroundMusic.controls = true;
//	backgroundMusic.autoplay = true;
}

function playSound2( track, vol) {
	let audioMusic = new Audio(track);
	audioMusic.loop = false;
	audioMusic.volume = vol;
	audioMusic.controls = true;
	audioMusic.play();
	return audioMusic;
}


////////////////////////////
// update():
// Función que actualiza el temporizador de los jugadores
// Es llamada por setInterval() cada 1 segundo
////////////////////////////
function update() {
	let clockId = (turnPlay === "Jugador_1") ? document.getElementById(`crono1`) : document.getElementById(`crono2`);
	let clock = [Number(clockId.innerHTML.slice(0, 2)), Number(clockId.innerHTML.slice(3))];
	if (clock[1] == 0) {
		if (clock[0] == 0) {
			console.log(`Al ${turnPlay} se le terminó el tiempo...`);
			cellMsj.innerHTML = `<b>Atención: ${turnPlay}</b> se le terminó el tiempo...`
			clearInterval(interClock);
		}
		else {
			clock[0] -= 1;
			clock[1] = 59;
		}
	}
	else {
		clock[1] -= 1;
	}
	let clockString = String(clock[0]).padStart(2, 0) + ":" + String(clock[1]).padStart(2, 0);
	clockId.innerHTML = clockString;
}

//////////////////////
// Manejo de Cookies
//////////////////////
function guardarCookies( nombre, valor) {
	
	if(nombre != undefined) {
		document.cookie = nombre+"="+valor;
	}
	else {
		let myCookie = "Nombre=Juan; expires=31 Dec 2023 23:59:59 GMT;";
		console.log("cookie: ", myCookie);
		document.cookie = myCookie;
	}
}

function verCookies() {
	alert( document.cookie);
}


function readCookie(nombre) {
	let lista = document.cookie.split(";");
	let micookie = "";
	for (let i in lista) {
		let busca = lista[i].search(nombre);
		if (busca > -1) { 
			micookie = lista[i] 
		}
	}
	let igual = micookie.indexOf("=");
	let valor = micookie.substring(igual + 1);
	return valor;
}

/**************************************
 * El par de funciones frezzePlay() y unfrezzePlay(), congelan y descongelan el juego cuando
 * el usuario ingresa al menú de hamburguesa, haciendo lo siguiente:
 * - deshabilita / habilita las celdas del tablero
 * - deshabilita / habilita el botón principal del juego (buttonStart)
 * - cancela / reinicia el timer de 1 seg utilizado como control de reloj de los jugadores
 */

function frezzePlay() {
//	menuItems.style.display = "block"; // abriría la ventana menú pero no modifica las líneas de la hamburguesa

	if( safeMenu == true) return; 	// cuando el click es simulado desde window.addEventListener('DOMContentLoaded', function(event)
									// se vuelve sin hacer nada para no afectar otras funcionalidades sino únicamente cerrar
									// el menú que había quedado abierto desde la instancia anterior previa a actualizar la página o
									// a location.reload()

	localStorage.setItem('inMenu', 'true');

	// Si bien se ponen las celdas de tablero en disabled=true, el control de JavaScript sigue
	// llamando a las funciones asociadas al evento onClick de las celdas.
	// Por esto tuvo que recurrirse a la evaluación en cada función de la variable inMenu

	for( let i=0; i<9; i++) {
		cellDstList[i].disabled = true;
	}

	// Para el boton principal sí funciona disabled=true
	buttonStart.disabled = true;

//	backgroundMusic.volume = "0";
	backgroundMusic.muted = true;
	if( gameSt != 0)
		clearInterval(interClock);
}

function unfrezzePlay() {
// 	menuItems.style.display = "none"; // cerraría la ventana de menú pero no modifica las líneas de la hamburguesa

	localStorage.setItem('inMenu', 'false');

	for( let i=0; i<9; i++) {
		cellDstList[i].disabled = false;
	}

	buttonStart.disabled = false;
	
//	backgroundMusic.volume = "0.1";
	backgroundMusic.muted = false;
	if( gameSt != 0)
		interClock = setInterval( update, 1000);

	let myCookieR = readCookie( "Nick1");
	if( myCookieR !== "") {
		console.log("Nick Jugador 1: ", myCookieR);
		document.getElementById(`pj1`).innerHTML = `<h3>${myCookieR}</h3>`;
		document.getElementById(`pj2`).innerHTML = `<h3>Jugador 2</h3>`;
	}
		
}


/////////////////////////////
// abreMenu(): función llamada cada vez que se hace click en el menú de hamburguesa y se utiliza
// para lo siguiente:
// - llamar a las funciones frezzePlay() y unfrezzePlay() 
// - alternar entre true y false el valor de inMenu 
/////////////////////////////
function abreMenu() {
	inMenu = (inMenu == true) ? false : true;

	console.log( "abreMenu() - inMenu = ", inMenu);
	
	if( inMenu)
		frezzePlay();
	else
		unfrezzePlay();	

//	inNetPrev=inNet;
}

////////////////////////
// wndReload(): función que ejecuta el reinicio de la página y es análoga a presionar F5
////////////////////////
export function wndReload() {
	inMenu = false;
	backgroundMusic.muted = true;
	window.location.reload(true);
	console.log("wndReload():Salió del reload()");
}

////////////////////////
// doRemoteMove(): función que ejecuta el movimiento que acaba de hacer el jugador remoto
// Parámetro:
// move: objeto que almacena el movimiento remoto y es cargado en sock.js cuando llega un mensaje move_remote
//       cellOrg: celda origen [0..8] casillas del tablero o [9..11] casillas de inicio de las fichas
//       cellDst: celda destino [0..8]
//////////////////////// 
function doRemoteMove(move) {
	console.log( `doRemoteMove(): El jugador ${turnPlay} movió de ${move.cellOrg} a ${move.cellDst}`);

	let cellDst = document.getElementById(cellDstList[move.cellDst].id);
	let cellOrg = null;

	if( gameSt < 4) {
		cellOrg = (turnPlay === "Jugador_1") ? tk.player1[move.cellOrg-9] : tk.player2[move.cellOrg-9];
		console.log(`doRemoteMove(): cellOrg.id = ${cellOrg.id}`);
	}
	else {
		cellOrg = document.getElementById(cellDstList[move.cellOrg].id);
	}

	if( gameSt < 4) {
		cellDst.id = cellOrg.id;
		cellOrg.disabled = true;
		cellOrg.id = "CellDisabled";
	}
	else {
		cellDst.id = cellOrg.id;
		cellOrg.style.borderWidth = "thin";
		cellOrg.style.height = "100px";
		cellOrg.style.width = "100px";
		cellOrg.id = "cell" + (move.cellOrg+1);
	}

	cellSt[move.cellDst] = (turnPlay === "Jugador_1") ? 1 : 2;
	if( gameSt >= 4)
		cellSt[move.cellOrg] = 0;
}


/* inNetPlayer: variable que representa al jugador local cuando se juega una partida en red.
Se inicializa con un string vacío pero puede tener los siguientes valores también strings:
Jugador_1: al jugador local le corresponde el lado izquierdo del tablero
Jugador_2: al jugador local le corresponde el lado derecho del tablero
*/
let inNetPlayer = "";

/* inNetSt: variable que representa el estado de la maquinita de estados implementada
para controlar el juego mientras se juega una partida en red.
Se analiza cuando periódicamente cada 500 milisegundos se llama a la función waitChallengerMove(),
la cual se habilita con el setInterval() configurado en displayBoardInNet2() y su identificador es interMove.
inNetSt puede se inicializa con 0 pero puede tomar los siguientes valores:
14: valor de inicio para el jugador a quien le toca el lado izquierdo del tablero o sea quien juega
15: valor de inicio para el jugador a quien le toca el lado derecho del tablero o sea quien espera a que juegue el otro
16: valor que indica que el jugador remoto ya jugó y se debe ejecutar el movimiento remoto en el tablero local. Una vez
ejecutado el movimiento se vuelve al estado 14 pues le tocará jugar
*/
let inNetSt = 0;

//////////////////////////////
// waitChallengerMove(): máquina de estados mientras se juega una partida en red
//////////////////////////////
function waitChallengerMove() {
	if( socketSt == 3) {
		console.log( `waitChallengerMove(): Recibió indicación challenger desconectado`);
		clearInterval(interMove);
		backgroundMusic.muted = true;
		clearInterval(interClock);
		alert( "El jugador remoto se desconectó. Habrá que reiniciar.");
		wndReload();
	}
	switch( inNetSt) {
		case 14:		// Juega
			break;
		case 15:		// Espera
			if( moveRemote == true) {
				console.log( `waitChallengerMove(): Recibió indicación de move remoto realizado`);
				inNetSt = 16;
			}
			break;
		case 16:		// Ejecuta move remoto
			console.log( `waitChallengerMove(): Ejecución del move remoto`);
			setMoveRemote(false);
			doRemoteMove( remoteMove);
			// Detección del TATETI remoto -> si es true implica que el jugador local perdió
			if( isTacTicToe() == true) {
				console.log( `waitChallengerMove(): ${dataChallenger.name} hizo TaTeTi --- GAME OVER ---. Lo siento perdió...`);
			}
			gameControl();
			console.log( `waitChallengerMove(): cellSt[]`, cellSt);
			inNetSt = 14;		
			break;
		default:
			console.log( "waitChallengerMove(): ERROR inNetSt desconocido...");
			break;
	}
}

////////////////////////////
// displayBoardInNet2(): función que configura y lanza la partida
// Básicamente, reproduce la función displayBoard() que hace lo propio cuando el juego no es en red.
// Las diferencias son las siguiente:
// - Al principio: 
//   Inicializa la variable moveRemote a false que es utilizada para indicar que se recibió un movimiento remoto.
//   A esta variable la pone a true sock.js en la función socket.on( 'move_remote', function(data){});
//   Luego será leída en waitChallengerMove() cada 500 milisegundos en el jugador que está a la espera del movimiento remoto
//   Se termina de configurar el tablero de acuerdo a la información recibida en el mensaje challenge_accept
//   En dicho mensaje llega un objeto denominado dataChallenger que tiene los siguientes componentes:
//      side: es el lado del tablero que le tocó al jugador local "der" o "izq". 
//            el jugador que quede del lado izquierdo será el que moverá primero
//            y para lo cual se le cargará en la variable de estado inNetSt el valor inicial de la máquina de estados 
//            implementada en la función waitChallengerMove() que será llamada cada 500 milisegundos.
//            Por el contrario, a quién le toque el lado derecho deberá primero esperar a que mueva el otro jugador
//            para lo cual el valor de la variable de estado se pone en 15.
//      name: nombre del jugador remoto
//
// - Al final:
//   Se configura con setInterval() un temporizador que cada 500 mseg va a llamar a la función waitChallengerMove()
////////////////////////////
function displayBoardInNet2() {
	console.log("displayBoardInNet2(): Se recibió un challengeAccept en socket.IO.Client y ya fue detectado en main.js por waitChallenger()");

	setMoveRemote(false);
	if(dataChallenger.side == "der") {
		// Le toca jugar primero porque el retador está del lado derecho
		inNetSt = 14;
		console.log("Challenger del lado derecho");
		document.getElementById(`crono2`).style.backgroundColor = "#999999";	// Sector del Jugador remoto
		document.getElementById(`columna3`).style.backgroundColor = "#999999";
		inNetPlayer = "Jugador_1";		// Jugador local
		document.getElementById(`pj1`).innerHTML = `<h3>${player1NickName}</h3>`;
		document.getElementById(`pj2`).innerHTML = `<h3>${dataChallenger.name}</h3>`;
		
		for( let i=0; i<3; i++) {
			tk.player2[i].onclick = moveOrgDisabled;
		}
	}
	else {
		// No juega, le toca esperar
		inNetSt = 15;
		console.log("Challenger del lado izquierdo");
		document.getElementById(`crono1`).style.backgroundColor = "#999999";	// Sector del Jugador remoto
		document.getElementById(`columna1`).style.backgroundColor = "#999999";
		inNetPlayer = "Jugador_2";		// Jugador local
		document.getElementById(`pj1`).innerHTML = `<h3>${dataChallenger.name}</h3>`;
		document.getElementById(`pj2`).innerHTML = `<h3>${player1NickName}</h3>`;
		
		for( let i=0; i<3; i++) {
			tk.player1[i].onclick = moveOrgDisabled;
		}		
	}

	// Inicialización de los elementos asociados a la turnera
	let bolaPlay = document.getElementById('turno1');
	bolaPlay.className = "circle1";
	bolaPlay = document.getElementById('turno2');
	bolaPlay.className = "circle2";
	turnPlay = "Jugador_1";

	gameSt = 1;

	console.log( `turnPlay = ${turnPlay} - inNetPlayer = ${inNetPlayer}`);

	// Modificación del botón "Jugar", su texto y su "hover"
	buttonStart.className = "onPlay";
	let $wrapper = document.querySelector('.onPlay');

	// Es interesante ver cómo las funciones se agregan a las ya existentes,
	// sino se utiliza eliminarlas el método removeEventListener()
	$wrapper.removeEventListener('mouseover', displayTxt);
	$wrapper.removeEventListener('mouseout', removeTxt);

	$wrapper.addEventListener('mouseover', displayTxt1);
	$wrapper.addEventListener('mouseout', removeTxt1);

	backgroundMusic.play();
	backgroundMusic.muted = false;

	buttonMenu.disabled = true;

	// Temporizador de juego
	interClock = setInterval( update, 1000);

	// Máquina de estados que controla el movimiento del jugador local y del remoto
	interMove = setInterval( waitChallengerMove, 500);

	buttonStart.disabled = false;
}


let waitToggle = true;		// Toggle utilizado para controlar el blink del mensaje

////////////////////////////
// waitChallenger(): función que es llamada cada 500 mseg que espera el cambio de la variable socketSt al valor 2.
// La variable socketSt es seteada a 2 en sock.js en la función socket.on( 'challenge_accept', function(data){});
// cuando se recibe un mensaje challeger_accept.
// Cuando llega, se llama a la función displayBoardInNet2() que es la encargada de lanzar la partida.
// waitChallenger() también pone en blink el mensaje "Esperando al retador"
////////////////////////////
function waitChallenger() {
	if( socketSt == 2) {
		clearInterval(interWaitChallenger);
		cellMsj.innerHTML = "_______________________";
		displayBoardInNet2();
	}
	else {
		if( waitToggle == true) {
			waitToggle = false;
			cellMsj.innerHTML = "Esperando al retador...";
		}
		else {
			waitToggle = true;
			cellMsj.innerHTML = "_______________________";
		}
	}
}

////////////////////////////
// displayBoardInNet1(): función para dispara el modo de juego "inNet" que hace las siguientes tareas:
// 1) Enviar el mensaje "challenge" para iniciar el desafío
//    - el server buscará algún otro jugador (challenger) que ya haya hecho un challenge o esperará algún jugador a que lo haga
//    - cuando tenga un challenger enviará a ambos jugadores un "challenge_accept" con la info del otro jugador (variable "dataChallenger")
// 2) Quedará esperando la recepción del mensaje challenger_accept que enviará el server cuando encuentre un challenger.
//    La espera se implementa con un setInterval que llama a la función waitChallenger() cada 500 milisegundos
// 3) Mostrará en pantalla el tablero y las fichas, aún sin decidir lado ni poner nombre del jugador remoto. 
//    Esto se hace de manera similar a como lo hace la función displayBoard(). Notar que los identificadores de las fichas (token) creadas
//    quedan guadados en el objeto tk, que a su vez tiene un array para cada jugador. Posteriormente, según la información recibida en el 
//    mensaje challenge_accept se decidirá que array corresponde al jugador local y cuál al jugador remoto (challenger) 
// 4) Deshabilita los botones de menú y de "Start"
////////////////////////////
function displayBoardInNet1() {
	console.log(`displayBoardInNet1(): Jugador ${player1NickName} en red`);
	let propMsg = {
		nombre: player1NickName,
		red: inNet
	}
	sendMsg("challenge", propMsg);

	interWaitChallenger = setInterval( waitChallenger, 500);

	let tokensPlayer_1 = document.getElementById('columna1');
	let tokensPlayer_2 = document.getElementById('columna3');

	for( let i=0; i<3; i++) {
		tokensPlayer_1.appendChild( tk.player1[i] = createToken( getTema() + "_1-" + i, 1));
		tokensPlayer_2.appendChild( tk.player2[i] = createToken( getTema() + "_2-" + i, 2));
	}

	gameSt = 1;
	buttonStart.disabled = true;
	buttonMenu.disabled = true;
}

///////////////////////////
// displayBoard():
// Función que crea los botones correspondientes a las 3 fichas por jugador,
// carga las imágenes y configura la función MoveOrg() para que sean movidas al tablero.
// Para esto llama a la función createToken().
///////////////////////////
function displayBoard() {
	console.log( "Cookie: ", document.cookie);
	
	console.log( "displayBoard(): ", buttonStart.innerHTML);
	if( buttonStart.className == "onPlay" || buttonStart.className == "onSuspend") {
		wndReload();
		return;
	}
	
	cellSt = [0,0,0,0,0,0,0,0,0];

	// Cuando el jugador tiene configurado "En red" en su perfil significa que 
	// desea jugar contra otro jugador conectado en red
	if( inNet === true) {
		displayBoardInNet1();	// función dedicada a esperar la conexión de otro jugador (challenger)
		return;
	}

	let tokensPlayer_1 = document.getElementById('columna1');
	let tokensPlayer_2 = document.getElementById('columna3');

	for( let i=0; i<3; i++) {
		tokensPlayer_1.appendChild( tk.player1[i] = createToken( getTema() + "_1-" + i, 1));
		tokensPlayer_2.appendChild( tk.player2[i] = createToken( getTema() + "_2-" + i, 2));
	}

	// Inicialización de los elementos asociados a la turnera
	let bolaPlay = document.getElementById('turno1');
	bolaPlay.className = "circle1";
	bolaPlay = document.getElementById('turno2');
	bolaPlay.className = "circle2";
	turnPlay = "Jugador_1";

	gameSt = 1;
	cellMsj = document.getElementById(`messg`);
	
	// Modificación del botón "Jugar", su texto y su "hover"
	buttonStart.className = "onPlay";
	let $wrapper = document.querySelector('.onPlay');

	// Es interesante ver cómo las funciones se agregan a las ya existentes,
	// sino se utiliza eliminarlas el método removeEventListener()
	$wrapper.removeEventListener('mouseover', displayTxt);
	$wrapper.removeEventListener('mouseout', removeTxt);

	$wrapper.addEventListener('mouseover', displayTxt1);
	$wrapper.addEventListener('mouseout', removeTxt1);

	backgroundMusic.play();
	backgroundMusic.muted = false;

	buttonMenu.disabled = true;

	// Temporizador de juego
	interClock = setInterval( update, 1000);
}



function createToken( playerName, playerIndex) {
	let token = document.createElement('button');
	token.id = playerName;
	token.className = 'playerToken'+playerIndex;
	token.onclick = moveOrg;
	
	let tokenImage = document.createElement('img');
	tokenImage.src = 'images/' + playerName + ".png";
	token.appendChild(tokenImage);

	return token;
}

////////////////////////
// gameControl(): 
// Función que asigna el turno de juego alternativamente a cada jugador.
// Es llamada desde getImgByCellOrg() una vez que un movimiento fue confirmado.
// Esa función es llamada a su vez desde cada función moveDst[c](). 
// La "c" identifica a cada una de las 9 celdas del tablero.
// Modifica el color del círculo de turno (ElementId = turno[i]) de cada jugador:
// Verde: tiene el turno, puede mover
// Rojo: No tiene el turno, juega el otro
// Incrementa el valor de la variable global gameSt:
//   gameSt = 2 (hay 1 ficha colocada de cada jugador)
//   gameSt = 3 (hay 2 fichas colocadas de cada jugador)
//   gameSt = 4 (están las 3 fichas de cada jugador en el tablero)
////////////////////////
function gameControl() {

	let bolaPlay = null;

	console.log( "gameControl(): turnPlay = ", turnPlay);

	if(turnPlay === "Jugador_1") {
		bolaPlay = document.getElementById('turno1');
		bolaPlay.style.background = "red";
		bolaPlay = document.getElementById('turno2');
		bolaPlay.style.background = "green";
	}
	else {
		bolaPlay = document.getElementById('turno1');
		bolaPlay.style.background = "green";
		bolaPlay = document.getElementById('turno2');
		bolaPlay.style.background = "red";
		if(gameSt <= 3) gameSt++;
	}

	turnPlay = (turnPlay === "Jugador_1") ? "Jugador_2" : "Jugador_1";

	console.log( "gameControl(): gameSt = ", gameSt);
}

/////////////////////
// moveOrg():
// Esta función es llamada únicamente en la fase inicial del juego
// en la cual se despliegan las 3 fichas de cada jugador en el tablero.
// Se llama cuando el jugador hace click sobre alguna de las 3 imágenes
// que representan a sus 3 fichas. 
// Si se tiene el menú de hamburguesa abierto se retorna inmediatamente.
// El elemento correspondiente a la imagen objeto del evento "click" 
// se "carga" en la variable global cellOrg (cellOrg=this)
// que luego es leída (cellOrg.id) desde getImgByCellOrg() para identificar
// la imagen y cargarla en la celda del tablero (cellDst.id) 
// a la cual el jugador decidió mover la ficha.
/////////////////////
function moveOrgDisabled() {
	return;
}

function moveOrg() {
	if( inMenu == true) 
		return;
//	document.getElementById('columna2').appendChild(this);
	cellOrg = this;
//	cellMsj = document.getElementById('messg');

	let i = cellOrg.id.indexOf("_");
	let dueñoFicha = "Jugador_" + cellOrg.id[i+1];
	if( dueñoFicha != turnPlay) {	// Controla que la ficha a mover sea del jugador que tiene el turno
		if( inNet === true && gameSt == 1) {
			console.log( "moveOrg(): Debe esperar a que aparezca un retador.");
			cellMsj.innerHTML = "<b>Atención:</b> Debe esperar a que aparezca un retador."
		}
		else {
			console.log( "moveOrg(): Debe mover el jugador que tiene el turno.");
			cellMsj.innerHTML = "<b>Atención:</b> Debe mover el jugador que tiene el turno."
		}
		cellOrg = null;
		return;
	}

	cellMsj.innerHTML = "______________________"

	cellOrg.style.borderColor = "black";

	timerId = setTimeout( moveTimerReset, MOVE_TIMER, 0);
	moveSt = true;
	cellOrgIndex = 9 + Number(cellOrg.id.slice(-1));
	console.log( `moveOrg(): cellOrg.id = ${cellOrg.id} - cellOrgIndex = ${cellOrgIndex}`);
}


/////////////////////
// moveDst[c]():
// La "c" identifica a cada una de las 9 celdas del tablero.
// Estas funciones se llaman cada vez que un jugador hace "click"
// sobre alguno de los elementos <div> que representan las 9
// celdas del tablero, cuyo className es "Cell".
// Si se tiene el menú de hamburguesa abierto se retorna inmediatamente
// de lo contrario se llama a la función mngCellClick() con el número
// de celda clickeado como parámetro.
// Mientras no estén colocadas todas las fichas en el tablero, estas
// funciones solo pueden ser llamadas como celda de destino, pero cuando
// ya se han colocado las 3 fichas de cada jugador (gameSt=4) pueden 
// ser llamadas tanto como casilla de origen como de destino.
// La diferenciación se hace en la función mngCellClick() según el valor de
// la variable moveSt que solo es true cuando se llama a moveOrg() 
// como casilla origen.
/////////////////////
function moveDst1() {
	if( inMenu == true) 
		return;
	mngCellClick(0);
}

function moveDst2() {
	if( inMenu == true) 
		return;
	mngCellClick(1);
}

function moveDst3() {
	if( inMenu == true) 
		return;
	mngCellClick(2);
}

function moveDst4() {
	if( inMenu == true) 
		return;
	mngCellClick(3);
}

function moveDst5() {
	if( inMenu == true) 
		return;
	mngCellClick(4);
}

function moveDst6() {
	if( inMenu == true) 
		return;
	mngCellClick(5);
}

function moveDst7() {
	if( inMenu == true) 
		return;
	mngCellClick(6);
}

function moveDst8() {
	if( inMenu == true) 
		return;
	mngCellClick(7);
}

function moveDst9() {
	if( inMenu == true) 
		return;
	mngCellClick(8);
}


////////////////////////
// mngCellClick(): 
// Función dedicada a gestionar cada evento "click" sobre las 9 celdas del tablero.
// Parámetros:
// cellClickIndex: identifica el número de la celda objeto del evento "click".
////////////////////////
function mngCellClick( cellClickIndex) {
	// Obtiene la lista de elementos correspondientes a las celdas del tablero.
	// No se puede hacer una única vez al comienzo del juego porque es dinámica y
	// los id de los elementos se van modificando durante el juego.
//	console.log( `moveDst(${cellClickIndex}): cellDstList[${cellClickIndex}].id = `, cellDstList[cellClickIndex].id);
	let cellDst = document.getElementById(cellDstList[cellClickIndex].id);
	console.log( `moveDst(${cellClickIndex}): cellDst.id = `, cellDst.id); 
	console.log( "cell disabled = ", cellDstList[cellClickIndex].disabled);

	if (moveSt == true) { // se clickeo como casilla destino
		getImgByCellOrg(document.getElementById(cellDst.id), cellClickIndex);
	}
	else if (cellSt[cellClickIndex] == false) { // se clickeo como casilla origen pero no tiene ninguna ficha 
		if( gameSt < 4) 
			console.log( `moveDst(${cellClickIndex}): Error1: todavía quedan fichas a poner en el tablero.`);
		else
			console.log( `moveDst(${cellClickIndex}): Error2: se clickeo como casilla origen pero no tiene ninguna ficha`);
		return;
	}
	else { // se clickeo como casilla origen y tiene una ficha
		if( gameSt < 4) {
			console.log( `moveDst(${cellClickIndex}): Error3: todavía quedan fichas a poner en el tablero.`);
			return;
		}
		console.log(`moveDst(${cellClickIndex}): inNet = ${inNet} - inNetPlayer = ${inNetPlayer} - turnPlay = ${turnPlay}`);
		if( inNet === true && inNetPlayer !== turnPlay) {
			console.log(`moveDst(${cellClickIndex}): Ahora le toca mover al jugador remoto ${dataChallenger.name}.`);
			cellOrg = null;
			return;
		}

		let i = cellDst.id.indexOf("_");
		let dueñoFicha = "Jugador_" + cellDst.id[i+1];
		if (dueñoFicha != turnPlay) {	// Controla que la ficha a mover sea del jugador que tiene el turno
			console.log( `moveDst(${cellClickIndex}): Debe mover el jugador que tiene el turno.`);
			cellMsj.innerHTML = "<b>Atención:</b> Debe mover el jugador que tiene el turno."
			cellOrg = null;
			return;
		}
		console.log( `moveDst(${cellClickIndex}): OK: se clickeo como casilla origen, tiene una ficha y es del jugador que tiene el turno.`);
		// Marcar el borde de la ficha seleccionada para ser movida.
		cellMsj.innerHTML = "______________________"
		cellOrg = cellDst;
		cellOrg.style.borderWidth = "3px";
		cellOrg.style.height = "97px";
		cellOrg.style.width = "97px";
		cellOrgIndex = cellClickIndex;
		timerId = setTimeout( moveTimerReset, MOVE_TIMER, 0);
		moveSt = true;
	}
}

/////////////////////
// getImgByCellOrg()
// Función llamada desde mngCellClick() cuando ya han sido chequeadas todas las condiciones de la ficha origen
// para llevar a cabo el control de la celda destino y el movimiento efectivo si corresponde.
// Parámetros:
// cellDst: identificador de la celda destino del tablero
// cellClickIndex: índice de la celda destino.
///////////////////// 
function getImgByCellOrg( cellDst, cellClickIndex) {

	let cell_Id = cellDst.id;

	if( cell_Id.length > 5) {
		console.log(`getImgByCellOrg(): Error1: Esta celda ya tiene una ficha. cellDst.id = ${cell_Id} - ${cell_Id.length}`);		// La celda destino no está vacía y ya tiene una ficha
		moveTimerReset(1);
		return;
	}

	if( cellOrg == null) {				// Esta celda no tiene una ficha pero tampoco se seleccionó qué ficha se desea poner
		console.log("getImgByCellOrg(): Error2: cellOrg = null");
		return;
	}

	/* Control de casilla válida según las reglas del TaTeti */
	if( gameSt>=4 && isSquareDstAllowed( cellOrgIndex, cellClickIndex) == false) {
		console.log(`getImgByCellOrg(): Error_10: cellDst = no permitida [${gameSt}] [${cellOrgIndex}] [${cellClickIndex}]`);
		cellMsj.innerHTML = "<b>Atención:</b> Casilla destino inválida."
		moveTimerReset(1);
		return;
	}
	console.log(`getImgByCellOrg(): OK: cellDst = permitida [${gameSt}] [${cellOrgIndex}] [${cellClickIndex}]`);
	/************************/

	console.log( "getImgByCellOrg(): cellDst.id = ", cell_Id);
	console.log( "getImgByCellOrg(): cellOrg.id = ", cellOrg.id);

	if( gameSt < 4) {
		cellDst.id = cellOrg.id;
		cellOrg.disabled = true;
		cellOrg.id = "CellDisabled";
	}
	else {
		cellDst.id = cellOrg.id;
		cellOrg.style.borderWidth = "thin";
		cellOrg.style.height = "100px";
		cellOrg.style.width = "100px";
		cellOrg.id = "cell" + (cellOrgIndex+1);
	}
	console.log( `getImgByCellOrg(): OK: La ficha fue movida desde la celda ${cellOrgIndex+1} a la celda ${cellClickIndex+1}.`);

	cellSt[cellClickIndex] = (turnPlay === "Jugador_1") ? 1 : 2;
	if( gameSt >= 4)
		cellSt[cellOrgIndex] = 0;

	/* Control de TaTeTi */
	if( isTacTicToe() == true) {
		console.log( `getImgByCellOrg(): El ${turnPlay} hizo TaTeTi --- GAME OVER ---`);
	}
	/************************/

	moveTimerReset(1);
	if( inNet === true) {
		sendMove(cellOrgIndex, cellClickIndex);
		inNetSt = 15;
	}
	console.log( `getImgByCellOrg(): cellSt[]`, cellSt);
	gameControl();
}

////////////////////////
// moveTimerReset():
// Función llamada cuando se vence o cancela el temporizador de ficha seleccionada para mover
// Parámetros:
// causaReset: 
//   - 0: Si es llamada cuando vence el timer.
//   - 1: Si es llamada por la detección de algún error en el intento de movimiento.
//////////////////////// 
function moveTimerReset(causaReset) {
	if( gameSt >= 4) {
		cellOrg.style.borderWidth = "thin";
		cellOrg.style.height = "100px";
		cellOrg.style.width = "100px";
	}
	else {
		cellOrg.style.borderColor = (turnPlay === "Jugador_1") ? "#5690fc" : "#ff3392";
	}
	if( causaReset != 0) {
		console.log( `moveTimerReset(): Se canceló el temporizador de selección para la celda ${cellOrgIndex+1}.`)
		clearTimeout(timerId);
	}
	else
		console.log( `moveTimerReset(): Se venció el temporizador de selección para la celda ${cellOrgIndex+1}.`)
	cellOrg = null; 
	moveSt = false;
}

//////////////////////////
// isSquareDstAllowed( squareOrg, squareDst):
// Parámetros:
// squareOrg: celda de origen desde la cual se desea mover la ficha
// squareDst: celda de destino a la cual se desea mover la ficha
// La función chequea si la celda destino elegida por el jugador es válida según las reglas del TaTeTi
// Las posiciones válidas están incluidas en el array validCell[][] al cual se accede con la casilla origen. 
// Valor de retorno:
// true: celda destino válida
// false: celda destino inválida
//////////////////////////
function isSquareDstAllowed( squareOrg, squareDst)
{
	let buff = "línea: ";
	for( let i=0; i<9; i++)
	{
		if( validCell[squareOrg][i] == squareDst)
		{
			console.log( `IsSquareDstAllowed(): Casilla válida --- ${buff}`);
			return true;
		}
		buff += ` ${validCell[squareOrg][i]}`
	}
	console.log( `IsSquareDstAllowed(): Casilla inválida --- ${buff}`);
	return false;
}

//////////////////////////
// isTacTicToe(): 
// Función que chequea si el jugador que tiene el turno hizo TaTeTi según las reglas del juego.
// Las 8 combinaciones posibles de TaTeTi están incluidas en el array gameoverTacTicToe[][],
// el cual se va barriendo y si la posición de las 3 fichas del jugador coincide con alguna de las 8
// se da por cumplido el TaTeTi.
// Valor de retorno:
// true: el jugador que tiene el turno hizo TaTeTi y ganó el juego
// false: el jugador no hizo TaTeTi
//////////////////////////
function isTacTicToe() {
	if( gameSt < 3) 		// cuando se coloca la última ficha, gameSt=3, ya puede haber TaTeTi
		return false;

	let tokenSquare = [];

	for( let i=0; i<9; i++) {		// Son 9 las casillas del tablero donde pueden estar las 3 fichas del jugador
		if( turnPlay.slice(-1) == cellSt[i])
			tokenSquare.push(i);
	}
	console.log( `isTacTicToe(): las fichas del ${turnPlay} están en las casillas ${tokenSquare}`);

	for( let i=0; i<8; i++) {		// Son 8 las combinaciones posible para hacer TaTeTi
//		console.log( `isTacTicToe(): tokenSquare=${tokenSquare} --- gameoverTacTicToe[${i}]=${gameoverTacTicToe[i]}`);
//		if( tokenSquare == gameoverTacTicToe[i]) { // ESTO NO FUNCIONA y no sé porqué
		if( tokenSquare[0]==gameoverTacTicToe[i][0] &&
			tokenSquare[1]==gameoverTacTicToe[i][1] &&
			tokenSquare[2]==gameoverTacTicToe[i][2]
			) {
			backgroundMusic.muted = true;
			clearInterval(interClock);

			if( inNet === true) {
				clearInterval(interMove);
				if (inNetPlayer !== turnPlay) {
					cellMsj.innerHTML = `<b>Atención: </b>Perdiste, lo siento...`;
					console.log(`isTacTicToe(): Ganó el jugador remoto...`);
					gameoverMusic = playSound2('../sounds/gameover.mp3', "0.5");
					setTimeout(stopMusic, 3000);
				}
				else {
					cellMsj.innerHTML = `<b>Atención: </b>Ganaste, felicitaciones!!!`;
					console.log(`isTacTicToe(): ${player1NickName} hizo TaTeTi --- GAME OVER ---`);
					ovationMusic = playSound2('../sounds/aplausos.mp3', "0.5");
					setTimeout(stopMusic, 32000);
					botonConfiClick();
				}
			}
			else {
				cellMsj.innerHTML = `<b>Atención: </b>Ganó ${player1NickName}`;
				console.log(`isTacTicToe(): ${player1NickName} hizo TaTeTi --- GAME OVER ---`);
				ovationMusic = playSound2('../sounds/aplausos.mp3', "0.5");
				setTimeout(stopMusic, 32000);
				botonConfiClick();
			}

			inMenu = true;	// Se pone inMenu en true para deshabilitar las celdas del tablero
			frezzePlay();
			localStorage.setItem('inMenu', 'false');		// evita que luego del location() o una actualización de página se abra el menú de hamburguesa

			// Modificación del botón "Jugar", su texto y su "hover"
			buttonStart.className = "onSuspend";
			let $wrapper = document.querySelector('.onSuspend');
			buttonStart.innerHTML = "Juego Terminado";

			$wrapper.removeEventListener('mouseover', displayTxt1);
			$wrapper.removeEventListener('mouseout', removeTxt1);

			buttonMenu.disabled = true;
			return true;
		}
	}
	return false;
}

////////////////////////
// stopMusic():
// Función callback llamada por el temporizador de festejo seteado por isTacTicToe() 
////////////////////////
function stopMusic() {
//	ovationMusic.muted = true;
	console.log("ovationMusic go on");
//	console.log("ovationMusic muted");

	buttonStart.disabled = false;
/*
	playSound('../sounds/cartoon.wav');
	backgroundMusic.volume = 0.01;
	backgroundMusic.play();
*/
	let $wrapper = document.querySelector('.onSuspend');
	$wrapper.addEventListener('mouseover', displayTxt2);
	$wrapper.addEventListener('mouseout', removeTxt2);
}

const {pathname: rooty} = new URL('.', import.meta.url);
const myDir = (rooty.replaceAll('/', '\\')).substring(1);

function botonAcercaClick() {
	document.getElementById(`botonMenu`).click();	// Simula un click en el menú de hamburguesa para cerrarlo

	let win = window.open("", "", "toolbar=false,scrollbars=false,resizable=0,top=400,left=600,width=300,height=300");
//	let Fondo = "background: url('..\\images\\mosaico.png')";		// No funciona porque no encuentra el archivo
	let Fondo = "background-color:eda1a1";

	console.log( `botonAcercaClick(): myDir = ${myDir}`);

	//	<body style="${Fondo} overflow:hidden">

	let html = 
	`
	<! DOCTYPE html>
	<head>
		<title>Ta-Te-Ti</title>
	</head>
	<body style="${Fondo}">
		<h1 style="color:cian" align=center>Vero Ta-Te-Ti</h1>
		<div align=center>
			<img height=100 width=100 align=center src="..\\images\\logo.png">
		</div>
		<h4 style="color:cian" align=center>@2023 ~ Would you like it?</h4>
	</body>
	</html>
	`;
	win.document.write(html);
}