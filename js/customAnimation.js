function animatePlayer(sprite,frameAngles){
	sprite.animate.fps = 14;
	sprite.animate.playing = false;
	sprite.animate.currentFrame = 0;
	sprite.animate.frameAngles = frameAngles

	var frameCounter = 0,
	numberOfFrames = 0,
	startFrame = 0,
	endFrame = 0,
	timerInterval = undefined;

	//The `show` function (to display static states)
	function show(frameNumber) {
		//Reset any possible previous animations
		reset();
		//Find the new state on the sprite
		sprite.animate.gotoFrame(frameNumber);
	}

	//The `play` function plays all the sprite's frames
	function play() {
		playAnimation();
	}
	//The `stop` function stops the animation at the current frame
	function stop() {
		reset();
		sprite.animate.gotoFrame(sprite.animate.currentFrame);
	}

	function reset(){
		//Reset `sprite.playing` to `false`, set the `frameCounter` to 0,
		//and clear the `timerInterval`
		if (timerInterval !== undefined && sprite.animate.playing === true){
			sprite.animate.playing = false;
			frameCounter = 0;
			startFrame = 0;
			endFrame = 0;
			numberOfFrames = 0;
			clearInterval(timerInterval);
		}
	}

	function playAnimation(){
		//Reset any possible previous animations
		reset();

		//Figure out how many frames there are in the range
		numberOfFrames = sprite.animate.frameAngles.length;
		startFrame = 0;
		endFrame =numberOfFrames-1;

		//Calculate the frame rate. Set the default fps to 12
		if (!sprite.animate.fps) sprite.animate.fps = 12;

		var frameRate = 1000 / sprite.animate.fps;

		//Set the sprite to the starting frame
		sprite.animate.gotoFrame(startFrame);

		//If the state isn't already playing, start it
		if(!sprite.animate.playing) {
		  timerInterval = setInterval(advanceAngularFrame.bind(this), frameRate);
		  sprite.animate.playing = true;
		}

	}
	function advanceAngularFrame() {
		//Advance the frame if `frameCounter` is less than
		//the state's total frames
		if (frameCounter < numberOfFrames) {

		  //Advance the frame
		  sprite.animate.gotoFrame(sprite.animate.currentFrame + 1);

		  //Update the frame counter
		  frameCounter += 1;

		//If we've reached the last frame and `loop`
		//is `true`, then start from the first frame again
		} else {
		  if (sprite.loop) {
			sprite.animate.gotoFrame(startFrame);
			frameCounter = 1;
		  }
		}
	}

	function gotoFrame(frameNumber){
		sprite.rotation = (Math.PI/180)*sprite.animate.frameAngles[frameNumber];
		sprite.animate.currentFrame = frameNumber;
	}

  //Add the `show`, `play`, `stop` and `playSequence` methods to the sprite.
  sprite.animate.show = show;
  sprite.animate.play = play;
  sprite.animate.stop = stop;
  //sprite.playing = playing;
  sprite.animate.playAnimation = playAnimation;
  sprite.animate.gotoFrame = gotoFrame;
}
