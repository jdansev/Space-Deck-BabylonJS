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
	var cam = new BABYLON.ArcRotateCamera('OrbitCamera', 0, 0, 0, new BABYLON.Vector3(0, 0, 0), scene);
	cam.position = new BABYLON.Vector3(0, 5, -50);
	cam.setTarget(new BABYLON.Vector3(0, 0, 0));
	cam.wheelPrecision = 0.1;
	cam.lowerRadiusLimit = 500.0;
	cam.upperRadiusLimit = 1150.0;
	return cam;
}

function setOrbitTarget(pos) {
	orbitCamera.setTarget(pos);
}






let enablePointerLock = function () {
	canvas.requestPointerLock = canvas.requestPointerLock || canvas.msRequestPointerLock || canvas.mozRequestPointerLock || canvas.webkitRequestPointerLock;
	if (canvas.requestPointerLock) {
		canvas.requestPointerLock();
	}
};

let disablePointerLock = function () {
	document.exitPointerLock = document.exitPointerLock || document.msRequestPointerLock || document.mozExitPointerLock || document.webkitRequestPointerLock;
	if (document.exitPointerLock) {
		document.exitPointerLock();
	}
}

let attachPointerLockClickEvent = function () {
	canvas.addEventListener('click', enablePointerLock, false);
}

let detachPointerLockClickEvent = function () {
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
	cam.keysUp.push(87); // W
	cam.keysDown.push(83) // D
	cam.keysLeft.push(65); // A
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



var meshClickEvent = function (evt) {
	console.log('clicked event triggered');
	console.log(evt);
}


var ground = BABYLON.Mesh.CreateGround('floor', 30, 30, 1, scene, false);
var groundMaterial = new BABYLON.StandardMaterial('groundMaterial', scene);
ground.material = groundMaterial;
ground.diffuse = new BABYLON.Color3(0.5, 0.5, 0.5);
ground.receiveShadows = true;
ground.actionManager = new BABYLON.ActionManager(scene);
ground.actionManager.registerAction(
	new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, meshClickEvent)
);


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
var planetLightSphere = new BABYLON.MeshBuilder.CreateSphere('planetLightSphere', {
	diameter: 10
}, scene);

var planetEmissive = new BABYLON.StandardMaterial('planetEmissive1', scene);
planetEmissive.emissiveColor = new BABYLON.Color3(1.0, 1.0, 1.0);
planetLightSphere.material = planetEmissive;

planetLightSphere.setEnabled(false);

var planetLight = new BABYLON.DirectionalLight('planet_light', new BABYLON.Vector3(0, 1, 0), scene);
planetLight.diffuse = new BABYLON.Color3(0.5, 0.5, 0.5);
planetLight.specular = new BABYLON.Color3(1, 1, 1);
planetLight.intensity = 8.5;


var planetTN = new BABYLON.TransformNode('planetTN');
BABYLON.SceneLoader.ImportMesh(null, 'models/', 'mercury.glb', scene, function (meshes) {
	meshes.forEach(mesh => {
		// leave meshes already parented to maintain model hierarchy:
		if (!mesh.parent) {
			mesh.parent = planetTN;
		}
	});


	planetTN.position = new BABYLON.Vector3(250, -180, 1000); // good
	planetTN.rotation.y = Math.PI / 2;
	planetTN.scaling = new BABYLON.Vector3(45, 45, 45);

	setOrbitTarget(planetTN.position);


	var planetTNPosition = Object.assign({}, planetTN.position); // assign value not reference in javascript

	planetLightSphere.position = planetTNPosition;
	planetLightSphere.position.y = planetTNPosition.y + 50;
	planetLightSphere.position.x = planetTNPosition.x + 400;
	planetLightSphere.position.z = planetTNPosition.z + 165;

	planetLight.position = planetLightSphere.position;

	planetLightSphere.setEnabled(true);

	var direction = planetLight.setDirectionToTarget(planetTN.position);

	console.log(direction);




	var planetMeshes = planetTN.getChildMeshes();
	for (var planetMesh of planetMeshes) {
		planetMesh.actionManager = new BABYLON.ActionManager(scene);
		planetMesh.actionManager.registerAction(
			new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, () => {
				// highlightMesh('spaceStationTN');
			})
		);
		planetMesh.actionManager.registerAction(
			new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOutTrigger, () => {
				// unhighlightMesh();
			})
		);
		planetMesh.actionManager.registerAction(
			new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, () => {
				setOrbitTarget(planetTN.position);
			})
		);
	}

});




