// choose a larger game area that adapts to the browser window
const maxW = 1600, maxH = 900;
const minW = 1200, minH = 700;
const w = Math.min(maxW, Math.max(minW, Math.floor(window.innerWidth * 0.95)));
const h = Math.min(maxH, Math.max(minH, Math.floor(window.innerHeight * 0.9)));
const panelWidth = 200;
const panelPadding = 8;
const centralWidth = Math.max(100, w - (panelWidth * 2) - (panelPadding * 4));

const GameSceneClass = window.GridScene;

const config = {
  type: Phaser.AUTO,
  width: w,
  height: h,
  parent: 'game-root',
  physics: {
    default: 'arcade',
    arcade: { debug: false }
  },
  scene: GameSceneClass,
  // make the canvas responsive when the window resizes
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};

const game = new Phaser.Game(config);

const requestMobileFullscreen = async () => {
  const os = game && game.device && game.device.os;
  const isMobile = os && (os.android || os.iOS || os.iPad || os.iPhone || os.windowsPhone);
  if (!isMobile) return;
  const container = document.getElementById('game-root');
  if (container && container.requestFullscreen && !document.fullscreenElement) {
    try {
      await container.requestFullscreen();
    } catch (e) { }
  }
  if (screen.orientation && screen.orientation.lock) {
    try {
      await screen.orientation.lock('landscape');
    } catch (e) { }
  }
};

requestMobileFullscreen();

const updateBannerSize = () => {
  const banner = document.getElementById('game-banner');
  if (!banner || !game || !game.canvas) return;
  const canvasRect = game.canvas.getBoundingClientRect();
  const scaleX = canvasRect.width / w;
  banner.style.width = `${Math.max(0, Math.floor(centralWidth * scaleX))}px`;
};

updateBannerSize();
window.addEventListener('resize', () => {
  window.requestAnimationFrame(updateBannerSize);
});
