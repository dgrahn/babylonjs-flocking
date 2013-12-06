var BIRD_COUNT = 40;
var BIRD_MAX_VELOCITY = 0.1;
var BIRD_ALIGN_NEIGHBOURHOOD    = 20;
var BIRD_COHESION_NEIGHBOURHOOD = 20;
var BIRD_SEPARATE_NEIGHBOURHOOD = 4;
var BIRD_ALIGN_WEIGHT  = 0.5;
var BIRD_COHESION_WEIGHT   = 1.0;
var BIRD_SEPARATE_WEIGHT = 2.0;
var HAWK_COUNT = 5;
var HAWK_MAX_VELOCITY      = 0.10;
var HAWK_SEPARATE_NEIGHBOURHOOD = 10;
var HAWK_SEPARATE_WEIGHT = 3.0;
var MAX = +20;
var MIN = -20;
var RANGE = MAX - MIN;
var BIRDS = [];
var HAWKS = [];
var MAX_SPEED = 0.15;
var MAX_FORCE = 0.01;

var MODE = "WRAP";

function updateGlobals() {
  BIRD_COUNT                  = parseFloat($('input[name=bird_count]').val());
  BIRD_MAX_VELOCITY           = parseFloat($('input[name=bird_max_velocity]').val());
  BIRD_ALIGN_NEIGHBOURHOOD    = parseFloat($('input[name=bird_align_neighbourhood]').val());
  BIRD_COHESION_NEIGHBOURHOOD = parseFloat($('input[name=bird_cohesion_neighbourhood]').val());
  BIRD_SEPARATE_NEIGHBOURHOOD = parseFloat($('input[name=bird_separate_neighbourhood]').val());
  BIRD_ALIGN_WEIGHT           = parseFloat($('input[name=bird_align_weight]').val());
  BIRD_COHESION_WEIGHT        = parseFloat($('input[name=bird_cohesion_weight]').val());
  BIRD_SEPARATE_WEIGHT        = parseFloat($('input[name=bird_separate_weight]').val());
  HAWK_COUNT                  = parseFloat($('input[name=hawk_count]').val());
  HAWK_MAX_VELOCITY           = parseFloat($('input[name=hawk_max_velocity]').val());
  HAWK_SEPARATE_NEIGHBOURHOOD = parseFloat($('input[name=hawk_separate_neighbourhood]').val());
  HAWK_SEPARATE_WEIGHT        = parseFloat($('input[name=hawk_separate_weight]').val());
  MAX                         = parseFloat($('input[name=max]').val());
  MIN                         = parseFloat($('input[name=min]').val());
  MAX_SPEED                   = parseFloat($('input[name=max_speed]').val());
  MAX_FORCE                   = parseFloat($('input[name=max_force]').val());
}

function destroyFlocks() {
  for(i in BIRDS) {
    BIRDS[i].sphere.dispose();
  }
  
  for(i in HAWKS) {
    HAWKS[i].sphere.dispose();
  }
}

function createFlocks(scene) {
  // Create Birds 
  for(i = 0; i < BIRD_COUNT; i++) {
    var bird = new Bird("Bird-" + i, scene);
    bird.sphere.material.diffuseColor = new BABYLON.Color3(0, 1, 0);
    bird.randomize();
    BIRDS[i] = bird;
  }
  
  // Create Hawks
  for(i = 0; i < HAWK_COUNT; i++) {
    var hawk = new Bird("Hawk-" + i, scene);
    hawk.sphere.material.diffuseColor = new BABYLON.Color3(1, 0, 0);
    hawk.randomize();
    HAWKS[i] = hawk;
  }
}


function vector(value) {
  return new BABYLON.Vector3(value, value, value);
}

function trim(value, min, max) {
  min = (typeof min === "undefined") ? MIN : min;
  max = (typeof max === "undefined") ? MAX : max;

  value = Math.min(value, max);
  value = Math.max(value, min);
  return value;
}

function wrap(value) {
  if(MAX < value) value = value - RANGE;
  if(value < MIN) value = value + RANGE;
  return value;
}

$(document).ready(function() {
  // Setup the Environment
  var canvas = document.getElementById("renderCanvas");
  var engine = new BABYLON.Engine(canvas, true);
  var scene  = new BABYLON.Scene(engine);
  
  //Creation of the scene 
  var scene = new BABYLON.Scene(engine);

  // Create a light
  var ambient = new BABYLON.HemisphericLight("Hemi0", new BABYLON.Vector3(0, 1, 0), scene);
  ambient.diffuse     = new BABYLON.Color3(1, 1, 1);
  ambient.specular    = new BABYLON.Color3(1, 1, 1);
  ambient.groundColor = new BABYLON.Color3(0, 0, 0); 

  //Adding of the Arc Rotate Camera
  var camera = new BABYLON.ArcRotateCamera("Camera", 0, 0.8, 100, new BABYLON.Vector3.Zero(), scene);
  scene.activeCamera.attachControl(canvas);

  // Create Flocks
  createFlocks(scene);
  
  // Restart callback
  $("#restart").click(function() {
    destroyFlocks();
    createFlocks(scene);
  });
  
  // Change Mode CallBack
  $('.modes a').click(function() {
    $('.modes li').removeClass('active');
    $(this).parent().addClass('active');
    MODE = $(this).attr('href').slice(1).toUpperCase();
  });
  
  // Create boundary box
  box = BABYLON.Mesh.CreateBox("BoundaryBox", RANGE, scene);
  box.material = new BABYLON.StandardMaterial("BoundaryBox-Material", scene);
  box.material.wireframe = true;
  
  engine.runRenderLoop(function() {
    updateGlobals();

    for(var i in BIRDS) {
      BIRDS[i].separate(BIRDS, BIRD_SEPARATE_NEIGHBOURHOOD, BIRD_SEPARATE_WEIGHT);
      BIRDS[i].align   (BIRDS, BIRD_ALIGN_NEIGHBOURHOOD,    BIRD_ALIGN_WEIGHT);
      BIRDS[i].cohesion(BIRDS, BIRD_COHESION_NEIGHBOURHOOD, BIRD_COHESION_WEIGHT);

      BIRDS[i].separate(HAWKS, 10.0, 3.0);
      BIRDS[i].updateFlight(BIRD_MAX_VELOCITY);
    }
    
    for(var i in HAWKS) {
      HAWKS[i].separate(HAWKS, HAWK_SEPARATE_NEIGHBOURHOOD, HAWK_SEPARATE_WEIGHT);
      HAWKS[i].hunt(BIRDS);
      HAWKS[i].updateFlight(HAWK_MAX_VELOCITY);
    }

    if(MODE == "NONE") {
      camera.target = BIRDS[0].sphere.position;
    } else {
      camera.target = new BABYLON.Vector3.Zero();
    }

    scene.render();
  });
  
  // Resize
  $(window).resize(function() {
    engine.resize();
  });
});