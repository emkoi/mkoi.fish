import { World } from "./worldVars.js";
import { Fish } from "./fish.js"

$(document).ready(init);
$(document).click(addFish);

// exponential distribution; mean = 1 / lambda
function expRandom(lambda) {
    return Math.log(1.0 + Math.random()) / lambda;
}
let wait_s = expRandom(1.66e-2);
let waited_s = 0.0;

function init() {
    setInterval(main, World.timeStep_ms); // update every 5ms    
    World.tank.push(new Fish(0, 50, "mkoi"));
    const initialFish = Math.min(200, World.maxFish);
    for (let i = 0; i < initialFish; i++) addFish();
}

// returns rand float value in [a, b)
function random(a,b) {
    return a + Math.random()*(b-a);
}

// returns in range [a, b)
function randInt(a, b) {
    return Math.floor(random(a, b));
}

// change this so its not in some random time zone nobody cares about
function dayPercentComplete() {
    const date = new Date();
    const time_ms = date.getTime() - date.getTimezoneOffset() * 60000; // ...since 1/1/1970
    const daySpeedMultiplier = 1.0;
    const dayTime_ms = time_ms * daySpeedMultiplier % 86400000;
    return dayTime_ms / 864000;
}

function worldUpdate() {
    World.time = dayPercentComplete();
    let alphaMultiplier = (Math.max(15, Math.min(35.0, Math.abs((World.time + 95.0) % 100 - 50.0))) - 15) / 20.0;
    const rgbaStr = `rgba(${World.overlayColor[0]}, 
        ${World.overlayColor[1]}, 
        ${World.overlayColor[2]}, 
        ${alphaMultiplier * World.overlayColor[3]})`;
    $('#overlay').css('background-color', rgbaStr);
}

function main() {
    if (false) {  // never end lol
        // but if wanted to, this how do stop
        clearInterval(id);
    } else {
        worldUpdate();
        for (let fish in World.tank) {
            World.tank[fish].update(World.timeStep_ms / 1000.0);
        }
    }
}

function addFish() {
    if (World.fishCount >= World.maxFish) return;
    World.tank.push(new Fish(
        random(-innerWidth * 0.375 - 20, innerWidth * 0.375 - 80), 
        random(-innerHeight * 0.375 + 80, innerHeight * 0.375 + 40), 
        "fish" + ++World.fishCount)
    );
}

// don't do this :(
function removeFish() {
    if (World.fishCount == 0) return;
    let fishIndex = randInt(0, World.fishCount + 1);
    World.tank[fishIndex].destruct();
    World.tank.splice(fishIndex, 1);
}
