

const QUALITY_LOW = 127;
const QUALITY_HIGH = 2048;
// const QUALITY = QUALITY_LOW;
const QUALITY = QUALITY_HIGH;


var engine, scene;

var fpsCamera, orbitCamera;
var lastCamPos = new BABYLON.Vector3.Zero();

var canvas = document.getElementById('renderCanvas');
engine = new BABYLON.Engine(canvas);


scene = new BABYLON.Scene(engine);
scene.clearColor = new BABYLON.Color3.Black; // black
scene.gravity = new BABYLON.Vector3(0, -0.9, 0);






/* Cameras */

function createArcCam() {
	var cam =  new BABYLON.ArcRotateCamera('OrbitCamera', 0, 0, 0, new BABYLON.Vector3(0, 0, 0), scene);
	cam.position = new BABYLON.Vector3(0, 5, -50);
	cam.setTarget(new BABYLON.Vector3(0, 0, 0));
	return cam;
}

function setOrbitTarget(pos) {
	orbitCamera.setTarget(pos);
}


let enablePointerLock = function() {
	canvas.requestPointerLock = canvas.requestPointerLock || canvas.msRequestPointerLock || canvas.mozRequestPointerLock || canvas.webkitRequestPointerLock;
	if (canvas.requestPointerLock) {
		canvas.requestPointerLock();
	}
};

let disablePointerLock = function() {
	document.exitPointerLock = document.exitPointerLock || document.msRequestPointerLock || document.mozExitPointerLock || document.webkitRequestPointerLock;
	if (document.exitPointerLock) {
		document.exitPointerLock();
	}
}

let attachPointerLockClickEvent = function() {
	canvas.addEventListener('click', enablePointerLock, false);
}

let detachPointerLockClickEvent = function() {
	canvas.removeEventListener('click', enablePointerLock, false);
}


function createFPSCam() {
	// create the camera and set it's initial location
	var cam = new BABYLON.UniversalCamera('FPSCamera', new BABYLON.Vector3(0, 5, -5), scene);

	// intertia when moving and rotating the camera
	cam.inertia = 0.7;

	// affects the speed only when moving
	cam.speed = 0.5;

	// sensitivity of camera rotation when the mouse is moved
	cam.angularSensibility = 5000;

	// then apply collisions and gravity to the active camera
	cam.checkCollisions = true;
	cam.applyGravity = true;
	cam._needMoveForGravity = true;

	// set the ellipsoid around the camera (e.g. your player's size)
	cam.ellipsoid = new BABYLON.Vector3(1, 1.75, 1);

	// configure the camera to respond to the WASD keys
	cam.keysUp.push(87);    // W
	cam.keysDown.push(83)   // D
	cam.keysLeft.push(65);  // A
	cam.keysRight.push(68); // S

	return cam;
}


orbitCamera = createArcCam();
fpsCamera = createFPSCam();





// keyboard events
var inputMap = {};
scene.actionManager = new BABYLON.ActionManager(scene);
scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, function (evt) {
	inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == 'keydown';
}));
scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, function (evt) {
	inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == 'keydown';
}));






var ground = BABYLON.Mesh.CreateGround('floor', 30, 30, 1, scene, false);
ground.receiveShadows = true;


// enable Collisions
scene.collisionsEnabled = true;
ground.checkCollisions = true;


var skybox = null;
// show the default loader until the hdr is done loading
var promise = new Promise((resolve, reject) => {
	try {
		engine.displayLoadingUI();

		skybox = BABYLON.MeshBuilder.CreateBox('SkyBox', {size: 10000.0}, scene);
		var skyboxMaterial = new BABYLON.StandardMaterial('skyBox', scene);
		skyboxMaterial.backFaceCulling = false;

		/* HDRCubeTexture
			https://doc.babylonjs.com/how_to/reflect#hdrcubetexture
			https://www.babylonjs-playground.com/#114YPX#5
		*/
		skyboxMaterial.reflectionTexture = new BABYLON.HDRCubeTexture('images/space.hdr', scene, QUALITY, false, false, false, false, function() {
			resolve('skybox loaded');
		});
		skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
		skybox.material = skyboxMaterial;

		

	} catch (err) {
		reject(err);
	}
});


promise.then((res) => {
	engine.hideLoadingUI();
	console.log(res);

	planetLight.excludedMeshes.push(skybox);

}, (err) => {
	console.error(err);
});



// planet
var planetLightSphere = new BABYLON.MeshBuilder.CreateSphere('planetLightSphere', { diameter: 10 }, scene);

var planetEmissive = new BABYLON.StandardMaterial('planetEmissive1', scene);
planetEmissive.emissiveColor = new BABYLON.Color3(1.0, 1.0, 1.0);
planetLightSphere.material = planetEmissive;

var planetLight = new BABYLON.DirectionalLight("planet_light", new BABYLON.Vector3(0, 1, 0), scene);
planetLight.diffuse = new BABYLON.Color3(0.5, 0.5, 0.5);
planetLight.specular = new BABYLON.Color3(1, 1, 1);
planetLight.intensity = 3.5;


