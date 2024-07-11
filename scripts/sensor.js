class Sensor {
  constructor(car) {
    this.car = car;
    this.rayCount = 5;
    this.rayLength = 150;
    this.raySpread = Math.PI / 2;
    this.rayOffset = 0;

    this.rays = [];
    this.readings = [];
  }

  update(roadBorders, traffic) {
    this.#castRays();
    this.readings = [];
    for (let ray of this.rays) {
      this.readings.push(this.#getReading(ray, roadBorders, traffic));
    }
  }

  #getReading(ray, roadBorders, traffic) {
    const intersections = [];
    for (let i = 0; i < roadBorders.length; i++) {
      const intersection = getIntersection(ray, roadBorders[i]);
      if (intersection) {
        intersections.push(intersection);
      }
    }

    for (let i = 0; i < traffic.length; i++) {
      const poly = traffic[i].polygon;
      for (let j = 0; j < poly.length; j++) {
        const p1 = poly[j];
        const p2 = poly[(j + 1) % poly.length];
        const intersection = getIntersection(ray, [p1, p2]);
        if (intersection) {
          intersections.push(intersection);
        }
      }
    }

    if (intersections.length == 0) {
      return null;
    }
    const offsets = intersections.map((e) => e.offset);
    const minOffset = Math.min(...offsets);
    const closestIntersection = intersections[offsets.indexOf(minOffset)];
    return closestIntersection;
  }
  #castRays() {
    this.rays = [];
    for (let i = 0; i < this.rayCount; i++) {
      const rayAngle =
        linearInterpolation(
          this.raySpread / 2,
          -this.raySpread / 2,
          this.rayCount > 1 ? i / (this.rayCount - 1) : 0.5
        ) +
        this.car.angle +
        this.rayOffset;
      const start = { x: this.car.x, y: this.car.y };
      const end = {
        x: start.x - this.rayLength * Math.sin(rayAngle),
        y: start.y - this.rayLength * Math.cos(rayAngle),
      };
      this.rays.push({ start, end });
    }
  }

  draw(ctx) {
    let i = 0;
    for (let ray of this.rays) {
      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "yellow";
      ctx.moveTo(ray.start.x, ray.start.y);
      if (this.readings[i]) {
        ctx.lineTo(this.readings[i].x, this.readings[i].y);
        ctx.stroke();

        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "red";
        ctx.moveTo(this.readings[i].x, this.readings[i].y);
      }
      ctx.lineTo(ray.end.x, ray.end.y);
      ctx.stroke();
      i++;
    }
  }
}
