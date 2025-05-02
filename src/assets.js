let loaded = 0;

getImage('../assets/sprites.png', loadSprite);

let spriteImage;

// load assets
function loadSprite(img) {
  spriteImage = img;
  loaded++;
}

function loadAssets() {
  if(loaded < 1) return;
  loaded = -1;

  gl.activeTexture(gl.TEXTURE0);
  spriteTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, spriteTexture);

  // set texture settings
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  // upload to the GPU
  gl.texImage2D(
    gl.TEXTURE_2D, 0, gl.RGBA,
    gl.RGBA, gl.UNSIGNED_BYTE,
    spriteImage
  );
};
