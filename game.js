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
    default: "arcade",
    arcade: {
      gravity: { y: 300 },
      debug: false,
    },
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
};

const game = new Phaser.Game(config);

function preload() {
}

function create() {}

function update() {}
