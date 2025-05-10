#version 300 es

precision mediump float;

uniform sampler2D u_texture; // sprite sheet
uniform sampler2D u_scene;
uniform vec2 u_resolution;
uniform int shader;
uniform int sz;

out vec4 fragColor;

vec4 renderNormal(vec2 fragCoord) {
  vec2 uv = fragCoord / u_resolution;
  float targetAspect = 16.0 / 9.0;
  float screenAspect = u_resolution.x / u_resolution.y;

  vec2 texCoord;

  if (screenAspect > targetAspect) {
    float width = targetAspect / screenAspect;
    float xStart = (1.0 - width) * 0.5;
    if (uv.x < xStart || uv.x > xStart + width) {
      return vec4(0.0, 0.0, 0.0, 1.0);
    }
    texCoord = vec2((uv.x - xStart) / width, uv.y);
  } else {
    float height = screenAspect / targetAspect;
    float yStart = (1.0 - height) * 0.5;
    if (uv.y < yStart || uv.y > yStart + height) {
      return vec4(0.0, 0.0, 0.0, 1.0);
    }
    texCoord = vec2(uv.x, (uv.y - yStart) / height);
  }

  return texture(u_scene, texCoord);
}

// Converts a color from linear light gamma to sRGB gamma
vec3 fromLinear(vec3 linearRGB) {
  bvec3 cutoff = lessThan(linearRGB.rgb, vec3(0.0031308));
  vec3 higher = vec3(1.055)*pow(linearRGB.rgb, vec3(1.0/2.4)) - vec3(0.055);
  vec3 lower = linearRGB.rgb * vec3(12.92);

  return mix(higher, lower, cutoff);
}

// Converts a color from sRGB gamma to linear light gamma
vec3 toLinear(vec3 sRGB) {
  bvec3 cutoff = lessThan(sRGB.rgb, vec3(0.04045));
  vec3 higher = pow((sRGB.rgb + vec3(0.055))/vec3(1.055), vec3(2.4));
  vec3 lower = sRGB.rgb/vec3(12.92);

  return mix(higher, lower, cutoff);
}


vec4 renderCRT(vec2 fragCoord) {
  vec2 gameSize = vec2(textureSize(u_scene, 0));
  vec2 spritesheetSize = vec2(textureSize(u_texture, 0));

  vec2 screenSize = gameSize * float(sz);
  vec2 offset = (u_resolution - screenSize) * 0.5;

  if (fragCoord.x < offset.x ||
      fragCoord.x >= offset.x + screenSize.x ||
      fragCoord.y < offset.y ||
      fragCoord.y >= offset.y + screenSize.y) {
    return vec4(0.0, 0.0, 0.0, 1.0);
  }

  vec2 onPixel = fragCoord - offset;
  vec2 pixelPos = floor(onPixel / float(sz));
  vec2 texCoord = (pixelPos + vec2(0.5)) / gameSize;

  float poff = float(sz);

  for(int i = 9; i < sz * 9; i += 9) {
    poff += float(i);
  }

  vec4 col = vec4(0.0);

  int x = 0;
  int y = 0;

  vec2 main_tx = vec2((poff + mod(onPixel.x , float(sz))) / spritesheetSize.x, (float(sz) + 0.5 + mod(onPixel.y, float(sz))) / spritesheetSize.y);

  for(int x = -1; x < 2; ++x) {
    for(int y = -1; y < 2; ++y) {
      vec4 pix = vec4(toLinear(texture(u_scene, texCoord + vec2(x, y) / gameSize).rgb), 1.0);
      pix = clamp(pix, 0.0025, 1.0);

      const float LED1 = 0.120286;
      const float LED2 = 0.329268;

      vec2 tx = main_tx - vec2(x, y) * float(sz) / spritesheetSize;

      col += clamp(pix, 0.0, LED1) / LED1 * texture(u_texture, tx);
      col += clamp(pix - LED1, 0.0, LED2 - LED1) / (LED2 - LED1) * texture(u_texture, tx + vec2(sz, 0.0) * 3.0 / spritesheetSize);
      col += clamp(pix - LED2, 0.0, 1.0 - LED2) / (1.0 - LED2) * texture(u_texture, tx + vec2(sz, 0.0) * 6.0 / spritesheetSize);
    }
  }

  return vec4(fromLinear(col.rgb / 1.0), 1.0);
}

void main() {
  vec2 fragCoord = gl_FragCoord.xy;

  if (shader != 0) {
    fragColor = renderCRT(fragCoord);
  } else {
    fragColor = renderNormal(fragCoord);
  }
}
