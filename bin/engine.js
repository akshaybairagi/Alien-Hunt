//check the support for web audio api
if(Modernizr.webaudio){

//Create the audio context
var actx = new AudioContext();

//The sound class
function Sound(source,loadHandler){
		//Assign the `source` and `loadHandler` values to this object
		this.source = source;
		this.loadHandler = loadHandler;
		//Set the default properties
		this.actx = actx;
		this.volumeNode = this.actx.createGain();
		this.panNode = this.actx.createStereoPanner();
		this.soundNode = null;
		this.buffer = null;
		this.loop = false;
		this.playing = false;
		//Values for the pan and volume getters/setters
		this.panValue = 0;
		this.volumeValue = 1;
		//Values to help track and set the start and pause times
		this.startTime = 0;
		this.startOffset = 0;

		this.playbackRate = 1;

		this.echo = false;
		this.delayValue = 0.3;
		this.feedbackValue = 0.3;
		this.filterValue = 0;

		this.delayNode = this.actx.createDelay();
		this.feedbackNode = this.actx.createGain();
		this.filterNode = this.actx.createBiquadFilter();

		//reverb effect implementation
		this.convolverNode = this.actx.createConvolver();
		this.reverb = false;
		this.reverbImpulse = null;


		//Load the sound
		this.load();
}

Sound.prototype = {
	//The sound object's methods
	load: function() {
		var _this = this;
		//Use xhr to load the sound file
		var xhr = new XMLHttpRequest();
		xhr.open("GET", this.source, true);
		xhr.responseType = "arraybuffer";
		xhr.addEventListener("load", function(){
			//Decode the sound and store a reference to the buffer
			_this.actx.decodeAudioData(
				xhr.response,
				function(buffer){
					_this.buffer = buffer;
					_this.hasLoaded = true;
					//This next bit is optional, but important.
					//If you have a load manager in your game, call it here so that
					//the sound is registered as having loaded.
					if (_this.loadHandler) {
						_this.loadHandler();
					}
				},
				//Throw an error if the sound can't be decoded
				function(error){
					throw new Error("Audio could not be decoded: " + error);
				}
			);
		});
		//Send the request to load the file
		xhr.send();
	},
	play: function(){

		//Set the start time (it will be `0` when the first sound starts)
		this.startTime = this.actx.currentTime;
		//Create a sound node
		this.soundNode = this.actx.createBufferSource();
		//Set the sound node's buffer property to the loaded sound
		this.soundNode.buffer = this.buffer;
		//Connect the sound to the volume, connect the volume to the
		//pan, and connect the pan to the destination
		this.soundNode.connect(this.volumeNode);

		//If there's no reverb, bypass the convolverNode
		if (this.reverb === false) {
			this.volumeNode.connect(this.panNode);
		}
		//If there is reverb, connect the `convolverNode` and apply
		//the impulse response
		else {
			this.volumeNode.connect(this.convolverNode);
			this.convolverNode.connect(this.panNode);
			this.convolverNode.buffer = this.reverbImpulse;
		}

		this.panNode.connect(this.actx.destination);

		//Add optional echo
		if (this.echo){
			//Set the values
			this.feedbackNode.gain.value = this.feedbackValue;
			this.delayNode.delayTime.value = this.delayValue;
			this.filterNode.frequency.value = this.filterValue;
			//Create the delay loop, with optional filtering
			this.delayNode.connect(this.feedbackNode);
			if (this.filterValue > 0) {
				this.feedbackNode.connect(this.filterNode);
				this.filterNode.connect(this.delayNode);
			} else {
				this.feedbackNode.connect(this.delayNode);
			}
			//Capture the sound from the main node chain, send it to the
			//delay loop, and send the final echo effect to the `panNode`, which
			//will then route it to the destination
			this.volumeNode.connect(this.delayNode);
			this.delayNode.connect(this.panNode);
		}

		//Will the sound loop? This can be `true` or `false`
		this.soundNode.loop = this.loop;

		this.soundNode.playbackRate.value = this.playbackRate;
		//Finally, use the `start` method to play the sound.
		//The start time will be either `0`,
		//or a later time if the sound was paused
		this.soundNode.start(
			this.startTime,
			this.startOffset % this.buffer.duration
		);
		//Set `playing` to `true` to help control the
		//`pause` and `restart` methods
		this.playing = true;
	},
	pause: function() {
		//Pause the sound if it's playing, and calculate the
		//`startOffset` to save the current position
		if (this.playing) {
		this.soundNode.stop(this.actx.currentTime);
		this.startOffset += this.actx.currentTime - this.startTime;
		this.playing = false;
		}
	},
	 restart: function() {
		//Stop the sound if it's playing, reset the start and offset times,
		//then call the `play` method again
		if (this.playing) {
			this.soundNode.stop(this.actx.currentTime);
		}
		this.startOffset = 0,
		this.play();
	},
	playFrom: function(value) {
		if (this.playing) {
			this.soundNode.stop(this.actx.currentTime);
		}
		this.startOffset = value;
		this.play();
	},
	setEcho: function(delayValue, feedbackValue, filterValue) {
		this.delayValue = delayValue || 0.3;
		this.feedbackValue = feedbackValue || 0.3;
		this.filterValue = filterValue || 0;
		this.echo = true;
	},
	setReverb: function(duration, decay, reverse) {
		var
			duration = duration || 2,
			decay = decay || 2,
			reverse = reverse || false;

		this.reverbImpulse = impulseResponse(duration, decay, reverse);
		this.reverb = true;
	},
	//Volume and pan getters/setters
	get volume() {
		return this.volumeValue;
	},
	set volume(value) {
		this.volumeNode.gain.value = value;
		this.volumeValue = value;
	},
	get pan() {
		return this.panNode.pan.value;
	},
	set pan(value) {
		this.panNode.pan.value = value;
	},
}
//Create a high-level wrapper to keep our general API style consistent and flexible
function makeSound(source, loadHandler) {
	return new Sound(source, loadHandler);
}

function impulseResponse(duration, decay, reverse){
	var
		duration = duration || 2,
		decay = decay || 2,
		reverse = reverse || false;
	//The length of the buffer
	//(The AudioContext's default sample rate is 44100)
	var length = actx.sampleRate * duration;
	//Create an audio buffer (an empty sound container) to store the reverb effect
	console.log(duration);
	var impulse = actx.createBuffer(2, length, actx.sampleRate);
	//Use `getChannelData` to initialize empty arrays to store sound data for
	//the left and right channels
	var left = impulse.getChannelData(0),
	right = impulse.getChannelData(1);
	//Loop through each sample-frame and fill the channel
	//data with random noise
	for (var i = 0; i < length; i++){
		//Apply the reverse effect, if `reverse` is `true`
		var n;
		if (reverse) {
			n = length - i;
		} else {
			n = i;
		}
		//Fill the left and right channels with random white noise that
		//decays exponentially
		left[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
		right[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
	}
	//Return the `impulse`
	return impulse;
}

function playNote(frequency, decay, type){
	var
		decay = decay || 1,
		type = type || 'sine';
	//Create an oscillator and a gain node, and connect them
	//together to the destination
	var oscillator = actx.createOscillator(),
	volume = actx.createGain();
	oscillator.connect(volume);
	volume.connect(actx.destination);
	//Set the oscillator's wave form pattern
	oscillator.type = type;
	//Set the note value
	oscillator.frequency.value = frequency;
	//Fade the sound out
	volume.gain.linearRampToValueAtTime(1, actx.currentTime);
	volume.gain.linearRampToValueAtTime(0, actx.currentTime + decay);
	//Make it play
	oscillator.start(actx.currentTime)
}

function soundEffect(
	frequencyValue,
	attack,
	decay,
	type,
	volumeValue,
	panValue,
	wait,
	pitchBendAmount,
	reverse,
	randomValue,
	dissonance,
	echo,
	reverb
){
	var
		attack = attack || 0,
		decay = decay || 1,
		type = type || 'sine',
		volumeValue = volumeValue || 1,
		panValue = panValue || 0,
		wait = wait || 0,
		pitchBendAmount = pitchBendAmount || 0,
		reverse = reverse || false,
		randomValue = randomValue || 0,
		dissonance = dissonance || 0,
		echo = echo || undefined,
		reverb = reverb || undefined;

		//console.log(panValue);
	//Create oscillator, gain and pan nodes, and connect them
	//together to the destination
	var oscillator = actx.createOscillator(),
	volume = actx.createGain(),
	pan = actx.createStereoPanner();
	oscillator.connect(volume);
	volume.connect(pan);
	pan.connect(actx.destination);
	//Set the supplied values
	volume.gain.value = volumeValue;
	pan.pan.value = panValue;
	oscillator.type = type;
	//Optionally randomize the pitch. If the `randomValue` is greater
	//than zero, a random pitch is selected that's within the range
	//specified by `frequencyValue`. The random pitch will be either
	//above or below the target frequency.
	var frequency;
	var randomInt = function(min, max){
		return Math.floor(Math.random() * (max - min+ 1)) + min;
	}
	if (randomValue > 0) {
		frequency = randomInt(
		frequencyValue - randomValue / 2,
		frequencyValue + randomValue / 2
		);
	} else {
		frequency = frequencyValue;
	}
	oscillator.frequency.value = frequency;
	//Apply effects
	if (attack > 0) fadeIn(volume);
	if (decay > 0) fadeOut(volume);
	if (pitchBendAmount > 0) pitchBend(oscillator);
	if (echo) addEcho(volume);
	if (reverb) addReverb(volume);
	if (dissonance > 0) addDissonance();
	//Play the sound
	play(oscillator);
	//The helper functions:
	//Reverb
	function addReverb(volumeNode) {
		var convolver = actx.createConvolver();
		convolver.buffer = impulseResponse(reverb[0], reverb[1], reverb[2]);
		volumeNode.connect(convolver);
		convolver.connect(pan);
	}
	//Echo
	function addEcho(volumeNode){
		//Create the nodes
		var feedback = actx.createGain(),
		delay = actx.createDelay(),
		filter = actx.createBiquadFilter();
		//Set their values (delay time, feedback time, and filter frequency)
		delay.delayTime.value = echo[0];
		feedback.gain.value = echo[1];
		if (echo[2]) filter.frequency.value = echo[2];
		//Create the delay feedback loop, with
		//optional filtering
		delay.connect(feedback);
		if (echo[2]) {
			feedback.connect(filter);
			filter.connect(delay);
		} else {
			feedback.connect(delay);
		}
		//Connect the delay loop to the oscillator's volume
		//node, and then to the destination
		volumeNode.connect(delay);
		//Connect the delay loop to the main sound chain's
		//pan node, so that the echo effect is directed to
		//the correct speaker
		delay.connect(pan);
	}
	//Fade in (the sound's "attack")
	function fadeIn(volumeNode){
		//Set the volume to 0 so that you can fade in from silence
		volumeNode.gain.value = 0;
		volumeNode.gain.linearRampToValueAtTime(
			0, actx.currentTime + wait
		);
		volumeNode.gain.linearRampToValueAtTime(
			volumeValue, actx.currentTime + wait + attack
		);
	}
	//Fade out (the sound’s "decay")
	function fadeOut(volumeNode) {
		volumeNode.gain.linearRampToValueAtTime(
			volumeValue, actx.currentTime + attack + wait
		);
		volumeNode.gain.linearRampToValueAtTime(
			0, actx.currentTime + wait + attack + decay
		);
	}
	//Pitch bend.
	//Uses `linearRampToValueAtTime` to bend the sound's frequency up or down
	function pitchBend(oscillatorNode){
		//Get the frequency of the current oscillator
		var frequency = oscillatorNode.frequency.value;
		//If `reverse` is true, make the sound drop in pitch.
		//(Useful for shooting sounds)
		if (!reverse) {
			oscillatorNode.frequency.linearRampToValueAtTime(
				frequency,
				actx.currentTime + wait
			);
			oscillatorNode.frequency.linearRampToValueAtTime(
				frequency - pitchBendAmount,
				actx.currentTime + wait + attack + decay
			);
		}
		//If `reverse` is false, make the note rise in pitch.
		//(Useful for jumping sounds)
		else {
			oscillatorNode.frequency.linearRampToValueAtTime(
				frequency,
				actx.currentTime + wait
			);
			oscillatorNode.frequency.linearRampToValueAtTime(
				frequency + pitchBendAmount,
				actx.currentTime + wait + attack + decay
			);
		}
	}
	//Dissonance
	function addDissonance(){
		//Create two more oscillators and gain nodes
		var d1 = actx.createOscillator(),
		d2 = actx.createOscillator(),
		d1Volume = actx.createGain(),
		d2Volume = actx.createGain();
		//Set the volume to the `volumeValue`
		d1Volume.gain.value = volumeValue;
		d2Volume.gain.value = volumeValue;
		//Connect the oscillators to the gain and destination nodes
		d1.connect(d1Volume);
		d1Volume.connect(actx.destination);
		d2.connect(d2Volume);
		d2Volume.connect(actx.destination);
		//Set the waveform to "sawtooth" for a harsh effect
		d1.type = "sawtooth";
		d2.type = "sawtooth";
		//Make the two oscillators play at frequencies above and
		//below the main sound's frequency. Use whatever value was
		//supplied by the `dissonance` argument
		d1.frequency.value = frequency + dissonance;
		d2.frequency.value = frequency - dissonance;
		//Apply effects to the gain and oscillator
		//nodes to match the effects on the main sound
		if (attack > 0) {
			fadeIn(d1Volume);
			fadeIn(d2Volume);
		}
		if (decay > 0) {
			fadeOut(d1Volume);
			fadeOut(d2Volume);
		}
		if (pitchBendAmount > 0) {
			pitchBend(d1);
			pitchBend(d2);
		}
		if (echo) {
			addEcho(d1Volume);
			addEcho(d2Volume);
		}
		if (reverb) {
			addReverb(d1Volume);
			addReverb(d2Volume);
		}
		//Play the sounds
		play(d1);
		play(d2);
	}
	//The `play` function that starts the oscillators
	function play(oscillatorNode) {
		oscillatorNode.start(actx.currentTime + wait);
	}
}


function shootSound() {
	soundEffect(
		1046.5, //frequency
		0, //attack
		0.3, //decay
		"sawtooth", //waveform
		0.5, //Volume
		-0.8, //pan
		0, //wait before playing
		1200, //pitch bend amount
		false, //reverse bend
		0, //random frequency range
		25, //dissonance
		[0.2, 0.2, 2000], //echo array: [delay, feedback, filter]
		undefined //reverb array: [duration, decay, reverse?]
	);
}

function explosionSound() {
	soundEffect(
		16, //frequency
		0, //attack
		1, //decay
		"sawtooth", //waveform
		1, //volume
		0, //pan
		0, //wait before playing
		0, //pitch bend amount
		false, //reverse
		0, //random pitch range
		50, //dissonance
		undefined, //echo array: [delay, feedback, filter]
		undefined //reverb array: [duration, decay, reverse?]
	);
}

function jumpSound() {
	soundEffect(
		523.25, //frequency
		0.05, //attack
		0.2, //decay
		"sine", //waveform
		1.5, //volume
		0.8, //pan
		0, //wait before playing
		600, //pitch bend amount
		true, //reverse
		100, //random pitch range
		0, //dissonance
		undefined, //echo array: [delay, feedback, filter]
		undefined //reverb array: [duration, decay, reverse?]
	);
}

}

var assets = {
    //Properties to help track the assets being loaded
    toLoad: 0,
    loaded: 0,

    //File extensions for different types of assets
    imageExtensions: ["png", "jpg", "gif"],
    fontExtensions: ["ttf", "otf", "ttc", "woff"],
    jsonExtensions: ["json"],
    audioExtensions: ["mp3", "ogg", "wav", "webm"],

    //The `load` method creates and loads all the assets. Use it like this:
    //`assets.load(["images/anyImage.png", "fonts/anyFont.otf"]);`
    load: function (sources,startFunction) {

		var _this = this;

        var loadHandler = function () {
            _this.loaded += 1;

			console.log(assets.loaded);
            //Check whether everything has loaded
            if (_this.toLoad === _this.loaded) {
                //Reset `toLoad` and `loaded` to `0` so you can use them
                //to load more assets later if you need to
                _this.toLoad = 0;
                _this.loaded = 0;

                console.log("Assets finished loading");
				//call the setup function to start the game execution
				if (startFunction)	{
					startFunction();
				}
            }
        };

        //Display a console message to confirm that the assets are being loaded
        console.log("Loading assets...");
        //Find the number of files that need to be loaded
        this.toLoad = sources.length;

        sources.forEach(function (source) {
            //Find the file extension of the asset
            var extension = source.split(".").pop();
			//Load fonts
            if (this.fontExtensions.indexOf(extension) !== -1) {
                this.loadFont(source, loadHandler);
            }
            //Load images that have file extensions that match the imageExtensions array
            else if (this.imageExtensions.indexOf(extension) !== -1) {
                this.loadImage(source, loadHandler);
            }
                //Load JSON files
            else if (this.jsonExtensions.indexOf(extension) !== -1) {
                this.loadJson(source, loadHandler,this);
            }
                //Load audio files
            else if (this.audioExtensions.indexOf(extension) !== -1) {
                this.loadSound(source, loadHandler);
            }
			else if (this.audioExtensions.indexOf(extension) !== -1) {
				this.loadSound(source, loadHandler);
			}
                //Display a message if a file type isn't recognized
            else {
                console.log("File type not recognized: " + source);
            }
        },this);
    },

    loadImage: function (source, loadHandler) {
        //Create a new image and call the `loadHandler` when the image
        //file has loaded
        var image = new Image();
        image.addEventListener("load", loadHandler, false);
        //Assign the image as a property of the `assets` object so
        //you can access it like this: `assets["path/imageName.png"]`
        this[source] = image;
        //Alternatively, if you only want the file name without the full
        //path, you can get it like this:
        //image.name = source.split("/").pop();
        //this[image.name] = image;
        //This will allow you to access the image like this:
        //assets["imageName.png"];

        //Set the image's `src` property to start loading the image
        image.src = source;
    },
	loadFont: function(source, loadHandler){
		//Use the font's filename as the `fontFamily` name. This code captures
		//the font file's name without the extension or file path
    //Font.js Font loader library implementation
		var fontFamily = source.split("/").pop().split(".")[0];
		var font = new Font();
		font.onload = function(){
			loadHandler();
		};
		font.onerror = function(error_message) {
			console.log("FontLoadError: ",error_message);
		};
		font.fontFamily =fontFamily;
		font.src = source;
	},

    loadJson: function (source, loadHandler,_this) {
        //Create a new `xhr` object and an object to store the file
        var xhr = new XMLHttpRequest();
        //Use xhr to load the JSON file
        xhr.open("GET", source, true);
        //Tell xhr that it's a text file
        xhr.responseType = "text";
        //Create an `onload` callback function that
        //will handle the file loading
        xhr.onload = function (event) {
            //Check to make sure the file has loaded properly
            if (xhr.status === 200) {
                //Convert the JSON data file into an ordinary object
                var file = JSON.parse(xhr.responseText);
                //Get the filename
                file.name = source;
                //Assign the file as a property of the assets object so
                //you can access it like this: `assets["file.json"]`
                _this[file.name] = file;
                //Texture atlas support:
                //If the JSON file has a `frames` property then
                //it's in Texture Packer format
                if (file.frames) {
                    //Create the tileset frames
                    _this.createTilesetFrames(file, source, loadHandler,_this);
                } else {
                    //Alert the load handler that the file has loaded
                    loadHandler();
                }
            }
        };
        //Send the request to load the file
        xhr.send();
    },

    createTilesetFrames: function (file, source, loadHandler,_this) {
        //Get the tileset image's file path
        var baseUrl = source.replace(/[^\/]*$/, "");
        //Use the `baseUrl` and `image` name property from the JSON
        //file's `meta` object to construct the full image source path
        var imageSource = baseUrl + file.meta.image;
        //The image's load handler
        function imageLoadHandler() {
            //Assign the image as a property of the `assets` object so
            //you can access it like this:
            //`assets["images/imageName.png"]`
            _this[imageSource] = image;
            //Loop through all the frames
            Object.keys(file.frames).forEach(function (frame) {//(frame => {
                //The `frame` object contains all the size and position
                //data for each sub-image.
                //Add the frame data to the asset object so that you
                //can access it later like this: `assets["frameName.png"]`
                _this[frame] = file.frames[frame];
                //Get a reference to the source so that it will be easy for
                //us to access it later
                _this[frame].source = image;
            });
            //Alert the load handler that the file has loaded
            loadHandler();
        };

        //Load the tileset image
        var image = new Image();
        image.addEventListener("load", imageLoadHandler, false);
        image.src = imageSource;
    },

    loadSound: function (source, loadHandler) {
      //Create a sound object and alert the `loadHandler`
  		//when the sound file has loaded
  		var sound = makeSound(source, loadHandler);
  		//Get the sound file name
  		sound.name = source;
  		//Assign the sound as a property of the assets object so
  		//we can access it this way: `assets["sounds/sound.mp3"]`
  		this[sound.name] = sound;
    },
};

function distance(s1, s2) {
	var vx = s2.centerX - s1.centerX,
		vy = s2.centerY - s1.centerY;
	return Math.sqrt(vx * vx + vy * vy);
}

function followEase(follower, leader, speed) {
	//Figure out the distance between the sprites
	var vx = leader.centerX - follower.centerX,
		vy = leader.centerY - follower.centerY,
	distance = Math.sqrt(vx * vx + vy * vy);
	//Move the follower if it's more than 1 pixel
	//away from the leader
	if (distance >= 1) {
		follower.x += vx * speed;
		follower.y += vy * speed;
	}
}

function followConstant(follower, leader, speed) {
	//Figure out the distance between the sprites
	var vx = leader.centerX - follower.centerX,
	vy = leader.centerY - follower.centerY,
	distance = Math.sqrt(vx * vx + vy * vy);
	//Move the follower if it's more than 1 move
	//away from the leader
	if (distance >= speed) {
		follower.x += (vx / distance) * speed;
		follower.y += (vy / distance) * speed;
	}
}

function angle(s1, s2) {
	return Math.atan2(
		s2.centerY - s1.centerY,
		s2.centerX - s1.centerX
	);
}

function rotateSprite(rotatingSprite, centerSprite, distance, angle) {
	rotatingSprite.x
	= centerSprite.centerX - rotatingSprite.parent.x
	+ (distance * Math.cos(angle))
	- rotatingSprite.halfWidth;
	rotatingSprite.y
	= centerSprite.centerY - rotatingSprite.parent.y
	+ (distance * Math.sin(angle))
	- rotatingSprite.halfWidth;
}

function rotatePoint(pointX, pointY, distanceX, distanceY, angle) {
	var point = {};
	point.x = pointX + Math.cos(angle) * distanceX;
	point.y = pointY + Math.sin(angle) * distanceY;
	return point;
}

function shoot(
	shooter, angle, offsetFromCenter,
	bulletSpeed, bulletArray, bulletSprite
) {
	//Make a new sprite using the user-supplied `bulletSprite` function
	var bullet = bulletSprite();
	bullet.rotation = shooter.rotation;
	//Set the bullet's start point
	bullet.x= shooter.centerX - bullet.halfWidth + (offsetFromCenter * Math.cos(angle));
	bullet.y= shooter.centerY - bullet.halfHeight + (offsetFromCenter * Math.sin(angle));
	//Set the bullet's velocity
	bullet.vx = Math.cos(angle) * bulletSpeed;
	bullet.vy = Math.sin(angle) * bulletSpeed;
	//Push the bullet into the `bulletArray`
	bulletArray.push(bullet);
}

function outsideBounds(sprite, bounds, extra){
	var x = bounds.x,
	y = bounds.y,
	width = bounds.width,
	height = bounds.height;

	//var extra = (typeof extra !== 'undefined') ? extra : 'undefined'
	//The `collision` object is used to store which
	//side of the containing rectangle the sprite hits
	var collision;
	//Left
	if (sprite.x < x - sprite.width) {
		collision = "left";
	}
	//Top
	if (sprite.y < y - sprite.height) {
		collision = "top";
	}
	//Right
	if (sprite.x > width) {
		collision = "right";
	}
	//Bottom
	if (sprite.y > height) {
		collision = "bottom";
	}
	//The `extra` function runs if there was a collision
	//and `extra` has been defined
	if (collision && extra) extra(collision);
		//Return the `collision` object
		return collision;
};

// function checkIfUndefined(varToCheck,defaultValue){
// 	return ( typeof varToCheck !== 'undefined')? varToCheck : defaultValue;
// }


/*
Move
----

Move a sprite by adding it's velocity to it's position

    move(sprite);
*/

function move(sprites) {
  if (sprites.length === 1) {
    var s = sprites[0];
    s.x += s.vx;
    s.y += s.vy;
  }
  else {
    for (var i = 0; i < sprites.length; i++) {
      var s = sprites[i];
      s.x += s.vx;
      s.y += s.vy;
    }
  }
}


//make stage Global Object - create all the global variable here

var buttons = [];
var draggableSprites = [];
var particles = [];
var tweens = [];
var shakingSprites = [];

function makeCanvas(width, height,border,backgroundColor) {
	var width = width || 256,
		height = height || 256,
		border	= border || "1px dashed black",
		backgroundColor = backgroundColor || "white";

	//Make the canvas element and add it to the DOM
	var canvas = document.createElement("canvas");
	canvas.id = "canvas";
	canvas.width = width;
	canvas.height = height;
	// canvas.style.width  = canvas.width.toString() + "px";
	// canvas.style.height = canvas.height.toString() + "px";
	canvas.style.border = border;
	canvas.style.backgroundColor = backgroundColor;
	document.body.appendChild(canvas);
	//Create the context as a property of the canvas
	canvas.ctx = canvas.getContext("2d");
	//Return the canvas
	return canvas;
}

function getCanvas(width, height,border,backgroundColor){
	var container = document.getElementById("container");
	container.style.width = width + "px";
	container.style.height = height + "px";

	var menu = document.getElementById("menu");
	menu.style.width = width + "px";
	menu.style.height = height + "px";

	var canvas = document.getElementById("game");
	canvas.width = width;
	canvas.height = height;
	canvas.style.border = border;
	canvas.style.backgroundColor = backgroundColor;
	//Create the context as a property of the canvas
	canvas.ctx = canvas.getContext("2d");
	//Return the canvas
	return canvas;
}

function DisplayObject(){
	//The sprite's position and size
	this.x = 0;
	this.y = 0;
	this.width = 0;
	this.height = 0;

	//Rotation, alpha, visible, and scale properties
	this.rotation = 0;
	this.alpha = 1;
	this.visible = true;
	this.scaleX = 1;
	this.scaleY = 1;

	//`pivotX` and `pivotY` let you set the sprite's axis of rotation
	//(o.5 represents the sprite's center point)
	this.pivotX = 0.5;
	this.pivotY = 0.5;

	//Add `vx` and `vy` (velocity) variables that will help you move the sprite
	this.vx = 0;
	this.vy = 0;

	//A "private" `_layer` property
	this._layer = 0;

	//A `children` array on the sprite that will contain all the
	//child sprites in this container
	this.children = [];

	//The sprite's `parent` property
	this.parent = undefined;

	//The sprite's `children` array
	//this.children = [];

	//Optional drop shadow properties.
	//Set `shadow` to `true` if you want the sprite to display a shadow
	this.shadow = false;
	this.shadowColor = "black";
	this.shadowOffsetX = 3;
	this.shadowOffsetY = 3;
	this.shadowBlur = 3;

	//Optional blend mode property
	this.blendMode = undefined;

	//pattern
	this.pattern = false;

	//Properties for advanced features:
	//Image states and animation
	this.frames = [];
	this.loop = true;
	this._currentFrame = 0;
	this.playing = false;

	//Can the sprite be dragged?
	this._draggable = undefined;

	//Is the sprite circular? If it is, it will be given a `radius`
	//and `diameter`
	this._circular = false;

	//Is the sprite `interactive`? If it is, it can become clickable
	//or touchable
	this._interactive = false;
}

DisplayObject.prototype = {
	//Global position
	get gx() {
			if (this.parent) {

				//The sprite's global x position is a combination of
				//its local x value and its parent's global x value
				return this.x + this.parent.gx;
			} else {
				return this.x;
			}
		},

	get gy() {
		if (this.parent) {
		return this.y + this.parent.gy;
		} else {
		return this.y;
		}
	},

	//Depth layer
	get layer() {
		return this._layer;
	},

	set layer(value) {
		this._layer = value;
		if (this.parent) {
			this.parent.children.sort(function(a, b) {return a.layer - b.layer});
		}
	},

	//The `addChild` method lets you add sprites to this container
	addChild: function(sprite) {
		if (sprite.parent) {
			sprite.parent.removeChild(sprite);
		}
		sprite.parent = this;
		this.children.push(sprite);
	},

	removeChild: function(sprite) {
		if(sprite.parent === this) {
			this.children.splice(this.children.indexOf(sprite), 1);
		} else {
			throw new Error(sprite + "is not a child of " + this);
		}
	},

	//Getters that return useful points on the sprite
	get halfWidth() {
		return this.width / 2;
	},

	get halfHeight() {
		return this.height / 2;
	},

	get centerX() {
		return this.x + this.halfWidth;
	},

	get centerY() {
		return this.y + this.halfHeight;
	},

	/* Conveniences */
	//A `position` getter. It returns an object with x and y properties
	get position() {
		return {x: this.x, y: this.y};
	},

	//A `setPosition` method to quickly set the sprite's x and y values
	setPosition: function(x, y) {
		this.x = x;
		this.y = y;
	},

	//method to create and intialize pattern
	setPattern: function(image,pattern){
		this.pattern = true;
		this.pattern = g.canvas.ctx.createPattern(image,pattern);
	},

	//The `localBounds` and `globalBounds` methods return an object
	//with `x`, `y`, `width`, and `height` properties that define
	//the dimensions and position of the sprite. This is a convenience
	//to help you set or test boundaries without having to know
	//these numbers or request them specifically in your code.
	get localBounds() {
		return {
			x: 0,
			y: 0,
			width: this.width,
			height: this.height
		};
	},
	get globalBounds() {
		return {
			x: this.gx,
			y: this.gy,
			width: this.gx + this.width,
			height: this.gy + this.height
		};
	},
	//`empty` is a convenience property that will return `true` or
	//`false` depending on whether this sprite's `children`
	//array is empty
	get empty() {
		if (this.children.length === 0) {
			return true;
		} else {
			return false;
		}
	},

	//The following "put" methods help you position
	//another sprite in and around this sprite. You can position
	//sprites relative to this sprite's center, top, right, bottom or
	//left sides. The `xOffset` and `yOffset`
	//arguments determine by how much the other sprite's position
	//should be offset from this position.
	//In all these methods, `b` is the second sprite that is being
	//positioned relative to the first sprite (this one), `a`
	//Center `b` inside `a`
	putCenter: function(b, xOffset, yOffset) {
		var a = this,
			xOffset = xOffset || 0,
			yOffset = yOffset || 0;
		b.x = (a.x + a.halfWidth - b.halfWidth) + xOffset;
		b.y = (a.y + a.halfHeight - b.halfHeight) + yOffset;
	},

	//Position `b` above `a`
	putTop: function(b, xOffset, yOffset) {
		var a = this,
			xOffset = xOffset || 0,
			yOffset = yOffset || 0;
		b.x = (a.x + a.halfWidth - b.halfWidth) + xOffset;
		b.y = (a.y - b.height) + yOffset;
	},

	//Position `b` to the right of `a`
	putRight: function(b, xOffset, yOffset) {
		var a = this,
			xOffset = xOffset || 0,
			yOffset = yOffset || 0;
		b.x = (a.x + a.width) + xOffset;
		b.y = (a.y + a.halfHeight - b.halfHeight) + yOffset;
	},

	//Position `b` below `a`
	putBottom: function(b, xOffset , yOffset) {
		var a = this,
			xOffset = xOffset || 0,
			yOffset = yOffset || 0;
		b.x = (a.x + a.halfWidth - b.halfWidth) + xOffset;
		b.y = (a.y + a.height) + yOffset;
	},

	//Position `b` to the left of `a`
	putLeft: function(b, xOffset, yOffset) {
		var a = this,
			xOffset = xOffset || 0,
			yOffset = yOffset || 0;
		b.x = (a.x - b.width) + xOffset;
		b.y = (a.y + a.halfHeight - b.halfHeight) + yOffset;
	},

	//Some extra conveniences for working with child sprites
	//Swap the depth layer positions of two child sprites
	swapChildren: function(child1, child2) {
		var index1 = this.children.indexOf(child1),
		index2 = this.children.indexOf(child2);
		if (index1 !== -1 && index2 !== -1) {
			//Swap the indexes
			child1.childIndex = index2;
			child2.childIndex = index1;
			//Swap the array positions
			this.children[index1] = child2;
			this.children[index2] = child1;
		} else {
			throw new Error('Both objects must be a child of the caller ' + this);
		}
	},

	//`add` and `remove` let you add and remove many sprites at the same time
	add: function(spritesToAdd) {
		spritesToAdd.forEach(function(sprite){ this.addChild(sprite);},this);
	},

	remove: function(spritesToRemove){
		for(var i = spritesToRemove.length-1; i >= 0; i--){
			this.removeChild(spritesToRemove[i]);
		}
	},
	removeHierarchy: function(spritesToRemove){
		for(var i = spritesToRemove.length -1; i >= 0; i--){
			if(spritesToRemove[i].children && spritesToRemove[i].children.length > 0){
				spritesToRemove[i].remove(spritesToRemove[i].children);
			}
			this.removeChild(spritesToRemove[i]);
		}
	},
	/* Advanced features */
	//If the sprite has more than one frame, return the
	//value of `_currentFrame`
	get currentFrame() {
		return this._currentFrame;
	},

	//The `circular` property lets you define whether a sprite
	//should be interpreted as a circular object. If you set
	//`circular` to `true`, the sprite is given `radius` and `diameter`
	//properties. If you set `circular` to `false`, the `radius`
	//and `diameter` properties are deleted from the sprite
	get circular() {
		return this._circular;
	},
	set circular (value) {
		//Give the sprite `diameter` and `radius` properties
		//if `circular` is `true`
		if (value === true && this._circular === false) {
			Object.defineProperties(this, {
				diameter: {
					get: function() {
						return this.width;
					},
					set: function(value) {
						this.width = value;
						this.height = value;
					},
					enumerable: true, configurable: true
				},
				radius: {
					get: function() {
						return this.halfWidth;
					},
					set: function(value) {
						this.width = value * 2;
						this.height = value * 2;
					},
					enumerable: true, configurable: true
				}
			});
			//Set this sprite's `_circular` property to `true`
			this._circular = true;
		}
		//Remove the sprite's `diameter` and `radius` properties
		//if `circular` is `false`
		if (value === false && this._circular === true) {
			delete this.diameter;
			delete this.radius;
			this._circular = false;
		}
	},

	//Is the sprite draggable by the pointer? If `draggable` is set
	//to `true`, the sprite is added to a `draggableSprites`
	//array. All the sprites in `draggableSprites` are updated each
	//frame to check whether they're being dragged.
	get draggable() {
		return this._draggable;
	},
	set draggable(value){
		if (value === true){
			draggableSprites.push(this);
			this._draggable = true;
		}
		//If it's `false`, remove it from the `draggableSprites` array
		if (value === false){
			draggableSprites.splice(draggableSprites.indexOf(this), 1);
		}
	},
	//Is the sprite interactive? If `interactive` is set to `true`,
	//the sprite is run through the `makeInteractive` function.
	//`makeInteractive` makes the sprite sensitive to pointer
	//actions. It also adds the sprite to the `buttons` array,
	//which is updated each frame.
	//(You’ll learn how to implement this in Chapter 6.)
	get interactive(){
		return this._interactive;
	},
	set interactive(value){
		if (value === true){
			//Add interactive properties to the sprite
			//so that it can act like a button
			makeInteractive(this);
			//Add the sprite to the global `buttons` array so
			//it can be updated each frame
			buttons.push(this);
			//Set this sprite’s private `_interactive` property to `true`
			this._interactive = true;
		}
		if (value === false){
			//Remove the sprite's reference from the
			//`buttons` array so that it's no longer affected
			//by mouse and touch interactivity
			buttons.splice(buttons.indexOf(this), 1);
			this._interactive = false;
		}
	}
};
//General Purpose remove function
function remove(spritesToRemove){
	for(var i = spritesToRemove.length-1; i >= 0; i--){
		spritesToRemove[i].parent.removeChild(spritesToRemove[i]);
	}
}

//Global object - container for the game
var stage = new DisplayObject();

function render(canvas) {
	//Get a reference to the context
	var ctx = canvas.ctx;

	//Clear the canvas
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	//Loop through each sprite object in the stage's `children` array
	stage.children.forEach(displaySprite);
	function displaySprite(sprite) {
		//Only display the sprite if it's visible
		//and within the area of the canvas
		if (
			sprite.visible
			&& sprite.gx < canvas.width + sprite.width
			&& sprite.gx + sprite.width >= -sprite.width
			&& sprite.gy < canvas.height + sprite.height
			&& sprite.gy + sprite.height >= -sprite.height
		) {
			//Save the canvas's present state
			ctx.save();

			//Shift the canvas to the center of the sprite's position
			ctx.translate(
			sprite.x + (sprite.width * sprite.pivotX),
			sprite.y + (sprite.height * sprite.pivotY)
			);
			//Set the sprite's `rotation`, `alpha` and `scale`
			ctx.rotate(sprite.rotation);
			ctx.globalAlpha = sprite.alpha * sprite.parent.alpha;
			ctx.scale(sprite.scaleX, sprite.scaleY);
			//Display the sprite's optional drop shadow
			if(sprite.shadow) {
				ctx.shadowColor = sprite.shadowColor;
				ctx.shadowOffsetX = sprite.shadowOffsetX;
				ctx.shadowOffsetY = sprite.shadowOffsetY;
				ctx.shadowBlur = sprite.shadowBlur;
			}
			//Display the optional blend mode
			if (sprite.blendMode) ctx.globalCompositeOperation = sprite.blendMode;

			//Use the sprite's own `render` method to draw the sprite
			if (sprite.render) sprite.render(ctx);

			if (sprite.children && sprite.children.length > 0) {
				//Reset the context back to the parent sprite's top-left corner,
				//relative to the pivot point
				ctx.translate(-sprite.width * sprite.pivotX , -sprite.height * sprite.pivotY);
				//Loop through the parent sprite's children
				sprite.children.forEach(function(child){
					//display the child
					displaySprite(child);
				});
			}
			//Restore the canvas to its previous state
			ctx.restore();
		}
	}
}

function Group(spritesToGroup){
	DisplayObject.call(this);

	spritesToGroup.forEach(function(sprite){this.addChild(sprite);},this);

}
Group.prototype = new DisplayObject();
Group.prototype.constructor = Group;

Group.prototype.addChild = function(sprite){
	if (sprite.parent) {
		sprite.parent.removeChild(sprite);
	}
	sprite.parent = this;
	this.children.push(sprite);
	//Figure out the new size of the group
	this.calculateSize();
};
Group.prototype.removeChild = function(sprite) {
	if(sprite.parent === this) {
		this.children.splice(this.children.indexOf(sprite),1);
		//Figure out the new size of the group
		this.calculateSize();
	} else {
		throw new Error(sprite + 'is not a child of ' + this);
	}
};
Group.prototype.calculateSize = function() {
//Calculate the width based on the size of the largest child
//that this sprite contains
	if (this.children.length > 0) {
		//Some temporary private variables to help track the new
		//calculated width and height
		this._newWidth = 0;
		this._newHeight = 0;
		//Find the width and height of the child sprites furthest
		//from the top left corner of the group
		this.children.forEach(function(child){

			//Find child sprites that combined x value and width
			//that's greater than the current value of `_newWidth`
			if (child.x + child.width > this._newWidth) {
				//The new width is a combination of the child's
				//x position and its width
				this._newWidth = child.x + child.width;
			}
			if (child.y + child.height > this._newHeight) {
				this._newHeight = child.y + child.height;
			}
		},this);
		//Apply the `_newWidth` and `_newHeight` to this sprite's width
		//and height
		this.width = this._newWidth;
		this.height = this._newHeight;
	}
};
//A higher level wrapper for the group sprite
function group(spritesToGroup) {
	var sprite = new Group(spritesToGroup);
	stage.addChild(sprite);
	return sprite;
}

function Sprite(source,x,y) {
	//Call the DisplayObject's constructor
	DisplayObject.call(this);
	//Assign the argument values to this sprite
	this.x = x || 0;
	this.y = y || 0;

	//We need to figure out what the source is, and then use
	//that source data to display the sprite image correctly
	//Is the source a JavaScript Image object?
	if (source){
		if(source instanceof Image) {
			this.createFromImage(source);
		}
		//Is the source a tileset from a texture atlas?
		//(It is if it has a `frame` property)
		else if (source.frame) {
			this.createFromAtlas(source);
		}
		//If the source contains an `image` subproperty, this must
		//be a `frame` object that's defining the rectangular area of an inner subimage.
		//Use that subimage to make the sprite. If it doesn't contain a
		//`data` property, then it must be a single frame
		else if (source.image && !source.data) {
			this.createFromTileset(source);
		}
		//If the source contains an `image` subproperty
		//and a `data` property, then it contains multiple frames
		else if (source.image && source.data) {
			this.createFromTilesetFrames(source);
		}
		else if (source instanceof Array) {
			if (source[0] && source[0].source) {
				//The source is an array of frames on a texture atlas tileset
				this.createFromAtlasFrames(source);
			}
			//It must be an array of image objects
			else if (source[0] instanceof Image){
				this.createFromImages(source);
			}
			//throw an error if the sources in the array aren't recognized
			else {
				throw new Error('The image sources in '+source+' are not recognized');
			}
		}
		//Throw an error if the source is something we can't interpret
		else {
			throw new Error('The image source '+source+' is not recognized');
		}
	}
}

Sprite.prototype = new DisplayObject();
Sprite.prototype.constructor = Sprite;

Sprite.prototype.createFromImage = function(source) {
    //Throw an error if the source is not an Image object
    if (!(source instanceof Image)) {
      throw new Error(source + ' is not an image object');
    } else {
		  this.source = source;
		  this.sourceX =  0;
		  this.sourceY =  0;
		  this.width = source.width;
		  this.height = source.height;
		  this.sourceWidth = source.width;
		  this.sourceHeight = source.height;
	}
};

 Sprite.prototype.createFromAtlas = function(source) {
    this.tilesetFrame = source;
    this.source = this.tilesetFrame.source;
    this.sourceX = this.tilesetFrame.frame.x;
    this.sourceY = this.tilesetFrame.frame.y;
    this.width = this.tilesetFrame.frame.w;
    this.height = this.tilesetFrame.frame.h;
    this.sourceWidth = this.tilesetFrame.frame.w;
    this.sourceHeight = this.tilesetFrame.frame.h;
};

Sprite.prototype.createFromTileset = function(source) {
	//Throw an error if the source is not an image object
	if (!(source.image instanceof Image)) {
	  throw new Error(source.image + ' is not an image object');
	}
	else {
	  this.source = source.image;
	  this.sourceX = source.x;
	  this.sourceY = source.y;
	  this.width = source.width;
	  this.height = source.height;
	  this.sourceWidth = source.width;
	  this.sourceHeight = source.height;
	}
};

Sprite.prototype.createFromTilesetFrames = function(source) {
	//Throw an error if the source is not an Image object
	if (!(source.image instanceof Image)) {
	  throw new Error(source.image + ' is not an image object');
	} else {
	  this.source = source.image;
	  this.frames = source.data;
	  //Set the sprite to the first frame
	  this.sourceX = this.frames[0][0];
	  this.sourceY = this.frames[0][1];
	  this.width = source.width;
	  this.height = source.height;
	  this.sourceWidth = source.width;
	  this.sourceHeight = source.height;
	}
};

Sprite.prototype.createFromAtlasFrames = function(source) {
	this.frames = source;
	this.source = source[0].source;
	this.sourceX = source[0].frame.x;
	this.sourceY = source[0].frame.y;
	this.width = source[0].frame.w;
	this.height = source[0].frame.h;
	this.sourceWidth = source[0].frame.w;
	this.sourceHeight = source[0].frame.h;
};

Sprite.prototype.createFromImages = function(source) {
	this.frames = source;
	this.source = source[0];
	this.sourceX = 0;
	this.sourceY = 0;
	this.width = source[0].width;
	this.height = source[0].width;
	this.sourceWidth = source[0].width;
	this.sourceHeight = source[0].height;
};
//Add a `gotoAndStop` method to go to a specific frame.
Sprite.prototype.gotoAndStop = function(frameNumber) {
    if (this.frames.length > 0 && frameNumber < this.frames.length) {

      //a. Frames made from tileset sub-images.
      //If each frame is an array, then the frames were made from an
      //ordinary Image object using the `frames` method
      if (this.frames[0] instanceof Array) {
        this.sourceX = this.frames[frameNumber][0];
        this.sourceY = this.frames[frameNumber][1];
      }

      //b. Frames made from texture atlas frames.
      //If each frame isn't an array, and it has a sub-object called `frame`,
      //then the frame must be a texture atlas id name.
      //In that case, get the source position from the atlas's `frame` object.
      else if (this.frames[frameNumber].frame) {
        this.sourceX = this.frames[frameNumber].frame.x;
        this.sourceY = this.frames[frameNumber].frame.y;
        this.sourceWidth = this.frames[frameNumber].frame.w;
        this.sourceHeight = this.frames[frameNumber].frame.h;
        this.width = this.frames[frameNumber].frame.w;
        this.height = this.frames[frameNumber].frame.h;
      }

      //c. Frames made from individual image objects.
      //If neither of the above are true, then each frame must be
      //an individual Image object
      else {
        this.source = this.frames[frameNumber];
        this.sourceX = 0;
        this.sourceY = 0;
        this.width = this.source.width;
        this.height = this.source.height;
        this.sourceWidth = this.source.width;
        this.sourceHeight = this.source.height;
      }
      //Set the `_currentFrame` value to the chosen frame
      this._currentFrame = frameNumber;
    }
    //Throw an error if this sprite doesn't contain any frames
    else {
      throw new Error('Frame number ' + frameNumber +' does not exist');
    }
  };

  //The `render` method explains how to draw the sprite
Sprite.prototype.render = function(ctx) {
	ctx.drawImage(
	  this.source,
	  this.sourceX, this.sourceY,
		this.sourceWidth, this.sourceHeight,
	  (-this.width * this.pivotX),
	  (-this.height * this.pivotY),
	  this.width, this.height
	);
};

//A higher-level wrapper
function sprite(source,x,y) {
	var sprite = new Sprite(source, x, y);
	if (sprite.frames.length > 0) addStatePlayer(sprite);
	stage.addChild(sprite);
	return sprite;
};

function frame(source, x, y, width, height){
	var o = {};
	o.image = source;
	o.x = x;
	o.y = y;
	o.width = width;
	o.height = height;
	return o;
};

function frames(source, arrayOfPositions, width, height){
	var o = {};
	o.image = source;
	o.data = arrayOfPositions;
	o.width = width;
	o.height = height;
	return o;
};
function randomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
};

function contain (sprite, bounds, _bounce, _extra){
	var x = bounds.x,
	y = bounds.y,
	width = bounds.width,
	height = bounds.height;

	var bounce = _bounce || false;
	var extra = _extra || undefined;
	//The `collision` object is used to store which
	//side of the containing rectangle the sprite hits
	var collision;
	//Left
	if (sprite.x < x) {
		//Bounce the sprite if `bounce` is true
		if (bounce) sprite.vx *= -1;
		//If the sprite has `mass`, let the mass
		//affect the sprite's velocity
		if(sprite.mass) sprite.vx /= sprite.mass;
		sprite.x = x;
		collision = "left";
	}
	//Top
	if (sprite.y < y) {
		if (bounce) sprite.vy *= -1;
		if(sprite.mass) sprite.vy /= sprite.mass;
		sprite.y = y;
		collision = "top";
	}
	//Right
	if (sprite.x + sprite.width > width) {
		if (bounce) sprite.vx *= -1;
		if(sprite.mass) sprite.vx /= sprite.mass;
		sprite.x = width - sprite.width;
		collision = "right";
	}
	//Bottom
	if (sprite.y + sprite.height > height) {
		if (bounce) sprite.vy *= -1;
		if(sprite.mass) sprite.vy /= sprite.mass;
		sprite.y = height - sprite.height;
		collision = "bottom";
	}
	//The `extra` function runs if there was a collision
	//and `extra` has been defined
	if (collision && extra) extra(collision);
		//Return the `collision` object
		return collision;
};


function renderWithInterpolation(canvas, lagOffset){
  //Get a reference to the context
  var ctx = canvas.ctx;

  //Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  //Loop through each sprite object in the stage's `children` array
  stage.children.forEach(displaySprite);

  function displaySprite(sprite) {
    //Only display the sprite if it's visible
    //and within the area of the canvas
    if (
      sprite.visible
      && sprite.gx < canvas.width + sprite.width
      && sprite.gx + sprite.width > -sprite.width
      && sprite.gy < canvas.height + sprite.height
      && sprite.gy + sprite.height > -sprite.height
		) {

		  //Save the canvas's present state
		  ctx.save();
		  //Interpolation
		  if (sprite.previousX !== undefined) {
				sprite.renderX = (sprite.x - sprite.previousX) * lagOffset + sprite.previousX;
		  }else{
				sprite.renderX = sprite.x;
		  }
		  if (sprite.previousY !== undefined) {
				sprite.renderY = (sprite.y - sprite.previousY) * lagOffset + sprite.previousY;
		  }else{
				sprite.renderY = sprite.y;
		  }

		  //Draw the sprite at its interpolated position
		  ctx.translate(
				sprite.renderX + (sprite.width * sprite.pivotX),
				sprite.renderY + (sprite.height * sprite.pivotY)
		  );

		  //Set the sprite's `rotation`, `alpha` and `scale`
		  ctx.rotate(sprite.rotation);
		  ctx.globalAlpha = sprite.alpha * sprite.parent.alpha;
		 	ctx.scale(sprite.scaleX, sprite.scaleY);

		  //Display the sprite's optional drop shadow
		  if(sprite.shadow) {
				ctx.shadowColor = sprite.shadowColor;
				ctx.shadowOffsetX = sprite.shadowOffsetX;
				ctx.shadowOffsetY = sprite.shadowOffsetY;
				ctx.shadowBlur = sprite.shadowBlur;
		  }

		  //Display the optional blend mode
		  if(sprite.blendMode) ctx.globalCompositeOperation = sprite.blendMode;

		  //Use the sprite's own `render` method to draw the sprite
		  if(sprite.render) sprite.render(ctx);

		  //If the sprite contains child sprites in its
		  //`children` array, display them by recursively calling this very same
		  //`displaySprite` function again
		  if(sprite.children && sprite.children.length > 0){
				//Reset the context back to the parent sprite's top left corner,
				//relative to the pivot point
				ctx.translate(-sprite.width * sprite.pivotX , -sprite.height * sprite.pivotY);
				//Loop through the parent sprite's children
				sprite.children.forEach(displaySprite);
		  }
		  //Restore the canvas to its previous state
		  ctx.restore();
		}
  }
}

function Button(source, x, y){
	Sprite.call(this,source,x,y);
	this.x = x || 0;
	this.y = y || 0;
	this.interactive = true;
}

Button.prototype = new Sprite();
Button.prototype.constructor = Button;

function button(source, x, y) {
	var sprite = new Button(source, x, y);
	stage.addChild(sprite);
	return sprite;
}

function makeInteractive(o){
	//The `press`, `release`, `over`, `out`, and `tap` methods. They're `undefined`
	//for now, but they can be defined in the game program
	o.press = o.press || undefined;
	o.release = o.release || undefined;
	o.over = o.over || undefined;
	o.out = o.out || undefined;
	o.tap = o.tap || undefined;
	//The `state` property tells you the button's
	//current state. Set its initial state to "up"
	o.state = "up";
	//The `action` property tells you whether it’s being pressed or
	//released
	o.action = "";
	//The `pressed` and `hoverOver` Booleans are mainly for internal
	//use in this code to help figure out the correct state.
	//`pressed` is a Boolean that helps track whether
	//the sprite has been pressed down
	o.pressed = false;
	//`hoverOver` is a Boolean that checks whether the pointer
	//has hovered over the sprite
	o.hoverOver = false;
	//The `update` method will be called each frame
	//inside the game loop
	o.update = function(pointer, canvas){
		//Figure out if the pointer is touching the sprite
		var hit = pointer.hitTestSprite(o);
		//1. Figure out the current state
		if (pointer.isUp) {
			//Up state
			o.state = "up";
			//Show the first image state frame, if this is a `Button` sprite
			if (o instanceof Button) o.gotoAndStop(0);
		}
		//If the pointer is touching the sprite, figure out
		//if the over or down state should be displayed
		if (hit) {
			//Over state
			o.state = "over";
			//Show the second image state frame if this sprite has
			//3 frames and it's a `Button` sprite
			if (o.frames && o.frames.length === 3 && o instanceof Button) {
				o.gotoAndStop(1);
			}
			//Down state
			if (pointer.isDown) {
				o.state = "down";
				//Show the third frame if this sprite is a `Button` sprite and it
				//has only three frames, or show the second frame if it
				//has only two frames
				if(o instanceof Button) {
					if (o.frames.length === 3) {
						o.gotoAndStop(2);
					} else {
						o.gotoAndStop(1);
					}
				}
			}
		}
		//Perform the correct interactive action
		//a. Run the `press` method if the sprite state is "down" and
		//the sprite hasn't already been pressed
		if (o.state === "down") {
			if (!o.pressed) {
				if (o.press) o.press();
				o.pressed = true;
				o.action = "pressed";
			}
		}
		//b. Run the `release` method if the sprite state is "over" and
		//the sprite has been pressed
		if (o.state === "over") {
			if (o.pressed) {
				if (o.release) o.release();
				o.pressed = false;
				o.action = "released";
				//If the pointer was tapped and the user assigned a `tap`
				//method, call the `tap` method
				if (pointer.tapped && o.tap) o.tap();
			}
			//Run the `over` method if it has been assigned
			if (!o.hoverOver){
				if (o.over) o.over();
				o.hoverOver = true;
			}
		}
		//c. Check whether the pointer has been released outside
		//the sprite's area. If the button state is "up" and it has
		//already been pressed, then run the `release` method
		if (o.state === "up") {
			if (o.pressed) {
				if (o.release) o.release();
				o.pressed = false;
				o.action = "released";
			}
			//Run the `out` method if it has been assigned
			if (o.hoverOver) {
				if (o.out) o.out();
				o.hoverOver = false;
			}
		}
	};
}



/*
grid
----

Helps you to automatically create a grid of sprites. `grid` returns a
`group` sprite object that contains a sprite for every cell in the
grid. You can define the rows and columns in the grid, whether or
not the sprites should be centered inside each cell, or what their offset from the
top left corner of each cell should be. Supply a function that
returns the sprite that you want to make for each cell. You can
supply an optional final function that runs any extra code after
each sprite has been created. Here's the format for creating a grid:

    gridGroup = grid(

      //Set the grid's properties
      columns, rows, cellWidth, cellHeight,
      areSpirtesCentered?, xOffset, yOffset,

      //A function that returns a sprite
      () => g.circle(16, "blue"),

      //An optional final function that runs some extra code
      () => console.log("extra!")
    );
*/
function grid(
    columns, rows, cellWidth, cellHeight,
    centerCell, xOffset, yOffset ,
    makeSprite,
    extra
  ){

	var columns = columns || 0,
	rows = rows || 0,
	cellWidth = cellWidth || 32,
	cellHeight = cellHeight || 32,
	centerCell = centerCell || false,
	xOffset = xOffset || 0,
	yOffset = yOffset || 0,
	makeSprite = makeSprite || undefined,
	extra = extra || undefined;

  //Create an empty group called `container`. This `container`
  //group is what the function returns back to the main program.
  //All the sprites in the grid cells will be added
  //as children to this container
  var container = group([]);

  //The `create` method plots the grid

  var createGrid = function(){

    //Figure out the number of cells in the grid
    var length = columns * rows;

    //Create a sprite for each cell
    for(var i = 0; i < length; i++) {

      //Figure out the sprite's x/y placement in the grid
      var x = (i % columns) * cellWidth,
          y = Math.floor(i / columns) * cellHeight;

      //Use the `makeSprite` function supplied in the constructor
      //to make a sprite for the grid cell
      var sprite = makeSprite();

      //Add the sprite to the `container`
      container.addChild(sprite);

      //Should the sprite be centered in the cell?

      //No, it shouldn't be centered
      if (!centerCell) {
        sprite.x = x + xOffset;
        sprite.y = y + yOffset;
      }

      //Yes, it should be centered
      else {
        sprite.x
          = x + (cellWidth / 2)
          - sprite.halfWidth + xOffset;
        sprite.y
          = y + (cellHeight / 2)
          - sprite.halfHeight + yOffset;
      }
      //Run any optional extra code. This calls the
      //`extra` function supplied by the constructor
      if (extra) extra(sprite);
    }
  };

  //Run the `createGrid` method
  createGrid();

  //Return the `container` group back to the main program
  return container;
}

/*
addStatePlayer
-------------

`addStatePlayer` adds a state manager and keyframe animation player for
sprites with more than one frame. Its called automatically when
`sprite`s are created.

*/

function addStatePlayer(sprite) {
  var frameCounter = 0,
      numberOfFrames = 0,
      startFrame = 0,
      endFrame = 0,
      timerInterval = undefined;
      //playing = false;

  //The `show` function (to display static states.)
  function show(frameNumber) {
    //Reset any possible previous animations
    reset();

    //Find the new state on the sprite.
    sprite.gotoAndStop(frameNumber);
  }

  //The `play` function plays all the sprites frames
function play() {
	if (!sprite.playing) {
	  playSequence([0, sprite.frames.length - 1]);
	}
}

//The `stop` function stops the animation at the current frame
function stop() {
	if (sprite.playing) {
	  reset();
	  sprite.gotoAndStop(sprite.currentFrame);
	}
}

	//The `playSequence` function, to play a sequence of frames.
	function playSequence(sequenceArray){
		//Reset any possible previous animations
		reset();

		//Figure out how many frames there are in the range
		startFrame = sequenceArray[0];
		endFrame = sequenceArray[1];
		numberOfFrames = endFrame - startFrame;

		//Compensate for two edge cases:
		//1. If the `startFrame` happens to be `0`
		if (startFrame === 0) {
		  numberOfFrames += 1;
		  frameCounter += 1;
		}

		//2. If only a two-frame sequence was provided
		if(numberOfFrames === 1){
		  numberOfFrames = 2;
		  frameCounter += 1;
		};

		//Calculate the frame rate. Set the default fps to 12
		if (!sprite.fps) sprite.fps = 12;

		var frameRate = 1000 / sprite.fps;

		//Set the sprite to the starting frame
		sprite.gotoAndStop(startFrame);

		//If the state isn't already playing, start it
		if(!sprite.playing) {
		  timerInterval = setInterval(advanceFrame.bind(this), frameRate);
		  sprite.playing = true;
		}
	}

//`advanceFrame` is called by `setInterval` to display the next frame
//in the sequence based on the `frameRate`. When frame sequence
//reaches the end, it will either stop it or loop it
	function advanceFrame(){
	//Advance the frame if `frameCounter` is less than
	//the state's total frames
	if (frameCounter < numberOfFrames) {

	  //Advance the frame
	  sprite.gotoAndStop(sprite.currentFrame + 1);

	  //Update the frame counter
	  frameCounter += 1;

	//If we've reached the last frame and `loop`
	//is `true`, then start from the first frame again
	} else {
	  if (sprite.loop) {
		sprite.gotoAndStop(startFrame);
		frameCounter = 1;
	  }
	}
}

function reset(){
	//Reset `playing` to `false`, set the `frameCounter` to 0,
	//and clear the `timerInterval`
	if (timerInterval !== undefined && sprite.playing === true) {
	  sprite.playing = false;
	  frameCounter = 0;
	  startFrame = 0;
	  endFrame = 0;
	  numberOfFrames = 0;
	  clearInterval(timerInterval);
	}
}

  //Add the `show`, `play`, `stop` and `playSequence` methods to the sprite.
  sprite.show = show;
  sprite.play = play;
  sprite.stop = stop;
  //sprite.playing = playing;
  sprite.playSequence = playSequence;
}

function filmstrip(image, frameWidth, frameHeight, spacing){
	var spacing = spacing || 0;
	//An array to store the x and y positions of each frame
	var positions = [];
	//Find out how many columns and rows there are in the image
	var columns = image.width / frameWidth,
	rows = image.height / frameHeight;
	//Find the total number of frames
	var numberOfFrames = columns * rows;

	for(var i = 0; i < numberOfFrames; i++) {
		//Find the correct row and column for each frame
		//and figure out its x and y position
		var x = (i % columns) * frameWidth,
		y = Math.floor(i / columns) * frameHeight;
		//Compensate for any optional spacing (padding) around the frames if
		//there is any. This bit of code accumulates the spacing offsets from the
		//left side of the tileset and adds them to the current tile's position
		if (spacing && spacing > 0) {
			x += spacing + (spacing * i % columns);
			y += spacing + (spacing * Math.floor(i / columns));
		}
		//Add the x and y value of each frame to the `positions` array
		positions.push([x, y]);
	}
	//Create and return the animation frames using the `frames` method
	return frames(image, positions, frameWidth, frameHeight);
};


var progressBar = {
	maxWidth: 0,
	height: 0,
	backgroundColor: "gray",
	foregroundColor: "cyan",
	backBar: null,
	frontBar: null,
	percentage: null,
	assets: null,
	initialized: false,
	//Use the `create` method to create the progress bar
	create: function(canvas, assets) {
		if (!this.initialized) {
			//Store a reference to the `assets` object
			this.assets = assets;
			//Set the maximum width to half the width of the canvas
			this.maxWidth = canvas.width / 2;
			//Build the progress bar using two rectangle sprites and
			//one text sprite:
			//1. Create the background bar's gray background
			this.backBar = rectangle(this.maxWidth, 32, this.backgroundColor);
			this.backBar.x = (canvas.width / 2) - (this.maxWidth / 2);
			this.backBar.y = (canvas.height / 2) - 16;
			//2. Create the blue foreground bar. This is the element of the
			//progress bar that will increase in width as assets load
			this.frontBar = rectangle(this.maxWidth, 32, this.foregroundColor);
			this.frontBar.x = (canvas.width / 2) - (this.maxWidth / 2);
			this.frontBar.y = (canvas.height / 2) - 16;
			//3. A text sprite that will display the percentage
			//of assets that have loaded
			this.percentage = text("0%", "28px sans-serif", "black");
			this.percentage.x = (canvas.width / 2) - (this.maxWidth / 2) + 12;
			this.percentage.y = (canvas.height / 2) - 16;
			//Flag the `progressBar` as having been initialized
			this.initialized = true;
		}
	},
	//Use the `update` method to update the width of the bar and
	//percentage loaded each frame:
	update: function(){
		//Change the width of the blue `frontBar` to match the
		//ratio of assets that have loaded. Adding `+1` to
		//`assets.loaded` means that the loading bar will appear at 100%
		//when the last asset is being loaded, which is reassuring for the
		//player observing the load progress

		var ratio = (this.assets.loaded + 1) / this.assets.toLoad;
		this.frontBar.width = this.maxWidth * ratio;
		//Display the percentage
		this.percentage.content = Math.floor((ratio) * 100) + '%';
	},
	//Use the `remove` method to remove the progress bar when all the
	//game assets have finished loading
/* 	remove: function() {
		//Remove the progress bar using the universal sprite `remove` function
		remove([this.frontBar]);
		remove([this.backBar]);
		remove([this.percentage]);
	} */
	remove: function() {
		//Remove the progress bar using the universal sprite `remove` function
		remove([this.frontBar,this.backBar,this.percentage]);
	}
};


function shake(sprite, magnitude, angular,noOfFrames){
	var magnitude = magnitude || 16,
		angular = angular || false;
	//A counter to count the number of shakes
	var counter = 1;
	//The total number of shakes (there will be 1 shake per frame)
	var numberOfShakes = noOfFrames || 10;
	//Capture the sprite's position and angle so you can
	//restore them after the shaking has finished
	var startX = sprite.x,
	startY = sprite.y,
	startAngle = sprite.rotation;
	//Divide the magnitude into 10 units so that you can
	//reduce the amount of shake by 10 percent each frame
	var magnitudeUnit = magnitude / numberOfShakes;
	//The `randomInt` helper function
	var randomInt = function(min, max){
		return Math.floor(Math.random() * (max - min + 1)) + min;
	};
	//Add the sprite to the `shakingSprites` array if it
	//isn't already there
	if(shakingSprites.indexOf(sprite) === -1){
		shakingSprites.push(sprite);
		//Add an `updateShake` method to the sprite.
		//The `updateShake` method will be called each frame
		//in the game loop. The shake effect type can be either
		//up and down (x/y shaking) or angular (rotational shaking)
		sprite.updateShake = function(){
			if(angular) {
				angularShake();
			} else {
				upAndDownShake();
			}
		};
	}
	//The `upAndDownShake` function
	function upAndDownShake() {
		//Shake the sprite while the `counter` is less than
		//the `numberOfShakes`
		if (counter < numberOfShakes) {
			//Reset the sprite's position at the start of each shake
			sprite.x = startX;
			sprite.y = startY;
			//Reduce the magnitude
			magnitude -= magnitudeUnit;
			//Randomly change the sprite's position
			sprite.x += randomInt(-magnitude, magnitude);
			sprite.y += randomInt(-magnitude, magnitude);
			//Add 1 to the counter
			counter += 1;
		}
		//When the shaking is finished, restore the sprite to its original
		//position and remove it from the `shakingSprites` array
		if (counter >= numberOfShakes){
			sprite.x = startX;
			sprite.y = startY;
			shakingSprites.splice(shakingSprites.indexOf(sprite), 1);
		}
	}
	//The `angularShake` function
	//First set the initial tilt angle to the right (+1)
	var tiltAngle = 1;

	function angularShake() {
		if (counter < numberOfShakes) {
			//Reset the sprite's rotation
			sprite.rotation = startAngle;
			//Reduce the magnitude
			magnitude -= magnitudeUnit;
			//Rotate the sprite left or right, depending on the direction,
			//by an amount in radians that matches the magnitude
			sprite.rotation = magnitude * tiltAngle;
			counter += 1;
			//Reverse the tilt angle so that the sprite is tilted
			//in the opposite direction for the next shake
			tiltAngle *= -1;
		}
		//When the shaking is finished, reset the sprite's angle and
		//remove it from the `shakingSprites` array
		if (counter >= numberOfShakes){
			sprite.rotation = startAngle;
			shakingSprites.splice(shakingSprites.indexOf(sprite), 1);
		}
	}
}

function Rectangle(width, height, fillStyle, strokeStyle, lineWidth, x, y){
	//Call the DisplayObject's constructor
	DisplayObject.call(this);

	this.width = width || 32;
	this.height = height || 32;
	this.fillStyle = fillStyle || "#d3d3d3";
	this.strokeStyle = strokeStyle || "#d3d3d3";
	this.lineWidth = lineWidth || 0;
	this.x = x || 0;
	this.y = y || 0;
	this.mask = false;
}

Rectangle.prototype = new DisplayObject();
Rectangle.prototype.constructor=Rectangle;

//The `render` method explains how to draw the sprite
Rectangle.prototype.render= function(ctx) {
		ctx.strokeStyle = this.strokeStyle;
		ctx.lineWidth = this.lineWidth;
		 if(this.pattern)
			ctx.fillStyle = this.pattern;
		else
			ctx.fillStyle = this.fillStyle;
		ctx.beginPath();
		ctx.rect(
		//Draw the sprite around its 'pivotX' and 'pivotY' point
		-this.width * this.pivotX,
		-this.height * this.pivotY,
		this.width,
		this.height
		);
		if (this.strokeStyle !== "none") ctx.stroke();
		if (this.fillStyle !== "none") ctx.fill();
		if (this.mask && this.mask === true) ctx.clip();
};
//A higher-level wrapper for the rectangle sprite
function rectangle(width, height, fillStyle, strokeStyle, lineWidth, x, y) {
	//Create the sprite
	var sprite = new Rectangle(width, height, fillStyle, strokeStyle, lineWidth, x, y);
	//Add the sprite to the stage
	stage.addChild(sprite);
	//Return the sprite to the main program
	return sprite;
}


function Circle(diameter,fillStyle,strokeStyle,lineWidth,x,y) {
	//Call the DisplayObject's constructor
	DisplayObject.call(this);

	//Enable `radius` and `diameter` properties
	this.circular = true;

	//Assign the argument values to this sprite
	this.diameter = diameter || 32;
	this.fillStyle = fillStyle || "#d3d3d3";
	this.strokeStyle = strokeStyle || "#d3d3d3";
	this.lineWidth = lineWidth || 0;
	this.x = x || 0;
	this.y = y || 0;
	//Add a `mask` property to enable optional masking
	this.mask = false;
}
Circle.prototype = new DisplayObject();
Circle.prototype.constructor=Circle;
//The `render` method
Circle.prototype.render= function(ctx) {
		ctx.strokeStyle = this.strokeStyle;
		ctx.lineWidth = this.lineWidth;
		ctx.fillStyle = this.fillStyle;
		ctx.beginPath();
		ctx.arc(
			this.radius + (-this.diameter * this.pivotX),
			this.radius + (-this.diameter * this.pivotY),
			this.radius,
			0, 2*Math.PI,
			false
		);
	if (this.strokeStyle !== "none") ctx.stroke();
	if (this.fillStyle !== "none") ctx.fill();
	if (this.mask && this.mask === true) ctx.clip();
};
//A higher level wrapper for the circle sprite
function circle(diameter, fillStyle, strokeStyle, lineWidth, x, y){
	var sprite = new Circle(diameter, fillStyle, strokeStyle, lineWidth, x, y);
	stage.addChild(sprite);
	return sprite;
}

function Ellipse(x, y, width, height,fillStyle, strokeStyle, lineWidth){
	//Call the DisplayObject's constructor
	DisplayObject.call(this);

	this.x = x || 0;
	this.y = y || 0;
	this.width = width;
	this.height = height;

	this.fillStyle = fillStyle || "black";
	this.strokeStyle = strokeStyle || "#d3d3d3";
	this.lineWidth = lineWidth || 0;

	//Add a `mask` property to enable optional masking
	this.mask = false;
}

Ellipse.prototype = new DisplayObject();
Ellipse.prototype.constructor=Ellipse;

Ellipse.prototype.render = function(ctx){
	ctx.strokeStyle = this.strokeStyle;
	ctx.lineWidth = this.lineWidth;
	ctx.fillStyle = this.fillStyle;

	ctx.beginPath();

	ctx.moveTo(this.x, this.y - this.height/2);
	ctx.bezierCurveTo(
		this.x + this.width/2, this.y - this.height/2,
		this.x + this.width/2, this.y + this.height/2,
		this.x, this.y + this.height/2
	);

	ctx.bezierCurveTo(
		this.x - this.width/2, this.y + this.height/2,
		this.x - this.width/2, this.y - this.height/2,
		this.x, this.y - this.height/2
	);

	if (this.strokeStyle !== "none") ctx.stroke();
	if (this.fillStyle !== "none") ctx.fill();
	if (this.mask && this.mask === true) ctx.clip();
}

//A higher level wrapper for the circle sprite
function ellipse(x, y, width, height,fillStyle, strokeStyle, lineWidth){
	var sprite = new Ellipse(x, y, width, height,fillStyle, strokeStyle, lineWidth);
	stage.addChild(sprite);
	return sprite;
}

function Line(strokeStyle,lineWidth,ax,ay,bx,by) {
	//Call the DisplayObject's constructor
	DisplayObject.call(this);

	//Assign the argument values to this sprite
	this.ax = ax || 0;
	this.ay = ay || 0;
	this.bx = bx || 32;
	this.by = by || 32;

	this.strokeStyle = strokeStyle || "#d3d3d3";
	this.lineWidth = lineWidth || 0;

	//The `lineJoin` style.
	//Options are "round", "mitre" and "bevel".
	this.lineJoin = "round";

}
Line.prototype = new DisplayObject();
Line.prototype.constructor=Line;
//The `render` method
Line.prototype.render=function(ctx) {
		ctx.strokeStyle = this.strokeStyle;
		ctx.lineWidth = this.lineWidth;
		ctx.lineJoin = this.lineJoin;
		ctx.beginPath();
		ctx.moveTo(this.ax, this.ay);
		ctx.lineTo(this.bx, this.by);
		if (this.strokeStyle !== "none") ctx.stroke();
};
//A higher-level wrapper for the line sprite
function line(strokeStyle, lineWidth, ax, ay, bx, by) {
	var sprite = new Line(strokeStyle, lineWidth, ax, ay, bx, by);
	stage.addChild(sprite);
	return sprite;
}

function Text(content,font,fillStyle,x,y) {
	//Call the DisplayObject's constructor
	DisplayObject.call(this);

	this.content = content || "Hello";
	this.font = font || "12px sans-serif";
	this.fillStyle = fillStyle || "#d3d3d3";
	this.x = x || 0;
	this.y = y || 0;

	//Set the default text baseline to "top"
	this.textBaseline = "top";

	//Set `strokeText` to "none"
	this.strokeText = "none";

	g.canvas.ctx.font = this.font;
	g.canvas.ctx.textBaseline = "top";
	this.width = g.canvas.ctx.measureText(this.content).width;
	this.height = g.canvas.ctx.measureText("M").width;
}
Text.prototype = new DisplayObject();
Text.prototype.constructor = Text;

//The `render` method describes how to draw the sprite
Text.prototype.render = function(ctx) {
		ctx.font = this.font;
		// ctx.strokeStyle = this.strokeStyle;
		ctx.lineWidth = this.lineWidth;
		ctx.fillStyle = this.fillStyle;
		//Measure the width and height of the text
		// if(this.width === 0) this.width = ctx.measureText(this.content).width;
		// if(this.height === 0) this.height = ctx.measureText("M").width;
		ctx.translate(
			-this.width * this.pivotX,
			-this.height * this.pivotY
		);
		ctx.textBaseline = this.textBaseline;
		ctx.fillText(
			this.content,
			0,
			0
		);
		if (this.strokeText !== "none") ctx.strokeText();
};
//A higher level wrapper
function text(content, font, fillStyle, x, y) {
	var sprite = new Text(content, font, fillStyle, x, y);
	stage.addChild(sprite);
	return sprite;
}

function keyboard(keyCode) {
	var key = {};
	key.code = keyCode;
	key.isDown = false;
	key.isUp = true;
	key.press = undefined;
	key.release = undefined;

	//The `downHandler`
	key.downHandler = function(event) {
		if (event.keyCode === key.code) {
			if (key.isUp && key.press)	key.press();
			key.isDown = true;
			key.isUp = false;
		}
		//Prevent the event's default behavior
		//(such as browser window scrolling)
		event.preventDefault();
	};

	//The `upHandler`
	key.upHandler = function(event) {
		if (event.keyCode === key.code) {
			if (key.isDown && key.release) key.release();
			key.isDown = false;
			key.isUp = true;
		}
		event.preventDefault();
	};

		//Attach event listeners
		window.addEventListener("keydown", key.downHandler.bind(key), false);
		window.addEventListener("keyup", key.upHandler.bind(key), false);
	//Return the `key` object
	return key;
}

function makePointer(element, scale){
	var pointer = {
		element: element,
		scale: scale || 1,
		//Private x and y properties
		_x: 0,
		_y: 0,
		//The public x and y properties are divided by the scale. If the
		//HTML element that the pointer is sensitive to (like the canvas)
		//is scaled up or down, you can change the `scale` value to
		//correct the pointer's position values
		get x() {
			return this._x / this.scale;
		},
		get y() {
			return this._y / this.scale;
		},
		//Add `centerX` and `centerY` getters so that we
		//can use the pointer's coordinates with easing
		//and collision functions
		get centerX() {
			return this.x;
		},
		get centerY() {
			return this.y;
		},
		//`position` returns an object with x and y properties that
		//contain the pointer's position
		get position() {
			return {x: this.x, y: this.y};
		},
		//Booleans to track the pointer state
		isDown: false,
		isUp: true,
		tapped: false,
		//Properties to help measure the time between up and down states
		downTime: 0,
		elapsedTime: 0,
		//Optional, user-definable `press`, `release`, and `tap` methods
		press: undefined,
		release: undefined,
		tap: undefined,
		//New drag and drop properties:
		dragSprite: null,
		dragOffsetX: 0,
		dragOffsetY: 0,

		updateDragAndDrop: function(sprite){
	  //Check whether the pointer is pressed down
	  if (this.isDown) {

		//You need to capture the co-ordinates at which the pointer was
		//pressed down and find out if it's touching a sprite

		//Only run this code if the pointer isn't already dragging
		//sprite
		if (this.dragSprite === null) {

		  //Loop through the `draggableSprites` in reverse to start searching at the bottom of the stack
		  for (var i = draggableSprites.length - 1; i > -1; i--) {
			var sprite = draggableSprites[i];

			//Check for a collision with the pointer using `hitTestSprite`
			if (this.hitTestSprite(sprite) && sprite.draggable) {

			  //Calculate the difference between the pointer's
			  //position and the sprite's position
			  this.dragOffsetX = this.x - sprite.gx;
			  this.dragOffsetY = this.y - sprite.gy;

			  //Set the sprite as the pointer's `dragSprite` property
			  this.dragSprite = sprite;

			  //The next two lines re-order the `sprites` array so that the
			  //selected sprite is displayed above all the others.
			  //First, splice the sprite out of its current position in
			  //its parent's `children` array
			  var children = sprite.parent.children;
			  children.splice(children.indexOf(sprite), 1);

			  //Next, push the `dragSprite` to the end of its `children` array so that it's
			  //displayed last, above all the other sprites
			  children.push(sprite);

			  //Reorganize the `draggableSpites` array in the same way
			  draggableSprites.splice(draggableSprites.indexOf(sprite), 1);
			  draggableSprites.push(sprite);

			  //Break the loop, because we only need to drag the topmost sprite
			  break;
			}
		  }
		}

		//If the pointer is down and it has a `dragSprite`, make the sprite follow the pointer's
		//position, with the calculated offset
		else {
		  this.dragSprite.x = this.x - this.dragOffsetX;
		  this.dragSprite.y = this.y - this.dragOffsetY;
		}
	  }

	  //If the pointer is up, drop the `dragSprite` by setting it to `null`
	  if (this.isUp) {
		this.dragSprite = null;
	  }

	  //Change the mouse arrow pointer to a hand if it's over a
	  //draggable sprite
	  draggableSprites.some(function(sprite){
		if (this.hitTestSprite(sprite) && sprite.draggable) {
		  this.element.style.cursor = "pointer";
		  return true;
		} else {
			  this.element.style.cursor = "auto";
			  return false;
			}
	  },this);

	},
		//The pointer's mouse `moveHandler`
	moveHandler: function(event) {
		//Get the element that's firing the event
		var element = event.target;
		//Find the pointer’s x,y position (for mouse).
		//Subtract the element's top and left offset from the browser window
		this._x = (event.pageX - element.offsetLeft);
		this._y = (event.pageY - element.offsetTop);
		//Prevent the event's default behavior
		event.preventDefault();
	},
	//The pointer's `touchmoveHandler`
	touchmoveHandler: function(event) {
		var element = event.target;
		//Find the touch point's x,y position
		this._x = (event.targetTouches[0].pageX - element.offsetLeft);
		this._y = (event.targetTouches[0].pageY - element.offsetTop);
		event.preventDefault();
	},
	//The pointer's `downHandler`
	downHandler: function(event) {
		//Set the down states
		this.isDown = true;
		this.isUp = false;
		this.tapped = false;
		//Capture the current time
		this.downTime = Date.now();
		//Call the `press` method if it's been assigned by the user
		if (this.press) this.press();
		event.preventDefault();
	},
	//The pointer's `touchstartHandler`
	touchstartHandler: function(event) {
		var element = event.target;
		//Find the touch point's x,y position
		this._x = event.targetTouches[0].pageX - element.offsetLeft;
		this._y = event.targetTouches[0].pageY - element.offsetTop;
		//Set the down states
		this.isDown = true;
		this.isUp = false;
		this.tapped = false;
		//Capture the current time
		this.downTime = Date.now();
		//Call the `press` method if it's been assigned by the user
		if (this.press) this.press();
		event.preventDefault();
	},
	//The pointer's `upHandler`
	upHandler: function(event) {
		//Figure out how much time the pointer has been down
		this.elapsedTime = Math.abs(this.downTime - Date.now());
		//If it's less than 200 milliseconds, it must be a tap or click
		if (this.elapsedTime <= 200 && this.tapped === false) {
			this.tapped = true;
			//Call the `tap` method if it's been assigned
			if (this.tap) this.tap();
		}
		this.isUp = true;
		this.isDown = false;
		//Call the `release` method if it's been assigned by the user
		if (this.release) this.release();
		event.preventDefault();
	},
	//The pointer's `touchendHandler`
	touchendHandler: function(event) {
		//Figure out how much time the pointer has been down
		this.elapsedTime = Math.abs(this.downTime - Date.now());
		//If it's less than 200 milliseconds, it must be a tap or click
		if (this.elapsedTime <= 200 && this.tapped === false) {
			this.tapped = true;
			//Call the `tap` method if it's been assigned by the user
			if (this.tap) this.tap();
		}
		this.isUp = true;
		this.isDown = false;
		//Call the `release` method if it's been assigned by the user
		if (this.release) this.release();
		event.preventDefault();
	},
	hitTestSprite: function(sprite) {
		//The `hit` variable will become `true` if the pointer is
		//touching the sprite and remain `false` if it isn't
		var hit = false;
		//Is the sprite rectangular?
		if (!sprite.circular) {
			//Yes, it is.
			//Get the position of the sprite's edges using global
			//coordinates
			var left = sprite.gx,
			right = sprite.gx + sprite.width,
			top = sprite.gy,
			bottom = sprite.gy + sprite.height;
			//Find out if the pointer is intersecting the rectangle.
			//`hit` will become `true` if the pointer is inside the
			//sprite's area
			hit
			= this.x > left && this.x < right
			&& this.y > top && this.y < bottom;
		}
		//Is the sprite circular?
		else {
			//Yes, it is.
			//Find the distance between the pointer and the
			//center of the circle
			var vx = this.x - (sprite.gx + sprite.radius),
			vy = this.y - (sprite.gy + sprite.radius),
			distance = Math.sqrt(vx * vx + vy * vy);
			//The pointer is intersecting the circle if the
			//distance is less than the circle's radius
			hit = distance < sprite.radius;
		}
		return hit;
	 },
	};
		//Bind the events to the handlers’
		//Mouse events
		element.addEventListener("mousemove", pointer.moveHandler.bind(pointer), false);
		element.addEventListener("mousedown", pointer.downHandler.bind(pointer), false);

		//Add the `mouseup` event to the `window` to
		//catch a mouse button release outside of the canvas area
		window.addEventListener("mouseup", pointer.upHandler.bind(pointer), false);

		//Touch events
		element.addEventListener("touchmove", pointer.touchmoveHandler.bind(pointer), false);
		element.addEventListener("touchstart", pointer.touchstartHandler.bind(pointer), false);

		//Add the `touchend` event to the `window` object to
		//catch a mouse button release outside the canvas area
		window.addEventListener("touchend", pointer.touchendHandler.bind(pointer), false);

		//Disable the default pan and zoom actions on the `canvas`
		element.style.touchAction = "none";

	//Return the pointer
	return pointer;
}

/*
hitTestPoint
------------

Use it to find out if a point is touching a circlular or rectangular sprite.
Parameters:
a. An object with `x` and `y` properties.
b. A sprite object with `x`, `y`, `centerX` and `centerY` properties.
If the sprite has a `radius` property, the function will interpret
the shape as a circle.
*/
function hitTestPoint(point, sprite) {
  var shape, left, right, top, bottom, vx, vy, magnitude, hit;

  //Find out if the sprite is rectangular or circular depending
  //on whether it has a `radius` property
  if (sprite.radius) {
		shape = "circle";
  } else {
		shape = "rectangle";
  }
  //Rectangle
  if (shape === "rectangle") {
    //Get the position of the sprite's edges
    left = sprite.x;
    right = sprite.x + sprite.width;
    top = sprite.y;
    bottom = sprite.y + sprite.height;

    //Find out if the point is intersecting the rectangle
    hit = point.x > left && point.x < right && point.y > top && point.y < bottom;
  }

  //Circle
  if (shape === "circle") {
    //Find the distance between the point and the
    //center of the circle
    vx = point.x - sprite.centerX,
    vy = point.y - sprite.centerY,
    magnitude = Math.sqrt(vx * vx + vy * vy);

    //The point is intersecting the circle if the magnitude
    //(distance) is less than the circle's radius
    hit = magnitude < sprite.radius;
  }
  //`hit` will be either `true` or `false`
  return hit;
}


/*
hitTestCircle
-------------

Use it to find out if two circular sprites are touching.
Parameters:
a. A sprite object with `centerX`, `centerY` and `radius` properties.
b. A sprite object with `centerX`, `centerY` and `radius`.
*/

function hitTestCircle(c1, c2, global) {
  var global = (typeof global !== 'undefined') ? global : false;
  var vx, vy, magnitude, combinedRadii, hit;

  //Calculate the vector between the circles’ center points
  if (global) {
    //Use global coordinates
    vx = (c2.gx + c2.radius) - (c1.gx + c1.radius);
    vy = (c2.gy + c2.radius) - (c1.gy + c1.radius);
  } else {
    //Use local coordinates
    vx = c2.centerX - c1.centerX;
    vy = c2.centerY - c1.centerY;
  }

  //Find the distance between the circles by calculating
  //the vector's magnitude (how long the vector is)
  magnitude = Math.sqrt(vx * vx + vy * vy);

  //Add together the circles' total radii
  combinedRadii = c1.radius + c2.radius;

  //Set `hit` to `true` if the distance between the circles is
  //less than their `combinedRadii`
  hit = magnitude < combinedRadii;

  //`hit` will be either `true` or `false`
  return hit;
};

/*
circleCollision
---------------

Use it to prevent a moving circular sprite from overlapping and optionally
bouncing off a non-moving circular sprite.
Parameters:
a. A sprite object with `x`, `y` `centerX`, `centerY` and `radius` properties.
b. A sprite object with `x`, `y` `centerX`, `centerY` and `radius` properties.
c. Optional: true or false to indicate whether or not the first sprite
should bounce off the second sprite.
The sprites can contain an optional mass property that should be greater than 1.

*/
function circleCollision(c1, c2, bounce, global) {
  var global = global || false,
	  bounce = bounce || false;
  var magnitude, combinedRadii, overlap,
    vx, vy, dx, dy, s = {},
    hit = false;

  //Calculate the vector between the circles’ center points

  if (global) {
    //Use global coordinates
    vx = (c2.gx + c2.radius) - (c1.gx + c1.radius);
    vy = (c2.gy + c2.radius) - (c1.gy + c1.radius);
  } else {
    //Use local coordinates
    vx = c2.centerX - c1.centerX;
    vy = c2.centerY - c1.centerY;
  }

  //Find the distance between the circles by calculating
  //the vector's magnitude (how long the vector is)
  magnitude = Math.sqrt(vx * vx + vy * vy);

  //Add together the circles' combined half-widths
  combinedRadii = c1.radius + c2.radius;

  //Figure out if there's a collision
  if (magnitude < combinedRadii) {

    //Yes, a collision is happening
    hit = true;

    //Find the amount of overlap between the circles
    overlap = combinedRadii - magnitude;

    //Add some "quantum padding". This adds a tiny amount of space
    //between the circles to reduce their surface tension and make
    //them more slippery. "0.3" is a good place to start but you might
    //need to modify this slightly depending on the exact behaviour
    //you want. Too little and the balls will feel sticky, too much
    //and they could start to jitter if they're jammed together
    var quantumPadding = 0.3;
    overlap += quantumPadding;

    //Normalize the vector
    //These numbers tell us the direction of the collision
    dx = vx / magnitude;
    dy = vy / magnitude;

    //Move circle 1 out of the collision by multiplying
    //the overlap with the normalized vector and subtract it from
    //circle 1's position
    c1.x -= overlap * dx;
    c1.y -= overlap * dy;

    //Bounce
    if (bounce) {
      //Create a collision vector object, `s` to represent the bounce "surface".
      //Find the bounce surface's x and y properties
      //(This represents the normal of the distance vector between the circles)
      s.x = vy;
      s.y = -vx;

      //Bounce c1 off the surface
      bounceOffSurface(c1, s);
    }
  }
  return hit;
}
/*
movingCircleCollision
---------------------

Use it to make two moving circles bounce off each other.
Parameters:
a. A sprite object with `x`, `y` `centerX`, `centerY` and `radius` properties.
b. A sprite object with `x`, `y` `centerX`, `centerY` and `radius` properties.
The sprites can contain an optional mass property that should be greater than 1.

*/
function movingCircleCollision(c1, c2, global) {
  var global = global || false;
  var combinedRadii, overlap, xSide, ySide,
    //`s` refers to the distance vector between the circles
    s = {},
    p1A = {},
    p1B = {},
    p2A = {},
    p2B = {},
    hit = false;

  //Apply mass, if the circles have mass properties
  c1.mass = c1.mass || 1;
  c2.mass = c2.mass || 1;

  //Calculate the vector between the circles’ center points
  if (global) {
    //Use global coordinates
    s.vx = (c2.gx + c2.radius) - (c1.gx + c1.radius);
    s.vy = (c2.gy + c2.radius) - (c1.gy + c1.radius);
  } else {
    //Use local coordinates
    s.vx = c2.centerX - c1.centerX;
    s.vy = c2.centerY - c1.centerY;
  }

  //Find the distance between the circles by calculating
  //the vector's magnitude (how long the vector is)
  s.magnitude = Math.sqrt(s.vx * s.vx + s.vy * s.vy);

  //Add together the circles' combined half-widths
  combinedRadii = c1.radius + c2.radius;

  //Figure out if there's a collision
  if (s.magnitude < combinedRadii) {

    //Yes, a collision is happening
    hit = true;

    //Find the amount of overlap between the circles
    overlap = combinedRadii - s.magnitude;

    //Add some "quantum padding" to the overlap
    overlap += 0.3;

    //Normalize the vector.
    //These numbers tell us the direction of the collision
    s.dx = s.vx / s.magnitude;
    s.dy = s.vy / s.magnitude;

    //Find the collision vector.
    //Divide it in half to share between the circles, and make it absolute
    s.vxHalf = Math.abs(s.dx * overlap / 2);
    s.vyHalf = Math.abs(s.dy * overlap / 2);

    //Find the side that the collision is occurring on
    (c1.x > c2.x) ? xSide = 1 : xSide = -1;
    (c1.y > c2.y) ? ySide = 1 : ySide = -1;

    //Move c1 out of the collision by multiplying
    //the overlap with the normalized vector and adding it to
    //the circles' positions
    c1.x = c1.x + (s.vxHalf * xSide);
    c1.y = c1.y + (s.vyHalf * ySide);

    //Move c2 out of the collision
    c2.x = c2.x + (s.vxHalf * -xSide);
    c2.y = c2.y + (s.vyHalf * -ySide);

    //1. Calculate the collision surface's properties

    //Find the surface vector's left normal
    s.lx = s.vy;
    s.ly = -s.vx;

    //2. Bounce c1 off the surface (s)

    //Find the dot product between c1 and the surface
    var dp1 = c1.vx * s.dx + c1.vy * s.dy;

    //Project c1's velocity onto the collision surface
    p1A.x = dp1 * s.dx;
    p1A.y = dp1 * s.dy;

    //Find the dot product of c1 and the surface's left normal (s.lx and s.ly)
    var dp2 = c1.vx * (s.lx / s.magnitude) + c1.vy * (s.ly / s.magnitude);

    //Project the c1's velocity onto the surface's left normal
    p1B.x = dp2 * (s.lx / s.magnitude);
    p1B.y = dp2 * (s.ly / s.magnitude);

    //3. Bounce c2 off the surface (s)

    //Find the dot product between c2 and the surface
    var dp3 = c2.vx * s.dx + c2.vy * s.dy;

    //Project c2's velocity onto the collision surface
    p2A.x = dp3 * s.dx;
    p2A.y = dp3 * s.dy;

    //Find the dot product of c2 and the surface's left normal (s.lx and s.ly)
    var dp4 = c2.vx * (s.lx / s.magnitude) + c2.vy * (s.ly / s.magnitude);

    //Project c2's velocity onto the surface's left normal
    p2B.x = dp4 * (s.lx / s.magnitude);
    p2B.y = dp4 * (s.ly / s.magnitude);

    //4. Calculate the bounce vectors

    //Bounce c1
    //using p1B and p2A
    c1.bounce = {};
    c1.bounce.x = p1B.x + p2A.x;
    c1.bounce.y = p1B.y + p2A.y;

    //Bounce c2
    //using p1A and p2B
    c2.bounce = {};
    c2.bounce.x = p1A.x + p2B.x;
    c2.bounce.y = p1A.y + p2B.y;

    //Add the bounce vector to the circles' velocity
    //and add mass if the circle has a mass property
    c1.vx = c1.bounce.x / c1.mass;
    c1.vy = c1.bounce.y / c1.mass;
    c2.vx = c2.bounce.x / c2.mass;
    c2.vy = c2.bounce.y / c2.mass;
  }
  return hit;
}

/*
multipleCircleCollision
-----------------------

Checks all the circles in an array for a collision against
all the other circles in an array, using `movingCircleCollision` (above)
*/
function multipleCircleCollision(arrayOfCircles, global) {

	var global = global || false;
  //marble collisions
  for (var i = 0; i < arrayOfCircles.length; i++) {
    //The first marble to use in the collision check
    var c1 = arrayOfCircles[i];
    for (var j = i + 1; j < arrayOfCircles.length; j++) {
      //The second marble to use in the collision check
      var c2 = arrayOfCircles[j];
      //Check for a collision and bounce the marbles apart if
      //they collide. Use an optional mass property on the sprite
      //to affect the bounciness of each marble
      movingCircleCollision(c1, c2, global);
    }
  }
}


/*
hitTestCirclePoint
------------------

Use it to find out if a circular shape is touching a point
Parameters:
a. A sprite object with `centerX`, `centerY`, and `radius` properties.
b. A point object with `x` and `y` properties.

*/
function hitTestCirclePoint(c1, point, global) {
   var global = global || false;
  //A point is just a circle with a diameter of
  //1 pixel, so we can cheat. All we need to do is an ordinary circle vs. circle
  //Collision test. Just supply the point with the properties
  //it needs
  point.diameter = 1;
  point.radius = 0.5;
  point.centerX = point.x;
  point.centerY = point.y;
  point.gx = point.x;
  point.gy = point.y;
  return hitTestCircle(c1, point, global);
}


/*
circlePointCollision
--------------------

Use it to boucnce a circle off a point.
Parameters:
a. A sprite object with `centerX`, `centerY`, and `radius` properties.
b. A point object with `x` and `y` properties.

*/
function circlePointCollision(c1, point, bounce, global) {
	  var global = global || false,
	     bounce = bounce || false;
  //A point is just a circle with a diameter of
  //1 pixel, so we can cheat. All we need to do is an ordinary circle vs. circle
  //Collision test. Just supply the point with the properties
  //it needs
  point.diameter = 1;
  point.radius = 0.5;
  point.centerX = point.x;
  point.centerY = point.y;
  point.gx = point.x;
  point.gy = point.y;
  return circleCollision(c1, point, bounce, global);
}


/*
hitTestRectangle
----------------

Use it to find out if two rectangular sprites are touching.
Parameters:
a. A sprite object with `centerX`, `centerY`, `halfWidth` and `halfHeight` properties.
b. A sprite object with `centerX`, `centerY`, `halfWidth` and `halfHeight` properties.

*/
function hitTestRectangle(r1, r2, global) {
   var global = global || false;
  var hit, combinedHalfWidths, combinedHalfHeights, vx, vy;

  //A variable to determine whether there's a collision
  hit = false;

  //Calculate the distance vector
  if (global) {
    vx = (r1.gx + r1.halfWidth) - (r2.gx + r2.halfWidth);
    vy = (r1.gy + r1.halfHeight) - (r2.gy + r2.halfHeight);
  } else {
    vx = r1.centerX - r2.centerX;
    vy = r1.centerY - r2.centerY;
  }

  //Figure out the combined half-widths and half-heights
  combinedHalfWidths = r1.halfWidth + r2.halfWidth;
  combinedHalfHeights = r1.halfHeight + r2.halfHeight;

  //Check for a collision on the x axis
  if (Math.abs(vx) < combinedHalfWidths) {

    //A collision might be occuring. Check for a collision on the y axis
    if (Math.abs(vy) < combinedHalfHeights) {

      //There's definitely a collision happening
      hit = true;
    } else {

      //There's no collision on the y axis
      hit = false;
    }
  } else {

    //There's no collision on the x axis
    hit = false;
  }

  //`hit` will be either `true` or `false`
  return hit;
}

/*
rectangleCollision
------------------

Use it to prevent two rectangular sprites from overlapping.
Optionally, make the first rectangle bounce off the second rectangle.
Parameters:
a. A sprite object with `x`, `y` `centerX`, `centerY`, `halfWidth` and `halfHeight` properties.
b. A sprite object with `x`, `y` `centerX`, `centerY`, `halfWidth` and `halfHeight` properties.
c. Optional: true or false to indicate whether or not the first sprite
should bounce off the second sprite.
*/
function rectangleCollision(r1, r2, bounce, global) {

  var collision, combinedHalfWidths, combinedHalfHeights,
    overlapX, overlapY, vx, vy;

  var global = global || false,
  bounce =bounce || false;

  //Calculate the distance vector
  if (global) {
    vx = (r1.gx + r1.halfWidth) - (r2.gx + r2.halfWidth);
    vy = (r1.gy + r1.halfHeight) - (r2.gy + r2.halfHeight);
  } else {
    vx = r1.centerX - r2.centerX;
    vy = r1.centerY - r2.centerY;
  }

  //Figure out the combined half-widths and half-heights
  combinedHalfWidths = r1.halfWidth + r2.halfWidth;
  combinedHalfHeights = r1.halfHeight + r2.halfHeight;

  //Check whether vx is less than the combined half widths
  if (Math.abs(vx) < combinedHalfWidths) {

    //A collision might be occurring!
    //Check whether vy is less than the combined half heights
    if (Math.abs(vy) < combinedHalfHeights) {

      //A collision has occurred! This is good!
      //Find out the size of the overlap on both the X and Y axes
      overlapX = combinedHalfWidths - Math.abs(vx);
      overlapY = combinedHalfHeights - Math.abs(vy);

      //The collision has occurred on the axis with the
      //*smallest* amount of overlap. Let's figure out which
      //axis that is

      if (overlapX >= overlapY) {
        //The collision is happening on the X axis
        //But on which side? vy can tell us

        if (vy > 0) {
          collision = "top";
          //Move the rectangle out of the collision
          r1.y = r1.y + overlapY;
        } else {
          collision = "bottom";
          //Move the rectangle out of the collision
          r1.y = r1.y - overlapY;
        }

        //Bounce
        if (bounce) {
          r1.vy *= -1;

          /*Alternative
          //Find the bounce surface's vx and vy properties
          var s = {};
          s.vx = r2.x - r2.x + r2.width;
          s.vy = 0;

          //Bounce r1 off the surface
          //bounceOffSurface(r1, s);
          */

        }
      } else {
        //The collision is happening on the Y axis
        //But on which side? vx can tell us

        if (vx > 0) {
          collision = "left";
          //Move the rectangle out of the collision
          r1.x = r1.x + overlapX;
        } else {
          collision = "right";
          //Move the rectangle out of the collision
          r1.x = r1.x - overlapX;
        }

        //Bounce
        if (bounce) {
          r1.vx *= -1;

          /*Alternative
          //Find the bounce surface's vx and vy properties
          var s = {};
          s.vx = 0;
          s.vy = r2.y - r2.y + r2.height;

          //Bounce r1 off the surface
          bounceOffSurface(r1, s);
          */

        }
      }
    } else {
      //No collision
    }
  } else {
    //No collision
  }

  //Return the collision string. it will be either "top", "right",
  //"bottom", or "left" depending on which side of r1 is touching r2.
  return collision;
}

/*
hitTestCircleRectangle
----------------

Use it to find out if a circular shape is touching a rectangular shape
Parameters:
a. A sprite object with `centerX`, `centerY`, `halfWidth` and `halfHeight` properties.
b. A sprite object with `centerX`, `centerY`, `halfWidth` and `halfHeight` properties.

*/
function hitTestCircleRectangle(c1, r1, global) {

  var region, collision, c1x, c1y, r1x, r1y;
  var global = global || false;

  //Use either global or local coordinates
  if (global) {
    c1x = c1.gx;
    c1y = c1.gy
    r1x = r1.gx;
    r1y = r1.gy;
  } else {
    c1x = c1.x;
    c1y = c1.y
    r1x = r1.x;
    r1y = r1.y;
  }

  //Is the circle above the rectangle's top edge?
  if (c1y < r1y - r1.halfHeight) {

    //If it is, we need to check whether it's in the
    //top left, top center or top right
    //(Increasing the size of the region by 2 pixels slightly weights
    //the text in favor of a rectangle vs. rectangle collision test.
    //This gives a more natural looking result with corner collisions
    //when physics is added)
    if (c1x < r1x - 1 - r1.halfWidth) {
      region = "topLeft";
    } else if (c1x > r1x + 1 + r1.halfWidth) {
      region = "topRight";
    } else {
      region = "topMiddle";
    }
  }

  //The circle isn't above the top edge, so it might be
  //below the bottom edge
  else if (c1y > r1y + r1.halfHeight) {

    //If it is, we need to check whether it's in the bottom left,
    //bottom center, or bottom right
    if (c1x < r1x - 1 - r1.halfWidth) {
      region = "bottomLeft";
    } else if (c1x > r1x + 1 + r1.halfWidth) {
      region = "bottomRight";
    } else {
      region = "bottomMiddle";
    }
  }

  //The circle isn't above the top edge or below the bottom edge,
  //so it must be on the left or right side
  else {
    if (c1x < r1x - r1.halfWidth) {
      region = "leftMiddle";
    } else {
      region = "rightMiddle";
    }
  }

  //Is this the circle touching the flat sides
  //of the rectangle?
  if (region === "topMiddle" || region === "bottomMiddle" || region === "leftMiddle" || region === "rightMiddle") {

    //Yes, it is, so do a standard rectangle vs. rectangle collision test
    collision = hitTestRectangle(c1, r1, global);
  }

  //The circle is touching one of the corners, so do a
  //circle vs. point collision test
  else {
    var point = {};

    switch (region) {
      case "topLeft":
        point.x = r1x;
        point.y = r1y;
        break;

      case "topRight":
        point.x = r1x + r1.width;
        point.y = r1y;
        break;

      case "bottomLeft":
        point.x = r1x;
        point.y = r1y + r1.height;
        break;

      case "bottomRight":
        point.x = r1x + r1.width;
        point.y = r1y + r1.height;
    }

    //Check for a collision between the circle and the point
    collision = hitTestCirclePoint(c1, point, global);
  }

  //Return the result of the collision.
  //The return value will be `undefined` if there's no collision
  if (collision) {
    return region;
  } else {
    return collision;
  }
}

/*
circleRectangleCollision
------------------------

Use it to bounce a circular shape off a rectangular shape
Parameters:
a. A sprite object with `centerX`, `centerY`, `halfWidth` and `halfHeight` properties.
b. A sprite object with `centerX`, `centerY`, `halfWidth` and `halfHeight` properties.

*/
function circleRectangleCollision(c1, r1, bounce, global){
	var region, collision, c1x, c1y, r1x, r1y;
	var global = global || false,
		bounce = bounce || false;
  //Use either the global or local coordinates
  if (global) {
    c1x = c1.gx;
    c1y = c1.gy
    r1x = r1.gx;
    r1y = r1.gy;
  } else {
    c1x = c1.x;
    c1y = c1.y
    r1x = r1.x;
    r1y = r1.y;
  }

  //Is the circle above the rectangle's top edge?
  if (c1y < r1y - r1.halfHeight) {
    //If it is, we need to check whether it's in the
    //top left, top center or top right
    if (c1x < r1x - 1 - r1.halfWidth) {
      region = "topLeft";
    } else if (c1x > r1x + 1 + r1.halfWidth) {
      region = "topRight";
    } else {
      region = "topMiddle";
    }
  }

  //The circle isn't above the top edge, so it might be
  //below the bottom edge
  else if (c1y > r1y + r1.halfHeight) {
    //If it is, we need to check whether it's in the bottom left,
    //bottom center, or bottom right
    if (c1x < r1x - 1 - r1.halfWidth) {
      region = "bottomLeft";
    } else if (c1x > r1x + 1 + r1.halfWidth) {
      region = "bottomRight";
    } else {
      region = "bottomMiddle";
    }
  }

  //The circle isn't above the top edge or below the bottom edge,
  //so it must be on the left or right side
  else {
    if (c1x < r1x - r1.halfWidth) {
      region = "leftMiddle";
    } else {
      region = "rightMiddle";
    }
  }

  //Is this the circle touching the flat sides
  //of the rectangle?
  if (region === "topMiddle" || region === "bottomMiddle" || region === "leftMiddle" || region === "rightMiddle") {

    //Yes, it is, so do a standard rectangle vs. rectangle collision test
    collision = rectangleCollision(c1, r1, bounce, global);
  }

  //The circle is touching one of the corners, so do a
  //circle vs. point collision test
  else {
    var point = {};

    switch (region) {
      case "topLeft":
        point.x = r1x;
        point.y = r1y;
        break;

      case "topRight":
        point.x = r1x + r1.width;
        point.y = r1y;
        break;

      case "bottomLeft":
        point.x = r1x;
        point.y = r1y + r1.height;
        break;

      case "bottomRight":
        point.x = r1x + r1.width;
        point.y = r1y + r1.height;
    }

    //Check for a collision between the circle and the point
    collision = circlePointCollision(c1, point, bounce, global);
  }

  if (collision) {
    return region;
  } else {
    return collision;
  }
}


/*
hit
---
A convenient universal collision function to test for collisions
between rectangles, circles, and points.
*/
function hit(a, b, react, bounce, global, extra) {
  var collision,
    aIsASprite = a.parent !== undefined,
    bIsASprite = b.parent !== undefined;

  var react = react || false,
		bounce = bounce || false,
		extra =  extra || undefined;

  //Check to make sure one of the arguments isn't an array
  if (aIsASprite && b instanceof Array || bIsASprite && a instanceof Array) {
    //If it is, check for a collision between a sprite and an array
    spriteVsArray();
  } else {
    //If one of the arguments isn't an array, find out what type of
    //collision check to run
    collision = findCollisionType(a, b);
    if (collision && extra) extra(collision);
  }

  //Return the result of the collision.
  //It will be `undefined` if there's no collision and `true` if
  //there is a collision. `rectangleCollision` sets `collsision` to
  //"top", "bottom", "left" or "right" depeneding on which side the
  //collision is occuring on
  return collision;

  function findCollisionType(a, b) {
    //Are `a` and `b` both sprites?
    //(We have to check again if this function was called from
    //`spriteVsArray`)
    var aIsASprite = a.parent !== undefined;
    var bIsASprite = b.parent !== undefined;

    if (aIsASprite && bIsASprite) {
      //Yes, but what kind of sprites?
      if (a.diameter && b.diameter) {
        //They're circles
        return circleVsCircle(a, b);
      } else if (a.diameter && !b.diameter) {
        //The first one is a circle and the second is a rectangle
        return circleVsRectangle(a, b);
      } else {
        //They're rectangles
        return rectangleVsRectangle(a, b);
      }
    }
    //They're not both sprites, so what are they?
    //Is `a` not a sprite and does it have x and y properties?
    else if (bIsASprite && !(a.x === undefined) && !(a.y === undefined)) {
      //Yes, so this is a point vs. sprite collision test
      return hitTestPoint(a, b);
    } else {
      //The user is trying to test some incompatible objects
      throw new Error('Im sorry, ${a} and ${b} cannot be use together in a collision test.');
    }
  }

  function spriteVsArray() {
    //If a happens to be the array, flip it around so that it becomes `b`
    if (a instanceof Array) {
      //var [a, b] = [b, a];
	  [a, b].reverse();
    }
    //Loop through the array in reverse
    for (var i = b.length - 1; i >= 0; i--) {
      var sprite = b[i];
      collision = findCollisionType(a, sprite);
      if (collision && extra) extra(collision, sprite);
    }
  }

  function circleVsCircle(a, b) {
    //If the circles shouldn't react to the collision,
    //just test to see if they're touching
    if (!react) {
      return hitTestCircle(a, b);
    }
    //Yes, the circles should react to the collision
    else {
      //Are they both moving?
      if (a.vx + a.vy !== 0 && b.vx + b.vy !== 0) {
        //Yes, they are both moving
        //(moving circle collisions always bounce apart so there's
        //no need for the third, `bounce`, argument)
        return movingCircleCollision(a, b, global);
      } else {
        //No, they're not both moving
        return circleCollision(a, b, bounce, global);
      }
    }
  }

  function rectangleVsRectangle(a, b) {
    //If the rectangles shouldn't react to the collision, just
    //test to see if they're touching
    if (!react) {
      return hitTestRectangle(a, b, global);
    } else {
      return rectangleCollision(a, b, bounce, global);
    }
  }

  function circleVsRectangle(a, b) {
    //If the rectangles shouldn't react to the collision, just
    //test to see if they're touching
    if (!react) {
      return hitTestCircleRectangle(a, b, global);
    } else {
      return circleRectangleCollision(a, b, bounce, global);
    }
  }
}

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
  var 	x = x || 0,
		y = y || 0,
		numberOfParticles = numberOfParticles || 10,
		spriteFunction = spriteFunction || function() { return circle(10, "red"); },
		gravity = gravity || 0,
		randomSpacing = randomSpacing || true,
		minAngle = minAngle || 0,
		maxAngle = maxAngle || 6.28,
		minSize = minSize || 4,
		maxSize = maxSize || 16,
		minSpeed = minSpeed || 0.1,
		maxSpeed = maxSpeed || 1,
		minScaleSpeed = minScaleSpeed || 0.01,
		maxScaleSpeed = maxScaleSpeed || 0.05,
		minAlphaSpeed = minAlphaSpeed || 0.02,
		maxAlphaSpeed = maxAlphaSpeed || 0.02,
		minRotationSpeed = minRotationSpeed || 0.01,
		maxRotationSpeed = maxRotationSpeed || 0.03;


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
        // remove([particle]);
        smokes.freeSmoke(particle);
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

/*
tilingSprite
------------
*/
//function tilingSprite(spriteFunction, tileHeight, tileWidth, totalWidth, totalHeight) {
function tilingSprite(width, height, source, x, y) {

  var x = x || 0,
      y = y || 0;
  //Figure out the tile's width and height
  var tileWidth, tileHeight;

  //If the source is a texture atlas frame, use its
  //`frame.w` and `frame.h` properties
  if(source.frame) {
    tileWidth = source.frame.w;
    tileHeight = source.frame.h;
  }

  //If it's an image, use the image's
  //`width` and `height` properties
  else {
    tileWidth = source.width;
    tileHeight = source.height;
  }

	//done to hide the blank line appearing b/w the tiling sprites issue resolved
	tileWidth = tileWidth-1;
	tileHeight = tileHeight-2;

  //Figure out the rows and columns.
  //The number of rows and columns should always be
  //one greater than the total number of tiles
  //that can fit in the rectangle. This give us one
  //additional row and column that we can reposition
  //to create the infinite scroll effect

  var columns, rows;

  //1. Columns
  //If the width of the rectangle is greater than the width of the tile,
  //calculate the number of tile columns
  if (width >= tileWidth) {
    columns = Math.round(width / tileWidth) + 1;
  }

  //If the rectangle's width is less than the width of the
  //tile, set the columns to 2, which is the minimum
  else {
    columns = 2;
  }

  //2. Rows
  //Calculate the tile rows in the same way
  if (height >= tileHeight) {
    rows = Math.round(height / tileHeight) + 1;
  } else {
    rows = 2;
  }

  //Create a grid of sprites that's just one sprite larger
  //than the `totalWidth` and `totalHeight`
  var tileGrid = grid(
   columns, rows, tileWidth, tileHeight, true, 0, 0,
   function(){
     //Make a sprite from the supplied `source`
     var tile = sprite(source);
     return tile;
   }
  );

  //Declare the grid's private properties that we'll use to
  //help scroll the tiling background
  tileGrid._tileX = 0;
  tileGrid._tileY = 0;

  //Create an empty rectangle sprite without a fill or stoke color.
  //Set it to the supplied `width` and `height`
  var container = rectangle(width, height, "#d3d3d3", "#d3d3d3");
  container.x = x;
  container.y = y;

  //Set the rectangle's `mask` property to `true`. This switches on `ctx.clip()`
  //In the rectangle sprite's `render` method.
  container.mask = true;

  //Add the tile grid to the rectangle container
  container.addChild(tileGrid);

  //Define the `tileX` and `tileY` properties on the parent container
  //so that you can scroll the tiling background
  Object.defineProperties(container, {
    tileX: {
      get: function() {
        return tileGrid._tileX;
      },

      set: function(value) {

        //Loop through all of the grid's child sprites
        tileGrid.children.forEach(function(child){

          //Figure out the difference between the new position
          //and the previous position
          var difference = value - tileGrid._tileX;

          //Offset the child sprite by the difference
          child.x += difference;

          //If the x position of the sprite exceeds the total width
          //of the visible columns, reposition it to just in front of the
          //left edge of the container. This creates the wrapping
          //effect
          if (child.x > (columns - 1) * tileWidth) {
            child.x = 0 - tileWidth + difference;
          }

          //Use the same procedure to wrap sprites that
          //exceed the left boundary
          if (child.x < 0 - tileWidth - difference) {
            child.x = (columns - 1) * tileWidth;
          }
        });

        //Set the private `_tileX` property to the new value
        tileGrid._tileX = value;
      },
      enumerable: true, configurable: true
    },
    tileY: {
      get: function() {
        return tileGrid._tileY;
      },

      //Follow the same format to wrap sprites on the y axis
      set: function(value){
        tileGrid.children.forEach(function(child){
          var difference = value - tileGrid._tileY;
          child.y += difference;
          if (child.y > (rows - 1) * tileHeight) child.y = 0 - tileHeight + difference;
          if (child.y < 0 - tileHeight - difference) child.y = (rows - 1) * tileHeight;
        });
        tileGrid._tileY = value;
      },
      enumerable: true, configurable: true
    }
  });

  //Return the rectangle container
  return container;
}

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
			type = type || ["smoothstep"],
			yoyo = yoyo || false,
			delayBeforeRepeat = delayBeforeRepeat || 0;

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
	var frames = frames || 60;

	return tweenProperty(
		sprite, "alpha", sprite.alpha, 1, frames, ["sine"]
	);
}

