let layers = 8;
const maxHand = 8;
const TOP_TOOLS = 2;

let currentLevel = 0;

let screen = 0;

const deckNums = [
  [55, 16, 0, 6, 10, 2, 2, 4],
  [62, 18, 0, 8, 12, 4, 4, 14, 1, 6, 6, 2, 6]
];

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
const DETECTOR = 9;
const BOULDER = 10;
const CHERRY = 11;
const OCTOPUS = 12;
const INKED = 13;
const BACK = 14;
const BOTTOM = 15;

const gridWidth = 4;
const gridHeight = 3;

const mid = 240; // half screen width

const tw = 45; // texture width
const th = 60; // texture height

const gap = 0; // grid gap

const left = mid - (tw * gridWidth + gap * gridHeight) / 2; // left index of grid

let deck = [];

let board = [];
let hand = [];
let choose = false;

let placing = false;

const mouse = {x: -1, y: -1};
let clicked = false;

let won = false;
let discardedChest = false;
let pushing = false;

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
    case DETECTOR:
    case CHERRY:
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
  deck = [];

  for(let i = 0; i < deckNums[currentLevel].length; i++) {
    deck.push(...new Array(deckNums[currentLevel][i]).fill(i));
  }

  layers = (deck.length + 1) / gridWidth / gridHeight;

  let cards = deck.slice();

  if(cards.length !== layers * gridWidth * gridHeight - 1) {
    console.log(`error: only ${cards.length} of ${layers * gridWidth * gridHeight-1} cards`);
  }

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

  won = false;
  discardedChest = false;
  choose = false;
  placing = false;
  pushing = false;
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
  if(pushing) return board[y][x].length >= board[pushing.y][pushing.x].length || (pushing.x - x < -1 || pushing.y - y < -1 || pushing.x - x > 1 || pushing.y - y > 1);

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
  if((hand.length >= maxHand && type !== BOULDER) || checkNeighbors(x, y)) return;
  switch(type) {
    case CRAB: break;
    case BOULDER:
      pushing = {type, x, y};
      break;
    case CHEST:
      // WIN condition
      won = true;
      hand.push(type);
      board[y][x].shift();
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
    case DETECTOR:
    case CHERRY:
    case OCTOPUS:
    case CHEST:
      placing = index;
      break;
    case BUCKET:
      hand = [];
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
    case OCTOPUS:
    case CHEST:
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
      forAllNeighbors(x, y, b => {
        if(b[0] === CHEST) discardedChest = true;
        b.shift();
      });
      break;
    case DETECTOR:
      if(board[y][x].length === 0) return;
      let good = 0;
      let nextGood = -1;
      for(let i = board[y][x].length - 1; i >= 0; i--) {
        if(isTool(board[y][x][i]) || board[y][x][i] === CHEST) {
          good++;
          nextGood = i;
        }
      }
      if(nextGood >= 0) {
        info = `\nGood cards in stack\n${good}\n\nNext good card at\n${board[y][x].length - nextGood}`;
      }
      else {
        info = `\nGood cards in stack\n${good}`;
      }
      break;
    case CHERRY:
      forAllNeighbors(x, y, b => {
        if(b[0] === CHEST) discardedChest = true;
        b.shift();
        if(b[0] === CHEST) discardedChest = true;
        b.shift();
      });
      break;
    case BOULDER:
      if(!checkNeighbors(x, y)) {
        board[y][x].unshift(type);
        board[pushing.y][pushing.x].shift();
      }
      pushing = false;
      return;
    default:
      console.error(`card type ${type} not supported to place`);
  }
  hand.splice(placing, 1);
  placing = false;
}

function nearOctopus(x, y) {
  for(let X = x -1; X < x + 2; X++) {
    if(X < 0 || X >= gridWidth) continue;
    for(let Y = y-1; Y < y + 2; Y++) {
      if(Y < 0 || Y >= gridHeight) continue;
      if(X === x && Y === y) continue;

      if(board[Y][X].length > 0 && board[Y][X][0] === OCTOPUS) return true;
    }
  }
  return false;
}