// star
var starTN = new BABYLON.TransformNode('starTN');
BABYLON.SceneLoader.ImportMesh(null, 'models/', 'star.glb', scene, function (meshes) {
	meshes.forEach(mesh => {
		// leave meshes already parented to maintain model hierarchy:
		if (!mesh.parent) {
			mesh.parent = starTN;
		}
	});

	var starGL = new BABYLON.GlowLayer('starGL', scene);
	starGL.intensity = 0.8;

	var starMeshes = starTN.getChildMeshes();
	for (var starMesh of starMeshes) {
		starGL.addIncludedOnlyMesh(starMesh);
	}

	starTN.position = new BABYLON.Vector3(3000, 500, 2000);
	starTN.scaling = new BABYLON.Vector3(3, 3, 3);



	var lensFlareSystem = new BABYLON.LensFlareSystem("lensFlareSystem", starTN, scene);
	
	// on light source
	var flare04 = new BABYLON.LensFlare(0.38, 0.998, new BABYLON.Color3(0.98, 0.92, 0.50), "images/flare4.jpg", lensFlareSystem);
	// radial
	var flare11_40 = new BABYLON.LensFlare(0.20, 0.998, new BABYLON.Color3(1.0, 1.0, 1.0), "images/flare11-40.jpg", lensFlareSystem);

	// huge
	var flare10_3 = new BABYLON.LensFlare(0.72, 0.85, new BABYLON.Color3(1.0, 1.0, 1.0), "images/flare10-3.jpg", lensFlareSystem);
	// big far 1
	var flare10_5 = new BABYLON.LensFlare(0.31, 0.79, new BABYLON.Color3(0.45, 0.83, 1.0), "images/flare10-5.jpg", lensFlareSystem);

	// rainbow flare
	var flare03 = new BABYLON.LensFlare(0.48, 0.92, new BABYLON.Color3(1.0, 1.0, 1.0), "images/flare3.jpg", lensFlareSystem);
	
	// big far 2
	var flare10_8 = new BABYLON.LensFlare(0.38, 0.68, new BABYLON.Color3(0.79, 0.86, 1.0), "images/flare10-8.jpg", lensFlareSystem);

	// small blue
	var flare10_45_blue = new BABYLON.LensFlare(0.06, 0.47, new BABYLON.Color3(0.39, 0.40, 1.0), "images/flare10-38.jpg", lensFlareSystem);
	// small green
	var flare10_45_green = new BABYLON.LensFlare(0.04, 0.39, new BABYLON.Color3(0.31, 1.0, 0.34), "images/flare10-38.jpg", lensFlareSystem);


	// slightly green
	var flare10_8 = new BABYLON.LensFlare(0.11, 0.27, new BABYLON.Color3(0.23, 0.82, 0.94), "images/flare10-16.jpg", lensFlareSystem);

	// smaller green
	var flare10_45_green = new BABYLON.LensFlare(0.021, 0.10, new BABYLON.Color3(0.57, 1.0, 0.62), "images/flare10-24.jpg", lensFlareSystem);

	// closest
	var flare10_8 = new BABYLON.LensFlare(0.037, 0.02, new BABYLON.Color3(0.76, 1.0, 0.92), "images/flare10-16.jpg", lensFlareSystem);

});




