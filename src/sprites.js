function drawDigit(digit, x, y) {
  if (spriteCount >= spriteSlots) {
    console.error(`ran out of sprite slots`);
    return;
  }

  const i = spriteCount * spriteDataLength;
  sprites[i + 0] = x;
  sprites[i + 1] = y;
  sprites[i + 2] = 7;// width
  sprites[i + 3] = 10;// height
  sprites[i + 4] = digit * 7 + 317; // sheet X
  sprites[i + 5] = 10; // sheet Y
  sprites[i + 6] = 0;

  spriteCount++;
}

function drawSprite(spriteIndex, x, y, boardHeight = -1, tooLow = false) {
  if (spriteCount >= spriteSlots) {
    console.error(`ran out of sprite slots`);
    return;
  }

  const i = spriteCount * spriteDataLength;
  sprites[i + 0] = Math.round(x);
  sprites[i + 1] = Math.round(y);
  sprites[i + 2] = 45;// width
  sprites[i + 3] = 60;// height
  sprites[i + 4] = spriteIndex * 45; // sheet X
  sprites[i + 5] = 0; // sheet Y
  sprites[i + 6] = tooLow ? 1 : 0;

  spriteCount++;

  if(boardHeight >= 10) {
    drawDigit(Math.floor((boardHeight+11) / 10), x+1, y+1);
    drawDigit((boardHeight+1) % 10, x+8, y+1);
  }
  else if(boardHeight > 0) {
    drawDigit(boardHeight + 1, x+1, y+1);
  }
}

function generalSprite(x, y, uvX, uvY, width, height, flag = 0) {
  if (spriteCount >= spriteSlots) {
    console.error(`ran out of sprite slots`);
    return;
  }

  const i = spriteCount * spriteDataLength;
  sprites[i + 0] = Math.round(x);
  sprites[i + 1] = Math.round(y);
  sprites[i + 2] = Math.round(width);// width
  sprites[i + 3] = Math.round(height);// height
  sprites[i + 4] = uvX; // sheet X
  sprites[i + 5] = uvY; // sheet Y
  sprites[i + 6] = flag;

  spriteCount++;
}

const fontLetters = [
  `abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ.!?'`
];

const letterWidths = [
  [
    6, 7, 6, 6, 6, 6, 5, 6, 2, 5, 5, 3, 8, 6, 5, 5, 7, 5, 5, 6, 6, 6, 7, 6, 7, 5,
    5, 4, 6, 6, 6, 6, 6, 6, 6, 6,
    7, 7, 8, 7, 6, 7, 8, 7, 4, 9, 7, 6, 10, 7, 8, 7, 9, 7, 7, 8, 8, 7, 10, 8, 8, 9,
    2, 2, 6, 3
  ],
];

const letterPositions = [];

for(let i = 0; i < letterWidths.length; i++) {
  letterPositions.push([]);
  let at = 0;
  for(let j = 0; j < letterWidths[i].length; j++) {
    letterPositions[i].push(at);
    at += letterWidths[i][j] + 1;
  }
}

const letterSpacing = 1;

function drawText(txt, x, y) {
  const lines = 0;
  let atX = 0;
  let atY = -14;
  textLoop:
  for(let i = 0; i < txt.length; i++) {
    switch(txt[i]) {
      case ' ':
        atX += 5;
        continue;
      case '\n':
        atX = 0;
        atY -= 14;
        continue;
    }

    for(let j = 0; j < fontLetters.length; j++) {
      let index = fontLetters[j].indexOf(txt[i]);
      if(index < 0) continue;
      generalSprite(atX + x, atY + y+0, letterPositions[j][index], 93 + 14 * j, letterWidths[j][index] + 1, 14, 1);
      atX += letterWidths[j][index] + letterSpacing;

      switch(txt[i]) {
        case 'q':
          atX -= 2;
          break;
        case `'`:
          if(i+1 < txt.length && txt[i+1] == txt[i+1].toLowerCase()) atX -= 1;
          break;
      }
      continue textLoop;
    }
  }
}

