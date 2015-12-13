//parse websocket message
function buildmessage(data){
  

  //CIRCLE, POLYGON, DEAD, BULLET, GARBAGE
  var ship_attrs = ['type','id','x','y','angle','energy','isbot','isdamaged','name','points','group','power'];
  var star_attrs = ['type','id','x','y','radius','range','group'];
  var base_attrs = ['type','id','x','y','radius','energy'];

  var data_types = [ 
    {
      name: 'circle',
      len:12,
      attrs:ship_attrs
    },
    { 
      name: 'polygon',
      len:12,
      attrs:ship_attrs
    },
    {
      name: 'dead',
      len:12,
      attrs:ship_attrs
    },
    {
      name:'bullet',
      len:6,
      attrs:['type','id','x','y','angle','color']
    },
    {  
      name: 'sun',
      len:star_attrs.length ,
      attrs: star_attrs
    },
    {   
      name: 'edge',
      len:0,
      attrs:[]
    },
    {   
      name: 'rank',
      len:31,
      attrs:[]
    },
    {   
      name: 'base',
      len: base_attrs.length,
      attrs: base_attrs
    },
    {   
      name: 'star_capture_bullet',
      len:6,
      attrs:['type','id','x','y','angle','color']
    },
    {   
      name: 'chase_bullet',
      len:6,
      attrs:['type','id','x','y','angle','color']
    }
  ];

  var parseRank = function(r_data){
    var rank = [];
    //console.log(r_data);
    for(var z=1;z<r_data.length;z+=3){
      rank.push({id:r_data[z],name:r_data[z+1],points:r_data[z+2]}); 
    }
    return rank
  }

  var parseEntity = function(type,data,attrs){
    //console.log("parseEntity");
    //console.log(type);
    //console.log(data);
    //console.log(attrs);
    if(data_types[type].name == 'rank')
      return parseRank(data);
    
    var entity = {}
    for(var i in data){
      if(attrs[i] == 'type'){
        entity[attrs[i]] = data_types[type].name;  
        continue;
      }
      entity[attrs[i]] = data[i];
    }
    //console.log(entity);
    return entity;
  }

  var entities = [];
  var rank = null;
  var totalbots = data.shift();
  var totalplayers = data.shift();
  var type_of_player = data[0];
  var player = parseEntity(type_of_player,data.splice(0,data_types[type_of_player].len),data_types[type_of_player].attrs);

  var i = 0;

  while(i < data.length){

    var type = data[i];
    var subdata = data.slice(i,i+data_types[type].len)
    //console.log("subdata:");
    //console.log(subdata);
    i+=data_types[type].len;
    var entity = parseEntity(type,subdata,data_types[type].attrs)

    switch(data_types[type].name) {
        case 'rank':
            rank = entity;  
            break;
        default:
          entities.push(entity);
    }
  }


  gamestate = {}
  if(rank) gamestate.rank = rank;
  gamestate.player = player;
  gamestate.entities = entities;
  gamestate.totalbots = totalbots;
  gamestate.totalplayers = totalplayers; 
  return gamestate;
}


  
//coordenate.js transform coordenates from game to pixels  
var CoordenateTranform = function(refpoint,scale,maxwidth,maxheight){
  this.scale = scale;
  this.maxwidth = maxwidth;
  this.maxheight = maxheight;
  this.refpoint = refpoint;
}

CoordenateTranform.prototype.norm  = function(point){
    return {  'x': point != null ? Number(point.x) : 0,
              'y': point != null ? Number(point.y) : 0
    }
}

CoordenateTranform.prototype.X = function(x){
    return ((x-this.norm(this.refpoint).x)*this.scale)+this.maxwidth/2 ;
}

CoordenateTranform.prototype.Y = function(y){
    return ((-y+this.norm(this.refpoint).y)*this.scale)+this.maxheight/2;
}

CoordenateTranform.prototype.unX = function(x){
    return (x - this.maxwidth/2)/this.scale + this.norm(this.refpoint).x 
}

CoordenateTranform.prototype.unY = function(y){
    return (-y+this.maxheight/2)/this.scale +this.norm(this.refpoint).y 
}

CoordenateTranform.prototype.unPoint = function(point){
    return {x:this.unX(point.x),y:this.unY(point.y)}
}

CoordenateTranform.prototype.point = function(point){
	return {x:this.X(point.x),y:this.Y(point.y)}
}