// space station
var spaceStationTN = new BABYLON.TransformNode('spaceStationTN');
BABYLON.SceneLoader.ImportMesh(null, 'models/', 'space_station.glb', scene, function (meshes) {
	meshes.forEach(mesh => {
		// leave meshes already parented to maintain model hierarchy:
		if (!mesh.parent) {
			mesh.parent = spaceStationTN;
		}
	});
	spaceStationTN.position = new BABYLON.Vector3(-185, 32, 500);
	spaceStationTN.scaling = new BABYLON.Vector3(0.06, 0.06, 0.06);
	spaceStationTN.rotation.y = Math.PI / 2 * -0.1;

	var spaceStationMeshes = spaceStationTN.getChildMeshes();
	for (var spaceStationMesh of spaceStationMeshes) {
		spaceStationMesh.actionManager = new BABYLON.ActionManager(scene);
		spaceStationMesh.actionManager.registerAction(
			new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, () => {
				highlightMesh('spaceStationTN');
			})
		);
		spaceStationMesh.actionManager.registerAction(
			new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOutTrigger, () => {
				unhighlightMesh();
			})
		);
		spaceStationMesh.actionManager.registerAction(
			new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, () => {
				setOrbitTarget(spaceStationTN.position);
			})
		);
	}


});




// galaxy
var galaxyTN = new BABYLON.TransformNode('galaxyTN');
BABYLON.SceneLoader.ImportMesh(null, 'models/', 'galaxy.glb', scene, function (meshes) {
	meshes.forEach(mesh => {
		// leave meshes already parented to maintain model hierarchy:
		if (!mesh.parent) {
			mesh.parent = galaxyTN;
		}
	});
	galaxyTN.setPivotMatrix(BABYLON.Matrix.Translation(114, -114, 114), false);
	galaxyTN.scaling = galaxyTN.scaling.multiply(new BABYLON.Vector3(22, 10, 22));
	galaxyTN.position = new BABYLON.Vector3(80, -10, 3800);
	galaxyTN.rotation.x = Math.PI / 2 * -0.1;

});



// black hole
// var blackHoleTN = new BABYLON.TransformNode('blackHolTN');
// BABYLON.SceneLoader.ImportMesh(null, 'models/', 'black_hole.glb', scene, function (meshes) {
// 	meshes.forEach(mesh => {
// 		// leave meshes already parented to maintain model hierarchy:
// 		if (!mesh.parent) {
// 			mesh.parent = blackHoleTN;
// 		}
// 	});
// 	blackHoleTN.scaling = blackHoleTN.scaling.multiply(new BABYLON.Vector3(1, 1, 1));
// 	blackHoleTN.position = new BABYLON.Vector3(2000, -45, 0);
// 	blackHoleTN.rotation.z = Math.PI / 180 * 1.8;
// });



var lampPostRoot = new BABYLON.TransformNode('lampPostTN');
var light = null;
var lampPostGL = new BABYLON.GlowLayer('lampPostGL', scene);

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

	lampPostGL.intensity = 0.5;
	lampPostGL.addIncludedOnlyMesh(lightTip);

	light = new BABYLON.PointLight('light_omni', new BABYLON.Vector3(0, 0, 0), scene);
	light.range = 50;
	light.parent = lightTip;

	var lightStand = scene.getMeshByName('light_stand');
	var lightStandMaterial = new BABYLON.StandardMaterial('light_stand_material', scene);
	lightStand.material = lightStandMaterial;

	var shadowGenerator = new BABYLON.ShadowGenerator(1024, light);
	shadowGenerator.getShadowMap().renderList.push(lightStand);
	shadowGenerator.useContactHardeningShadow = true;
	shadowGenerator.contactHardeningLightSizeUVRatio = 0.05;
	shadowGenerator.setDarkness(0.2);

	planetLight.excludedMeshes.push(lightTip);
	planetLight.excludedMeshes.push(lightStand);
});





planetLight.excludedMeshes.push(ground);





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




