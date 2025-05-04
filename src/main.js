let offscreenCanvas = document.getElementById('canvas');
offscreenCanvas.width = window.innerWidth;
offscreenCanvas.height = window.innerHeight;

offscreenCanvas = offscreenCanvas.transferControlToOffscreen();
let renderThread = new Worker('src/renderWorker.js');
renderThread.postMessage({
  type: 'init',
  canvas: offscreenCanvas
}, [offscreenCanvas]);

renderThread.onmessage = msg => {
  switch(msg.data.type) {
    case 'cursor':
      document.body.style.cursor = msg.data.style;
      break;
    case 'sound':
      if(msg.data.sound < 0) {
        toggleSound();
        return;
      }
      sounds[msg.data.sound].rate(1 + Math.random() * 0.1);
      sounds[msg.data.sound].play();
      break;
    case 'fullscreen':
      document.fullscreenElement ? document.exitFullscreen() : document.body.requestFullscreen();
      break;
    case 'discord':
      window.open("https://discord.com/invite/ARHq4BbyjY", "_blank");
      break;
  }
};

//event listeners
window.onresize = () => {
  renderThread.postMessage({
    type: 'resize',
    width: window.innerWidth,
    height: window.innerHeight
  });
}


onmousemove = e => {
  renderThread.postMessage({
    type: 'mouseMove',
    x: e.x,
    y: e.y
  });
}

onclick = e => {
  renderThread.postMessage({
    type: 'click'
  });
}
