// Sources:
// https://github.com/mrdoob/three.js/blob/master/examples/js/shaders/VolumeShader.js
// https://github.com/Twinklebear/webgl-volume-raycaster

precision highp int;
precision highp float;
precision highp sampler3D;

uniform vec3 volume_size;
uniform int render_mode;
uniform float u_renderthreshold;
uniform vec2 u_clim;
uniform sampler3D volume_data;
uniform sampler2D u_colormap;
varying vec3 vray_dir;
flat in vec3 transformed_eye;

const int REFINEMENT_STEPS = 4;
const vec3 LIGHT_COLOR = vec3(5.f);
const float shininess = 40.0;

vec2 intersect_box(vec3 orig, vec3 dir);
void raycast_fhc();
void raycast_mip();
float sample_volume(vec3 texcoords);
vec4 apply_color(float val);
vec4 add_lighting(float val, vec3 loc, vec3 step, vec3 view_ray);

struct PBRInfo
{
    float NdotL;                  // cos angle between normal and light direction
    float NdotV;                  // cos angle between normal and view direction
    float NdotH;                  // cos angle between normal and half vector
    float LdotH;                  // cos angle between light direction and half vector
    float VdotH;                  // cos angle between view direction and half vector
    float perceptualRoughness;    // roughness value, as authored by the model creator (input to shader)
    vec3 reflectance0;            // full reflectance color (normal incidence angle)
    vec3 reflectance90;           // reflectance color at grazing angle
    float alphaRoughness;         // roughness mapped to a more linear change in the roughness (proposed by [2])
    vec3 diffuseColor;            // color contribution from diffuse lighting
    vec3 specularColor;           // color contribution from specular lighting
    vec3 n;							// normal at surface point
    vec3 v;							// vector from surface point to camera
};

const float M_PI = 3.141592653589793;

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


// from https://www.willusher.io/webgl/2019/01/13/volume-rendering-with-webgl
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

vec3 getNormalFromTexture(vec3 loc, vec3 step) {
    vec3 dx = vec3(step.x, 0.0, 0.0);
    vec3 dy = vec3(0.0, step.y, 0.0);
    vec3 dz = vec3(0.0, 0.0, step.z);
    float dSampleDX = sample_volume(loc-dx) - sample_volume(loc+dx);
    float dSampleDY = sample_volume(loc-dy) - sample_volume(loc+dy);
    float dSampleDZ = sample_volume(loc-dz) - sample_volume(loc+dz);

    return 0.5 * vec3(dSampleDX, dSampleDY, dSampleDZ);
}

vec4 apply_color(float val) {
    val = (val - u_clim[0]) / (u_clim[1] - u_clim[0]);
    return vec4(texture2D(u_colormap, vec2(val, 0.5)).rgb,1.f);
}
vec3 calculatePBRInputsMetallicRoughness( vec4 albedo, vec3 normal, vec3 cameraPos, vec3 worldPos, vec4 mrSample, out PBRInfo pbrInputs )
{
    float perceptualRoughness = 1.0;
    float metallic = 1.0;

    // Roughness is stored in the 'g' channel, metallic is stored in the 'b' channel.
    // This layout intentionally reserves the 'r' channel for (optional) occlusion map data
    perceptualRoughness = mrSample.g * perceptualRoughness;
    metallic = mrSample.b * metallic;

    const float c_MinRoughness = 0.04;

    perceptualRoughness = clamp(perceptualRoughness, c_MinRoughness, 1.0);
    metallic = clamp(metallic, 0.0, 1.0);
    // Roughness is authored as perceptual roughness; as is convention,
    // convert to material roughness by squaring the perceptual roughness [2].
    float alphaRoughness = perceptualRoughness * perceptualRoughness;

    // The albedo may be defined from a base texture or a flat color
    vec4 baseColor = albedo;

    vec3 f0 = vec3(0.04);
    vec3 diffuseColor = baseColor.rgb * (vec3(1.0) - f0);
    diffuseColor *= 1.0-metallic;
    vec3 specularColor = mix(f0, baseColor.rgb, metallic);

    // Compute reflectance.
    float reflectance = max(max(specularColor.r, specularColor.g), specularColor.b);

    // For typical incident reflectance range (between 4% to 100%) set the grazing reflectance to 100% for typical fresnel effect.
    // For very low reflectance range on highly diffuse objects (below 4%), incrementally reduce grazing reflecance to 0%.
    float reflectance90 = clamp(reflectance * 25.0, 0.0, 1.0);
    vec3 specularEnvironmentR0 = specularColor.rgb;
    vec3 specularEnvironmentR90 = vec3(1.0, 1.0, 1.0) * reflectance90;

    vec3 n = normalize(normal);					// normal at surface point
    vec3 v = normalize(cameraPos - worldPos);	// Vector from surface point to camera
    vec3 reflection = -normalize(reflect(v, n));

    pbrInputs.NdotV = clamp(abs(dot(n, v)), 0.001, 1.0);
    pbrInputs.perceptualRoughness = perceptualRoughness;
    pbrInputs.reflectance0 = specularEnvironmentR0;
    pbrInputs.reflectance90 = specularEnvironmentR90;
    pbrInputs.alphaRoughness = alphaRoughness;
    pbrInputs.diffuseColor = diffuseColor;
    pbrInputs.specularColor = specularColor;
    pbrInputs.n = n;
    pbrInputs.v = v;

    return baseColor.rgb;
}


