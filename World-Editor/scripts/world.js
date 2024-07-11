class World {
  constructor(
    graph,
    roadWidth = 100,
    roadRoundness = 10,
    buildingWidth = 100,
    buildingMinLength = 150,
    spacing = 50,
    treeSize = 160
  ) {
    this.graph = graph;
    this.roadWidth = roadWidth;
    this.roadRoundness = roadRoundness;
    this.buildingWidth = buildingWidth;
    this.buildingMinLength = buildingMinLength;
    this.spacing = spacing;
    this.treeSize = treeSize;

    this.envelopes = [];
    this.roadBorders = [];
    this.buildings = [];
    this.trees = [];
    this.laneGuides = [];
    this.markings = [];
    this.cars = [];

    this.bestCar = null;
    this.frameCount = 0;

    this.generate();
  }

  static fromJSON(json) {
    const world = new World(new Graph());
    world.graph = Graph.fromJSON(json.graph);
    world.roadWidth = json.roadWidth;
    world.roadRoundness = json.roadRoundness;
    world.buildingWidth = json.buildingWidth;
    world.buildingMinLength = json.buildingMinLength;
    world.spacing = json.spacing;
    world.treeSize = json.treeSize;

    world.envelopes = json.envelopes.map((env) => Envelope.fromJSON(env));
    world.roadBorders = json.roadBorders.map((seg) => Segment.fromJSON(seg));
    world.buildings = json.buildings.map((build) => Building.fromJSON(build));
    world.trees = json.trees.map((tree) => Tree.fromJSON(tree));
    world.laneGuides = json.laneGuides.map((seg) => Segment.fromJSON(seg));
    world.markings = json.markings.map((mark) => Marking.fromJSON(mark));

    world.zoom = json.zoom;
    world.offset = json.offset;
    return world;
  }

  generate() {
    this.envelopes.length = 0;
    for (const seg of this.graph.segments) {
      this.envelopes.push(
        new Envelope(seg, this.roadWidth, this.roadRoundness)
      );
    }

    this.roadBorders = Polygon.union(this.envelopes.map((env) => env.poly));
    this.buildings = this.#generateBuildings();
    this.trees = this.#generateTrees();
    this.laneGuides.length = 0;
    this.laneGuides.push(...this.#generateLaneGuides());
  }

  generateCorridor(start, end) {
    const startSeg = getNearestSegment(start, this.graph.segments);
    const endSeg = getNearestSegment(end, this.graph.segments);

    const { point: projStart } = startSeg.projectionOf(start);
    const { point: projEnd } = endSeg.projectionOf(end);

    this.graph.points.push(projStart, projEnd);
    const tempSegs = [
      new Segment(startSeg.p1, projStart),
      new Segment(projStart, startSeg.p2),
      new Segment(endSeg.p1, projEnd),
      new Segment(projEnd, endSeg.p2),
    ];
    if (startSeg.equals(endSeg)) {
      tempSegs.push(new Segment(projStart, projEnd));
    }
    this.graph.segments = this.graph.segments.concat(tempSegs);

    const segs = [];
    let path = this.graph.getShortestPath(projStart, projEnd);
    for (let i = 1; i < path.length; i++) {
      segs.push(new Segment(path[i - 1], path[i]));
    }

    path = this.graph.getShortestPath(projEnd, projStart);
    for (let i = 1; i < path.length; i++) {
      const seg = new Segment(path[i - 1], path[i]);
      if (!segs.find((s) => s.equals(seg))) {
        segs.push(seg);
      }
    }

    this.graph.removePoint(projStart);
    this.graph.removePoint(projEnd);

    const tempEnvelopes = [];
    for (const seg of segs) {
      tempEnvelopes.push(new Envelope(seg, this.roadWidth, this.roadRoundness));
    }

    const segsUnion = Polygon.union(tempEnvelopes.map((env) => env.poly));
    this.corridor = segsUnion;
  }

  #generateLaneGuides() {
    const tempEnvelopes = [];
    for (const seg of this.graph.segments) {
      tempEnvelopes.push(
        new Envelope(seg, this.roadWidth / 2, this.roadRoundness)
      );
    }
    const segs = Polygon.union(tempEnvelopes.map((env) => env.poly));
    return segs;
  }

  #generateTrees() {
    const points = [
      ...this.roadBorders.map((seg) => [seg.p1, seg.p2]).flat(),
      ...this.buildings.map((building) => building.base.points).flat(),
    ];

    const left = Math.min(...points.map((p) => p.x));
    const right = Math.max(...points.map((p) => p.x));
    const top = Math.min(...points.map((p) => p.y));
    const bottom = Math.max(...points.map((p) => p.y));

    const illegalPolys = [
      ...this.envelopes.map((env) => env.poly),
      ...this.buildings.map((building) => building.base),
    ];

    const trees = [];
    let tryCount = 0;
    while (tryCount < 100) {
      const p = new Point(
        linearInterpolation(left, right, Math.random()),
        linearInterpolation(top, bottom, Math.random())
      );

      //check if tree is inside or nearby buildings / roads
      let legal = true;
      for (const poly of illegalPolys) {
        if (
          poly.containsPoint(p) ||
          poly.distanceToPoint(p) < this.treeSize / 2
        ) {
          legal = false;
          break;
        }
      }

      //check if tree is too close to other trees
      if (legal) {
        for (const tree of trees) {
          if (distance(tree.center, p) < this.treeSize) {
            legal = false;
            break;
          }
        }
      }

      //avoid isolated trees
      if (legal) {
        let closeToSomething = false;
        for (const poly of illegalPolys) {
          if (poly.distanceToPoint(p) < this.treeSize * 2) {
            closeToSomething = true;
            break;
          }
        }
        legal = closeToSomething;
      }

      if (legal) {
        trees.push(new Tree(p, this.treeSize));
        tryCount = 0;
      }
      tryCount++;
    }
    return trees;
  }

  #generateBuildings() {
    const tempEnvelopes = [];
    for (const seg of this.graph.segments) {
      tempEnvelopes.push(
        new Envelope(
          seg,
          this.roadWidth + this.buildingWidth + this.spacing * 2,
          this.roadRoundness
        )
      );
    }

    const guides = Polygon.union(tempEnvelopes.map((env) => env.poly));
    for (let i = 0; i < guides.length; i++) {
      const seg = guides[i];
      if (seg.length() < this.buildingMinLength) {
        guides.splice(i, 1);
        i--;
      }
    }

    const supports = [];
    for (const seg of guides) {
      const len = seg.length() + this.spacing;
      const buildingCount = Math.floor(
        len / (this.buildingMinLength + this.spacing)
      );
      const buildingLength = len / buildingCount - this.spacing;

      const direction = seg.directionVector();

      let q1 = seg.p1;
      let q2 = add(q1, scale(direction, buildingLength));
      supports.push(new Segment(q1, q2));

      for (let i = 2; i <= +buildingCount; i++) {
        q1 = add(q2, scale(direction, this.spacing));
        q2 = add(q1, scale(direction, buildingLength));
        supports.push(new Segment(q1, q2));
      }
    }

    const bases = [];
    for (const seg of supports) {
      bases.push(new Envelope(seg, this.buildingWidth).poly);
    }

    const eps = 1e-3;
    for (let i = 0; i < bases.length - 1; i++) {
      for (let j = i + 1; j < bases.length; j++) {
        if (
          bases[i].intersectsPoly(bases[j]) ||
          bases[i].distanceToPoly(bases[j]) < this.spacing - eps
        ) {
          bases.splice(j, 1);
          j--;
        }
      }
    }

    return bases.map((base) => new Building(base));
  }

  #getIntersections() {
    const intersections = [];
    for (const point of this.graph.points) {
      let degree = 0;
      for (const seg of this.graph.segments) {
        if (seg.includesPoint(point)) {
          degree++;
        }
      }
      if (degree > 2) {
        intersections.push(point);
      }
    }
    return intersections;
  }

  #updateLights() {
    const lights = this.markings.filter((m) => m instanceof Light);
    const controlCenters = [];
    for (const light of lights) {
      const point = getNearestPoint(light.center, this.#getIntersections());
      let controlCenter = controlCenters.find((c) => c.equals(point));
      if (!controlCenter) {
        controlCenter = new Point(point.x, point.y);
        controlCenter.lights = [light];
        controlCenters.push(controlCenter);
      } else {
        controlCenter.lights.push(light);
      }
    }
    const greenDuration = 2,
      yellowDuration = 1;
    for (const center of controlCenters) {
      center.ticks = center.lights.length * (greenDuration + yellowDuration);
    }
    const tick = Math.floor(this.frameCount / 60);
    for (const center of controlCenters) {
      const cTick = tick % center.ticks;
      const greenYellowIDX = Math.floor(
        cTick / (greenDuration + yellowDuration)
      );
      const greenOrYellow =
        cTick % (greenDuration + yellowDuration) < greenDuration
          ? "green"
          : "yellow";
      for (let i = 0; i < center.lights.length; i++) {
        if (i == greenYellowIDX) {
          center.lights[i].state = greenOrYellow;
        } else {
          center.lights[i].state = "red";
        }
      }
    }
    this.frameCount++;
  }

  draw(ctx, viewPoint, showStartMarkings = true, renderRadius = 1000) {
    this.#updateLights();
    for (const env of this.envelopes) {
      env.draw(ctx, { fill: "#BBB", stroke: "#BBB", lineWidth: 15 });
    }
    for (const marking of this.markings) {
      if (showStartMarkings || !(marking instanceof Start)) marking.draw(ctx);
    }
    for (const seg of this.graph.segments) {
      seg.draw(ctx, { color: "white", width: 4, dash: [10, 10] });
    }
    for (const seg of this.roadBorders) {
      seg.draw(ctx, { color: "white", width: 4 });
    }

    if (this.corridor) {
      for (const seg of this.corridor) {
        seg.draw(ctx, { color: "red", width: 4 });
      }
    }

    ctx.globalAlpha = 0.2;
    for (let car of this.cars) {
      car.draw(ctx);
    }
    ctx.globalAlpha = 1;
    if (this.bestCar) {
      this.bestCar.draw(ctx, true);
    }

    const items = [...this.buildings, ...this.trees].filter(
      (item) => item.base.distanceToPoint(viewPoint) < renderRadius
    );
    items.sort(
      (a, b) =>
        b.base.distanceToPoint(viewPoint) - a.base.distanceToPoint(viewPoint)
    );
    for (const item of items) {
      item.draw(ctx, viewPoint);
    }
  }
}
