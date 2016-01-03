//create game object instance
if(Modernizr.webaudio){
	var g = game(800, 600, setup,
				[	"json/sticky.png",
					"json/hands.png",
					"json/alien.png",
					"json/alienHunter.json",
					"json/car.json",
					"images/texture.png",
					"images/texture2.png",
					"images/texture3.png",
					"images/texture4.png",
					"sounds/retro-action.mp3",
					"sounds/shot.wav",
					"sounds/explosion.wav",
					"sounds/bounce.mp3",
					"sounds/entry.mp3",
					"sounds/car.mp3",
					"sounds/powerup.mp3",
					"fonts/PetMe64.ttf"
				]
				,load
			);
		}
		else{
			var g = game(800, 600, setup,
						[	"json/sticky.png",
							"json/hands.png",
							"json/alien.png",
							"json/alienHunter.json",
							"json/car.json",
							"images/texture.png",
							"images/texture2.png",
							"images/texture3.png",
							"images/texture4.png",
							// "sounds/retro-action.mp3",
							// "sounds/shot.wav",
							// "sounds/explosion.wav",
							// "sounds/bounce.mp3",
							// "sounds/entry.mp3",
							// "sounds/car.mp3",
							// "sounds/powerup.mp3",
							"fonts/PetMe64.ttf"
						]
						,load
					);
		}
//Start the engine
g.start();

// //Scale and center the game
// g.scaleToWindow();

//set up mobile version
g.setupMobile();

//Optionally rescale the canvas if the browser window is changed
window.addEventListener("resize", function(event){
	// g.scaleToWindow();
	g.setupMobile();
});

//Global variables
var player,sky,ship,gun,mGun,car;
//Global groups
var blocks,playerGroup,itemGroup = group([]);
//Global Arrays
var designs = [];

//Object to hold game variables/constants
var controller = {
	gravity: .4,	//force of gravity
	gAttract: .2,
	speed: 5,		//speed 275
	jumpForce: 7.8,	// 8 force to jump
	bulletSpeed: 17, //speed of the bullet
	design: null,
	distance: null,
	miles: null,
	noOfLife: 3,
	maxLife: 5,
	menuAlpha: 0.93
};
var contr = controller;

