'use strict';
importScripts('ajax.js');
importScripts('assets.js');

let canvas, gl, program, ready = false;

let frag = '';
let vert = '';

let shader = false;

let vertex, fragment, pos_attr_location, res_location, time_location, shader_location, sz_location, texture_location, pos_buffer;

let colorIL;

const LED1 = 0.120286;
const LED2 = 0.329268;
const LED3 = 1;

getFile('vertex.glsl', r => {
  vert = r;
  initShader();
});

getFile('fragment.glsl', r => {
  frag = r;
  initShader();
});

function initShader() {
  if (frag === '' || vert === '') return;
  if(loaded < toLoad) return;

  // set clear color of webgl, params: (r, g, b, a)
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // clear
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // create vertex and fragment shader
  vertex = gl.createShader(gl.VERTEX_SHADER);
  fragment = gl.createShader(gl.FRAGMENT_SHADER);

  // set shader source (shader to assign to, source code to assign)
  gl.shaderSource(vertex, vert);
  gl.shaderSource(fragment, frag);

  // compile shaders
  gl.compileShader(vertex);
  gl.compileShader(fragment);

  // check for shader compilation errors
  if (!gl.getShaderParameter(vertex, gl.COMPILE_STATUS)) {
    console.error("error compiling vertex shader", gl.getShaderInfoLog(vertex));
    return;
  }
  if (!gl.getShaderParameter(fragment, gl.COMPILE_STATUS)) {
    console.error("error compiling fragment shader", gl.getShaderInfoLog(fragment));
    return;
  }

  // create program and combine shaders, then link program
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);

  // check for linker errors
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("error linking program", gl.getProgramInfoLog(program));
    return;
  }

  // validate program; remove from final builds
  gl.validateProgram(program);
  if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
    console.error("error validating program", gl.getProgramInfoLog(fragment));
    return;
  }

  // attribute location(s)
  pos_attr_location = gl.getAttribLocation(program, "a_position");

  // uniform location(s)
  res_location = gl.getUniformLocation(program, "resolution");
  time_location = gl.getUniformLocation(program, "time");
  sz_location = gl.getUniformLocation(program, "sz");
  shader_location = gl.getUniformLocation(program, "shader");

  // handle position buffer
  pos_buffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, pos_buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);

  ready = true;

  loadAssets();

  render(gl);
}

let t;

function render(gl) {
  //console.log(1000/(performance.now() - t));
  t = performance.now();

  // set viewport size
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  // set uniform values
  gl.uniform2f(res_location, gl.canvas.width, gl.canvas.height);
  gl.uniform1f(time_location, performance.now());

  let unit = gl.canvas.width;
  if(gl.canvas.height * 16/9 < unit) unit = gl.canvas.height * 16/9;

  let sz = Math.max(1, Math.min(8, Math.floor(unit/480)));

  gl.uniform1f(sz_location, sz);

  gl.uniform1i(sz_location, shader);

  // render
  gl.drawArrays(gl.TRIANGLES, 0, 6);
};


function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function canvasLoop() {
  let t = performance.now();

  if(ready) render(gl);
  else if(loaded >= toLoad) initShader();

  requestAnimationFrame(canvasLoop);
}

/*
TODO: delete?
let channel = new MessageChannel();
channel.port1.onmessage = function() {
  canvasLoop();
}
*/

onmessage = function(msg) {
  const data = msg.data;

  switch(data.type) {
    case 'init':
    canvas = data.canvas;

    gl = canvas.getContext('webgl2');

    program = gl.createProgram();

    canvasLoop();
    break;
    case 'resize':
      canvas.width = data.width;
      canvas.height = data.height;
    break;
  }
}
