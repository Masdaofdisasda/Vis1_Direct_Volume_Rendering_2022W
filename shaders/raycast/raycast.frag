//https://github.com/mrdoob/three.js/blob/master/examples/js/shaders/VolumeShader.js

precision highp int;
precision highp float;
precision highp sampler3D;

uniform vec3 u_size;
uniform int u_renderstyle;
uniform float u_renderthreshold;
uniform vec2 u_clim;
uniform sampler3D u_data;
varying vec3 vray_dir;
flat in vec3 transformed_eye;

vec2 intersect_box(vec3 orig, vec3 dir);
void cast_iso();
float sample1(vec3 texcoords);
vec4 apply_color(float val);

void main() {
    if (u_renderstyle == 1)
        cast_iso();

}

vec2 intersect_box(vec3 orig, vec3 dir) {
    const vec3 box_min = vec3(0);
    const vec3 box_max = vec3(1);
    vec3 inv_dir = 1.0 / dir;
    vec3 tmin_tmp = (box_min - orig) * inv_dir;
    vec3 tmax_tmp = (box_max - orig) * inv_dir;
    vec3 tmin = min(tmin_tmp, tmax_tmp);
    vec3 tmax = max(tmin_tmp, tmax_tmp);
    float t0 = max(tmin.x, max(tmin.y, tmin.z));
    float t1 = min(tmax.x, min(tmax.y, tmax.z));
    return vec2(t0, t1);
}

float sample1(vec3 texcoords) {
    /* Sample float value from a 3D texture. Assumes intensity data. */
    return texture(u_data, texcoords).r;
}

vec4 apply_color(float val) {
    return vec4(1.0,1.0,1.0,1.0);
}

void cast_iso() {
    // Step 1: Normalize the view ray
    vec3 ray_dir = normalize(vray_dir);

    // Step 2: Intersect the ray with the volume bounds to find the interval
    // along the ray overlapped by the volume.
    vec2 t_hit = intersect_box(transformed_eye, ray_dir);
    if (t_hit.x > t_hit.y) {
        //discard;
    }
    // We don't want to sample voxels behind the eye if it's
    // inside the volume, so keep the starting point at or in front
    // of the eye

    t_hit.x = max(t_hit.x, 0.0);

    // Step 3: Compute the step size to march through the volume grid
    vec3 dt_vec = 1.0 / (u_size * abs(ray_dir));
    float dt = min(dt_vec.x, min(dt_vec.y, dt_vec.z));

    // Step 4: Starting from the entry point, march the ray through the volume
    // and sample it
    vec3 p = transformed_eye + t_hit.x * ray_dir;
    vec4 color = vec4(0.0f);
    float maxVal = 0.0f;
    for (float t = t_hit.x; t < t_hit.y; t += dt) {
        // Step 4.1: Sample the volume, and color it by the transfer function.
        // Note that here we don't use the opacity from the transfer function,
        // and just use the sample value as the opacity
        float val = texture(u_data, p).r;
        maxVal = max(maxVal, val);
        vec4 val_color = vec4(vec3(val), val);

        // Step 4.2: Accumulate the color and opacity using the front-to-back
        // compositing equation
        color.rgb += (1.0 - color.a) * val_color.a * val_color.rgb;
        color.a += (1.0 - color.a) * val_color.a;

        // Optimization: break out of the loop when the color is near opaque
        if (color.a >= 0.95) {
            break;
        }
        p += ray_dir * dt;
    }

    gl_FragColor = color;
    //gl_FragColor = vec4(normalize(ray_dir), 1.0f);
    vec3 test = normalize(normalize(vec3(t_hit.x)) + normalize(vec3(t_hit.y)));
    //gl_FragColor = vec4(test, 1.0f);
}
