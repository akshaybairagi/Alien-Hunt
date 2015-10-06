//Easing functions

//Linear
var linear = function(x){ return x; };

//Smoothstep
var smoothstep =  function(x){ return x * x * (3 - 2 * x);};
var smoothstepSquared =  function(x) { return Math.pow((x * x * (3 - 2 * x)), 2);};
var smoothstepCubed =  function(x) { return Math.pow((x * x * (3 - 2 * x)), 3);};

//Acceleration
var acceleration =  function(x) { return x * x;};
var accelerationCubed =  function(x) { return Math.pow(x * x, 3);};

//Deceleration
var deceleration =  function(x) { return 1 - Math.pow(1 - x, 2);};
var decelerationCubed =  function(x) { return 1 - Math.pow(1 - x, 3);};
//Sine
var sine =  function(x) { return Math.sin(x * Math.PI / 2);};
var sineSquared =  function(x) { return Math.pow(Math.sin(x * Math.PI / 2), 2);};
var sineCubed =  function(x) { return Math.pow(Math.sin(x * Math.PI / 2), 2);};
var inverseSine =  function(x) { return 1 - Math.sin((1 - x) * Math.PI / 2);};
var inverseSineSquared =  function(x) { return 1 - Math.pow(Math.sin((1 - x) * Math.PI / 2), 2);};
var inverseSineCubed =  function(x) { return 1 - Math.pow(Math.sin((1 - x) * Math.PI / 2), 3);};
//`sineComplete` uses the whole sine curve, and the effect is the same as
//smoothstep, but more computationally expensive.
var sineComplete =  function(x) { return 0.5 - Math.cos(-x * Math.PI) * 0.5;};

//Weighted average
//Good to use if the destination value is changing dynamically
//arguments: 
//`p`: sprite property, 
//`d`: destination value, 
//`w`: amount to weight (5 to 50 is a good range of values to start with)
var weightedAverage = function(p, d, w) { return ((p * (w - 1)) + d) / w; };

//Spline
//An implementation of Catmull-Rom spline
//arguments:
//t: ratio
//p0 to p3: points along the path
var spline = function(t, a, b, c, d){
  return 0.5 * (
    (2 * b) +
    (-a + c) * t +
    (2 * a - 5 * b + 4 * c - d) * t * t +
    (-a + 3 * b - 3 * c + d) * t * t * t
  );
}

//Bezier curve
function cubicBezier(t, a, b, c, d) {
    var t2 = t * t;
    var t3 = t2 * t;
    return a  
      + (-a * 3 + t * (3 * a - a * t)) * t
      + (3 * b + t * (-6 * b + b * 3 * t)) * t 
      + (c * 3 - c * 3 * t) * t2 + d * t3;
}