//render.js deals with rendering the objets
var GameRenderer = function(objects,stage){
  this.objectsOnStage = objects;
  this.circleShipRender = new CircleShipRender(stage);
  this.polygonShipRender = new PolygonShipRender(stage);
  this.sunRender = new SunRender(stage);
  this.baseRender = new BaseRender(stage);
  this.bulletRender = new BulletRender(stage);
  this.stage = stage;
}

  // create ship texture
GameRenderer.prototype.addToStage = function(update,coordenate,radarCoordenate,player){

    var objectRender;
    if(update.type == "circle"){
      objectRender = this.circleShipRender;
    }else if(update.type == "polygon"){
      objectRender = this.polygonShipRender;
    } else if(update.type == "bullet" || update.type == "star_capture_bullet" || update.type == "chase_bullet"){
      console.log(update.type);
      objectRender = this.bulletRender;
    }else if(update.type == "sun"){
      objectRender = this.sunRender;
    }else if(update.type == "base"){
      objectRender = this.baseRender;
    }

    if(!this.objectsOnStage[update.id]){
      this.objectsOnStage[update.id] = objectRender.createEntity(update,coordenate);
    }

    objectRender.update(this.objectsOnStage[update.id],update,coordenate,radarCoordenate,player);

}

GameRenderer.prototype.removeFromStage = function(index){
    
	this.stage.removeChild(this.objectsOnStage[index].sprite)
	this.objectsOnStage[index].sprite = null;

	if(this.objectsOnStage[index].radarpoint){
	  this.stage.removeChild(this.objectsOnStage[index].name)
	  this.objectsOnStage[index].name = null;
	}

	if(this.objectsOnStage[index].radarpoint)
	  document.getElementById('radar').removeChild(this.objectsOnStage[index].radarpoint);

	if(this.objectsOnStage[index].energybar)
	  this.stage.removeChild(this.objectsOnStage[index].energybar)

	if(this.objectsOnStage[index].body)
	  this.stage.removeChild(this.objectsOnStage[index].body)

	if(this.objectsOnStage[index].territory)
	  this.stage.removeChild(this.objectsOnStage[index].territory)

	delete this.objectsOnStage[index];

}

var BaseRender = function(stage){
  this.stage = stage;
}

BaseRender.prototype.createEntity = function(base,coordenate){
    var entity = {};
    
    entity.body = new PIXI.Graphics();
    //entity.body.beginFill(0xffd900);
    entity.body.lineStyle(2, 0xffd900, 1);
    entity.body.drawCircle(0,0,base.radius * coordenate.scale);
    entity.body.endFill();
    this.stage.addChild(entity.body);


    entity.energybar = new PIXI.Graphics();
    entity.energybar.beginFill(0xffd900);
    entity.energybar.drawRect(0,0,10,5);
    entity.energybar.endFill();

    this.stage.addChild(entity.energybar);
    this.stage.addChild(entity.body);
    return entity;
}

BaseRender.prototype.update = function(entity,base,coordenate,radarCoordenate){

  
  entity.body.position.x = coordenate.X(Number(base.x));
  entity.body.position.y = coordenate.Y(Number(base.y)) ;

  entity.energybar.position.x  = entity.body.position.x - entity.energybar.width * 0.5;
  entity.energybar.position.y  = entity.body.position.y ;
  
  if(entity.energybar.width != base.energy){
    entity.energybar.width = base.energy/100 * 300 ;
  }
  
}


var SunRender = function(stage){
  this.stage = stage;
  this.texture = PIXI.Texture.fromImage('nicestar.png')
  
}

SunRender.prototype.createEntity = function(sun,coordenate){
    var entity = {};
    this.basicCreate(entity,sun,coordenate);
    
    //this.stage.addChild(entity.body);
    this.stage.addChild(entity.sprite);
    this.stage.addChild(entity.territory);

    return entity;
}
SunRender.prototype.basicCreate = function(entity,sun,coordenate){

    /*entity.body = new PIXI.Graphics();
    entity.body.beginFill(sun.group,0.7);
    entity.body.lineStyle(2, sun.group, 1);
    entity.body.drawCircle(0,0,sun.radius * coordenate.scale);
    entity.body.endFill();*/

    entity.sprite = new PIXI.Sprite(this.texture);
    //entity.sprite.tint = sun.group;
    entity.sprite.anchor.x = 0.5;
    entity.sprite.anchor.y = 0.5;
    entity.sprite.width = entity.sprite.height = 2 * sun.radius * coordenate.scale * 1.8; //glow

    entity.territory = new PIXI.Graphics();
    entity.territory.beginFill(sun.group,0.2);
    entity.territory.drawCircle(0,0,sun.range * coordenate.scale);
    entity.territory.endFill();
    entity.group = sun.group;

}

