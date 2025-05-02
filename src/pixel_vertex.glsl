#version 300 es
precision mediump float;

in vec2 a_texCoord;
in vec2 a_offset;
in vec2 a_size;
in vec2 a_sheetOffset;
in float a_darken;

uniform vec2 u_resolution;

out vec2 v_texCoord;
out vec2 v_sheetOffset;
out vec2 v_size;
out float v_darken;

void main() {
    vec2 pixelPos = a_offset + a_texCoord * a_size;

    vec2 clipSpace = pixelPos / u_resolution * 2.0 - 1.0;

    gl_Position = vec4(clipSpace, 0, 1);

    v_texCoord = a_texCoord * vec2(1.0, -1.0);
    v_sheetOffset = a_sheetOffset;
    v_size = a_size;
    v_darken = a_darken;
}