//fade out
function fadeOut(sprite, frames) {
	var frames = frames || 60;
	return tweenProperty(
		sprite, "alpha", sprite.alpha, 0, frames, ["sine"]
	);
}

//pulse
function pulse(sprite, frames , minAlpha) {
	var
	frames = frames || 60,
	minAlpha = minAlpha || 0;

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
			frames = frames || 60,
			type = type || ["smoothstep"],
			yoyo = yoyo || false,
			delayBeforeRepeat = delayBeforeRepeat || 0;

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
			yoyo= yoyo || true,
			delayBeforeRepeat= delayBeforeRepeat || 0;
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
	var frame = frames || 60;
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
		scaleFactor = scaleFactor || 1.3,
		startMagnitude = startMagnitude || 10,
		endMagnitude = endMagnitude || 20,
		frames = frames || 10,
		yoyo = yoyo || true,
		delayBeforeRepeat = delayBeforeRepeat || 0;

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
		scaleFactorX = scaleFactorX || 1.2,
		scaleFactorY = scaleFactorY || 1.2,
		frames = frames || 10,
		xStartMagnitude = xStartMagnitude || 10,
		xEndMagnitude = xEndMagnitude || 10,
		yStartMagnitude = yStartMagnitude || -10,
		yEndMagnitude = yEndMagnitude || -10,
		friction = friction || 0.98,
		yoyo = yoyo || true,
		delayBeforeRepeat = delayBeforeRepeat || 0;

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
		totalFrames = totalFrames || 300,
		type = type || ["smoothstep"],
		loop = loop || false,
		yoyo = yoyo || false,
		delayBetweenSections = delayBetweenSections || 0;

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
		totalFrames = totalFrames || 300,
		type = type || ["smoothstep"],
		loop = loop || false,
		yoyo = yoyo || false,
		delayBeforeContinue = delayBeforeContinue || 0;
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
		type = type ||  ["smoothstep"],
		yoyo = yoyo ||  false,
		delayBeforeRepeat = delayBeforeRepeat ||  0;
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

//Game engine class
function Game(width, height, setup, assetsToLoad, load){
		//Make the canvas and initialize the stage
		// this.canvas = makeCanvas(width, height, "#cccccc","#3b3224");
		this.canvas = getCanvas(width, height, "#cccccc","#3b3224");
		stage.width = this.canvas.width;
		stage.height = this.canvas.height;

		//for mobile implementation
		this.mobile = false;
		//Make the pointer
		this.pointer = makePointer(this.canvas);
		//The game's scale
		this.scale = 1;
		//Set the game `state`
		this.state = undefined;
		//Set the user-defined `load` and `setup` states
		this.load = load;
		this.setup = setup;
		//Get a reference to the `assetsToLoad` array
		this.assetsToLoad = assetsToLoad;
		//A Boolean to let us pause the game
		this.paused = false;

		//Variables for interpolation
		this.interpolation = false;
		this.fps = 15,
		this.previous = 0,
		this.frameDuration = 1000 / this.fps,
		this.lag = 0;

		_this = this;

		//The `setup` function is required, so throw an error if it's//missing
		if (!setup) {
			throw new Error("Please supply the setup function in the constructor");
		}
}
Game.prototype = {
	//The game loop
	gameLoop: function(timestamp){
		requestAnimationFrame(this.gameLoop.bind(this));
		//update game tween, shaking sprites, particle effect
		this.updateGameEffects();
		//Run the current game 'state' function if it's been defined and
    //the game isn't 'paused'
    if(this.state && !this.paused) {
      this.state();
    }
    //Render the canvas
    render(this.canvas);
	},
	//The `start` method that gets the whole engine going. This needs to
	//be called by the user from the game application code, right after
	//the engine is instantiated
	start: function(){
		if (this.assetsToLoad){
			//Use the supplied file paths to load the assets, and then run
			//the user-defined `setup` function
			setTimeout(
				function(){
					assets.load(_this.assetsToLoad,
						function(){
									//Clear the game `state` function for now to stop the loop
									_this.state = undefined;
									//Call the `setup` function that was supplied by the user in
									//the Game class's constructor
									_this.setup();
								});
				}
			,0);
			//While the assets are loading, set the user-defined `load`
			//function as the game state. That will make it run in a loop.
			//You can use the `load` state to create a loading progress bar

			if (this.load){
				this.state = this.load;
			}
		}
		//If there aren't any assets to load,
		//just run the user-defined `setup` function
		else {
			this.setup();
		}
		//Start the game loop
		this.gameLoop();
	},
	//Pause and resume methods. These stop and start the
	//game engine's game loop
	pause: function(){
		this.paused = true;
	},
	resume: function(){
		this.paused = false;
	},
	scaleToWindow: function(backgroundColor){
		var backgroundColor = backgroundColor || "#2C3539";
		var scaleX, scaleY, scale, center;
		//1. Scale the canvas to the correct size
		//Figure out the scale amount on each axis
		scaleX = window.innerWidth / this.canvas.width;
		scaleY = window.innerHeight / this.canvas.height;
		//Scale the canvas based on whichever value is less: `scaleX` or `scaleY`
		scale = Math.min(scaleX, scaleY);
		scale = Math.round(scale);

		//To fix the IE11 width problem bug
		// if(scale > 1.5) scale = 1;

		this.canvas.style.transformOrigin = "0 0";
		this.canvas.style.transform = "scale(" + scale + ")";
		console.log(scale);
		//2. Center the canvas.
		//Decide whether to center the canvas vertically or horizontally.
		//Wide canvases should be centered vertically, and
		//square or tall canvases should be centered horizontally
		if (this.canvas.width > this.canvas.height){
			center = "vertically";
		} else {
			center = "horizontally";
		}
		//Center horizontally (for square or tall canvases)
		if (center === "horizontally"){
			var margin =(window.innerHeight - this.canvas.height * scaleX) / 2;
			this.canvas.style.marginTop = margin + "px";
			this.canvas.style.marginBottom = margin + "px";
		}
		//Center vertically (for wide canvases)
		if (center === "vertically"){
			var margin = (window.innerWidth - this.canvas.width * scaleY) / 2;
			this.canvas.style.marginLeft = margin + "px";
			this.canvas.style.marginRight = margin + "px";
		}
		//3. Remove any padding from the canvas and set the canvas
		//display style to "block"
		this.canvas.style.paddingLeft = 0;
		this.canvas.style.paddingRight = 0;
		this.canvas.style.display = "block";
		//4. Set the color of the HTML body background
		document.body.style.backgroundColor = backgroundColor;
		//5. Set the game engine ("this") and the pointer to the correct scale.
		//This is important for correct hit testing between the pointer and sprites
		this.pointer.scale = scale;
		this.scale = scale;
	},
	setupMobile: function(){
		var container = document.getElementById("container"),
				hasTouch = !!('ontouchstart' in window),
				w = window.innerWidth, h = window.innerHeight;
		if(hasTouch){
			this.mobile = true;
		}
		if(this.canvas.width >= 1280 || !hasTouch){
			return false;
		}
		if(w < h){
			alert("Please rotate the device and then click OK");
			w = window.innerWidth; h = window.innerHeight;
		}
		container.style.height = h*2 + "px";
		window.scrollTo(0,1);
		h = window.innerHeight + 2;
		container.style.height = h + "px";
		container.style.width = w + "px";
		container.style.padding = 0;
		if(h >= this.canvas.height * 1.75 || w >= this.canvas.height * 1.75){
			// this.canvasMultiplier = 2;
			this.canvas.width = w / 2;
			this.canvas.height = h / 2;
			this.canvas.style.width = w + "px";
			this.canvas.style.height = h + "px";
		}
		else{
			this.canvas.width = w;
			this.canvas.height = h;
		}
		this.canvas.style.position='absolute';
		this.canvas.style.left="0px";
		this.canvas.style.top="0px";
	},
	updateGameEffects: function(){
		//Update the game logic
		//Update all the buttons
		if (buttons.length > 0){
			this.canvas.style.cursor = "auto";
			buttons.forEach(function(button){
					button.update(this.pointer, this.canvas);
					if (button.state === "over" || button.state === "down"){
						if(button.parent !== undefined) {
							this.canvas.style.cursor = "pointer";
						}
					}
			},this);
		}
		//Update all the particles
		if (particles.length > 0){
			for(var i = particles.length - 1; i >= 0; i--){
				var particle = particles[i];
				particle.update();
			}
		}
		//Update all the tweens
		if (tweens.length > 0){
			for(var i = tweens.length - 1; i >= 0; i--){
				var tween = tweens[i];
				if (tween)
					tween.update();
			}
		}
		//Update all the shaking sprites
		//(More about this later in the chapter!)
		if (shakingSprites.length > 0){
			for(var i = shakingSprites.length - 1; i >= 0; i--){
				var shakingSprite = shakingSprites[i];
				if (shakingSprite.updateShake)
						shakingSprite.updateShake();
			}
		}
		//Update the pointer for drag-and-drop
		if (draggableSprites.length > 0){
			this.pointer.updateDragAndDrop(draggableSprites);
		}
	}
};
function game(width, height, setup, assetsToLoad, load){
	var width = width || 256,
		height = height || 256;
	return new Game(width, height, setup, assetsToLoad, load);
}
function capturePreviousPositions(stage){
	//Loop through all the children of the stage
	stage.children.forEach(function(sprite){
		setPreviousPosition(sprite);
	});
	function setPreviousPosition(sprite){
		//Set the sprite's `previousX` and `previousY`
		sprite.previousX = sprite.x;
		sprite.previousY = sprite.y;
		//Loop through all the sprite's children
		if(sprite.children && sprite.children.length > 0){
				sprite.children.forEach(function(child){
					//Recursively call `setPosition` on each sprite
					setPreviousPosition(child);
				});
		}
	}
}
