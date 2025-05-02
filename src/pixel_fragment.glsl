#version 300 es

precision mediump float;
precision mediump int;

uniform sampler2D u_texture;

in vec2 v_texCoord;
in vec2 v_sheetOffset;
in vec2 v_size;
in float v_darken;

out vec4 fragColor;

void main() {
  vec4 color = texture(u_texture, (v_sheetOffset + v_texCoord * v_size) / vec2(textureSize(u_texture, 0)));

  if (v_darken > 0.5) {
      color.rgb *= 0.8;
  }

  fragColor = color;
}
