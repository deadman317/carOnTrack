class NeuralNetwork {
  constructor(neuronCounts) {
    this.levels = [];
    for (let i = 1; i < neuronCounts.length; i++) {
      this.levels.push(new Level(neuronCounts[i - 1], neuronCounts[i]));
    }
  }
  static feedForward(network, inputs) {
    let outputs = inputs;
    for (let level of network.levels) {
      outputs = Level.feedForward(level, outputs);
    }
    return outputs;
  }

  static mutate(network, mutationRate = 1) {
    for (let level of network.levels) {
      for (let i = 0; i < level.weights.length; i++) {
        for (let j = 0; j < level.weights[i].length; j++) {
          level.weights[i][j] = linearInterpolation(
            level.weights[i][j],
            Math.random() * 2 - 1,
            mutationRate
          );
        }
      }
      for (let i = 0; i < level.biases.length; i++) {
        level.biases[i] = linearInterpolation(
          level.biases[i],
          Math.random() * 2 - 1,
          mutationRate
        );
      }
    }
  }
}

class Level {
  constructor(inputCount, outputCount) {
    this.inputs = new Array(inputCount);
    this.outputs = new Array(outputCount);
    this.biases = new Array(outputCount);

    this.weights = [];
    for (let i = 0; i < inputCount; i++) {
      this.weights.push(new Array(outputCount));
    }

    Level.#randomize(this);
  }

  static #randomize(level) {
    for (let i = 0; i < level.inputs.length; i++) {
      for (let j = 0; j < level.outputs.length; j++) {
        level.weights[i][j] = Math.random() * 2 - 1;
      }
    }
    for (let i = 0; i < level.outputs.length; i++) {
      level.biases[i] = Math.random() * 2 - 1;
    }
  }

  static feedForward(level, inputs) {
    for (let i = 0; i < level.inputs.length; i++) {
      level.inputs[i] = inputs[i];
    }
    for (let i = 0; i < level.outputs.length; i++) {
      let sum = 0;
      for (let j = 0; j < level.inputs.length; j++) {
        sum += inputs[j] * level.weights[j][i];
      }
      if (sum > level.biases[i]) {
        level.outputs[i] = 1;
      } else {
        level.outputs[i] = 0;
      }
    }

    return level.outputs;
  }
}