//For activities to be performed while assets are loading
function load(){
	//Display the loading progress bar while the game
	progressBar.create(g.canvas, assets);
	progressBar.update();
}
//setup function of the game
function setup(){
	//Remove the progress bar
	progressBar.remove();

	//Sound and music
	sBox = new SoundBox();
	sBox.init();
	sBox.mute = false;

	//get the storage api object
	ds = Storage();

	//Add the game sprites to the 'gameScene' group
	gameScene = GameScene();
	bd.attracts.forEach(function(cBox){
		gameScene.addChild(cBox);
	});
	scoreScene = ScoreScene();
	optionScene = OptionScene();
	storeScene = StoreScene();
	creditScene = CreditScene();
	pauseScene = PauseScene();
	gameoverScene = GameOverScene();
	//Create the 'titleScene' group
	titleScene = getTitleScene();
	toggleMenu(undefined,titleScene);

	playerGroup.visible = false;
	ship.visible = false;

	//Create Aliens pool
	aliens = new Alien();
	for(var i=0;i < 6;i++){
		var alienObj = aliens.createAlien();
		alienObj.visible = false;
		alienObj.setPosition(ship.centerX,ship.centerY);
		aliens.alienPool.push(alienObj);
		alienObj = null;
	}
	//Create Bullets pool
	bullets = new Bullet();
	for(var i=0;i < 12;i++){
		var bulletObj = bullets.createBullet();
		bulletObj.visible = false;
		bullets.bulletPool.push(bulletObj);
		bulletObj = null;
	}
	//Create smoke particles pool
	smokes = new smokeSprites();
	for(var i=0;i < 12;i++){
		var smokeObj = smokes.createSmoke();
		smokeObj.visible = false;
		smokes.smokePool.push(smokeObj);
		smokeObj = null;
	}
	//Initi items
	imgr = new ItemManager();
	imgr.initItems();

	//Assign the key events
	keyHandler();

	focusText = focusManager();
	//Game AI object
	ai = new gameAI();
	ai.init(Date.now());

	levelText = text("Level 0", "15px " + "PetMe64", "white",0);
	levelText.visible = false;
	gameScene.addChild(levelText);

	if(g.mobile === true){
		touchCtrl.jumpTBtn.visible = true;
		touchCtrl.fireTBtn.visible = true;
		touchCtrl.jumpText.visible = true;
		touchCtrl.fireText.visible = true;
		touchCtrl.jumpTBtn.interactive = true;
		touchCtrl.fireTBtn.interactive = true;
	}

	//get the refrence for menu
	menu = document.getElementById("menu");
}
function restarHandler(){
	focusText.focus();
	restart();
	//set the score to initials
	score.init();
	//set the ai variables to initials
	ai.init(Date.now());
	//Set the game state to 'play' and 'resume' the game
	g.resume();
}
function keyHandler(){
	//pause the game with space bar key
	keyboard(32).press = pauseGame;
	//fire the bullets with X key and right arrow
	var xKey = keyboard(88);//X key
	xKey.press = firePress;
	xKey.release = fireRelease;
	var rArrowKey = keyboard(39);//->right arrow key
	rArrowKey.press = firePress;
	rArrowKey.release = fireRelease;
	//Jump the player with z key
	keyboard(90).press = jump;
	keyboard(38).press = jump;
	//handlers for Touch Buttons
	touchCtrl.jumpTBtn.press = jump;
	touchCtrl.fireTBtn.press = firePress;
	touchCtrl.fireTBtn.release = fireRelease;

	//fire
	function firePress(){
		if(playerGroup.item.type=="gun"){
			playerGroup.item.visible = true;
			player.shoot(gun);
		}
		if(playerGroup.item.type=="mg"){
			player.shoot(mGun);
		}
	}
	//release trigger after fire
	function fireRelease(){
		if(playerGroup.item.type=="gun"){
			playerGroup.item.visible = false;
			player.walk();
		}
		if(playerGroup.item.type=="mg"){
			player.walk();
		}
	}
	//pause function for stopping the game
	function pauseGame(){
		if(g.paused && ai.state == 'pause'){
			ai.t0 = Date.now();
			g.resume();
			toggleMenu(pauseScene,undefined);
			sBox.restart(sBox.bgMusic);
			player.walk();
			ai.state='play';
		}
		else if(ai.state!=='end') {
			g.pause();
			toggleMenu(undefined,pauseScene);
			sBox.pause(sBox.bgMusic);
			player.stop();
			ai.state = 'pause'
		}
	}
	//jump player
	function jump(){
		if (playerGroup.isOnGround){
			playerGroup.isOnGround = false;
			playerGroup.vy = -contr.jumpForce;
			playerGroup.building_index = undefined;
			player.jump();
			}
	}
	//slide the player with downArrow
	// var dwnArrow = keyboard(40);
	// dwnArrow.press = function(){
	// 	playerGroup.rotation = -1.45;
	// 	player.slide();
	// };
	// //unslide the player
	// dwnArrow.release = function(){
	// 	playerGroup.rotation = 0;
	// 	player.unSlide();
	// };
}
//support for touch controls - mobile phones
function TouchControls(){
	var gutterWidth = 10;
	var unitWidth = g.canvas.width/7;
	var blockWidth = unitWidth-gutterWidth;
	var yLoc = g.canvas.height - unitWidth;
	var o = {};

	o.jumpTBtn = rectangle(blockWidth,blockWidth,"grey","grey",1,gutterWidth+blockWidth,yLoc);
	o.jumpText = text("j", (3*unitWidth/4) + "px " + "PetMe64", "white",0);
	o.jumpTBtn.putCenter(o.jumpText);
	o.jumpTBtn.alpha = 0.5;

	o.fireTBtn = rectangle(blockWidth,blockWidth,"grey","grey",1,g.canvas.width-(gutterWidth+unitWidth+blockWidth),yLoc);
	o.fireText = text("f", (3*unitWidth/4) + "px " + "PetMe64", "white",0);
	o.fireTBtn.putCenter(o.fireText);

	o.jumpTBtn.alpha = 0.5;
	o.fireTBtn.alpha = 0.5;

	o.jumpTBtn.visible = false;
	o.fireTBtn.visible = false;
	o.jumpText.visible = false;
	o.fireText.visible = false;
	o.jumpTBtn.interactive = false;
	o.fireTBtn.interactive = false;

	return o;
}
function makePlayer(){
	var o = {};
	//States
	o.state = "";
	o.sticky = sprite(filmstrip(assets["json/sticky.png"],30,53));
	o.sticky.states = {
		stand:0,
		walk: [1,6],
		jump: 7,
		slide: 8
	};
	//Set the player's 'fps'
	o.sticky.fps = 12;
	o.sticky.sliding = false;
	//hands
	o.hands = sprite(filmstrip(assets["json/hands.png"],30,21));
	o.hands.states = {
		stand: 0,
		walk: [1,6],
		jump: 7,
		slide:8,
		gun:9,
		mg: 10
	};
	o.hands.setPosition(0,21);

	//eyes
	o.leye = ellipse(7,4.2,2,5);
	o.reye = ellipse(10,4.2,2,5);
	//group to assemble player parts
	o.grp = group([o.sticky,o.hands,o.leye,o.reye]);

	o.walk = function(){
		if(o.state !== "walk"){
			o.state = "walk";
			o.sticky.playSequence(o.sticky.states.walk);
			o.hands.playSequence(o.hands.states.walk);
			o.leye.y = 4.2;
			o.reye.y = 4.2;
		}
	};
	o.breath = function(){
		var breathePlayer = breathe(player.grp, 1, 1.05, 30);
	};
	o.jump = function(){
		if(o.state !== "jump"){
			o.state = "jump";
			o.sticky.show(o.sticky.states.jump);
			o.hands.show(o.hands.states.jump);
			sBox.play(sBox.jumpSound);
			o.leye.y = 5.8;
			o.reye.y = 5.8;
		}
	};
	o.slide = function(){
		if(o.state !== "slide"){
			o.state = "slide";
			o.sticky.sliding = true;
			o.sticky.show(o.sticky.states.slide);
			o.hands.show(o.hands.states.slide);
		}
	};
	o.unSlide = function(){
		if(o.state !== "unslide"){
			o.state = "unslide";
			o.sticky.sliding = false;
			o.walk();
		}
	};
	o.shoot = function(shooter){
		if(o.state !== "shoot"){
			o.state = "shoot";
			o.hands.show(o.hands.states.gun);
			if (shooter.type == "gun"){
				fire(shooter);
			}
			else{// else it is machine gun
				o.hands.show(o.hands.states.mg);
				fire(shooter);
				setTimeout(function(){fire(shooter);},50);
			}
		}
	};
	o.play = function(){
		if(o.state !== "playing"){
			o.state = "playing";
			o.sticky.play();
			o.hands.play();
		}
	};
	o.stop = function(){
		if(o.state !== "stopped"){
			o.state = "stopped";
			o.sticky.stop();
			o.hands.stop();
		}
	}
	return o;
}
function createCar(){
	var cBody = sprite(assets["carBody.png"]);
	var cLWheel = sprite(assets["carWheel.png"],14.6,17.2);
	var cRWheel = sprite(assets["carWheel.png"],56,17.2);
	var driver =  sprite(assets["driver.png"],38,2);

	cLWheel.rotate =0.1;
	cRWheel.rotate =0.1;
	var car = group([cBody,cLWheel,cRWheel,driver]);

	car.type = "car";
	car.visible = false;

	car.start = function(){
			cLWheel.rotation += cLWheel.rotate;
			cRWheel.rotation += cRWheel.rotate;
	};
	car.remove = function(){
		// carSound.pause();
		sBox.pause(sBox.carSound);
		car.visible = false;
		stage.addChild(car);

		player.grp.visible = true;

		playerGroup.addChild(player.grp);
		playerGroup.addChild(gun);
		playerGroup.item = gun;
		playerGroup.building_index = undefined;
		ai.hasItem = false;

		//remove aliens
		for(var i=aliens.activeAliens.length-1;i>=0;i--){
			aliens.freeAlien(aliens.activeAliens[i]);
		}
		//remove bullets
		for(var i=bullets.activeBullets.length-1;i>=0;i--){
			bullets.freeBullet(bullets.activeBullets[i]);
		}
	}
	return car;// return a car object
}
function Alien(){
	//aliens Pool and active Pool
	this.alienPool = [];
	this.activeAliens=[];
	this.createAlien = function(){
		var alien = sprite(filmstrip(assets["json/alien.png"],30,53));
		alien.states = {
			stand: 0,
			walk: [1,6],
			jump: 7
		};
		//Set the player's 'fps'
		alien.fps = 12;
		alien.vx=0;
		alien.accelerationX = 0;
		alien.isOnGround = false;
		alien.isUnderCol = false;
		alien.state = "";
		alien.release = false;
		alien.canJump = false;

		alien.walk = function(){
			if(alien.state!== "walk"){
				alien.state = "walk";
				alien.playSequence(alien.states.walk);
			}
		};
		alien.jump = function(){
			if(alien.state!== "jump"){
				alien.state = "jump";
				alien.show(alien.states.jump);
			}
		};
		alien.stand = function(){
			if(alien.state!== "stand"){
				alien.state = "stand";
				alien.show(alien.states.stand);
			}
		};
		alien.stop = function(){
			if(alien.state!== "stop"){
				alien.state = "stop";
				alien.stop();
			}
		};
		gameScene.addChild(alien);
		return alien;
	};
	this.getAlien = function(){
		var alien = null;
		if(this.alienPool.length > 0){
			alien = this.alienPool.pop();
			alien.vx=0;
			alien.vy = 0;
			alien.accelerationX = 0;
			alien.isOnGround = false;
			alien.isTouching = false;
			alien.state = "";
			alien.act = "";
		}
		else {
			alien = this.createAlien();
		}
		alien.setPosition(ship.centerX + randomInt(-10,10),ship.centerY + randomInt(-5,5));
		alien.visible = true;
		alien.release = true;
		alien.jump();
		if(randomInt(0,1)){
			alien.act = "run";
			if(randomInt(0,1)){
				alien.canJump = true;
			}
		}
		else{
			alien.act = "defend";
		}
		this.activeAliens.push(alien);
		// entrySound.play();
		sBox.play(sBox.entrySound);
		return alien;
	};
  this.freeAlien = function(alien){
	 	alien.visible = false;
		alien.canJump = false;
		alien.isUnderCol = false;
		alien.release = false;
	 	alien.setPosition(ship.centerX,ship.centerY);
	 	this.activeAliens.splice(this.activeAliens.indexOf(alien), 1);
	 	// return the alien back into the pool
	 	this.alienPool.push(alien);
	};
}
//smoke sprites
function smokeSprites(){
	//smoke Pool and active Pool
	this.smokePool = [];
	this.activeSmoke=[];

	this.createSmoke = function(){
		var smoke = sprite(assets["smoke.png"]);
		gameScene.addChild(smoke);
		return smoke;
	};
	this.getSmoke = function(){
		var smoke = null;
		if(this.smokePool.length > 0){
			smoke = this.smokePool.pop();
		}
		else {
			smoke = this.createSmoke();
		}
		smoke.visible = true;
		this.activeSmoke.push(smoke);
		return smoke;
	};
	this.freeSmoke = function(smoke){
	 	smoke.visible = false;
		smoke.x = 0;
		smoke.y = 0;
		smoke.vx = 0;
		smoke.vy = 0;
		smoke.width = 10;
		smoke.height = 10;
		smoke.rotation = 0;
		smoke.alpha = 1;
		smoke.scaleSpeed = 1;
		smoke.alphaSpeed = 1;
		smoke.rotationSpeed = 1;
		smoke.scaleX = 1;
		smoke.scaleY = 1;
	 	this.activeSmoke.splice(this.activeSmoke.indexOf(smoke), 1);
	 	// return the smoke back into the pool
	 	this.smokePool.push(smoke);
	};
}
function createShip(){
	var ship = sprite(assets["ship.png"]);
	ship.setPosition(g.canvas.width-150,32);
	ship.startTime = Date.now();
	ship.lastUpdateTime = ship.startTime;
	return ship;
}
function createPlayerGroup(){
	var o = group([player.grp,gun]);
	o.isOnGround = false;
	o.building_index = undefined;
	o.checkColl = true;
	o.item = gun;
	o.setPosition((g.canvas.width*.36)/2,g.canvas.height/2);
	return	o;
}
function createGun(){
	var gun = sprite(assets["gun.png"],25,21);
	gun.visible = false;
	gun.type = "gun";
	return gun;
}
function createMGun(){
	var mGun = sprite(assets["mGun.png"]);
	mGun.type = "mg";
	mGun.visible = false;
	mGun.remove = function(){
		mGun.visible = false;
		stage.addChild(mGun);

		playerGroup.addChild(gun);
		playerGroup.item = gun;
	}
	return mGun;
}
//end the game
function end(){
	//stop the player
	playerGroup.vy = 0;
	player.stop();
	playerGroup.visible = false;
	playerGroup.isOnGround = false;
	//remove car
	if(playerGroup.item!==gun){
		car.remove();
	}
	//pause the game
	g.pause();

	//publish score to storage
	score.publishHScore();
	//stop the background music
	sBox.pause(sBox.bgMusic);
	ai.state = 'end';

	//remove aliens
	for(var i=aliens.activeAliens.length-1;i>=0;i--){
		aliens.freeAlien(aliens.activeAliens[i]);
	}
	//remove bullets
	for(var i=bullets.activeBullets.length-1;i>=0;i--){
		bullets.freeBullet(bullets.activeBullets[i]);
	}
	//remove smoke particles
	for(var i=smokes.activeSmoke.length-1;i>=0;i--){
		smokes.freeSmoke(smokes.activeSmoke[i]);
	}
	//Assign a new button 'press' action to restart the game
	titleScene.playBtn.onclick = function(){
		toggleMenu(titleScene,undefined);
		setTimeout(function(){
			restarHandler();
		},500);
	};
	gameoverScene.restartBtn.onclick = function(){
		toggleMenu(gameoverScene,undefined);
		setTimeout(function(){
		restarHandler();
		},500);
	};
	//update gameOver screen variables
	gameoverScene.showOverScreen();
	//Display the 'gameoverScene' after some delay
	setTimeout(function(){
		toggleMenu(undefined,gameoverScene);
	},500);
}
//restart the game
function restart(){
	playerGroup.visible = true;
	playerGroup.setPosition((g.canvas.width*.36)/2,g.canvas.height/2);
	playerGroup.building_index = undefined;
	player.state = "jump"
	topBar.reset(5);
	bd.pattern = designs[randomInt(0,4)];
	contr.design = bd.pattern;
	contr.distance = 0;
	 //reset the building designs
	bd.resetBuildings(bd.pattern);
	//restart the bg music
	sBox.restart(sBox.bgMusic);
	ai.state = 'play';
}
//buildings in the game
function Buildings(){
	//variables for building blocks
	this.numOfBuilding = 4;
	this.buildingWidth = g.canvas.width*.36;
	this.buildingHeight = g.canvas.height*.65;
	this.row = 7;
	this.columns = 11;
	this.endGap = this.buildingWidth*.25;
	this.strtGap = this.endGap*.6;
	this.hGap = this.buildingHeight*.1;
	this.shake = false;
	//Create a 'group' for all the buildings
	blocks = group([]);
	//attracts Arrays
	this.attracts = [];

	//selected pattern for building background
	this.pattern = designs[randomInt(0,4)];

	if(g.mobile === true){
		this.row = 5;
		this.columns = 7;
	}

	this.width = this.buildingWidth /this.row;
	this.height = this.buildingHeight/this.columns;

	this.createBuildings = function(){
		blocks.nextPos = { X: 0, Y: this.buildingHeight };
		//Procedural Generation of buildings
		for (var k =0; k < this.numOfBuilding; k++){
			// this.buildingHeight = g.canvas.height - blocks.nextPos.Y;
			var building = this.designBuidlings(this.buildingWidth,this.buildingHeight,this.pattern,blocks.nextPos.X,blocks.nextPos.Y);
			blocks.addChild(building);
			blocks.nextPos.X = building.x + building.width + randomInt(this.strtGap,this.endGap);
			blocks.nextPos.Y = this.buildingHeight + randomInt(-this.hGap,this.hGap);

			var cBox = rectangle(25,g.canvas.height,"#272726","grey",1,building.x + building.width,0);
			cBox.visible = false;
			// cBox.alpha = 0.1;
			this.attracts.push(cBox);
			building.cBox = cBox;
		}
	};
	this.designBuidlings = function(width,height,pattern,x,y){
		var building =rectangle(width,height,"#272726","grey",2,x,y);
		if(pattern.image){
			building.setPattern(pattern.image,"repeat");
		}
		var windowWidth = building.width /this.row;
		var windowHeight = building.height/this.columns;
		for(var i = 0; i < this.columns; i++){
			for(var j = 0; j < this.row; j++){
				if ( j % 2 !== 0 && i % 2 !== 0){
					//create the windows
					var window = rectangle(windowWidth,windowHeight,"grey","black",1);
					window.x = windowWidth*j;
					window.y = windowHeight*i;
					window.i = i;
					window.j = j;
					window.fillStyle = pattern.color2;
					if(randomInt(0,1)){
						window.fillStyle = pattern.color1;
					}
					building.addChild(window);
				}
			}
		}
		return building;
	};
	this.resetBuildings = function(pattern){
		blocks.children.forEach(function(building){
			building.pattern = false;
			if(pattern.image)	{
				building.setPattern(pattern.image,"repeat");
			}
			building.children.forEach(function(window){
				if(randomInt(0,1)){
					window.fillStyle = pattern.color1;
				}
				else{
						window.fillStyle = pattern.color2;
				}
			});
		});
	};
}
//score
function Score(){
	this.hkills = 0;
	this.hlevel = 0;
	this.hscore = 0;
	this.kills = 0;
	this.level = 0;
	this.score = 0;
	this.scoreText = text("Score 0", "10px PetMe64", "white",32,32);
	this.scoreText.setPosition(g.canvas.width- 1.5*this.scoreText.width,this.scoreText.height);

	this.init = function(){
		//get high score from storage
		//call here and update below variables
		var data = ds.retrieveData();
		if(data){
			this.hkills = data.kills;
			this.hlevel = data.level;
			this.hscore = data.score;
		}

		this.kills = 0;
		this.level = 0;
		this.score = 0;
		this.scoreText.content = "Score 0";
	};

	this.publishHScore = function(){
		//get high score
		if(this.score > this.hscore){
			this.hkills = this.kills;
			this.hlevel = this.level;
			this.hscore = this.score;

			//publish to database/storage
			ds.saveData({
				playerName: "Test Player",
				kills: this.hkills,
				level: 	this.hlevel,
				score: this.hscore,
				coins: 100
			});
		}
	};

	this.update = function(){
		this.kills += 1;
		ai.scoreCtr += 1;
		this.score = this.kills*10;
		this.scoreText.content = "Score " + this.score;
		this.scoreText.setPosition(g.canvas.width- 1.5*this.scoreText.width,this.scoreText.height);
	};
}
function TopBar(){
 	this.noLife = contr.noOfLife;
	this.maxLife =contr.maxLife
	this.container = group([]);

	this.create = function(){
	 for(var i=0;i < this.maxLife;i++){
		var life = sprite(assets["life.png"],11*i,5);
		life.visible = false;
		this.container.addChild(life);
	 }
	};
	this.update = function(lifeCounter){
		this.noLife += lifeCounter;
		if(this.noLife > this.maxLife)
			this.noLife = this.maxLife;
		if(this.noLife > 0){
			for(var i=0;i < this.maxLife;i++){
				if(i < this.noLife)
					this.container.children[i].visible = true;
				else {
					this.container.children[i].visible = false;
				}
			}
		}
		else{
			for(var i=0;i < this.maxLife;i++){
					this.container.children[i].visible = false;
			}
			end();
			// setTimeout(end,1000);
		}
	};
	this.reset = function(){
		this.noLife = contr.noOfLife;
		for(var i=0;i < this.maxLife;i++){
			if(i < this.noLife)
				this.container.children[i].visible = true;
			else {
				this.container.children[i].visible = false;
			}
		}
	};
}
function getSkyBackground(){
		return tilingSprite(g.canvas.width,g.canvas.height,assets["snow.png"]);
}
function drawMoon(){
	var moon = circle(100);
	// moon.blendMode = "hard-light";
	// moon.setRadialGradient("white","#e6e6e2",0,0,10,0,0,35);
	moon.setPosition(150,200);
	return moon;
}
function initDesigns(){
	var design1 = {
			image: undefined,
			color1: "grey",
			color2: "grey"
	};
	var design2 = {
			image: assets["images/texture.png"],
			color1:"#f00e2e",
			color2: "grey"
	};
	var design3 = {
			image: assets["images/texture2.png"],
			color1:"black",
			color2: "grey"
	};
	var design4 = {
			image: assets["images/texture3.png"],
			color1:"black",
			color2: "grey"
	};
	var design5 = {
			image: assets["images/texture4.png"],
			color1:"black",
			color2: "grey"
	};
	designs.push(design1);
	designs.push(design2);
	designs.push(design3);
	designs.push(design4);
	designs.push(design5);
}
function ItemManager(){
  this.initItems = function(){
    this.car_snap = sprite(assets["car_snap.png"]);
    this.car_snap.type = "car";
    this.car_snap.visible = false;

    this.life = sprite(assets["heart.png"]);
    this.life.type = "heart";
    this.life.visible = false;

    gameScene.addChild(this.car_snap);
    gameScene.addChild(this.life);
  };
  this.getItem = function(){
  	var item;
    switch (randomInt(1,2)){
      case 1:
        item = this.car_snap;
        break;
      case 2:
        item = this.life;
        break;
      default:
        console.log("Error in getting items");
    }
    if (item !== undefined){
			item.setPosition(0,0);
      return item;
  	}
  };
  this.removeItem = function(item){
    item.visible= false;
    stage.addChild(item);
  };
}
// The 'gameScene' sprites
function GameScene(){
	//Make the sky background
	sky = getSkyBackground();
	//Initialize designs
	initDesigns();
	//space ship sprites
	ship = createShip();
	//draw moon sprites
	moon = drawMoon();
	//create life bar sprite pool
	topBar = new TopBar();
	topBar.create();
	topBar.update(0);
	//Display score
	score = new Score();
	score.init();
	//make player and set initials
	player = makePlayer();
	player.walk();
	player.breath();
	//Power Ups
	gun = createGun();
	car = createCar();
	//Create Player Group as a container
	playerGroup = createPlayerGroup();
	//Create  buildings
	bd = new Buildings();
	bd.createBuildings();

	//create the touch controls
	touchCtrl = TouchControls();

	return group([sky,topBar.container,score.score,moon,blocks,ship,car,playerGroup,itemGroup,score.scoreText,
		touchCtrl.jumpTBtn,touchCtrl.fireTBtn,touchCtrl.jumpText,touchCtrl.fireText]);
}
//Title menu scene
function getTitleScene(){
	var o = {};
	o.div = document.getElementById("titleScene");
	o.playBtn = document.getElementById("m1playBtn");
	o.playBtn.onclick = function(){
		focusText.focus();
		playerGroup.visible = true;
		ship.visible = true;
		// bgMusic.play();
		sBox.play(sBox.bgMusic);
		toggleMenu(o,undefined);
		setTimeout(function(){
			g.state = play;
			ai.init(Date.now());
		},200)
	};
	o.scoreBtn = document.getElementById("m1scoreBtn");
	o.scoreBtn.onclick = function(){
		toggleMenu(o,scoreScene);
		scoreScene.show();
	};
	o.optionsBtn = document.getElementById("m1optionsBtn");
	o.optionsBtn.onclick = function(){
		toggleMenu(o,optionScene);
	};
	o.storeBtn = document.getElementById("m1storeBtn");
	o.storeBtn.onclick = function(){
		toggleMenu(o,storeScene);
	};
	o.creditsBtn = document.getElementById("m1creditsBtn");
	o.creditsBtn.onclick = function(){
		toggleMenu(o,creditScene);
	};
	return o;
}
//score menu option
function ScoreScene(){
	var o = {};
	o.div = document.getElementById("scoreScene");
	o.kills = document.getElementById("m2kills");
	o.level = document.getElementById("m2level");
	o.hscore = document.getElementById("m2hscore");
	o.backBtn = document.getElementById("m2backBtn");
	o.backBtn.onclick = function(){
		toggleMenu(o,titleScene);
	};
	o.show = function(){
		o.kills.textContent = score.hkills;
		o.level.textContent = score.hlevel;
		o.hscore.textContent = score.hscore;
	};
	return o;
}
//options scene for settings
function OptionScene(){
	var o = {};
	o.div = document.getElementById("optionScene");
	o.backBtn = document.getElementById("m3backBtn");
	o.backBtn.onclick = function(){
		toggleMenu(o,titleScene);
	};
	return o;
}
//store scene for buying life
function StoreScene(){
	var o = {};
	o.div = document.getElementById("storeScene");
	o.backBtn = document.getElementById("m4backBtn");
	o.backBtn.onclick = function(){
		toggleMenu(o,titleScene);
	};
	return o;
}
//game credits
function CreditScene(){
	var o = {};
	o.div = document.getElementById("creditScene");
	o.backBtn = document.getElementById("m5backBtn");
	o.backBtn.onclick = function(){
		toggleMenu(o,titleScene);
	};
	return o;
}
//show game over menu
function GameOverScene(){
	var o = {};
	o.div = document.getElementById("gameOverScene");
	o.kills = document.getElementById("m6kills");
	o.level = document.getElementById("m6level");
	o.score = document.getElementById("m6score");
	o.hscore = document.getElementById("m6hscore");

	o.menuBtn = document.getElementById("m6menuBtn");
	o.menuBtn.onclick = function(){
		toggleMenu(o,titleScene);
	};

	o.restartBtn = document.getElementById("m6restartBtn");

	o.showOverScreen = function(){
		o.kills.textContent = score.kills;
		o.level.textContent = score.level;
		o.score.textContent = score.score;
		o.hscore.textContent = score.hscore;
	};
	return o;
}
//show pause screen
function PauseScene(){
	var o = {};
	o.div = document.getElementById("pauseScene");
	o.div.onclick = function(){
		toggleMenu(o,undefined);
		focusText.focus();
		ai.t0 = Date.now();
		g.resume();
		sBox.restart(sBox.bgMusic);
		player.walk();
	};
	return o;
}
//Managing focus on game window
function focusManager(){
	var focusText = document.createElement("input");
	focusText.id = "focusText";
	focusText.setAttribute("style","width: 0px; height: 0px;");
	document.body.appendChild(focusText);
	focusText.onblur = function(){
		if(!g.paused){
			g.pause();
			toggleMenu(undefined,pauseScene);
			sBox.pause(sBox.bgMusic);
			player.stop();
		}

	};
	return focusText;
}
//Manage Sound in the game
function SoundBox(){
	this.mute = false;
	//Sound and music
	this.shotSound = null;
	this.bgMusic = null;
	this.explosionSound = null;
	this.jumpSound = null;
	this.entrySound = null;
	this.pupSound = null;
	this.carSound = null;

	this.init = function(){
		//check the support for web audio api
		if(Modernizr.webaudio){
			this.shotSound = assets["sounds/shot.wav"];
			this.bgMusic = assets["sounds/retro-action.mp3"];
			this.bgMusic.loop = true;
			this.bgMusic.volume= 0.2;
			this.explosionSound = assets["sounds/explosion.wav"];
			this.jumpSound = assets["sounds/bounce.mp3"];
			this.entrySound = assets["sounds/entry.mp3"];
			this.pupSound = assets["sounds/powerup.mp3"];
			this.carSound = assets["sounds/car.mp3"];
			this.carSound.loop = true;
		}
		else{
			console.log("webaudio api not supported - disabling sound");
		}
	};

	this.play = function(soundObj){
		if(soundObj && this.mute === false){
			soundObj.play();
		}
	};
	this.restart = function(soundObj){
		if(soundObj && this.mute === false){
			soundObj.restart();
		}
	};
	this.pause = function(soundObj){
		if(soundObj && this.mute === false){
			soundObj.pause();
		}
	};

}
//Store the game data
function Storage(){
	var o = {};
	o.saveData = function(gameData){
		var gameDataJSON = JSON.stringify(gameData);
		localStorage.setItem("gameData", gameDataJSON);
	};
	o.retrieveData = function(){
		var loadedData = localStorage.getItem("gameData");
		if(loadedData){
			var data = JSON.parse(loadedData);
			return data;
		}
		return null;
	};
	return o;
}
//game AI to Introduce items/aliens in the game
function gameAI(){
	//Game level Information
	this.levels = [
		/*0: min no of aliens, 1: max no if aliens, 2: kills for level up*/
		[1,1,3],		//Level 0
		[1,2,10],		//Level 1
		[1,3,10],		//Level 2
		[2,3,25],		//Level 3
		[1,4,30],		//Level 4
		[2,4,35],		//Level 5
		[3,4,40],		//Level 6
		[2,5,45], 	//Level 7
		[3,5,60],		//Level 8
		[4,5,80], 	//Level 9
		[5,7,101] 	//Level 10
	];
	//game state
	this.state = '';// 'play' 'end' 'pause'

	this.startTime = 0;
	this.lastUpdAtime = 0;
	this.lastUpdPtime = 0;
	this.curr_level = 0;
	this.scoreCtr = 0;
	this.minAlien = 0;
	this.maxAlien = 0;
	this.alienToKill = 0;

	//Time based motion
	this.t0 = 0;
	this.t1 = 0;
	this.dt = 0;

	this.mdt = 0;

	this.init = function(delta){
		this.startTime = delta;
		this.lastUpdAtime = delta;
		this.lastUpdPtime = delta;

		this.curr_level = 0;
		this.scoreCtr = 0;
		this.minAlien = this.levels[this.curr_level][0];
		this.maxAlien = this.levels[this.curr_level][1];
		this.alienToKill = this.levels[this.curr_level][2];

		//initalize the time based variables
		this.t0 = delta;
		this.t1 = delta;
		this.mdt = 1000/60;
	};

	this.setAlien = function(currTime){
		this.t1 = currTime;
		this.dt = (currTime-this.t0)*(60/1000);
		// this.dt = 1;
		if(this.dt >this.mdt){
			 this.dt  = 1;
		}

		// send aliens in the game
		if(currTime-this.lastUpdAtime >= 3000){
				for(var i = 0; i < randomInt(this.minAlien,this.maxAlien); i++){
					setTimeout(function(){
						aliens.getAlien();
					},i*350);
				}
				this.lastUpdAtime =  currTime;
		}

		// Update level and change building design
		if(this.scoreCtr >= this.alienToKill){
			if(this.curr_level < this.levels.length-1){
				this.curr_level++;
				this.minAlien = this.levels[this.curr_level][0];
				this.maxAlien = this.levels[this.curr_level][1];
				this.alienToKill = this.levels[this.curr_level][2];

				this.scoreCtr = 0;
				score.level = this.curr_level;

				//reset the building designs wid levels
				bd.pattern = designs[randomInt(0,4)];
				contr.design = bd.pattern;
				bd.resetBuildings(contr.design);

				levelText.visible = true;
				levelText.content = "Level " + score.level;
				levelText.setPosition(g.canvas.width/2-levelText.width/2,g.canvas.height/2-levelText.height);
				var fadeOutTweenPlayer = fadeOut(levelText,120);
				fadeOutTweenPlayer.onComplete = function(){
													levelText.visible = false;
													levelText.alpha = 1;
													fadeOutTweenPlayer = null;
												};
			}
		}

		if(currTime-this.lastUpdPtime >= 10000){
			if(itemGroup.children.length === 0){
				var item = imgr.getItem();
				item.visible= true;
				itemGroup.addChild(item);
				itemGroup.x = g.canvas.width;
				itemGroup.y = g.canvas.height*0.5;
				this.lastUpdPtime =  currTime;
				item = null;
			}
		}
	};
}
