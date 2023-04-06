export * from './modal.js';
import { buttonMenu,wndReload } from './main.js';

/* modal: identificador para el elemento con id="ventantaModal"
*/
let modal = null;

/* spanModal: identificador para el elemento con id="close" 
que hace referencia al elemento <span> que tiene la X que cierra la ventana modal
*/
let spanModal = null;

/* idInput: identificador para el elemento con id="idPlayer"
que representa el <input> para ingresar el Nick del jugador
*/
let idInput = null;

/* player1NickName: variable de tipo string destinada a guardar el nombre
que un usuario desea asignarle a su "Jugador 1"
*/
export let player1NickName = "Jugador 1";

/* inNet: variable que indica si el jugador está jugando en red.
Se modifica desde la Ventana Modal de configuración y se lee desde:
- sock.js función sendMsg()
true: está jugando en red
false: está jugando standalone
*/
export let inNet = false;

// Funciones implementadas porque en el resto de los módulos las variables
// player1NickName e inNet son read-only

export function setNickName( nombre) {
	player1NickName = nombre;
}

export function setInNet( valor) {
	inNet = valor;
}

function playerConfigModalAceptar() {
	player1NickName = idInput.value;
	let inNetNew = document.querySelector('input[name="playMode"]:checked').value;

	let myCookieW = `Nick1=${player1NickName}; expires=31 Dec 2023 23:59:59 GMT;SameSite=Lax;`;
	document.cookie = myCookieW;
	myCookieW = `Red=${inNetNew}; expires=31 Dec 2023 23:59:59 GMT;SameSite=Lax;`;
	document.cookie = myCookieW;

	document.getElementById(`pj1`).innerHTML = `<h3>${player1NickName}</h3>`;

	console.log(`playerConfigModalAceptar(): Jugador = ${player1NickName}, Modo de Juego = ${inNetNew}`);

	spanModalClick();	// Cierra la ventana modal simulando un click en la x
//	document.getElementById(`botonMenu`).click();	// Simula un click en el menú de hamburguesa para cerrarlo

	// Si hay un cambio en la modalidad de juego en red se reinicia la página (aplicación)
	// para actualizar la información en el server
	if( inNet !== inNetNew) {
		inNet = inNetNew;		// En realidad no haría falta porque ya quedó guardado en las cookies
		wndReload();
	}
}

function playerConfigModalCancelar() {
	spanModalClick();	// Cierra la ventana modal simulando un click en la x
//	document.getElementById(`botonMenu`).click();	// Simula un click en el menú de hamburguesa para cerrarlo
}

// Cuando el usuario hace click en el botón, se abre la ventana
export function botonModalClick() {
//	pararConfetti();
	idInput.value = player1NickName;
	modal.style.display = "block";
	buttonMenu.disabled = true;
}

// Si el usuario hace click en la x, la ventana se cierra
function spanModalClick() {
	modal.style.display = "none";
	buttonMenu.disabled = false;
	document.getElementById(`botonMenu`).click();	// Simula un click en el menú de hamburguesa para cerrarlo
}


export function initModal() {
	console.log("--- initModal() ---");
	modal = document.getElementById("ventanaModal");
	spanModal = document.getElementsByClassName("close")[0]; // Hace referencia al elemento <span> que tiene la X que cierra la ventana modal
	
	let spanModalId = document.getElementById("closeId");
	spanModalId.onclick = spanModalClick;

	const buttonModalAceptar = document.getElementById("idButton");
	idInput = document.getElementById("idPlayer");
	buttonModalAceptar.addEventListener('click', playerConfigModalAceptar);

	const buttonModalCancelar = document.getElementById("idButtonC");
	buttonModalCancelar.addEventListener('click', playerConfigModalCancelar);

	idInput.value = player1NickName;
	
	if( inNet === true) 
		document.getElementById("enred").checked = true;
	else 
		document.getElementById("solo").checked = true;

	window.addEventListener( "click", function(event) {
		if (event.target == modal) {
		  modal.style.display = "none";
		}
	  });
}
