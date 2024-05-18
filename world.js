const { vec3 } = require("gl-matrix");


const world = {
    objects: [],
  };
  

function hit(ray, tMin, tMax, record, depth, world, color) {
    let hit = false;
  
    for (const obj of world.objects) {
      if (obj.hitSphere(obj.center, obj.radius, ray, tMin, tMax, record)) {
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

  module.exports = {hit, world}