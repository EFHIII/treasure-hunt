const patterns = [
  [
    new ImageData(new Uint8ClampedArray([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,31,31,31,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]),3,3),
    new ImageData(new Uint8ClampedArray([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,53,53,53,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]),3,3),
    new ImageData(new Uint8ClampedArray([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,171,171,171,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]),3,3),
  ]
];

function dotProduct(arr1, arr2) {
  return arr1[0] * arr2[0] + arr1[1] * arr2[1];
}

function sdSegment(p, a, b) {
  const pa = [p[0]-a[0], p[1]-a[1]];
  const ba = [b[0]-a[0], b[1]-a[1]];
  const h = Math.min(1,Math.max(0,dotProduct(pa,ba) / dotProduct(ba, ba)));
  const ans = [pa[0]-ba[0]*h, pa[1]-ba[1]*h];
  return Math.sqrt(ans[0]*ans[0]+ans[1]*ans[1]);
}

const ss = 8;

function getPatternSize(n) {
  const img1 = new Uint8ClampedArray(n*n*9*4);
  const img2 = new Uint8ClampedArray(n*n*9*4);
  const img3 = new Uint8ClampedArray(n*n*9*4);

  for(let y = 0; y < n * 3; y++) {
    for(let x = 0; x < n * 3; x++) {

      let sm = [0,0,0,0,0,0,0,0,0,0,0,0];

      for(let sx = -0.5+0.5/ss; sx < 0.5; sx+=1/ss) {
        for(let sy = -0.5+0.5/ss; sy < 0.5; sy+=1/ss) {

          let X = (x+sx+0.5) / n;
          let Y = (y+sy+0.5) / n;
          const distR = sdSegment([X*120, Y*120], [140, 140], [140, 220]) - 0;
          const distG = sdSegment([X*120, Y*120], [180, 140], [180, 220]) - 0;
          const distB = sdSegment([X*120, Y*120], [220, 140], [220, 220]) - 0;

          const r0 = distR < 0 ? 1 : Math.exp(-(distR**2) / 100);
          const g0 = distG < 0 ? 1 : Math.exp(-(distG**2) / 100);
          const b0 = distB < 0 ? 1 : Math.exp(-(distB**2) / 100);

          const r1 = distR < 0 ? 1 : Math.exp(-(distR**2) / 500);
          const g1 = distG < 0 ? 1 : Math.exp(-(distG**2) / 500);
          const b1 = distB < 0 ? 1 : Math.exp(-(distB**2) / 500);

          const r2 = distR < 0 ? 1 : Math.exp(-(distR**2) / 2070);
          const g2 = distG < 0 ? 1 : Math.exp(-(distG**2) / 2070);
          const b2 = distB < 0 ? 1 : Math.exp(-(distB**2) / 2070);

          //console.log(r0);

          sm[0 + 0] += r0 * 255 / (ss*ss);
          sm[0 + 1] += g0 * 255 / (ss*ss);
          sm[0 + 2] += b0 * 255 / (ss*ss);
          sm[0 + 3] = 255;

          sm[4 + 0] += (r1-r0) * 255 / (ss*ss);
          sm[4 + 1] += (g1-g0) * 255 / (ss*ss);
          sm[4 + 2] += (b1-b0) * 255 / (ss*ss);
          sm[4 + 3] = 255;

          sm[8 + 0] += (r2-r1) * 255 / (ss*ss);
          sm[8 + 1] += (g2-g1) * 255 / (ss*ss);
          sm[8 + 2] += (b2-b1) * 255 / (ss*ss);
          sm[8 + 3] = 255;
        }
      }

      img1[(x + y * n * 3) * 4 + 0] = sm[0];
      img1[(x + y * n * 3) * 4 + 1] = sm[1];
      img1[(x + y * n * 3) * 4 + 2] = sm[2];
      img1[(x + y * n * 3) * 4 + 3] = 255;

      img2[(x + y * n * 3) * 4 + 0] = sm[4];
      img2[(x + y * n * 3) * 4 + 1] = sm[5];
      img2[(x + y * n * 3) * 4 + 2] = sm[6];
      img2[(x + y * n * 3) * 4 + 3] = 255;

      img3[(x + y * n * 3) * 4 + 0] = sm[8];
      img3[(x + y * n * 3) * 4 + 1] = sm[9];
      img3[(x + y * n * 3) * 4 + 2] = sm[10];
      img3[(x + y * n * 3) * 4 + 3] = 255;
    }
  }

  return [
    new ImageData(img1, n*3, n*3),
    new ImageData(img2, n*3, n*3),
    new ImageData(img3, n*3, n*3)
  ];
}

function getPatterns() {
  for(let i = 2; i <= 8; i++) {
    patterns.push(getPatternSize(i));
  }

  console.log(patterns);
}

getPatterns();
