const { vec3 } = require("gl-matrix");
 // based on my implicit rt triangle
function hitTriangle(ray, record) {
    const [originX, originY] = ray.origin;
    const [dirX, dirY] = ray.dir;
  
    let t0 = (1.0 - originY - originX) / (dirX + dirY);
    let t1 = -(1.0 - originY + originX) / (dirX - dirY);
  
    const x = 1.0 - (originY + t0 * dirY);
    const y = 1.0 - (originY + t1 * dirY);
  
    if (x <= 0) {
      if (t0 > 0) {
        // console.log('hit x && t0')
        const p = ray.at(t0);
        const out = vec3.create();
        const normal = vec3.create();
  
        vec3.sub(out, p, vec3.create());
        vec3.normalize(normal, out);
  
        record.p = p;
        record.normal = normal;
  
        return true;
      }
    } else if (y <= 0) {
      if (t1 > 0) {
        // console.log('hit y && t1')
        const p = ray.at(t1);
        const out = vec3.create();
        const normal = vec3.create();
  
        vec3.sub(out, p, vec3.create());
        vec3.normalize(normal, out);
  
        record.p = p;
        record.normal = normal;
  
        return true;
      }
    } else {
      return false;
    }
  }

  module.exports = {hitTriangle}