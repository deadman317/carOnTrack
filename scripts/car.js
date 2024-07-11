class Car {
  constructor(
    x,
    y,
    width,
    height,
    controlType,
    angle = 0,
    maxSpeed = 3,
    color = "green"
  ) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;

    this.speed = 0;
    this.acceleration = 0.2;
    this.maxSpeed = maxSpeed;
    this.friction = 0.05;
    this.angle = angle;
    this.damaged = false;
    this.fitness = 0;

    if (controlType != "AUTO") {
      this.sensor = new Sensor(this);
      this.brain = new NeuralNetwork([this.sensor.rayCount, 6, 4]);
    }

    if (controlType == "AI") {
      this.useBrain = true;
    }

    this.controls = new Controls(controlType);

    this.img = new Image();
    this.img.src = "car.png";

    this.mask = document.createElement("canvas");
    this.mask.width = this.width;
    this.mask.height = this.height;

    const maskCtx = this.mask.getContext("2d");
    this.img.onload = () => {
      maskCtx.fillStyle = color;
      maskCtx.rect(0, 0, this.width, this.height);
      maskCtx.fill();

      maskCtx.globalCompositeOperation = "destination-atop";
      maskCtx.drawImage(this.img, 0, 0, this.width, this.height);
    };
  }

  load(info) {
    this.brain = info.brain;
    this.maxSpeed = info.maxSpeed;
    this.acceleration = info.acceleration;
    this.friction = info.friction;
    this.sensor.rayCount = info.sensor.rayCount;
    this.sensor.rayLength = info.sensor.rayLength;
    this.sensor.raySpread = info.sensor.raySpread;
    this.sensor.rayOffset = info.sensor.rayOffset;
  }

  update(roadBorders, traffic) {
    if (!this.damaged) {
      this.#move();
      this.fitness += this.speed;
      this.polygon = this.#createPolygon();
      this.damaged = this.#checkDamage(roadBorders, traffic);
    }
    if (this.sensor) {
      this.sensor.update(roadBorders, traffic);
      const offsets = this.sensor.readings
        .map((r) => (r == null ? 0 : 1 - r.offset))
        .concat([this.speed / this.maxSpeed]);
      const outputs = NeuralNetwork.feedForward(this.brain, offsets);
      if (this.useBrain) {
        this.controls.forward = outputs[0];
        this.controls.left = outputs[1];
        this.controls.right = outputs[2];
        this.controls.reverse = outputs[3];
      }
    }
  }

  #checkDamage(roadBorders, traffic) {
    for (let i = 0; i < roadBorders.length; i++) {
      if (polyIntersection(this.polygon, roadBorders[i])) {
        return true;
      }
    }

    for (let i = 0; i < traffic.length; i++) {
      if (polyIntersection(this.polygon, traffic[i].polygon)) {
        return true;
      }
    }
    return false;
  }

  #createPolygon() {
    const points = [];
    const radius = Math.hypot(this.width, this.height) / 2;
    const alpha = Math.atan2(this.width, this.height);

    points.push({
      x: this.x - radius * Math.sin(this.angle - alpha),
      y: this.y - radius * Math.cos(this.angle - alpha),
    });
    points.push({
      x: this.x - radius * Math.sin(this.angle + alpha),
      y: this.y - radius * Math.cos(this.angle + alpha),
    });
    points.push({
      x: this.x - radius * Math.sin(Math.PI + this.angle - alpha),
      y: this.y - radius * Math.cos(Math.PI + this.angle - alpha),
    });
    points.push({
      x: this.x - radius * Math.sin(Math.PI + this.angle + alpha),
      y: this.y - radius * Math.cos(Math.PI + this.angle + alpha),
    });
    return points;
  }
  #move() {
    if (this.controls.forward) {
      this.speed += this.acceleration;
    }
    if (this.controls.reverse) {
      this.speed -= this.acceleration;
    }
    if (this.speed > this.maxSpeed) {
      this.speed = this.maxSpeed;
    }
    if (this.speed < -this.maxSpeed / 2) {
      this.speed = -this.maxSpeed / 2;
    }
    if (this.speed > 0) {
      this.speed -= this.friction;
    }
    if (this.speed < 0) {
      this.speed += this.friction;
    }
    if (Math.abs(this.speed) < this.friction) {
      this.speed = 0;
    }

    if (this.speed != 0) {
      const flip = this.speed > 0 ? 1 : -1;

      if (this.controls.left) {
        this.angle += 0.03 * flip;
      }
      if (this.controls.right) {
        this.angle -= 0.03 * flip;
      }
    }

    this.y -= this.speed * Math.cos(this.angle);
    this.x -= this.speed * Math.sin(this.angle);
  }

  draw(ctx, drawSensor = false) {
    // if (this.damaged) {
    //   ctx.fillStyle = "gray";
    // } else {
    //   ctx.fillStyle = "blue";
    // }
    // ctx.beginPath();
    // ctx.moveTo(this.polygon[0].x, this.polygon[0].y);
    // for (let i = 1; i < this.polygon.length; i++) {
    //   ctx.lineTo(this.polygon[i].x, this.polygon[i].y);
    // }
    // ctx.fill();

    if (this.sensor && drawSensor) {
      this.sensor.draw(ctx);
    }

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(-this.angle);
    if (!this.damaged) {
      ctx.drawImage(
        this.mask,
        -this.width / 2,
        -this.height / 2,
        this.width,
        this.height
      );
      ctx.globalCompositeOperation = "multiply";
    }
    ctx.drawImage(
      this.img,
      -this.width / 2,
      -this.height / 2,
      this.width,
      this.height
    );
    ctx.restore();
  }
}