var ease = {

  //Linear
  linear: function(x) {return x;},

  //Smoothstep
  smoothstep: function(x) {return x * x * (3 - 2 * x);},
  smoothstepSquared: function(x) {return Math.pow((x * x * (3 - 2 * x)), 2);},
  smoothstepCubed: function(x) {return Math.pow((x * x * (3 - 2 * x)), 3);},

  //Acceleration
  acceleration: function(x) {return x * x;},
  accelerationCubed: function(x) {return Math.pow(x * x, 3);},

  //Deceleration
  deceleration: function(x) {return 1 - Math.pow(1 - x, 2);},
  decelerationCubed: function(x) {return 1 - Math.pow(1 - x, 3);},

  //Sine
  sine: function(x) {return Math.sin(x * Math.PI / 2);},
  sineSquared: function(x) {return Math.pow(Math.sin(x * Math.PI / 2), 2);},
  sineCubed: function(x) {return Math.pow(Math.sin(x * Math.PI / 2), 2);},
  inverseSine: function(x) {return 1 - Math.sin((1 - x) * Math.PI / 2);},
  inverseSineSquared: function(x) {return 1 - Math.pow(Math.sin((1 - x) * Math.PI / 2), 2);},
  inverseSineCubed: function(x) {return 1 - Math.pow(Math.sin((1 - x) * Math.PI / 2), 3);},

  //Spline
  spline: function(t, p0, p1, p2, p3) {
    return 0.5 * (
      (2 * p1) +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t
    );
  }
};

	function tweenProperty(
			sprite, //The sprite object
			property, //The property to tween (a string)
			startValue, //Tween start value
			endValue, //Tween end value
			totalFrames, //Duration in frames
			type, //The easing type
			yoyo, //Yoyo?
			delayBeforeRepeat //Delay in milliseconds before repeating
		) {
			
		// Assign default values
		var 
			type = checkIfUndefined(type,["smoothstep"]),
			yoyo = checkIfUndefined(yoyo,false),
			delayBeforeRepeat = checkIfUndefined(delayBeforeRepeat,0);
			
		//Create the tween object
		var o = {};
		//If the tween is a spline, set the
		//start and end magnitude values
		if(type[0] === "spline" ){
			o.startMagnitude = type[1];
			o.endMagnitude = type[2];
		}
		//Use `o.start` to make a new tween using the current
		//end point values
		o.start = function(startValue, endValue){
			//Clone the start and end values so that any possible references to sprite
			//properties are converted to ordinary numbers
			o.startValue = JSON.parse(JSON.stringify(startValue));
			o.endValue = JSON.parse(JSON.stringify(endValue));
			o.playing = true;
			o.totalFrames = totalFrames;
			o.frameCounter = 0;
			//Add the tween to the global `tweens` array. The `tweens` array is
			//updated on each frame
			tweens.push(o);
		};
		//Call `o.start` to start the tween
		o.start(startValue, endValue);
		//The `update` method will be called on each frame by the game loop.
		//This is what makes the tween move
		o.update = function(){
			var time, curvedTime;
			if (o.playing) {
			//If the elapsed frames are less than the total frames,
			//use the tweening formulas to move the sprite
			
			if (o.frameCounter < o.totalFrames){
				
				//Find the normalized value
				var normalizedTime = o.frameCounter / o.totalFrames;
				//Select the correct easing function from the
				//`ease` object’s library of easing functions
				//If it's not a spline, use one of the ordinary easing functions
				if (type[0] !== "spline") {
					
				curvedTime = ease[type](normalizedTime);
				}
				//If it's a spline, use the `spline` function and apply the
				//two additional `type` array values as the spline's start and
				//end points
				else {
					curvedTime = ease.spline(normalizedTime, o.startMagnitude, 0, 1, o.endMagnitude);
				}
				//Interpolate the sprite's property based on the curve
				sprite[property] = (o.endValue * curvedTime) + (o.startValue * (1 - curvedTime));
				
				o.frameCounter += 1;
			}
			//When the tween has finished playing, run the end tasks
			else {
				o.end();
			}
		 }
		};
		//The `end` method will be called when the tween is finished
		o.end = function(){
			//Set `playing` to `false`
			o.playing = false;
			//Call the tween's `onCompvare` method, if it's been assigned
			//by the user in the main program
			if (o.onComplete) o.onComplete();
			//Remove the tween from the `tweens` array
			tweens.splice(tweens.indexOf(o), 1);
			//If the tween's `yoyo` property is `true`, create a new tween
			//using the same values, but use the current tween's `startValue`
			//as the next tween's `endValue`
			if (yoyo) {
	/* 			wait(delayBeforeRepeat).then(() { return {
					o.start(o.endValue, o.startValue);
			}); */
			setTimeout(function(){return o.start(o.endValue, o.startValue);},delayBeforeRepeat);
			}
		};
		 //Play and pause methods
		 o.play = function(){ return o.playing = true; };
		 o.pause = function(){ return o.playing = false;};
			
		//Return the tween object
		return o;
	}

//fade in 	
function fadeIn(sprite, frames) {
	var frames = checkIfUndefined(frames,60);
	
	return tweenProperty(
		sprite, "alpha", sprite.alpha, 1, frames, ["sine"]
	);
}

//fade out
function fadeOut(sprite, frames) {
	var frames = checkIfUndefined(frames,60);
	return tweenProperty(
		sprite, "alpha", sprite.alpha, 0, frames, ["sine"]
	);
}

//pulse
function pulse(sprite, frames , minAlpha) {
	var 
	frames = checkIfUndefined(frames,60),
	minAlpha = checkIfUndefined(minAlpha,0);
	
	return tweenProperty(
		sprite, "alpha", sprite.alpha, minAlpha, frames, ["smoothstep"], true
	);
}

