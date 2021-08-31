const gameDiv = document.querySelector(".game");

const config = {
  type: Phaser.AUTO,
  // makes game responsive
  scale: {
    parent: gameDiv,
    mode: Phaser.Scale.FIT,
    width: 600,
    height: 400,
  },
  physics: {
    default: "matter",
    matter: {
      // debug: true,
    },
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
};

export default new Phaser.Game(config);

const gameState = {
  player: null,
  cursors: null,
  jumps: 0,
  score: 0,
  scoreText: null,
  health: 100,
};

// load game assets
function preload() {
  this.load.image("background", "assets/Background_0.png");
  this.load.image("background2", "assets/Background_1.png");
  this.load.image("tiles", "assets/tiles.png");
  this.load.image("mid-tiles", "assets/mid-bg.png");
  this.load.tilemapTiledJSON("tilemap", "assets/graveyard.json");

  this.load.spritesheet(
    "witch",
    "assets/witch.png",
    {
      frameWidth: 26,
      frameHeight: 48,
    },
    0
  );
  this.load.spritesheet(
    "potion",
    "assets/potion-orange.png",
    {
      frameWidth: 16,
      frameHeight: 16,
    },
    0
  );

  this.load.spritesheet(
    "ghost",
    "assets/ghost.png",
    {
      frameWidth: 39,
      frameHeight: 47,
    },
    0
  );
}

function create() {
  const bg = this.add.image(300, 200, "background").setScrollFactor(0);
  const bg2 = this.add.image(300, 200, "background2").setScrollFactor(0.02);
  const bg3 = this.add.image(900, 200, "background2").setScrollFactor(0.02);
  bg.setDisplaySize(600, 400);
  bg2.setDisplaySize(600, 400);
  bg3.setDisplaySize(600, 400);

  const map = this.make.tilemap({ key: "tilemap" });
  const tileset1 = map.addTilesetImage("gravesheet", "tiles");
  const tileset2 = map.addTilesetImage("mid-bg", "mid-tiles");
  const midground = map.createLayer("midground", tileset2, 0, -500);
  const ground = map.createLayer("ground", tileset1);

  midground.setScrollFactor(0.3, 0.4);
  ground.setCollisionByProperty({ collides: true });

  this.cameras.main.setBounds(0, 0, 6400, 640);
  this.matter.world.setBounds(0, 0, 6400, 640);

  gameState.graphics = this.add.graphics().setScrollFactor(0);
  setHealth(gameState.health);

  // player animations for walking and idle
  this.anims.create({
    key: "run",
    frames: this.anims.generateFrameNumbers("witch", { start: 0, end: 7 }),
    frameRate: 10,
    repeat: -1,
  });

  this.anims.create({
    key: "idle",
    frames: [{ key: "witch", frame: 0 }],
    frameRate: 20,
  });

  this.anims.create({
    key: "ghost",
    frames: this.anims.generateFrameNumbers("ghost", { start: 0, end: 3 }),
    frameRate: 10,
    repeat: -1,
  });

  //  The score
  gameState.scoreText = this.add
    .text(20, 20, "score: 0", {
      fontSize: "24px",
      fill: "#fff",
    })
    .setScrollFactor(0);

  const objectLayer = map.getObjectLayer("objects");

  // add objects to game
  objectLayer.objects.forEach((data) => {
    const { x = 0, y = 0, name } = data;

    switch (name) {
      case "start": {
        gameState.player = this.matter.add
          .sprite(x, y, "witch")
          .setScale(1.7)
          .setFixedRotation();

        gameState.player.setOnCollide((data) => {
          const gameObj = data.bodyB.gameObject;

          if (gameObj instanceof Phaser.Physics.Matter.TileBody) {
            gameState.jumps = 0;
          } else {
            const type = gameObj.getData("type");

            switch (type) {
              case "potion": {
                collectPotion(gameObj);
                break;
              }
              case "ghost": {
                takeDamage();
                break;
              }
            }
          }
        });

        this.cameras.main.startFollow(gameState.player);

        break;
      }

      case "potion": {
        const potion = this.matter.add
          .sprite(x, y, "potion", 0, {
            isStatic: true,
            isSensor: true,
          })
          .setScale(1.5);

        potion.setData("type", "potion");

        break;
      }
      
      case "ghost": {
        const ghost = this.matter.add
          .sprite(x, y, "ghost", 0, {
            isStatic: true,
            isSensor: true,
          }).setFixedRotation();

        ghost.setData("type", "ghost")
        ghost.play("ghost")
        
        break;
      }
    }
  });

  gameState.cursors = this.input.keyboard.createCursorKeys();

  this.matter.world.convertTilemapLayer(ground);
}

function update() {
  // add controls
  const speed = 4;
  if (gameState.cursors.left.isDown) {
    gameState.player.setVelocityX(-speed);
    gameState.player.flipX = true;
    gameState.player.play("run", true);
  } else if (gameState.cursors.right.isDown) {
    gameState.player.setVelocityX(speed);
    gameState.player.flipX = false;
    gameState.player.play("run", true);
  } else {
    gameState.player.setVelocityX(0);
    gameState.player.anims.play("idle");
  }

  const upJustPressed = Phaser.Input.Keyboard.JustDown(gameState.cursors.up);

  if (upJustPressed) {
    if (gameState.jumps < 1) {
      gameState.player.setVelocityY(-10);
      gameState.player.anims.play("idle");
      gameState.jumps++;
    }
  }
}

function collectPotion(potion) {
  potion.destroy(true, true);

  //  Add and update the score
  gameState.score += 10;
  gameState.scoreText.setText(`score: ${gameState.score}`);
}

function takeDamage() {
  gameState.player.setTint(0xb700e0);
  setTimeout(() => {
    gameState.player.clearTint();
  }, 200);
  gameState.health -= 20;
  console.log(gameState.health);
  setHealth(gameState.health);
}

function setHealth(value) {
  const width = 130;
  let fillPercent = (Phaser.Math.Clamp(value, 0, 100) / 100) * width;
  gameState.graphics.fillStyle(0x808080);
  gameState.graphics.fillRoundedRect(20, 60, width, 10, 3);
  gameState.graphics.fillStyle(0x00ff00);
  gameState.graphics.fillRoundedRect(20, 60, fillPercent, 10, 3);
}
