import * as THREE from 'three';
import { Reflector  } from './utils/Reflector.js';
import { MuJoCoDemo } from './main.js';

export async function reloadFunc() {
  // Delete the old scene and load the new scene
  this.scene.remove(this.scene.getObjectByName("MuJoCo Root"));
  [this.model, this.state, this.simulation, this.bodies, this.lights] =
    await loadSceneFromURL(this.mujoco, this.params.scene, this);
  this.simulation.forward();
  for (let i = 0; i < this.updateGUICallbacks.length; i++) {
    this.updateGUICallbacks[i](this.model, this.simulation, this.params);
  }
}

/** @param {MuJoCoDemo} parentContext*/
export function setupGUI(parentContext) {

  // Make sure we reset the camera when the scene is changed or reloaded.
  parentContext.updateGUICallbacks.length = 0;
  parentContext.updateGUICallbacks.push((model, simulation, params) => {
    // TODO: Use free camera parameters from MuJoCo
    parentContext.camera.position.set(2.0, 1.7, 1.7);
    parentContext.controls.target.set(0, 0.7, 0);
    parentContext.controls.update(); });

  // Add scene selection dropdown.
  let reload = reloadFunc.bind(parentContext);
  parentContext.gui.add(parentContext.params, 'scene', {
    "Hand": "myo_sim/hand/myo_hand.xml",
    "TEST": "myo_sim/elbow/myo_test.xml",
    "Elbow": "myo_sim/elbow/myo_elbow_1dof6muscles.xml",
    "Elbow Exo": "myo_sim/elbow/myo_elbow_1dof6muscles_1dofexo.xml",
    "motor_finger_v0": "myo_sim/finger/motor_finger_v0.xml",
    "myo_finger_v0": "myo_sim/finger/myo_finger_v0.xml",
  }).name('Example Scene').onChange(reload);

  // Add a help menu.
  // Parameters:
  //  Name: "Help".
  //  When pressed, a help menu is displayed in the top left corner. When pressed again
  //  the help menu is removed.
  //  Can also be triggered by pressing F1.
  // Has a dark transparent background.
  // Has two columns: one for putting the action description, and one for the action key trigger.keyframeNumber
  let keyInnerHTML = '';
  let actionInnerHTML = '';
  const displayHelpMenu = () => {
    if (parentContext.params.help) {
      const helpMenu = document.createElement('div');
      helpMenu.style.position = 'absolute';
      helpMenu.style.top = '10px';
      helpMenu.style.left = '10px';
      helpMenu.style.color = 'white';
      helpMenu.style.font = 'normal 18px Arial';
      helpMenu.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
      helpMenu.style.padding = '10px';
      helpMenu.style.borderRadius = '10px';
      helpMenu.style.display = 'flex';
      helpMenu.style.flexDirection = 'column';
      helpMenu.style.alignItems = 'center';
      helpMenu.style.justifyContent = 'center';
      helpMenu.style.width = '400px';
      helpMenu.style.height = '400px';
      helpMenu.style.overflow = 'auto';
      helpMenu.style.zIndex = '1000';

      const helpMenuTitle = document.createElement('div');
      helpMenuTitle.style.font = 'bold 24px Arial';
      helpMenuTitle.innerHTML = '';
      helpMenu.appendChild(helpMenuTitle);

      const helpMenuTable = document.createElement('table');
      helpMenuTable.style.width = '100%';
      helpMenuTable.style.marginTop = '10px';
      helpMenu.appendChild(helpMenuTable);

      const helpMenuTableBody = document.createElement('tbody');
      helpMenuTable.appendChild(helpMenuTableBody);

      const helpMenuRow = document.createElement('tr');
      helpMenuTableBody.appendChild(helpMenuRow);

      const helpMenuActionColumn = document.createElement('td');
      helpMenuActionColumn.style.width = '50%';
      helpMenuActionColumn.style.textAlign = 'right';
      helpMenuActionColumn.style.paddingRight = '10px';
      helpMenuRow.appendChild(helpMenuActionColumn);

      const helpMenuKeyColumn = document.createElement('td');
      helpMenuKeyColumn.style.width = '50%';
      helpMenuKeyColumn.style.textAlign = 'left';
      helpMenuKeyColumn.style.paddingLeft = '10px';
      helpMenuRow.appendChild(helpMenuKeyColumn);

      const helpMenuActionText = document.createElement('div');
      helpMenuActionText.innerHTML = actionInnerHTML;
      helpMenuActionColumn.appendChild(helpMenuActionText);

      const helpMenuKeyText = document.createElement('div');
      helpMenuKeyText.innerHTML = keyInnerHTML;
      helpMenuKeyColumn.appendChild(helpMenuKeyText);

      // Close buttom in the top.
      const helpMenuCloseButton = document.createElement('button');
      helpMenuCloseButton.innerHTML = 'Close';
      helpMenuCloseButton.style.position = 'absolute';
      helpMenuCloseButton.style.top = '10px';
      helpMenuCloseButton.style.right = '10px';
      helpMenuCloseButton.style.zIndex = '1001';
      helpMenuCloseButton.onclick = () => {
        helpMenu.remove();
      };
      helpMenu.appendChild(helpMenuCloseButton);

      document.body.appendChild(helpMenu);
    } else {
      document.body.removeChild(document.body.lastChild);
    }
  }
  document.addEventListener('keydown', (event) => {
    if (event.key === 'F1') {
      parentContext.params.help = !parentContext.params.help;
      displayHelpMenu();
      event.preventDefault();
    }
  });
  keyInnerHTML += 'F1<br>';
  actionInnerHTML += 'Help<br>';

  let simulationFolder = parentContext.gui.addFolder("Simulation");

  // Add pause simulation checkbox.
  // Parameters:
  //  Under "Simulation" folder.
  //  Name: "Pause Simulation".
  //  When paused, a "pause" text in white is displayed in the top left corner.
  //  Can also be triggered by pressing the spacebar.
  const pauseSimulation = simulationFolder.add(parentContext.params, 'paused').name('Pause Simulation');
  pauseSimulation.onChange((value) => {
    if (value) {
      const pausedText = document.createElement('div');
      pausedText.style.position = 'absolute';
      pausedText.style.top = '10px';
      pausedText.style.left = '10px';
      pausedText.style.color = 'white';
      pausedText.style.font = 'normal 18px Arial';
      pausedText.innerHTML = 'pause';
      parentContext.container.appendChild(pausedText);
    } else {
      parentContext.container.removeChild(parentContext.container.lastChild);
    }
  });
  document.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
      parentContext.params.paused = !parentContext.params.paused;
      pauseSimulation.setValue(parentContext.params.paused);
      event.preventDefault();
    }
  });
  actionInnerHTML += 'Play / Pause<br>';
  keyInnerHTML += 'Space<br>';

  // Add reload model button.
  // Parameters:
  //  Under "Simulation" folder.
  //  Name: "Reload".
  //  When pressed, calls the reload function.
  //  Can also be triggered by pressing ctrl + L.
  simulationFolder.add({reload: () => { reload(); }}, 'reload').name('Reload');
  document.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.code === 'KeyL') { reload();  event.preventDefault(); }});
  actionInnerHTML += 'Reload XML<br>';
  keyInnerHTML += 'Ctrl L<br>';

  // Add reset simulation button.
  // Parameters:
  //  Under "Simulation" folder.
  //  Name: "Reset".
  //  When pressed, resets the simulation to the initial state.
  //  Can also be triggered by pressing backspace.
  const resetSimulation = () => {
    parentContext.simulation.resetData();
    parentContext.simulation.forward();
  };
  simulationFolder.add({reset: () => { resetSimulation(); }}, 'reset').name('Reset');
  document.addEventListener('keydown', (event) => {
    if (event.code === 'Backspace') { resetSimulation(); event.preventDefault(); }});
  actionInnerHTML += 'Reset simulation<br>';
  keyInnerHTML += 'Backspace<br>';

  // Add keyframe slider.
  let nkeys = parentContext.model.nkey;
  let keyframeGUI = simulationFolder.add(parentContext.params, "keyframeNumber", 0, nkeys - 1, 1).name('Load Keyframe').listen();
  keyframeGUI.onChange((value) => {
    if (value < parentContext.model.nkey) {
      parentContext.simulation.qpos.set(parentContext.model.key_qpos.slice(
        value * parentContext.model.nq, (value + 1) * parentContext.model.nq)); }});
  parentContext.updateGUICallbacks.push((model, simulation, params) => {
    let nkeys = parentContext.model.nkey;
    console.log("new model loaded. has " + nkeys + " keyframes.");
    if (nkeys > 0) {
      keyframeGUI.max(nkeys - 1);
      keyframeGUI.domElement.style.opacity = 1.0;
    } else {
      // Disable keyframe slider if no keyframes are available.
      keyframeGUI.max(0);
      keyframeGUI.domElement.style.opacity = 0.5;
    }
  });

  let textDecoder = new TextDecoder("utf-8");
  let nullChar    = textDecoder.decode(new ArrayBuffer(1));

  // Add sliders for ctrlnoiserate and ctrlnoisestd; min = 0, max = 2, step = 0.01.
  // simulationFolder.add(parentContext.params, 'ctrlnoiserate', 0.0, 2.0, 0.01).name('Noise rate' );
  // simulationFolder.add(parentContext.params, 'ctrlnoisestd' , 0.0, 2.0, 0.01).name('Noise scale');

  // Add actuator sliders.
  let actuatorFolder = simulationFolder.addFolder("Actuators");
  const addActuators = (model, simulation, params) => {
    let act_range = model.actuator_ctrlrange;
    let actuatorGUIs = [];
    for (let i = 0; i < model.nu; i++) {
      if (!model.actuator_ctrllimited[i]) { continue; }
      let name = textDecoder.decode(
        parentContext.model.names.subarray(
          parentContext.model.name_actuatoradr[i])).split(nullChar)[0];

      parentContext.params[name] = 0.0;
      let actuatorGUI = actuatorFolder.add(parentContext.params, name, act_range[2 * i], act_range[2 * i + 1], 0.01).name(name).listen();
      actuatorGUIs.push(actuatorGUI);
      actuatorGUI.onChange((value) => {
        simulation.ctrl[i] = value;
      });
    }
    return actuatorGUIs;
  };
  let actuatorGUIs = addActuators(parentContext.model, parentContext.simulation, parentContext.params);
  parentContext.updateGUICallbacks.push((model, simulation, params) => {
    for (let i = 0; i < actuatorGUIs.length; i++) {
      actuatorGUIs[i].destroy();
    }
    actuatorGUIs = addActuators(model, simulation, parentContext.params);
  });
  actuatorFolder.close();

  // Add function that resets the camera to the default position.
  // Can be triggered by pressing ctrl + A.
  document.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.code === 'KeyA') {
      // TODO: Use free camera parameters from MuJoCo
      parentContext.camera.position.set(2.0, 1.7, 1.7);
      parentContext.controls.target.set(0, 0.7, 0);
      parentContext.controls.update();
      event.preventDefault();
    }
  });
  actionInnerHTML += 'Reset free camera<br>';
  keyInnerHTML += 'Ctrl A<br>';

  parentContext.gui.open();
}