//Tweening Multiple Properties
function slide(
		sprite,
		endX,
		endY,
		frames,
		type,
		yoyo,
		delayBeforeRepeat
	) {
		var 
			frames = checkIfUndefined(frames,60),
			type = checkIfUndefined(type,["smoothstep"]),
			yoyo = checkIfUndefined(yoyo,false),
			delayBeforeRepeat = checkIfUndefined(delayBeforeRepeat,0);
			
	return makeTween([
		//The x axis tween
		[sprite, "x", sprite.x, endX, frames, type, yoyo, delayBeforeRepeat],
		//The y axis tween
		[sprite, "y", sprite.y, endY, frames, type, yoyo, delayBeforeRepeat]
	]);
}


function makeTween(tweensToAdd) {
		//Create an object to manage the tweens
		var o = {};
		//Create an internal `tweens` array to store the new tweens
		o.tweens = [];
		
		//Make a new tween for each array
		tweensToAdd.forEach(function(tweenPropertyArguments){
			//Use the tween property arguments to make a new tween
			var newTween = tweenProperty.apply(null,tweenPropertyArguments);
			//Push the new tween into this object's internal `tweens` array
			o.tweens.push(newTween);
		});
		//Add a counter to keep track of the
		//number of tweens that have completed their actions
		var completionCounter = 0;
		//`o.completed` will be called each time one of the tweens finishes
		o.completed = function(){
			//Add 1 to the `completionCounter`
			completionCounter += 1;
			//If all tweens have finished, call the user-defined `onComplete`
			//method, if it's been assigned. Reset the `completionCounter`
			if (completionCounter === o.tweens.length) {
				if (o.onComplete) o.onComplete();
				completionCounter = 0;
			}
		};
		//Add `onComplete` methods to all tweens
		o.tweens.forEach(function(tween){
			tween.onComplete = o.completed();
		});
		//Add pause and play methods to control all the tweens
		o.pause = function(){
			o.tweens.forEach(function(tween){
				tween.playing = false;
			});
		};
		o.play = function(){
			o.tweens.forEach(function(tween){
				tween.playing = true;
			});
		};
	//Return the tween object
	return o;
	}
	
function removeTween(tweenObject) {
	//Remove the tween if `tweenObject` doesn't have any nested
	//tween objects
	if(!tweenObject.tweens){
		tweenObject.pause();
		tweens.splice(tweens.indexOf(tweenObject), 1);
		//Otherwise, remove the nested tween objects
	} else {
		tweenObject.pause();
		tweenObject.tweens.forEach(function(element){
			tweens.splice(tweens.indexOf(element), 1);
		});
	}
}

function breathe(
		sprite, endScaleX, endScaleY,
		frames, yoyo, delayBeforeRepeat
	) {
		var 
			yoyo= checkIfUndefined(yoyo,true),
			delayBeforeRepeat= checkIfUndefined(delayBeforeRepeat,0);
	return makeTween([
		//Create the scaleX tween
		[
			sprite, "scaleX", sprite.scaleX, endScaleX,
			frames, ["smoothstepSquared"], yoyo, delayBeforeRepeat
		],
		//Create the scaleY tween
		[
			sprite, "scaleY", sprite.scaleY, endScaleY,
			frames, ["smoothstepSquared"], yoyo, delayBeforeRepeat
		]
	]);
}

//scale
function scale(sprite, endScaleX, endScaleY, frames) {
	var frame = checkIfUndefined(frames,60);
	return makeTween([
		//Create the scaleX tween
		[
			sprite, "scaleX", sprite.scaleX, endScaleX,
			frames, ["smoothstep"], false
		],
		//Create the scaleY tween
		[
			sprite, "scaleY", sprite.scaleY, endScaleY,
			frames, ["smoothstep"], false
		]
	]);
}

//strobe effect
function strobe(
sprite, scaleFactor, startMagnitude, endMagnitude,
frames, yoyo, delayBeforeRepeat
) {
	var 
		scaleFactor = checkIfUndefined(scaleFactor,1.3),
		startMagnitude = checkIfUndefined(startMagnitude,10),
		endMagnitude = checkIfUndefined(endMagnitude,20),
		frames = checkIfUndefined(frames,10),
		yoyo = checkIfUndefined(yoyo,true),
		delayBeforeRepeat = checkIfUndefined(delayBeforeRepeat,0);
		
	return makeTween([
		//Create the scaleX tween
		[
			sprite, "scaleX", sprite.scaleX, scaleFactor, frames,
			["spline", startMagnitude, endMagnitude],
			yoyo, delayBeforeRepeat
		],
		//Create the scaleY tween
		[
			sprite, "scaleY", sprite.scaleY, scaleFactor, frames,
			["spline", startMagnitude, endMagnitude],
			yoyo, delayBeforeRepeat
		]
	]);
}

