

const QUALITY_LOW = 127;
const QUALITY_HIGH = 2048;
// const QUALITY = QUALITY_LOW;
const QUALITY = QUALITY_HIGH;


var engine, scene, camera;

var canvas = document.getElementById('renderCanvas');
engine = new BABYLON.Engine(canvas);


scene = new BABYLON.Scene(engine);
scene.clearColor = new BABYLON.Color3.Black; // black
scene.gravity = new BABYLON.Vector3(0, -0.9, 0);




// create the camera and set it's initial location
camera = new BABYLON.UniversalCamera('camera', new BABYLON.Vector3(0, 5, -5), scene);

// intertia when moving and rotating the camera
camera.inertia = 0.7;

// affects the speed only when moving
camera.speed = 0.5;

// sensitivity of camera rotation when the mouse is moved
camera.angularSensibility = 5000;

// then apply collisions and gravity to the active camera
camera.checkCollisions = true;
camera.applyGravity = true;
camera._needMoveForGravity = true;

// set the ellipsoid around the camera (e.g. your player's size)
camera.ellipsoid = new BABYLON.Vector3(1, 1.75, 1);



// keyboard events
var inputMap = {};
scene.actionManager = new BABYLON.ActionManager(scene);
scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, function (evt) {
	inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == 'keydown';
}));
scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, function (evt) {
	inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == 'keydown';
}));


// configure the camera to respond to the WASD keys
camera.keysUp.push(87);    // W
camera.keysDown.push(83)   // D
camera.keysLeft.push(65);  // A
camera.keysRight.push(68); // S



var ground = BABYLON.Mesh.CreateGround('floor', 30, 30, 1, scene, false);
ground.receiveShadows = true;


// enable Collisions
scene.collisionsEnabled = true;
ground.checkCollisions = true;



// show the default loader until the hdr is done loading
var promise = new Promise((resolve, reject) => {
	try {
		engine.displayLoadingUI();

		var skybox = BABYLON.MeshBuilder.CreateBox('SkyBox', {size: 3000.0}, scene);
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
}, (err) => {
	console.error(err);
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
	galaxyRoot.scaling = galaxyRoot.scaling.multiply(new BABYLON.Vector3(3, 2, 3));
	galaxyRoot.position = new BABYLON.Vector3(80, 25, 500);
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
	blackHoleRoot.scaling = blackHoleRoot.scaling.multiply(new BABYLON.Vector3(2, 2, 2));
	blackHoleRoot.position = new BABYLON.Vector3(-80, -55, -300);
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
	if (evt.sourceEvent.key == 'c') {

	}
}));





// Game/Render loop - Do on every frame
scene.onBeforeRenderObservable.add(() => {

	// automatically deselect the box if player moves out of selection range
	if (selected && selected.name == 'light_stand') {
		var dist = BABYLON.Vector3.Distance(camera.position, lampPostRoot.position);

		if (dist > MIN_SELECT_DISTANCE) {
			selectHl.removeMesh(selected);
			selected = null;
		}
	}


	// rotate galaxy
	galaxyRoot.rotation.y += 0.0002;
	// galaxyRoot.rotation.x += 0.005;

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





let createPointerLock = function (scene) {
	engine.isPointerLock = true;
	canvas.addEventListener('click', event => {
		canvas.requestPointerLock = canvas.requestPointerLock || canvas.msRequestPointerLock || canvas.mozRequestPointerLock || canvas.webkitRequestPointerLock;
		if (canvas.requestPointerLock) {
			canvas.requestPointerLock();

			// only allow camera control once pointer lock is enabled
			camera.attachControl(canvas, false);
			
		}
	}, false);
};

// check if WebGL is supported on the current browser
if (!BABYLON.Engine.isSupported()) {
	// not supported
}


createPointerLock();



var renderLoop = function () {
    scene.render();
};
engine.runRenderLoop(renderLoop);