SunRender.prototype.changeSunGroup = function(entity,sun,coordenate){
  this.stage.removeChild(entity.territory);
  //this.stage.removeChild(entity.body);
  this.stage.removeChild(entity.sprite);

  this.basicCreate(entity,sun,coordenate);
    
  //this.stage.addChild(entity.body);
  this.stage.addChild(entity.territory);
  this.stage.addChild(entity.sprite);
}

SunRender.prototype.update = function(entity,sun,coordenate,radarCoordenate){
  if(entity.group != sun.group){
    this.changeSunGroup(entity,sun,coordenate);
    //console.log(entity.group);
    //  console.log(sun.group);
  }
  
  //var body = entity.body;
  var territory = entity.territory;
  var sprite = entity.sprite;
  //console.log(sprite);
  //body.position.x = coordenate.X(Number(sun.x));
  //body.position.y = coordenate.Y(Number(sun.y)) ;
  territory.position.x = coordenate.X(Number(sun.x));
  territory.position.y = coordenate.Y(Number(sun.y)); 
  sprite.position.x = territory.position.x;
  sprite.position.y = territory.position.y; 
  entity.group = sun.group;
}

var BulletRender = function(stage){
  this.stage = stage;
  this.textures = {
    particle : PIXI.Texture.fromImage('particle.png')
  }
}

BulletRender.prototype.createEntity = function(bullet,coordenate){
    var entity = {}
    var emitter = {
        "alpha": {
          "start": 0.62,
          "end": 0
        },
        "scale": {
          "start": 0.75,
          "end": 0.25
        },
        "color": {
          "start": "#444444",
          "end": "#444444"
        },
        "speed": {
          "start": 500,
          "end": 500
        },
        "startRotation": {
        "min": 89,
        "max": 91
        },
        "rotationSpeed": {
          "min": 50,
          "max": 50
        },
        "lifetime": {
          "min": 0.1,
          "max": 0.1
        },
        "blendMode": "normal",
        "frequency": 0.02,
        "emitterLifetime": -1,
        "maxParticles": 100,
        "pos": {
          "x": 0,
          "y": 0
        },
        "addAtBack": false,
        "spawnType": "circle",
        "spawnCircle": {
          "x": 0,
          "y": 0,
          "r": 0
        }
      }

    var container = new PIXI.Container();

    if(bullet.type == "star_capture_bullet"){
      emitter.scale.end = 5.0;
    }

    if(bullet.type == "chase_bullet"){
      emitter.lifetime.max = 0.3;
      emitter.speed.start = 0;
      emitter.speed.end = 0;
    }
    emitter.color.end = emitter.color.start = bullet.color;
    entity.emitter = new cloudkid.Emitter(
      container,
      this.textures.particle,
      emitter
    );
    entity.emitter.emit = true;
    entity.sprite = container;
    entity.lastupdate = Date.now();

    this.stage.addChild(entity.sprite);

    return entity;
}

BulletRender.prototype.update = function(entity,bullet,coordenate,radarCoordenate){
  var sprite = entity.sprite;
  sprite.position.x = coordenate.X(Number(bullet.x));
  sprite.position.y = coordenate.Y(Number(bullet.y)) ;
  sprite.rotation = -Number(bullet.angle)+ Math.PI/2;
  var now = Date.now();
  entity.emitter.update((now - entity.lastupdate) * 0.001)
  entity.lastupdate = now;
}

var BasicShipRender = function(){}

BasicShipRender.prototype.createRadarPoint = function(){
  var radarpoint = document.createElement("div");
  radarpoint.className = 'circle';
  document.getElementById('radar').appendChild(radarpoint);
  return radarpoint;
}

BasicShipRender.prototype.setPositionInRadar = function(radarpoint,ship,radarCoordenate){
  var radarContainer = document.getElementById('radar');
  radarpoint.style.top = radarCoordenate.Y(Number(ship.y));
  radarpoint.style.left = radarCoordenate.X(Number(ship.x));
} 

var CircleShipRender = function(stage){
  this.stage = stage;
  this.tints = {
    bot: 0x00b300,
    damage: 0xe18410,
    normal: 0x000099
  }
}

CircleShipRender.prototype = new BasicShipRender();