function wobble(
	sprite,
	scaleFactorX ,
	scaleFactorY,
	frames,
	xStartMagnitude,
	xEndMagnitude,
	yStartMagnitude,
	yEndMagnitude,
	friction ,
	yoyo,
	delayBeforeRepeat
){
	var 
		scaleFactorX = checkIfUndefined(scaleFactorX,1.2),
		scaleFactorY = checkIfUndefined(scaleFactorY,1.2),
		frames = checkIfUndefined(frames,10),
		xStartMagnitude = checkIfUndefined(xStartMagnitude,10),
		xEndMagnitude = checkIfUndefined(xEndMagnitude,10),
		yStartMagnitude = checkIfUndefined(yStartMagnitude,-10),
		yEndMagnitude = checkIfUndefined(yEndMagnitude,-10),
		friction = checkIfUndefined(friction,0.98),
		yoyo = checkIfUndefined(yoyo,true),
		delayBeforeRepeat = checkIfUndefined(delayBeforeRepeat,0);		
		
	var o = makeTween([
		//Create the scaleX tween
		[
			sprite, "scaleX", sprite.scaleX, scaleFactorX, frames,
			["spline", xStartMagnitude, xEndMagnitude],
				yoyo, delayBeforeRepeat
		],
		//Create the scaleY tween
		[
			sprite, "scaleY", sprite.scaleY, scaleFactorY, frames,
			["spline", yStartMagnitude, yEndMagnitude],
			yoyo, delayBeforeRepeat
		]
	]);
	//Add some friction to the `endValue` at the end of each tween
	o.tweens.forEach(function(tween){
		tween.onComplete = function(){
			//Add friction if the `endValue` is greater than 1
			if (tween.endValue > 1) {
				tween.endValue *= friction;
				//Set the `endValue` to 1 when the effect is finished and
				//remove the tween from the global `tweens` array
				if (tween.endValue <= 1) {
					tween.endValue = 1;
					removeTween(tween);
				}
			}
		};
	});
	return o;
}


