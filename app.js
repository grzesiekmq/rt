const fs = require("fs");
const path = require("path");
const { vec3 } = require("gl-matrix");
const mt = require("mersenne-twister");
const { render, canvas } = require("./camera");
const { hitSphere } = require("./sphere");
const { world } = require("./world");

const generator = new mt();

// world construction
const sphere1 = { hitSphere };
sphere1.material = {};
sphere1.material.type = "lambertian";
sphere1.center = vec3.fromValues(-1, 0, -1);
sphere1.radius = 0.2;
sphere1.attenuation = vec3.fromValues(0.5, 0.5, 0.5);
const sphere2 = { hitSphere };
sphere2.material = {};
sphere2.material.type = "metal";
sphere2.center = vec3.fromValues(0.5, 0, -1);
sphere2.radius = 0.2;
sphere2.attenuation = vec3.fromValues(0.8, 0.6, 0.2);
const groundSphere = { hitSphere };
groundSphere.material = { type: "metal" };
groundSphere.center = vec3.fromValues(0, -100.5, -1);
groundSphere.radius = 100;
groundSphere.attenuation = vec3.fromValues(0.8, 0.6, 0.2);

const sphere3 = { hitSphere };
sphere3.material = {};
sphere3.material.type = "metal";
sphere3.center = vec3.fromValues(-0.5, 0, -1);
sphere3.radius = 0.2;
sphere3.attenuation = vec3.fromValues(
  generator.random(),
  generator.random(),
  generator.random()
);

const sphere4 = { hitSphere };
sphere4.material = {};
sphere4.material.type = "metal";
sphere4.center = vec3.fromValues(0, 0, -1);
sphere4.radius = 0.2;
sphere4.attenuation = vec3.fromValues(
  generator.random(),
  generator.random(),
  generator.random()
);

const sphere5 = { hitSphere };
sphere5.material = {};
sphere5.material.type = "metal";
sphere5.center = vec3.fromValues(1, 0, -1);
sphere5.radius = 0.2;
sphere5.attenuation = vec3.fromValues(
  generator.random(),
  generator.random(),
  generator.random()
);

// world.objects.push(sphere1, sphere2, sphere3, sphere4, sphere5, groundSphere);

render(world);

canvas
  .createJPEGStream()
  .pipe(fs.createWriteStream(path.join(__dirname, "/image.jpg")));
console.log("image created");

module.exports = { generator };
