varying vec3 vray_dir;
flat out vec3 transformed_eye;

uniform vec3 volume_scale;
uniform vec3 u_size;


void main() {
    // Translate the cube to center it at the origin.
    vec3 volume_translation = vec3(0.5) - volume_scale * 0.5;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1);

    // Compute eye position and ray directions in the unit cube space
    transformed_eye = (cameraPosition /u_size) + vec3(0.5);
    vray_dir = (position /u_size) + vec3(0.5) - transformed_eye;
}
