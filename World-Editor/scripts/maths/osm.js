const Osm = {
  parseRoads: (data) => {
    const nodes = data.elements.filter((n) => n.type === "node");

    const lats = nodes.map((n) => n.lat);
    const lons = nodes.map((n) => n.lon);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);

    const deltaLat = maxLat - minLat;
    const deltaLon = maxLon - minLon;
    const height = deltaLat * 111000 * 10;
    const aRatio = deltaLon / deltaLat;
    const width = height * aRatio * Math.cos(degToRad((minLat + maxLat) / 2));

    const points = [];
    const segments = [];
    for (const node of nodes) {
      const y = inverseLerp(maxLat, minLat, node.lat) * height - height / 2;
      const x = inverseLerp(minLon, maxLon, node.lon) * width - width / 2;
      const point = new Point(x, y);
      point.id = node.id;
      points.push(point);
    }

    const ways = data.elements.filter((w) => w.type === "way");
    for (const way of ways) {
      const ids = way.nodes;
      for (let i = 1; i < ids.length; i++) {
        const prev = points.find((p) => p.id === ids[i - 1]);
        const curr = points.find((p) => p.id === ids[i]);
        const oneWay = way.tags.oneway == "yes" || way.tags.lanes == "1";
        segments.push(new Segment(prev, curr, oneWay));
      }
    }

    return { points, segments };
  },
};
