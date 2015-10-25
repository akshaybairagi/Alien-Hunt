function ItemManager(){
  this.items = [],

  this.initItems = function(){
    this.car_snap = sprite(assets["car_snap.png"]);
    this.car_snap.type = "car";
    this.car_snap.visible = false;
    
    this.life = sprite(assets["heart.png"]);
    this.life.type = "heart";
    this.life.visible = false;
    gameScene.addChild(this.car_snap);
    gameScene.addChild(this.life);
  },
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
  }
}
//A higher level wrapper for items
function itemManager() {
	var imgr = new ItemManager();
	return imgr;
}
