// EffectShaderRenderer.frag (GLES20 fragment shader)
// 来源: com.mineradio.app.ui.widget.EffectShaderRenderer (Mineradio 2.1.0.0)
// 三层 simplex noise 涟漪 + 色相旋转 + 暗/亮双模式
// uniforms: uResolution, uAnimTime, uMusicLevel, uBeat, uMidFreq, uHighFreq, uColor, uIsDarkMode
// 配套顶点着色器: 全屏三角形, aPosition + aTexCoord

precision highp float;

varying vec2 vTexCoord;

uniform vec2 uResolution;
uniform float uAnimTime;
uniform float uMusicLevel;
uniform float uBeat;
uniform float uMidFreq;
uniform float uHighFreq;
uniform vec4 uColor;
uniform float uIsDarkMode;

vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }

float snoise(vec2 v) {
    const vec4 C = vec4(
        0.211324865405187,
        0.366025403784439,
        -0.577350269189626,
        0.024390243902439
    );
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(
        0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)),
        0.0
    );
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
}

vec3 rgb2hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
    vec2 fragCoord = vTexCoord * uResolution.xy;
    vec2 uv = fragCoord / uResolution.xy;
    vec2 p = uv * 2.0 - 1.0;
    p.x *= uResolution.x / uResolution.y;

    float time = uAnimTime * 0.1;
    float dist = length(p);

    vec2 offset1 = vec2(time * 0.5 * (1.0 + uBeat * 0.3), time * 0.3);
    float n1 = snoise(p * (2.0 + uBeat * 0.3) + offset1);

    vec2 offset2 = vec2(-time * 0.3, time * 0.4 * (1.0 + uMidFreq * 0.2));
    float n2 = snoise(p * (3.0 + uMidFreq * 0.5) + offset2 + vec2(n1 * 0.5));

    vec2 offset3 = vec2(time * 0.4, -time * 0.35);
    float n3 = snoise(p * (4.0 + uHighFreq * 0.7) + offset3 + vec2(n2 * 0.3));

    float ripple =
        n1 * (0.5 + uBeat * 0.12) +
        n2 * (0.3 + uMidFreq * 0.08) +
        n3 * (0.2 + uHighFreq * 0.05);

    float rippleNormalized = (ripple + 1.0) * 0.5;
    float rippleStrength = 0.15 + uMusicLevel * 0.3 + uBeat * 0.15 + uMidFreq * 0.08;

    vec3 hsv = rgb2hsv(uColor.rgb);
    float hueShift =
        (uBeat * 0.06 + uMidFreq * 0.04 + uHighFreq * 0.03) *
        sin(time * 0.5 + dist * 2.0);
    hsv.x = fract(hsv.x + hueShift);
    hsv.y = clamp(hsv.y + uMusicLevel * 0.12, 0.3, 1.0);
    vec3 dynamicColor = hsv2rgb(hsv);

    vec3 col;
    if (uIsDarkMode > 0.5) {
        vec3 darkBg = vec3(0.08, 0.08, 0.08);
        float radialGrad = 1.0 - smoothstep(0.0, 1.2, dist);
        vec3 rippleColor = mix(dynamicColor, uColor.rgb, 0.5);
        col = mix(darkBg, rippleColor, rippleNormalized * rippleStrength);
        float centerGlow = radialGrad * radialGrad;
        col += dynamicColor * centerGlow * (0.15 + uBeat * 0.25);
        float sparkle = pow(max(0.0, n3), 3.0) * uHighFreq;
        col += vec3(1.0, 0.9, 0.8) * sparkle * 0.18;
    } else {
        vec3 lightBg = vec3(0.98, 0.98, 0.98);
        vec3 softColor = mix(lightBg, dynamicColor, 0.6);
        col = mix(lightBg, softColor, rippleNormalized * rippleStrength * 0.65);
        float centerGlow = 1.0 - smoothstep(0.0, 1.0, dist);
        col = mix(col, softColor, centerGlow * (0.1 + uBeat * 0.12));
    }

    gl_FragColor = vec4(col, 1.0);
}
