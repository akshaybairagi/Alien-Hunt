function play(){
	//count the frames
	g.noOfFrame += 1;
	//tiling sky background
	sky.tileX += 1;
	//buildings blocks in the game world
	itemGroup.x -= speed;

	//Apply gravity to the vertical velocity
	//Move the player by applying the new calculated velocity
	playerGroup.vy += gravity;
	playerGroup.y += playerGroup.vy;

	blocks.children.forEach(function(building){
		building.x -= speed;
		if(building.x <= 0-building.width-speed){
			building.x = blocks.nextPos.X;
			building.y = blocks.nextPos.Y;
			building.height = g.canvas.height - blocks.nextPos.Y;

			//code to adjust the windows heigh and width
			var row=9;
			var coloums=13;
			var width = building.width /row;
			var height = building.height/coloums;
			building.children.forEach(function(window){
						//update the windows
						window.x = width*window.j;
						window.y = height*window.i;
						window.width =width;
						window.height = height;
			});
		}
		blocks.nextPos.X=building.x + building.width + randomInt(50,100);
		blocks.nextPos.Y=400 + randomInt(-50,50);
	});

	//move aliens
	activeAliens.forEach(function(alien){
			alien.vy += gravity;
			alien.y += alien.vy;
			alien.vx += alien.accelerationX;
			alien.x += alien.vx;
			if((alien.x < + alien.width) < 0	|| alien.y > g.canvas.height){
				freeAlien(alien);
			}
	});
	//Move the bullet
	activeBullets.forEach(function(bullet){
		// body...
		bullet.x += bullet.vx;
		bullet.y += bullet.vy;
		if(bullet.x > g.canvas.width){
			freeBullet(bullet);
		}
	});

	if(playerGroup.item.type == "car"){
		car.start();
	}
	//insert aliens in the game every 120th frame
	if (g.noOfFrame % 30 == 0){
		var alien = getAlien();
		alien.jump();
		if(randomInt(0,1)){
			alien.act = "run";
		}
		else {
			alien.act = "defend";
		}
	}
	//check if player fell on the ground and stop the game loop
	if(playerGroup.y > g.canvas.height){
		topBar.update(-1);
		if(topBar.life > 0){
			playerGroup.setPosition(150,300);
			speed = 0;
			var fadeOutTweenPlayer = fadeOut(player.grp,20);
				fadeOutTweenPlayer.onComplete = function(){speed = 20;
													var fadeInTween = fadeIn(player.grp,50);
												};
		}
	}
	//Check collision for various objects
	blocks.children.forEach(function(building){
		//Check players and block collision (buildings)
		var colliPlayerBlock = rectangleCollision(playerGroup,building,false,true);
		if(colliPlayerBlock){
			if(colliPlayerBlock == "bottom"){
				playerGroup.isOnGround = true;
				playerGroup.building_id = building.id;
				playerGroup.vy = 0;
				if(player.state == "jump")	player.walk();
			}
		}

		//Check alien and collision with buildings
		activeAliens.forEach(function(alien){
			var colliAlienBlock = rectangleCollision(alien,building,false,true);
				if(colliAlienBlock == "bottom"){
					alien.isOnGround = true;
					alien.vy = 0;
					alien.vx = -speed;

					if(alien.act=="run"){
						alien.vx += -10;
						alien.walk();
					}
					else{
						alien.stand();
					}
					if(building.gx >= alien.x){
						alien.vy = -jumpForce;
						alien.vx += -2;
						alien.isOnGround = false;
						alien.jump();
					}
					building.y += -1;
					//shake(block,5, false);
				}
		});
	});

	// bullets and alien check collision
	activeAliens.forEach(function(alien){
		activeBullets.forEach(function(bullet){
		//Check for a collision with the alien
			var collision = hitTestRectangle(bullet.cBox, alien,true);
			if(collision){
				smokeEmitter(bullet.x,bullet.y,assets["smoke.png"]);
				explosionSound();
				bullet.visible = false;
				freeAlien(alien);
			 	freeBullet(bullet);
			}
		});

		var playerAlienCollision = hitTestRectangle(playerGroup,alien);
		if(playerAlienCollision && alien.isTouching === false){
			alien.isTouching = true;
			if(player.grp.visible){
				topBar.update(-1);
				var fadeOutTweenPlayer = fadeOut(player.grp,10);
				fadeOutTweenPlayer.onComplete = function(){
													var fadeInTween = fadeIn(player.grp,20);
												};
			}
			if(playerGroup.item.type == "car"){
				alien.vx  = 10;
				var fadeOutTweenAlien = fadeOut(alien,30);
				fadeOutTweenAlien.onComplete = function(){
													freeAlien(alien);
												};
			}
		}
	});

	//handle the collision with items
	itemGroup.children.forEach(function(item){
		if(playerGroup.item.type == "gun"){
			var collision = rectangleCollision(item,playerGroup,false,true);
			if(collision){
				if(item.type == "car"){
					player.grp.visible = false;
					gun.visible = false;
					item.visible = false;
					remove(item);
					stage.addChild(player.grp);
					stage.addChild(gun);

					car.visible = true;
					car.setPosition(0,0);
					playerGroup.addChild(car);

					playerGroup.item = car;
					setTimeout(car.remove,5000);
				}
				if(item.type == "heart" && item.visible){
					item.visible = false;
					topBar.update(1);
				}
				if(item.type == "bike"){
					player.grp.visible = false;
					gun.visible = false;
					item.visible = false;
					stage.addChild(player.grp);
					stage.addChild(gun);

					bike.visible = true;
					bike.setPosition(0,0);
					playerGroup.addChild(bike);

					playerGroup.item = bike;
					setTimeout(bike.remove,5000);
				}
				if(item.type == "mg"){
					gun.visible = false;
					item.visible = false;
					stage.addChild(gun);

					mGun.visible = true;
					mGun.setPosition(7,22);
					playerGroup.addChild(mGun);

					playerGroup.item = mGun;
					setTimeout(mGun.remove,5000);
				}
			}
		}
	});
}
