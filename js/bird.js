function Bird(name, scene) {
  this.name         = name;
  this.scene        = scene;
  this.sphere       = BABYLON.Mesh.CreateCylinder(name, 0.5, 0, 0.5, 10, scene);
  this.velocity     = BABYLON.Vector3.Zero();
  this.acceleration = BABYLON.Vector3.Zero();
  this.material     = new BABYLON.StandardMaterial(name + "_material", scene);
  this.sphere.material = this.material;
  
  this.addForce = function(force) {
    this.acceleration.addInPlace(force);
  }
  
  this.randomRange = function(min, max) {
    min = typeof min !== 'undefined' ? min : -20
    max = typeof max !== 'undefined' ? max : 20
    return Math.random() * (max - min) + min;
  }
  
  this.randomize = function() {
    this.sphere.position.x = this.randomRange();
    this.sphere.position.y = this.randomRange();
    this.sphere.position.z = this.randomRange();
  };
  
  this.x = function() { return this.sphere.position.x; }
  this.y = function() { return this.sphere.position.y; }
  this.z = function() { return this.sphere.position.z; }
  
  this.isCloserThan = function(bird, distance) {
    if(bird.name == this.name) return false;
    return this.distanceTo(bird) < distance;
  }
  
  this.distanceTo = function(bird) {
    return BABYLON.Vector3.Distance(this.sphere.position, bird.sphere.position);
  }
  
  this.seek = function(target) {
    var desired = target.subtract(this.sphere.position);
    
    // Scale to maximum speed
    desired.normalize();
    desired.multiplyInPlace(vector(MAX_SPEED));
    
    // Steering = Desired - Velocity
    var steer = desired.subtract(this.velocity);
    
    // Limit to maximum force
    return BABYLON.Vector3.Minimize(steer, vector(MAX_FORCE));
  }
  
  this.separate = function(flock, neighbourhood, weight) {
    // Initialize values
    var steer = BABYLON.Vector3.Zero();
    var count = 0;

    // Check if birds are too close
    for(i in flock) {
      if(this.isCloserThan(flock[i], neighbourhood)) {
        diff = this.sphere.position.subtract(flock[i].sphere.position);
        diff.normalize();
        diff = diff.divide(vector(this.distanceTo(flock[i])));
        steer.addInPlace(diff);
        count += 1;
      }
    }
    
    if(count == 0) return;

    steer = steer.divide(vector(count));
    
    // Scale to maximum speed
    steer.normalize();
    steer.multiplyInPlace(vector(MAX_SPEED));
    
    // Steering = Desired - Velocity
    steer = steer.subtract(this.velocity);
    
    // Limit to maximum force
    var separation = BABYLON.Vector3.Minimize(steer, vector(MAX_FORCE));
    separation = separation.multiply(vector(weight));
    this.addForce(separation);
  }
  
  this.align = function(flock, neighbourhood, weight) {
    // Initialize values
    var average = new BABYLON.Vector3.Zero();
    var count = 0;
    
    // Sum up velocities in neighbourhood
    for(i in flock) {
      if(this.isCloserThan(flock[i], neighbourhood)) {
        count += 1;
        average.addInPlace(flock[i].velocity);
      }
    }
    
    // Seek to the average or do nothing
    if(count == 0) return;

    average = average.divide(vector(count));

    average.normalize();
    average.multiplyInPlace(vector(MAX_SPEED));
    
    steer = average.subtract(this.velocity);

    // Limit to maximum force
    alignment = BABYLON.Vector3.Minimize(steer, vector(MAX_FORCE));

    alignment = alignment.multiply(vector(weight));
    this.addForce(alignment);
  }
  
  this.cohesion = function(flock, neighbourhood, weight) {
    // Initialize values
    var average = new BABYLON.Vector3.Zero();
    var count = 0;

    // Sum up positions in neighbourhood
    for(i in flock) {
      if(this.isCloserThan(flock[i], neighbourhood)) {
        count += 1;
        average.addInPlace(flock[i].sphere.position);
      }
    }

    // Seek to the average or do nothing
    if(count == 0) return;

    average = average.divide(vector(count));

    cohesion = this.seek(average);   
    cohesion = cohesion.multiply(vector(weight));

    this.addForce(cohesion);
  }
  
  this.hunt = function(flock) {
    var closest = null;
    var min_distance = Infinity;
    
    for(i in flock) {
      this_distance = this.distanceTo(flock[i]);
      
      if(this_distance < min_distance) {
        closest = flock[i];
        min_distance = this_distance;
      }
    }
    
    if(!closest) return;
    
    if(this.sphere.intersectsMesh(closest.sphere, false)) {
      flock.splice(flock.indexOf(closest), 1);
      closest.sphere.dispose();
    } else {
      // Seek to the average or do nothing
      var acceleration = this.seek(closest.sphere.position);
      this.addForce(acceleration);
    }
  }
  
  this.updateFlight = function(max_velocity) {
    // Update velocity
    this.velocity.addInPlace(this.acceleration);
    
    // Limit speed
    this.velocity = BABYLON.Vector3.Minimize(this.velocity, vector(max_velocity));
    
    // Update position
    this.sphere.position.addInPlace(this.velocity);
    
    // Reset acceleration
    this.acceleration = BABYLON.Vector3.Zero();
    
    // Limit position
    var x = this.x();
    var y = this.y();
    var z = this.z();

    switch(MODE) {
      case "TRIM": x = trim(x); y = trim(y); z = trim(z); break;
      case "WRAP": x = wrap(x); y = wrap(y); z = wrap(z); break;
    }

    this.sphere.position = new BABYLON.Vector3(x, y, z)
  }
}