CircleShipRender.prototype.createEntity = function(ship,coordenate){
    var entity = {};

    var sprite = new PIXI.Sprite(PIXI.Texture.fromImage('no-color3.png')) ;
    sprite.tint = ship.group;
    sprite.anchor.x = 0.5;
    sprite.anchor.y = 0.5;
    sprite.width = sprite.height = 4 * coordenate.scale;

    entity.sprite = sprite;
    entity.radarpoint = this.createRadarPoint();
    this.stage.addChild(entity.sprite);

    if(!ship.isbot){
      entity.name = new PIXI.Text("", {font:"12px Arial", fill:"green"});
      entity.name.anchor.x = 0.0;
      entity.name.anchor.y = 0.5;
      this.stage.addChild(entity.name);
    }

    entity.energybar = new PIXI.Graphics();
    entity.energybar.beginFill(0xffd900);
    //entity.energybar.lineStyle(2, 0xffd900, 1);
    entity.energybar.drawRect(0,0,100,5);
    entity.energybar.endFill();
    this.stage.addChild(entity.energybar);

    return entity;
}

CircleShipRender.prototype.update = function(entity,ship,coordenate,radarCoordenate){
  var sprite = entity.sprite;
  sprite.position.x = coordenate.X(Number(ship.x));
  sprite.position.y = coordenate.Y(Number(ship.y)) ;
  sprite.rotation = -Number(ship.angle)+ Math.PI/2;

  entity.energybar.position.x  = sprite.position.x;
  entity.energybar.position.y  = sprite.position.y - sprite.height*0.75;
  
  if(entity.energybar.width != ship.energy){
    entity.energybar.width = ship.energy;
  }
  
  if(ship){
    if(!ship.isbot){
      entity.name.position.x = sprite.position.x;
      entity.name.position.y = sprite.position.y - sprite.height*0.85;

      var name = ship.points +" points "+ (ship.name ? " " + ship.name : "") 

      if(name != entity.name.text){
        entity.name.text = name;
      }
    }

    if(sprite.tint != this.tints.damage && ship.isdamaged){
      sprite.tint = this.tints.damage;
    }
    
    if(sprite.tint == this.tints.damage && !ship.isdamaged){  
      sprite.tint = ship.group;
    }     

    this.setPositionInRadar(entity.radarpoint,ship,radarCoordenate);
  }
}

var PolygonShipRender = function(stage){
  this.stage = stage;
  this.texture = PIXI.Texture.fromImage("ship_texture.png");
}

PolygonShipRender.prototype = new BasicShipRender();

PolygonShipRender.prototype.createEntity = function(ship,coordenate){
  var entity = {};

  var sprite = new PIXI.Sprite(ship.isbot ? this.texture.blue : this.texture.green) ;          
  sprite.anchor.x = 0.5;
  sprite.anchor.y = 0.75;
  sprite.width = sprite.height = 4 * coordenate.scale; 

  entity.sprite = sprite;
  entity.radarpoint = this.createRadarPoint();

  return entity;
}

PolygonShipRender.prototype.update = function(sprite,ship,coordenate,radarCoordenate){
  var sprite = entity.sprite;
  sprite.position.x = coordenate.X(Number(ship.x));
  sprite.position.y = coordenate.Y(Number(ship.y)) ;
  sprite.rotation = -Number(ship.angle) + Math.PI/2;

  this.setPositionInRadar(entity.radarpoint,ship,radarCoordenate);
}

