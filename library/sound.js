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
	play: function() {
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
		if (this.echo) {
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
			duration = (typeof duration !== 'undefined')? duration : 2,
			decay = (typeof decay !== 'undefined')? decay : 2,
			reverse = (typeof reverse !== 'undefined')? reverse : false;

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
		duration = (typeof duration !== 'undefined')? duration : 2,
		decay = (typeof decay !== 'undefined')? decay : 2,
		reverse = (typeof reverse !== 'undefined')? reverse : false;
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
		decay = (typeof decay !== 'undefined')? decay : 1,
		type = (typeof type !== 'undefined')? type : 'sine';
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
		attack = checkIfUndefined(attack,0),
		decay = checkIfUndefined(decay,1),
		type = checkIfUndefined(type,'sine'),
		volumeValue = checkIfUndefined(volumeValue,1),
		panValue = checkIfUndefined(panValue,0),
		wait = checkIfUndefined(wait,0),
		pitchBendAmount = checkIfUndefined(pitchBendAmount,0),
		reverse = checkIfUndefined(reverse,false),
		randomValue = checkIfUndefined(randomValue,0),
		dissonance = checkIfUndefined(dissonance,0),
		echo = checkIfUndefined(echo,undefined),
		reverb = checkIfUndefined(reverb,undefined);

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
