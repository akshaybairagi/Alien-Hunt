function play(){
	//variable for simulating time based physics
	var t1 = new Date().getTime(); // current time in milliseconds since midnight on 1 Jan 1970
	contr.dt = 0.001*(t1-contr.t0); // time elapsed in seconds since last call
	contr.t0 = t1; // reset t0

	//count the frames and set score
	contr.distance += 1;
	score.miles = contr.distance/15;
	score.update(score.miles);

	//tiling sky background
	sky.tileX += 1;

	//Move the player by applying the new calculated velocity
	playerGroup.vy += contr.gravity;
	playerGroup.y += playerGroup.vy*contr.dt;


	if(itemGroup.children.length > 0)
		itemGroup.x -= contr.speed*contr.dt;

	if(itemGroup.x + itemGroup.width < 0 && itemGroup.children.length > 0){
		imgr.removeItem(itemGroup.children[0]);
	}

	// Reset the building desgin for different look
	if(score.miles % 100 === 0){
		contr.design = designs[randomInt(0,3)];
		bd.resetBuildings(contr.design); //reset the building designs
	}
	//Introduce the powerUps/items in the game
	if(score.miles % 10 === 0 && itemGroup.children.length === 0){
		var item = imgr.getItem();
		item.visible= true;
		itemGroup.addChild(item);
		itemGroup.setPosition(g.canvas.width + randomInt(150,300),300);
	}

	blocks.children.forEach(function(building){
		building.x -= contr.speed*contr.dt;
		if(building.x <= 0-building.width-contr.speed){
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
	aliens.activeAliens.forEach(function(alien){
			alien.vy += contr.gravity;
			alien.y += alien.vy*contr.dt;
			alien.vx += alien.accelerationX;
			alien.x += alien.vx*contr.dt;
			if((alien.x < + alien.width) < 0	|| alien.y > g.canvas.height){
				aliens.freeAlien(alien);
			}
	});
	//Move the bullet
	bullets.activeBullets.forEach(function(bullet){
		bullet.x += bullet.vx*contr.dt;
		bullet.y += bullet.vy*contr.dt;
		if(bullet.x > g.canvas.width){
			bullets.freeBullet(bullet);
		}
	});

	if(playerGroup.item.type == "car"){
		car.start();
	}
	//insert aliens in the game every 120th frame
	if(contr.distance % 120 == 0){
		var alien = aliens.getAlien();
		alien.jump();
		if(randomInt(0,1)){
			alien.act = "run";
		}
		else{
			alien.act = "defend";
		}
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
		}

		//Check alien and collision with buildings
		aliens.activeAliens.forEach(function(alien){
			var colliAlienBlock = rectangleCollision(alien,building,false,true);
				if(colliAlienBlock == "bottom"){
					alien.isOnGround = true;
					alien.vy = 0;
					alien.vx = -contr.speed;

					if(alien.act=="run"){
						alien.vx += -200;
						alien.walk();
					}
					else{
						alien.stand();
					}
					if(building.gx >= alien.x){
						alien.vy = -contr.jumpForce;
						alien.vx += -2;
						alien.isOnGround = false;
						alien.jump();
					}
					building.y += -0.1;
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
				score.aliensKilled += 1;
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
				}
				if(item.type == "heart" && item.visible){
					item.visible = false;
					topBar.update(1);
				}
			}
		}
	});
}
