class GridScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GridScene' });
  }

  preload() {
    console.log('GridScene.preload start');
    // load only from the project's graphics folder
    this.load.image('bg_pillar_a', 'graphics/bg_pillar_a.png');
    this.load.image('bg_pillar_b', 'graphics/bg_pillar_b.png');
    this.load.image('bg_sand', 'graphics/bg_sand.png');
    this.load.image('side_vert', 'graphics/side_vert.png');
    this.load.image('side_horiz', 'graphics/side_horiz.png');
    this.load.image('zeus_icon', 'graphics/zeus.png');
    this.load.image('hermes_icon', 'graphics/hermes.png');
    this.load.image('poseidon_icon', 'graphics/poseidon.png');
    // temple images
    this.load.image('red_temple', 'graphics/red_temple.png');
    this.load.image('blue_temple', 'graphics/blue_temple.png');
    this.load.image('yellow_temple', 'graphics/yellow_temple.png');
    // player animation frames
    this.load.image('player_stood', 'graphics/stood.png');
    this.load.image('player_run_left', 'graphics/run_left.png');
    this.load.image('player_run_right', 'graphics/run_right.png');
    this.load.image('red_stood', 'graphics/red_stood.png');
    this.load.image('red_run_left', 'graphics/red_run_left.png');
    this.load.image('red_run_right', 'graphics/red_run_right.png');
    this.load.image('blue_stood', 'graphics/blue_stood.png');
    this.load.image('blue_run_left', 'graphics/blue_run_left.png');
    this.load.image('blue_run_right', 'graphics/blue_run_right.png');
    this.load.image('yellow_stood', 'graphics/yellow_stood.png');
    this.load.image('yellow_run_left', 'graphics/yellow_run_left.png');
    this.load.image('yellow_run_right', 'graphics/yellow_run_right.png');
    // offering images (optional) - place these in graphics/
    this.load.image('red_offering', 'graphics/red_offering.png');
    this.load.image('blue_offering', 'graphics/blue_offering.png');
    this.load.image('yellow_offering', 'graphics/yellow_offering.png');
    // minotaur enemy
    this.load.image('minotaur', 'graphics/minotaur.png');
    // background music
    this.load.audio('bgMusic', 'sound/wrath-of-the-gods.mp3');
    this.load.audio('gameOver', 'sound/game-over.mp3');
  }

  create() {
    console.log('GridScene.create start');
    // diagnostic dump
    try {
      console.log('scene this:', this);
      console.log('this.add exists:', !!(this && this.add));
      console.log('this.sys exists:', !!(this && this.sys));
      console.log('this.sys.settings:', this && this.sys && this.sys.settings);
    } catch (e) { console.warn('diagnostic log failed', e); }

    // guard: ensure Phaser provided a valid scene context
    if (!this || !this.sys || !this.sys.settings || !this.add) {
      console.error('GridScene.create called with invalid scene context', this);
      // show visible diagnostic on page
      const container = document.getElementById('game-container');
      if (container) container.innerText = 'Scene context invalid - check console';
      return;
    }
    try {

    // Debug: report which graphics textures loaded and show a small sample if available
    const pillarALoaded = this.textures && this.textures.exists && this.textures.exists('bg_pillar_a');
    const pillarBLoaded = this.textures && this.textures.exists && this.textures.exists('bg_pillar_b');
    console.log('texture bg_pillar_a loaded:', !!pillarALoaded);
    console.log('texture bg_pillar_b loaded:', !!pillarBLoaded);
    if (pillarALoaded) this.add.image(8, 8, 'bg_pillar_a').setDisplaySize(32, 32).setOrigin(0).setDepth(9999);
    if (pillarBLoaded) this.add.image(8, 8, 'bg_pillar_b').setDisplaySize(32, 32).setOrigin(0).setDepth(9999);

    // Grid config
    this.cols = 17;
    this.rows = 17;

    // UI panel sizing
    this.panelWidth = 200;
    this.panelPadding = 8;

    // Panel X positions (fixed left/right margins)
    this.leftPanelX = this.panelPadding; // leftmost
    this.rightPanelX = this.scale.width - this.panelWidth - this.panelPadding; // rightmost

    // Compute central area available for the grid between panels (leave panelPadding gaps)
    const centralLeft = this.leftPanelX + this.panelWidth + this.panelPadding;
    const centralRight = this.rightPanelX - this.panelPadding;
    const centralWidth = Math.max(100, centralRight - centralLeft);
    const centralHeight = Math.max(100, this.scale.height - 32);

    // Compute tile size to fit the configured cols/rows into the central area
    this.tile = Math.floor(Math.min(centralWidth / this.cols, centralHeight / this.rows));
    if (this.tile < 8) this.tile = 8; // minimum tile size

    // Center the grid inside the central area
    this.offsetX = Math.floor(centralLeft + Math.max(0, (centralWidth - this.cols * this.tile) / 2));
    this.offsetY = Math.floor(Math.max(16, (this.scale.height - this.rows * this.tile) / 2));

    // Openings on the top (explicit columns, zero-based)
    // User-visible positions requested: 5,9,13 (1-based) -> store as zero-based indices
    this.topOpenings = [4, 8, 12];
    console.log('Using topOpenings (zero-based):', this.topOpenings);

    // Draw a lighter background for the grid area so tiles are visible
    const gridCenterX = this.offsetX + (this.cols * this.tile) / 2;
    const gridCenterY = this.offsetY + (this.rows * this.tile) / 2;
    // tile bg_sand across the full grid area when available, otherwise draw a solid rectangle
    const sandKey = (this.textures && this.textures.exists && this.textures.exists('bg_sand')) ? 'bg_sand' : null;
    if (sandKey) {
      // create tiled sprites sized to each cell for crisp tiling
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          const sx = this.offsetX + c * this.tile;
          const sy = this.offsetY + r * this.tile;
          this.add.image(sx, sy, sandKey).setDisplaySize(this.tile, this.tile).setOrigin(0).setDepth(0);
        }
      }
    } else {
      this.add.rectangle(gridCenterX, gridCenterY, this.cols * this.tile, this.rows * this.tile, 0x2b2b2b).setDepth(0);
    }

    // Create simple textures for wall, player and offerings so colors render clearly
    const wallSize = Math.max(4, this.tile - 8);
    const wallG = this.add.graphics();
    wallG.fillStyle(0x8888ff, 1); // wall color
    wallG.fillRect(0, 0, wallSize, wallSize);
    wallG.generateTexture('wallTile', wallSize, wallSize);
    wallG.destroy();

    const playerSize = Math.max(6, Math.round(this.tile * 0.6));
    const playerG = this.add.graphics();
    // fallback player tile: plain neutral square (no colored point)
    playerG.fillStyle(0xffffff, 1);
    playerG.fillRect(0, 0, playerSize, playerSize);
    playerG.generateTexture('playerTile', playerSize, playerSize);
    playerG.destroy();

    // offerings textures: red, blue, yellow small circles
    // make offering texture size match a full cell so sprites can fill the cell
    const offeringSize = Math.max(6, this.tile);
    const offeringKeys = ['red_offering', 'blue_offering', 'yellow_offering'];
    const fallbackColors = [0xff4444, 0x4466ff, 0xffdd44];
    for (let i = 0; i < 3; i++) {
      if (this.textures && this.textures.exists && this.textures.exists(offeringKeys[i])) {
        // use provided image directly
        // no action needed here; will reference offeringKeys when spawning
      } else {
        const gOff = this.add.graphics();
        gOff.fillStyle(fallbackColors[i], 1);
        // draw a filled circle centered in the full-cell texture
        gOff.fillCircle(offeringSize / 2, offeringSize / 2, Math.max(3, Math.floor(offeringSize / 2)));
        gOff.generateTexture('off' + i, offeringSize, offeringSize);
        gOff.destroy();
        // map offeringKeys to generated key name for consistency
        offeringKeys[i] = 'off' + i;
      }
    }
    this.offeringKeys = offeringKeys;

    // Create a wall grid boolean matrix for quick collision checks
    this.wallGrid = [];
    for (let r = 0; r < this.rows; r++) {
      this.wallGrid[r] = [];
      for (let c = 0; c < this.cols; c++) this.wallGrid[r][c] = false;
    }

    // Create a static group for wall tiles
    this.walls = this.physics.add.staticGroup();

    // Create perimeter walls except for the three top openings
    let wallCount = 0;
    // use only graphics folder side textures if present
    const vertKey = (this.textures && this.textures.exists && this.textures.exists('side_vert')) ? 'side_vert' : null;
    const horizKey = (this.textures && this.textures.exists && this.textures.exists('side_horiz')) ? 'side_horiz' : null;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const isPerimeter = r === 0 || r === this.rows - 1 || c === 0 || c === this.cols - 1;
        const skipTopOpening = false;
        if (isPerimeter && !skipTopOpening) {
          const x = this.offsetX + c * this.tile + this.tile / 2;
          const y = this.offsetY + r * this.tile + this.tile / 2;
          // prefer using themed side textures; fallback to generated wall tile
          if ((r === 0 || r === this.rows - 1) && horizKey) {
            // horizontal edge
            const img = this.physics.add.staticImage(x, y, horizKey).setDisplaySize(this.tile, this.tile).setOrigin(0.5).setDepth(6);
            img.refreshBody && img.refreshBody();
          } else if ((c === 0 || c === this.cols - 1) && vertKey) {
            // vertical edge
            const img = this.physics.add.staticImage(x, y, vertKey).setDisplaySize(this.tile, this.tile).setOrigin(0.5).setDepth(6);
            img.refreshBody && img.refreshBody();
          } else {
            const tile = this.walls.create(x, y, 'wallTile');
            tile.setDisplaySize(wallSize, wallSize);
            tile.setOrigin(0.5, 0.5);
            tile.refreshBody();
          }
          this.wallGrid[r][c] = true;
          wallCount++;
        }
      }
    }
    console.log('wallCount', wallCount, 'tile', this.tile, 'topOpenings', this.topOpenings);

    // Place temples before voids so void generation can avoid entrance cells
    this.templeOccupied = new Set();
    this.entranceCells = new Set();
    this.temples = [];
    const templeColors = [0xff4444, 0x4466ff, 0xffdd44];
    const templeNames = ['Hermes', 'Poseidon', 'Zeus'];
    const templeImgKeys = ['red_temple', 'blue_temple', 'yellow_temple'];
    const templeCellsSize = 4;

    const tryPlaceTemple = (i) => {
      const maxAttempts = 500;
      const templeGap = 2; // reduced from 4 to fit 3 temples on 17x17 grid
      const templeClearance = 1;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        // ensure temple fits within bounds
        const minTempleCol = templeClearance + 1;
        const maxTempleCol = this.cols - templeCellsSize - templeClearance - 1;
        const c0 = Phaser.Math.Between(minTempleCol, Math.max(minTempleCol, maxTempleCol));
        // temple is 4x4, entrance is within temple, so just need 1 row buffer from bottom wall
        const maxTempleRow = this.rows - templeCellsSize - 1;
        const minTempleRow = templeClearance + 1;
        const r0 = Phaser.Math.Between(minTempleRow, Math.max(minTempleRow, maxTempleRow));
        let ok = true;
        const cells = [];
        for (let rr = r0; rr < r0 + templeCellsSize; rr++) {
          for (let cc = c0; cc < c0 + templeCellsSize; cc++) {
            if (this.wallGrid[rr] && this.wallGrid[rr][cc]) { ok = false; break; }
            if (this.templeOccupied.has(`${cc},${rr}`)) { ok = false; break; }
            // avoid player start area (2x2 centered at bottom)
            const playerStartCol = Math.floor(this.cols/2) - 1;
            const playerStartRow = this.rows - 3;
            if (cc >= playerStartCol && cc <= playerStartCol + 1 && rr >= playerStartRow && rr <= playerStartRow + 1) { ok = false; break; }
            cells.push({col: cc, row: rr});
          }
          if (!ok) break;
        }
        if (!ok) continue;

        // enforce temple-to-temple gap and navigation clearance
        for (let rr = r0 - templeGap; rr < r0 + templeCellsSize + templeGap; rr++) {
          for (let cc = c0 - templeGap; cc < c0 + templeCellsSize + templeGap; cc++) {
            if (rr < 0 || rr >= this.rows || cc < 0 || cc >= this.cols) continue;
            if (this.templeOccupied.has(`${cc},${rr}`)) { ok = false; break; }
          }
          if (!ok) break;
        }
        if (!ok) continue;

        for (let rr = r0 - templeClearance; rr < r0 + templeCellsSize + templeClearance; rr++) {
          for (let cc = c0 - templeClearance; cc < c0 + templeCellsSize + templeClearance; cc++) {
            if (rr < 0 || rr >= this.rows || cc < 0 || cc >= this.cols) { ok = false; break; }
            if (this.wallGrid[rr] && this.wallGrid[rr][cc]) { ok = false; break; }
          }
          if (!ok) break;
        }
        if (!ok) continue;

        // entrance cells are just the bottom-center 2 cells of the temple itself (the doorway)
        // No extra rows below - entrance is within the temple graphic
        const entranceRow = r0 + templeCellsSize - 1; // bottom row of temple
        const entrances = [];
        // Only the middle 2 columns (c0+1 and c0+2) at the bottom row of the temple
        for (let cc = c0 + 1; cc < c0 + templeCellsSize - 1; cc++) {
          entrances.push({ col: cc, row: entranceRow });
        }
        // center 2x2 cells for deposit checks
        const centerCells = [];
        for (let rr = r0 + 1; rr < r0 + templeCellsSize - 1; rr++) {
          for (let cc = c0 + 1; cc < c0 + templeCellsSize - 1; cc++) {
            centerCells.push({ col: cc, row: rr });
          }
        }
        // validate entrances within bounds
        for (const entrance of entrances) {
          if (entrance.col < 1 || entrance.col > this.cols - 2 || entrance.row < 1 || entrance.row > this.rows - 2) { ok = false; break; }
        }
        if (!ok) continue;

        // place temple image covering the 4x4 cell area
        const centerX = this.offsetX + (c0 + templeCellsSize/2) * this.tile;
        const centerY = this.offsetY + (r0 + templeCellsSize/2) * this.tile;
        const sizePx = this.tile * templeCellsSize;
        const key = (this.textures && this.textures.exists && this.textures.exists(templeImgKeys[i])) ? templeImgKeys[i] : null;
        let img;
        if (key) img = this.add.image(centerX, centerY, key).setDisplaySize(sizePx, sizePx).setOrigin(0.5).setDepth(5);
        else img = this.add.rectangle(centerX, centerY, sizePx, sizePx, templeColors[i]).setDepth(5).setOrigin(0.5);

        // keep temple cells for delivery checks but don't block movement
        for (const cell of cells) {
          this.templeOccupied.add(`${cell.col},${cell.row}`);
        }

        this.temples.push({ cells, entrances, centerCells, rect: img, name: templeNames[i], color: templeColors[i], index: i });
        return true;
      }
      return false;
    };

    // place three temples
    for (let i = 0; i < 3; i++) {
      const placedTemple = tryPlaceTemple(i);
      if (!placedTemple) console.warn('Failed to place temple', i);
    }

    if (this.temples.length < 3) {
      const missing = [];
      for (let i = 0; i < 3; i++) {
        if (!this.temples.find(t => t.index === i)) missing.push(i);
      }

      const templeGap = 2;
      // Fixed positions spread across the grid for 4x4 temples with 4x2 entrance below
      // Each position needs: temple at row r0, entrance at r0+4 and r0+5
      // So max r0 = 17 - 4 (temple) - 2 (entrance) - 1 (bottom wall) = 10
      const candidatePositions = [
        { col: 2, row: 2 },
        { col: 11, row: 2 },
        { col: 2, row: 8 },
        { col: 11, row: 8 },
        { col: 6, row: 2 },
        { col: 6, row: 8 },
        { col: 2, row: 5 },
        { col: 11, row: 5 },
        { col: 6, row: 5 }
      ];

      const canPlaceAt = (c0, r0) => {
        const entranceRow = r0 + templeCellsSize - 1;
        if (entranceRow >= this.rows - 1) return false;
        if (c0 < 1 || c0 + templeCellsSize > this.cols - 1) return false;
        for (let rr = r0 - templeGap; rr < r0 + templeCellsSize + templeGap; rr++) {
          for (let cc = c0 - templeGap; cc < c0 + templeCellsSize + templeGap; cc++) {
            if (rr < 0 || rr >= this.rows || cc < 0 || cc >= this.cols) continue;
            if (this.templeOccupied.has(`${cc},${rr}`)) return false;
          }
          if (!ok) break;
        }
        for (let rr = r0; rr < r0 + templeCellsSize; rr++) {
          for (let cc = c0; cc < c0 + templeCellsSize; cc++) {
            if (this.wallGrid[rr] && this.wallGrid[rr][cc]) return false;
          }
        }
        return true;
      };
      
      const forcePlaceTempleAt = (i, c0, r0) => {
        const cells = [];
        for (let rr = r0; rr < r0 + templeCellsSize; rr++) {
          for (let cc = c0; cc < c0 + templeCellsSize; cc++) {
            cells.push({ col: cc, row: rr });
          }
        }

        // entrance is just the bottom-center 2 cells of the temple (the doorway)
        const entranceRow = r0 + templeCellsSize - 1; // bottom row of temple
        const entrances = [];
        for (let cc = c0 + 1; cc < c0 + templeCellsSize - 1; cc++) {
          entrances.push({ col: cc, row: entranceRow });
        }
        const centerCells = [];
        for (let rr = r0 + 1; rr < r0 + templeCellsSize - 1; rr++) {
          for (let cc = c0 + 1; cc < c0 + templeCellsSize - 1; cc++) {
            centerCells.push({ col: cc, row: rr });
          }
        }

        const centerX = this.offsetX + (c0 + templeCellsSize / 2) * this.tile;
        const centerY = this.offsetY + (r0 + templeCellsSize / 2) * this.tile;
        const sizePx = this.tile * templeCellsSize;
        const key = (this.textures && this.textures.exists && this.textures.exists(templeImgKeys[i])) ? templeImgKeys[i] : null;
        let img;
        if (key) img = this.add.image(centerX, centerY, key).setDisplaySize(sizePx, sizePx).setOrigin(0.5).setDepth(5);
        else img = this.add.rectangle(centerX, centerY, sizePx, sizePx, templeColors[i]).setDepth(5).setOrigin(0.5);

        for (const cell of cells) {
          this.templeOccupied.add(`${cell.col},${cell.row}`);
        }

        this.temples.push({ cells, entrances, centerCells, rect: img, name: templeNames[i], color: templeColors[i], index: i });
      };

      for (const i of missing) {
        let placed = false;
        for (const pos of candidatePositions) {
          const c0 = pos.col;
          const r0 = pos.row;
          if (!canPlaceAt(c0, r0)) continue;
          forcePlaceTempleAt(i, c0, r0);
          placed = true;
          break;
        }
        if (!placed) console.warn('Failed to force-place temple', i);
      }
    }

    // Add void blocks after temples placed. Avoid temple cells and entrance cells so temples remain accessible.
    this.voids = [];
    const voidCount = 5;
    const voidSize = Math.max(6, this.tile - 12);
    let placedVoids = 0;
    let voidAttempts = 0;
    const voidCellsSize = 2; // 2x2 cells for each void
    const voidClearance = 2;
    const playerCellsSizeForVoids = 2; // player will be 2x2
    
    while (placedVoids < voidCount && voidAttempts < 2000) {
      voidAttempts++;
      const c = Phaser.Math.Between(voidClearance, this.cols - voidCellsSize - voidClearance - 1);
      const r = Phaser.Math.Between(voidClearance, this.rows - voidCellsSize - voidClearance - 1);
      
      // Check if all 2x2 cells are available
      let canPlace = true;
      for (let rr = r - voidClearance; rr < r + voidCellsSize + voidClearance; rr++) {
        for (let cc = c - voidClearance; cc < c + voidCellsSize + voidClearance; cc++) {
          if (rr < 0 || rr >= this.rows || cc < 0 || cc >= this.cols) { canPlace = false; break; }
          if (this.wallGrid[rr][cc]) { canPlace = false; break; }
          if (this.templeOccupied && this.templeOccupied.has(`${cc},${rr}`)) { canPlace = false; break; }
          if (this.entranceCells && this.entranceCells.has(`${cc},${rr}`)) { canPlace = false; break; }
          // avoid player start area (2x2 centered at bottom)
          const playerStartCol = Math.floor(this.cols/2) - 1;
          const playerStartRow = this.rows - 3;
          if (cc >= playerStartCol - voidClearance && cc <= playerStartCol + playerCellsSizeForVoids - 1 + voidClearance &&
              rr >= playerStartRow - voidClearance && rr <= playerStartRow + playerCellsSizeForVoids - 1 + voidClearance) {
            canPlace = false;
            break;
          }
        }
        if (!canPlace) break;
      }
      
      if (!canPlace) continue;

      const centerX = this.offsetX + (c + voidCellsSize/2) * this.tile;
      const centerY = this.offsetY + (r + voidCellsSize/2) * this.tile;
      const sizePx = this.tile * voidCellsSize;
      let voidSprite;
      
      // Randomly choose between pillar A and pillar B
      const pillarAExists = this.textures && this.textures.exists && this.textures.exists('bg_pillar_a');
      const pillarBExists = this.textures && this.textures.exists && this.textures.exists('bg_pillar_b');
      
      if (pillarAExists && pillarBExists) {
        const usePillarA = Math.random() < 0.5;
        const pillarKey = usePillarA ? 'bg_pillar_a' : 'bg_pillar_b';
        voidSprite = this.add.image(centerX, centerY, pillarKey).setDisplaySize(sizePx, sizePx).setDepth(4).setOrigin(0.5);
      } else if (pillarAExists) {
        voidSprite = this.add.image(centerX, centerY, 'bg_pillar_a').setDisplaySize(sizePx, sizePx).setDepth(4).setOrigin(0.5);
      } else if (pillarBExists) {
        voidSprite = this.add.image(centerX, centerY, 'bg_pillar_b').setDisplaySize(sizePx, sizePx).setDepth(4).setOrigin(0.5);
      } else {
        voidSprite = this.add.rectangle(centerX, centerY, sizePx, sizePx, 0x111111).setDepth(4).setOrigin(0.5);
      }
      
      // Mark all 2x2 cells as occupied
      const cells = [];
      for (let rr = r; rr < r + voidCellsSize; rr++) {
        for (let cc = c; cc < c + voidCellsSize; cc++) {
          this.wallGrid[rr][cc] = true;
          cells.push({col: cc, row: rr});
        }
      }
      
      this.voids.push({ col: c, row: r, cells, rect: voidSprite });
      placedVoids++;
    }
    console.log('placed voids', placedVoids);



    // Player: create a sprite (no arcade body) and snap to grid
    // Player now occupies 2x2 cells
    const startCol = Math.floor(this.cols / 2) - 1; // adjust to be top-left of 2x2 area
    const startRow = this.rows - 3; // adjust to leave room at bottom
    this.playerGridCol = startCol;
    this.playerGridRow = startRow;
    
    // Mark player's 2x2 area in grid
    this.playerCellsSize = 2;
    
    const px = this.offsetX + (startCol + this.playerCellsSize/2) * this.tile;
    const py = this.offsetY + (startRow + this.playerCellsSize/2) * this.tile;

    // use uploaded player sprite if available, else use generated texture
    const playerKey = (this.textures && this.textures.exists && this.textures.exists('player_stood')) ? 'player_stood' : 'playerTile';
    this.player = this.add.sprite(px, py, playerKey);
    const playerDisplaySize = this.tile * this.playerCellsSize;
    this.player.setDisplaySize(playerDisplaySize, playerDisplaySize);
    this.player.setDepth(10);
    
    // Store player animation state
    this.playerDirection = 0; // 0 = stood, -1 = left, 1 = right
    this.playerSpriteSet = 'base';

    this.isMoving = false;
    this.moveDuration = 120; // ms per cell

    // Add a debug marker that follows the player so we can always see position
    // remove colored point marker and instead keep a subtle outline for debug if needed
    this.playerMarker = this.add.circle(px, py, Math.max(4, Math.round(playerDisplaySize / 6)), 0x000000, 0).setDepth(30);

    // Minotaur enemy: patrols between corners and center
    // Minotaur now occupies 2x2 cells
    this.minotaurGridCol = 1; // start away from corner to fit 2x2
    this.minotaurGridRow = 1;
    this.minotaurCellsSize = 2;
    
    this.minotaurWaypoints = [
      { col: 1, row: 1 }, // top-left area
      { col: Math.floor(this.cols / 2) - 1, row: Math.floor(this.rows / 2) - 1 }, // center
      { col: this.cols - 3, row: 1 }, // top-right area
      { col: Math.floor(this.cols / 2) - 1, row: Math.floor(this.rows / 2) - 1 }, // center
      { col: this.cols - 3, row: this.rows - 3 }, // bottom-right area
      { col: Math.floor(this.cols / 2) - 1, row: Math.floor(this.rows / 2) - 1 }, // center
      { col: 1, row: this.rows - 3 }, // bottom-left area
      { col: Math.floor(this.cols / 2) - 1, row: Math.floor(this.rows / 2) - 1 }, // center
    ];
    this.minotaurWaypointIndex = 0;
    this.minotaurMoving = false;
    this.minotaurMoveDuration = 1000; // ms per cell (one cell per second)
    this.minotaurPath = []; // current path of grid cells to follow

    const mx = this.offsetX + (this.minotaurGridCol + this.minotaurCellsSize/2) * this.tile;
    const my = this.offsetY + (this.minotaurGridRow + this.minotaurCellsSize/2) * this.tile;
    const minotaurDisplaySize = this.tile * this.minotaurCellsSize;
    this.minotaur = this.add.sprite(mx, my, 'minotaur').setDisplaySize(minotaurDisplaySize, minotaurDisplaySize).setDepth(11);
    
    // ensure minotaur won't spawn on void/wall: mark starting 2x2 area as non-blocking for itself
    for (let rr = this.minotaurGridRow; rr < this.minotaurGridRow + this.minotaurCellsSize; rr++) {
      for (let cc = this.minotaurGridCol; cc < this.minotaurGridCol + this.minotaurCellsSize; cc++) {
        if (this.wallGrid[rr] && this.wallGrid[rr][cc]) {
          this.wallGrid[rr][cc] = false;
        }
      }
    }

    // offerings state
    this.offerings = []; // {col,row,type,sprite}
    this.carry = null; // type index or null

    // gods state
    this.gods = [
      { name: 'Hermes', color: 0xff4444, anger: 0, rate: 2.5, iconKey: 'hermes_icon' },
      { name: 'Poseidon', color: 0x4466ff, anger: 0, rate: 2.5, iconKey: 'poseidon_icon' },
      { name: 'Zeus', color: 0xffdd44, anger: 0, rate: 2.5, iconKey: 'zeus_icon' }
    ];
    this.delivered = [0, 0, 0];

    // Create simple UI panels left and right to house gods and highscores
    const panelHeight = Math.min(this.rows * this.tile + 16, this.scale.height - 32);

    // left panel: prefer to the left of the grid, else inside left margin
    let leftPanelX = Math.floor(this.offsetX - this.panelWidth - this.panelPadding);
    if (leftPanelX < this.panelPadding) leftPanelX = this.panelPadding;
    const leftPanelY = Math.floor(this.offsetY);
    this.leftPanel = this.add.rectangle(leftPanelX + this.panelWidth / 2, leftPanelY + panelHeight / 2, this.panelWidth, panelHeight, 0x111111).setScrollFactor(0).setDepth(45);

    // right panel: prefer to the right of the grid, else inside right margin
    let rightPanelX = Math.floor(this.offsetX + this.cols * this.tile + this.panelPadding);
    if (rightPanelX + this.panelWidth > this.scale.width - this.panelPadding) rightPanelX = this.scale.width - this.panelWidth - this.panelPadding;
    const rightPanelY = Math.floor(this.offsetY);
    this.rightPanel = this.add.rectangle(rightPanelX + this.panelWidth / 2, rightPanelY + panelHeight / 2, this.panelWidth, panelHeight, 0x111111).setScrollFactor(0).setDepth(45);

    // inner coordinates for placing UI elements
    const leftInnerX = leftPanelX + 12;
    let leftInnerY = leftPanelY + 12;
    const rightInnerX = rightPanelX + 12;
    this.hsStartY = rightPanelY + 12;

    // Create simple UI for gods on left (stacked in the left panel)
    this.uiGroup = this.add.group();
    const uiBarWidth = this.panelWidth - 32;
    const segmentCount = 5;
    for (let i = 0; i < this.gods.length; i++) {
      const gx = leftInnerX;
      const gy = leftInnerY + i * 60;
      const gw = uiBarWidth;
      const gh = 45;
      const bg = this.add.rectangle(gx + gw / 2, gy + gh / 2, gw, gh, 0x222222).setOrigin(0.5).setScrollFactor(0).setDepth(50);
      
      // Create segmented bar background
      const barStartX = gx + 8;
      const barY = gy + gh / 2 + 8;
      const totalBarWidth = gw - 16;
      const segmentWidth = Math.floor((totalBarWidth - (segmentCount - 1) * 2) / segmentCount);
      const segmentHeight = 16;
      
      const segments = [];
      for (let s = 0; s < segmentCount; s++) {
        const segX = barStartX + s * (segmentWidth + 2);
        const segBg = this.add.rectangle(segX, barY, segmentWidth, segmentHeight, 0x333333).setOrigin(0, 0.5).setScrollFactor(0).setDepth(51);
        const segBar = this.add.rectangle(segX, barY, 0, segmentHeight, this.gods[i].color).setOrigin(0, 0.5).setScrollFactor(0).setDepth(52);
        segments.push({ bg: segBg, bar: segBar, width: segmentWidth });
      }

      const iconSize = 18;
      let nameX = gx + 8;
      const iconKey = this.gods[i].iconKey;
      let icon;
      if (iconKey && this.textures.exists(iconKey)) {
        icon = this.add.image(gx + 8 + iconSize / 2, gy + 8 + iconSize / 2, iconKey)
          .setDisplaySize(iconSize, iconSize)
          .setOrigin(0.5)
          .setScrollFactor(0)
          .setDepth(53);
        nameX += iconSize + 6;
      }

      const name = this.add.text(nameX, gy + 8, `${this.gods[i].name}`, { font: '14px monospace', fill: '#ffffff' }).setScrollFactor(0).setDepth(53);
      this.gods[i].ui = { segments, totalBarWidth };
      this.uiGroup.addMultiple([bg, name, ...segments.map(s => s.bg), ...segments.map(s => s.bar)]);
      if (icon) this.uiGroup.add(icon);
    }

    const instructionsY = leftInnerY + this.gods.length * 60 + 8;
    const instructions = 'Instructions:\nGive offerings to the gods.\nAvoid the minotaur.';
    this.instructionsText = this.add.text(leftInnerX, instructionsY, instructions, { font: '12px monospace', fill: '#ffffff', wordWrap: { width: uiBarWidth } })
      .setScrollFactor(0)
      .setDepth(53);


    // Score
    this.score = 0;
    this.highscore = this.getHighscore();
    this.scoreText = this.add.text(this.scale.width - 12, 12, `Score: ${this.score}`, { font: '16px monospace', fill: '#ffffff' }).setOrigin(1, 0).setScrollFactor(0).setDepth(60);

    this.lives = 3;
    this.minotaurHitCooldown = false;
    this.livesText = this.add.text(this.scale.width - 12, 32, `Lives: ${this.lives}`, { font: '14px monospace', fill: '#ffffff' }).setOrigin(1, 0).setScrollFactor(0).setDepth(60);

    // store right panel inner x for highscores rendering
    this.hsX = rightInnerX;

    // Render highscore list on right
    this.renderHighscores();

    // Spawn offerings periodically
    this.spawnTimer = this.time.addEvent({ delay: 1500, callback: this.spawnOffering, callbackScope: this, loop: true });

    // Prepare spawn sequence so offerings appear in randomized permutations of types
    this.spawnSeq = this.shuffleArray([0, 1, 2]);
    this.spawnSeqIndex = 0;

    // Store initial waypoints for minotaur patrolling
    this.origMinotaurWaypoints = JSON.parse(JSON.stringify(this.minotaurWaypoints));

    // Increase gods anger every second
    this.angerTimer = this.time.addEvent({ delay: 1000, callback: this.increaseAnger, callbackScope: this, loop: true });

    // Input: use keydown events for single-step movement
    this.input.keyboard.on('keydown', (event) => {
      if (this.isMoving) return;
      const k = (event.key || '').toLowerCase();

      let dx = 0, dy = 0;
      if (k === 'arrowleft' || k === 'a') dx = -1;
      else if (k === 'arrowright' || k === 'd') dx = 1;
      else if (k === 'arrowup' || k === 'w') dy = -1;
      else if (k === 'arrowdown' || k === 's') dy = 1;
      if (dx !== 0 || dy !== 0) this.tryMove(dx, dy);
    });

    const os = this.sys && this.sys.game && this.sys.game.device && this.sys.game.device.os;
    const isMobile = os && (os.android || os.iOS || os.iPad || os.iPhone || os.windowsPhone);
    if (isMobile) this.createDPad();

    // Small instructions and debug text
    this.debugText = this.add.text(12, 12, 'Use arrow keys or WASD to move.', { font: '14px monospace', fill: '#ffffff' }).setScrollFactor(0).setDepth(20);

    // Start background music
    if (!this.sound.get('bgMusic')) {
      this.bgMusic = this.sound.add('bgMusic', { loop: true, volume: 0.5 });
      this.bgMusic.play();
    }

    console.log('GridScene.create end - player at', px, py);
    } catch (e) {
      console.error('GridScene.create error', e);
      // avoid referencing `this` here because it may be undefined when create was called with wrong context
      return;
    }
  }

  cellCenterX(c) {
    return this.offsetX + c * this.tile + this.tile / 2;
  }
  cellCenterY(r) {
    return this.offsetY + r * this.tile + this.tile / 2;
  }

  getPlayerTextureKey(direction = 0) {
    const set = this.playerSpriteSet || 'base';
    if (direction === -1) {
      return set === 'base' ? 'player_run_left' : `${set}_run_left`;
    }
    if (direction === 1) {
      return set === 'base' ? 'player_run_right' : `${set}_run_right`;
    }
    return set === 'base' ? 'player_stood' : `${set}_stood`;
  }

  findTempleByArea(col, row, size) {
    if (!this.temples) return null;
    for (let rr = row; rr < row + size; rr++) {
      for (let cc = col; cc < col + size; cc++) {
        const temple = this.findTempleByCell(cc, rr);
        if (temple) return temple;
      }
    }
    return null;
  }

  findTempleByCell(col, row) {
    if (!this.temples) return null;
    return this.temples.find(t => t.cells.some(c => c.col === col && c.row === row)) || null;
  }

  isTempleEntrance(temple, col, row) {
    if (!temple || !temple.entrances) return false;
    return temple.entrances.some(e => e.col === col && e.row === row);
  }

  isTempleEntranceArea(temple, col, row, size) {
    if (!temple || !temple.entrances) return false;
    // Check if any of the player's cells overlap with any entrance cell
    for (let rr = row; rr < row + size; rr++) {
      for (let cc = col; cc < col + size; cc++) {
        if (temple.entrances.some(e => e.col === cc && e.row === rr)) return true;
      }
    }
    return false;
  }

  spawnOffering() {
    // ensure spawn sequence exists
    if (!this.spawnSeq || !Array.isArray(this.spawnSeq) || this.spawnSeq.length !== 3) {
      this.spawnSeq = this.shuffleArray([0, 1, 2]);
      this.spawnSeqIndex = 0;
    }

    // find random empty 2x2 area not on perimeter for offering
    const maxAttempts = 50;
    const offeringCellsSize = 2; // 2x2 cells for offerings (4 cells total)
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const c = Phaser.Math.Between(1, this.cols - offeringCellsSize - 1);
      const r = Phaser.Math.Between(1, this.rows - offeringCellsSize - 1);
      
      // Check if all 2x2 cells are available
      let canPlace = true;
      for (let rr = r; rr < r + offeringCellsSize; rr++) {
        for (let cc = c; cc < c + offeringCellsSize; cc++) {
          if (this.wallGrid[rr][cc]) { canPlace = false; break; }
          if (this.templeOccupied && this.templeOccupied.has(`${cc},${rr}`)) { canPlace = false; break; }
          if (this.offerings.some(o => o.cells && o.cells.some(cell => cell.col === cc && cell.row === rr))) { canPlace = false; break; }
          // Check if overlaps with player's 2x2 area
          if (cc >= this.playerGridCol && cc < this.playerGridCol + this.playerCellsSize &&
              rr >= this.playerGridRow && rr < this.playerGridRow + this.playerCellsSize) {
            canPlace = false;
            break;
          }
        }
        if (!canPlace) break;
      }
      
      if (!canPlace) continue;

      // choose type from sequence, advance index
      const type = this.spawnSeq[this.spawnSeqIndex];
      this.spawnSeqIndex += 1;
      if (this.spawnSeqIndex >= this.spawnSeq.length) {
        this.spawnSeq = this.shuffleArray([0, 1, 2]);
        this.spawnSeqIndex = 0;
      }

      const ox = this.offsetX + (c + offeringCellsSize/2) * this.tile;
      const oy = this.offsetY + (r + offeringCellsSize/2) * this.tile;
      const sizePx = this.tile * offeringCellsSize;
      
      // choose offering key from precomputed offeringKeys to prefer provided images
      const offerKey = (this.offeringKeys && this.offeringKeys[type]) ? this.offeringKeys[type] : ('off' + type);
      // fill 2x2 cells with the offering sprite
      const sprite = this.add.image(ox, oy, offerKey).setDisplaySize(sizePx, sizePx).setOrigin(0.5).setDepth(15);

      // offering object with removal scheduling - store top-left corner and mark all 2x2 cells
      const lifespan = 7000; // ms the offering will remain on the map (7 seconds)
      const cells = [];
      for (let rr = r; rr < r + offeringCellsSize; rr++) {
        for (let cc = c; cc < c + offeringCellsSize; cc++) {
          cells.push({col: cc, row: rr});
        }
      }
      
      const offering = { col: c, row: r, cells, type, sprite, _removeTimer: null, _flashTween: null, _finalTimer: null };
      // schedule a flash shortly before removal
      const flashLead = 1000; // start flashing 1s before removal
      if (lifespan > flashLead) {
        offering._removeTimer = this.time.delayedCall(lifespan - flashLead, () => {
          // start flashing tween
          offering._flashTween = this.tweens.add({
            targets: offering.sprite,
            alpha: 0,
            ease: 'Linear',
            duration: 150,
            yoyo: true,
            repeat: Math.floor(flashLead / 150 / 2)
          });
        }, null, this);
      }
      // final removal
      offering._finalTimer = this.time.delayedCall(lifespan, () => {
        this.removeOffering(offering);
      }, null, this);

      this.offerings.push(offering);
      return;
    }
  }

  removeOffering(offering) {
    if (!offering) return;
    // cancel timers/tweens
    if (offering._removeTimer) offering._removeTimer.remove(false);
    if (offering._finalTimer) offering._finalTimer.remove(false);
    if (offering._flashTween) offering._flashTween.stop();
    // remove sprite
    if (offering.sprite && offering.sprite.destroy) offering.sprite.destroy();
    // remove from array
    const idx = this.offerings.indexOf(offering);
    if (idx !== -1) this.offerings.splice(idx, 1);
  }

  increaseAnger() {
    for (let i = 0; i < this.gods.length; i++) {
      this.gods[i].anger += this.gods[i].rate;
      if (this.gods[i].anger > 100) this.gods[i].anger = 100;
      // update segmented UI
      const angerPercent = this.gods[i].anger / 100;
      const segments = this.gods[i].ui.segments;
      const segmentCount = segments.length;
      
      for (let s = 0; s < segmentCount; s++) {
        const segmentStartPercent = s / segmentCount;
        const segmentEndPercent = (s + 1) / segmentCount;
        
        if (angerPercent >= segmentEndPercent) {
          // segment completely full
          segments[s].bar.width = segments[s].width;
        } else if (angerPercent > segmentStartPercent) {
          // segment partially full
          const fillPercent = (angerPercent - segmentStartPercent) / (1 / segmentCount);
          segments[s].bar.width = segments[s].width * fillPercent;
        } else {
          // segment empty
          segments[s].bar.width = 0;
        }
      }
    }
    this.scoreText.setText(`Score: ${this.score}`);
    // check lose conditions - end game when any god's anger reaches 100
    for (let i = 0; i < this.gods.length; i++) {
      if (this.gods[i].anger >= 100) {
        this.endGame(false, i);
        return;
      }
    }
  }

  endGame(win, angryGodIndex, reason) {
    if (this._ended) return;
    this._ended = true;
    
    let msg = 'Game Over';
    let subMsg = '';
    let subMsgColor = '#ff6666';

    if (this.sound && !this.sound.get('gameOver')) {
      this.sound.play('gameOver', { volume: 0.8 });
    }

    if (reason === 'minotaur') {
      subMsg = 'CAUGHT BY THE MINOTAUR!';
      subMsgColor = '#ff3333';
    }
    
    if (!win && angryGodIndex !== undefined && angryGodIndex !== null) {
      // God-specific loss messages
      const godMessages = [
        ['IS DISPLEASED!', 'DOUBTS YOUR DEVOTION!', 'QUESTIONS YOUR FAITH!', 'FEELS NEGLECTED!'],
        ['IS DISPLEASED!', 'DOUBTS YOUR DEVOTION!', 'RAGES AGAINST YOU!', 'LOSES PATIENCE!'],
        ['IS DISPLEASED!', 'DOUBTS YOUR DEVOTION!', 'DEMANDS TRIBUTE!', 'GROWS IMPATIENT!']
      ];
      const godName = this.gods[angryGodIndex].name.toUpperCase();
      const messages = godMessages[angryGodIndex];
      const randomMsg = messages[Math.floor(Math.random() * messages.length)];
      subMsg = `${godName} ${randomMsg}`;
      
      // Get god's color and convert to hex string
      const godColor = this.gods[angryGodIndex].color;
      subMsgColor = '#' + godColor.toString(16).padStart(6, '0');
    }
    
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;
    this.add.rectangle(cx, cy, 400, 180, 0x111111).setDepth(200);
    this.add.text(cx, cy - 50, msg, { font: '32px monospace', fill: '#ffffff' }).setOrigin(0.5).setDepth(201);
    
    if (subMsg) {
      const subText = this.add.text(cx, cy - 10, subMsg, { font: '18px monospace', fill: subMsgColor }).setOrigin(0.5).setDepth(201);
      if (angryGodIndex !== undefined && angryGodIndex !== null) {
        const iconKey = this.gods[angryGodIndex] && this.gods[angryGodIndex].iconKey;
        if (iconKey && this.textures.exists(iconKey)) {
          const iconSize = 66;
          const offset = (iconSize + 6) / 2;
          subText.x = cx + offset;
          const leftEdge = subText.x - subText.width / 2;
          this.add.image(leftEdge - iconSize / 2 - 6, cy - 10, iconKey)
            .setDisplaySize(iconSize, iconSize)
            .setOrigin(0.5)
            .setDepth(201);
        }
      }
    }

    // stop timers
    if (this.spawnTimer) this.spawnTimer.remove(false);
    if (this.angerTimer) this.angerTimer.remove(false);
    
    // stop background music
    if (this.bgMusic) {
      this.bgMusic.stop();
    }

    // high score handling based on this.score
    if (this.score > this.highscore) {
      this.highscore = this.score;
      localStorage.setItem('highscoreValue', String(this.highscore));
    }

    // Try Again button (create before prompting so click works)
    const btnW = 140; const btnH = 40;
    const btn = this.add.rectangle(cx, cy + 50, btnW, btnH, 0x333333).setDepth(205).setInteractive({ useHandCursor: true });
    const btnText = this.add.text(cx, cy + 50, 'Try Again', { font: '18px monospace', fill: '#ffffff' }).setOrigin(0.5).setDepth(206);

    // schedule initials prompt shortly after showing popup (allows immediate Try Again click)
    this._promptTimer = this.time.delayedCall(1200, () => this.promptInitials(this.score), null, this);

    btn.on('pointerup', () => {
      // cancel scheduled prompt if present
      if (this._promptTimer) {
        this._promptTimer.remove(false);
        this._promptTimer = null;
      }
      // fully restart the scene by starting it again (ensures clean state)
      this.scene.start('GridScene');
    });
  }

  promptInitials(score) {
    // Use a simple browser prompt to avoid external plugin dependency
    try {
      const input = window.prompt('Enter your initials (3 letters):', 'AAA') || 'AAA';
      const trimmed = input.trim().toUpperCase().slice(0, 3) || 'AAA';
      this.saveScoreWithInitials(score, trimmed);
      // show saved message
      this.add.text(this.scale.width / 2, this.scale.height / 2 + 80, `Saved: ${trimmed} - ${score}`, { font: '18px monospace', fill: '#ffff00' }).setOrigin(0.5).setDepth(202);
    } catch (e) {
      // fallback: still save with default initials
      this.saveScoreWithInitials(score, 'AAA');
    }
    // do not auto-restart here; user can click Try Again
  }

  saveScoreWithInitials(score, initials) {
    // Maintain a top-10 list in localStorage under 'highscores'
    const key = 'highscores_v1';
    const raw = localStorage.getItem(key);
    let list = [];
    if (raw) {
      try { list = JSON.parse(raw); } catch (e) { list = []; }
    }
    list.push({ initials, score, date: new Date().toISOString() });
    // sort desc and keep top 10
    list.sort((a, b) => b.score - a.score);
    list = list.slice(0, 10);
    localStorage.setItem(key, JSON.stringify(list));
  }

  getHighscore() {
    const raw = localStorage.getItem('highscores_v1');
    if (!raw) return 0;
    try {
      const list = JSON.parse(raw);
      if (Array.isArray(list) && list.length > 0) return list[0].score || 0;
    } catch (e) { }
    return 0;
  }

  renderHighscores() {
    const key = 'highscores_v1';
    const raw = localStorage.getItem(key);
    let list = [];
    if (raw) {
      try { list = JSON.parse(raw); } catch (e) { list = []; }
    }

    // destroy previous highscore display objects if any
    if (this.highscoreItems && Array.isArray(this.highscoreItems)) {
      for (let i = 0; i < this.highscoreItems.length; i++) {
        const it = this.highscoreItems[i];
        if (it && it.destroy) it.destroy();
      }
    }
    this.highscoreItems = [];

    const title = this.add.text(this.hsX, this.hsStartY - 24, 'Highscores', { font: '14px monospace', fill: '#ffff66' }).setOrigin(0, 0).setScrollFactor(0).setDepth(60);
    this.highscoreItems.push(title);

    for (let i = 0; i < Math.min(10, list.length); i++) {
      const item = list[i];
      const y = this.hsStartY + i * 20;
      const text = this.add.text(this.hsX, y, `${i + 1}. ${item.initials} ${item.score}`, { font: '12px monospace', fill: '#ffffff' }).setOrigin(0, 0).setScrollFactor(0).setDepth(60);
      this.highscoreItems.push(text);
    }
  }

  // Fisher-Yates shuffle
  shuffleArray(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  tryMove(dx, dy) {
    const targetCol = this.playerGridCol + dx;
    const targetRow = this.playerGridRow + dy;
    
    // bounds check for 2x2 player
    if (targetCol < 0 || targetCol + this.playerCellsSize > this.cols || 
        targetRow < 0 || targetRow + this.playerCellsSize > this.rows) return;

    const targetTemple = this.findTempleByArea(targetCol, targetRow, this.playerCellsSize);

    // Check if any of the 2x2 cells are blocked (temples are pass-through)
    if (!targetTemple) {
      for (let rr = targetRow; rr < targetRow + this.playerCellsSize; rr++) {
        for (let cc = targetCol; cc < targetCol + this.playerCellsSize; cc++) {
          if (this.wallGrid[rr] && this.wallGrid[rr][cc]) return;
        }
      }
    }

    this.isMoving = true;
    this.playerGridCol = targetCol;
    this.playerGridRow = targetRow;

    const tx = this.offsetX + (targetCol + this.playerCellsSize/2) * this.tile;
    const ty = this.offsetY + (targetRow + this.playerCellsSize/2) * this.tile;

    // Update player sprite based on direction
    if (dx < 0) {
      // Moving left
      this.playerDirection = -1;
      const textureKey = this.getPlayerTextureKey(-1);
      if (this.textures.exists(textureKey)) {
        this.player.setTexture(textureKey);
      }
    } else if (dx > 0) {
      // Moving right
      this.playerDirection = 1;
      const textureKey = this.getPlayerTextureKey(1);
      if (this.textures.exists(textureKey)) {
        this.player.setTexture(textureKey);
      }
    }

    this.tweens.add({
      targets: [this.player, this.playerMarker],
      x: tx,
      y: ty,
      duration: this.moveDuration,
      ease: 'Linear',
      onComplete: () => {
        this.isMoving = false;
        // Set to stood sprite when movement completes
        const textureKey = this.getPlayerTextureKey(0);
        if (this.textures.exists(textureKey)) {
          this.player.setTexture(textureKey);
        }
        this.playerDirection = 0;
        this.checkCellInteraction();
      }
    });
  }

  checkCellInteraction() {
    // Check if any of the player's 2x2 cells overlap with any of the offering's cells
    let foundIdx = -1;
    for (let i = 0; i < this.offerings.length && foundIdx === -1; i++) {
      const offering = this.offerings[i];
      for (let rr = this.playerGridRow; rr < this.playerGridRow + this.playerCellsSize && foundIdx === -1; rr++) {
        for (let cc = this.playerGridCol; cc < this.playerGridCol + this.playerCellsSize && foundIdx === -1; cc++) {
          if (offering.cells.some(cell => cell.col === cc && cell.row === rr)) {
            foundIdx = i;
          }
        }
      }
    }
    
    if (foundIdx !== -1 && this.carry === null) {
      const offering = this.offerings[foundIdx];
      this.carry = offering.type;
      // properly remove offering (cancels timers/tweens and destroys sprite)
      this.removeOffering(offering);
      // set player sprite set by offering type
      if (this.carry === 0) this.playerSpriteSet = 'red';
      else if (this.carry === 1) this.playerSpriteSet = 'blue';
      else if (this.carry === 2) this.playerSpriteSet = 'yellow';
      const textureKey = this.getPlayerTextureKey(0);
      if (this.textures.exists(textureKey)) {
        this.player.setTexture(textureKey);
      }
      return;
    }

    // Check if any of the player's 2x2 cells overlap with temple
    let currentTemple = null;
    for (let rr = this.playerGridRow; rr < this.playerGridRow + this.playerCellsSize && !currentTemple; rr++) {
      for (let cc = this.playerGridCol; cc < this.playerGridCol + this.playerCellsSize && !currentTemple; cc++) {
        currentTemple = this.findTempleByCell(cc, rr);
      }
    }
    
    if (currentTemple && this.carry !== null) {
      const overlapsCenter = currentTemple.centerCells && currentTemple.centerCells.some(cell => {
        return cell.col >= this.playerGridCol && cell.col < this.playerGridCol + this.playerCellsSize &&
               cell.row >= this.playerGridRow && cell.row < this.playerGridRow + this.playerCellsSize;
      });
      if (overlapsCenter && currentTemple.index === this.carry) {
        // successful delivery: award points
        const pointsPerDelivery = 1000;
        this.score += pointsPerDelivery;

        // increment delivered count for that god and total
        if (typeof this.delivered[currentTemple.index] === 'number') this.delivered[currentTemple.index] += 1;

        // reduce anger
        this.gods[this.carry].anger = Math.max(0, this.gods[this.carry].anger - 15);

        if (currentTemple.rect) {
          this.tweens.add({
            targets: currentTemple.rect,
            alpha: 0.2,
            duration: 120,
            yoyo: true,
            repeat: 2,
            onComplete: () => { currentTemple.rect.alpha = 1; }
          });
        }
        
        // update segmented UI
        const angerPercent = this.gods[this.carry].anger / 100;
        const segments = this.gods[this.carry].ui.segments;
        const segmentCount = segments.length;
        
        for (let s = 0; s < segmentCount; s++) {
          const segmentStartPercent = s / segmentCount;
          const segmentEndPercent = (s + 1) / segmentCount;
          
          if (angerPercent >= segmentEndPercent) {
            // segment completely full
            segments[s].bar.width = segments[s].width;
          } else if (angerPercent > segmentStartPercent) {
            // segment partially full
            const fillPercent = (angerPercent - segmentStartPercent) / (1 / segmentCount);
            segments[s].bar.width = segments[s].width * fillPercent;
          } else {
            // segment empty
            segments[s].bar.width = 0;
          }
        }
        
        // clear carry
        this.carry = null;
        this.playerSpriteSet = 'base';
        const stoodKey = this.getPlayerTextureKey(0);
        if (this.textures.exists(stoodKey)) {
          this.player.setTexture(stoodKey);
        }
        // update score text
        if (this.scoreText) this.scoreText.setText(`Score: ${this.score}`);
      }
      return;
    }

    // check minotaur collision: check if any of the player's 2x2 cells overlap with any of minotaur's 2x2 cells
    for (let pr = this.playerGridRow; pr < this.playerGridRow + this.playerCellsSize; pr++) {
      for (let pc = this.playerGridCol; pc < this.playerGridCol + this.playerCellsSize; pc++) {
        for (let mr = this.minotaurGridRow; mr < this.minotaurGridRow + this.minotaurCellsSize; mr++) {
          for (let mc = this.minotaurGridCol; mc < this.minotaurGridCol + this.minotaurCellsSize; mc++) {
            if (pc === mc && pr === mr) {
              if (this.minotaurHitCooldown) return;
              this.minotaurHitCooldown = true;
              this.lives = Math.max(0, this.lives - 1);
              if (this.livesText) this.livesText.setText(`Lives: ${this.lives}`);
              const flash = this.add.rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 0xff0000, 0.6).setDepth(300);
              this.tweens.add({
                targets: flash,
                alpha: 0,
                duration: 300,
                ease: 'Linear',
                onComplete: () => flash.destroy()
              });
              if (this.lives <= 0) {
                this.endGame(false, null, 'minotaur');
              } else {
                this.time.delayedCall(600, () => { this.minotaurHitCooldown = false; }, null, this);
              }
              return;
            }
          }
        }
      }
    }
  }

  update(time, delta) {
    // Update debug text with player grid position
    if (this.debugText) {
      this.debugText.setText(`Use arrow keys or WASD to move. Player cell: ${this.playerGridCol}, ${this.playerGridRow}`);
    }

    // marker follows via tween/position, ensure synced
    if (this.player && this.playerMarker) {
      this.playerMarker.x = this.player.x;
      this.playerMarker.y = this.player.y;
    }

    if (!this._ended && this.gods) {
      const angryIndex = this.gods.findIndex(god => god.anger >= 100);
      if (angryIndex !== -1) {
        this.endGame(false, angryIndex);
        return;
      }
    }

    // Minotaur path-following logic: compute path to current target waypoint using simple BFS
    if (!this.minotaurMoving) {
      // if no current path, build path to next waypoint
      if (!this.minotaurPath || this.minotaurPath.length === 0) {
        const targetWp = this.minotaurWaypoints[this.minotaurWaypointIndex];
        // compute BFS path from current minotaur cell to targetWp avoiding wallGrid cells
        const path = this._findPathBFS(this.minotaurGridCol, this.minotaurGridRow, targetWp.col, targetWp.row);
        if (path && path.length > 0) {
          // remove first step if it's the current cell
          if (path[0].col === this.minotaurGridCol && path[0].row === this.minotaurGridRow) path.shift();
          this.minotaurPath = path;
        } else {
          // no path found: advance to next waypoint to avoid stuck
          this.minotaurWaypointIndex = (this.minotaurWaypointIndex + 1) % this.minotaurWaypoints.length;
        }
      }

      // if we have a path, step one cell along it
      if (this.minotaurPath && this.minotaurPath.length > 0) {
        const step = this.minotaurPath.shift();
        this.minotaurMoving = true;
        const tx = this.offsetX + (step.col + this.minotaurCellsSize / 2) * this.tile;
        const ty = this.offsetY + (step.row + this.minotaurCellsSize / 2) * this.tile;
        this.tweens.add({
          targets: this.minotaur,
          x: tx,
          y: ty,
          duration: this.minotaurMoveDuration,
          ease: 'Linear',
          onComplete: () => {
            this.minotaurMoving = false;
            this.minotaurGridCol = step.col;
            this.minotaurGridRow = step.row;
            // if path exhausted, advance to next waypoint
            if (!this.minotaurPath || this.minotaurPath.length === 0) {
              this.minotaurWaypointIndex = (this.minotaurWaypointIndex + 1) % this.minotaurWaypoints.length;
            }
          }
        });
      }
    }
  }

  // Simple BFS pathfinder on the grid avoiding wallGrid cells
  _findPathBFS(startCol, startRow, goalCol, goalRow) {
    const cols = this.cols, rows = this.rows;
    const blocked = this.wallGrid;
    const key = (c, r) => `${c},${r}`;
    const q = [];
    const visited = new Set();
    const parent = new Map();
    q.push({c: startCol, r: startRow});
    visited.add(key(startCol, startRow));
    while (q.length > 0) {
      const cur = q.shift();
      if (cur.c === goalCol && cur.r === goalRow) break;
      const neigh = [
        {c: cur.c+1, r: cur.r},
        {c: cur.c-1, r: cur.r},
        {c: cur.c, r: cur.r+1},
        {c: cur.c, r: cur.r-1}
      ];
      for (const n of neigh) {
        if (n.c < 0 || n.c >= cols || n.r < 0 || n.r >= rows) continue;
        if (visited.has(key(n.c,n.r))) continue;
        if (blocked[n.r] && blocked[n.r][n.c]) continue; // skip walls/voids
        visited.add(key(n.c,n.r));
        parent.set(key(n.c,n.r), cur);
        q.push({c: n.c, r: n.r});
      }
    }
    // reconstruct path
    const goalKey = key(goalCol, goalRow);
    if (!visited.has(goalKey)) return null;
    const path = [];
    let curKey = goalKey;
    let curParts = curKey.split(',').map(Number);
    while (!(curParts[0] === startCol && curParts[1] === startRow)) {
      path.unshift({ col: curParts[0], row: curParts[1] });
      const p = parent.get(curKey);
      if (!p) break;
      curKey = key(p.c, p.r);
      curParts = curKey.split(',').map(Number);
    }
    return path;
  }

  createDPad() {
    const size = 28;
    const spacing = 8;
    const offset = size * 2 + spacing;
    const centerX = this.scale.width - Math.max(72, this.panelPadding + 60);
    const centerY = this.scale.height - 120;
    const style = { font: '16px monospace', fill: '#ffffff' };

    const makeButton = (x, y, dx, dy, label) => {
      const btn = this.add.circle(x, y, size, 0x000000, 0.35)
        .setStrokeStyle(2, 0xffffff, 0.8)
        .setScrollFactor(0)
        .setDepth(80)
        .setInteractive({ useHandCursor: false });
      const text = this.add.text(x, y, label, style).setOrigin(0.5).setScrollFactor(0).setDepth(81);
      btn.on('pointerdown', () => {
        if (!this.isMoving) this.tryMove(dx, dy);
      });
      return [btn, text];
    };

    this.dpadItems = [];
    this.dpadItems.push(...makeButton(centerX, centerY - offset, 0, -1, '?'));
    this.dpadItems.push(...makeButton(centerX - offset, centerY, -1, 0, '?'));
    this.dpadItems.push(...makeButton(centerX + offset, centerY, 1, 0, '?'));
    this.dpadItems.push(...makeButton(centerX, centerY + offset, 0, 1, '?'));
  }

}
window.GridScene = GridScene;
