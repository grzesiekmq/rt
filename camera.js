const Canvas = require("canvas");
const { vec3 } = require("gl-matrix");


const {hit, world} = require("./world")
const {hitTriangle} = require("./implicitTriangle")
const {randomUnitVec, sampleSquare, addEq} = require("./utils")

const record = {};

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

const center = vec3.fromValues(0, 0, -1);
const vpHeight = 2.0;
const vpWidth = (16.0 / 9.0) * vpHeight;
const focalLength = 1.0;
const samplesPerPixel = 100;

const width = 400;
const height = Math.round(width / (16.0 / 9.0));
const canvas = Canvas.createCanvas(width, height);
const ctx = canvas.getContext("2d");


const h = vec3.fromValues(vpWidth, 0, 0);
const v = vec3.fromValues(0, -vpHeight, 0);

const pixelDeltaU = vec3.create();
const pixelDeltaV = vec3.create();

vec3.scale(pixelDeltaU, h, 1 / width); // h / width
vec3.scale(pixelDeltaV, v, 1 / height); // v / height

const lowerLeft = vec3.create();

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

const out4 = vec3.create();

const normalized = vec3.create();



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

  function rayColorTriangle(ray, record, depth) {
    if (depth <= 0) {
      return vec3.fromValues(0, 0, 0);
    }
    if (hitTriangle(ray, record)) {
      // console.log("triangle hit");
  
      const attenuatedColor = vec3.create();
  
      const scatterDirection = vec3.create();
  
      vec3.add(scatterDirection, record.normal, randomUnitVec());
  
      ray.origin = record.p;
      ray.dir = scatterDirection;
  
      const scattered = ray;
      vec3.mul(
        attenuatedColor,
        rayColor(scattered, depth - 1, world),
        vec3.fromValues(0.5, 0.5, 0.5)
      );
  
      //metal
  
      // const reflected = reflect(ray.dir, record.normal);
      // ray.origin = record.p;
      // ray.dir = reflected;
  
      // vec3.mul(
      //   attenuatedColor,
      //   rayColor(scattered, depth - 1, world),
      //   vec3.fromValues(generator.random(), generator.random(), generator.random())
      // );
  
      return attenuatedColor;
    }
    return vec3.fromValues(0, 0, 0);
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

  function render(world) {
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const r = Math.abs(x / width);
        const g = Math.abs(y / height);
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
  
        let color;
  
        for (let sample = 0; sample < samplesPerPixel; sample++) {
          const ray = getRay(x, y);
  
          vec3.scale(
            scaledColor,
            addEq(startingColor, rayColorTriangle(ray, record, 5)),
            1.0 / samplesPerPixel
          );
          ray.origin = vec3.fromValues(-2, -2, 0);
          color = rayColorTriangle(ray, record, 5);
        }
  
        const scaledColorInt = new Int32Array(scaledColor);
        const [red, green, blue] = scaledColorInt;
        const [triRed, triGreen, triBlue] = color;
  
        // ctx.fillStyle = `rgb(${red},${green},${blue})`;
  
        // intentionally overwrite fillStyle to test triangle
        ctx.fillStyle = `rgb(${Math.round(triRed)},${Math.round(triGreen)},${Math.round(triBlue)})`;
  
        // console.log(ctx.fillStyle)
  
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  module.exports = {render, canvas}