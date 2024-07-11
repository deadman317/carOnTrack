class Visualizer {
  static drawNetwork(ctx, network) {
    const margin = 50;
    const left = margin;
    const top = margin;
    const width = ctx.canvas.width - 2 * margin;
    const height = ctx.canvas.height - 2 * margin;

    const levelHeight = height / network.levels.length;
    for (let i = network.levels.length - 1; i >= 0; i--) {
      const levelTop =
        top +
        linearInterpolation(
          height - levelHeight,
          0,
          network.levels.length == 1 ? 0.5 : i / (network.levels.length - 1)
        );
      ctx.setLineDash([7, 3]);
      Visualizer.drawLevels(
        ctx,
        network.levels[i],
        left,
        levelTop,
        width,
        levelHeight,
        i == network.levels.length - 1 ? ["↑", "←", "→", "↓"] : []
      );
    }
  }

  static drawLevels(ctx, level, left, top, width, height, outputLabels) {
    const right = left + width;
    const bottom = top + height;
    const nodeRadius = 12;
    const { inputs, outputs, weights, biases } = level;

    for (let i = 0; i < inputs.length; i++) {
      for (let j = 0; j < outputs.length; j++) {
        ctx.beginPath();
        ctx.moveTo(Visualizer.#getNodeX(left, right, i, inputs), bottom);
        ctx.lineTo(Visualizer.#getNodeX(left, right, j, outputs), top);
        ctx.lineWidth = 2;
        ctx.strokeStyle = getRGBA(weights[i][j]);
        ctx.stroke();
      }
    }

    for (let i = 0; i < inputs.length; i++) {
      const x = Visualizer.#getNodeX(left, right, i, inputs);
      ctx.beginPath();
      ctx.arc(x, bottom, nodeRadius * 1.5, 0, 2 * Math.PI);
      ctx.fillStyle = "black";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x, bottom, nodeRadius, 0, 2 * Math.PI);
      ctx.fillStyle = getRGBA(inputs[i]);
      ctx.fill();
    }

    for (let i = 0; i < outputs.length; i++) {
      const x = Visualizer.#getNodeX(left, right, i, outputs);
      ctx.beginPath();
      ctx.arc(x, top, nodeRadius * 1.5, 0, 2 * Math.PI);
      ctx.fillStyle = "black";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x, top, nodeRadius, 0, 2 * Math.PI);
      ctx.fillStyle = getRGBA(outputs[i]);
      ctx.fill();

      ctx.beginPath();
      ctx.lineWidth = 3;
      ctx.arc(x, top, nodeRadius * 1.2, 0, 2 * Math.PI);
      ctx.strokeStyle = getRGBA(biases[i]);
      ctx.setLineDash([3, 3]);
      ctx.stroke();
      ctx.setLineDash([]);

      if (outputLabels[i]) {
        ctx.beginPath();
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.strokeStyle = "green";
        ctx.font = nodeRadius * 1.5 + "px Arial";
        ctx.lineWidth = 2;
        ctx.strokeText(outputLabels[i], x, top);
      }
    }
  }

  static #getNodeX(left, right, i, nodes) {
    return linearInterpolation(
      left,
      right,
      nodes.length == 1 ? 0.5 : i / (nodes.length - 1)
    );
  }
}
