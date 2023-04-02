let myCanvas = document.createElement('canvas');
document.body.appendChild(myCanvas);

let myConfetti = null;
let firstTime = true;

export function initConfetti() {
  myConfetti = confetti.create(myCanvas, {
    resize: true,
    useWorker: true
  });
//	botonConfiClick();
}

function playConfites() {
  myConfetti({
    particleCount: 1000,
    startVelocity: 30,
    spread: 360,
    shapes: ['star'],
/*    length: 2,*/
    origin: {
      x: Math.random(),
      // since they fall down, start a bit higher than random
      y: Math.random() - 0.2
    }
  });
/*
  if( firstTime == true) {
    firstTime = false;
    return;
  }*/
  confetti();
}

export function botonConfiClick() {

  for( let i=0; i<10; i++) {
//    console.log(`paso ${i}`);
    setTimeout( playConfites, 3000*(i+1));
//    playConfites();
  }
//  console.log("paso");
  playConfites();

}