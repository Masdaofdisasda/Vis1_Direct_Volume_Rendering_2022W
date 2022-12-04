varying vec3 vray_dir;
flat out vec3 transformed_eye;

uniform vec3 volume_size;


void main() {
    // Compute box geometry using original dimensions and centered around origin
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1);

    // Compute eye position and ray directions in the unit cube space (0-1)
    transformed_eye = (cameraPosition /volume_size) + vec3(0.5);
    vray_dir = (position /volume_size) + vec3(0.5) - transformed_eye;
}
