// import Phaser from "phaser";

const gameDiv = document.querySelector(".game");

const config = {
  type: Phaser.AUTO,
  scale: {
    parent: gameDiv,
    mode: Phaser.Scale.FIT,
    width: 800,
    height: 600,
  },
  physics: {
    default: "matter",
    matter: {
      debug: true,
    },
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
};

const game = new Phaser.Game(config);
let player;
let cursors;

function preload() {
  this.load.image("tiles", "assets/tiles.png");
  this.load.tilemapTiledJSON("tilemap", "assets/graveyard.json");
  this.load.spritesheet("witch", "assets/witch.png", {
    frameWidth: 25,
    frameHeight: 45,
  }, 0);
}

function create() {
  const map = this.make.tilemap({ key: "tilemap" });
  const tileset = map.addTilesetImage("gravesheet", "tiles");
  const ground = map.createLayer("ground", tileset);
  ground.setCollisionByProperty({ collides: true });
  this.matter.world.convertTilemapLayer(ground);

  // this.cameras.main.scrollY = -100
  const { width, height } = this.scale;

  player = this.matter.add
    .sprite(width * 0.25, height * 0.5, "witch")
    .setScale(2)
    .setFixedRotation();

  //  Our player animations, turning, walking left and walking right.
  this.anims.create({
    key: "run",
    frames: this.anims.generateFrameNumbers("witch", { start: 0, end: 3 }),
    frameRate: 10,
    repeat: -1,
  });

  this.anims.create({
    key: "idle",
    frames: [{ key: "witch", frame: 0 }],
    frameRate: 20,
  });

  cursors = this.input.keyboard.createCursorKeys();
  this.cameras.main.startFollow(player);
}

function update() {
  const speed = 10;
  if (cursors.left.isDown) {
    player.setVelocityX(-speed);
    player.flipX = true;
    player.play("run", true);
  } 
  else if (cursors.right.isDown) 
  {
    player.setVelocityX(speed);
    player.flipX = false;
    player.play("run", true);
  } 
  else 
  {
    player.setVelocityX(0);
    player.anims.play("idle");
  }

  const upJustPressed = Phaser.Input.Keyboard.JustDown(cursors.up)
  
  if (upJustPressed) {
    player.setVelocityY(-10);
    player.anims.play("idle");
  }
}
