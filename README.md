# Interstellar Observation Deck

Recently I've noticed that 3D related graphics (games, virtual sims, etc.) were less prevalent on the web than their desktop counterparts. The few that do, existed in the form of short demos and mini games. I was intrigued and put together this scene to explore the capabilities of 3D graphics on the web. I used [BabylonJS](https://www.babylonjs.com/) which is a 3D engine for JavaScript that comes with very good documentation and framework tools. The models used in this project were sourced from [Sketchfab](https://sketchfab.com/).

![Screenshot 1](screenshot1.png) ![Screenshot 2](screenshot2.png)

### Technologies and Tools Used
* BabylonJS
* NodeJS
* HTML, CSS, JavaScript
* Blender for editing/preparing the 3D models

### Instructions
Move: `w a s d`  
Toggle night lamp on/off: `e`  
Toggle between first person and orbit view: `c`  
Select the spaceship or the planet while in orbit mode to switch between orbit objects

### Setup
To run this project, install it locally using npm:  
```
npm install
npx http-server
```

Go to http://localhost:8080

### Note
* May take a while to load the textures and assets.
* Because BabylonJS uses WebGL, a decent GPU is recommended.
