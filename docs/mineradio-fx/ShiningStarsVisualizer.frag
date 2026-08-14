// ShiningStarsVisualizer.frag (AGSL RuntimeShader)
// 来源: com.mineradio.app.ui.widget.ShiningStarsVisualizerKt (Mineradio 2.1.0.0)
// 闪烁星云: 4层分形迭代, 每层取不同频段驱动空间扭曲/波纹/辉光
// uniforms: u_time, u_resolution, u_baseColor, u_volume, u_bands0-3 (16频段, 从31中采样)
uniform float u_time;
uniform float2 u_resolution;
uniform float3 u_baseColor;
uniform float u_volume;
// 4 个 vec4 携带 16 个代表性频段(从 31 中均匀采样)
uniform float4 u_bands0;
uniform float4 u_bands1;
uniform float4 u_bands2;
uniform float4 u_bands3;

// ---------- 工具函数 ----------

half3 palette(float t, half3 base) {
    half3 a = half3(0.5);
    half3 b = half3(0.5) * base / max(max(base.r, base.g), base.b + 0.01);
    half3 c = half3(1.0);
    half3 d = half3(0.263, 0.416, 0.557);
    return a + b * cos(6.28318 * (c * t + d));
}

float2 rotate(float2 uv, float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return float2(uv.x * c - uv.y * s, uv.x * s + uv.y * c);
}

// 按索引从 4 个 vec4 中取值 (idx 0-15)
float sampleBands(float fi) {
    float4 b0 = u_bands0;
    float4 b1 = u_bands1;
    float4 b2 = u_bands2;
    float4 b3 = u_bands3;
    // 用 step 实现无分支选择
    float s = clamp(fi, 0.0, 15.0);
    // 选择所在的 vec4 组
    float g = floor(s / 4.0);          // 0,1,2,3
    float l = s - g * 4.0;             // 组内偏移 0-3
    float4 v = mix(mix(b0, b1, step(1.0, g)),
                   mix(b2, b3, step(3.0, g)),
                   step(2.0, g));
    // 组内分量选择
    return mix(mix(v.x, v.y, step(1.0, l)),
               mix(v.z, v.w, step(3.0, l)),
               step(2.0, l));
}

// 获取某个归一化频率处的强度(0-1 线性插值)
float getBand(float freq) {
    float idx = clamp(freq, 0.0, 1.0) * 15.0;
    float fi = floor(idx);
    float frac = idx - fi;
    return mix(sampleBands(fi), sampleBands(min(fi + 1.0, 15.0)), frac);
}

// ---------- 主渲染 ----------

half4 main(float2 fragCoord) {
    float2 uv = (fragCoord * 2.0 - u_resolution.xy) / u_resolution.y;

    // 缓慢旋转,音频增大时加速
    float rotSpeed = 0.15 + u_volume * 0.015;
    uv = rotate(uv, u_time * rotSpeed);

    float2 uv0 = uv;
    half3 finalColor = half3(0.0);
    half3 base = half3(u_baseColor);

    // 4 层分形迭代
    for (float i = 0.0; i < 4.0; i++) {
        // 每层取不同频段的音频响应
        float freq = (i + 0.5) / 4.0;
        float bandVal = getBand(freq);

        // 空间扭曲强度受音频驱动
        float warp = 1.5 + bandVal * 0.3;
        uv = fract(uv * warp) - 0.5;

        float d = length(uv) * exp(-length(uv0));

        // 颜色:palette 随径向距离和时间变化,融入封面色
        half3 col = palette(length(uv0) + i * 0.4 + u_time * 0.35, base);

        // sin 波纹频率受音频调制
        float waveFreq = 8.0 + bandVal * 6.0;
        d = sin(d * waveFreq + u_time * 0.8) / 8.0;
        d = abs(d);

        // glow 强度:基础 + 音频增强
        float glow = 0.012 + bandVal * 0.008;
        d = pow(glow / d, 1.2);

        finalColor += col * d;
    }

    // 整体亮度随音量微调
    finalColor *= (0.85 + u_volume * 0.3);

    return half4(finalColor, 1.0);
}
