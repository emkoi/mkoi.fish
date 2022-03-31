import { getRandomKoiColors } from "./koiColors.js";
import { World } from "./worldVars.js";

$(document).ready(init);
$(document).click(addFish);

function init() {
    setInterval(main, World.timeStep_ms); // update every 5ms    
    tank.push(new Fish(0, 50, "mkoi"));
    for (let i = 0; i < 200; i++) addFish();
}

// returns rand float value in [a, b)
function random(a,b) {
    return a + Math.random()*(b-a);
}

// returns in range [a, b)
function randInt(a, b) {
    return Math.floor(random(a, b));
}

class Fish {
    constructor(x_px, y_px, fishName) {
        this.x_m = x_px / World.PX_PER_M;
        this.y_m = y_px / World.PX_PER_M;
        this.mass_kg = 1.0; // actually about right for a koi
        this.heading_rad = 0.0;
        // hand-calculated with an approximate fish model (2 trapezoids front-to-back)
        this.moment_kgm2 = 6.34e-2;
        this.angVel_radPerS = 0;
        this.xVel_mPerS = 0.0;
        this.yVel_mPerS = 0.0;
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

        let colors = getRandomKoiColors();

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
    speed_pxPerS() { return World.PX_PER_M * this.speed_mPerS(); }
    speed_mPerS() { return Math.sqrt(this.xVel_mPerS**2 + this.yVel_mPerS**2); }

    // returns distance (in px) from the center of the page
    distFromCenter_px() { return World.PX_PER_M * this.distFromCenter_m(); }
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
        if (this.y_m > (window.innerHeight + 40) / World.PX_PER_M * 0.475) {
            this.yVel_mPerS = -Math.abs(this.yVel_mPerS);
        }
        else if (this.y_m < (-window.innerHeight + 160) / World.PX_PER_M * 0.475) {
            this.yVel_mPerS = Math.abs(this.yVel_mPerS);
        }
        if (this.x_m > (window.innerWidth - 80) / World.PX_PER_M * 0.475) {
            this.xVel_mPerS = -Math.abs(this.xVel_mPerS);
        }
        else if (this.x_m < (-window.innerWidth - 20) / World.PX_PER_M * 0.475) {
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
        this.elem.style.left = World.middle_x + Math.round(this.x_m * World.PX_PER_M) + "px";
        this.elem.style.top  = World.middle_y - Math.round(this.y_m * World.PX_PER_M) + "px";
        
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
        this.elem.style.transform = "rotate(" + -this.heading_rad + "rad)";
        // ai
        this.think(dt_s);
    }
}

let fishCount = 0;
let tank = [];

function main() {
    if (false) {  // never end lol
        // but if wanted to, this how do stop
        clearInterval(id);
    } else {
        for (let fish in tank) {
            tank[fish].update(World.timeStep_ms / 1000.0);
        }
    }
}

function addFish() {
    if (fishCount >= World.maxFish) return;
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
