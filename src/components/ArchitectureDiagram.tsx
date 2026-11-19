const flow = [
  {
    n: "01",
    title: "Place",
    body: "A Nominatim search, a click on the map, or the browser’s GPS fix. If the name lookup fails, the pin keeps the coordinates.",
  },
  {
    n: "02",
    title: "Route",
    body: "The public OSRM server returns drive, cycle, or walk geometry, a duration, and turns. An alternate shows up only when the network has one.",
  },
  {
    n: "03",
    title: "Field",
    body: "Open-Meteo for the weather and the height. Overpass for hospitals, police, fire, and fuel near the from-point.",
  },
  {
    n: "04",
    title: "Graph",
    body: "Zoom in, then pull the highway ways in view. Dijkstra runs between the nodes nearest your pins. Kruskal reports a spanning tree of those links. The weight is length divided by the OSM speed, not a traffic camera.",
  },
];

const ArchitectureDiagram = () => {
  return (
    <ol className="grid gap-4 sm:grid-cols-2">
      {flow.map((step) => (
        <li key={step.n} className="desk-panel">
          <p className="eyebrow">{step.n}</p>
          <h3 className="mt-3 font-display text-[1.85rem] leading-none text-foreground">{step.title}</h3>
          <p className="mt-3 text-[0.98rem] leading-relaxed text-muted-foreground">{step.body}</p>
        </li>
      ))}
    </ol>
  );
};

export default ArchitectureDiagram;
