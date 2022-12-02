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
    constructor(volume){
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

        const longestAxis = Math.max(volume.width, Math.max(volume.height,volume.depth));

        console.log(volume);
        this.setUniform("u_size", new THREE.Vector3(volume.width, volume.height, volume.depth));
        this.setUniform("u_renderstyle", 1);
        this.setUniform("u_renderthreshold", 0.2);
        this.setUniform("u_clim", new THREE.Vector2(1,0));
        this.setUniform("u_data", data3D);
        console.log(new THREE.Vector3(volume.width/longestAxis, volume.height/longestAxis, volume.depth/longestAxis));
        this.setUniform("volume_scale", new THREE.Vector3(volume.width/longestAxis, volume.height/longestAxis, volume.depth/longestAxis));
    }
}
