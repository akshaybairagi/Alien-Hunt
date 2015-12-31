function play(){
	//insert aliens in the game as per AI logic
	ai.setAlien(Date.now());

	//tiling sky background
	sky.tileX += 1;

	//Move the player by applying the new calculated velocity
	if(playerGroup.building_index===undefined){
		playerGroup.vy += contr.gravity;
		playerGroup.y += playerGroup.vy*ai.dt;
	}

	if(itemGroup.children.length > 0){
			itemGroup.x -= contr.speed*ai.dt;
			if(itemGroup.x + itemGroup.width < 0){
				imgr.removeItem(itemGroup.children[0]);
			}
	}
	//move buildings
	blocks.children.forEach(function(building){
		building.x -= contr.speed*ai.dt;
		if(building.x <= 0-building.width-contr.speed){
			building.x = blocks.nextPos.X;
			building.y = blocks.nextPos.Y;
			building.shake = false;
			//insert item
			ai.getItem(ai.t1,building);
		}
		blocks.nextPos.X=building.x + building.width + randomInt(bd.strtGap,bd.endGap);
		blocks.nextPos.Y=bd.buildingHeight + randomInt(-bd.hGap,bd.hGap);
		building.cBox.x = building.x + building.width;
	});

	//move aliens
	aliens.activeAliens.forEach(function(alien){
			alien.vy += contr.gravity;
			alien.y += alien.vy*ai.dt;
			alien.vx += alien.accelerationX;
			alien.x += alien.vx*ai.dt;

		if((alien.x + alien.width) < 0	|| alien.y > g.canvas.height){
			aliens.freeAlien(alien);
		}
	});
	//Move the bullet
	bullets.activeBullets.forEach(function(bullet){
		bullet.x += bullet.vx*ai.dt;
		bullet.y += bullet.vy*ai.dt;
		if(bullet.x > g.canvas.width){
			bullets.freeBullet(bullet);
		}
	});
//rotate car wheels
	if(playerGroup.item.type == "car"){
		car.start();
	}

	//check if player fell on the ground and stop the game loop
	if(playerGroup.y > g.canvas.height || playerGroup.x < 0){
		topBar.update(-1);
		if(topBar.noLife > 0){
			//remove car
			if(playerGroup.item!==gun){
				car.remove();
			}
			playerGroup.setPosition((g.canvas.width*.36)/2,g.canvas.height/2);
			playerGroup.building_index = undefined;
			g.pause();
			var fadeOutTweenPlayer = fadeOut(player.grp,20);
				fadeOutTweenPlayer.onComplete = function(){
													fadeIn(player.grp,50);
													//resume the game
													g.resume();
													//reset the time for motion
													ai.t0 = Date.now();
													fadeOutTweenPlayer = null;
												};
		}
		else{
			return;
		}
	}

//check player and building collision
	if(playerGroup.building_index===undefined){
			playerGroup.checkColl = true;
	}
	else{
		var building = blocks.children[playerGroup.building_index];
		if((building.gx+building.width)< (playerGroup.gx+playerGroup.width)){
			//check collision
			playerGroup.checkColl = true;
			playerGroup.building_index = undefined;
		}
		else{
			playerGroup.checkColl = false;
		}
		building = null;
	}
	if(playerGroup.checkColl){
		blocks.children.forEach(function(building){
			//Check players and block collision (buildings)
			var colliPlayerBlock = rectangleCollision(playerGroup,building,false,true);
			if(colliPlayerBlock){
				if(colliPlayerBlock == "bottom"){
					playerGroup.isOnGround = true;
					playerGroup.building_index = blocks.children.indexOf(building);
					playerGroup.vy = 0;
					if(player.state == "jump"){
						player.walk();
					}
				}
				else if (colliPlayerBlock == "left" || colliPlayerBlock == "right") {
					playerGroup.isOnGround = false;
					playerGroup.building_index = undefined;
				}
			}
			colliPlayerBlock = null;
		});
	}

	//Check collision for various objects
	blocks.children.forEach(function(building){
		//Check alien and collision with buildings //alien fall logic
		aliens.activeAliens.forEach(function(alien){
			if(alien.release == true){
				if(aliencBoxCol(alien,building.cBox,false,true)){
						alien.vx = -7;//randomInt(5,7);
						alien.act="run";
					}
			}
			//opitmization change putting alien.isOnGround==false in condi. removed
				if(rectangleCollision(alien,building,false,true) == "bottom"){
					alien.isOnGround = true;
					alien.vy = 0;
					alien.accelerationX = 0;
					alien.vx = -contr.speed*ai.dt;
					alien.release = false;

					if(alien.act=="run"){
						alien.vx += -3*ai.dt;
						alien.walk();
					}
					else{
						alien.stand();
					}
					if(building.gx >= alien.x && alien.act=="run" && alien.canJump){
						alien.vy = -contr.jumpForce;
						alien.vx += -2*ai.dt;
						alien.isOnGround = false;
						alien.jump();
					}
					// building.y += -0.05;
					//shake the building only once
					if(building.shake === false){
						// shake(building, 0.02, true,120);
						building.shake = true;
					}
				}
		});
	});

	// bullets and alien check collision
	aliens.activeAliens.forEach(function(alien){
		bullets.activeBullets.forEach(function(bullet){
		//Check for a collision with the alien
			if(hitTestRectangle(bullet.cBox, alien,true)){
				if(g.mobile === false){
					smokeEmitter(alien.centerX,alien.centerY,assets["smoke.png"]);
				}
				sBox.play(sBox.explosionSound);
				bullet.visible = false;
				score.update();
				aliens.freeAlien(alien);
			 	bullets.freeBullet(bullet);
			}
		});

		// var playerAlienCollision = hitTestRectangle(playerGroup,alien,true);
		if(hitTestRectangle(playerGroup,alien,true)===true && alien.isUnderCol === false){
			alien.isUnderCol = true;
			if(player.grp.visible){
				topBar.update(-1);
				if(topBar.noLife > 0){
					var fadeOutTweenPlayer = fadeOut(player.grp,10);
					fadeOutTweenPlayer.onComplete = function(){
														fadeIn(player.grp,20);
														fadeOutTweenPlayer = null;
												};
				}
				else{
					return;
				}
			}
			if(playerGroup.item.type == "car"){
				alien.vx  = 10;
				score.update();
				aliens.freeAlien(alien);
			}
		}
	});
	//handle the collision with items
	itemGroup.children.forEach(function(item){
		if(playerGroup.item.type == "gun" && itemGroup.children.length){
			if(rectangleCollision(item,playerGroup,false,true)){
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
					playerGroup.building_index = undefined;
					setTimeout(car.remove,8000);
					sBox.restart(sBox.carSound);
				}
				if(item.type == "heart" && item.visible){
					item.visible = false;
					topBar.update(1);
					sBox.play(sBox.pupSound);
				}
			}
		}
	});
	//Assign current time equal to last update time for time based motion
	ai.t0 = ai.t1;
}
