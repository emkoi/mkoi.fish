// yes

const timeStep_ms = 30;

$(document).ready(init);
$(document).click(addFish);

function init() {
    console.log("init started");
    setInterval(main, timeStep_ms); // update every 5ms    
    tank.push(new Fish(0, 50, "mkoi"));
    for (let i = 0; i < 200; i++) addFish();
    console.log("init done");
}

let middle_x = window.innerWidth  / 2;
let middle_y = window.innerHeight / 2;
let min_dimension = Math.min(window.innerWidth, window.innerHeight);

// returns rand float value in [a, b)
function random(a,b) {
    return a + Math.random()*(b-a);
}

// returns in range [a, b)
function randInt(a, b) {
    return Math.floor(random(a, b));
}
// converts float value in degrees to equivalent value in radians
function deg2rad(degs) {
    return degs*Math.PI/180;
}
// converts float value in radians to equivalent value in degrees
function rad2deg(rads) {
    return 180*rads/Math.PI;
}

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

class Fish {
    constructor(x, y, fishName) {
        // a koi is about 50 px wide
        // a 1 kg koi is also being assumed. this translates to a 15"/38 cm koi
        // (source: https://russellwatergardens.com/pages/koi-length-and-weight)
        // therefore, the conversion rate from cm to px is about 1.316
        this.pxPerM = 131.6; // move this out
        this.x_m = x / this.pxPerM;
        this.y_m = y / this.pxPerM;
        this.mass_kg = 1.0; // actually about right for a koi
        this.heading_rad = 0.0;
        // hand-calculated with an approximate fish model (2 trapezoids front-to-back)
        this.moment_kgm2 = 6.34e-2;
        this.angVel_radPerS = 0;
        this.xVel_mPerS = 0.0;
        this.yVel_mPerS = 0.0;
        /*
            * 	2.5% of 380 mm Salmon & Walleye can swim 7 m/s for at least 4.1 s
            * 	97.5% of 380 mm Salmon & Walleye cannot swim 7 m/s.
            * 	GroupName 			ScientificName 		CommonName 
            * 	Salmon & Walleye 	Cyprinus carpio 	Carp 
            * 	(source: http://www.fishprotectiontools.ca/userguide.html)
            */
        // unfortunately, the source above wasn't useful for burst speeds (sustained for < 1s)
        // therefore, the burst speed of 1000 px/s (equivalently, 7.6 m/s) is assumed to be 
        // reasonable based on eyeing it
        this.nextSpurtVel_pxPerS__old = 1000;
        // assuming 4" diameter, circular cross-section fish
        // koi fish are thick so its not too bad
        this.crossSectionalArea_m2 = 0.0081; 
        // basically a guess; not much (but surprisingly, still some) research on fish drag coefficients
        this.dragCoeff = 0.32;
        this.maxFishPower_W = 62;
        this.fishPower_W = 0;
        this.maxSpurtEnergy_J = 0.3;
        this.spurtEnergy_J = 0;
        this.spurtTriggerSpeed_mPerS = 0.25;

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

        this.elem = document.createElement("p");
        let tail = `<span style="color:#${colors[0]}">&gt;</span>`;
        let body = `<span style="color:#${colors[1]}">&lt;</span>`;
        let head = `<span style="color:#${colors[2]}">&gt;</span>`;
        this.elem.innerHTML = tail + body + head;
        this.elem.id = fishName;
        this.elem.className = "fish";
        $("#fishtank").append(this.elem);

        this.test1 = 0;
    }

    destruct() {
        $(`#${this.fishName}`).remove();
    }

    // returns magnitude of current velocity
    speed_pxPerS() { return this.pxPerM * this.speed_mPerS(); }
    speed_mPerS() { return Math.sqrt(this.xVel_mPerS**2 + this.yVel_mPerS**2); }

    // returns distance (in px) from the center of the page
    distFromCenter_px() { return this.pxPerM * this.distFromCenter_m(); }
    distFromCenter_m() { return Math.sqrt(this.x_m**2 + this.y_m**2); }

    /**
     * returns the heading angle (in rad)
     * that would point the fish towards the center
     **/
    ang_to_center() {
        if (this.x_m > 0)
            return Math.atan(this.y_m/this.x_m) + Math.PI;
        else if (this.x_m < 0)
            return Math.atan(this.y_m/this.x_m);
        else if (this.y_m > 0)
            return -Math.PI / 2;
        else if (this.y_m < 0)
            return Math.PI / 2;
        return Math.random() * 2 * Math.PI;
    }

