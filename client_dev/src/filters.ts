import { Filter, GlProgram } from 'pixi.js';

const vertex = `
  in vec2 aPosition;
  out vec2 vTextureCoord;
  out vec2 vResolution;

  uniform vec4 uInputSize;
  uniform vec4 uOutputFrame;
  uniform vec4 uOutputTexture;

  vec4 filterVertexPosition( void )
  {
      vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
      position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
      position.y = position.y * (2.0*uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;
      return vec4(position, 0.0, 1.0);
  }

  vec2 filterTextureCoord( void )
  {
      return aPosition * (uOutputFrame.zw * uInputSize.zw);
  }

  void main(void)
  {
      gl_Position = filterVertexPosition();
      vTextureCoord = filterTextureCoord();
      vResolution = uInputSize.xy;
  }
`;

const fragment = `
  precision highp float;
  
  in vec2 vTextureCoord;
  in vec2 vResolution;
  
  uniform sampler2D uTexture;
  uniform float uThreshold;
  uniform float uStrength;
  uniform float uSubpixelQuality;
  
  // FXAA helper functions
  float rgb2luma(vec3 rgb) {
    return dot(rgb, vec3(0.299, 0.587, 0.114));
  }
  
  vec4 fxaa(sampler2D tex, vec2 fragCoord, vec2 resolution) {
    vec2 inverseResolution = 1.0 / resolution;
    
    // Sample the texture and its neighbors
    vec3 rgbNW = texture(tex, fragCoord + vec2(-1.0, -1.0) * inverseResolution).rgb;
    vec3 rgbNE = texture(tex, fragCoord + vec2(1.0, -1.0) * inverseResolution).rgb;
    vec3 rgbSW = texture(tex, fragCoord + vec2(-1.0, 1.0) * inverseResolution).rgb;
    vec3 rgbSE = texture(tex, fragCoord + vec2(1.0, 1.0) * inverseResolution).rgb;
    vec4 rgbaM = texture(tex, fragCoord);
    vec3 rgbM = rgbaM.rgb;
    float alphaM = rgbaM.a;
    
    // Convert to luma for edge detection
    float lumaNW = rgb2luma(rgbNW);
    float lumaNE = rgb2luma(rgbNE);
    float lumaSW = rgb2luma(rgbSW);
    float lumaSE = rgb2luma(rgbSE);
    float lumaM = rgb2luma(rgbM);
    
    // Find min and max luma
    float lumaMin = min(lumaM, min(min(lumaNW, lumaNE), min(lumaSW, lumaSE)));
    float lumaMax = max(lumaM, max(max(lumaNW, lumaNE), max(lumaSW, lumaSE)));
    
    // Calculate luma range
    float lumaRange = lumaMax - lumaMin;
    
    // If the luma range is low, we're not on an edge - return original color
    if (lumaRange < max(uThreshold, lumaMax * 0.125)) {
      return rgbaM;
    }
    
    // Sample additional neighbors for better quality
    vec3 rgbN = texture(tex, fragCoord + vec2(0.0, -1.0) * inverseResolution).rgb;
    vec3 rgbS = texture(tex, fragCoord + vec2(0.0, 1.0) * inverseResolution).rgb;
    vec3 rgbE = texture(tex, fragCoord + vec2(1.0, 0.0) * inverseResolution).rgb;
    vec3 rgbW = texture(tex, fragCoord + vec2(-1.0, 0.0) * inverseResolution).rgb;
    
    float lumaN = rgb2luma(rgbN);
    float lumaS = rgb2luma(rgbS);
    float lumaE = rgb2luma(rgbE);
    float lumaW = rgb2luma(rgbW);
    
    // Detect horizontal and vertical edges
    float edgeHorz = abs(lumaN + lumaS - 2.0 * lumaM) * 2.0 +
                     abs(lumaNE + lumaSE - 2.0 * lumaE) +
                     abs(lumaNW + lumaSW - 2.0 * lumaW);
                     
    float edgeVert = abs(lumaE + lumaW - 2.0 * lumaM) * 2.0 +
                     abs(lumaNW + lumaNE - 2.0 * lumaN) +
                     abs(lumaSW + lumaSE - 2.0 * lumaS);
    
    // Determine if edge is horizontal or vertical
    bool isHorizontal = edgeHorz >= edgeVert;
    
    // Choose edge direction
    float luma1 = isHorizontal ? lumaS : lumaE;
    float luma2 = isHorizontal ? lumaN : lumaW;
    float gradient1 = abs(luma1 - lumaM);
    float gradient2 = abs(luma2 - lumaM);
    
    // Choose gradient direction
    bool is1Steepest = gradient1 >= gradient2;
    
    // Calculate gradients in the chosen direction
    float gradientScaled = 0.25 * max(gradient1, gradient2);
    
    // Choose step size based on edge orientation
    float stepLength = isHorizontal ? inverseResolution.y : inverseResolution.x;
    
    float lumaLocalAverage = 0.0;
    if (is1Steepest) {
      stepLength = -stepLength;
      lumaLocalAverage = 0.5 * (luma1 + lumaM);
    } else {
      lumaLocalAverage = 0.5 * (luma2 + lumaM);
    }
    
    // Shift UV in the correct direction
    vec2 currentUv = fragCoord;
    if (isHorizontal) {
      currentUv.y += stepLength * uSubpixelQuality;
    } else {
      currentUv.x += stepLength * uSubpixelQuality;
    }
    
    // Compute offset
    vec2 offset = isHorizontal ? vec2(inverseResolution.x, 0.0) : vec2(0.0, inverseResolution.y);
    
    // Search along the edge
    vec2 uv1 = currentUv - offset;
    vec2 uv2 = currentUv + offset;
    
    float lumaEnd1 = rgb2luma(texture(tex, uv1).rgb);
    float lumaEnd2 = rgb2luma(texture(tex, uv2).rgb);
    lumaEnd1 -= lumaLocalAverage;
    lumaEnd2 -= lumaLocalAverage;
    
    bool reached1 = abs(lumaEnd1) >= gradientScaled;
    bool reached2 = abs(lumaEnd2) >= gradientScaled;
    bool reachedBoth = reached1 && reached2;
    
    if (!reached1) {
      uv1 -= offset;
    }
    if (!reached2) {
      uv2 += offset;
    }
    
    // Calculate final UV offset
    float distance1 = isHorizontal ? (fragCoord.x - uv1.x) : (fragCoord.y - uv1.y);
    float distance2 = isHorizontal ? (uv2.x - fragCoord.x) : (uv2.y - fragCoord.y);
    
    bool isDirection1 = distance1 < distance2;
    float distanceFinal = min(distance1, distance2);
    
    float edgeThickness = (distance1 + distance2);
    
    float pixelOffset = -distanceFinal / edgeThickness + 0.5;
    
    bool isLumaCenterSmaller = lumaM < lumaLocalAverage;
    bool correctVariation = ((isDirection1 ? lumaEnd1 : lumaEnd2) < 0.0) != isLumaCenterSmaller;
    
    float finalOffset = correctVariation ? pixelOffset : 0.0;
    
    // Apply subpixel AA
    float lumaAverage = (1.0 / 12.0) * (2.0 * (lumaN + lumaE + lumaS + lumaW) + lumaNW + lumaNE + lumaSW + lumaSE);
    float subPixelOffset1 = clamp(abs(lumaAverage - lumaM) / lumaRange, 0.0, 1.0);
    float subPixelOffset2 = (-2.0 * subPixelOffset1 + 3.0) * subPixelOffset1 * subPixelOffset1;
    float subPixelOffsetFinal = subPixelOffset2 * subPixelOffset2 * uSubpixelQuality;
    
    finalOffset = max(finalOffset, subPixelOffsetFinal);
    
    // Calculate final UV
    vec2 finalUv = fragCoord;
    if (isHorizontal) {
      finalUv.y += finalOffset * stepLength * uStrength;
    } else {
      finalUv.x += finalOffset * stepLength * uStrength;
    }
    
    // Sample with anti-aliased UV
    vec4 finalColor = texture(tex, finalUv);
    
    // Preserve alpha from original sample for proper edge handling
    finalColor.a = alphaM;
    
    return finalColor;
  }
  
  void main(void) {
    // Apply FXAA anti-aliasing
    vec4 color = fxaa(uTexture, vTextureCoord, vResolution);
    
    // Additional alpha edge smoothing for sprites
    vec2 texelSize = 1.0 / vResolution;
    
    // Sample alpha values around current pixel for edge detection
    float alpha = color.a;
    float alphaN = texture(uTexture, vTextureCoord + vec2(0.0, -texelSize.y)).a;
    float alphaS = texture(uTexture, vTextureCoord + vec2(0.0, texelSize.y)).a;
    float alphaE = texture(uTexture, vTextureCoord + vec2(texelSize.x, 0.0)).a;
    float alphaW = texture(uTexture, vTextureCoord + vec2(-texelSize.x, 0.0)).a;
    
    // Smooth alpha edges
    float alphaGradient = abs(alphaN - alpha) + abs(alphaS - alpha) + 
                         abs(alphaE - alpha) + abs(alphaW - alpha);
    
    if (alphaGradient > 0.01) {
      // Apply subtle smoothing to alpha channel at edges
      float smoothedAlpha = (alpha * 4.0 + alphaN + alphaS + alphaE + alphaW) / 8.0;
      color.a = mix(alpha, smoothedAlpha, uStrength * 0.5);
    }
    
    gl_FragColor = color;
  }
`;

export const edgeSmoothFilter = new Filter({
  glProgram: new GlProgram({
    fragment,
    vertex,
  }),
  resources: {
    edgeSmoothUniforms: {
      uThreshold: { value: 0.0078125, type: 'f32' }, // Edge detection threshold
      uStrength: { value: 1.0, type: 'f32' },        // AA strength (0-1)
      uSubpixelQuality: { value: 0.75, type: 'f32' }, // Subpixel quality (0-1)
    },
  },
});