// core.js main class
var Game = function(){  
  var gamewidth = 500;
  this.gamewidth = gamewidth;
  this.gamemousepoint = {x:0,y:0};
  this.entitiesOnStage = {};
  this.gameEdges = [[-gamewidth/2,0],[gamewidth/2, 0],[gamewidth/2, gamewidth],[-gamewidth/2, gamewidth]];

  this.width = $(document).width();
  this.height = $(document).height();  


  // create an new instance of a pixi stage
  this.stage = new PIXI.Container();
  this.gameRenderer = new GameRenderer(this.entitiesOnStage,this.stage);

  // create moving background
  this.movingbg = new PIXI.extras.TilingSprite(
    PIXI.Texture.fromImage("grid_300x300.png"), this.width, this.height);
  this.movingbg.position.x = 0;
  this.movingbg.position.y = 0;
  this.movingbg.tilePosition.x = 0;
  this.movingbg.tilePosition.y = 0;

  this.stage.addChild(this.movingbg);
  //create coordenate tranform for radar
  var radarContainer = document.getElementById('radar');
  this.radarCoordenate = new CoordenateTranform(null,2,radarContainer.clientWidth,
    radarContainer.clientHeight);

  //create coordenate tranform for stage
  this.coordenate = new CoordenateTranform(null,15,this.width,this.height)


  this.edges = new PIXI.Graphics();
  this.edges.beginFill(0x000000,0);
  this.edges.lineStyle(1, 0xffd900, 1);
  this.edges.moveTo(this.coordenate.scale*this.gameEdges[0][0],this.coordenate.scale*this.gameEdges[0][1]);
  this.edges.lineTo(this.coordenate.scale*this.gameEdges[1][0],this.coordenate.scale*this.gameEdges[1][1]);
  this.edges.lineTo(this.coordenate.scale*this.gameEdges[2][0],this.coordenate.scale*this.gameEdges[2][1]);
  this.edges.lineTo(this.coordenate.scale*this.gameEdges[3][0],this.coordenate.scale*this.gameEdges[3][1]);
  this.edges.lineTo(this.coordenate.scale*this.gameEdges[0][0],this.coordenate.scale*this.gameEdges[0][1]);
  this.edges.endFill();

  this.stage.addChild(this.edges);

  // create a renderer instance.
  this.renderer = PIXI.autoDetectRenderer(this.width, this.height,{ transparent: true });

  // add the renderer view element to the DOM
  document.body.appendChild(this.renderer.view);
  window.addEventListener('resize', this.rescale, false);

Game.prototype.rescale = function() {
    this.width = this.width * window.innerWidth/this.width;
    this.height = this.width *  window.innerHeight/this.width;
    this.renderer.resize(this.width, this.height);
    this.movingbg.width = this.width
    this.movingbg.height = this.height;
}


Game.prototype.update = function(gamestate) {
  
    if(gamestate){
      if(gamestate.rank){

        var html = ""
        for(i in gamestate.rank){

          if(gamestate.rank[i].name != "0"){
            html+= ("<li>" +(gamestate.rank[i].name ? gamestate.rank[i].name : "no name") + "</li>" )
          }
        }
        //q console.log($('#rank'));
        $('#rank').html(html);
      }

      if(gamestate.player && gamestate.player.type != "dead"){
        if(!this.player){
          if(this.onNewPlayer){
            this.onNewPlayer(this.player);
          }
        }
        
        this.player = gamestate.player; // xy can change
        
        this.coordenate.refpoint = this.player;
        this.radarCoordenate.refpoint = this.player;
        

        gamestate.entities.push(gamestate.player);
      }else{
        
        if( $('#myModal').css('display') == 'none'){
          $('#myModal').modal('show');
        }

      }         
  
      //moving background
      //console.log(this.player)
      if(this.player){            
        this.movingbg.tilePosition.x = -(this.player.x*this.coordenate.scale).toFixed(0);
        this.movingbg.tilePosition.y = (this.player.y*this.coordenate.scale).toFixed(0);
      }


      this.edges.position.x = this.coordenate.X(0).toFixed(0);
      this.edges.position.y = this.coordenate.Y(this.gamewidth).toFixed(0);          
      

      var entities = gamestate.entities;
      
      // drawing entities
      for (var i = 0; i < entities.length; i++) {
        this.gameRenderer.addToStage(entities[i],this.coordenate,this.radarCoordenate,this.stage,this.player);
      }

      //map entities easy access
      var entitiesInGameState = {}
      for (var i = 0; i < entities.length; i++) {
          entitiesInGameState[Number(entities[i].id)] = entities[i];
      }

      //remove entities from stage
      for(var id in this.entitiesOnStage){
        if(!entitiesInGameState[id])
        {
          this.gameRenderer.removeFromStage(id,this.stage);
        }
      }

      //send Mouse Position
      var point = this.renderer.plugins.interaction.mouse.global;
      var gamepoint = {x:Number(this.coordenate.unX(point.x).toFixed(2)),y:Number(this.coordenate.unY(point.y).toFixed(2))}
      if(this.gamemousepoint.x != gamepoint.x || this.gamemousepoint.y != gamepoint.y){
        this.gamemousepoint.x = gamepoint.x;
        this.gamemousepoint.y = gamepoint.y;
        this.onMouseMove(this.gamemousepoint.x,this.gamemousepoint.y);  
      }
    }
    this.renderer.render(this.stage);
  }
}

