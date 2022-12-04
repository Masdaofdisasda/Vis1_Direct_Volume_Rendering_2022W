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

const int REFINEMENT_STEPS = 4;

vec2 intersect_box(vec3 orig, vec3 dir);
void raycast_fhc();
void raycast_mip();
float sample_volume(vec3 texcoords);
vec4 apply_color(float val);

void main() {
    if (u_renderstyle == 0){
        raycast_fhc(); // first hit compositing
    } else {
        raycast_mip(); // maximum intensity projection
    }
}

void raycast_fhc() {
    // ray direction may not be normalized after interpolation
    vec3 ray_dir = normalize(vray_dir);

    // find the start and endpoint of the ray intersecting the cube
    vec2 t_hit = intersect_box(transformed_eye, ray_dir);
    if (t_hit.x > t_hit.y) {
        discard;
    }
     // set starting point in front of the camera
    t_hit.x = max(t_hit.x, 0.0);

    // Compute the step size to march through the volume grid
    vec3 dt_vec = 1.0 / (u_size * abs(ray_dir));
    float dt = min(dt_vec.x, min(dt_vec.y, dt_vec.z));

    // ray cast loop
    vec3 p = transformed_eye + t_hit.x * ray_dir;
    vec4 color = vec4(0.0f);
    float maxVal = 0.0f;
    for (float t = t_hit.x; t < t_hit.y; t += dt) {

        // sample the volume
        float val = texture(u_data, p).r;
        maxVal = max(maxVal, val);
        vec4 val_color = vec4(vec3(val), val);

        // Step 4.2: Accumulate the color and opacity using the front-to-back
        // compositing equation
        color.rgb += (1.0 - color.a) * val_color.a * val_color.rgb;
        color.a += (1.0 - color.a) * val_color.a;

        // break out of the loop when the color is near opaque
        if (color.a >= 0.95) {
            break;
        }

        // step further
        p += ray_dir * dt;
    }
    gl_FragColor = color;
}

void raycast_mip() {
    // ray direction may not be normalized after interpolation
    vec3 ray_dir = normalize(vray_dir);

    // find the start and endpoint of the ray intersecting the cube
    vec2 t_hit = intersect_box(transformed_eye, ray_dir);
    if (t_hit.x > t_hit.y) {
        discard;
    }
     // set starting point in front of the camera
    t_hit.x = max(t_hit.x, 0.0);

    // Compute the step size to march through the volume grid
    vec3 dt_vec = 1.0 / (u_size * abs(ray_dir));
    float dt = min(dt_vec.x, min(dt_vec.y, dt_vec.z));

    // ray cast loop
    vec3 p = transformed_eye + t_hit.x * ray_dir;
    float max_val = -1e6;
    vec3 max_step = vec3(0);
    for (float t = t_hit.x; t < t_hit.y; t += dt) {

        // sample the volume
        float val = sample_volume(p);
        if (val > max_val){
            max_val = val;
            max_step = p;
        }

        // step further
        p += ray_dir * dt;
    }

    p = max_step - ray_dir * dt * 0.5;
    dt = dt / float(REFINEMENT_STEPS);
    for (int i=0; i<REFINEMENT_STEPS; i++) {
        max_val = max(max_val, sample_volume(p));
        p += ray_dir * dt;
    }

    gl_FragColor = apply_color(max_val);
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

float sample_volume(vec3 texcoords) {
    /* Sample float value from a 3D texture. Assumes intensity data. */
    return texture(u_data, texcoords).r;
}

vec4 apply_color(float val) {
    val = (val - u_clim[1]) / (u_clim[0] - u_clim[1]);
    return vec4(vec3(val), 1.0);
}
