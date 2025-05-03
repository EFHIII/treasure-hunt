const layers = 8;
const maxHand = 8;
const TOP_TOOLS = 2;

// sand, rock, mine, shovel, trawel, bomb, bucket, crab
const deckNums = [55, 16, 0, 6, 10, 2, 2, 4];

// chest sprite indicies
const SAND = 0;
const ROCK = 1;
const MINE = 2;
const SHOVEL = 3;
const TROWEL = 4;
const BOMB = 5;
const BUCKET = 6;
const CRAB = 7;
const CHEST = 8;
const BACK = 9;
const BOTTOM = 10;

const gridWidth = 4;
const gridHeight = 3;

const mid = 240; // half screen width

const tw = 45; // texture width
const th = 60; // texture height

const gap = 0; // grid gap

const left = mid - (tw * gridWidth + gap * gridHeight) / 2; // left index of grid

const deck = [];

let board = [];
let hand = [];
let choose = false;

let placing = false;

const mouse = {x: -1, y: -1};
let clicked = false;

let won = false;

for(let i = 0; i < deckNums.length; i++) {
  deck.push(...new Array(deckNums[i]).fill(i));
}

function shuffle(array) {
  let currentIndex = array.length;

  while (currentIndex != 0) {

    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
}

function isTool(id) {
  switch (id) {
    case SHOVEL:
    case TROWEL:
    case BOMB:
    case BUCKET:
      return true;
      break;
    default:
      return false;
  }
}

function hasConsecutiveEmpty(cards, chest) {
  let lastEmpty = false;
  let at = 0;
  for(let l = 0; l < layers; l++) {
    let empty = true;
    for(let i = 0; i < gridWidth * gridHeight; i++) {
      at++;
      if(at === chest) at++;

      if(isTool(cards[at])) empty = false;
    }

    if(empty && lastEmpty) return true;
    lastEmpty = empty;
  }
  return false;
}

function hasTopTools(cards, n) {
  let tt = 0;
  let len = cards.length;
  for(let at = 1; at <= gridWidth * gridHeight; at++) {
    if(isTool(cards[len - at])) tt++;
  }
  return tt >= n;
}

function setupGame() {
  let cards = deck.slice();
  let fair = false, chest;
  while(!fair) {
    shuffle(cards);
    chest = Math.random() * cards.length / 4;
    fair = !hasConsecutiveEmpty(cards, chest) && hasTopTools(cards, TOP_TOOLS);
  }

  let at = 0;

  hand = [];
  board = [];
  for (let y = 0; y < gridHeight; y++) {
    board.push([]);
    for (let x = 0; x < gridWidth; x++) {
      board[y].push([]);
    }
  }

  for(let l = 0; l < layers; l++) {
    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        if(at >= chest) {
          board[y][x].push(CHEST);
          chest = Infinity;
        }
        else board[y][x].push(cards[at++]);

        if(l === layers-1) board[y][x].reverse();
      }
    }
  }

}

setupGame();

function forAllNeighbors(x, y, fn) {
  for(let X = -1; X < 2; X++) {
    if(x + X < 0 || x + X >= gridWidth) continue;
    for(let Y = -1; Y < 2; Y++) {
      if(y + Y < 0 || y + Y >= gridHeight) continue;
      fn(board[y+Y][x+X]);
    }
  }
}

function checkNeighbors(x, y) {
  let height = board[y][x].length;

  for(let X = -1; X < 2; X++) {
    if(x + X < 0 || x + X >= gridWidth) continue;
    for(let Y = -1; Y < 2; Y++) {
      if(y + Y < 0 || y + Y >= gridHeight) continue;
      if(board[y+Y][x+X].length - height > 0) return true;
    }
  }

  return false;
}

function pickupCard(x, y, type) {
  if(hand.length >= maxHand || checkNeighbors(x, y)) return;
  switch(type) {
    case CRAB: return;
    case CHEST:
      // WIN condition
      won = true;
      board = [[[],[],[],[]],[[],[],[],[]],[[],[],[],[]]];
      break;
    case MINE:
      board[y][x].shift();
      forAllNeighbors(x, y, b => b.unshift(SAND));
      break;
    default:
      hand.push(type);
      board[y][x].shift();
  }
}

function activateCard(index, type) {
  switch(type) {
    case SAND:
      return;
    case ROCK:
    case SHOVEL:
    case TROWEL:
    case BOMB:
    case CRAB:
      placing = index;
      break;
    case BUCKET:
      hand = [];
      break;
    case CHEST:
      // WIN condition
      won = true;
      board = [[[],[],[],[]],[[],[],[],[]],[[],[],[],[]]];
      break;
    default:
      console.error(`card type ${type} not supported to activate`);
  }
}

function placeCard(x, y, type) {
  switch(type) {
    case SAND:
      return;
    case ROCK:
    case CRAB:
      board[y][x].unshift(type);
      break;
    case SHOVEL:
      if(board[y][x].length === 0) return;
      choose = {type, x, y, choices: board[y][x].splice(0, 4)};
      break;
    case TROWEL:
      if(board[y][x].length === 0) return;
      choose = {type, x, y, choices: board[y][x].splice(0, 2)};
      break;
    case BOMB:
      forAllNeighbors(x, y, b => b.shift());
      break;
    default:
      console.error(`card type ${type} not supported to place`);
  }
  hand.splice(placing, 1);
  placing = false;
}

