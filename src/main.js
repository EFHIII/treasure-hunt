const LED1 = 0.120286;
const LED2 = 0.329268;
const LED3 = 1;

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
  }

/*
  console.log(msg.data.hasOwnProperty('width'), msg.data.width);

  if(msg.data.hasOwnProperty('width')) {
    const {width, height, data, name} = msg.data;
    const imageData = new ImageData(new Uint8ClampedArray(data), width, height);

    const can = document.createElement('canvas');
    can.width = width;
    can.height = height;
    const ctx = can.getContext('2d');
    ctx.putImageData(imageData, 0, 0);
    can.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name+'.png';
      a.click();

      URL.revokeObjectURL(url)
    }, 'image/png');
    return;
  }

  console.log(`Render Thread:`);
  console.log(msg.data);
  */
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
