function play(){
	//insert aliens in the game as per AI logic
	ai.setAlien(Date.now());

	//tiling sky background
	sky.tileX += 1;

	//Move the player by applying the new calculated velocity
	playerGroup.vy += contr.gravity;
	playerGroup.y += playerGroup.vy;

	if(itemGroup.children.length > 0)
		itemGroup.x -= contr.speed;

	if(itemGroup.x + itemGroup.width < 0 && itemGroup.children.length > 0){
		imgr.removeItem(itemGroup.children[0]);
	}

	blocks.children.forEach(function(building){
		building.x -= contr.speed;
		if(building.x <= 0-building.width-contr.speed){
			building.x = blocks.nextPos.X;
			building.y = blocks.nextPos.Y;
			building.height = g.canvas.height - blocks.nextPos.Y;
			//code to adjust the windows height and width
			var row= bd.row;
			var coloums= bd.columns;
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
		blocks.nextPos.Y=400 + randomInt(-30,30);

		building.cBox.x = building.x + building.width;
	});

	//move aliens
	aliens.activeAliens.forEach(function(alien){
			alien.y += alien.vy;
			alien.vy += contr.gravity;
			alien.vx += alien.accelerationX;
			alien.x += alien.vx;

		if((alien.x + alien.width) < 0	|| alien.y > g.canvas.height){
			aliens.freeAlien(alien);
		}
	});
	//Move the bullet
	bullets.activeBullets.forEach(function(bullet){
		bullet.x += bullet.vx;
		bullet.y += bullet.vy;
		if(bullet.x > g.canvas.width){
			bullets.freeBullet(bullet);
		}
	});

	if(playerGroup.item.type == "car"){
		car.start();
	}

	//check if player fell on the ground and stop the game loop
	if(playerGroup.y > g.canvas.height){
		topBar.update(-1);
		if(topBar.noLife > 0){
			playerGroup.setPosition(150,300);
			var _speed = contr.speed;
			contr.speed = 0;
			var fadeOutTweenPlayer = fadeOut(player.grp,20);
				fadeOutTweenPlayer.onComplete = function(){
													contr.speed = _speed;
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
			else if (colliPlayerBlock == "left" || colliPlayerBlock == "right") {
				playerGroup.isOnGround = false;
			}
		}

		//Check alien and collision with buildings //alien fall logic
		aliens.activeAliens.forEach(function(alien){
			if(alien.release == true){
				var rayCol = aliencBoxCol(alien,building.cBox,false,true);
				if(rayCol){
						alien.vx = -6;
				}
			}

			var colliAlienBlock = rectangleCollision(alien,building,false,true);
				if(colliAlienBlock == "bottom"){
					alien.isOnGround = true;
					alien.vy = 0;
					alien.accelerationX = 0;
					alien.vx = -contr.speed;
					alien.release = false;

					if(alien.act=="run"){
						alien.vx += -3;
						alien.walk();
					}
					else{
						alien.stand();
					}
					if(building.gx >= alien.x && alien.act=="run"){
						alien.vy = -contr.jumpForce;
						alien.vx += -2;
						alien.isOnGround = false;
						alien.jump();
					}
					building.y += -0.1;
					shake(building, 0.02, true);
				}
		});
	});

	// bullets and alien check collision
	aliens.activeAliens.forEach(function(alien){
		bullets.activeBullets.forEach(function(bullet){
		//Check for a collision with the alien
			var collision = hitTestRectangle(bullet.cBox, alien,true);
			if(collision){
				smokeEmitter(alien.centerX,alien.centerY,assets["smoke.png"]);
				//explosionSound();
				explosionSound.play();
				bullet.visible = false;
				score.update();
				aliens.freeAlien(alien);
			 	bullets.freeBullet(bullet);
			}
		});

		var playerAlienCollision = hitTestRectangle(playerGroup,alien,true);
		if(playerAlienCollision===true && alien.isUnderCol === false){
			alien.isUnderCol = true;
			if(player.grp.visible){
				topBar.update(-1);
				var fadeOutTweenPlayer = fadeOut(player.grp,10);
				fadeOutTweenPlayer.onComplete = function(){
													var fadeInTween = fadeIn(player.grp,20);
												};
			}
			if(playerGroup.item.type == "car"){
				alien.vx  = 10;
				aliens.freeAlien(alien);
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
					carSound.restart();
				}
				if(item.type == "heart" && item.visible){
					item.visible = false;
					topBar.update(1);
					pupSound.play();
				}
				// if(item.type == "mbox" && item.visible){
				// 	item.visible = false;
				// }
			}
		}
	});
}
