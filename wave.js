////////////////////////START TERRAIN + SKY/////////////////////////////

(function () {
  var requestAnimationFrame =
    window.requestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function (callback) {
      window.setTimeout(callback, 1000 / 60);
    };
  window.requestAnimationFrame = requestAnimationFrame;
})();

// Terrain stuff.
var terrain = document.getElementById("terCanvas"),
  background = document.getElementById("bgCanvas"),
  terCtx = terrain.getContext("2d"),
  bgCtx = background.getContext("2d"),
  width = window.innerWidth,
  height = document.body.offsetHeight;
height < 400 ? (height = 400) : height;

terrain.width = background.width = width;
terrain.height = background.height = height;

// Some random points
var points = [],
  displacement = 140,
  power = Math.pow(2, Math.ceil(Math.log(width) / Math.log(2)));

// set the start height and end height for the terrain
points[0] = height * 0.8;
points[power] = height * 0.8;

// create the rest of the points
for (var i = 1; i < power; i *= 2) {
  for (var j = power / i / 2; j < power; j += power / i) {
    points[j] =
      (points[j - power / i / 2] + points[j + power / i / 2]) / 2 +
      Math.floor(Math.random() * -displacement + displacement);
  }
  displacement *= 0.6;
}

// draw the terrain
terCtx.beginPath();

for (var i = 0; i <= width; i++) {
  if (i === 0) {
    terCtx.moveTo(0, points[0]);
  } else if (points[i] !== undefined) {
    terCtx.lineTo(i, points[i]);
  }
}

terCtx.lineTo(width, terrain.height);
terCtx.lineTo(0, terrain.height);
terCtx.lineTo(0, points[0]);
terCtx.fill();

// Second canvas used for the stars
bgCtx.fillStyle = "#05004c";
bgCtx.fillRect(0, 0, width, height);

// stars
function Star(options) {
  this.size = Math.random() * 2;
  this.speed = Math.random() * 0.1;
  this.x = options.x;
  this.y = options.y;
}

Star.prototype.reset = function () {
  this.size = Math.random() * 2;
  this.speed = Math.random() * 0.1;
  this.x = width;
  this.y = Math.random() * height;
};

Star.prototype.update = function () {
  this.x -= this.speed;
  if (this.x < 0) {
    this.reset();
  } else {
    bgCtx.fillRect(this.x, this.y, this.size, this.size);
  }
};

function ShootingStar() {
  this.reset();
}

ShootingStar.prototype.reset = function () {
  this.x = Math.random() * width;
  this.y = 0;
  this.len = Math.random() * 80 + 10;
  this.speed = Math.random() * 10 + 6;
  this.size = Math.random() * 1 + 0.1;
  // this is used so the shooting stars arent constant
  this.waitTime = new Date().getTime() + Math.random() * 3000 + 500;
  this.active = false;
};

ShootingStar.prototype.update = function () {
  if (this.active) {
    this.x -= this.speed;
    this.y += this.speed;
    if (this.x < 0 || this.y >= height) {
      this.reset();
    } else {
      bgCtx.lineWidth = this.size;
      bgCtx.beginPath();
      bgCtx.moveTo(this.x, this.y);
      bgCtx.lineTo(this.x + this.len, this.y - this.len);
      bgCtx.stroke();
    }
  } else {
    if (this.waitTime < new Date().getTime()) {
      this.active = true;
    }
  }
};

var entities = [];

// init the stars
for (var i = 0; i < height; i++) {
  entities.push(
    new Star({ x: Math.random() * width, y: Math.random() * height })
  );
}

// Add 2 shooting stars that just cycle.
entities.push(new ShootingStar());
entities.push(new ShootingStar());

//animate background
function animate() {
  bgCtx.fillStyle = "#05004c";
  bgCtx.fillRect(0, 0, width, height);
  bgCtx.fillStyle = "#ffffff";
  bgCtx.strokeStyle = "#ffffff";

  var entLen = entities.length;

  while (entLen--) {
    entities[entLen].update();
  }

  requestAnimationFrame(animate);
}
animate();

////////////////////////START WAVE/////////////////////////////

var offset = 0;
var strum = 0.6;
let planetSelect;
let stopwatch;
let lastTime = 0;

// Target and current values for smoother transition
let currentWaves = 30;
let targetWaves;
let transitionDuration = 5; // Duration in seconds for the transition
let transitionProgress = 0;
let stopwatchSpeed = 1; // Speed of the stopwatch based on planet day length

// Define an array of planets in the same order as in the dropdown
const planets = [
  "Mercury",
  "Venus",
  "Earth",
  "Mars",
  "Jupiter",
  "Saturn",
  "Uranus",
  "Neptune",
];

// Preload images
let earthImage, mercuryImage;
let planetImages = {};

