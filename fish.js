import { getRandomKoiColors } from "./koiColors.js";
import { World } from "./worldVars.js";

// returns rand float value in [a, b)
function random(a,b) {
    return a + Math.random()*(b-a);
}

// returns in range [a, b)
function randInt(a, b) {
    return Math.floor(random(a, b));
}

// exponential distribution; mean = 1 / lambda
function expRandom(lambda) {
    return Math.log(1.0 + Math.random()) / lambda;
}

// direction from a to b in radians
function vect2Dir(a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    let dir = Math.atan(dy / dx); // between -pi/2 & +pi/2
    if (dx < 0) dir += Math.PI;
    return dir;
}

class FishBrain {
    constructor(fish) {
        this.fish = fish;
        this.mood = "active";
        this.submood = "";
        this.fish.maxSpurtEnergy_J = 0.3;
        this.fish.maxFishPower_W = 62;
        this.moodDuration = 0;
        this.moodWaited = 0;
        this.submoodDuration = 0;
        this.submoodWaited = 0;
    }
    
    update(dt_s) {
        this.moodWaited += dt_s;
        this.submoodWaited += dt_s;

        // handle mood
        if (this.moodWaited > this.moodDuration) {
            this.moodWaited -= this.moodDuration;
            if (this.mood === "active") {
                this.moodDuration = expRandom(3.33e-2); // average 30 s
                this.mood = "tired";
                this.fish.maxSpurtEnergy_J = 0.001;
                this.fish.maxFishPower_W = 0.1;
            }
            else {
                this.moodDuration = expRandom(6.67e-3); // average 150 s
                this.mood = "active";
                this.fish.maxSpurtEnergy_J = 0.3;
                this.fish.maxFishPower_W = 62;
            }

            // reset submood
            this.submoodWaited = 0;
            this.submood = "";
            this.submoodDuration = 0;
        }

        // handle initial submood
        if (this.submood === "") {
            if (this.mood === "active") {
                if (Math.random() > 0.8) {
                    this.submood = "aimless";
                    this.submoodDuration = expRandom(0.05); // average 20 s
                }
                else {
                    this.submood = "schooling";
                    this.submoodDuration = expRandom(0.02); // average 20 s
                }
            }
            else {
                // nothing to do; no submoods for "tired" mood
            }
        }

        // handle submood changes
        if (this.submoodWaited > this.submoodDuration) {
            this.submoodWaited = 0.0;
            if (this.submood === "aimless" || this.submood === "schooling") {
                if (Math.random() > 0.8) {
                    this.submood = "aimless";
                    this.submoodDuration = expRandom(0.05); // average 20 s
                }
                else {
                    this.submood = "schooling";
                    this.submoodDuration = expRandom(0.02); // average 50 s
                }
            }
        }
    }
}

export class Fish {
    constructor(x_px, y_px, fishName) {
        this.brain = new FishBrain(this);
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
        this.fishToFollow = undefined;

        let colors = getRandomKoiColors();

        this.elem = document.createElement("p");
        let tail = `<span style="color:#${colors[0]}">&gt;</span>`;
        let body = `<span style="color:#${colors[1]}">&lt;</span>`;
        let head = `<span style="color:#${colors[2]}">&gt;</span>`;
        this.elem.innerHTML = tail + body + head;
        this.elem.id = fishName;
        this.elem.className = "fish";
        $("#fishtank").append(this.elem);

        this.brain.update(World.timeStep_ms / 1000);
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
        this.brain.update(dt_s);
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
            if (this.brain.submood === "schooling") {
                if (!this.fishToFollow) {
                    // follow the closest fish among 20 random fish
                    let consideredFishInd = randInt(0, World.fishCount);
                    const numFishToConsider = Math.min(World.tank.length - 1, 20);
                    let closestFish = undefined;
                    let closestFishDist2_m2 = Infinity;
                    for (let i = 0; i < numFishToConsider; i++) {
                        let consideredFish = World.tank[consideredFishInd];
                        // dont consider self
                        if (consideredFish === this) {
                            i--;
                            consideredFishInd++;
                            continue;
                        }
                        else if (consideredFish.mood === "tired") {
                            // dont follow tired fish
                            consideredFishInd++;
                            continue;
                        }

                        let fishDist2_m2 = (this.x_m - consideredFish.x_m)**2 + (this.y_m - consideredFish.y_m)**2;
                        if (fishDist2_m2 < closestFishDist2_m2) {
                            closestFishDist2_m2 = fishDist2_m2;
                            closestFish = consideredFish;
                        }

                        consideredFishInd++;
                        if (consideredFishInd >= World.tank.length) {
                            consideredFishInd = 0;
                        }
                    }
                    this.fishToFollow = closestFish;
                }

                if (this.fishToFollow) {
                    this.heading_rad = vect2Dir({x: this.x_m, y: this.y_m}, {x: this.fishToFollow.x_m, y: this.fishToFollow.y_m});
                }
                else {
                    this.heading_rad = Math.random() * 2 * Math.PI;
                }
            }
            else {
                this.heading_rad = Math.random() * 2 * Math.PI;
            }
            if (this.brain.mood == "active") {
                this.fishPower_W = random(5, this.maxFishPower_W);
                this.spurtTriggerSpeed_mPerS = random(0.1, 0.3);
            }
            else {
                this.fishPower_W = random(0, this.maxFishPower_W);
                this.spurtTriggerSpeed_mPerS = random(0.0, 0.1);
            }
            this.spurtEnergy_J = random(0, this.maxSpurtEnergy_J);
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
        // we do it this way because computing the acceleration (through F = ma = P/v)  will give us infinity when the fish is still
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