## How to Use

Load one of the provided volume files through the GUI. 
Rotate the orbit camera around the bounding box using the left mouse button. Zoom using the scroll wheel. 

Once a file is loaded, click somewhere inside the coordinate system above the histogram graph to select a density for First-Hit Compositing. Changing the "intensity" has currently no effect.

Click on the switch to change the render mode. Note: Selecting a density value will only have an effect with First-Hit selected.

## Framework Description

This framework uses three.js and d3.js for volume rendering and setting the appearance, respectively. 
The following files are provided: 
* **index.html**: contains the HTML content. Please enter your names! Otherwise, it does not need to be changed 
(but can be, if required). 
* **style.css**: CSS styles (can be adjusted, but does not need to be changed). 
* **three.js/build/three.js**: Contains the three.js library. **Do not modify!**
* **shaders**: Folder containing a dummy vertex and fragment shader. **Add your shaders to this folder!** 
* **js**: Folder containing all JavaScript files. **Add new classes as separate js-files in this folder!** 
    * **vis1.js**: Main script file. Needs to be modified. 
    * **shader.js**: Base shader class. Does not need to be modified. Derive your custom shader materials from this class!
    * **testShader.js**: Example shader class demonstrating how to create and use a shader material 
    using external .essl files. Should not be used in the final submission.
    * **camera.js**: Simple orbit camera that moves nicely around our volumes. Does not need to be modified.
    * **histogram.js**: Class, that generates the histogram and the coordinate system above it. Also handles interactions with it. (Has animated transitions too)
    * **raycastShader.js** Our implementation of MIP, First Hit and Single pass Raycasting.
    
Created 2021 by Manuela Waldner, Diana Schalko, amd Laura Luidolt based on the Vis1 Task 1 Qt framework 
initially created by Johanna Schmidt, Tobias Klein, and Laura Luidolt. 

## JavaScript

Javascript files should go to folder 'js' and end with '.js'. All new javascript files have to be included in index.html. 

Recommended IDE: Webstorm (free educational version available using TU Wien e-mail address)

*Important*: do not run index.html from the file system! Only execute it from inside WebStorm 
(by selecting a browser icon from the top right panel that appears when you open index.html) 
or from hosting the project within another web server. Opening index.html directly in the browser without a server
will result in an error when trying to load the .essl shader files. 


## Shaders

The shaders are ending in .frag for fragment and .vert for vertex to use syntax highlighting

### Raycast Shader

The shader in shaders/raycast implement a single pass direct volume rendering approach using raycasting. The vertex shader
transforms the vertices by the camera and transforms the camera positon and view ray as if the bounds of the 3d texture 
would be in a unit cube from (0,0,0) to (1,1,1). In the fragment the raycasting renderer works by calculating the intersection
between the view ray and the unit cube and then marching along the view ray to through the unit cube and sampling from the 
3d texture along the way. 

For the first hit rendering the current and next sample and position are tracked and if the next sample is over the given
iso value threshold the position and value gets interpolated to get the actual surface and then the light at this point gets
calculated. For the normal we use the gradient formula from the lecture slides and for the light model we use the PBR model 
from here: https://github.com/Masdaofdisasda/cgue22-greed/blob/master/src/bin/assets/shaders/pbr/pbr.frag

The maximum intensity projections simply tracks the highest sampled value and assigns it to a color. For both renderers 
we use the viridis transfer function from the three.js examples to color our output.
