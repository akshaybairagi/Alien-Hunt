function smokeEmitter(x,y,source){
	particleEffect(
		x, //The particle's starting x position
		y, //The particle's starting y position
		function () { return sprite(source); },
		5, //Number of particles
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
	bullets.getBullet(shooter,0,contr.bulletSpeed);
	shotSound.play();
}
function Bullet(){
	//bullet Pool and active Pool
	this.bulletPool = [];
	this.activeBullets=[];

	this.createBullet = function(){
		//Make a new sprite using the user-supplied 'bulletSprite' function
		var bullet = 	rectangle(15,4, "black");
		var cBox = rectangle(60,2,"red","red",1)
		bullet.addChild(cBox);
		bullet.cBox = cBox;
		cBox.visible = false;
		gameScene.addChild(bullet);
		return bullet;
	};

	this.getBullet = function(shooter,offsetFromCenter,bulletSpeed){
		var bullet = null;
		if(this.bulletPool.length > 0){
			bullet = this.bulletPool.pop();
		}
		else{
			bullet = this.createBullet();
		}
		bullet.rotation = shooter.rotation;
		//Set the bullet's start point
		bullet.x= (shooter.gx + shooter.width) - bullet.halfWidth + (offsetFromCenter * Math.cos(shooter.rotation));
		bullet.y= shooter.gy  - bullet.halfHeight + (offsetFromCenter * Math.sin(shooter.rotation));
		//Set the bullet's velocity
		bullet.vx = Math.cos(shooter.rotation) * bulletSpeed;
		bullet.vy = Math.sin(shooter.rotation) * bulletSpeed;
		bullet.visible = true;
		this.activeBullets.push(bullet);
	};

	this.freeBullet = function(bullet){
		bullet.visible = false;
		this.activeBullets.splice(this.activeBullets.indexOf(bullet), 1);
		// return the bullet back into the pool
		this.bulletPool.push(bullet);
	};
}
