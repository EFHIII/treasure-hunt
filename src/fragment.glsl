#version 300 es

precision mediump float;
precision mediump int;

uniform vec2 resolution;

uniform float time;

uniform int sz;

uniform bool shader;

out vec4 fragColor;

#define numTextures 1

uniform sampler2D u_textures[numTextures];
uniform highp usampler2D u_spriteData;

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
  if(all(lessThan(uv, location + size)) && all(greaterThan(uv, location))) {
    ivec2 texSize = textureSize(u_textures[0], 0);
    vec2 spritePixel = uv - location;
    spritePixel.y = size.y - spritePixel.y;
    vec2 spriteUV = (spritePixel + spriteLocation) / vec2(texSize);
    color = texture(u_textures[0], spriteUV);
  }
  return color;
}

vec4 getPixel(in vec2 pixel) {
  vec4 col = vec4(0.4,0.3,0.2,1.0);

  const int size = 1024;

  int atI = 0;

  while(atI < size) {
    uvec4 colv = texelFetch(u_spriteData, ivec2(atI, 0), 0);

    uint sprite = colv.r + (colv.g << 8);

    if(sprite-- < 1u) {
      break;
    }

    //vec4 txt2 = drawSprite(pixel, vec2(float(colv.b)-240.0-127.0, 0.0), vec2(45.0, 24.0), vec2(45.0, 60.0));
    //if(txt2.a > 0.0) col = txt2;

    uvec2 uv = uvec2(colv.b + (colv.a << 8), 0);
    atI++;

    colv = texelFetch(u_spriteData, ivec2(atI, 0), 0);

    uv.y += colv.r + (colv.g << 8);

    vec4 txt = drawSprite(pixel, vec2(uv) - vec2(240.0, 135.0) - vec2(1024.0), vec2(45.0 * float(sprite), 24.0), vec2(45.0, 60.0));
    if(txt.a > 0.0) {
      col = txt;
      if(colv.b > 0u) {
        if(colv.b < 11u) {
          vec4 txt = drawSprite(pixel, vec2(uv) - vec2(240.0, 135.0) - vec2(1024.0), vec2(7.0 * float(colv.b) + 317.0, 0.0), vec2(7.0, 10.0));
          if(txt.a > 0.0) col = txt;
        }
        else {
          vec4 txt = drawSprite(pixel, vec2(uv) - vec2(240.0, 135.0) - vec2(1024.0), vec2(7.0 * float((colv.b)/10u) + 324.0, 0.0), vec2(7.0, 10.0));
          if(txt.a > 0.0) col = txt;
          txt = drawSprite(pixel, vec2(uv) - vec2(233.0, 135.0) - vec2(1024.0), vec2(7.0 * float((colv.b) % 10u) + 317.0, 0.0), vec2(7.0, 10.0));
          if(txt.a > 0.0) col = txt;
        }
      }
      if(colv.a < 1u) {
        col *= 0.8;
      }
    }

    atI++;
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

  fragColor = vec4(fromLinear(ans), 1.0);
}
