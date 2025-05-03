'use strict';
importScripts('ajax.js');
importScripts('assets.js');
importScripts('game.js');
importScripts('sprites.js');

const spriteSlots = 1024;
const spriteDataLength = 7;
const sprites = new Float32Array(spriteSlots * spriteDataLength);
let spriteCount = 0;

const sheetWidth = 495;
const sheetHeight = 84;

const vWidth = 480;
const vHeight = 270;

const backgroundColor = [0.4, 0.3, 0.2, 1];

let canvas, gl, program, programCRT, ready = false;
let unit, sz;

let frag = '';
let vert = '';
let crtFrag = '';
let crtVert = '';

let shader = true;

let spriteTexture;
let spriteVAO, crtVAO, instanceBuffer;

let time_location, shader_location, sz_location;

let crtRenderTexture, crtFramebuffer, fsQuadVBO;

const quadVerts = new Float32Array([
    // a_texCoord  // these map the sprite size
     0, 0,
     1, 0,
     1, 1,
     0, 0,
     1, 1,
     0, 1,
]);

const fullscreenVerts = new Float32Array([
  -1, -1,
   3, -1,
  -1,  3
]);

getFile('pixel_vertex.glsl', r => {
  vert = r;
  initShader();
});

getFile('pixel_fragment.glsl', r => {
  frag = r;
  initShader();
});

getFile('crt_vertex.glsl', r => {
  crtVert = r;
  initShader();
});

getFile('crt_fragment.glsl', r => {
  crtFrag = r;
  initShader();
});

function initShaderCode(program, vertexCode, fragmentCode) {
  // create vertex and fragment shaders
  const vertex = gl.createShader(gl.VERTEX_SHADER);
  const fragment = gl.createShader(gl.FRAGMENT_SHADER);

  // set shader source
  gl.shaderSource(vertex, vertexCode);
  gl.shaderSource(fragment, fragmentCode);

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

  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);

  // check for linker errors
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("error linking program", gl.getProgramInfoLog(program));
    return;
  }
}

function initShader() {
  if (frag === '' || vert === '' || crtFrag === '' || crtVert === '') return;
  if(loaded < 1) return;

  // set background color
  gl.clearColor(...backgroundColor);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  // clear
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  initShaderCode(program, vert, frag);

  initShaderCode(programCRT, crtVert, crtFrag);

  // uniform locations
  const texCoordLoc = gl.getAttribLocation(program, "a_texCoord");
  const offsetLoc = gl.getAttribLocation(program, "a_offset");
  const sizeLoc = gl.getAttribLocation(program, "a_size");
  const sheetOffsetLoc = gl.getAttribLocation(program, "a_sheetOffset");
  const darkenLoc = gl.getAttribLocation(program, "a_darken");

  spriteVAO = gl.createVertexArray();
  gl.bindVertexArray(spriteVAO);

  const quadBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, quadVerts, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(texCoordLoc);
  gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, 0);

  instanceBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, sprites, gl.DYNAMIC_DRAW);

  const stride = spriteDataLength * Float32Array.BYTES_PER_ELEMENT;
  // a_offset (vec2)
  gl.enableVertexAttribArray(offsetLoc);
  gl.vertexAttribPointer(offsetLoc, 2, gl.FLOAT, false, stride, 0);
  gl.vertexAttribDivisor(offsetLoc, 1);
  // a_size (vec2)
  gl.enableVertexAttribArray(sizeLoc);
  gl.vertexAttribPointer(sizeLoc, 2, gl.FLOAT, false, stride, 2 * Float32Array.BYTES_PER_ELEMENT);
  gl.vertexAttribDivisor(sizeLoc, 1);
  // a_sheetOffset (vec2)
  gl.enableVertexAttribArray(sheetOffsetLoc);
  gl.vertexAttribPointer(sheetOffsetLoc, 2, gl.FLOAT, false, stride, 4 * Float32Array.BYTES_PER_ELEMENT);
  gl.vertexAttribDivisor(sheetOffsetLoc, 1);
  // a_darken (float)
  gl.enableVertexAttribArray(darkenLoc);
  gl.vertexAttribPointer(darkenLoc, 1, gl.FLOAT, false, stride, 6 * Float32Array.BYTES_PER_ELEMENT);
  gl.vertexAttribDivisor(darkenLoc, 1);

  crtRenderTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, crtRenderTexture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 480, 270, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  // Create framebuffer and attach texture
  crtFramebuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, crtFramebuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, crtRenderTexture, 0);

  // Unbind
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);


  gl.useProgram(program);

  const u_resolutionLoc = gl.getUniformLocation(program, "u_resolution");

  time_location = gl.getUniformLocation(program, "time");
  sz_location = gl.getUniformLocation(program, "sz");
  shader_location = gl.getUniformLocation(program, "shader");

  const texLoc = gl.getUniformLocation(program, "u_texture");
  gl.uniform1i(texLoc, 0);

  gl.uniform2f(u_resolutionLoc, vWidth, vHeight);

  gl.bindVertexArray(spriteVAO);

  loadAssets();

  crtVAO = gl.createVertexArray();
  gl.bindVertexArray(crtVAO);

  fsQuadVBO = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, fsQuadVBO);
  gl.bufferData(gl.ARRAY_BUFFER, fullscreenVerts, gl.STATIC_DRAW);

  const pos = gl.getAttribLocation(programCRT, "a_position");
  gl.enableVertexAttribArray(pos);
  gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

  render(gl);

  ready = true;
}