function chooseChoice(choice, type) {
  switch(type) {
    case SHOVEL:
    case TROWEL:
      hand.push(choose.choices[choice]);

      if(choose.choices[choice] === CHEST) {
        // WIN condition
        won = true;
        board = [[[],[],[],[]],[[],[],[],[]],[[],[],[],[]]];
      }
      break;
    default:
      console.error(`card type ${placing} not supported to choose`);
  }
  choose = false;
}

function button(x, y, w, h) {
  return mouse.x >= x && mouse.x < x+w && mouse.y >= y && mouse.y < y + h;
}

let cursorType = 'default';

function cursor(style) {
  postMessage({type: 'cursor', style});
}

const hints = [
  {
    name: `Sand`,
    text: `Useless\nCannot be played`
  }, {
    name: 'Rock',
    text: `Obstacle\nDrop by playing it`
  }, {
    name: `Mine`,
    text: `Does not exist`
  }, {
    name: `Shovel`,
    text: `Dig up 4 cards\nPick one to keep\nDiscard the rest`
  }, {
    name: `Trowel`,
    text: `Dig up 2 cards\nPick one to keep\nDiscard the other`
  }, {
    name: `Bomb`,
    text: `Destroy any\nchosen card\nand the 8\nsurrounding cards`
  }, {
    name: `Bucket`,
    text: `Discard your\nwhole hand`
  }, {
    name: `Crab`,
    text: `Can't be picked\nup by hand\nDrop by playing it`
  }, {
    name: `Treasure`,
    text: `Huzzah!\nCollect it to win!`
  }
];

function hint(type) {
  if(won || type === undefined || type >= hints.length) return;

  generalSprite(335, 100, 0, -60, 132, 118);

  centeredBigText(hints[type].name, 335 + 65, 208);

  centeredText(hints[type].text, 335 + 65, 180);
}

function winScreen() {
  //generalSprite(174, 100, 0, -60, 132, 118);

  generalSprite(105, 30, 222, -60, 272, 210);

  centeredBigText(`You found\nthe treasure!`, 174 + 65, 218);

  generalSprite(202, 100, 132, -60, 80, 60);

  if(true) {
    centeredBigText(`Play again`, 174 + 65, 80);
    cursorType = 'pointer';

    if(clicked) {
      clicked = false;
      setupGame();
      won = false;
    }
  }
  else {
    centeredText(`Play again`, 174, 80);

    centeredText(`Next level`, 174+130, 80);
  }
}

won = true;

function runGame() {
  cursorType = 'default';
  if(choose) {
    hint(choose.type);

    let len = choose.choices.length;
    for(let i = 0; i < len; i++) {
      let x = i * (tw + gap) + mid - (tw * len + gap * (len - 1)) / 2;
      let btn = button(x, 100, tw, th);
      if(btn) {
        cursorType = 'pointer';
        hint(choose.choices[i]);
      }

      drawSprite(choose.choices[i], x, 100 + (btn ? 2 : 0));
      if(btn && clicked) {
        chooseChoice(i, choose.type);
        clicked = false;
        break;
      }
    }

    cursor(cursorType);
    clicked = false;
    return;
  }
  if(won) {
    winScreen();
    cursor(cursorType);
    clicked = false;
  }
  for (let x = 0; x < gridWidth; x++) {
    for (let y = 0; y < gridHeight; y++) {
      let stackSize = board[y][x].length;
      let btn = button(left + (tw + gap) * x, 199 + stackSize - (th + gap) * y, tw, th);
      if(btn) {
        cursorType = 'pointer';

        hint(board[y][x][0]);
      }

      if(stackSize === 0) {
        drawSprite(BOTTOM, left + (tw + gap) * x, 199 - (th + gap) * y);
        if(btn && clicked && placing !== false) {
          placeCard(x, y, hand[placing]);
          clicked = false;
        }
        continue;
      }

      drawSprite(BACK, left + (tw + gap) * x, 199 - (th + gap) * y);

      if(btn && !won) {
        drawSprite(board[y][x].length === 1 ? BOTTOM : board[y][x][0], left + (tw + gap) * x, 197 + stackSize - (th + gap) * y, -1, true);
        drawSprite(board[y][x][0], left + (tw + gap) * x, 201 + stackSize - (th + gap) * y, board[y][x].length, checkNeighbors(x, y));
      }
      else {
        drawSprite(board[y][x][0], left + (tw + gap) * x, 198 + stackSize - (th + gap) * y, board[y][x].length, checkNeighbors(x, y));
      }

      if(btn && clicked) {
        if(placing === false) {
          pickupCard(x, y, board[y][x][0]);
        }
        else {
          placeCard(x, y, hand[placing]);
        }
        clicked = false;
      }
    }
  }

  for(let c = 0; c < hand.length; c++) {
    let x = c * (tw + gap) + mid - (tw * hand.length + gap * (hand.length - 1)) / 2;

    let btn = button(x, 5, tw, th);

    if(btn) {
      cursorType = 'pointer';

      hint(hand[c]);
    }

    drawSprite(hand[c], x, 5 + ((btn && !won) || placing === c ? 2 : 0));

    if(btn && clicked && !won) {
      if(placing === c) placing = false;
      else activateCard(c, hand[c]);
      clicked = false;
    }
  }

  if(placing !== false) {
    hint(hand[placing]);
  }

  if(won) {
    winScreen();
  }

  cursor(cursorType);

  clicked = false;
}