function textWidth(txt) {
  const lines = 0;
  let atX = 0;
  let atY = -14;
  textLoop:
  for(let i = 0; i < txt.length; i++) {
    switch(txt[i]) {
      case ' ':
        atX += 5;
        continue;
      case '\n':
        atX = 0;
        atY -= 14;
        continue;
    }

    for(let j = 0; j < fontLetters.length; j++) {
      let index = fontLetters[j].indexOf(txt[i]);
      if(index < 0) continue;
      atX += letterWidths[j][index] + letterSpacing;

      switch(txt[i]) {
        case 'q':
          atX -= 2;
          break;
        case `'`:
          if(i+1 < txt.length && txt[i+1] == txt[i+1].toLowerCase()) atX -= 1;
          break;
      }
      continue textLoop;
    }
  }
  return atX;
}

function centeredText(txt, x, y) {
  let txts = txt.split('\n');
  for(let i = 0; i < txts.length; i++) {
    drawText(txts[i], x - Math.floor(textWidth(txts[i]) / 2), y - 14 * i);
  }
}

const fontBigLetters = [
  `ABCDEFGHIJKLMNOPQRSTUVWXYZ.!?'`,
  'abcdefghijklmnopqrstuvwxyz0123456789'
];

const bigLetterWidths = [
  [15, 16, 15, 14, 14, 14, 17, 13, 10, 17, 15, 13, 21, 15, 17, 14, 18, 14, 15, 17, 15, 15,
    20, 18, 13, 18, 4, 5, 11, 5],
  [13, 13, 12, 13, 12, 13, 12, 12, 4, 11, 11, 6, 16, 11, 11, 11, 16, 11, 11, 11, 12, 11,
    15, 12, 12, 13, 11, 10, 11, 11, 11, 11, 12, 12, 12, 12]
];

const bigLetterPositions = [];

for(let i = 0; i < bigLetterWidths.length; i++) {
  bigLetterPositions.push([]);
  let at = 0;
  for(let j = 0; j < bigLetterWidths[i].length; j++) {
    bigLetterPositions[i].push(at);
    at += bigLetterWidths[i][j] + 2;
  }
}

const bigLetterSpacing = 1;

function drawBigText(txt, x, y) {
  const lines = 0;
  let atX = 0;
  let atY = -27;
  textLoop:
  for(let i = 0; i < txt.length; i++) {
    switch(txt[i]) {
      case ' ':
        atX += 10;
        continue;
      case '\n':
        atX = 0;
        atY -= 28;
        continue;
      case 'm':
        atX++;
        break;
    }

    for(let j = 0; j < fontBigLetters.length; j++) {
      let index = fontBigLetters[j].indexOf(txt[i]);
      if(index < 0) continue;
      generalSprite(atX + x, atY + y+0, bigLetterPositions[j][index], 52 + 27 * j, bigLetterWidths[j][index] + 2, 27, 1);
      atX += bigLetterWidths[j][index] + bigLetterSpacing;

      switch(txt[i]) {
        case 'c':
          atX += 1;
          break;
        case 'q':
          atX -= 4;
          break;
      }
      continue textLoop;
    }
  }
}

function bigTextWidth(txt) {
  const lines = 0;
  let atX = 0;
  let atY = -27;
  textLoop:
  for(let i = 0; i < txt.length; i++) {
    switch(txt[i]) {
      case ' ':
        atX += 10;
        continue;
      case '\n':
        atX = 0;
        atY -= 28;
        continue;
      case 'm':
        atX++;
        break;
    }

    for(let j = 0; j < fontBigLetters.length; j++) {
      let index = fontBigLetters[j].indexOf(txt[i]);
      if(index < 0) continue;
      atX += bigLetterWidths[j][index] + bigLetterSpacing;

      switch(txt[i]) {
        case 'c':
          atX += 1;
          break;
        case 'q':
          atX -= 4;
          break;
      }
      continue textLoop;
    }
  }

  return atX;
}

function centeredBigText(txt, x, y) {
  let txts = txt.split('\n');
  for(let i = 0; i < txts.length; i++) {
    drawBigText(txts[i], x - Math.floor(bigTextWidth(txts[i]) / 2), y - 27 * i);
  }
}
