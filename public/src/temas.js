export * from './temas.js';
import { buttonMenu,wndReload } from './main.js';

/* temas: identificador para el elemento con id="ventantaModal2"
*/
let temas = null;

/* spanTemas: identificador para el elemento con id="close2" 
que hace referencia al elemento <span> que tiene la X que cierra la ventana modal2
*/
let spanTemas = null;

/* idInput: identificador para el elemento con id="idPlayer"
que representa el <input> para ingresar el Nick del jugador
*/
let idInput2 = null;

let temaSelect = "";

function temasAceptar() {
//	let inNetNew = document.querySelector('input[name="playMode"]:checked').value;

	let temaSelectNew = document.getElementById("temaselid").value;

	console.log(`temasAceptar(): Tema = ${temaSelectNew}`);

	spanTemasClick();	// Cierra la ventana modal2 simulando un click en la x
//	document.getElementById(`botonMenu`).click();	// Simula un click en el menú de hamburguesa para cerrarlo

	// Si hay un cambio en el tema seleccionado se reinicia la página (aplicación)
	// para actualizar la información en el server
	if( temaSelect !== temaSelectNew && temaSelectNew != "Autos") {
		let myCookieW = `Tema=${temaSelectNew}; expires=31 Dec 2023 23:59:59 GMT;SameSite=Lax;`;
		document.cookie = myCookieW;	
		temaSelect = temaSelectNew;		// En realidad no haría falta porque ya quedó guardado en las cookies
		wndReload();
	}
}

function temasCancelar() {
	spanTemasClick();	// Cierra la ventana modal simulando un click en la x
//	document.getElementById(`botonMenu`).click();	// Simula un click en el menú de hamburguesa para cerrarlo
}

// Cuando el usuario hace click en el botón, se abre la ventana
export function botonTemasClick() {
	temas.style.display = "block";
	buttonMenu.disabled = true;
}

// Si el usuario hace click en la x, la ventana se cierra
function spanTemasClick() {
	temas.style.display = "none";
	buttonMenu.disabled = false;
	document.getElementById(`botonMenu`).click();	// Simula un click en el menú de hamburguesa para cerrarlo
}


export function initTemas() {
	console.log("--- initTemas() ---");
	temas = document.getElementById("ventanaModal2");
	spanTemas = document.getElementsByClassName("close")[1]; // Hace referencia al elemento <span> que tiene la X que cierra la ventana modal
	
	let spanTemasId = document.getElementById("closeId2");
	spanTemasId.onclick = spanTemasClick;

	const buttonTemasAceptar = document.getElementById("idButton2");
//	idInput2 = document.getElementById("idPlayer2");
	buttonTemasAceptar.addEventListener('click', temasAceptar);

	const buttonTemasCancelar = document.getElementById("idButtonC2");
	buttonTemasCancelar.addEventListener('click', temasCancelar);

	document.getElementById("temaselid").value = temaSelect;

	drawTema();
//	idInput2.value = player1NickName;
	
/*	if( inNet === true) 
		document.getElementById("enred").checked = true;
	else 
		document.getElementById("solo").checked = true;
*/
	window.addEventListener( "click", function(event) {
		if (event.target == temas) {
		  temas.style.display = "none";
		}
	  });
}

export function setTema( value) {
	temaSelect = value;
}

export function getTema() {
	return temaSelect;
}

function drawTema() {
	let titu = null;

	switch (temaSelect) {
		case "Básico":
			console.log("drawTema(): tema seleccionado Básico");
			document.body.className = "body1";
			titu = document.getElementById("titulo");
			titu.className = "titulo1";
			titu.innerText = "Ta-Te-Ti";
			document.getElementById(`columna1`).style.backgroundColor = "#f5f830";
			document.getElementById(`columna2`).style.backgroundColor = "#f8f8e6";
			document.getElementById(`columna3`).style.backgroundColor = "#f5f830";
			document.getElementById(`menuConfig`).className = "menu-text1";
			document.getElementById(`menuConfig`).style = "color: black";
			document.getElementById(`temasConfig`).className = "menu-text1";
			document.getElementById(`temasConfig`).style = "color: black";
			document.getElementById(`acercaConfig`).className = "menu-text1";
			document.getElementById(`acercaConfig`).style = "color: black";
			document.getElementById(`Fila1`).className = "Row1";
			document.getElementById(`Fila2`).className = "Row1";
			document.getElementById(`Fila3`).className = "Row1";
			break;
		case "Merlina":
			console.log("drawTema(): tema seleccionado Merlina");
			document.body.className = "body2";
			titu = document.getElementById("titulo");
			titu.className = "titulo2";
			titu.innerText = "Merlina ¨ Ta~Te~Ti";
			document.getElementById(`columna1`).style.backgroundColor = "#87acfc";
			document.getElementById(`columna2`).style.backgroundColor = "#abaeb4";
			document.getElementById(`columna3`).style.backgroundColor = "#87acfc";
			document.getElementById(`menuConfig`).className = "menu-text2";
			document.getElementById(`menuConfig`).style = "color: white";
			document.getElementById(`temasConfig`).className = "menu-text2";
			document.getElementById(`temasConfig`).style = "color: white";
			document.getElementById(`acercaConfig`).className = "menu-text2";
			document.getElementById(`acercaConfig`).style = "color: white";
			document.getElementById(`Fila1`).className = "Row2";
			document.getElementById(`Fila2`).className = "Row2";
			document.getElementById(`Fila3`).className = "Row2";
			break;
		default:
			console.log("drawTema(): ERROR - tema seleccionado desconocido");
			break;
	}
}