function preload() {
  // Load all the planet images
  earthImage = loadImage("Earth.png");
  mercuryImage = loadImage("Mercury.png");
  let venusImage = loadImage("Venus.png");
  let marsImage = loadImage("Mars.png");
  let jupiterImage = loadImage("Jupiter.png");
  let saturnImage = loadImage("Saturn.png");
  let uranusImage = loadImage("Uranus.png");
  let neptuneImage = loadImage("Neptune.png");

  // Add loaded images to the planetImages dictionary
  planetImages["Mercury"] = mercuryImage;
  planetImages["Venus"] = venusImage;
  planetImages["Earth"] = earthImage;
  planetImages["Mars"] = marsImage;
  planetImages["Jupiter"] = jupiterImage;
  planetImages["Saturn"] = saturnImage;
  planetImages["Uranus"] = uranusImage;
  planetImages["Neptune"] = neptuneImage;
}

// Add near the top of the file with other global variables
let isMuted = true; // Start muted

// Add after the setup() function
function setupMuteButton() {
  const playButton = document.getElementById("playButton");
  const muteButton = document.getElementById("muteButton");
  const muteSlash = muteButton.querySelector(".mute-slash");

  // Set initial state
  Tone.Destination.mute = true;

  playButton.addEventListener("click", async () => {
    await Tone.start();
    Tone.Transport.start();

    // Initialize audio with Earth's settings
    setPlanetSpeed(planetSelect.value());

    // Switch to mute button
    playButton.style.display = "none";
    muteButton.style.display = "block";

    // Start unmuted
    isMuted = false;
    Tone.Destination.mute = false;
    muteSlash.style.display = "none";
  });

  muteButton.addEventListener("click", () => {
    isMuted = !isMuted;
    muteSlash.style.display = isMuted ? "block" : "none";
    Tone.Destination.mute = isMuted;
  });
}

function updatePlanetInfo(planet) {
  // Hide all planet info boxes
  document.querySelectorAll(".planet-info").forEach((box) => {
    box.classList.remove("active");
  });

  // Show the selected planet's info box
  const planetInfo = document.getElementById(`${planet}-info`);
  if (planetInfo) {
    planetInfo.classList.add("active");
  }
}

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.position(0, 0);
  canvas.style("z-index", "100");

  // Add this line to setup the mute button
  setupMuteButton();

  // Create dropdown for planet selection
  planetSelect = createSelect();
  planetSelect.position(10, 10);
  planetSelect.option("Mercury");
  planetSelect.option("Venus");
  planetSelect.option("Earth");
  planetSelect.option("Mars");
  planetSelect.option("Jupiter");
  planetSelect.option("Saturn");
  planetSelect.option("Uranus");
  planetSelect.option("Neptune");

  // Set the default selected option to "Earth"
  planetSelect.selected("Earth");

  // Hide the dropdown
  planetSelect.hide();

  planetSelect.changed(() => {
    setPlanetSpeed(planetSelect.value());
  });

  // Set initial planet speed
  setPlanetSpeed(planetSelect.value());

  // Initialize stopwatch
  stopwatch = new Stopwatch();

  // Create left and right arrow buttons with images
  let leftArrow = createButton("");
  leftArrow.position(width / 2 - 60, height - 50);
  leftArrow.style("z-index", "101");
  leftArrow.style("position", "absolute");
  leftArrow.class("arrow-button left-arrow");
  leftArrow.mousePressed(() => cyclePlanet(-1));

  let rightArrow = createButton("");
  rightArrow.position(width / 2 + 15, height - 50);
  rightArrow.style("z-index", "101");
  rightArrow.style("position", "absolute");
  rightArrow.class("arrow-button right-arrow");
  rightArrow.mousePressed(() => cyclePlanet(1));
}

// Define the day lengths in seconds for each planet
const planetDaysInSeconds = {
  Mercury: 1408 * 60 * 60, // Corrected to match Earth's day in seconds
  Venus: 5832 * 60 * 60,
  Earth: 86400,
  Mars: 24.6 * 60 * 60,
  Jupiter: 9.9 * 60 * 60,
  Saturn: 10.7 * 60 * 60,
  Uranus: 17.2 * 60 * 60,
  Neptune: 16.1 * 60 * 60,
};

// Declare loops and synths outside the function to manage their lifecycle
let loopA;
let loopB;
let synthA;
let synthB;