// Disney Implementation of diffuse from Physically-Based Shading at Disney by Brent Burley. See Section 5.3.
// http://blog.selfshadow.com/publications/s2012-shading-course/burley/s2012_pbs_disney_brdf_notes_v3.pdf
vec3 diffuseBurley(PBRInfo pbrInputs)
{
    float f90 = 2.0 * pbrInputs.LdotH * pbrInputs.LdotH * pbrInputs.alphaRoughness - 0.5;

    return (pbrInputs.diffuseColor / M_PI) * (1.0 + f90 * pow((1.0 - pbrInputs.NdotL), 5.0)) * (1.0 + f90 * pow((1.0 - pbrInputs.NdotV), 5.0));
}

// The following equation models the Fresnel reflectance term of the spec equation (aka F())
vec3 specularReflection(PBRInfo pbrInputs)
{
    return pbrInputs.reflectance0 + (pbrInputs.reflectance90 - pbrInputs.reflectance0) * pow(clamp(1.0 - pbrInputs.VdotH, 0.0, 1.0), 5.0);
}

// This calculates the specular geometric attenuation (aka G()),
// where rougher material will reflect less light back to the viewer.
float geometricOcclusion(PBRInfo pbrInputs)
{
    float NdotL = pbrInputs.NdotL;
    float NdotV = pbrInputs.NdotV;
    float rSqr = pbrInputs.alphaRoughness * pbrInputs.alphaRoughness;

    float attenuationL = 2.0 * NdotL / (NdotL + sqrt(rSqr + (1.0 - rSqr) * (NdotL * NdotL)));
    float attenuationV = 2.0 * NdotV / (NdotV + sqrt(rSqr + (1.0 - rSqr) * (NdotV * NdotV)));
    return attenuationL * attenuationV;
}

// The following equation(s) model the distribution of microfacet normals across the area being drawn (aka D())
// Implementation from "Average Irregularity Representation of a Roughened Surface for Ray Reflection" by T. S. Trowbridge, and K. P. Reitz
// Follows the distribution function recommended in the SIGGRAPH 2013 course notes from EPIC Games
float microfacetDistribution(PBRInfo pbrInputs)
{
    float roughnessSq = pbrInputs.alphaRoughness * pbrInputs.alphaRoughness;
    float f = (pbrInputs.NdotH * roughnessSq - pbrInputs.NdotH) * pbrInputs.NdotH + 1.0;
    return roughnessSq / (M_PI * f * f);
}

vec3 calculatePBRLightContributionDir( inout PBRInfo pbrInputs)
{
    vec3 n = pbrInputs.n;
    vec3 v = pbrInputs.v;
    vec3 l = normalize(transformed_eye);	// Vector from surface point to light
    vec3 h = normalize(l+v);					// Half vector between both l and v

    float NdotV = pbrInputs.NdotV;
    float NdotL = clamp(dot(n, l), 0.001, 1.0);
    float NdotH = clamp(dot(n, h), 0.0, 1.0);
    float LdotH = clamp(dot(l, h), 0.0, 1.0);
    float VdotH = clamp(dot(v, h), 0.0, 1.0);

    pbrInputs.NdotL = NdotL;
    pbrInputs.NdotH = NdotH;
    pbrInputs.LdotH = LdotH;
    pbrInputs.VdotH = VdotH;

    // Calculate the shading terms for the microfacet specular shading model
    vec3 F = specularReflection(pbrInputs);
    float G = geometricOcclusion(pbrInputs);
    float D = microfacetDistribution(pbrInputs);

    // Calculation of analytical lighting contribution
    vec3 diffuseContrib = (1.0 - F) * diffuseBurley(pbrInputs);
    vec3 specContrib = F * G * D / (4.0 * NdotL * NdotV);
    // Obtain final intensity as reflectance (BRDF) scaled by the energy of the light (cosine law)
    vec3 color = NdotL * LIGHT_COLOR * 3.0f * (diffuseContrib + specContrib);

    return color;
}

// Extended Reinhard tone mapping operator
vec3 Reinhard2(vec3 x)
{
    float maxWhite = 1.5f;
    return (x * (1.0 + x / (maxWhite * maxWhite))) / (1.0 + x);
}

vec4 add_lighting(float val, vec3 loc, vec3 step, vec3 view_ray)
{
    // Calculate color by incorporating lighting
    // View direction
    vec3 V = normalize(view_ray);

    // calculate normal vector from gradient
    vec3 N = getNormalFromTexture(loc, step);
    N = normalize(N);

    vec4 Kd = apply_color(val);

    vec4 MeR;
    MeR.g = 0.5f;
    MeR.b = 0.5f;

    PBRInfo pbrInputs;

    // fill pbr inputs
    vec3 color = calculatePBRInputsMetallicRoughness(Kd, N, transformed_eye, loc, MeR, pbrInputs);

    // directional light contribution
    color *= calculatePBRLightContributionDir( pbrInputs);

    color = pow(color, vec3(1.0/2.2) ) ;

    return vec4(Reinhard2(color), 1.0);
}
