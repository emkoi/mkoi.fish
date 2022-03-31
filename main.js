import { World } from "./worldVars.js";
import { Fish } from "./fish.js"

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
