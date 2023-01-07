/**
 * Vis 1 Task 1 Framework
 * Copyright (C) TU Wien
 *   Institute of Visual Computing and Human-Centered Technology
 *   Research Unit of Computer Graphics
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are not permitted.
 *
 * Raycasting shader for rendering the volumetric data
 *
 * https://www.cg.informatik.uni-siegen.de/sites/www.cg.informatik.uni-siegen.de/files/data/Tutorials/EG2006/RTVG04_GPU_Raycasting.pdf
 *
 * @author David Köppl
 */

class RaycastShader extends Shader{
    constructor(volume, selectedDensity){
        super("raycast/raycast.vert", "raycast/raycast.frag");

        const data3D = new THREE.Data3DTexture(volume.voxels, volume.width, volume.height, volume.depth);
        data3D.format = THREE.RedFormat;
        data3D.type = THREE.FloatType;
        data3D.minFilter = data3D.magFilter = THREE.LinearFilter;
        data3D.wrapR = THREE.ClampToEdgeWrapping
        data3D.wrapS = THREE.ClampToEdgeWrapping
        data3D.wrapT = THREE.ClampToEdgeWrapping
        data3D.unpackAlignment = 1;
        data3D.needsUpdate = true;

        new THREE.TextureLoader().load("shaders/raycast/cm_viridis.png",
            (texture) => this.setUniform('u_colormap', texture));

        const longestAxis = Math.max(volume.width, Math.max(volume.height,volume.depth));

        this.setUniform("volume_size", new THREE.Vector3(volume.width, volume.height, volume.depth));
        this.setUniform("render_mode", 1);
        this.setUniform("u_renderthreshold", selectedDensity);
        this.setUniform("u_clim", new THREE.Vector2(0,1)); //TODO add controls
        this.setUniform("volume_data", data3D);
        this.setUniform("volume_scale", new THREE.Vector3(volume.width/longestAxis, volume.height/longestAxis, volume.depth/longestAxis));
    }

    /**
     * @param mode 0 for First Hit; 1 for MIP
     */
    setRenderMode(mode){
        this.setUniform("render_mode", mode);
        paint();
    }

    updateDensity(newDensity){
        this.setUniform("u_renderthreshold", newDensity);
    }
}