function walkPath(
	sprite, //The sprite
	originalPathArray, //A 2D array of waypoints
	totalFrames, //The duration, in frames
	type, //The easing type
	loop, //Should the animation loop?
	yoyo, //Should the direction reverse?
	delayBetweenSections//Delay, in milliseconds, between sections
) {
	var 
		totalFrames = checkIfUndefined(totalFrames,300),
		type = checkIfUndefined(type,["smoothstep"]),
		loop = checkIfUndefined(loop,false),
		yoyo = checkIfUndefined(yoyo,false),
		delayBetweenSections = checkIfUndefined(delayBetweenSections,0);
		
	//Clone the path array so that any possible references to sprite
	//properties are converted into ordinary numbers
	var pathArray = JSON.parse(JSON.stringify(originalPathArray));
	//Figure out the duration, in frames, of each path section by
	//dividing the `totalFrames` by the length of the `pathArray`
	var frames = totalFrames / pathArray.length;
	//Set the current point to 0, which will be the first waypoint
	var currentPoint = 0;
	//Make the first path using the internal `makePath` function (below)
	var tween = makePath(currentPoint);
	//The `makePath` function creates a single tween between two points and
	//then schedules the next path to be made after it
		function makePath(currentPoint) {
		//Use the `makeTween` function to tween the sprite's x and y position
		var tween = makeTween([
			//Create the x axis tween between the first x value in the
			//current point and the x value in the following point
			[
				sprite,
				"x",
				pathArray[currentPoint][0],
				pathArray[currentPoint + 1][0],
				frames,
				type
			],
			//Create the y axis tween in the same way
			[
				sprite,
				"y",
				pathArray[currentPoint][1],
				pathArray[currentPoint + 1][1],
				frames,
				type
			]
		]);
		//When the tween is complete, advance the `currentPoint` by 1.
		//Add an optional delay between path segments, and then make the
		//next connecting path
		tween.onComplete = function(){
			//Advance to the next point
			currentPoint += 1;
			//If the sprite hasn't reached the end of the
			//path, tween the sprite to the next point
			if (currentPoint < pathArray.length - 1) {
				/* wait(delayBetweenSections).then(() { return {
					tween = makePath(currentPoint);
				}); */				
				setTimeout(function(){tween = makePath(currentPoint);},delayBetweenSections);
			}
			//If we've reached the end of the path, optionally
			//loop and yoyo it
			else {
				//Reverse the path if `loop` is `true`
				if (loop) {
					//Reverse the array if `yoyo` is `true`. Use JavaScript’s built-in
					//array `reverse` method to do this
					if (yoyo) pathArray.reverse();
					//Optionally wait before restarting
			/* 		wait(delayBetweenSections).then(() { return {
						//Reset the `currentPoint` to 0 so that we can
						//restart at the first point
						currentPoint = 0;
						//Set the sprite to the first point
						sprite.x = pathArray[0][0];
						sprite.y = pathArray[0][1];
						//Make the first new path
						tween = makePath(currentPoint);
						//... and so it continues!
					}); */
				
					setTimeout(function(){//Reset the `currentPoint` to 0 so that we can
											//restart at the first point
											currentPoint = 0;
											//Set the sprite to the first point
											sprite.x = pathArray[0][0];
											sprite.y = pathArray[0][1];
											//Make the first new path
											tween = makePath(currentPoint);
											//... and so it continues
										},
						delayBetweenSections);
					//Reset the `currentPoint` to 0 so that we can
						//restart at the first point
						currentPoint = 0;
						//Set the sprite to the first point
						sprite.x = pathArray[0][0];
						sprite.y = pathArray[0][1];
						//Make the first new path
						tween = makePath(currentPoint);
						//... and so it continues!
					
				}
			}
		};
		//Return the path tween to the main function
		return tween;
	}
	//Pass the tween back to the main program
	return tween;
}



/* var hedgehogPath = walkCurve(
	hedgehog, //The sprite
	//An array of Bezier curve points that
	//you want to connect in sequence
	[
		[[hedgehog.x, hedgehog.y],[75, 500],[200, 500],[300, 300]],
		[[300, 300],[250, 100],[100, 100],[hedgehog.x, hedgehog.y]]
	],
	300, //Total duration, in frames
	["smoothstep"], //Easing type
	true, //Should the path loop?
	true, //Should the path yoyo?
	1000 //Delay in milliseconds between segments
);
 */

function walkCurve(
		sprite, //The sprite
		pathArray, //2D array of Bezier curves
		totalFrames, //The duration, in frames
		type, //The easing type
		loop, //Should the animation loop?
		yoyo, //Should the direction reverse?
		delayBeforeContinue //Delay, in milliseconds, between sections
	) {
	var 
		totalFrames = checkIfUndefined(totalFrames,300),
		type = checkIfUndefined(type,["smoothstep"]),
		loop = checkIfUndefined(loop,false),
		yoyo = checkIfUndefined(yoyo,false),
		delayBeforeContinue = checkIfUndefined(delayBeforeContinue,0);
	//Divide the `totalFrames` into sections for each part of the path
	var frames = totalFrames / pathArray.length;
	//Set the current curve to 0, which will be the first one
	var currentCurve = 0;
	//Make the first path
	var tween = makePath(currentCurve);
	
		function makePath(currentCurve) {
		//Use the custom `followCurve` function (described earlier
		//in the chapter) to make a sprite follow a curve
		var tween = followCurve(
			sprite,
			pathArray[currentCurve],
			frames,
			type
		);
		//When the tween is complete, advance the `currentCurve` by one.
		//Add an optional delay between path segments, and then create the
		//next path
		tween.onComplete = function(){
			currentCurve += 1;
			if (currentCurve < pathArray.length) {
			/* 	wait(delayBeforeContinue).then(() { return {
				tween = makePath(currentCurve);
				}); */
				setTimeout(function(){tween = makePath(currentCurve);},delayBeforeContinue);
			}
			//If we've reached the end of the path, optionally
			//loop and reverse it
			else {
				if (loop) {
					if (yoyo) {
						//Reverse the order of the curves in the `pathArray`
						pathArray.reverse();
						//Reverse the order of the points in each curve
						pathArray.forEach(function(curveArray){curveArray.reverse();});
					}
					//After an optional delay, reset the sprite to the
					//beginning of the path and create the next new path
		/* 			wait(delayBeforeContinue).then(() { return {
						currentCurve = 0;
						sprite.x = pathArray[0][0];
						sprite.y = pathArray[0][1];
						tween = makePath(currentCurve);
					}); */
					
					setTimeout(function(){
							currentCurve = 0;
							sprite.x = pathArray[0][0];
							sprite.y = pathArray[0][1];
							tween = makePath(currentCurve);
						},
						delayBeforeContinue);
				}
			}
		};
		//Return the path tween to the main function
		return tween;
		}
	//Pass the tween back to the main program
	return tween;
}



