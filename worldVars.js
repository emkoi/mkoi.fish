export let World = {
    timeStep_ms: 30,
    middle_x: window.innerWidth / 2.0,
    middle_y: window.innerHeight / 2.0,
    // a koi is about 50 px wide
    // a 1 kg koi is also being assumed. this translates to a 15"/38 cm koi
    // (source: https://russellwatergardens.com/pages/koi-length-and-weight)
    // therefore, the conversion rate from cm to px is about 1.316
    PX_PER_M: 131.6,
    maxFish: 200,
    tank: [],
    fishCount: 0,
    waterColor: [0x24, 0x9e, 0xf4],
    overlayColor: [0, 0, 40, 0.8]
};