    // the fish's "ai" i guess
    think(dt_s) {
        // bounce-back; random offsets because we render fish with html text elements and have no bounding boxes
        if (this.y_m > (window.innerHeight + 40) / this.pxPerM * 0.475) {
            this.yVel_mPerS = -Math.abs(this.yVel_mPerS);
        }
        else if (this.y_m < (-window.innerHeight + 160) / this.pxPerM * 0.475) {
            this.yVel_mPerS = Math.abs(this.yVel_mPerS);
        }
        if (this.x_m > (window.innerWidth - 80) / this.pxPerM * 0.475) {
            this.xVel_mPerS = -Math.abs(this.xVel_mPerS);
        }
        else if (this.x_m < (-window.innerWidth - 20) / this.pxPerM * 0.475) {
            this.xVel_mPerS = Math.abs(this.xVel_mPerS);
        }

        // trigger a spurt
        const speed_mPerS = this.speed_mPerS();
        if (this.spurtEnergy_J == 0.0 && speed_mPerS < this.spurtTriggerSpeed_mPerS) {
            this.heading_rad = Math.random() * 2 * Math.PI;
            this.fishPower_W = random(5, this.maxFishPower_W);
            this.spurtEnergy_J = random(0, this.maxSpurtEnergy_J);
            this.spurtTriggerSpeed_mPerS = random(0.1, 0.3);
        }
    }

    // update func -- called every 'frame'
    update(dt_s) {
        // update pos
        this.x_m += this.xVel_mPerS*dt_s;
        this.y_m += this.yVel_mPerS*dt_s;

        // set draw pos
        this.elem.style.left = middle_x + Math.round(this.x_m * this.pxPerM) + "px";
        this.elem.style.top  = middle_y - Math.round(this.y_m * this.pxPerM) + "px";
        
        // drag
        // (ref https://en.wikipedia.org/wiki/Drag_equation)
        const fishSpeed_mPerS = this.speed_mPerS();
        const dragForce_N = 0.5 * 1000 * fishSpeed_mPerS**2 * this.dragCoeff * this.crossSectionalArea_m2;
        const dragAccel_mPerS2 = dragForce_N / this.mass_kg;

        // fish power contribution
        let kineticEnergyIncrease_J = this.fishPower_W * dt_s;
        if (kineticEnergyIncrease_J > this.spurtEnergy_J) {
            kineticEnergyIncrease_J = this.spurtEnergy_J;
            this.spurtEnergy_J = 0;
        }
        else {
            this.spurtEnergy_J -= kineticEnergyIncrease_J;
        }
        // (derived from Kinetic energy = 0.5*m*v^2)
        let dV = Math.sqrt(Math.sqrt(2 * kineticEnergyIncrease_J / this.mass_kg) + fishSpeed_mPerS**2) - fishSpeed_mPerS;

        // apply drag
        const dragdV_mPerS = dragAccel_mPerS2 * dt_s;
        let dragProportionOfSpeed = dragdV_mPerS / fishSpeed_mPerS;
        if (fishSpeed_mPerS == 0.0) {
            dragProportionOfSpeed = 0.0;
        }
        this.xVel_mPerS *= 1.0 - dragProportionOfSpeed;
        this.yVel_mPerS *= 1.0 - dragProportionOfSpeed;

        this.xVel_mPerS += dV * Math.cos(this.heading_rad);
        this.yVel_mPerS += dV * Math.sin(this.heading_rad);

        // the fish will point to where it is going
        if (this.xVel_mPerS == 0.0) {
            if (this.yVel_mPerS > 0.0) {
                this.heading_rad = Math.PI / 2.0;
            } else if (this.yVel_mPerS < 0.0) {
                this.heading_rad = -Math.PI / 2.0;
            }
        } else {
            this.heading_rad = Math.atan(this.yVel_mPerS / this.xVel_mPerS);
            if (this.xVel_mPerS < 0) {
                this.heading_rad += Math.PI;
            }
        }
        
        // ang momentum
        this.heading_rad += this.angVel_radPerS*dt_s;
        // angular drag
        this.angVel_radPerS -= (this.angVel_radPerS*dt_s*0.1);
        // convert angle to image coordinate system by reflecting it across x = 0
        this.elem.style.webkitTransform = "rotate(" + -this.heading_rad + "rad)";
        // ai
        this.think(dt_s);
    }
}

let fishCount = 0;
const maxFish = 200;
let tank = [];

function main() {
    if (false) {  // never end lol
        // but if wanted to, this how do stop
        clearInterval(id);
    } else {
        //mkoi.update(timeStep_ms / 1000.0); 
        for (let fish in tank) {
            tank[fish].update(timeStep_ms / 1000.0);
        }
    }
}

function addFish() {
    if (fishCount >= maxFish) return;
    const spawnRadius = min_dimension * 0.25;
    tank.push(new Fish(
        random(-innerWidth * 0.375 - 20, innerWidth * 0.375 - 80), 
        random(-innerHeight * 0.375 + 80, innerHeight * 0.375 + 40), 
        "fish" + ++fishCount)
    );
}

// don't do this :(
function removeFish() {
    if (fishCount == 0) return;
    let fishIndex = randInt(0, fishCount + 1);
    tank[fishIndex].destruct();
    tank.splice(fishIndex, 1);
}