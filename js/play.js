function play(){
	//count the frames
	g.noOfFrame += 1;
	//tiling sky background
	sky.tileX += 5;
	//buildings blocks in the game world
	blocks.x -= speed;
	itemGroup.x -= speed;
	//Apply gravity to the vertical velocity
	//Move the player by applying the new calculated velocity
	playerGroup.vy += gravity;
	playerGroup.y += playerGroup.vy;

	//move aliens
	aliens = aliens.filter(function(alien){
		alien.vy += gravity;
		alien.y += alien.vy;
		alien.vx += alien.accelerationX;
		alien.x += alien.vx;

		if(alien.visible == false ){
			return false;
		}
		return true;
	});
	//Move the bullet
	bullets = bullets.filter(function(bullet){
		bullet.x += bullet.vx;
		bullet.y += bullet.vy;
		if(bullet.x > g.canvas.width) return false;

		return true;
	});

	if(playerGroup.item.type == "car"){
		car.start();
	}
	//insert aliens in the game every 120th frame
	if (g.noOfFrame % 30 == 0){
		var alien = createAlien();
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
	blocks.children.forEach(function(block){
		//Check players and block collision (buildings)
		var colliPlayerBlock = rectangleCollision(playerGroup,block,false,true);
		if(colliPlayerBlock){
			if(colliPlayerBlock == "bottom"){
				playerGroup.isOnGround = true;
				playerGroup.building_id = block.id;
				playerGroup.vy = 0;
				if(player.state == "jump")	player.walk();
			}
		}

		//Check alien and collision with buildings
		aliens.forEach(function(alien){
			var colliAlienBlock = rectangleCollision(alien,block,false,true);
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

					shake(block, 3.5, false);
					block.vy = -0.3;

					if(block.gx >= alien.x){
						alien.vy = -jumpForce;
						alien.vx += -2;
						alien.isOnGround = false;
						alien.jump();
					}
				}
		});
	});

	// bullets and alien check collision
	aliens.forEach(function(alien){
		bullets = bullets.filter(function(bullet){
		//Check for a collision with the alien
			var collision = hitTestRectangle(bullet.cBox, alien,true);
			if(collision){
				smokeEmitter(bullet.x,bullet.y,assets["smoke.png"]);
				explosionSound();
				bullet.visible = false;
				alien.visible = false;
				return false;
			}
			return true;
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
													alien.visible = false;
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