var planetRoot = new BABYLON.TransformNode('planet_root');
BABYLON.SceneLoader.ImportMesh(null, 'models/', 'mercury.glb', scene, function (meshes) {
	meshes.forEach(mesh => {
		// leave meshes already parented to maintain model hierarchy:
		if (!mesh.parent) {
			mesh.parent = planetRoot;
		}
	});


	planetRoot.position = new BABYLON.Vector3(250, -180, 1000); // good
	planetRoot.scaling = new BABYLON.Vector3(45, 45, 45);

	setOrbitTarget(planetRoot.position);




	var planetRootPosition = Object.assign({}, planetRoot.position); // assign value not reference in javascript

	planetLightSphere.position = planetRootPosition;
	planetLightSphere.position.y = planetRootPosition.y + 200;
	planetLightSphere.position.x = planetRootPosition.x + 400;
	planetLightSphere.position.z = planetRootPosition.z + 200;

	planetLight.position = planetLightSphere.position;

	var direction = planetLight.setDirectionToTarget(planetRoot.position);

	console.log(direction);
	
});










// galaxy
var galaxyRoot = new BABYLON.TransformNode('galaxy_root');
BABYLON.SceneLoader.ImportMesh(null, 'models/', 'galaxy.glb', scene, function (meshes) {
	meshes.forEach(mesh => {
		// leave meshes already parented to maintain model hierarchy:
		if (!mesh.parent) {
			mesh.parent = galaxyRoot;
		}
	});
	galaxyRoot.setPivotMatrix(BABYLON.Matrix.Translation(114, -114, 114), false);
	galaxyRoot.scaling = galaxyRoot.scaling.multiply(new BABYLON.Vector3(22, 10, 22));
	galaxyRoot.position = new BABYLON.Vector3(80, -10, 3800);
	galaxyRoot.rotation.x = Math.PI/2 * -0.1;
});



// black hole
var blackHoleRoot = new BABYLON.TransformNode('black_hole_root');
BABYLON.SceneLoader.ImportMesh(null, 'models/', 'black_hole.glb', scene, function (meshes) {
	meshes.forEach(mesh => {
		// leave meshes already parented to maintain model hierarchy:
		if (!mesh.parent) {
			mesh.parent = blackHoleRoot;
		}
	});
	blackHoleRoot.scaling = blackHoleRoot.scaling.multiply(new BABYLON.Vector3(1, 1, 1));
	blackHoleRoot.position = new BABYLON.Vector3(2000, -45, 0);
	blackHoleRoot.rotation.z = Math.PI/2 * 0.03;
});



var lampPostRoot = new BABYLON.TransformNode('lamp_post');
var light = null;

// The first parameter can be used to specify which mesh to import. Here we import all meshes
BABYLON.SceneLoader.ImportMesh(null, 'models/', 'light_post.gltf', scene, function (meshes) {

	var lampMesh = meshes;

	meshes.forEach(mesh => {
		// leave meshes already parented to maintain model hierarchy:
		if (!mesh.parent) {
			mesh.parent = lampPostRoot;
		}
	});

	lampMesh.position = new BABYLON.Vector3(0, -2.45, 0);

	var lightTip = scene.getMeshByName('light_tip');

	var emissiveMaterial = new BABYLON.StandardMaterial('emissive1', scene);
	emissiveMaterial.emissiveColor = new BABYLON.Color3(1.0, 1.0, 0.7);
	lightTip.material = emissiveMaterial;

	light = new BABYLON.PointLight('light_omni', new BABYLON.Vector3(0, 0, 0), scene);
	light.range = 50;
	light.parent = lightTip;

	var hl = new BABYLON.HighlightLayer('light_hl', scene);
	hl.innerGlow = true;
	hl.addMesh(lightTip, new BABYLON.Color3(1.0, 1.0, 0.7));
	hl.blurHorizontalSize = 1.0;
	hl.blurVerticalSize = 1.0;

	var lightStand = scene.getMeshByName('light_stand');
	var lightStandMaterial = new BABYLON.StandardMaterial('light_stand_material', scene);
	lightStand.material = lightStandMaterial;

	var shadowGenerator = new BABYLON.ShadowGenerator(1024, light);
	shadowGenerator.getShadowMap().renderList.push(lightStand);
	shadowGenerator.useContactHardeningShadow = true;
	shadowGenerator.contactHardeningLightSizeUVRatio = 0.05;
	shadowGenerator.setDarkness(0.2);
		
});





planetLight.excludedMeshes.push(ground);



const MIN_SELECT_DISTANCE = 30;


var selectHl = new BABYLON.HighlightLayer('selectedHl', scene);
selectHl.innerGlow = true;
selectHl.outerGlow = false;
selectHl.blurHorizontalSize = 1.2;
selectHl.blurVerticalSize = 1.2;

function selectLampPost() {
	var lightTip = scene.getMeshByName('light_tip');
	var lightStand = scene.getMeshByName('light_stand');
	selectHl.addMesh(lightTip, new BABYLON.Color3.White);
	selectHl.addMesh(lightStand, new BABYLON.Color3.White);
}

