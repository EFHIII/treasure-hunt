#version 300 es

precision mediump float;

uniform vec2 resolution;

uniform float time;

uniform int sz;

uniform bool shader;

out vec4 fragColor;

#define numTextures 1

uniform sampler2D u_textures[numTextures];

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

vec4 drawSprite(vec2 uv, vec2 location, vec2 spriteLocation, vec2 size) {
  vec4 color = vec4(0.0);
  if (all(lessThan(uv, location + size)) && all(greaterThan(uv, location))) {
    ivec2 texSize = textureSize(u_textures[0], 0);
    vec2 spritePixel = uv - location;
    spritePixel.y = size.y - spritePixel.y;
    vec2 spriteUV = (spritePixel + spriteLocation) / vec2(texSize);
    color = texture(u_textures[0], spriteUV);
  }
  return color;
}

vec4 getPixel(in vec2 pixel) {
  vec4 col = vec4(0.3,0.6,0.9,1.0);

  for(float y = 0.0; y < 3.0; y++) {
    for(float x = 0.0; x < 4.0; x++) {
      vec4 txt = drawSprite(pixel, vec2(-100.0+50.0*x,70.0-65.0*y), vec2(0.0, 24.0), vec2(45.0, 60.0));
      if(txt.a > 0.0) col = txt;
    }

    vec2 uv = pixel;
    vec2 location = vec2(-100.0,70.0);
    vec2 spriteLocation = vec2(0.0, 24.0);
    vec2 size = vec2(45.0, 60);

    if(all(lessThan(uv, location + size)) && all(greaterThanEqual(uv, location))) {
      //col = vec4(0.0);
    }
  }

  return vec4(toLinear(col.rgb), col.a);
}

void main() {
  // float x = gl_FragCoord.x / resolution.x;
  // float y = gl_FragCoord.y / resolution.y;
  vec2 st = gl_FragCoord.xy + vec2(-resolution.x*0.5, -resolution.y*0.5);

  float AR = resolution.x / resolution.y;
  float unit = 0.0;

  if(AR > 16.0/9.0) {
    st /= resolution.y;
    unit = resolution.y;
    if(st.x < -8.0/9.0 || st.x > 8.0/9.0) return;
  }
  else {
    st /= resolution.x * 9.0/16.0;
    unit = resolution.x * 9.0/16.0;
    if(st.y < -0.5 || st.y > 0.5) return;
  }

  st *= 270.0;


  vec2 pixel = floor(st);

  vec3 ans = vec3(0.0, 0.0, 0.0);

  if(shader) {
    vec2 at = vec2(pixel.x - 1.0, pixel.y - 1.0);

  }
  else {
    ans = getPixel(pixel + vec2(0.5)).rgb;
  }

  //for(; at.x < pixel.x + 2.0; at.x++) {
  //  for(at.y = pixel.y - 1.0; at.y < pixel.y + 2.0; at.y++) {
  //    vec4 col = getPixel(at);

      //ans += col.rgb / 9.0;

      //ans.x += 0.03;

      //ans.x +=
      //  col1.x * clamp(col.x, 0.0, 0.120286) / 0.120286 +
      //  col2.x * clamp(col.x-0.120286, 0.0, 0.329268-0.120286) / (0.329268 - 0.120286) +
      //  col3.x * clamp(col.x-0.329268, 0.0, 0.1-0.329268) / (1.0 - 0.329268);

      //ans.y +=
      //  col1.y * clamp(col.y, 0.0, 0.120286) / 0.120286 +
      //  col2.y * clamp(col.y-0.120286, 0.0, 0.329268-0.120286) / (0.329268 - 0.120286) +
      //  col3.y * clamp(col.y-0.329268, 0.0, 0.1-0.329268) / (1.0 - 0.329268);

      //ans.z +=
      //  col1.z * clamp(col.z, 0.0, 0.120286) / 0.120286 +
      //  col2.z * clamp(col.z-0.120286, 0.0, 0.329268-0.120286) / (0.329268 - 0.120286) +
      //  col3.z * clamp(col.z-0.329268, 0.0, 0.1-0.329268) / (1.0 - 0.329268);

      //ans.x += valRA + valRB + valRC;

      //ans.x += valRA * clamp(col.x, 0.0, 0.120286) / 0.120286;
      //ans.x += (valRB) * clamp(col.x - 0.120286, 0.0, 0.23887) / 0.23887;
      //ans.x += (valRC) * clamp(col.x - 0.359156, 0.0, 0.6408437) / 0.6408437;

      //ans.y += valGA * clamp(col.y, 0.0, 0.120286) / 0.120286;
      //ans.y += (valGB - valGA) * clamp(col.y - 0.120286, 0.0, 0.23887) / 0.23887;
      //ans.y += (valGC - valGB) * clamp(col.y - 0.359156, 0.0, 0.6408437) / 0.6408437;

      //ans.z += valBA * clamp(col.z, 0.0, 0.120286) / 0.120286;
      //ans.z += (valBB - valBA) * clamp(col.z - 0.120286, 0.0, 0.23887) / 0.23887;
      //ans.z += (valBC - valBB) * clamp(col.z - 0.359156, 0.0, 0.6408437) / 0.6408437;
  //  }
  //}

  //float v = st.x/10.0 + 0.15;
  //vec3(v, v, v);

  fragColor = vec4((ans), 1.0);
}
