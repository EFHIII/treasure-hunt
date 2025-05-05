let layers = 8;
const maxHand = 8;
const TOP_TOOLS = 2;

let currentLevel = 0;

let screen = 0;

const challenges = [
  {
    title: 'Normal Mode',
    name: '',
    desc: ``,
    deck: [55, 16, 0, 6, 10, 2, 2, 4, 0],
    lock: 0
  },
  {
    title: 'Rock and Stone',
    name: 'Rock',
    desc: `where's the\nsand?`,
    deck: [0, 56, 0, 4, 12, 2, 0, 0, 0, 0, 20, 1, 0],
    lock: 1
  },
  {
    title: 'Crab Rave',
    name: 'Crab',
    desc: `the hoard\nbecons`,
    deck: [8,  0, 0,10, 22, 4, 3,48, 0],
    lock: 1
  },
  {
    title: 'Tower of Babel',
    name: 'Tower',
    desc: `build a tower\n30 high`,
    deck: [56, 38, 0, 8, 12, 4, 4, 14, -1, 0, 3, 2, 3],
    lock: 1
  },
  {
    title: 'Hard Mode',
    name: 'Hard',
    desc: `collect BOTH\ntreasures`,
    deck: [62, 18, 0, 8, 12, 4, 4, 14, 1, 6, 6, 2, 6],
    lock: 0
  },
  {
    title: 'Squid Game',
    name: 'Squid',
    desc: `what is\nthis deck?`,
    deck: [10, 2, 0, 8, 12, 2, 2, 2, 0, 15, 1, 1, 40],
    lock: 1
  },
  {
    title: 'House of Gold',
    name: 'Gold',
    desc: `callect all\n8 treasures!`,
    deck: [56,18, 0, 8, 12, 4, 4,14, 7, 6, 6, 2, 6],
    lock: 1
  },
  {
    title: 'Infinite Abyss',
    name: 'Abyss',
    desc: `Collect all\n 8 treasures!\nImpossibly hard!`,
    deck: [511,150,0,66, 101,33,34,115, 7, 50, 50, 20, 50],
    lock: 1
  },
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
let tutorial = true;
let warningHard = false;
let info = false;
let playingSound = true;
let fullscreen = false;


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
    //case BUCKET:
    //case DETECTOR:
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

  for(let i = 0; i < challenges[currentLevel].deck.length; i++) {
    deck.push(...new Array(Math.max(0,challenges[currentLevel].deck[i])).fill(i));
  }

  layers = Math.round((deck.length + 1) / gridWidth / gridHeight);

  let cards = deck.slice();

  if(cards.length !== layers * gridWidth * gridHeight - 1) {
    console.log(`error: only ${cards.length} of ${layers * gridWidth * gridHeight-1} cards`);
  }

  let fair = false, chest;
  while(!fair) {
    while(!fair) {
      shuffle(cards);
      chest = Math.random() * cards.length / 4;
      if(currentLevel === 3) chest = Infinity;
      fair = !hasConsecutiveEmpty(cards, chest) && hasTopTools(cards, TOP_TOOLS);
      let at = 0;
      for(let i = 0; i < layers; i++) {
        for(let y = 0; y < gridWidth * gridHeight; y++) {
          if(cards[at++] === CHEST && layers - i - 1 < layers / 4) {
            fair = false;
          }
        }
      }
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

          if(l === layers-1) {
            board[y][x].reverse();
            let lastChest = -Infinity;
            for(let v = 0; v < board[y][x].length; v++) {
              if(board[y][x][v] === CHEST) {
                if(v - lastChest < 4) fair = false;
                lastChest = v;
              }
            }
          }
        }
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
      fn(board[y+Y][x+X], X, Y);
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

function getGrid(x, y) {
  let stackSize = board[y] && board[y][x] ? Math.min(14, board[y][x].length) : 0;
  return {x:left + (tw + gap) * x, y:199-5 + stackSize - (th + gap) * y};
}

function getHand(c) {
  return {x:c * (tw + 5) + mid - (tw * 8 + 5 * (8 - 1)) / 2, y:5};
}

function pickupCard(x, y, type) {
  if((hand.length >= maxHand && type !== BOULDER) || checkNeighbors(x, y)) return;

  if(type !== CRAB && type !== CHEST && type !== BOULDER) playSound(0);

  let g, h;

  switch(type) {
    case CRAB: break;
    case BOULDER:
        playSound(4);
      pushing = {type, x, y};
      break;
    case CHEST:
      playSound(7);
      // WIN condition
      won = true;

      g = getGrid(x, y);
      h = getHand(hand.length);
      animateMove(type, g.x,g.y,h.x,h.y);

      hand.push(type);
      board[y][x].shift();
      break;
    case MINE:
      board[y][x].shift();
      forAllNeighbors(x, y, b => b.unshift(SAND));
      break;
    default:
      g = getGrid(x, y);
      h = getHand(hand.length);
      animateMove(type, g.x,g.y,h.x,h.y);

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
      playSound(4);
      placing = index;
      pushing = false;
      break;
    case BUCKET:
      for(let i = 0; i < hand.length; i++) {
        h = getHand(i);
        animateMove(hand[i],h.x,h.y,h.x,h.y-100);
        if(hand[i] === CHEST) discardedChest = true;
      }
      hand = [];
      break;
    default:
      console.error(`card type ${type} not supported to activate`);
  }
}

function slideLeft(c) {
  for(let i = c+1; i < hand.length; i++) {
    h1 = getHand(i);
    h2 = getHand(i-1);
    animateMove(hand[i],h1.x,h1.y,h2.x,h2.y);
  }
}

function placeCard(x, y, type, c) {

  if(c) slideLeft(c);

  let g, h;

  switch(type) {
    case SAND:
      return;
    case ROCK:
    case CRAB:
    case OCTOPUS:
      g = getGrid(x, y);
      h = getHand(c);
      animateMove(type,h.x,h.y,g.x,g.y);

      board[y][x].unshift(type);
      playSound(5);
      break;
    case CHEST:
      g = getGrid(x, y);
      h = getHand(c);
      animateMove(type,h.x,h.y,g.x,g.y);

      board[y][x].unshift(type);
      playSound(6);
      break;
    case SHOVEL:
      playSound(5);
      if(board[y][x].length === 0) return;
      choose = {type, x, y, choices: board[y][x].splice(0, 4)};
      break;
    case TROWEL:
      playSound(5);
      if(board[y][x].length === 0) return;
      choose = {type, x, y, choices: board[y][x].splice(0, 2)};
      break;
    case BOMB:
      playSound(1);

      forAllNeighbors(x, y, (b, X, Y) => {
        g = getGrid(x+X*10, y+Y*10);
        h = getGrid(x, y);
        animateMove(b[0],h.x,h.y,g.x,g.y);

        if(b[0] === CHEST) discardedChest = true;
        b.shift();
      });
      break;
    case DETECTOR:
      playSound(5);

      g = getGrid(x, y);
      h = getHand(c);
      animateMove(type,h.x,h.y,g.x,g.y);

      if(board[y][x].length === 0) return;
      let good = 0;
      let nextGood = -1;
      for(let i = board[y][x].length - 1; i >= 0; i--) {
        if(isTool(board[y][x][i]) || board[y][x][i] === BUCKET || board[y][x][i] === DETECTOR || board[y][x][i] === CHEST) {
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
      playSound(2);

      forAllNeighbors(x, y, (b, X, Y) => {
        g = getGrid(x+X*20, y+Y*20);
        h = getGrid(x, y);
        animateMove(b[0],h.x,h.y,g.x,g.y);

        g = getGrid(x+X*10, y+Y*10);
        h = getGrid(x, y);
        animateMove(b[1],h.x,h.y,g.x,g.y);

        if(b[0] === CHEST) discardedChest = true;
        b.shift();

        if(b[0] === CHEST) discardedChest = true;
        b.shift();
      });
      break;
    case BOULDER:
      if(!checkNeighbors(x, y)) {
        playSound(5);

        h = getGrid(pushing.x, pushing.y);
        g = getGrid(x, y);
        animateMove(type,h.x,h.y,g.x,g.y);

        board[y][x].unshift(type);
        board[pushing.y][pushing.x].shift();
      }
      else {
        playSound(3);
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
        h = getHand(hand.length);
        g =  choice * (tw + gap) + mid - (tw * choose.choices.length + gap * (choose.choices.length - 1)) / 2;
        animateMove(choose.choices[choice],g,100,h.x,h.y);

        hand.push(choose.choices[choice]);
      }

      if(choose.choices[choice] === CHEST) {
        // WIN condition
        won = true;
        playSound(7);
      }
      else {
        playSound(5);
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
    text: `Huzzah!\nCollect ${currentLevel === 0 ? 'it' : 'BOTH\n'} to win!\n\nDrop by playing it`
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

  if(currentLevel > 0) {
    centeredBigText(challenges[currentLevel].name, 8 + 65, 208);
    centeredText(challenges[currentLevel].desc, 8 + 65, 180);
  }
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

function smallTextButton(txt, x, y, callback) {
  let btn = button(x - textWidth(txt) / 2, y-15, textWidth(txt), 15);
  if(!btn) {
    centeredText(txt, x, y);
  }
  else {
    cursorType = 'pointer';
    callback(x, y);
  }
}

function winScreen() {
  if(currentLevel === 0 && challenges[0].lock === 0) {
    challenges[1].lock = 0;
    challenges[2].lock = 0;
    challenges[3].lock = 0;
  }
  else if(currentLevel === 4 && challenges[4].lock === 0) {
    challenges[5].lock = 0;
    challenges[6].lock = 0;
  }
  challenges[currentLevel].lock = -1;

  let beaten = 0;
  for(let i = 0; i < challenges.length; i++) {
    if(challenges[i].lock === -1) beaten++;
  }

  if(beaten >= 5 && challenges[7].lock === 1) {
    challenges[7].lock = 0;
  }


  generalSprite(105, 30, 222, -60, 272, 210);

  centeredBigText(`You found${currentLevel>0?' all':''}\nthe treasure!`, 174 + 65, 218);

  generalSprite(202, 100, 132, -60, 80, 60);

  if(currentLevel === challenges.length - 1) {
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

    textButton(`Levels`, 176+130, 80, (x ,y) => {
      centeredBigText('Levels', x, y + Math.sin(x + performance.now() / 200) * 10);

      if(clicked) {
        screen = 2;
        clicked = false;
      }
    });
  }
}

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

  centeredBigText(`Play again`, 174 + 65, 80);
  cursorType = 'pointer';

  if(clicked) {
    clicked = false;
    setupGame();
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

function hardWarning() {
  generalSprite(105, 30, 222, -60, 272, 210);

  centeredBigText(`Go to level select?`, 174 + 69, 218);

  textButton('No', 240-50, 100, (x, y) => {
    centeredBigText('No', x, y + Math.sin(performance.now()/200)*10);

    if(clicked) {
      currentLevel = 0;
      clicked = false;
      screen = 1;
      setupGame();
    }
  });

  textButton('Yes', 240+50, 100, (x, y) => {
    centeredBigText('Yes', x, y + Math.sin(performance.now()/200)*10);

    if(clicked) {
      clicked = false;
      screen = 2;
    }
  });
}

function titleScreen() {
  if(warningHard) {
    hardWarning();
  }

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
      warningHard = true;
      clicked = false;
    }
  }
  else {
    generalSprite(203, 130, 0, -179, 75, 60);
  }

  generalSprite(330, 50, 559, 18, 30, 18);

  btn = button(330, 50, 30, 18);

  if(btn) {
    cursorType = 'pointer';
    if(clicked) {
      postMessage({type:'discord'});
      clicked = false;
    }
  }

  if(warningHard) {
    hardWarning();
  }
}

function levelSelect() {
  centeredText('For Fireside Jam 2025\n\'Hunt\'', 240, 30);

  generalSprite(105, 30, 222, -60, 272, 210);

  centeredBigText(`Level Select`, 174 + 65, 218);

  for(let i = 0; i < challenges.length; i++) {
    smallTextButton(`${challenges[i].lock===0?'NEW! ':''}${challenges[i].lock===1?'Locked':challenges[i].title}`, 240, 185-17*i, (x ,y) => {

      centeredText(`${challenges[i].lock===0?'NEW! ':''}${challenges[i].lock===1?'Locked':challenges[i].title}`, x+ Math.sin(performance.now() / 200) * 10 * (challenges[i].lock===1?0:1), y );

      if(challenges[i].lock !== 1 && clicked) {
        clicked = false;
        screen = 1;
        currentLevel = i;
        setupGame();
      }
    });
  }
}

function cubicBezier(p1, p2, p3, p4, t) {
  return (1 - t) ** 3 * p1 + 3 * (1 - t) ** 2 * t * p2 + 3 * (1 - t) * t * t * p3 + t ** 3 * p4;
}

function pointOnBezier(x1, y1, c1x, c1y, c2x, c2y, x2, y2, x, resolution = 20) {
  let at = 0.5;
  let inc = 0.25;
  let b;
  for(let i = 0; i < resolution; i++) {
    b = cubicBezier(x1, c1x, c2x, x2, at);
    if(b > x) at -= inc;
    else at += inc;
    inc /= 2;
  }
  return cubicBezier(y1, c1y, c2y, y2, at);
}

function easeValue(atTime, fromTime, toTime, fromValue, toValue, easeA, easeB, beforeFromTime = false, beforeFromValue = false, afterToTime = false, afterToValue = false, resolution = 20) {
  const duration = toTime - fromTime;

  const beforeTime = typeof beforeFromTime === 'number' ? beforeFromTime - fromTime : duration;
  const beforeValue = typeof beforeFromValue === 'number' ? beforeFromValue : fromValue;
  const afterTime = typeof afterToTime === 'number' ? afterToTime - toTime : duration;
  const afterValue = typeof afterToValue === 'number' ? afterToValue : toValue;

  const beforeSlope = (beforeValue - fromValue) / beforeTime;
  const afterSlope = (afterValue - toValue) / afterTime;

  const halfDuration = duration / 2;

  return pointOnBezier(
    fromTime, fromValue,
    fromTime + halfDuration * easeA, fromValue + beforeSlope * halfDuration * easeA,
    toTime - halfDuration * easeB, toValue - afterSlope * halfDuration * easeB,
    toTime, toValue,
    atTime, resolution);
}

let animations = [];
function animateMove(sprite, x1, y1, x2, y2) {
  animations.push({
    sprite, x1, y1, x2, y2,
    started: performance.now(),
    duration: 300,
  });
}

function animating(oldSprite, sprite, x, y, v1 = -1, v2 = false) {
  for(let i = 0; i < animations.length; i++) {
    if(animations[i].sprite === oldSprite && animations[i].x2 === x && Math.abs(animations[i].y2 - y) < 10) {
      return;
    }
  }
  drawSprite(sprite, x, y, v1, v2);
}

function animate() {
  for(let i = 0; i < animations.length; i++) {
    let an = animations[i];
    let x = easeValue(performance.now(), an.started, an.started+an.duration, an.x1, an.x2, 1, 1);
    let y = easeValue(performance.now(), an.started, an.started+an.duration, an.y1, an.y2, 1, 1);
    drawSprite(an.sprite, x, y);

    if(performance.now()-an.duration > an.started) {
      animations.splice(i, 1);
      i--;
    }
  }
}

function runGame() {
  cursorType = 'default';

  generalSprite(460, 3, 498 + 17 * (fullscreen?1:0), 20, 17, 20);

  let btn = button(460, 3, 23, 23);

  if(btn) {
    cursorType = 'pointer';
    if(clicked) {
      fullscreen = !fullscreen;
      postMessage({type:'fullscreen'});
      clicked = false;
    }
  }


  if(screen !== 0) {
    generalSprite(3, 3, 498 + 34, 20, 25, 20);

    let btn = button(3, 3, 25, 23);

    if(btn) {
      cursorType = 'pointer';
      if(clicked) {
        screen = 0;
        warningHard = false;
        clicked = false;
      }
    }
  }


  generalSprite(3, 245, 495-99, 23, 23, 23);

  btn = button(3, 245, 23, 23);

  if(btn) {
    cursorType = 'pointer';
    if(clicked) {
      shader = !shader;
      clicked = false;
    }
  }

  generalSprite(27, 245, 495-99+23+(playingSound?0:27), 23, 27, 23);

  btn = button(27, 245, 23, 23);

  if(btn) {
    cursorType = 'pointer';
    if(clicked) {
      playingSound = !playingSound;
      clicked = false;
      playSound(-1);
    }
  }


  switch(screen) {
    case 0:
      titleScreen();
      cursor(cursorType);

      clicked = false;
      return;
    case 2:
      levelSelect();
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

  textButton('?', 60, 267, (x, y) => {
    centeredBigText('!', x, y);
    if(clicked) {
      tutorial = true;
      clicked = false;
    }
  });

  if(currentLevel > 0) {
    leftHint();
  }

  if(choose) {
    hint(choose.type);

    let len = choose.choices.length;
    let allBoulders = true;
    for(let i = 0; i < len; i++) {
      if(choose.choices[i] !== BOULDER) allBoulders = false;
    }
    for(let i = 0; i < len; i++) {
      let x = i * (tw + gap) + mid - (tw * len + gap * (len - 1)) / 2;

      let thisCard = choose.choices[i];

      if((i > 0 && choose.choices[i-1] === OCTOPUS) || (i < len - 1 && choose.choices[i+1] === OCTOPUS)) {
        thisCard = thisCard === OCTOPUS ? OCTOPUS : INKED;
      }

      btn = button(x, 100, tw, th);
      if(btn) {
        cursorType = 'pointer';
        hint(thisCard);
      }

      drawSprite(thisCard, x, 100 + (btn ? 2 : 0), -1, (!allBoulders && choose.choices[i] === BOULDER));
      if(btn && clicked && (allBoulders || choose.choices[i] !== BOULDER)) {
        chooseChoice(i, choose.type);
        clicked = false;
        break;
      }
    }

    cursor(cursorType);
    clicked = false;
    return;
  }

  if(tutorial) {
    won = true;
    cursorType = 'pointer';
    if(clicked) {
      tutorial = false;
    }
    clicked = false;
  }
  else if(hand.length === maxHand && hand.reduce((a,b)=>a+b, 0) === 0) {
    won = true;
    loseScreen();
    clicked = false;
  }
  else if(discardedChest) {
    won = true;
    loseScreenB();
    clicked = false;
  }
  else if(info) {
    won = true;
    infoScreen();
    clicked = false;
  }
  else if(won) {
    let treasures = 0;
    for(let i = 0; i < hand.length; i++) {
      if(hand[i] === CHEST) treasures++;
    }
    if(treasures < challenges[currentLevel].deck[CHEST]+1) {
      won = false;
    }

    if(won) winScreen();
    clicked = false;
  }

  for (let x = 0; x < gridWidth; x++) {
    for (let y = 0; y < gridHeight; y++) {
      if(currentLevel === 3 && board[y][x].length >= 30) {
        board[y][x][0] = CHEST;
      }

      let stackSize = Math.min(14, board[y][x].length);
      btn = button(left + (tw + gap) * x, 199-5 + stackSize - (th + gap) * y, tw, th);

      let thisCard = board[y][x][0];
      if(nearOctopus(x, y)) thisCard = thisCard === OCTOPUS ? OCTOPUS : INKED;

      if(btn) {
        cursorType = 'pointer';

        hint(thisCard);
      }
      else if(pushing.x === x && pushing.y === y) hint(thisCard);

      if(stackSize === 0) {
        drawSprite(BOTTOM, left + (tw + gap) * x, 199-5 - (th + gap) * y);
        if(btn && clicked && placing !== false) {
          placeCard(x, y, hand[placing], placing);
          clicked = false;
        }
        if(btn && clicked && pushing && pushing.x - x >= -1 && pushing.x - x <= 1 && pushing.y - y >= -1 && pushing.y - y <= 1) {
          placeCard(x, y, pushing.type);
          clicked = false;
        }
        continue;
      }

      drawSprite(BACK, left + (tw + gap) * x, 199-5 - (th + gap) * y);

      drawSprite(board[y][x].length === 1 ? BOTTOM : nearOctopus(x, y) ? INKED : board[y][x][1], left + (tw + gap) * x, 197-5 + stackSize - (th + gap) * y, board[y][x].length - 1, true);
      if(pushing.x === x && pushing.y === y && !won) {
        animating(board[y][x][0], thisCard, left + (tw + gap) * x, 207-5 + stackSize - (th + gap) * y, board[y][x].length, checkNeighbors(x, y));
      }
      else if(btn && !won) {
        //drawSprite(board[y][x].length === 1 ? BOTTOM : thisCard, left + (tw + gap) * x, 197-5 + stackSize - (th + gap) * y, -1, true);
        animating(board[y][x][0], thisCard, left + (tw + gap) * x, 201-5 + stackSize - (th + gap) * y, board[y][x].length, checkNeighbors(x, y));
      }
      else {
        animating(board[y][x][0], thisCard, left + (tw + gap) * x, 198-5 + stackSize - (th + gap) * y, board[y][x].length, checkNeighbors(x, y));
      }

      if(btn && clicked) {
        if(placing === false && pushing === false) {
          pickupCard(x, y, board[y][x][0]);
        }
        else if(pushing) {
          placeCard(x, y, pushing.type);
        }
        else {
          placeCard(x, y, hand[placing], placing);
        }
        clicked = false;
      }
    }
  }

  for(let c = 0; c < 8; c++) {
    let x = c * (tw + 5) + mid - (tw * 8 + 5 * (8 - 1)) / 2;

    drawSprite(BOTTOM, x-2, 5-2);
    drawSprite(BOTTOM, x+2, 5-2);
    drawSprite(BOTTOM, x-2, 5+2);
    drawSprite(BOTTOM, x+2, 5+2);
  }

  for(let c = 0; c < hand.length; c++) {
    let x = c * (tw + 5) + mid - (tw * 8 + 5 * (8 - 1)) / 2;

    let thisCard = hand[c];
    if((c > 0 && hand[c-1] === OCTOPUS) || (c < hand.length - 1 && hand[c+1] === OCTOPUS)) {
      thisCard = thisCard === OCTOPUS ? OCTOPUS : INKED;
    }

    btn = button(x, 5, tw, th);

    if(btn) {
      cursorType = 'pointer';

      hint(thisCard);
    }

    //drawSprite(thisCard, x, 5 + ((btn && !won) || placing === c ? 2 : 0) + (placing === c ? 6 : 0));
    animating(hand[c], thisCard, x, 5 + ((btn && !won) || placing === c ? 2 : 0) + (placing === c ? 6 : 0));

    if(btn && clicked && !won) {
      if(placing === c) {
        placing = false;
        playSound(3);
      }
      else activateCard(c, hand[c]);
      clicked = false;
    }
  }

  animate();

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
    if(treasures < challenges[currentLevel].deck[CHEST]+1) {
      won = false;
    }

    if(won) winScreen();
  }

  if(tutorial) {
    generalSprite(10, 5, 493, -60, 450, 240);

    centeredBigText('RULES', 245, 225);

    centeredBigText('Goal', 225, 195);

    centeredText('Find the treasure\ncard by digging\nthrough these\npiles of sand', 250, 105);

    centeredText('Click cards to\npick them up\nand add them\nto your hand', 120, 190);

    centeredBigText('Max', 115, 213);
    centeredBigText('8', 165, 213);

    centeredText('You can\'t pick up a\ncard that\'s lower\n  than the 8 around it', 115, 60);

    centeredText('Height', 148, 78);

    centeredText('Click cards in your\nhand to use them\nYou cannot\nuse sand', 388, 185);

    centeredText('When using certain\ncards, select a card\npile to use it on', 388, 65);
  }

  cursor(cursorType);

  clicked = false;
}
