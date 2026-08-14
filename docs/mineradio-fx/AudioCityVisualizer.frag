// AudioCityVisualizer.frag (AGSL RuntimeShader)
// 来源: com.mineradio.app.ui.widget.AudioCityVisualizerKt (Mineradio 2.1.0.0)
// 3D 音频城市: raymarching 柱体, FFT 频段驱动柱高, 音量膨胀
// uniforms: u_time, u_resolution, u_baseColor, u_volume, u_bands0-3 (16频段)
uniform float u_time;
uniform float2 u_resolution;
uniform float3 u_baseColor;
uniform float u_volume;
uniform float4 u_bands0;
uniform float4 u_bands1;
uniform float4 u_bands2;
uniform float4 u_bands3;

// ---------- 频段采样 (无分支) ----------

float sampleBands(float fi) {
    float s = clamp(fi, 0.0, 15.0);
    float g = floor(s / 4.0);
    float l = s - g * 4.0;
    float4 v = mix(mix(u_bands0, u_bands1, step(1.0, g)),
                   mix(u_bands2, u_bands3, step(3.0, g)),
                   step(2.0, g));
    return mix(mix(v.x, v.y, step(1.0, l)),
               mix(v.z, v.w, step(3.0, l)),
               step(2.0, l));
}

float getBand(float freq) {
    float idx = clamp(freq, 0.0, 1.0) * 15.0;
    float fi = floor(idx);
    float fr = idx - fi;
    return mix(sampleBands(fi), sampleBands(min(fi + 1.0, 15.0)), fr);
}

// ---------- 音频函数 ----------

float getPitch(float freq) {
    float norm = clamp(freq / 5.0, 0.0, 1.0);
    float raw = getBand(norm);
    return raw * 0.8;
}

// ---------- 工具函数 ----------

float sdBox(float3 p, float3 b) {
    float3 q = abs(p) - b;
    return length(max(q, float3(0.0))) + min(max(q.x, max(q.y, q.z)), 0.0);
}

float hash13(float3 p3) {
    p3 = fract(p3 * 0.1031);
    p3 += dot(p3, p3.zyx + 31.32);
    return fract((p3.x + p3.y) * p3.z);
}

float light(float d, float att) {
    return 1.0 / (1.0 + pow(abs(d * att), 1.5));
}

float2 rot2d(float2 v, float a) {
    float ca = cos(a);
    float sa = sin(a);
    return float2(v.x * ca - v.y * sa, v.x * sa + v.y * ca);
}

// ---------- 主渲染 ----------

half4 main(float2 fragCoord) {
    float2 uv = (2.0 * fragCoord - u_resolution) / u_resolution.y;
    uv.y = -uv.y;  // AGSL Y轴向下,Shadertoy Y轴向上,需翻转

    // 背景
    float3 col = float3(0.1, 0.0, 0.14);

    float vol = u_volume;

    // 相机位置:适中俯角俯瞰城市
    float3 ro = float3(0.0, 4.0, 10.0) * (1.0 + vol * 0.3);
    // Y 轴旋转
    float2 rotXZ = rot2d(float2(ro.x, ro.z), u_time * 0.15);
    ro = float3(rotXZ.x, ro.y, rotXZ.y);

    // 相机坐标系
    float3 f = normalize(-ro);
    float3 worldUp = float3(0.0, 1.0, 0.0);
    float3 r = normalize(cross(worldUp, f));
    float3 u = cross(f, r);
    float3 rd = normalize(f + uv.x * r + uv.y * u);

    // 三色:粉红 → 绿 → 紫蓝
    float3 warmCol = float3(0.8, 0.2, 0.4);
    float3 greenCol = float3(0.0, 1.0, 0.0);
    float3 coolCol = float3(0.5, 0.3, 1.2);

    float t = 0.0;

    // 25 步 raymarching(原版 30,移动端优化)
    for (float i = 0.0; i < 25.0; i += 1.0) {
        float3 p = ro + t * rd;

        // xz 平面网格划分
        float2 cen = floor(p.xz) + 0.5;
        float3 id = abs(float3(cen.x, 0.0, cen.y));
        float d = length(id);

        // 频率映射:近处低频,远处高频 + hash 随机偏移
        float freq = smoothstep(0.0, 20.0, d) * 3.0 + hash13(id) * 2.0;
        float pitch = getPitch(freq);

        // 音量对近处柱体的膨胀效果
        float v = vol * smoothstep(2.0, 0.0, d);
        // 柱体高度:适中律动,不超过相机
        float h = d * 0.15 + pitch * 1.5 + v * 1.0 + 0.3;

        // 柱体 SDF(宽度0.25留出间距减少边界伪影)
        float me = sdBox(
            p - float3(cen.x, -50.0, cen.y),
            float3(0.25, 50.0 + h, 0.25)
        ) - 0.03;

        // 颜色公式
        float3 baseCol = mix(
            mix(warmCol, greenCol, min(v * 2.0, 1.0)),
            coolCol,
            smoothstep(10.0, 30.0, d)
        );

        col += baseCol
             * (cos(id) + 1.5)
             * (pitch * d * 0.04 + v * 0.4 + 0.12)
             * light(me, 20.0)
             * (1.0 + vol * 0.8)
             * 0.5;

        t += max(me, 0.02);
        if (t > 40.0) { break; }
    }

    return half4(half3(col), 1.0);
}
