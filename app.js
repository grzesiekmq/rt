const fs = require("fs");
const path = require("path");
const Canvas = require("canvas");
const { vec3 } = require("gl-matrix");
const mt = require("mersenne-twister");

const generator = new mt();

const width = 400;
const height = Math.round(width / (16.0 / 9.0));
const canvas = Canvas.createCanvas(width, height);
const ctx = canvas.getContext("2d");

const center = vec3.fromValues(0, 0, -1);
const vpHeight = 2.0;
const vpWidth = (16.0 / 9.0) * vpHeight;
const focalLength = 1.0;
const samplesPerPixel = 10;

const h = vec3.fromValues(vpWidth, 0, 0);
const v = vec3.fromValues(0, -vpHeight, 0);

const pixelDeltaU = vec3.create();
const pixelDeltaV = vec3.create();

vec3.scale(pixelDeltaU, h, 1 / width); // h / width
vec3.scale(pixelDeltaV, v, 1 / height); // v / height

const lowerLeft = vec3.create();

const rayGlobal = {
  origin: vec3.fromValues(0, 0, 0),
  dir: vec3.fromValues(0, 0, 0),
  at(t) {
    const tdir = vec3.create();
    const out = vec3.create();
    vec3.scale(tdir, this.dir, t);
    vec3.add(out, this.origin, tdir);
    return out;
  },
};

const record = {};



const world = {
  objects: [],
};
function hitSphere(center, r, ray, tMin, tMax, record) {
  const oc = vec3.create();
  vec3.sub(oc, ray.origin, center);
  const a = vec3.dot(ray.dir, ray.dir);
  const b = 2.0 * vec3.dot(oc, ray.dir);
  const c = vec3.dot(oc, oc) - r * r;
  const delta = b * b - 4 * a * c;

  if (delta < 0) {
    return false;
  }
  let root = (-b - Math.sqrt(delta)) / (2.0 * a);
  const surrounds = tMin < root && root < tMax;
  if (!surrounds) {
    root = (-b + Math.sqrt(delta)) / (2.0 * a);
    if (!surrounds) {
      return false;
    }
  }
  const p = ray.at(root);
  const out = vec3.create();
  const normal = vec3.create();
  vec3.sub(out, p, center);
  vec3.scale(normal, out, 1 / r);

  record.p = p;
  record.normal = normal;

  return true;
}
const sphere1 = { hitSphere };
sphere1.material = {};
sphere1.material.type = "lambertian";
sphere1.center = vec3.fromValues(-0.5, 0, -1);
sphere1.attenuation = vec3.fromValues(0.5, 0.5, 0.5);
const sphere2 = { hitSphere };
sphere2.material = {};
sphere2.material.type = "metal";
sphere2.center = vec3.fromValues(0.5, 0, -1);
sphere2.attenuation = vec3.fromValues(0.8, 0.6, 0.2);

world.objects.push(sphere1, sphere2);

const out = vec3.create();
const oh = vec3.create();
const halfH = vec3.create();
const halfV = vec3.create();

vec3.scale(halfH, h, 0.5);
vec3.sub(oh, rayGlobal.origin, halfH);
vec3.scale(halfV, v, 0.5);

vec3.sub(out, oh, halfV);
vec3.sub(lowerLeft, out, vec3.fromValues(0, 0, focalLength));

const pixelDeltas = vec3.create();
const halfPixelDeltas = vec3.create();
const pixelLoc = vec3.create();

vec3.add(pixelDeltas, pixelDeltaU, pixelDeltaV);
vec3.scale(halfPixelDeltas, pixelDeltas, 0.5);

vec3.add(pixelLoc, lowerLeft, halfPixelDeltas);

console.log("pixel loc", pixelLoc);
function hit(ray, tMin, tMax, record, depth, world, color) {
  let hit = false;

  for (const obj of world.objects) {
    if (obj.hitSphere(obj.center, 0.5, ray, tMin, tMax, record)) {
      hit = true;
      const rec = record;
      if (obj.material.type === "lambertian") {
        // console.log("inside lambertian")

        const attenuatedColor = vec3.create();

        const scatterDirection = vec3.create();
        vec3.add(scatterDirection, record.normal, randomUnitVec());

        ray.origin = record.p;
        ray.dir = scatterDirection;
        const scattered = ray;
        vec3.mul(
          attenuatedColor,
          rayColor(scattered, depth - 1, world),
          obj.attenuation
        );

        const [r, g, b] = attenuatedColor;
        color[0] = r;
        color[1] = g;
        color[2] = b;
      } else if (obj.material.type === "metal") {
        // console.log("inside metal");

        const attenuatedColor = vec3.create();

        const reflected = reflect(ray.dir, record.normal);
        ray.origin = record.p;
        ray.dir = reflected;
        const scattered = ray;
        vec3.mul(
          attenuatedColor,
          rayColor(scattered, depth - 1, world),
          obj.attenuation
        );
        // console.log(attenuatedColor)
        const [r, g, b] = attenuatedColor;
        color[0] = r;
        color[1] = g;
        color[2] = b;
      }
    }
  }
  return hit;
}
function rayColor(ray, depth, world) {
  if (depth <= 0) {
    return vec3.fromValues(0, 0, 0);
  }
  const color = vec3.create();
  if (hit(ray, 0.001, Number.MAX_VALUE, record, depth, world, color)) {
    return color;
  }

  const unitDir = vec3.create();
  vec3.normalize(unitDir, ray.dir);

  const a = 128 * (unitDir[1] + 1.0);

  const out = vec3.create();
  const out2 = vec3.create();
  const added = vec3.create();
  const oneMinusA = 255 - a;
  vec3.scale(out, vec3.fromValues(1.0, 1.0, 1.0), oneMinusA);
  vec3.scale(out2, vec3.fromValues(0.5, 0.7, 1.0), a);
  vec3.add(added, out, out2);

  return vec3.fromValues(
    Math.round(added[0]),
    Math.round(added[1]),
    Math.round(added[2])
  );
}

