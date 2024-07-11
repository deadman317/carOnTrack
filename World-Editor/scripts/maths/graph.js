class Graph {
  constructor(points = [], segments = []) {
    this.points = points;
    this.segments = segments;
  }

  static fromJSON(json) {
    const points = json.points.map((point) => Point.fromJSON(point));
    const segments = json.segments.map((seg) => {
      return new Segment(
        points.find((p) => p.equals(seg.p1)),
        points.find((p) => p.equals(seg.p2)),
        seg.oneWay
      );
    });
    return new Graph(points, segments);
  }

  hash() {
    return JSON.stringify(this);
  }

  addPoint(point) {
    this.points.push(point);
  }

  containsPoint(point) {
    return this.points.find((p) => p.equals(point));
  }

  tryAddPoint(point) {
    if (!this.containsPoint(point)) {
      this.addPoint(point);
      return true;
    }
    return false;
  }

  removePoint(point) {
    const segments = this.getSegmentWithPoint(point);
    segments.forEach((segment) => {
      this.removeSegment(segment);
    });
    this.points.splice(this.points.indexOf(point), 1);
  }

  addSegment(segment) {
    this.segments.push(segment);
  }

  containsSegment(segment) {
    return this.segments.find((s) => s.equals(segment));
  }

  tryAddSegment(segment) {
    if (!this.containsSegment(segment) && !segment.p1.equals(segment.p2)) {
      this.addSegment(segment);
      return true;
    }
    return false;
  }

  removeSegment(segment) {
    this.segments.splice(this.segments.indexOf(segment), 1);
  }

  getSegmentWithPoint(point) {
    return this.segments.filter((s) => s.includesPoint(point));
  }

  getSegmentWithLeavingFromPoint(point) {
    const segs = [];
    for (const seg of this.segments) {
      if (seg.oneWay) {
        if (seg.p1.equals(point)) segs.push(seg);
      } else {
        if (seg.includesPoint(point)) segs.push(seg);
      }
    }
    return segs;
  }

  getShortestPath(start, end) {
    this.points.forEach((point) => {
      point.distance = Infinity;
    });
    start.distance = 0;
    const queue = [];
    queue.push(start);
    const visited = new Set();
    const parent = new Map();
    let found = false;

    while (queue.length > 0) {
      const current = queue.shift();
      visited.add(current);
      if (current.equals(end)) {
        found = true;
        break;
      }

      const segs = this.getSegmentWithLeavingFromPoint(current);
      const neighbours = [];
      for (const seg of segs) {
        const otherPoint = seg.p1.equals(current) ? seg.p2 : seg.p1;
        if (otherPoint.distance >= current.distance + seg.length()) {
          otherPoint.distance = current.distance + seg.length();
          neighbours.push(otherPoint);
        }
      }

      neighbours.forEach((neighbour) => {
        if (!visited.has(neighbour)) {
          parent.set(neighbour, current);
          queue.push(neighbour);
        }
      });

      queue.sort((a, b) => a.distance - b.distance);
    }

    if (!found) {
      return [];
    }

    const path = [];
    let current = end;
    while (!current.equals(start)) {
      path.unshift(current);
      current = parent.get(current);
    }
    path.unshift(start);

    for (const point of this.points) {
      delete point.distance;
    }
    return path;
  }

  dispose() {
    this.points.length = 0;
    this.segments.length = 0;
  }

  draw(ctx) {
    this.segments.forEach((segment) => {
      segment.draw(ctx);
    });

    this.points.forEach((point) => {
      point.draw(ctx);
    });
  }
}
