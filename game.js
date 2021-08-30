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
      debug: true,
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
};

// load game assets
function preload() {
  this.load.image("background", "assets/Background_0.png");
  this.load.image("background2", "assets/Background_1.png");
  this.load.image("tiles", "assets/tiles.png");
  this.load.tilemapTiledJSON("tilemap", "assets/graveyard.json");

  this.load.spritesheet(
    "witch",
    "assets/witch.png",
    {
      frameWidth: 25,
      frameHeight: 45,
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
  const bg = this.add.image(300, 200, 'background').setScrollFactor(0);
  const bg2 = this.add.image(300, 200, 'background2').setScrollFactor(0);
  bg.setDisplaySize(600, 400);
  bg2.setDisplaySize(600, 400);

  const map = this.make.tilemap({ key: "tilemap" });
  const tileset = map.addTilesetImage("gravesheet", "tiles");
  const ground = map.createLayer("ground", tileset);
  ground.setCollisionByProperty({ collides: true });

  this.cameras.main.setBounds(0, 0, 50 * 32, 20 * 32);
  this.matter.world.setBounds(0, 0, 50 * 32, 20 * 32);

  // player animations for walking and idle
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

  //  The score
  gameState.scoreText = this.add.text(20, 20, "score: 0", {
    fontSize: "24px",
    fill: "#fff",
  }).setScrollFactor(0);

  const objectLayer = map.getObjectLayer("objects");

  // add objects to game
  objectLayer.objects.forEach((data) => {
    const { x = 0, y = 0, name } = data;

    switch (name) {
      case "start": {
        gameState.player = this.matter.add
          .sprite(x, y, "witch")
          .setScale(2)
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
            }
          }
        });

        this.matter.add.sprite(x + 50, y, "ghost").setFixedRotation();
        
        this.cameras.main.startFollow(gameState.player);

        break;
      }

      case "potion": {
        const potion = this.matter.add
          .sprite(x, y, "potion", 0, { isStatic: true, isSensor: true })
          .setScale(1.5);

        potion.setData("type", "potion");

        break;
      }
    }
  });

  gameState.cursors = this.input.keyboard.createCursorKeys();

  this.matter.world.convertTilemapLayer(ground);
}

function update() {
  // add controls
  const speed = 10;
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
    if (gameState.jumps < 2) {
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
  console.log(gameState.score);
}