/** Loads a scene for MuJoCo
 * @param {mujoco} mujoco This is a reference to the mujoco namespace object
 * @param {string} filename This is the name of the .xml file in the /working/ directory of the MuJoCo/Emscripten Virtual File System
 * @param {MuJoCoDemo} parent The three.js Scene Object to add the MuJoCo model elements to
 */
export async function loadSceneFromURL(mujoco, filename, parent) {
    // Load in the state from XML.
    parent.model       = mujoco.Model.load_from_xml("/working/"+filename);
    parent.state       = new mujoco.State(parent.model);
    parent.simulation  = new mujoco.Simulation(parent.model, parent.state);

    let model = parent.model;
    let state = parent.state;
    let simulation = parent.simulation;

    // Decode the null-terminated string names.
    let textDecoder = new TextDecoder("utf-8");
    let fullString = textDecoder.decode(model.names);
    let names = fullString.split(textDecoder.decode(new ArrayBuffer(1)));

    // Create the root object.
    let mujocoRoot = new THREE.Group();
    mujocoRoot.name = "MuJoCo Root"
    parent.scene.add(mujocoRoot);

    /** @type {Object.<number, THREE.Group>} */
    let bodies = {};
    /** @type {Object.<number, THREE.BufferGeometry>} */
    let meshes = {};
    /** @type {THREE.Light[]} */
    let lights = [];

    // Default material definition.
    let material = new THREE.MeshPhysicalMaterial();
    material.color = new THREE.Color(1, 1, 1);

    // Loop through the MuJoCo geoms and recreate them in three.js.
    for (let g = 0; g < model.ngeom; g++) {
      // Only visualize geom groups up to 2 (same default behavior as simulate).
      if (!(model.geom_group[g] < 3)) { continue; }

      // Get the body ID and type of the geom.
      let b = model.geom_bodyid[g];
      let type = model.geom_type[g];
      let size = [
        model.geom_size[(g*3) + 0],
        model.geom_size[(g*3) + 1],
        model.geom_size[(g*3) + 2]
      ];

      // Create the body if it doesn't exist.
      if (!(b in bodies)) {
        bodies[b] = new THREE.Group();
        bodies[b].name = names[model.name_bodyadr[b]];
        bodies[b].bodyID = b;
        bodies[b].has_custom_mesh = false;
      }

      // Set the default geometry. In MuJoCo, this is a sphere.
      let geometry = new THREE.SphereGeometry(size[0] * 0.5);
      if (type == mujoco.mjtGeom.mjGEOM_PLANE.value) {
        // Special handling for plane later.
      } else if (type == mujoco.mjtGeom.mjGEOM_HFIELD.value) {
        // TODO: Implement this.
      } else if (type == mujoco.mjtGeom.mjGEOM_SPHERE.value) {
        geometry = new THREE.SphereGeometry(size[0]);
      } else if (type == mujoco.mjtGeom.mjGEOM_CAPSULE.value) {
        geometry = new THREE.CapsuleGeometry(size[0], size[1] * 2.0, 20, 20);
      } else if (type == mujoco.mjtGeom.mjGEOM_ELLIPSOID.value) {
        geometry = new THREE.SphereGeometry(1); // Stretch this below
      } else if (type == mujoco.mjtGeom.mjGEOM_CYLINDER.value) {
        geometry = new THREE.CylinderGeometry(size[0], size[0], size[1] * 2.0);
      } else if (type == mujoco.mjtGeom.mjGEOM_BOX.value) {
        geometry = new THREE.BoxGeometry(size[0] * 2.0, size[2] * 2.0, size[1] * 2.0);
      } else if (type == mujoco.mjtGeom.mjGEOM_MESH.value) {
        let meshID = model.geom_dataid[g];

        if (!(meshID in meshes)) {
          geometry = new THREE.BufferGeometry(); // TODO: Populate the Buffer Geometry with Generic Mesh Data

          let vertex_buffer = model.mesh_vert.subarray(
             model.mesh_vertadr[meshID] * 3,
            (model.mesh_vertadr[meshID]  + model.mesh_vertnum[meshID]) * 3);
          for (let v = 0; v < vertex_buffer.length; v+=3){
            //vertex_buffer[v + 0] =  vertex_buffer[v + 0];
            let temp             =  vertex_buffer[v + 1];
            vertex_buffer[v + 1] =  vertex_buffer[v + 2];
            vertex_buffer[v + 2] = -temp;
          }

          let normal_buffer = model.mesh_normal.subarray(
             model.mesh_vertadr[meshID] * 3,
            (model.mesh_vertadr[meshID]  + model.mesh_vertnum[meshID]) * 3);
          for (let v = 0; v < normal_buffer.length; v+=3){
            //normal_buffer[v + 0] =  normal_buffer[v + 0];
            let temp             =  normal_buffer[v + 1];
            normal_buffer[v + 1] =  normal_buffer[v + 2];
            normal_buffer[v + 2] = -temp;
          }

          let uv_buffer = model.mesh_texcoord.subarray(
             model.mesh_texcoordadr[meshID] * 2,
            (model.mesh_texcoordadr[meshID]  + model.mesh_vertnum[meshID]) * 2);
          let triangle_buffer = model.mesh_face.subarray(
             model.mesh_faceadr[meshID] * 3,
            (model.mesh_faceadr[meshID]  + model.mesh_facenum[meshID]) * 3);
          geometry.setAttribute("position", new THREE.BufferAttribute(vertex_buffer, 3));
          geometry.setAttribute("normal"  , new THREE.BufferAttribute(normal_buffer, 3));
          geometry.setAttribute("uv"      , new THREE.BufferAttribute(    uv_buffer, 2));
          geometry.setIndex    (Array.from(triangle_buffer));
          meshes[meshID] = geometry;
        } else {
          geometry = meshes[meshID];
        }

        bodies[b].has_custom_mesh = true;
      }
      // Done with geometry creation.

      // Set the Material Properties of incoming bodies
      let texture = undefined;
      let color = [
        model.geom_rgba[(g * 4) + 0],
        model.geom_rgba[(g * 4) + 1],
        model.geom_rgba[(g * 4) + 2],
        model.geom_rgba[(g * 4) + 3]];
      if (model.geom_matid[g] != -1) {
        let matId = model.geom_matid[g];
        color = [
          model.mat_rgba[(matId * 4) + 0],
          model.mat_rgba[(matId * 4) + 1],
          model.mat_rgba[(matId * 4) + 2],
          model.mat_rgba[(matId * 4) + 3]];

        // Construct Texture from model.tex_rgb
        texture = undefined;
        let texId = model.mat_texid[matId];
        if (texId != -1) {
          let width    = model.tex_width [texId];
          let height   = model.tex_height[texId];
          let offset   = model.tex_adr   [texId];
          let rgbArray = model.tex_rgb   ;
          let rgbaArray = new Uint8Array(width * height * 4);
          for (let p = 0; p < width * height; p++){
            rgbaArray[(p * 4) + 0] = rgbArray[offset + ((p * 3) + 0)];
            rgbaArray[(p * 4) + 1] = rgbArray[offset + ((p * 3) + 1)];
            rgbaArray[(p * 4) + 2] = rgbArray[offset + ((p * 3) + 2)];
            rgbaArray[(p * 4) + 3] = 1.0;
          }
          texture = new THREE.DataTexture(rgbaArray, width, height, THREE.RGBAFormat, THREE.UnsignedByteType);
          texture.repeat = new THREE.Vector2(1, 1);
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
          texture.magFilter = THREE.LinearFilter;
          texture.minFilter = THREE.LinearFilter;

          texture.needsUpdate = true;
        }
      }

      if (material.color.r != color[0] ||
          material.color.g != color[1] ||
          material.color.b != color[2] ||
          material.opacity != color[3] ||
          material.map     != texture) {
        material = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color(color[0], color[1], color[2]),
          transparent: color[3] < 1.0,
          opacity: color[3],
          specularIntensity: model.geom_matid[g] != -1 ?       model.mat_specular   [model.geom_matid[g]] * 0.5 : undefined,
          reflectivity     : model.geom_matid[g] != -1 ?       model.mat_reflectance[model.geom_matid[g]] : undefined,
          roughness        : model.geom_matid[g] != -1 ? 1.0 - model.mat_shininess  [model.geom_matid[g]] : undefined,
          metalness        : model.geom_matid[g] != -1 ? 0.1 : undefined,
          map              : texture
        });
      }

      let mesh = new THREE.Mesh();
      if (type == 0) {
        mesh = new Reflector( new THREE.PlaneGeometry( 100, 100 ), { clipBias: 0.003, texture: texture } );
        mesh.rotateX( - Math.PI / 2 );
      } else {
        mesh = new THREE.Mesh(geometry, material);
      }

      mesh.castShadow = g == 0 ? false : true;
      mesh.receiveShadow = type != 7;
      mesh.bodyID = b;
      bodies[b].add(mesh);
      getPosition  (model.geom_pos, g, mesh.position  );
      if (type != 0) { getQuaternion(model.geom_quat, g, mesh.quaternion); }
      if (type == 4) { mesh.scale.set(size[0], size[2], size[1]) } // Stretch the Ellipsoid
    }

       // Parse tendons.
       let tendonMat = new THREE.MeshPhongMaterial();
       tendonMat.color = new THREE.Color(0.8, 0.3, 0.3);
       mujocoRoot.cylinders = new THREE.InstancedMesh(
           new THREE.CylinderGeometry(1, 1, 1),
           tendonMat, 1023);
       mujocoRoot.cylinders.receiveShadow = true;
       mujocoRoot.cylinders.castShadow    = true;
       mujocoRoot.add(mujocoRoot.cylinders);
       mujocoRoot.spheres = new THREE.InstancedMesh(
           new THREE.SphereGeometry(1, 10, 10),
           tendonMat, 1023);
       mujocoRoot.spheres.receiveShadow = true;
       mujocoRoot.spheres.castShadow    = true;
       mujocoRoot.add(mujocoRoot.spheres);

    // Parse lights.
    for (let l = 0; l < model.nlight; l++) {
      let light = new THREE.SpotLight();
      if (model.light_directional[l]) {
        light = new THREE.DirectionalLight();
      } else {
        light = new THREE.SpotLight();
      }
      light.decay = model.light_attenuation[l] * 100;
      light.penumbra = 0.5;
      light.castShadow = true; // default false

      light.shadow.mapSize.width = 1024; // default
      light.shadow.mapSize.height = 1024; // default
      light.shadow.camera.near = 1; // default
      light.shadow.camera.far = 10; // default
      light.shadow.bias = -0.005;
      //bodies[model.light_bodyid()].add(light);
      if (bodies[0]) {
        bodies[0].add(light);
      } else {
        mujocoRoot.add(light);
      }
      lights.push(light);
    }
    if (model.nlight == 0) {
      let light = new THREE.DirectionalLight();
      mujocoRoot.add(light);
    }

    for (let b = 0; b < model.nbody; b++) {
      //let parent_body = model.body_parentid()[b];
      if (b == 0 || !bodies[0]) {
        mujocoRoot.add(bodies[b]);
      } else if(bodies[b]){
        bodies[0].add(bodies[b]);
      } else {
        console.log("Body without Geometry detected; adding to bodies", b, bodies[b]);
        bodies[b] = new THREE.Group(); bodies[b].name = names[b + 1]; bodies[b].bodyID = b; bodies[b].has_custom_mesh = false;
        bodies[0].add(bodies[b]);
      }
    }

    parent.mujocoRoot = mujocoRoot;

    return [model, state, simulation, bodies, lights]
}

