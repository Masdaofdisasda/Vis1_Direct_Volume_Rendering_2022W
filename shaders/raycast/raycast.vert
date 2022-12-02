varying vec3 vray_dir;
flat out vec3 transformed_eye;

uniform vec3 volume_scale;

void main() {
    // Translate the cube to center it at the origin.
    vec3 volume_translation = vec3(0.5) - volume_scale * 0.5;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position * volume_scale + volume_translation, 1);

    // Compute eye position and ray directions in the unit cube space
    transformed_eye = (cameraPosition - volume_translation) / volume_scale;
    vray_dir = position - transformed_eye;
}