let t;

function useCRTShader() {
  gl.useProgram(programCRT);

  // Bind textures
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, crtRenderTexture);
  gl.uniform1i(gl.getUniformLocation(programCRT, "u_scene"), 0);

  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, spriteTexture);
  gl.uniform1i(gl.getUniformLocation(programCRT, "u_texture"), 1);

  // Set uniforms
  gl.uniform2f(gl.getUniformLocation(programCRT, "u_resolution"), gl.canvas.width, gl.canvas.height);

  unit = gl.canvas.width;
  if(gl.canvas.height * 16/9 < unit) unit = gl.canvas.height * 16/9;

  sz = Math.max(1, Math.min(8, Math.floor(unit/vWidth)));

  gl.uniform1i(gl.getUniformLocation(programCRT, "sz"), sz);

  gl.uniform1i(gl.getUniformLocation(programCRT, "shader"), shader);
}

function updateSpriteBuffer() {
  gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, sprites.subarray(0, spriteCount * spriteDataLength));
}

function render(gl) {
  t = performance.now();
  gl.useProgram(program);

  // redner sprites
  gl.bindFramebuffer(gl.FRAMEBUFFER, crtFramebuffer);
  gl.viewport(0, 0, vWidth, vHeight);

  gl.clear(gl.COLOR_BUFFER_BIT);

  updateSpriteBuffer();

  gl.uniform1f(time_location, performance.now());

  // bind VAO
  gl.bindVertexArray(spriteVAO);

  // render
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, spriteTexture);
  gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, spriteCount);

  // apply CRT shader
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clear(gl.COLOR_BUFFER_BIT);

  useCRTShader();

  gl.bindVertexArray(crtVAO);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function canvasLoop() {
  let t = performance.now();

  runGame();

  if(ready) render(gl);
  else if(loaded >= 1) initShader();

  spriteCount = 0;

  requestAnimationFrame(canvasLoop);
}

onmessage = function(msg) {
  const data = msg.data;

  switch(data.type) {
    case 'mouseMove':
      if(shader) {
        mouse.x =  data.x / sz - canvas.width  / 2 / sz + vWidth  / 2;
        mouse.y = -data.y / sz + canvas.height / 2 / sz + vHeight / 2;
      }
      else if(canvas.width > canvas.height * 16/9) {
        mouse.x = (data.x - canvas.width/2 + unit/2) / unit * vWidth;
        mouse.y = vHeight - data.y / (unit*9/16) * vHeight;
      }
      else {
        mouse.x = data.x / unit * vWidth;
        mouse.y = vHeight - (data.y - canvas.height/2 + unit*9/32) / (unit*9/16) * vHeight;
      }
      break;
    case 'click':
      clicked = true;
      break;
    case 'init':
    canvas = data.canvas;

    gl = canvas.getContext('webgl2');

    program = gl.createProgram();

    programCRT = gl.createProgram();

    canvasLoop();
    break;
    case 'resize':
      canvas.width = data.width;
      canvas.height = data.height;
    break;
  }
}
