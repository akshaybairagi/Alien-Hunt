function smokeEmitter(x,y,source){
	particleEffect(
		x, //The particle's starting x position
		y, //The particle's starting y position
		function () { return sprite(source); },
		20, //Number of particles
		0, //Gravity
		true, //Random spacing
		2.4, 3.6, //Min/max angle
		1, 10, //Min/max size
		0.1, 2, //Min/max speed
		0.005, 0.01, //Min/max scale speed
		0.005, 0.01, //Min/max alpha speed
		0, 0 //Min/max rotation speed
	);
}
function fire(shooter){
	shootBullets(shooter, shooter.rotation, 0, 65, bullets,
				function(){ 
					return rectangle(15,4, "black"); 
				}
			);
	shotSound.play();
}
function shootBullets(shooter,angle,offsetFromCenter,bulletSpeed,bulletArray,bulletSprite){
	//Make a new sprite using the user-supplied `bulletSprite` function
	var bullet = bulletSprite();
	bullet.rotation = shooter.rotation;

	//Set the bullet's start point
	bullet.x= (shooter.gx + shooter.width) - bullet.halfWidth + (offsetFromCenter * Math.cos(angle));
	bullet.y= shooter.gy  - bullet.halfHeight + (offsetFromCenter * Math.sin(angle));
	//Set the bullet's velocity
	bullet.vx = Math.cos(angle) * bulletSpeed;
	bullet.vy = Math.sin(angle) * bulletSpeed;
	
	var cBox = rectangle(60,2,"red","red",1)
	bullet.addChild(cBox);
	bullet.cBox = cBox;
	cBox.visible = false;
	
	//Push the bullet into the`bulletArray`
	bulletArray.push(bullet);
}

