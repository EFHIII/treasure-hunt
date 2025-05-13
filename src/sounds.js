let sandSound = new Howl({
  src: ['assets/sand.ogg']
});

let bombSound = new Howl({
  src: ['assets/bomb.ogg']
});

let cherrySound = new Howl({
  src: ['assets/cherry.ogg']
});

let cardDownSound = new Howl({
  src: ['assets/card-down.ogg']
});

let cardUpSound = new Howl({
  src: ['assets/card-up.ogg']
});

let cardPlaySound = new Howl({
  src: ['assets/card-play.ogg']
});

let chestDwonSound = new Howl({
  src: ['assets/chest-down.ogg']
});

let winSound = new Howl({
  src: ['assets/win.ogg']
});

let beepSound = new Howl({
  src: ['assets/beep.ogg']
});

let playSound = true;

let sounds = [
  sandSound,
  bombSound,
  cherrySound,
  cardDownSound,
  cardUpSound,
  cardPlaySound,
  chestDwonSound,
  winSound,
  beepSound
]

function toggleSound() {
  playSound = !playSound;

  for(let i = 0; i < sounds.length; i++) {
    sounds[i].volume(playSound?1:0);
  }
}
