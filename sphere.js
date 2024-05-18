const { vec3 } = require("gl-matrix");


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

  module.exports = {hitSphere}