function linearInterpolation(a, b, t) {
  return a + (b - a) * t;
}

function getIntersection(ray, border) {
  const x1 = ray.start.x;
  const y1 = ray.start.y;
  const x2 = ray.end.x;
  const y2 = ray.end.y;
  const x3 = border[0].x;
  const y3 = border[0].y;
  const x4 = border[1].x;
  const y4 = border[1].y;

  const denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (denominator == 0) {
    return null;
  }

  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denominator;
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denominator;

  if (t > 0 && t < 1 && u > 0 && u < 1) {
    return {
      offset: t,
      x: linearInterpolation(x1, x2, t),
      y: linearInterpolation(y1, y2, t),
    };
  }
  return null;
}

function polyIntersection(poly1, poly2) {
  for (let i = 0; i < poly1.length; i++) {
    const p1 = poly1[i];
    const p2 = poly1[(i + 1) % poly1.length];
    for (let j = 0; j < poly2.length; j++) {
      const p3 = poly2[j];
      const p4 = poly2[(j + 1) % poly2.length];
      if (getIntersection({ start: p1, end: p2 }, [p3, p4])) {
        return true;
      }
    }
  }
  return false;
}

function getRGBA(value) {
  const alpha = Math.abs(value);
  const R = value < 0 ? 0 : 255;
  const G = R;
  const B = value > 0 ? 0 : 255;
  return "rgba(" + R + "," + G + "," + B + "," + alpha + ")";
}