const out4 = vec3.create();

const normalized = vec3.create();

function random(min, max) {
  return vec3.fromValues(
    generator.random() * (max - min) + min,
    generator.random() * (max - min) + min,
    generator.random() * (max - min) + min
  );
}

console.log(random(-1, 1));

function randomInUnitSphere() {
  while (true) {
    const p = random(-1, 1);
    if (vec3.sqrLen(p) < 1) {
      return p;
    }
  }
}
function randomUnitVec() {
  return vec3.random(randomInUnitSphere());
}

function randomOnHemisphere(normal) {
  const onUnitSphere = randomUnitVec();
  const negated = vec3.create();
  if (vec3.dot(onUnitSphere, normal) > 0.0) {
    return onUnitSphere;
  }
  return vec3.negate(negated, onUnitSphere);
}

function reflect(v, n) {
  const nScaled = vec3.create();
  const reflected = vec3.create();
  vec3.scale(nScaled, n, 2 * vec3.dot(v, n));
  vec3.sub(reflected, v, nScaled);
  return reflected;
}

function sampleSquare() {
  return vec3.fromValues(generator.random() - 0.5, generator.random() - 0.5, 0);
}

function getRay(i, j) {
  const offset = sampleSquare();
  const tempI = vec3.create();
  const tempJ = vec3.create();
  const addedTemps = vec3.create();
  const pixelSample = vec3.create();
  const ray = {
    at(t) {
      const tdir = vec3.create();
      const out = vec3.create();
      vec3.scale(tdir, this.dir, t);
      vec3.add(out, this.origin, tdir);
      return out;
    },
  };
  const rayDir = vec3.create();
  //reference: pixelSample = pixelLoc + ((i + offset[0]) * pixelDeltaU)
  //          + ((j + offset[1]) * pixelDeltaV)
  // pixelSample = pixelLoc + tempI + TempJ
  const ix = i + offset[0];
  const jy = j + offset[1];
  vec3.scale(tempI, pixelDeltaU, ix);
  vec3.scale(tempJ, pixelDeltaV, jy);
  vec3.add(addedTemps, tempI, tempJ);
  vec3.add(pixelSample, pixelLoc, addedTemps);

  // console.log(pixelSample)
  const c = vec3.fromValues(0, 0, 0);
  vec3.sub(rayDir, pixelSample, c);
  ray.origin = c;
  ray.dir = rayDir;

  //   console.log(ray)
  return ray;
}

function addEq(v1, v2) {
  v1[0] += v2[0];
  v1[1] += v2[1];
  v1[2] += v2[2];
  return v1;
}

function render(world) {
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const r = x / width;
      const g = y / height;
      const rh = vec3.create();
      const lowerLeftRh = vec3.create();
      const gv = vec3.create();
      const lowerLeftrhgv = vec3.create();

      vec3.scale(rh, h, r);
      vec3.add(lowerLeftRh, lowerLeft, rh);
      vec3.scale(gv, v, g);
      vec3.add(lowerLeftrhgv, lowerLeftRh, gv);
      vec3.sub(out4, lowerLeftrhgv, rayGlobal.origin);

      vec3.normalize(normalized, out4);

      rayGlobal.dir = normalized;
      const xPixelDeltaU = vec3.create();
      const yPixelDeltaV = vec3.create();
      const pixelDeltaAdded = vec3.create();
      const pixelCenter = vec3.create();
      vec3.scale(xPixelDeltaU, pixelDeltaU, x);
      vec3.scale(yPixelDeltaV, pixelDeltaV, y);
      vec3.add(pixelDeltaAdded, xPixelDeltaU, yPixelDeltaV);
      vec3.add(pixelCenter, pixelLoc, pixelDeltaAdded);

      //   console.log(pixelDeltaAdded)
      const rayDir = vec3.create();
      vec3.sub(rayDir, pixelCenter, center);
      rayGlobal.origin = center;
      rayGlobal.dir = rayDir;

      const startingColor = vec3.fromValues(0, 0, 0);

      const scaledColor = vec3.fromValues(0, 0, 0);
      // console.log(ray)

      for (let sample = 0; sample < samplesPerPixel; sample++) {
        const ray = getRay(x, y);

        vec3.scale(
          scaledColor,
          addEq(startingColor, rayColor(ray, 50, world)),
          1.0 / samplesPerPixel
        );
      }
      const scaledColorInt = new Int32Array(scaledColor);
      const [red, green, blue] = scaledColorInt;
      ctx.fillStyle = `rgb(${red},${green},${blue})`;

      ctx.fillRect(x, y, 1, 1);
    }
  }
}
render(world);

canvas
  .createJPEGStream()
  .pipe(fs.createWriteStream(path.join(__dirname, "/image.jpg")));
console.log("image created");