/** Downloads the scenes/examples folder to MuJoCo's virtual filesystem
 * @param {mujoco} mujoco */
export async function downloadExampleScenesFolder(mujoco) {
  let allFiles = [
    "myo_sim/elbow/myo_test.xml",

    "myo_sim/basic/muscle_load.xml",
    "myo_sim/elbow/assets/myo_elbow_1dof6muscles_1dofexo_body.xml",
    "myo_sim/elbow/assets/myo_elbow_1dof6muscles_body.xml",
    "myo_sim/elbow/assets/myo_elbow_2dof6muscles_body.xml",
    "myo_sim/elbow/assets/myo_elbow_assets.xml",
    "myo_sim/elbow/elbow_1dof6muscles_1dofSoftexo_Ideal.xml",
    "myo_sim/elbow/elbow_1dof6muscles_1dofSoftexo_sim2.xml",
    "myo_sim/elbow/myo_elbow_1dof6muscles.xml",
    "myo_sim/elbow/myo_elbow_1dof6muscles_1dofexo.xml",
    "myo_sim/elbow/myo_elbow_2dof6muscles.xml",
    "myo_sim/finger/finger_v0.xml",
    "myo_sim/finger/motor_finger_v0.xml",
    "myo_sim/finger/myo_finger_v0.xml",
    "myo_sim/hand/assets/myo_hand_assets.xml",
    "myo_sim/hand/assets/myo_hand_body.xml",
    "myo_sim/hand/assets/myo_hand_body_TTrans.xml",
    "myo_sim/hand/myo_hand.xml",
    "myo_sim/meshes/1mc.stl",
    "myo_sim/meshes/2distph.stl",
    "myo_sim/meshes/2mc.stl",
    "myo_sim/meshes/2midph.stl",
    "myo_sim/meshes/2proxph.stl",
    "myo_sim/meshes/3distph.stl",
    "myo_sim/meshes/3mc.stl",
    "myo_sim/meshes/3midph.stl",
    "myo_sim/meshes/3proxph.stl",
    "myo_sim/meshes/4distph.stl",
    "myo_sim/meshes/4mc.stl",
    "myo_sim/meshes/4midph.stl",
    "myo_sim/meshes/4proxph.stl",
    "myo_sim/meshes/5distph.stl",
    "myo_sim/meshes/5mc.stl",
    "myo_sim/meshes/5midph.stl",
    "myo_sim/meshes/5proxph.stl",
    "myo_sim/meshes/arm_r_1mc.stl",
    "myo_sim/meshes/arm_r_2distph.stl",
    "myo_sim/meshes/arm_r_2mc.stl",
    "myo_sim/meshes/arm_r_2midph.stl",
    "myo_sim/meshes/arm_r_2proxph.stl",
    "myo_sim/meshes/arm_r_3distph.stl",
    "myo_sim/meshes/arm_r_3mc.stl",
    "myo_sim/meshes/arm_r_3midph.stl",
    "myo_sim/meshes/arm_r_3proxph.stl",
    "myo_sim/meshes/arm_r_4distph.stl",
    "myo_sim/meshes/arm_r_4mc.stl",
    "myo_sim/meshes/arm_r_4midph.stl",
    "myo_sim/meshes/arm_r_4proxph.stl",
    "myo_sim/meshes/arm_r_5distph.stl",
    "myo_sim/meshes/arm_r_5mc.stl",
    "myo_sim/meshes/arm_r_5midph.stl",
    "myo_sim/meshes/arm_r_5proxph.stl",
    "myo_sim/meshes/arm_r_capitate.stl",
    "myo_sim/meshes/arm_r_hamate.stl",
    "myo_sim/meshes/arm_r_humerus.stl",
    "myo_sim/meshes/arm_r_lunate.stl",
    "myo_sim/meshes/arm_r_pisiform.stl",
    "myo_sim/meshes/arm_r_radius.stl",
    "myo_sim/meshes/arm_r_scaphoid.stl",
    "myo_sim/meshes/arm_r_thumbdist.stl",
    "myo_sim/meshes/arm_r_thumbprox.stl",
    "myo_sim/meshes/arm_r_trapezium.stl",
    "myo_sim/meshes/arm_r_trapezoid.stl",
    "myo_sim/meshes/arm_r_triquetrum.stl",
    "myo_sim/meshes/arm_r_ulna.stl",
    "myo_sim/meshes/capitate.stl",
    "myo_sim/meshes/capitate_lvs.stl",
    "myo_sim/meshes/capitate_rvs.stl",
    "myo_sim/meshes/clavicle.stl",
    "myo_sim/meshes/fingers1.stl",
    "myo_sim/meshes/fingers12.stl",
    "myo_sim/meshes/fingers16.stl",
    "myo_sim/meshes/fingers17.stl",
    "myo_sim/meshes/fingers18mod61.stl",
    "myo_sim/meshes/fingers19mod13-24.stl",
    "myo_sim/meshes/fingers2.stl",
    "myo_sim/meshes/fingers3.stl",
    "myo_sim/meshes/fingers4.stl",
    "myo_sim/meshes/fingers8.stl",
    "myo_sim/meshes/ground_jaw.stl",
    "myo_sim/meshes/ground_r_clavicle.stl",
    "myo_sim/meshes/ground_r_scapula.stl",
    "myo_sim/meshes/ground_ribs.stl",
    "myo_sim/meshes/ground_skull.stl",
    "myo_sim/meshes/ground_spine.stl",
    "myo_sim/meshes/hamate.stl",
    "myo_sim/meshes/hamate_lvs.stl",
    "myo_sim/meshes/hamate_rvs.stl",
    "myo_sim/meshes/hand_2distph.stl",
    "myo_sim/meshes/hand_2midph.stl",
    "myo_sim/meshes/hand_2proxph.stl",
    "myo_sim/meshes/hat_jaw.stl",
    "myo_sim/meshes/hat_ribs_scap.stl",
    "myo_sim/meshes/hat_skull.stl",
    "myo_sim/meshes/hat_spine.stl",
    "myo_sim/meshes/human_highpoly.stl",
    "myo_sim/meshes/human_lowpoly.stl",
    "myo_sim/meshes/human_lowpoly_norighthand.stl",
    "myo_sim/meshes/humerus.stl",
    "myo_sim/meshes/humerus_lv.stl",
    "myo_sim/meshes/humerus_rv.stl",
    "myo_sim/meshes/index_distal_lvs.stl",
    "myo_sim/meshes/index_distal_rvs.stl",
    "myo_sim/meshes/index_medial_lvs.stl",
    "myo_sim/meshes/index_medial_rvs.stl",
    "myo_sim/meshes/index_proximal_lvs.stl",
    "myo_sim/meshes/index_proximal_rvs.stl",
    "myo_sim/meshes/l_bofoot.stl",
    "myo_sim/meshes/l_femur.stl",
    "myo_sim/meshes/l_fibula.stl",
    "myo_sim/meshes/l_foot.stl",
    "myo_sim/meshes/l_patella.stl",
    "myo_sim/meshes/l_pelvis.stl",
    "myo_sim/meshes/l_talus.stl",
    "myo_sim/meshes/l_tibia.stl",
    "myo_sim/meshes/little_distal_lvs.stl",
    "myo_sim/meshes/little_distal_rvs.stl",
    "myo_sim/meshes/little_medial_lvs.stl",
    "myo_sim/meshes/little_medial_rvs.stl",
    "myo_sim/meshes/little_proximal_lvs.stl",
    "myo_sim/meshes/little_proximal_rvs.stl",
    "myo_sim/meshes/lunate.stl",
    "myo_sim/meshes/lunate_lvs.stl",
    "myo_sim/meshes/lunate_rvs.stl",
    "myo_sim/meshes/metacarpal1_lvs.stl",
    "myo_sim/meshes/metacarpal1_rvs.stl",
    "myo_sim/meshes/metacarpal2_lvs.stl",
    "myo_sim/meshes/metacarpal2_rvs.stl",
    "myo_sim/meshes/metacarpal3_lvs.stl",
    "myo_sim/meshes/metacarpal3_rvs.stl",
    "myo_sim/meshes/metacarpal4_lvs.stl",
    "myo_sim/meshes/metacarpal4_rvs.stl",
    "myo_sim/meshes/metacarpal5_lvs.stl",
    "myo_sim/meshes/metacarpal5_rvs.stl",
    "myo_sim/meshes/middle_distal_lvs.stl",
    "myo_sim/meshes/middle_distal_rvs.stl",
    "myo_sim/meshes/middle_medial_lvs.stl",
    "myo_sim/meshes/middle_medial_rvs.stl",
    "myo_sim/meshes/middle_proximal_lvs.stl",
    "myo_sim/meshes/middle_proximal_rvs.stl",
    "myo_sim/meshes/movaxesfin104.stl",
    "myo_sim/meshes/movaxesfin117.stl",
    "myo_sim/meshes/movaxesfin133.stl",
    "myo_sim/meshes/movaxesfin143.stl",
    "myo_sim/meshes/movaxesfin158.stl",
    "myo_sim/meshes/movaxesfin515.stl",
    "myo_sim/meshes/movaxesfin623.stl",
    "myo_sim/meshes/movaxesfin76.stl",
    "myo_sim/meshes/movaxesfin91.stl",
    "myo_sim/meshes/pisiform.stl",
    "myo_sim/meshes/pisiform_lvs.stl",
    "myo_sim/meshes/pisiform_rvs.stl",
    "myo_sim/meshes/r_bofoot.stl",
    "myo_sim/meshes/r_cap.stl",
    "myo_sim/meshes/r_femur.stl",
    "myo_sim/meshes/r_fibula.stl",
    "myo_sim/meshes/r_foot.stl",
    "myo_sim/meshes/r_ham.stl",
    "myo_sim/meshes/r_lun.stl",
    "myo_sim/meshes/r_patella.stl",
    "myo_sim/meshes/r_pelvis.stl",
    "myo_sim/meshes/r_pis.stl",
    "myo_sim/meshes/r_scaph.stl",
    "myo_sim/meshes/r_talus.stl",
    "myo_sim/meshes/r_tibia.stl",
    "myo_sim/meshes/r_triq.stl",
    "myo_sim/meshes/r_trpzd.stl",
    "myo_sim/meshes/r_trpzm.stl",
    "myo_sim/meshes/radius.stl",
    "myo_sim/meshes/radius_lv.stl",
    "myo_sim/meshes/radius_rv.stl",
    "myo_sim/meshes/ring_distal_lvs.stl",
    "myo_sim/meshes/ring_distal_rvs.stl",
    "myo_sim/meshes/ring_medial_lvs.stl",
    "myo_sim/meshes/ring_medial_rvs.stl",
    "myo_sim/meshes/ring_proximal_lvs.stl",
    "myo_sim/meshes/ring_proximal_rvs.stl",
    "myo_sim/meshes/sacrum.stl",
    "myo_sim/meshes/scaphoid.stl",
    "myo_sim/meshes/scaphoid_lvs.stl",
    "myo_sim/meshes/scaphoid_rvs.stl",
    "myo_sim/meshes/scapula.stl",
    "myo_sim/meshes/thorax.stl",
    "myo_sim/meshes/thumb_distal_lvs.stl",
    "myo_sim/meshes/thumb_distal_rvs.stl",
    "myo_sim/meshes/thumb_proximal_lvs.stl",
    "myo_sim/meshes/thumb_proximal_rvs.stl",
    "myo_sim/meshes/thumbdist.stl",
    "myo_sim/meshes/thumbprox.stl",
    "myo_sim/meshes/torso_lowpoly.stl",
    "myo_sim/meshes/trapezium.stl",
    "myo_sim/meshes/trapezium_lvs.stl",
    "myo_sim/meshes/trapezium_rvs.stl",
    "myo_sim/meshes/trapezoid.stl",
    "myo_sim/meshes/trapezoid_lvs.stl",
    "myo_sim/meshes/trapezoid_rvs.stl",
    "myo_sim/meshes/triquetrum.stl",
    "myo_sim/meshes/triquetrum_lvs.stl",
    "myo_sim/meshes/triquetrum_rvs.stl",
    "myo_sim/meshes/ulna.stl",
    "myo_sim/meshes/ulna_lv.stl",
    "myo_sim/meshes/ulna_rv.stl",
    "myo_sim/scene/floor0.png",
    "myo_sim/scene/myosuite_logo.obj",
    "myo_sim/scene/myosuite_logo.png",
    "myo_sim/scene/myosuite_logo.xml",
    "myo_sim/scene/myosuite_scene.obj",
    "myo_sim/scene/myosuite_scene.png",
    "myo_sim/scene/myosuite_scene.xml",
    "myo_sim/scene/myosuite_scene_noFloor.obj",
    "myo_sim/scene/myosuite_scene_noFloor.png",
    "myo_sim/scene/myosuite_scene_noFloor_noPedestal.obj",
    "myo_sim/scene/myosuite_scene_noPedestal.xml",
    "myo_sim/scene/myosuite_warning.png",
  ];

  let requests = allFiles.map((url) => fetch("./examples/scenes/" + url));
  let responses = await Promise.all(requests);
  for (let i = 0; i < responses.length; i++) {
      let split = allFiles[i].split("/");
      let working = '/working/';
      for (let f = 0; f < split.length - 1; f++) {
          working += split[f];
          if (!mujoco.FS.analyzePath(working).exists) { mujoco.FS.mkdir(working); }
          working += "/";
      }

      if (allFiles[i].endsWith(".png") || allFiles[i].endsWith(".stl") || allFiles[i].endsWith(".skn")) {
          mujoco.FS.writeFile("/working/" + allFiles[i], new Uint8Array(await responses[i].arrayBuffer()));
      } else {
          mujoco.FS.writeFile("/working/" + allFiles[i], await responses[i].text());
      }
  }
}

