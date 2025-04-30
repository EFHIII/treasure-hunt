let loaded = 0;
let toLoad = 0;

getImage('assets/sprites.png', loadAsset(toLoad++));
console.log(`${toLoad} asset${toLoad===1?'':'s'} loading...`);

const assetImages = [];

const assetTextures = [];

const patternTemplates = [];

// load assets
function loadAsset(index) {
  return (img) => {
    assetImages[index] = img;
    if(index < 3) {
      patternTemplates[index] = img;
    }
    loaded++;
  }
}

function loadAssets() {
  if(loaded < toLoad) return;
  loaded = -1;

  gl.enableVertexAttribArray(pos_attr_location);
  gl.bindBuffer(gl.ARRAY_BUFFER, pos_buffer);
  gl.vertexAttribPointer(pos_attr_location, 2, gl.FLOAT, false, 0, 0);

  gl.uniform1iv(texture_location, [1]);

  //initShader();

  for(let i = 0; i < toLoad; i++) {
    gl.activeTexture(gl.TEXTURE0 + i + 1);
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // set texture settings
    //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    // upload to the GPU
    gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.RGBA,
      gl.RGBA, gl.UNSIGNED_BYTE,
      assetImages[i]
    );

    assetTextures.push(texture);
  }
};
