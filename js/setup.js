var g = game(800, 600, setup,
				[	"json/sticky.png",
					"json/hands.png",
					"json/alien.png",
					"json/alienHunter.json",
					"json/car.json",
					"sounds/shot.wav",
					"fonts/puzzler.otf"
				]
				,load
			);
//Start the engine
g.start();

//Scale and center the game
g.scaleToWindow();

//Optionally rescale the canvas if the browser window is changed
window.addEventListener("resize", function(event){
	g.scaleToWindow();
});

g.time = Date.now();
g.noOfFrame = 0;

//Global variables
var player,sky,ship,gun,mGun,bike,car;
//Global Arrays
var bullets = [],items = [],aliens = [];
//Global groups
var blocks,playerGroup,itemGroup;
//force of gravity/speed and jump force
var gravity = 5,speed = 20,jumpForce = 32;

//For activities to be performed while assets are loading
function load(){
	//Display the loading progress bar while the game
	progressBar.create(g.canvas, assets);
	progressBar.update();
}
function setup(){
	//Remove the progress bar
	progressBar.remove();

	//Sound and music
	shotSound = assets["sounds/shot.wav"];

	//Create the sprites
	//1. The 'titleScene' sprites
	//The play button
	playButton = button([
		assets["up.png"],
		assets["over.png"],
		assets["down.png"]
	]);

	//Set the 'playButton''s x property to 514 so that
	//it's offscreen when the sprite is created
	playButton.x = 514;
	playButton.y = 450;

	//Set the 'titleMessage' x position to -200 so that it's offscreen
	titleMessage = text("start game", "20px puzzler", "white", -200, 420);

	//Game title name
	gameTitle = text("Alien Hunter", "40px puzzler", "white", 100, 150);

	//Make the 'playButton' and 'titleMessage' slide in from the
	//edges of the screen using the 'slide' function
	slide(playButton, 420, 450, 30, ["decelerationCubed"]);
	slide(titleMessage, 420, 420, 30, ["decelerationCubed"]);

	frontBg = rectangle(g.canvas.width,g.canvas.height,"black","",1,0,0);

	//Create the 'titleScene' group
	titleScene = group([frontBg,playButton,titleMessage,gameTitle]);

 	//2. The 'gameScene' sprites
	//Make the sky background
	sky = getSkyBackground();

	//Add a black border along the top of the screen
	topBar = createTopBar();
	topBar.create();

	//make player and set initials
	player = makePlayer();
	player.walk();
	player.breath();

	//Power Ups
	gun = createGun();
	bike = createBike();
	car = createCar();
	mGun = createMGun();

	//Create Player Group as a container
	playerGroup = createPlayerGroup();

	//space ship sprites
	ship = createShip();

	//Create  buildings
	createBuildings();

	//Assign the key events
	keyHandler();

	//Add the game sprites to the 'gameScene' group
	gameScene = group([sky,topBar,ship,car,bike,mGun,blocks,itemGroup,playerGroup]);

	//Position the 'gameScene' offscreen at 814 so that its
	//not visible when the game starts
	gameScene.x = 814;

	playButton.press = function(){
		g.state = play;
		slide(titleScene, 814, 0, 30, ["decelerationCubed"]);
		slide(gameScene, 0, 0, 30, ["decelerationCubed"]);
	};
}
function keyHandler(){
	//fire the bullets with space key
	var space = keyboard(32);
	space.press = function(){
		if(playerGroup.item.type=="gun"){
			playerGroup.item.visible = true;
			player.shoot(gun);
		}
		if(playerGroup.item.type=="mg"){
			player.shoot(mGun);
		}
	};
	space.release = function(){
		if(playerGroup.item.type=="gun"){
			playerGroup.item.visible = false;
			player.walk();
		}
		if(playerGroup.item.type=="mg"){
			player.walk();
		}
	};
	//Jump the player with upArrow
	var upArrow = keyboard(38);
	upArrow.press = function(){
		if (playerGroup.isOnGround){
			playerGroup.isOnGround = false;
			playerGroup.vy = -jumpForce;
			player.jump();
		}
	};
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
			jumpSound();
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
		car.visible = false;
		stage.addChild(car);

		player.grp.visible = true;

		playerGroup.addChild(player.grp);
		playerGroup.addChild(gun);
		playerGroup.item = gun;
	}
	return car;// return a car object
}
function createAlien(){
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
	alien.isTouching = false;
	alien.setPosition(ship.centerX,ship.centerY);
	alien.state = "";

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

	aliens.push(alien);

	return alien;
}
function createItemCollector(X,Y,width){
	var itemNo = randomInt(1,4);
	var item;
	switch (itemNo) {
		case 1:
			item = sprite(assets["bike_snap.png"]);
			item.type = "bike";
			break;
		case 2:
			item = sprite(assets["heart.png"]);
			item.type = "heart";
			break;
		case 3:
			item = sprite(assets["mGun.png"]);
			item.type = "mg";
			break;
		case 4:
			item = sprite(assets["car_snap.png"]);
			item.type = "car";
			break;
		default:
			console.log("Error displaying items");
	}
	if (item !== undefined){
		item.setPosition(X + randomInt(width/2,width),Y - 130);
		items.push(item);
		return item;
	}
}
function createShip(){
	var ship = sprite(assets["spaceship.png"]);
	ship.setPosition(600,32);
	ship.rotation = -0.3;
	ship.startTime = Date.now();
	ship.lastUpdateTime = ship.startTime;
	return ship;
}
function createPlayerGroup(){
	var o = group([player.grp,gun]);
	o.isOnGround = false;
	o.building_id = "";
	o.item = gun;
	o.setPosition(150,300);
	return	o;
}
function createBike(){
	var bike = sprite(assets["bike.png"]);
	bike.type = "bike";
	bike.visible = false;
	bike.remove = function(){
		bike.visible = false;
		stage.addChild(bike);

		player.grp.visible = true;

		playerGroup.addChild(player.grp);
		playerGroup.addChild(gun);
		playerGroup.item = gun;
	}
	return bike;
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
	//Display the 'titleScene' and hide the 'gameScene'
	slide(titleScene, 0, 0, 30, ["decelerationCubed"]);
	slide(gameScene, 814, 0, 30, ["decelerationCubed"]);

	//remove game objects and references
	blocks.removeHierarchy(blocks.children);
	itemGroup.removeHierarchy(itemGroup.children);
	topBar.removeHierarchy(topBar.children);

	remove(aliens);

	items = [];
	bullets = [];
	aliens = [];

	gameScene.remove(itemGroup.children);

	//Assign a new button 'press' action to restart the game
	playButton.press = function(){
		restart();
	};
}