/** Access the vector at index, swizzle for three.js, and apply to the target THREE.Vector3
 * @param {Float32Array|Float64Array} buffer
 * @param {number} index
 * @param {THREE.Vector3} target */
export function getPosition(buffer, index, target, swizzle = true) {
  if (swizzle) {
    return target.set(
       buffer[(index * 3) + 0],
       buffer[(index * 3) + 2],
      -buffer[(index * 3) + 1]);
  } else {
    return target.set(
       buffer[(index * 3) + 0],
       buffer[(index * 3) + 1],
       buffer[(index * 3) + 2]);
  }
}

/** Access the quaternion at index, swizzle for three.js, and apply to the target THREE.Quaternion
 * @param {Float32Array|Float64Array} buffer
 * @param {number} index
 * @param {THREE.Quaternion} target */
export function getQuaternion(buffer, index, target, swizzle = true) {
  if (swizzle) {
    return target.set(
      -buffer[(index * 4) + 1],
      -buffer[(index * 4) + 3],
       buffer[(index * 4) + 2],
      -buffer[(index * 4) + 0]);
  } else {
    return target.set(
       buffer[(index * 4) + 0],
       buffer[(index * 4) + 1],
       buffer[(index * 4) + 2],
       buffer[(index * 4) + 3]);
  }
}

/** Converts this Vector3's Handedness to MuJoCo's Coordinate Handedness
 * @param {THREE.Vector3} target */
export function toMujocoPos(target) { return target.set(target.x, -target.z, target.y); }

/** Standard normal random number generator using Box-Muller transform */
export function standardNormal() {
  return Math.sqrt(-2.0 * Math.log( Math.random())) *
         Math.cos ( 2.0 * Math.PI * Math.random()); }
