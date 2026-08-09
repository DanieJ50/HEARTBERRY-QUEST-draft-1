document.addEventListener('DOMContentLoaded', () => {
  const BOARD_SIZE = 6;
  const BERRY_TYPES = ['red', 'blue', 'yellow', 'green', 'purple'];
  const BERRY_ICONS = {
    red: '🍓',
    blue: '🫐',
    yellow: '🍋',
    green: '🍏',
    purple: '🍇'
  };

  let board = [];
  let score = 0;
  let moves = 20;
  let charge = 0;
  let targetRedMatched = 0;
  const TARGET_GOAL = 15;

  let firstSelectedTile = null;

  const boardElement = document.getElementById('game-board');
  const scoreDisplay = document.getElementById('score-display');
  const movesDisplay = document.getElementById('moves-display');
  const goalDisplay = document.getElementById('goal-display');
  const chargeMeter = document.getElementById('charge-meter');
  const meterText = document.getElementById('meter-text');
  const abilityBtn = document.getElementById('ability-btn');
  const modalOverlay = document.getElementById('modal-overlay');
  const modalTitle = document.getElementById('modal-title');
  const modalDesc = document.getElementById('modal-desc');
  const restartBtn = document.getElementById('restart-btn');

  // Initialize Game
  function initGame() {
    score = 0;
    moves = 20;
    charge = 0;
    targetRedMatched = 0;
    firstSelectedTile = null;
    modalOverlay.classList.add('overlay-hidden');
    updateUI();
    createBoard();
  }

  // Create initial grid without pre-existing matches
  function createBoard() {
    boardElement.innerHTML = '';
    board = [];

    for (let r = 0; r < BOARD_SIZE; r++) {
      let row = [];
      for (let c = 0; c < BOARD_SIZE; c++) {
        let type;
        do {
          type = getRandomBerry();
        } while (
          (c >= 2 && row[c - 1] === type && row[c - 2] === type) ||
          (r >= 2 && board[r - 1][c] === type && board[r - 2][c] === type)
        );

        row.push(type);
      }
      board.push(row);
    }
    renderBoard();
  }

  function getRandomBerry() {
    return BERRY_TYPES[Math.floor(Math.random() * BERRY_TYPES.length)];
  }

  // Render DOM nodes for tiles
  function renderBoard() {
    boardElement.innerHTML = '';
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const tile = document.createElement('div');
        const type = board[r][c];
        tile.className = `tile tile-${type}`;
        tile.dataset.row = r;
        tile.dataset.col = c;
        tile.textContent = BERRY_ICONS[type];

        tile.addEventListener('click', onTileClick);
        boardElement.appendChild(tile);
      }
    }
  }

  // Tile Selection Logic
  function onTileClick(e) {
    if (moves <= 0) return;

    const clickedTile = e.currentTarget;
    const r = parseInt(clickedTile.dataset.row);
    const c = parseInt(clickedTile.dataset.col);

    if (!firstSelectedTile) {
      firstSelectedTile = { r, c, element: clickedTile };
      clickedTile.classList.add('selected');
    } else {
      const prevR = firstSelectedTile.r;
      const prevC = firstSelectedTile.c;

      // Check adjacency
      const isAdjacent =
        (Math.abs(prevR - r) === 1 && prevC === c) ||
        (Math.abs(prevC - c) === 1 && prevR === r);

      firstSelectedTile.element.classList.remove('selected');

      if (isAdjacent) {
        swapTiles(prevR, prevC, r, c);
      } else {
        firstSelectedTile = { r, c, element: clickedTile };
        clickedTile.classList.add('selected');
      }
    }
  }

  // Swap tiles and evaluate matches
  function swapTiles(r1, c1, r2, c2) {
    let temp = board[r1][c1];
    board[r1][c1] = board[r2][c2];
    board[r2][c2] = temp;

    let matches = checkMatches();

    if (matches.length > 0) {
      moves--;
      processMatches(matches);
    } else {
      // Swap back if invalid move
      temp = board[r1][c1];
      board[r1][c1] = board[r2][c2];
      board[r2][c2] = temp;
      renderBoard();
    }
    firstSelectedTile = null;
  }

  // Find line matches
  function checkMatches() {
    let matchedPositions = new Set();

    // Check rows
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE - 2; c++) {
        let type = board[r][c];
        if (type && type === board[r][c + 1] && type === board[r][c + 2]) {
          matchedPositions.add(`${r},${c}`);
          matchedPositions.add(`${r},${c + 1}`);
          matchedPositions.add(`${r},${c + 2}`);
        }
      }
    }

    // Check columns
    for (let c = 0; c < BOARD_SIZE; c++) {
      for (let r = 0; r < BOARD_SIZE - 2; r++) {
        let type = board[r][c];
        if (type && type === board[r + 1][c] && type === board[r + 2][c]) {
          matchedPositions.add(`${r},${c}`);
          matchedPositions.add(`${r + 1},${c}`);
          matchedPositions.add(`${r + 2},${c}`);
        }
      }
    }

    return Array.from(matchedPositions).map((pos) => {
      const [r, c] = pos.split(',').map(Number);
      return { r, c, type: board[r][c] };
    });
  }

  // Process matches and drop new tiles
  function processMatches(matches) {
    matches.forEach(({ r, c, type }) => {
      if (type === 'red') targetRedMatched++;
      board[r][c] = null;
      score += 10;
      if (charge < 10) charge++;
    });

    dropTiles();
    fillEmptyTiles();
    renderBoard();
    updateUI();

    // Check for cascading matches
    setTimeout(() => {
      let newMatches = checkMatches();
      if (newMatches.length > 0) {
        processMatches(newMatches);
      } else {
        checkGameEnd();
      }
    }, 250);
  }

  function dropTiles() {
    for (let c = 0; c < BOARD_SIZE; c++) {
      for (let r = BOARD_SIZE - 1; r >= 0; r--) {
        if (board[r][c] === null) {
          for (let lookup = r - 1; lookup >= 0; lookup--) {
            if (board[lookup][c] !== null) {
              board[r][c] = board[lookup][c];
              board[lookup][c] = null;
              break;
            }
          }
        }
      }
    }
  }

  function fillEmptyTiles() {
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (board[r][c] === null) {
          board[r][c] = getRandomBerry();
        }
      }
    }
  }

  // Special Helper Ability: Clears Row 3
  abilityBtn.addEventListener('click', () => {
    if (charge < 10) return;

    charge = 0;
    let matches = [];
    let targetRow = 2; // Middle row activation

    for (let c = 0; c < BOARD_SIZE; c++) {
      matches.push({ r: targetRow, c, type: board[targetRow][c] });
    }

    processMatches(matches);
  });

  function updateUI() {
    scoreDisplay.textContent = score;
    movesDisplay.textContent = moves;
    goalDisplay.textContent = `Red Berries: ${Math.min(
      targetRedMatched,
      TARGET_GOAL
    )}/${TARGET_GOAL}`;

    const chargePercentage = (charge / 10) * 100;
    chargeMeter.style.width = `${chargePercentage}%`;
    meterText.textContent = `Charge Meter: ${charge}/10`;

    if (charge >= 10) {
      abilityBtn.disabled = false;
    } else {
      abilityBtn.disabled = true;
    }
  }

  function checkGameEnd() {
    if (targetRedMatched >= TARGET_GOAL) {
      modalTitle.textContent = 'Level Victory!';
      modalDesc.textContent = `You completed the goal with a score of ${score}!`;
      modalOverlay.classList.remove('overlay-hidden');
    } else if (moves <= 0) {
      modalTitle.textContent = 'Out of Moves!';
      modalDesc.textContent = 'Try again to help the Berry Bunch!';
      modalOverlay.classList.remove('overlay-hidden');
    }
  }

  restartBtn.addEventListener('click', initGame);

  // Start initial game instance
  initGame();
});