function chooseChoice(choice, type) {
  switch(type) {
    case SHOVEL:
    case TROWEL:
      if(choose.choices[choice] !== BOULDER) {
        hand.push(choose.choices[choice]);
      }

      if(choose.choices[choice] === CHEST) {
        // WIN condition
        won = true;
      }
      else {
        for(let i = 0; i < choose.choices.length; i++) {
          if(i === choice) continue;
          if(choose.choices[i] === CHEST) discardedChest = true;
        }
      }

      for(let i = 0; i < choose.choices.length; i++) {
        if(choose.choices[i] === BOULDER) {
          board[choose.y][choose.x].unshift(BOULDER);
        }
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
    text: `Huzzah!\nCollect ${currentLevel === 0 ? 'it' : 'BOTH\n'} to win!`
  }, {
    name: `Detector`,
    text: `Tells how many\ngood cards are\nin the stack\nand how deep\nthe nearest is`
  }, {
    name: `Boulder`,
    text: `Too big to discard\nor pick up\nCan be pushed\nonto lower\nsurrounding stacks`
  }, {
    name: `Cherry`,
    text: `Destorys the top\n2 cards of a\nstack and its 8\nsurrounding stacks`
  }, {
    name: `Octopus`,
    text: `Inks the\nsurrounding cards\n\nObscures what\nthey are`
  }, {
    name: `Inked`,
    text: `What is this card?`
  }
];

function leftHint() {
  if(won) return;

  generalSprite(8, 100, 0, -60, 132, 118);

  centeredBigText('Hard', 8 + 65, 208);

  centeredText('collect BOTH\ntreasures', 8 + 65, 180);
}

function hint(type) {
  if(won || type === undefined || type >= hints.length) return;

  generalSprite(338, 100, 0, -60, 132, 118);

  centeredBigText(hints[type].name, 335 + 65, 208);

  centeredText(hints[type].text, 335 + 65, 180);
}

function textButton(txt, x, y, callback) {
  let btn = button(x - bigTextWidth(txt) / 2, y-30, bigTextWidth(txt), 30);
  if(!btn) {
    centeredBigText(txt, x, y);
  }
  else {
    cursorType = 'pointer';
    callback(x, y);
  }
}

function winScreen() {
  generalSprite(105, 30, 222, -60, 272, 210);

  centeredBigText(`You found${currentLevel>0?' all':''}\nthe treasure!`, 174 + 65, 218);

  generalSprite(202, 100, 132, -60, 80, 60);

  if(currentLevel === 1) {
    textButton(`Play again`, 174 + 65, 80, (x ,y) => {
      centeredBigText('Play again', x, y + Math.sin(performance.now() / 200) * 10);

      if(clicked) {
        clicked = false;
        setupGame();
      }
    });
  }
  else {
    textButton(`Play again`, 182, 80, (x ,y) => {
      centeredBigText('Play again', x, y + Math.sin(performance.now() / 200) * 10);

      if(clicked) {
        clicked = false;
        setupGame();
      }
    });


    textButton(`Next level`, 176+130, 80, (x ,y) => {
      centeredBigText('Next level', x, y + Math.sin(x + performance.now() / 200) * 10);

      if(clicked) {
        currentLevel++;
        clicked = false;
        setupGame();
      }
    });
  }
}

let info = false;

function infoScreen() {
  generalSprite(105, 30, 222, -60, 272, 210);

  centeredBigText(info, 174 + 65, 218);

  cursorType = 'pointer';

  if(clicked) {
    clicked = false;
    info = false;
    won = false;
  }
}

function loseScreen() {
  generalSprite(105, 30, 222, -60, 272, 210);

  centeredBigText(`You lose`, 174 + 65, 218);
  centeredBigText(`hands full of sand`, 174 + 65, 130);

  generalSprite(196, 140, 132, -120, 90, 34);

  if(true) {
    centeredBigText(`Play again`, 174 + 65, 80);
    cursorType = 'pointer';

    if(clicked) {
      clicked = false;
      setupGame();
    }
  }
  else {
    centeredText(`Play again`, 174, 80);

    centeredText(`Next level`, 174+130, 80);
  }
}

function loseScreenB() {
  generalSprite(105, 30, 222, -60, 272, 210);

  centeredBigText(`Error 404`, 174 + 65, 218);
  centeredBigText(`Chest can't be found`, 174 + 65, 115);

  generalSprite(196, 126, 132, -154, 90, 60);

  if(true) {
    centeredBigText(`Play again`, 174 + 65, 80);
    cursorType = 'pointer';

    if(clicked) {
      clicked = false;
      setupGame();
    }
  }
  else {
    centeredText(`Play again`, 174, 80);

    centeredText(`Next level`, 174+130, 80);
  }
}

function titleScreen() {
  generalSprite(105, 30, 222, -60, 272, 210);

  centeredBigText('Treasure Solitaire', 240, 218);

  centeredText('For Fireside Jam 2025\n\'Hunt\'', 240, 30);

  centeredText('Code and art by Saffron\nGame design by Peter', 240, 75);

  let btn = button(240 - bigTextWidth('Play') / 2, 90, bigTextWidth('Play'), 30);

  if(btn) {
    cursorType = 'pointer';
    centeredBigText('Play', 240 + Math.sin(performance.now() / 200) * 10, 120);

    if(clicked) {
      currentLevel = 0;
      clicked = false;
      screen = 1;
      setupGame();
    }
  }
  else {
    centeredBigText('Play', 240, 120);
  }

  btn = button(202, 130, 75, 60);

  if(btn) {
    generalSprite(202, 130, 132, -60, 75, 60);
    cursorType = 'pointer';
    if(clicked) {
      currentLevel = 1;
      clicked = false;
      screen = 1;
      setupGame();
    }
  }
  else {
    generalSprite(203, 130, 0, -179, 75, 60);
  }
}

function runGame() {
  cursorType = 'default';

  generalSprite(3, 245, 495-99, 23, 23, 23);

  let btn = button(3, 245, 23, 23);

  if(btn) {
    cursorType = 'pointer';
    if(clicked) {
      shader = !shader;
      clicked = false;
    }
  }

  if(screen === 0) {
    titleScreen();
    cursor(cursorType);

    clicked = false;
    return;
  }

  generalSprite(453, 245, 495-23, 23, 23, 23);

  btn = button(453, 245, 23, 23);

  if(btn) {
    cursorType = 'pointer';
    if(clicked) {
      setupGame();
      clicked = false;
    }
  }

  if(currentLevel > 0) {
    leftHint();
  }

  if(choose) {
    hint(choose.type);

    let len = choose.choices.length;
    for(let i = 0; i < len; i++) {
      let x = i * (tw + gap) + mid - (tw * len + gap * (len - 1)) / 2;

      let thisCard = choose.choices[i];

      if((i > 0 && choose.choices[i-1] === OCTOPUS) || (i < len - 1 && choose.choices[i+1] === OCTOPUS)) {
        thisCard = INKED;
      }

      btn = button(x, 100, tw, th);
      if(btn) {
        cursorType = 'pointer';
        hint(thisCard);
      }


      drawSprite(thisCard, x, 100 + (btn ? 2 : 0));
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
  if(hand.length === maxHand && hand.reduce((a,b)=>a+b, 0) === 0) {
    won = true;
    loseScreen();
    cursor(cursorType);
    clicked = false;
  }
  else if(discardedChest) {
    won = true;
    loseScreenB();
    cursor(cursorType);
    clicked = false;
  }
  else if(info) {
    won = true;
    infoScreen();
    cursor(cursorType);
    clicked = false;
  }
  else if(won) {
    winScreen();
    cursor(cursorType);
    clicked = false;
  }

  for (let x = 0; x < gridWidth; x++) {
    for (let y = 0; y < gridHeight; y++) {
      let stackSize = board[y][x].length;
      btn = button(left + (tw + gap) * x, 199 + stackSize - (th + gap) * y, tw, th);

      let thisCard = board[y][x][0];
      if(nearOctopus(x, y)) thisCard = INKED;

      if(btn) {
        cursorType = 'pointer';

        hint(thisCard);
      }
      else if(pushing.x === x && pushing.y === y) hint(thisCard);

      if(stackSize === 0) {
        drawSprite(BOTTOM, left + (tw + gap) * x, 199 - (th + gap) * y);
        if(btn && clicked && placing !== false) {
          placeCard(x, y, hand[placing]);
          clicked = false;
        }
        if(btn && clicked && pushing && pushing.x - x >= -1 && pushing.x - x <= 1 && pushing.y - y >= -1 && pushing.y - y <= 1) {
          placeCard(x, y, pushing.type);
          clicked = false;
        }
        continue;
      }

      drawSprite(BACK, left + (tw + gap) * x, 199 - (th + gap) * y);

      if((btn || (pushing.x === x && pushing.y === y)) && !won) {
        drawSprite(board[y][x].length === 1 ? BOTTOM : thisCard, left + (tw + gap) * x, 197 + stackSize - (th + gap) * y, -1, true);
        drawSprite(thisCard, left + (tw + gap) * x, 201 + stackSize - (th + gap) * y, board[y][x].length, checkNeighbors(x, y));
      }
      else {
        drawSprite(thisCard, left + (tw + gap) * x, 198 + stackSize - (th + gap) * y, board[y][x].length, checkNeighbors(x, y));
      }

      if(btn && clicked) {
        if(placing === false && pushing === false) {
          pickupCard(x, y, board[y][x][0]);
        }
        else if(pushing) {
          placeCard(x, y, pushing.type);
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

    let thisCard = hand[c];
    if((c > 0 && hand[c-1] === OCTOPUS) || (c < hand.length - 1 && hand[c+1] === OCTOPUS)) {
      thisCard = INKED;
    }

    btn = button(x, 5, tw, th);

    if(btn) {
      cursorType = 'pointer';

      hint(thisCard);
    }

    drawSprite(thisCard, x, 5 + ((btn && !won) || placing === c ? 2 : 0));

    if(btn && clicked && !won) {
      if(placing === c) placing = false;
      else activateCard(c, hand[c]);
      clicked = false;
    }
  }

  if(placing !== false) {
    if((placing > 0 && hand[placing-1] === OCTOPUS) || (placing < hand.length - 1 && hand[placing+1] === OCTOPUS)) {
      hint(INKED);
    }
    else {
      hint(hand[placing]);
    }
  }

  if(hand.length === maxHand && hand.reduce((a,b)=>a+b, 0) === 0) {
    loseScreen();
  } else if(discardedChest) {
    loseScreenB();
  }
  else if(info) {
    infoScreen();
    cursor(cursorType);
    clicked = false;
  }
  else if(won) {
    let treasures = 0;
    for(let i = 0; i < hand.length; i++) {
      if(hand[i] === CHEST) treasures++;
    }
    if(treasures < currentLevel + 1) {
      won = false;
    }

    if(won) winScreen();
  }

  cursor(cursorType);

  clicked = false;
}