/*
followCurve
------------
*/

function followCurve(
  sprite,
  pointsArray,
  totalFrames, 
  type,
  yoyo,
  delayBeforeRepeat
) {
	var 
		type = checkIfUndefined(type, ["smoothstep"]),
		yoyo = checkIfUndefined(yoyo, false),
		delayBeforeRepeat = checkIfUndefined(delayBeforeRepeat, 0);
  //Create the tween object
  var o = {};

  if(type[0] === "spline" ){
    o.startMagnitude = type[1];
    o.endMagnitude = type[2];
  }

  //Use `tween.start` to make a new tween using the current
  //end point values
  o.start = function(pointsArray){
    o.playing = true;
    o.totalFrames = totalFrames;
    o.frameCounter = 0;

    //Clone the points array
    o.pointsArray = JSON.parse(JSON.stringify(pointsArray));

    //Add the tween to the global `tweens` array. The global `tweens` array is
    //updated on each frame
    tweens.push(o);
  };

  //Call `tween.start` to start the first tween
  o.start(pointsArray);

  //The `update` method will be called on each frame by the game loop.
  //This is what makes the tween move
  o.update = function(){
    
    var normalizedTime, curvedTime, 
        p = o.pointsArray;

    if (o.playing) {

      //If the elapsed frames are less than the total frames,
      //use the tweening formulas to move the sprite
      if (o.frameCounter < o.totalFrames) {

        //Find the normalized value
        normalizedTime = o.frameCounter / o.totalFrames;

        //Select the correct easing function
        
        //If it's not a spline, use one of the ordinary tween
        //functions
        if (type[0] !== "spline") {
          curvedTime = ease[type](normalizedTime);
        } 
        
        //If it's a spline, use the `spine` function and apply the
        //2 additional `type` array values as the spline's start and
        //end points
        else {
          //curve = tweenFunction.spline(n, type[1], 0, 1, type[2]);
          curvedTime = ease.spline(normalizedTime, o.startMagnitude, 0, 1, o.endMagnitude);
        }

        //Apply the Bezier curve to the sprite's position 
        sprite.x = cubicBezier(curvedTime, p[0][0], p[1][0], p[2][0], p[3][0]);
        sprite.y = cubicBezier(curvedTime, p[0][1], p[1][1], p[2][1], p[3][1]);
        
        //Add one to the `elapsedFrames`
        o.frameCounter += 1;
      }

      //When the tween has finished playing, run the end tasks
      else {
       o.end(); 
      }
    }
  };
    
  //The `end` method will be called when the tween is finished
  o.end = function(){

    //Set `playing` to `false`
    o.playing = false;

    //Call the tween's `onComplete` method, if it's been
    //assigned
    if (o.onComplete) o.onComplete();

    //Remove the tween from the global `tweens` array
    tweens.splice(tweens.indexOf(o), 1);

    //If the tween's `yoyo` property is `true`, reverse the array and
    //use it to create a new tween
    if (yoyo) {
     /*  wait(delayBeforeRepeat).then(() { return {
        o.pointsArray = o.pointsArray.reverse();
        o.start(o.pointsArray);
      }); */
	  setTimeout(function(){  	o.pointsArray = o.pointsArray.reverse();
								o.start(o.pointsArray);
							}
			,delayBeforeRepeat);
	
    }
  };

  //Pause and play methods
  o.pause = function(){
    o.playing = false;
  };
  o.play = function(){
    o.playing = true;
  };
  
  //Return the tween object
  return o;
}