function restart(){
	sky = getSkyBackground();

	//Add a black border along the top of the screen
	topBar = createTopBar();
	topBar.create();

	//make player and set initials
	player = makePlayer();
	player.walk();
	player.breath();

	//Power Ups
	gun = createGun();
	bike = createBike();
	car = createCar();
	mGun = createMGun();

	//Create Player Group as a container
	playerGroup = createPlayerGroup();

	//space ship sprites
	ship = createShip();

	//Create  buildings
	createBuildings();

	//Add the game sprites to the 'gameScene' group
	gameScene = group([sky,topBar,ship,car,bike,mGun,blocks,itemGroup,playerGroup]);

	//Hide the titleScene and reveal the gameScene
	slide(titleScene, 814, 0, 30, ["decelerationCubed"]);
	slide(gameScene, 0, 0, 30, ["decelerationCubed"]);

	//Set the game state to 'play' and 'resume' the game
	g.state = play;
	g.resume();
}
function createBuildings(){
	//Create a 'group' for all the buildings
	blocks = group([]);
	itemGroup = group([]);

	//variables for building blocks
	var numOfBuilding = 100;
	var row=9;
	var coloums=13;
	var buildingWidth = 300;
	var buildingHeight;
	var nextPos = { X: 32, Y:400 };

	//Procedural Generation of buildings
	for (var k =0; k < numOfBuilding; k++){
		buildingHeight = g.canvas.height - nextPos.Y;

		var building =rectangle(buildingWidth,buildingHeight,"#black","grey",2,
								nextPos.X,nextPos.Y);
		building.id = k+1;

		if((k+1)%3 == 0){
			var item = createItemCollector(nextPos.X,nextPos.Y,buildingWidth);
			itemGroup.addChild(item);
		}

		nextPos.X=building.x + randomInt(350,400);
		nextPos.Y=400 + randomInt(-50,50);

		var width = building.width /row;
		var height = building.height/coloums;

		for(var i = 0; i < coloums; i++) {
			for(var j = 0; j < row; j++){
				if ( j % 2 !== 0 && i % 2 !== 0){
					//create the windows
					var window = rectangle(width,height,"grey","black",1);
					window.x = width*j;
					window.y = height*i;
					building.addChild(window);
				}
			}
		}
		blocks.addChild(building);
	}
}
function createTopBar(){
	var o = group([]);
	o.life = 3;

	o.create = function(){
		for (i = 0; i < o.life; i++){
			o.addChild(sprite(assets["life.png"],11*i,5));
		}
	};

	o.update = function(lifeCounter){
		o.life += lifeCounter;
		if(o.life >= 1){
			o.remove(o.children);
			o.create();
		}
		else{
			playerGroup.vy = 0;
			player.stop();
			g.pause();
			setTimeout(end,1000);
		}
	};
	return o;
}
function getSkyBackground(){
		return tilingSprite(g.canvas.width,g.canvas.height,assets["snow.png"]);
}
