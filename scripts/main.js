const carCanvas = document.getElementById("carCanvas");
carCanvas.width = innerWidth - 330;
carCanvas.height = window.innerHeight;

const networkCanvas = document.getElementById("networkCanvas");
networkCanvas.width = 300;
networkCanvas.height = window.innerHeight - 300;

const miniMapCanvas = document.getElementById("miniMapCanvas");
miniMapCanvas.width = 300;
miniMapCanvas.height = 300;

const carCtx = carCanvas.getContext("2d");
const networkCtx = networkCanvas.getContext("2d");
/*
const worldString = localStorage.getItem("world");
const worldInfo = worldString ? JSON.parse(worldString) : null;
const world = worldInfo ? World.fromJSON(worldInfo) : new World(new Graph());
*/
const viewport = new Viewport(carCanvas, world.zoom, world.offset);
const miniMap = new MiniMap(miniMapCanvas, world.graph, 300);

const N = 1;
const cars = generateCars(N);
let bestCar = cars[0];
if (localStorage.getItem("bestBrain")) {
  for (let i = 0; i < N; i++) {
    cars[i].brain = JSON.parse(localStorage.getItem("bestBrain"));
    if (i != 0) {
      NeuralNetwork.mutate(cars[i].brain, 0.2);
    }
  }
}
function generateCars(N) {
  const startPoints = world.markings.filter((m) => m instanceof Start);
  const startPoint =
    startPoints.length > 0 ? startPoints[0].center : new Point(100, 100);
  const dir =
    startPoints.length > 0 ? startPoints[0].directionVector : new Point(0, -1);
  const startAngle = -angle(dir) + Math.PI / 2;
  const cars = [];
  for (let i = 0; i < N; i++) {
    const car = new Car(startPoint.x, startPoint.y, 28, 50, "AI", startAngle);
    car.load(carInfo);
    cars.push(car);
  }
  return cars;
}

function save() {
  console.log("saved");
  localStorage.setItem("bestBrain", JSON.stringify(bestCar.brain));
}

function discard() {
  console.log("discarded");
  localStorage.removeItem("bestBrain");
}

const traffic = [];
let roadBorders = [];
const target = world.markings.find((m) => m instanceof Target);
if (target) {
  world.generateCorridor(bestCar, target.center);
  roadBorders = world.corridor.map((s) => [s.p1, s.p2]);
} else {
  roadBorders = world.roadBorders.map((s) => [s.p1, s.p2]);
}
animate();
function animate(time) {
  for (let car of traffic) {
    car.update([], []);
  }
  for (let car of cars) {
    car.update(roadBorders, traffic);
  }
  bestCar = cars.find(
    (c) => c.fitness == Math.max(...cars.map((c) => c.fitness))
  );
  world.cars = cars;
  world.bestCar = bestCar;

  viewport.offset.x = -bestCar.x;
  viewport.offset.y = -bestCar.y;

  viewport.reset();
  const viewPoint = scale(viewport.getOffset(), -1);
  world.draw(carCtx, viewPoint, false);
  miniMap.update(viewPoint);

  for (let car of traffic) {
    car.draw(carCtx);
  }

  networkCtx.lineDashOffset = -time / 50;
  networkCtx.clearRect(0, 0, networkCanvas.width, networkCanvas.height);
  Visualizer.drawNetwork(networkCtx, bestCar.brain);

  requestAnimationFrame(animate);
}
