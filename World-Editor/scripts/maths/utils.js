function getNearestPoint(loc, points, threshold = Infinity) {
  let minDist = Infinity;
  let nearestPoint = null;
  for (const point of points) {
    const dist = distance(loc, point);
    if (dist < minDist && dist < threshold) {
      minDist = dist;
      nearestPoint = point;
    }
  }
  return nearestPoint;
}

function getNearestSegment(loc, segments, threshold = Infinity) {
  let minDist = Infinity;
  let nearestSegment = null;
  for (const segment of segments) {
    const dist = segment.distanceToPoint(loc);
    if (dist < minDist && dist < threshold) {
      minDist = dist;
      nearestSegment = segment;
    }
  }
  return nearestSegment;
}

function distance(p1, p2) {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

function average(p1, p2) {
  return new Point((p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
}

function dot(p1, p2) {
  return p1.x * p2.x + p1.y * p2.y;
}

function add(p1, p2) {
  return new Point(p1.x + p2.x, p1.y + p2.y);
}

function sub(p1, p2) {
  return new Point(p1.x - p2.x, p1.y - p2.y);
}

function scale(p, s) {
  return new Point(p.x * s, p.y * s);
}

function normalize(p) {
  return scale(p, 1 / magnitude(p));
}

function magnitude(p) {
  return Math.hypot(p.x, p.y);
}

function perpendicular(p) {
  return new Point(-p.y, p.x);
}

function translate(loc, angle, offset) {
  return new Point(
    loc.x + offset * Math.cos(angle),
    loc.y + offset * Math.sin(angle)
  );
}

function angle(p) {
  return Math.atan2(p.y, p.x);
}

function linearInterpolation(a, b, t) {
  return a + (b - a) * t;
}

function linearInterpolation2D(p1, p2, t) {
  return new Point(
    linearInterpolation(p1.x, p2.x, t),
    linearInterpolation(p1.y, p2.y, t)
  );
}

function inverseLerp(a, b, x) {
  return (x - a) / (b - a);
}

function degToRad(deg) {
  return (deg * Math.PI) / 180;
}

function getIntersectionOfSeg(seg1, seg2) {
  const x1 = seg1.p1.x;
  const y1 = seg1.p1.y;
  const x2 = seg1.p2.x;
  const y2 = seg1.p2.y;
  const x3 = seg2.p1.x;
  const y3 = seg2.p1.y;
  const x4 = seg2.p2.x;
  const y4 = seg2.p2.y;

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

function pointInsidePolygon(point, polygon) {
  const x = point.x;
  const y = point.y;
  const points = polygon.points;
  var inside = false;
  for (var i = 0, j = points.length - 1; i < points.length; j = i++) {
    var xi = points[i].x,
      yi = points[i].y;
    var xj = points[j].x,
      yj = points[j].y;

    var intersect =
      yi > y != yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function getRandomColor() {
  return `hsl(${Math.random() * 360}, 100%, 50%)`;
}

function getFake3DPoint(point, viewPoint, height) {
  const dir = normalize(sub(point, viewPoint));
  const dist = distance(point, viewPoint);
  const scaler = Math.atan(dist / 700) / (Math.PI / 2);
  return add(point, scale(dir, height * scaler));
}