function setPlanetSpeed(planet) {
  updatePlanetInfo(planet);

  let planet_day_length = planetDaysInSeconds[planet] || 86400;

  // Calculate waves and set stopwatch speed
  targetWaves = (86400 / planet_day_length) * 20;
  stopwatchSpeed = 86400 / planet_day_length;
  transitionProgress = 0;

  // Start audio context if needed
  if (Tone.context.state !== "running") {
    Tone.start();
  }

  // Rest of the existing setPlanetSpeed code...
  const earthBpm = 120;
  const planetBpm = (86400 / planet_day_length) * earthBpm;
  Tone.Transport.bpm.value = planetBpm;

  // Continue with synth setup...
  // Dispose existing loops and synths to avoid overlaps
  if (loopA) {
    loopA.stop();
    loopA.dispose();
  }
  if (loopB) {
    loopB.stop();
    loopB.dispose();
  }
  if (synthA) {
    synthA.dispose();
  }
  if (synthB) {
    synthB.dispose();
  }

  // Create new synths
  synthA = new Tone.FMSynth().toDestination();
  synthB = new Tone.AMSynth().toDestination();

  // Set the volume to 20%
  synthA.volume.value = -12; // -12 dB is approximately 20% volume
  synthB.volume.value = -12; // -12 dB is approximately 20% volume

  // Function to convert currentWaves to a usable frequency
  function getFrequencyFromWaves(waves) {
    return Tone.Frequency(waves * 1 + 15, "midi").toFrequency();
  }

  // Play a note every quarter-note
  loopA = new Tone.Loop((time) => {
    const frequency = getFrequencyFromWaves(currentWaves);
    synthA.triggerAttackRelease(frequency, "8n", time);
  }, "2n").start(0);

  // Play another note every off quarter-note
  loopB = new Tone.Loop((time) => {
    const frequency = getFrequencyFromWaves(currentWaves + 7);
    synthB.triggerAttackRelease(frequency, "8n", time);
  }, "2n").start("8n");

  // Start the transport if it's not already started
  if (Tone.Transport.state !== "started") {
    Tone.Transport.start();
  }
}

function cyclePlanet(direction) {
  // Get the current selected planet
  let currentPlanet = planetSelect.value();
  // Find the index of the current planet
  let index = planets.indexOf(currentPlanet);
  // Calculate the new index
  index = (index + direction + planets.length) % planets.length;
  // Get the new planet
  let newPlanet = planets[index];
  // Update the dropdown selection
  planetSelect.selected(newPlanet);
  // Update the planet speed and other parameters
  setPlanetSpeed(newPlanet);
  console.log("Active planet:", planetSelect.value());
}

function updateTransition(deltaTime) {
  // Increment transition progress based on the elapsed time
  transitionProgress += deltaTime / transitionDuration;

  // Clamp transition progress between 0 and 1
  transitionProgress = constrain(transitionProgress, 0, 1);

  // Smoothly interpolate between the current and target number of waves
  currentWaves = lerp(currentWaves, targetWaves, transitionProgress);
}

function draw() {
  clear();

  // Calculate deltaTime for smooth animation
  let currentTime = millis();
  let deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
  lastTime = currentTime;

  // Update the smooth transition for the sine wave
  updateTransition(deltaTime);

  // Draw the sine wave
  stroke(255, 255, 255, 76); // Set the stroke color to white with 30% transparency (76 out of 255)
  noFill();
  beginShape();

  // Calculate frequency based on the interpolated currentWaves value
  var frequency = (1 * PI * currentWaves) / width;

  for (var x = 0; x < width; x++) {
    var angle = offset + frequency * x;

    // Amplitude envelope (e.g., a Gaussian or linear function)
    var amplitudeEnvelope = sin((PI * x) / width); // Adjust as needed

    // Modulate the amplitude
    var y = map(
      sin(angle) * amplitudeEnvelope,
      -strum,
      strum,
      height / 2 - 100, // Increase amplitude range
      height / 2 + 100
    );

    vertex(x, y);
  }
  endShape();

  // Adjust the offset to animate the wave
  offset += 0.0016 * currentWaves;

  // Draw the stopwatch
  stopwatch.update(deltaTime); // Pass deltaTime to the update function
  stopwatch.display();
}

class Stopwatch {
  constructor() {
    this.time = 0;
    this.radius = 100;
  }

  update(deltaTime) {
    // Increment time based on deltaTime and the current stopwatchSpeed
    this.time += deltaTime * stopwatchSpeed;
  }

  display() {
    // Get the current planet image based on the selected planet
    let planetImage = planetImages[planetSelect.value()];

    // If the image is available, display it as the background of the stopwatch
    if (planetImage) {
      image(
        planetImage,
        (width - this.radius * 2) / 2,
        (height - this.radius * 2) / 2,
        this.radius * 2,
        this.radius * 2
      );
    }

    // Calculate the angle of the hand
    let angle = map(this.time % 60, 0, 60, 0, TWO_PI) - HALF_PI;

    // Draw the hand
    stroke(0);
    strokeWeight(4);
    line(
      width / 2,
      height / 2,
      width / 2 + this.radius * cos(angle),
      height / 2 + this.radius * sin(angle)
    );

    // Draw stopwatch label (optional)
    // noStroke();
    // fill(0);
    // textAlign(CENTER, CENTER);
    // textSize(18);
    // text(planetSelect.value() + " Stopwatch", width / 2, height / 2 + 120);
  }
}
