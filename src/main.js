let offscreenCanvas = document.getElementById('canvas');
offscreenCanvas.width = window.innerWidth * window.devicePixelRatio;
offscreenCanvas.height = window.innerHeight * window.devicePixelRatio;

offscreenCanvas = offscreenCanvas.transferControlToOffscreen();
let renderThread = new Worker('src/renderWorker.js');
renderThread.postMessage({
  type: 'init',
  canvas: offscreenCanvas
}, [offscreenCanvas]);

renderThread.onmessage = msg => {
  switch (msg.data.type) {
    case 'cursor':
      document.body.style.cursor = msg.data.style;
      break;
    case 'sound':
      if (msg.data.sound < 0) {
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
    width: window.innerWidth * window.devicePixelRatio,
    height: window.innerHeight * window.devicePixelRatio
  });
}


onmousemove = e => {
  renderThread.postMessage({
    type: 'mouseMove',
    x: e.x * window.devicePixelRatio,
    y: e.y * window.devicePixelRatio
  });
}

onclick = e => {
  renderThread.postMessage({
    type: 'click'
  });
}

//check for mobile
function isMobile() {
  let prefixes = ' -webkit- -moz- -o- -ms- '.split(' ');
  let mq = function(query) {
    return window.matchMedia(query).matches;
  }

  if (('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch) {
    return true;
  }
  let query = ['(', prefixes.join('touch-enabled),('), 'heartz', ')'].join('');
  return mq(query);
}

if (isMobile()) {
  renderThread.postMessage({
    type: 'mobile'
  });
}
