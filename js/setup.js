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
// g.start();

// //Scale and center the game
// g.scaleToWindow();

//Optionally rescale the canvas if the browser window is changed
window.addEventListener("resize", function(event){
	// g.scaleToWindow();
	g.setupMobile();
});
//set up mobile version
g.setupMobile();

//Start the engine
g.start();

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

	//Create Aliens
	aliens = new Alien();
	for(var i=0;i < 5;i++){
		var alienObj = aliens.createAlien();
		alienObj.visible = false;
		alienObj.setPosition(ship.centerX,ship.centerY);
		aliens.alienPool.push(alienObj);
	}
	//Create Bullets
	bullets = new Bullet();
	for(var i=0;i < 5;i++){
		var bulletObj = bullets.createBullet();
		bulletObj.visible = false;
		bullets.bulletPool.push(bulletObj);
	}
	//Initi items
	imgr = new ItemManager();
	imgr.initItems();

	//Assign the key events
	keyHandler();

	// focusText = focusManager();
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
}
function restarHandler(){
	// focusText.focus();
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
			player.jump();
			}
	}
	//slide the player with downArrow
	var dwnArrow = keyboard(40);
	dwnArrow.press = function(){
		playerGroup.rotation = -1.45;
		player.slide();
	};
	//unslide the player
	dwnArrow.release = function(){
		playerGroup.rotation = 0;
		player.unSlide();
	};
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
			var carWobble = wobble(car, 1, 1.1);
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
		ai.hasItem = false;
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
	o.building_id = "";
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
function end(){
	//remove aliens
	for(var i=aliens.activeAliens.length-1;i>=0;i--){
		aliens.freeAlien(aliens.activeAliens[i]);
	}
	//remove bullets
	for(var i=bullets.activeBullets.length-1;i>=0;i--){
		bullets.freeBullet(bullets.activeBullets[i]);
	}

	//Display the 'gameoverScene'
	toggleMenu(undefined,gameoverScene);
	gameoverScene.showOverScreen();
	//Assign a new button 'press' action to restart the game
	titleScene.playRect.release = function(){
		toggleMenu(titleScene,undefined);
		restarHandler();
	};
	gameoverScene.restartBtn.release = function(){
		toggleMenu(gameoverScene,undefined);
		restarHandler();
	};
	//publish score to storage
	score.publishHScore();
	sBox.pause(sBox.bgMusic);
	ai.state = 'end';
}
function restart(){
	playerGroup.setPosition((g.canvas.width*.36)/2,g.canvas.height/2);
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
function Score(){
	this.hkills = null;
	this.hlevel = null;
	this.hscore = null;
	this.kills = null;
	this.level = null;
	this.score = null;
	this.scoreText = text("Score 0", "10px PetMe64", "white",32,32);
	this.scoreText.setPosition(g.canvas.width- 1.5*this.scoreText.width,this.scoreText.height);

	this.init = function(){
		//get high score from storage
		//call here and update below variables

		this.hkills = 0;
		this.hlevel = 0;
		this.hscore = 0;

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
			//function cal here
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
			playerGroup.vy = 0;
			player.stop();
			g.pause();
			setTimeout(end,1000);
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
      return item;
  	}
  };
  this.removeItem = function(item){
    item.visible= false;
    gameScene.addChild(item);
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
function getTitleScene(){
	var o = group([]);
	o.color = "rgba(0, 0, 200, 0)"; 					//"#3b3224"
	o.borderColor = "rgba(0, 0, 200, 0)";		// "#3b3224"
	o.hoverColor = "#1d1812"; 	// "#1d1812"
	o.headerFont = "PetMe64";
	o.footerFont = "PetMe64";
	o.contextFont = "PetMe64";
	o.alpha = contr.menuAlpha;
	o.visible = false;
	//title scene background
	o.frontBg = rectangle(g.canvas.width,g.canvas.height,"#3b3224","#3b3224");
	//title scene header
	o.header = rectangle(g.canvas.width,50,o.color,o.borderColor)
	title = text("ALIEN HUNT", "50px " +  o.headerFont, "white");
	o.header.addChild(title);

	//playBtn
	o.playRect = rectangle(g.canvas.width,50,o.color,o.borderColor,0)
	playBtn = text("PLAY", "35px " + o.contextFont, "white",0);
	o.playRect.addChild(playBtn);
	o.playRect.release = function(){
		// focusText.focus();
		playerGroup.visible = true;
		ship.visible = true;
		toggleMenu(o,undefined);
		g.state = play;
		// bgMusic.play();
		sBox.play(sBox.bgMusic);
		ai.init(Date.now());
	};
	o.playRect.over = function(){o.playRect.fillStyle = o.hoverColor;};
	o.playRect.out = function(){o.playRect.fillStyle = o.color;};
	//stats of the player
	o.statsRect = rectangle(g.canvas.width,50,o.color,o.borderColor);
	statsBtn = text("STATS", "35px " + o.contextFont, "white");
	o.statsRect.addChild(statsBtn);
	o.statsRect.release = function(){
		toggleMenu(o,scoreScene);
		scoreScene.show();
	};
	o.statsRect.over = function(){o.statsRect.fillStyle = o.hoverColor;};
	o.statsRect.out = function(){o.statsRect.fillStyle = o.color;};

	//options
	o.optionsRect = rectangle(g.canvas.width,50,o.color,o.borderColor);
	optionsBtn = text("OPTIONS", "35px " + o.contextFont, "white");
	o.optionsRect.addChild(optionsBtn);
	o.optionsRect.release = function(){
			toggleMenu(o,optionScene);
	};
	o.optionsRect.over = function(){o.optionsRect.fillStyle = o.hoverColor;};
	o.optionsRect.out = function(){o.optionsRect.fillStyle = o.color;};

	//store button
	o.storeRect = rectangle(g.canvas.width,50,o.color,o.borderColor,0);
	storeBtn = text("STORE", "35px " + o.contextFont, "white");
	o.storeRect.addChild(storeBtn);
	o.storeRect.release = function(){
		toggleMenu(o,storeScene);
	};
	o.storeRect.over = function(){o.storeRect.fillStyle = o.hoverColor;};
	o.storeRect.out = function(){o.storeRect.fillStyle = o.color;};

	//credit button
	o.creditRect = rectangle(g.canvas.width,50,o.color,o.borderColor,0);
	creditBtn = text("CREDITS", "35px " + o.contextFont, "white");
	o.creditRect.addChild(creditBtn);
	o.creditRect.release = function(){
		toggleMenu(o,creditScene);
	};
	o.creditRect.over = function(){o.creditRect.fillStyle = o.hoverColor;};
	o.creditRect.out = function(){o.creditRect.fillStyle = o.color;};

	//title scene footer
	o.footer = rectangle(g.canvas.width,50,o.color,o.borderColor);
	footerText = text("z / ↑ to Jump,  x / → to fire, Space to pause/resume", "10px " + o.footerFont, "white");
	copyrightText = text("\u00a9copyright: 3riM", "8px " + o.footerFont, "white");
	o.footer.addChild(footerText);
	o.footer.addChild(copyrightText);

	o.frontBg.putCenter(o.header,0,-250);
	o.header.putCenter(title);
	o.playRect.putCenter(playBtn);
	o.statsRect.putCenter(statsBtn);
	o.optionsRect.putCenter(optionsBtn);
	o.storeRect.putCenter(storeBtn);
	o.creditRect.putCenter(creditBtn);
	o.footer.putCenter(footerText);
	o.footer.putCenter(copyrightText,0,30);
	o.frontBg.putCenter(o.footer,0,225);

	o.header.putBottom(o.playRect,0,100);
	o.playRect.putBottom(o.statsRect);
	o.statsRect.putBottom(o.optionsRect);
	o.optionsRect.putBottom(o.storeRect);
	o.storeRect.putBottom(o.creditRect);

	o.addChild(o.frontBg);
	o.addChild(o.header);
	o.addChild(o.playRect);
	o.addChild(o.statsRect);
	o.addChild(o.optionsRect);
	o.addChild(o.storeRect);
	o.addChild(o.creditRect);
	o.addChild(o.footer);
	return o;
}
function ScoreScene(){
	var o = group([]);
	o.color = "rgba(0, 0, 200, 0)"; 					//"#3b3224"
	o.borderColor = "rgba(0, 0, 200, 0)";		// "#3b3224"
	o.hoverColor = "#1d1812"; 	// "#1d1812"
	o.headerFont = "PetMe64";
	o.footerFont = "PetMe64";
	o.contextFont = "PetMe64";
	o.vOffset = 20;
	o.hOffset = 0;
	o.alpha = contr.menuAlpha;
	o.visible = false;

	//ScoreScene background
	o.frontBg = rectangle(g.canvas.width,g.canvas.height,"#3b3224","#3b3224");
	//Score scene header
	o.header = rectangle(g.canvas.width,50,o.color,o.borderColor)
	title = text("SCORE", "50px " +  o.headerFont, "white");
	o.header.addChild(title);

	//playBtn
	o.noOfKills = text("kills: 2324", "20px " + o.contextFont, "white",0);
	o.deaths = text("deaths: 123", "20px " + o.contextFont, "white",0);
	o.score = text("score: 15000", "20px " + o.contextFont, "white",0);
	o.highScore = text("high score: 250000", "20px " + o.contextFont, "white",0);

	o.backBtn = text("back", "20px " + o.contextFont, "white",0);
	o.backBtn.release = function(){
		toggleMenu(o,titleScene);
	};
	o.backBtn.over = function(){o.backBtn.fillStyle = o.hoverColor;};
	o.backBtn.out = function(){o.backBtn.fillStyle = "white";};

	//title scene footer
	o.footer = rectangle(g.canvas.width,50,o.color,o.borderColor);
	footerText = text("\u00a9copyright: 3riM", "8px " + o.footerFont, "white");
	o.footer.addChild(footerText);

	o.frontBg.putCenter(o.header,0,-250);
	o.header.putCenter(title);
	o.footer.putCenter(footerText);
	o.frontBg.putCenter(o.footer,0,250);

	o.header.putBottom(o.noOfKills,0,125);
	o.noOfKills.putBottom(o.deaths,o.hOffset,o.vOffset);
	o.deaths.putBottom(o.score,o.hOffset,o.vOffset);
	o.score.putBottom(o.highScore,o.hOffset,o.vOffset);
	o.highScore.putBottom(o.backBtn,0,75);

	o.addChild(o.frontBg);
	o.addChild(o.header);
	o.addChild(o.noOfKills);
	o.addChild(o.deaths)
	o.addChild(o.score);
	o.addChild(o.highScore);
	o.addChild(o.backBtn);
	o.addChild(o.footer);

	o.show = function(){
		o.noOfKills.content = "kills: " + score.kills;
		o.deaths.content = "level: " + score.level;
		o.score.content = "score: " + score.score;
		o.highScore.content = "high score: 2500";
	};

	return o;
}
function OptionScene(){
	var o = group([]);
	o.color = "rgba(0, 0, 200, 0)"; 					//"#3b3224"
	o.borderColor = "rgba(0, 0, 200, 0)";		// "#3b3224"
	o.hoverColor = "#1d1812"; 	// "#1d1812"
	o.headerFont = "PetMe64";
	o.footerFont = "PetMe64";
	o.contextFont = "PetMe64";
	o.vOffset = 10;
	o.hOffset = 0;
	o.alpha = contr.menuAlpha;
	o.visible = false;

	//Store Scene background
	o.frontBg = rectangle(g.canvas.width,g.canvas.height,"#3b3224","#3b3224");
	//Store scene header
	o.header = rectangle(g.canvas.width,50,o.color,o.borderColor)
	title = text("OPTIONS", "50px " +  o.headerFont, "white");
	o.header.addChild(title);

	//content
	o.content = text("z / ↑ to Jump,  x / → to fire, Space to pause/resume", "10px " +  o.headerFont, "white");

	// back button
	o.backBtn = text("back", "20px " + o.contextFont, "white",0);
	o.backBtn.release = function(){
		toggleMenu(o,titleScene);
	};
	o.backBtn.over = function(){o.backBtn.fillStyle = o.hoverColor;};
	o.backBtn.out = function(){o.backBtn.fillStyle = "white";};

	//Store scene footer
	o.footer = rectangle(g.canvas.width,50,o.color,o.borderColor);
	footerText = text("\u00a9copyright: 3riM", "8px " + o.footerFont, "white");
	o.footer.addChild(footerText);

	o.frontBg.putCenter(o.header,0,-250);
	o.header.putCenter(title);
	o.footer.putCenter(footerText);
	o.frontBg.putCenter(o.footer,0,250);

	o.frontBg.putCenter(o.backBtn,0,100);
	o.frontBg.putCenter(o.content)

	o.addChild(o.frontBg);
	o.addChild(o.header);
	o.addChild(o.content);
	o.addChild(o.backBtn);
	o.addChild(o.footer);

	return o;
}
function StoreScene(){
	var o = group([]);
	o.color = "rgba(0, 0, 200, 0)"; 					//"#3b3224"
	o.borderColor = "rgba(0, 0, 200, 0)";		// "#3b3224"
	o.hoverColor = "#1d1812"; 	// "#1d1812"
	o.headerFont = "PetMe64";
	o.footerFont = "PetMe64";
	o.contextFont = "PetMe64";
	o.vOffset = 10;
	o.hOffset = 0;
	o.alpha = contr.menuAlpha;
	o.visible = false;

	//Store Scene background
	o.frontBg = rectangle(g.canvas.width,g.canvas.height,"#3b3224","#3b3224");
	//Store scene header
	o.header = rectangle(g.canvas.width,50,o.color,o.borderColor)
	title = text("STORE", "50px " +  o.headerFont, "white");
	o.header.addChild(title);

	//content
	o.content = text("In Game Purchases (Under Construction)", "10px " +  o.headerFont, "white");

	// back button
	o.backBtn = text("back", "20px " + o.contextFont, "white",0);
	o.backBtn.release = function(){
		toggleMenu(o,titleScene);
	};
	o.backBtn.over = function(){o.backBtn.fillStyle = o.hoverColor;};
	o.backBtn.out = function(){o.backBtn.fillStyle = "white";};

	//Store scene footer
	o.footer = rectangle(g.canvas.width,50,o.color,o.borderColor);
	footerText = text("\u00a9copyright: 3riM", "8px " + o.footerFont, "white");
	o.footer.addChild(footerText);

	o.frontBg.putCenter(o.header,0,-250);
	o.header.putCenter(title);
	o.footer.putCenter(footerText);
	o.frontBg.putCenter(o.footer,0,250);

	o.frontBg.putCenter(o.backBtn,0,100);
	o.frontBg.putCenter(o.content)

	o.addChild(o.frontBg);
	o.addChild(o.header);
	o.addChild(o.content);
	o.addChild(o.backBtn);
	o.addChild(o.footer);

	return o;
}
function CreditScene(){
	var o = group([]);
	o.color = "rgba(0, 0, 200, 0)"; 					//"#3b3224"
	o.borderColor = "rgba(0, 0, 200, 0)";		// "#3b3224"
	o.hoverColor = "#1d1812"; 	// "#1d1812"
	o.headerFont = "PetMe64";
	o.footerFont = "PetMe64";
	o.contextFont = "PetMe64";
	o.vOffset = 10;
	o.hOffset = 0;
	o.alpha = contr.menuAlpha;
	o.visible = false;

	//Store Scene background
	o.frontBg = rectangle(g.canvas.width,g.canvas.height,"#3b3224","#3b3224");
	//Store scene header
	o.header = rectangle(g.canvas.width,50,o.color,o.borderColor)
	title = text("CREDITS", "50px " +  o.headerFont, "white");
	o.header.addChild(title);

	//content
	o.content = text("Developer/Designer: Akshay Bairagi", "10px " +  o.headerFont, "white");

	// back button
	o.backBtn = text("back", "20px " + o.contextFont, "white",0);
	o.backBtn.release = function(){
		toggleMenu(o,titleScene);
	};
	o.backBtn.over = function(){o.backBtn.fillStyle = o.hoverColor;};
	o.backBtn.out = function(){o.backBtn.fillStyle = "white";};

	//Store scene footer
	o.footer = rectangle(g.canvas.width,50,o.color,o.borderColor);
	footerText = text("\u00a9copyright: 3riM", "8px " + o.footerFont, "white");
	o.footer.addChild(footerText);

	o.frontBg.putCenter(o.header,0,-250);
	o.header.putCenter(title);
	o.footer.putCenter(footerText);
	o.frontBg.putCenter(o.footer,0,250);

	o.frontBg.putCenter(o.backBtn,0,100);
	o.frontBg.putCenter(o.content)

	o.addChild(o.frontBg);
	o.addChild(o.header);
	o.addChild(o.content);
	o.addChild(o.backBtn);
	o.addChild(o.footer);

	return o;
}
function GameOverScene(){
	var o = group([]);
	o.color = "rgba(0, 0, 200, 0)"; 					//"#3b3224"
	o.borderColor = "rgba(0, 0, 200, 0)";		// "#3b3224"
	o.hoverColor = "#1d1812"; 	// "#1d1812"
	o.headerFont = "PetMe64";
	o.footerFont = "PetMe64";
	o.contextFont = "PetMe64";
	o.alpha = 0.7;
	o.visible = false;

	//GameOver Scene background
	o.frontBg = rectangle(g.canvas.width,g.canvas.height,"#3b3224","#3b3224");

	o.overText = text("GAME OVER", "40px " + o.contextFont, "white",0);

	o.noOfKills = text("kills: " + score.kills, "20px " + o.contextFont, "white",0);
	o.deaths = text("level: " + score.level, "20px " + o.contextFont, "white",0);
	o.score = text("score: " + score.score, "20px " + o.contextFont, "white",0);
	o.highScore = text("high score: 2500", "20px " + o.contextFont, "white",0);

	o.restartBtn = text("restart >", "15px " + o.contextFont, "white",0);
	o.restartBtn.release = function(){
	};
	o.restartBtn.over = function(){o.restartBtn.fillStyle = o.hoverColor;};
	o.restartBtn.out = function(){o.restartBtn.fillStyle = "white";};
	o.menuBtn = text("< menu", "15px " + o.contextFont, "white",0);
	o.menuBtn.release = function(){
		toggleMenu(o,titleScene);
	};
	o.menuBtn.over = function(){o.menuBtn.fillStyle = o.hoverColor;};
	o.menuBtn.out = function(){o.menuBtn.fillStyle = "white";};

	o.frontBg.putCenter(o.overText,0,-200);
	o.overText.putBottom(o.noOfKills,0,50);
	o.noOfKills.putBottom(o.deaths,0,20);
	o.deaths.putBottom(o.score,0,20);
	o.score.putBottom(o.highScore,0,20);
	o.overText.putCenter(o.restartBtn,75,250);
	o.overText.putCenter(o.menuBtn,-100,250);

	o.addChild(o.frontBg);
	o.addChild(o.overText);
	o.addChild(o.noOfKills);
	o.addChild(o.deaths);
	o.addChild(o.score);
	o.addChild(o.highScore);
	o.addChild(o.restartBtn);
	o.addChild(o.menuBtn);

	o.showOverScreen = function(){
		o.noOfKills.content = "kills: " + score.kills;
		o.deaths.content = "level: " + score.level;
		o.score.content = "score: " + score.score;
		o.highScore.content = "high score: 2500";
	};
	return o;
}
function PauseScene(){
	var o = group([]);
	o.color = "rgba(0, 0, 200, 0)"; 					//"#3b3224"
	o.borderColor = "rgba(0, 0, 200, 0)";		// "#3b3224"
	o.hoverColor = "#1d1812"; 	// "#1d1812"
	o.headerFont = "PetMe64";
	o.footerFont = "PetMe64";
	o.contextFont = "PetMe64";
	o.alpha = 0.5;
	o.visible = false;

	//Store Scene background
	o.frontBg = rectangle(g.canvas.width,g.canvas.height,"#3b3224","#3b3224");
	o.frontBg.release = function(){
		toggleMenu(o,gameScene);
		// focusText.focus();
		g.resume();
		sBox.restart(sBox.bgMusic);
		player.walk();
	};
	o.frontBg.over = function(){o.frontBg.fillStyle = o.hoverColor;};
	o.frontBg.out = function(){o.frontBg.fillStyle = "white";};

	// back button
	o.pauseText = text("GAME PAUSED", "40px " + o.contextFont, "white",0);
	o.backBtn = text("click to continue..", "15px " + o.contextFont, "white",0);

	o.frontBg.putCenter(o.pauseText,0,-50);
	o.pauseText.putBottom(o.backBtn,0,20);

	o.addChild(o.frontBg);
	o.addChild(o.pauseText);
	o.addChild(o.backBtn);
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
//game AI to Introduce items/aliens in the game
function gameAI(){
	//Game level Information
	this.levels = [
		/*0: min no of aliens, 1: max no if aliens, 2: kills for level up*/
		[1,1,1],		//Level 0
		[1,2,5],		//Level 1
		[1,3,5],		//Level 2
		[2,3,10],		//Level 3
		[1,4,20],		//Level 4
		[2,4,20],		//Level 5
		[3,4,20],		//Level 6
		[2,5,40], 	//Level 7
		[3,5,40],		//Level 8
		[4,5,40], 	//Level 9
		[5,6,40] 		//Level 10
	];
	//game state
	this.state = null;// 'play' 'end' 'pause'

	this.startTime = null;
	this.lastUpdAtime = null;
	this.lastUpdPtime = null;
	this.curr_level = null;
	this.scoreCtr = null;
	this.minAlien = null;
	this.maxAlien = null;
	this.alienToKill = null;

	//Time based motion
	this.t0 = null;
	this.t1 = null;
	this.dt = null;

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
	};

	this.setAlien = function(currTime){
		this.t1 = currTime;
		// this.dt = (currTime-this.t0)*(60/1000);
		this.dt = 1;

		// send aliens in the game
		if(currTime-this.lastUpdAtime >= 3000){
				var randomNo = randomInt(this.minAlien,this.maxAlien);
				for(var i = 0; i < randomNo; i++){
					setTimeout(function(){
						aliens.getAlien();
					},i*350);
				}
				this.lastUpdAtime =  currTime;
		}
		//Introduce the powerUps/items in the game
		if(currTime-this.lastUpdPtime >= 10000){
			if(itemGroup.children.length === 0){
				var item = imgr.getItem();
				item.visible= true;
				itemGroup.addChild(item);
				itemGroup.setPosition(g.canvas.width,bd.buildingHeight-bd.hGap*2);
				this.lastUpdPtime =  currTime;
			}
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
												};
			}
		}
	};
}
