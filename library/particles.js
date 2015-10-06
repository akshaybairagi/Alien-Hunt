/*
particleEffect
-----
A particle stream effect

*/
function particleEffect(
  x, y, 
  spriteFunction,
  numberOfParticles ,
  gravity,
  randomSpacing,
  minAngle, maxAngle,
  minSize, maxSize, 
  minSpeed, maxSpeed,
  minScaleSpeed, maxScaleSpeed,
  minAlphaSpeed, maxAlphaSpeed,
  minRotationSpeed, maxRotationSpeed
) {
  var 	x = (typeof x !== 'undefined')? x : 0,
		y = (typeof y !== 'undefined')? y : 0,
		numberOfParticles = (typeof numberOfParticles !== 'undefined')? numberOfParticles : 10,
		spriteFunction = (typeof spriteFunction !== 'undefined')? spriteFunction : function() { return circle(10, "red"); },
		gravity = (typeof gravity !== 'undefined')? gravity : 0,
		randomSpacing = (typeof randomSpacing !== 'undefined')? randomSpacing : true,
		minAngle = (typeof minAngle !== 'undefined')? minAngle : 0,
		maxAngle = (typeof maxAngle !== 'undefined')? maxAngle : 6.28,
		minSize = (typeof minSize !== 'undefined')? minSize : 4,
		maxSize = (typeof maxSize !== 'undefined')? maxSize : 16,
		minSpeed = (typeof minSpeed !== 'undefined')? minSpeed : 0.1,
		maxSpeed = (typeof maxSpeed !== 'undefined')? maxSpeed : 1,
		minScaleSpeed = (typeof minScaleSpeed !== 'undefined')? minScaleSpeed : 0.01,
		maxScaleSpeed = (typeof maxScaleSpeed !== 'undefined')? maxScaleSpeed : 0.05,
		minAlphaSpeed = (typeof minAlphaSpeed !== 'undefined')? minAlphaSpeed : 0.02,
		maxAlphaSpeed = (typeof maxAlphaSpeed !== 'undefined')? maxAlphaSpeed : 0.02,
		minRotationSpeed = (typeof minRotationSpeed !== 'undefined')? minRotationSpeed : 0.01,
		maxRotationSpeed = (typeof maxRotationSpeed !== 'undefined')? maxRotationSpeed : 0.03;
		
		
  //`randomFloat` and `randomInt` helper functions
  var randomFloat = function(min, max){ return min + Math.random() * (max - min);},
      randomInt = function(min, max){ return Math.floor(Math.random() * (max - min + 1)) + min;};

  //An array to store the angles
  var angles = [];

  //A variable to store the current particle's angle
  var angle;

  //Figure out by how many radians each particle should be separated
  var spacing = (maxAngle - minAngle) / (numberOfParticles - 1);

  //Create an angle value for each particle and push that
  //value into the `angles` array
  for(var i = 0; i < numberOfParticles; i++) {

    //If `randomSpacing` is `true`, give the particle any angle
    //value between `minAngle` and `maxAngle`
    if (randomSpacing) {
      angle = randomFloat(minAngle, maxAngle);
      angles.push(angle);
    } 
    
    //If `randomSpacing` is `false`, space each particle evenly,
    //starting with the `minAngle` and ending with the `maxAngle`
    else {
      if (angle === undefined) angle = minAngle;
      angles.push(angle);
      angle += spacing;
    }
  }

  //Make a particle for each angle
  angles.forEach(makeParticle);

  //Make the particle
  function makeParticle(angle) {

    //Create the particle using the supplied sprite function
    var particle = spriteFunction();

    //Display a random frame if the particle has more than 1 frame
    if (particle.frames.length > 0) {
      particle.gotoAndStop(randomInt(0, particle.frames.length - 1));
    }

    //Set the x and y position
    particle.x = x - particle.halfWidth;
    particle.y = y - particle.halfHeight;

    //Set a random width and height
    var size = randomInt(minSize, maxSize);
    particle.width = size;
    particle.height = size;

    //Set a random speed to change the scale, alpha and rotation
    particle.scaleSpeed = randomFloat(minScaleSpeed, maxScaleSpeed);
    particle.alphaSpeed = randomFloat(minAlphaSpeed, maxAlphaSpeed);
    particle.rotationSpeed = randomFloat(minRotationSpeed, maxRotationSpeed);

    //Set a random velocity at which the particle should move
    var speed = randomFloat(minSpeed, maxSpeed);
    particle.vx = speed * Math.cos(angle);
    particle.vy = speed * Math.sin(angle);

    //The particle's `update` method is called on each frame of the
    //game loop
    particle.update = function(){

      //Add gravity
      particle.vy += gravity;

      //Move the particle
      particle.x += particle.vx;
      particle.y += particle.vy;

      //Change the particle's `scale`
      if (particle.scaleX - particle.scaleSpeed > 0) {
        particle.scaleX -= particle.scaleSpeed;
      }
      if (particle.scaleY - particle.scaleSpeed > 0) {
        particle.scaleY -= particle.scaleSpeed;
      }

      //Change the particle's rotation
      particle.rotation += particle.rotationSpeed;

      //Change the particle's `alpha`
      particle.alpha -= particle.alphaSpeed;

      //Remove the particle if its `alpha` reaches zero
      if (particle.alpha <= 0) {
        remove([particle]);
        particles.splice(particles.indexOf(particle), 1);
      }
    };

    //Push the particle into the `particles` array
    //The `particles` array needs to be updated by the game loop each
    //frame
    particles.push(particle);
  }
}

function emitter(interval, particleFunction) {
	var emitter = {},
	timerInterval = undefined;
	emitter.playing = false;
	function play() {
	if (!emitter.playing) {
		particleFunction();
		timerInterval = setInterval(emitParticle.bind(this), interval);
		emitter.playing = true;
	}
	}
	function stop() {
		if (emitter.playing) {
			clearInterval(timerInterval);
			emitter.playing = false;
		}
	}
	function emitParticle() {
		particleFunction();
	}
	emitter.play = play;
	emitter.stop = stop;
	return emitter;
}