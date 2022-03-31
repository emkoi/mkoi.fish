

// fish with 1 color can be these
let pureColors = [
    0x191919, // natural black
    0xffffff, // pure white
    //0xf9eee8, // natural white (colors commented until I make a better mechanism to color fish, otherwise too much white globally)
    //0xf7dcd4, // red-tinted white
    //0xe2e2e2, // platinum
    0xb7b7b7, // silver
    0x383838, // smoke
    0x061766, // night sky blue
    0x08113a, // dark blue
    0xfceb2d, // yellow
    0xe5d847, // pale yellow
    0xfcda00, // yellow gold
    0xfcac00, // gold orange
    0xfc6900, // orange
    0xfc4b00, // red-orange
];

// fish with 2 colors can be these
let BiColors = {};
BiColors.colors = [
    0x191919, // natural black
    0xffffff, // pure white
    //0xf9eee8, // natural white
    //0xf7dcd4, // red-tinted white
    0x383838, // smoke
    0x061766, // night sky blue
    0xfc6900, // orange
    0xfc4b00, // red-orange
];

// fish with 3 colors can be these
let triColors = [
    0x191919, // natural black
    0xffffff, // pure white
    //0xf7dcd4, // red-tinted white
    0x383838, // smoke
    0xfc6900, // orange
    0xfc4b00, // red-orange
];



export function getRandomKoiColors() {
    const pureChance = 0.15;
    const biColorChance = 0.6;

    let colorType = "";
    const rand0to1 = Math.random();
    if (rand0to1 < pureChance) {
        colorType = "pure";
    } 
    else if (rand0to1 < pureChance + biColorChance) {
        colorType = "bicolor";
    } 
    else {
        colorType = "tricolor";
    }

    let colors = [];
    if (colorType == "pure") {
        colors.push(pureColors[Math.floor(Math.random() * pureColors.length)].toString(16));
        colors.push(colors[0]);
        colors.push(colors[0]);
    }
    else if (colorType == "bicolor") {
        colors.push(BiColors.colors[Math.floor(Math.random() * BiColors.colors.length)].toString(16));
        colors.push(colors[0]);
        colors.push(BiColors.colors[Math.floor(Math.random() * BiColors.colors.length)].toString(16));
        // 3 cases: 1. matching head & body, 2. matching head & tail, 3. matching body & tail
        let rotations = 0;
        if (Math.random() < 0.667) rotations++;
        if (Math.random() < 0.333) rotations++;
        for (let i = 0; i < rotations; i++) {
            let temp = colors[0];
            colors[0] = colors[1];
            colors[1] = colors[2];
            colors[2] = temp;
        }
    }
    else {
        for (let i = 0; i < 3; i++) {
            colors.push(triColors[Math.floor(Math.random() * triColors.length)].toString(16));
        }
    }

    return colors;
}