//control.js event control
var EventControl = function(ws){

  this.ws = ws;
  this.kd = kd;
  this.EVENTS = ['LEFT', 'RIGHT', 'UP', 'DOWN', 'FIRE', 'TRY_CAPTURE_STAR','MOUSE_MOVE', 'NEW_PLAYER', 'REMOVE_PLAYER', 'BE_BORN', 'DIE'];
}

EventControl.prototype.sendEvent = function (type,payload){
    var array = [this.EVENTS.indexOf(type)]
    if(payload){
      for(var i in payload){
        if(typeof payload[i] == 'boolean'){
          payload[i] = payload[i] ? 1 : 0;
        }
        array.push(payload[i]);
      }
    }

    this.sendObject(array);  
}

EventControl.prototype.sendObject = function(obj){
    //console.log("sendObject");
    //console.log(obj);
    if(this.ws.readyState == 1){
      this.ws.send(LZString.compressToUint8Array(JSON.stringify(obj)+ "\n"),{ binary: true, mask: true })

    }
}

EventControl.prototype.addPlayer = function(){
    var player_name = document.getElementById("player_name").value;
    this.sendEvent('BE_BORN',{"name":player_name})
}

EventControl.prototype.initPlayerEventListener = function(){

    var _this = this
    //key pressed
    this.kd.A.down(function () {
      _this.sendEvent("LEFT",{pressed: true});
    });
    this.kd.W.down(function () {
      _this.sendEvent("UP",{pressed: true});
    });
    this.kd.S.down(function () {
      _this.sendEvent("DOWN",{pressed: true});
    });
    this.kd.D.down(function () {
      _this.sendEvent("RIGHT",{pressed: true});
    });
    this.kd.SPACE.down(function () {
      _this.sendEvent("TRY_CAPTURE_STAR",{pressed: true});
    });

    //release key 
    this.kd.A.up(function () {
      _this.sendEvent("LEFT",{pressed: false});
    });
    this.kd.W.up(function () {
      _this.sendEvent("UP",{pressed: false});
    });
    this.kd.S.up(function () {
      _this.sendEvent("DOWN",{pressed: false});
    });
    this.kd.D.up(function () {
      _this.sendEvent("RIGHT",{pressed: false});
    });
    this.kd.SPACE.up(function () {
      _this.sendEvent("TRY_CAPTURE_STAR",{pressed: false});
    });
}

 

// init websocket

var host = location.origin.replace(/^http/, 'ws')
var ws = new WebSocket(host);
var stream = null;
var stream_count = 0;
var laststreamtime = 0;

var buffer = new ArrayBuffer(2000);
var buffer_index = 0;

ws.binaryType = 'arraybuffer';
ws.onmessage = function (event) {

  var msg = new Uint8Array(event.data);
  
  if(msg){
    try{
      //var decoded_msg = decodeUtf8(msg);
      var decompressed_msg = LZString.decompressFromUint8Array(msg);
      stream = buildmessage(JSON.parse(decompressed_msg));
    }catch(e){
      console.log(e.stack);
      console.log("msg");
      console.log(msg);
      console.log("decompressed_msg");
      console.log(decompressed_msg);
      ws.close();
    }        
    
    stream_count ++;

    var now = performance.now();
    var delta = now - laststreamtime
    if(delta > 1000){
      console.log("datastreams by second : " + stream_count*1000/(delta));
      stream_count = 0;
      laststreamtime = now;
    }
  }
};

// init all
var eventsControl = new EventControl(ws,kd);
var game = new Game();
var fps = new FPSMeter();


game.onNewPlayer = function(player){
	eventsControl.initPlayerEventListener();
}

game.onMouseMove = function(x,y){
  eventsControl.sendEvent("MOUSE_MOVE",{'x':x,'y':y})
}

$(document).ready(function() {
	$(document).mousedown(function() {
	    eventsControl.sendEvent("FIRE",{pressed: true});
	});

	$(document).mouseup(function() {
	    eventsControl.sendEvent("FIRE",{pressed: false});
	});
});

var lastupdatetime = 0
var updatetimeBysecond = 0

var refreshFrame = function(){
	var before = performance.now();
	game.update(stream);
	var after = performance.now();

	var delta = after-before

	updatetimeBysecond = updatetimeBysecond + delta;

	if(after-lastupdatetime > 1000){
	  //console.log("update time lost by second: " +updatetimeBysecond+  "miliseconds");
	  lastupdatetime = after;
	  updatetimeBysecond = 0;
	}

	fps.tick();
	kd.tick();
	requestAnimationFrame(refreshFrame);
}

refreshFrame();