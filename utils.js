const { vec3 } = require("gl-matrix");
const mt = require("mersenne-twister");

const generator = new mt();

function clamp(min, value, max) {
    return Math.min(Math.max(value, min), max);
  }

  function random(min, max) {
    return vec3.fromValues(
      generator.random() * (max - min) + min,
      generator.random() * (max - min) + min,
      generator.random() * (max - min) + min
    );
  }
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

  function addEq(v1, v2) {
    v1[0] += v2[0];
    v1[1] += v2[1];
    v1[2] += v2[2];
    return v1;
  }

  module.exports = {random, addEq, randomInUnitSphere, randomUnitVec, reflect, sampleSquare}