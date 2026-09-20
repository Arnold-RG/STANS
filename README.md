# STANS

Karachi does not have a spare network. When a link clogs or a road closes, a dispatcher still has to get a vehicle from Saddar to Korangi. STANS is a traffic-operations desk that treats the city as a weighted graph: junctions are nodes, roads are edges, and the cost of a hop is minutes under live delay, not just distance.

On first paint the Karachi board is already up — Clifton, DHA, Saddar, Gulshan, Korangi — and the night simulation is running.

## What you see

The desk opens on the Karachi board. Phones get the map first and a bottom bar (Map, Route, Desk, Cities). Wider screens add the route rail and the incident feed. Vite listens on every interface at port 8080, so other devices on the same network can open it.

## How it is built

```
City graph (nodes, edges, traffic, closures)
        │
        ▼
Effective weights  =  minutes × traffic × live multiplier
        │
        ├─ Dijkstra / A*   →  one path through current closures
        ├─ Kruskal / Prim  →  minimum spanning tree of the sector
        └─ Vite build
                │
                ▼
        Nginx static image  (node:22-alpine → nginx:1.27-alpine)
```

The dashboard is the product. Dijkstra, Kruskal, Prim, the graph builder, and JSON/CSV import stay on the same board.

## Run it

```bash
npm install
npm run dev
```

Vite binds `host: "::"` on **8080**, so the desk is on the LAN as well as `http://localhost:8080`.

```bash
npm run build
npm run preview
```

## Docker and CI

```bash
docker build -t stans-app .
docker run --restart=always -p 8080:80 stans-app
```

Image: multi-stage `node:22-alpine` build, `nginx:1.27-alpine` runtime, `try_files` for client routes. Registry and workflow notes are in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). Workflow: `.github/workflows/deploy.yml`.

## License

[GNU GPL-3.0](LICENSE)

---

Originally written for Data Structures and Algorithms, BSE-3(B), Bahria University Karachi Campus (Engr. Majid Kalim; lab: Engr. Saniya Sarim).
