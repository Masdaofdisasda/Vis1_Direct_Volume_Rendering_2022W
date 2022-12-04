//https://github.com/mrdoob/three.js/blob/master/examples/js/shaders/VolumeShader.js

precision highp int;
precision highp float;
precision highp sampler3D;

uniform vec3 volume_size;
uniform int render_mode;
uniform float u_renderthreshold;
uniform vec2 u_clim;
uniform sampler3D volume_data;
varying vec3 vray_dir;
flat in vec3 transformed_eye;

const int REFINEMENT_STEPS = 4;
const float shininess = 40.0;

vec2 intersect_box(vec3 orig, vec3 dir);
void raycast_fhc();
void raycast_mip();
float sample_volume(vec3 texcoords);
vec4 apply_color(float val);
vec4 add_lighting(float val, vec3 loc, vec3 step, vec3 view_ray);

void main() {
    if (render_mode == 0){
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
    vec3 dt_vec = 1.0 / (volume_size * abs(ray_dir));
    float dt = min(dt_vec.x, min(dt_vec.y, dt_vec.z));

    // ray cast loop
    vec3 p = transformed_eye + t_hit.x * ray_dir;
    float maxVal = 0.0f;
    for (float t = t_hit.x; t < t_hit.y; t += dt) {

        // sample the volume
        float val = texture(volume_data, p).r;
        if (val > u_renderthreshold){
            p = p - ray_dir * dt * 0.5;
            dt = dt / float(REFINEMENT_STEPS);
            for (int i=0; i<REFINEMENT_STEPS; i++) {
                if (val > u_renderthreshold){
                    gl_FragColor = add_lighting(val, p, ray_dir * dt * 0.3, ray_dir);
                    return;
                }
                p += ray_dir * dt;
            }
        }

        // step further
        p += ray_dir * dt;
    }
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
    vec3 dt_vec = 1.0 / (volume_size * abs(ray_dir));
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
    return texture(volume_data, texcoords).r;
}

vec4 apply_color(float val) {
    val = (val - u_clim[0]) / (u_clim[1] - u_clim[0]);
    return vec4(vec3(val), 1.0);
}

vec4 add_lighting(float val, vec3 loc, vec3 step, vec3 view_ray)
{
    // Calculate color by incorporating lighting
    // View direction
    vec3 V = normalize(view_ray);
    // calculate normal vector from gradient
    vec3 N;
    float val1, val2;
    val1 = sample_volume(loc + vec3(-step[0], 0.0, 0.0));
    val2 = sample_volume(loc + vec3(+step[0], 0.0, 0.0));
    N[0] = val1 - val2;
    val = max(max(val1, val2), val);
    val1 = sample_volume(loc + vec3(0.0, -step[1], 0.0));
    val2 = sample_volume(loc + vec3(0.0, +step[1], 0.0));
    N[1] = val1 - val2;
    val = max(max(val1, val2), val);
    val1 = sample_volume(loc + vec3(0.0, 0.0, -step[2]));
    val2 = sample_volume(loc + vec3(0.0, 0.0, +step[2]));
    N[2] = val1 - val2;
    val = max(max(val1, val2), val);
    float gm = length(N); // gradient magnitude
    N = normalize(N);
    // Flip normal so it points towards viewer
    float Nselect = float(dot(N, V) > 0.0);
    N = (2.0 * Nselect - 1.0) * N;	// ==	Nselect * N - (1.0-Nselect)*N;
    // Init colors
    vec4 ambient_color = vec4(0.0, 0.0, 0.0, 0.0);
    vec4 diffuse_color = vec4(0.0, 0.0, 0.0, 0.0);
    vec4 specular_color = vec4(0.0, 0.0, 0.0, 0.0);
    // note: could allow multiple lights
    for (int i=0; i<1; i++)
    {
        // Get light direction (make sure to prevent zero devision)
        vec3 L = normalize(view_ray);	//lightDirs[i];
        float lightEnabled = float( length(L) > 0.0 );
        L = normalize(L + (1.0 - lightEnabled));
        // Calculate lighting properties
        float lambertTerm = clamp(dot(N, L), 0.0, 1.0);
        vec3 H = normalize(L+V); // Halfway vector
        float specularTerm = pow(max(dot(H, N), 0.0), shininess);
        // Calculate mask
        float mask1 = lightEnabled;
        // Calculate colors
        ambient_color +=	mask1 * ambient_color;	// * gl_LightSource[i].ambient;
        diffuse_color +=	mask1 * lambertTerm;
        specular_color += mask1 * specularTerm * specular_color;
    }
    // Calculate final color by componing different components
    vec4 final_color;
    vec4 color = apply_color(val);
    final_color = color * (ambient_color + diffuse_color) + specular_color;
    final_color.a = color.a;
    return final_color;
}