var selectionHL = null;
var highlightMesh = function (nodeName) {
	var tn = scene.getNodeByName(nodeName);
	var meshes = tn.getChildMeshes();

	if (selectionHL != null) selectionHL.dispose();

	selectionHL = new BABYLON.HighlightLayer(`${tn.name}HL`, scene);
	selectionHL.outerGlow = true;
	selectionHL.innerGlow = false;
	selectionHL.blurHorizontalSize = 0.8;
	selectionHL.blurVerticalSize = 0.8;

	for (var mesh of meshes) {
		selectionHL.addMesh(mesh, new BABYLON.Color3(1.0, 1.0, 1.0));
	}
}
var unhighlightMesh = function () {
	if (selectionHL != null) selectionHL.dispose();
}


var nodeIndex = 0;
var nodesToHighlight = [
	'spaceStationTN',
	// 'planetTN',
	'lampPostTN',
	// 'galaxyTN',
];
var getNodeToHighlight = () => nodesToHighlight[(nodeIndex++) % nodesToHighlight.length];


/* Keyboard Events */
scene.actionManager = new BABYLON.ActionManager(scene);
scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, (evt) => {
	if (evt.sourceEvent.key == 'e') {
		toggleLamp();
	}
	if (evt.sourceEvent.key == 'c') {
		toggleCamera();
	}
	if (evt.sourceEvent.key == 'x') {
		console.log('executing command');

		var nodeName = getNodeToHighlight();
		console.log(nodeName);

		// highlightMesh(nodeName);

	}
}));





// Game/Render loop - Do on every frame
scene.onBeforeRenderObservable.add(() => {
	// rotate galaxy
	galaxyTN.addRotation(0.0, 0.00018, 0.0);
	// rotate planet
	planetTN.rotation.y += 0.0003;
});



//When click event is raised
window.addEventListener("click", function () {
	// We try to pick an object
	var pickResult = scene.pick(scene.pointerX, scene.pointerY);
	// if the click hits the wall object, we change the impact picture position
	if (pickResult.hit) {
		console.log(pickResult.pickedMesh);
	}
});




var lampIsOn = true;


function turnOnLamp() {
	// turn on the light
	var lightMaterial = scene.getMaterialByName('emissive1');
	lightMaterial.emissiveColor = new BABYLON.Color3(1.0, 1.0, 0.7);

	var lightTip = scene.getMeshByName('light_tip');
	lampPostGL.addIncludedOnlyMesh(lightTip);

	var omniLight = scene.getLightByName('light_omni');
	omniLight.range = 50;

	deselectLampPost();
}

function turnOffLamp() {
	// turn off the light
	var lightMaterial = scene.getMaterialByName('emissive1');
	lightMaterial.emissiveColor = new BABYLON.Color3(0, 0, 0);

	var lightTip = scene.getMeshByName('light_tip');
	lampPostGL.removeIncludedOnlyMesh(lightTip);

	var omniLight = scene.getLightByName('light_omni');
	omniLight.range = 0;

	selectLampPost();
}

var toggleLamp = function () {
	if (lampIsOn) {
		turnOffLamp();
		lampIsOn = false;
	} else {
		turnOnLamp();
		lampIsOn = true;
	}
}




var setCameraFPS = function () {
	orbitCamera.detachControl(canvas);
	scene.activeCamera = fpsCamera;
	fpsCamera.attachControl(canvas, true);

	enablePointerLock();
	attachPointerLockClickEvent();
};

var setCamOrbit = function () {
	fpsCamera.detachControl(canvas);
	scene.activeCamera = orbitCamera;
	orbitCamera.attachControl(canvas, true);

	disablePointerLock();
	detachPointerLockClickEvent();
};


var cameraIsOrbit = true;
var toggleCamera = function () {
	if (cameraIsOrbit) {
		setCameraFPS();
		cameraIsOrbit = false;
	} else {
		setCamOrbit();
		cameraIsOrbit = true;
	}
}



// check if WebGL is supported on the current browser
if (!BABYLON.Engine.isSupported()) {
	// not supported
}


setCamOrbit();


var renderLoop = function () {
	scene.render();
};
engine.runRenderLoop(renderLoop);