function deselectLampPost() {
	var lightTip = scene.getMeshByName('light_tip');
	var lightStand = scene.getMeshByName('light_stand');
	selectHl.removeMesh(lightTip);
	selectHl.removeMesh(lightStand);
}




var selected = null;
var pointerCacheA = new BABYLON.Vector2(0, 0);
var pointerCacheB = new BABYLON.Vector2(0, 0);
var pointerMoveLimit = 8;



// toggle the lamp with the 'e' key
scene.actionManager = new BABYLON.ActionManager(scene);
scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, (evt) => {
	if (evt.sourceEvent.key == 'e') {
		toggleLamp();
	}
	if (evt.sourceEvent.key == 'f') {
		setCamUniversal();
	}
	if (evt.sourceEvent.key == 'r') {
		setCamArcRotate();
	}

	if (evt.sourceEvent.key == 'p') {
		console.log('p pressed');

	}

	
}));





// Game/Render loop - Do on every frame
scene.onBeforeRenderObservable.add(() => {

	// automatically deselect the box if player moves out of selection range
	// if (selected && selected.name == 'light_stand') {
	// 	var dist = BABYLON.Vector3.Distance(camera.position, lampPostRoot.position);

	// 	if (dist > MIN_SELECT_DISTANCE) {
	// 		selectHl.removeMesh(selected);
	// 		selected = null;
	// 	}
	// }


	// rotate galaxy
	galaxyRoot.rotation.y += 0.00018;

	// rotate planet
	planetRoot.rotation.y += 0.0003;

	// orbit camera direction vector
	// var orbitDirection = BABYLON.Vector3.Normalize(orbitCamera.target.subtract(orbitCamera.position));
	// console.log(orbitDirection);

});








var lampIsOn = true;


function turnOnLamp() {
	// turn on the light
	var lightMaterial = scene.getMaterialByName('emissive1');
	lightMaterial.emissiveColor = new BABYLON.Color3(1.0, 1.0, 0.7);

	var lightHl = scene.getHighlightLayerByName('light_hl');
	var lightTip = scene.getMeshByName('light_tip');
	lightHl.addMesh(lightTip, new BABYLON.Color3(1.0, 1.0, 0.7));

	var omniLight = scene.getLightByName('light_omni');
	omniLight.range = 50;

	deselectLampPost();
}

function turnOffLamp() {
	// turn off the light
	var lightMaterial = scene.getMaterialByName('emissive1');
	lightMaterial.emissiveColor = new BABYLON.Color3(0, 0, 0);

	var lightHl = scene.getHighlightLayerByName('light_hl');
	var lightTip = scene.getMeshByName('light_tip');
	lightHl.removeMesh(lightTip);

	var omniLight = scene.getLightByName('light_omni');
	omniLight.range = 0;

	selectLampPost();
}

function toggleLamp() {
	if (lampIsOn) {
		turnOffLamp();
		lampIsOn = false;
	} else {
		turnOnLamp();
		lampIsOn = true;
	}
}


scene.onPointerObservable.add(function(evt) {

	switch(evt.type){

		case BABYLON.PointerEventTypes.POINTERDOWN:

			pointerCacheA.copyFromFloats(evt.event.clientX, evt.event.clientY);
			break;

		case BABYLON.PointerEventTypes.POINTERUP:
			pointerCacheB.copyFromFloats(evt.event.clientX, evt.event.clientY);

			if (BABYLON.Vector2.Distance(pointerCacheA, pointerCacheB) > pointerMoveLimit)
				return;

			// if the lamp was clicked multiple times
			if (selected) {

				if (selected.name == 'light_stand') {

					toggleLamp();
					
				}

			}
			else if (evt.pickInfo.hit && evt.pickInfo.pickedMesh && evt.event.button === 0){
				selected = evt.pickInfo.pickedMesh;

				if (selected.name == 'light_stand') {

					var dist = BABYLON.Vector3.Distance(camera.position, selected.position);

					if (dist <= MIN_SELECT_DISTANCE) {
						console.log(`lamp_post distance: ${dist}`);

						break;
					} else {
						console.log('lamp_post not within range');
					}

				} else {
					
					selected = null;

				}

				// else
				selected = null;

			}
			break;

	}
}, BABYLON.PointerEventTypes.POINTERDOWN + BABYLON.PointerEventTypes.POINTERUP);



var setCamUniversal = function() {
	orbitCamera.attachControl(canvas, false);

	scene.activeCamera = fpsCamera;
	fpsCamera.attachControl(canvas, true);

	enablePointerLock();
	attachPointerLockClickEvent();
};
var setCamArcRotate = function() {
	fpsCamera.attachControl(canvas, false);

	scene.activeCamera = orbitCamera;

	orbitCamera.attachControl(canvas, true);

	disablePointerLock();
	detachPointerLockClickEvent();
};





// check if WebGL is supported on the current browser
if (!BABYLON.Engine.isSupported()) {
	// not supported
}


setCamArcRotate();


var renderLoop = function () {
    scene.render();
};
engine.runRenderLoop(renderLoop);




