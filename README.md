# Smart Traffic-Aware Navigation System (STANS)

A map guidance system that helps individuals and businesses navigate efficiently by calculating optimal routes based on traffic conditions, blockades, and distance.

## Project Overview

This system develops a map guidance platform utilizing **Kruskal's algorithm** to compute the minimum spanning tree of a weighted directed graph. Graph weights are determined by distance, traffic intensity, and blockades, providing users with optimal routes they wouldn't know about ahead of time.

## Features

- **Graph Visualization**: Interactive 2D and 3D graph visualization with traffic-aware coloring
- **Algorithm Comparison**: Side-by-side comparison of Kruskal's, Prim's, and Dijkstra's algorithms
- **Route Calculator**: Calculate optimal paths between nodes
- **Graph Builder**: Create custom graphs with nodes, edges, and traffic conditions
- **Graph Templates**: Quick-load common network topologies (Grid, Tree, Complete, Bipartite, Star)
- **Performance Benchmarking**: Measure and compare algorithm execution times
- **Graph Metrics**: Analyze degree distribution, clustering coefficient, and betweenness centrality
- **Interactive Tutorial**: Step-by-step guide to using the system
- **Import/Export**: Support for JSON and CSV file formats

## Technologies Used

- React + TypeScript
- Vite
- Tailwind CSS
- Three.js (3D Visualization)
- Framer Motion (Animations)
- Recharts (Data Visualization)

-![Alt](https://repobeats.axiom.co/api/embed/a30bbe6fff62957b3cce362eef11556425224647.svg "Repobeats analytics image")



## Demo
https://github.com/user-attachments/assets/316df9d7-7e5a-47f3-9cdd-c0bae09110ae


## Course Information

- **Course**: Data Structures and Algorithms
- **Class**: BSE-3(B)
- **University**: Bahria University, Karachi Campus
- **Course Instructor**: Engr. Majid Kalim
- **Lab Instructor**: Engr. Saniya Sarim

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## DevOps

This fork adds production packaging for the [roadmap.sh STANS deployment project](https://roadmap.sh/projects/stans-navigation-deployment).

| Layer | Choice |
| --- | --- |
| Container | Multi-stage `node:22-alpine` build + `nginx:1.27-alpine` runtime |
| Routing | Nginx `try_files` for React client-side routes |
| Registry | GitHub Container Registry (`ghcr.io/arnold-rg/stans`) |
| CI/CD | `.github/workflows/deploy.yml` |
| Production | Host Nginx + Certbot TLS, UFW 22/80/443, `--restart=always` |

```bash
docker build -t stans-app .
docker run --restart=always -p 8080:80 stans-app
```

Full server, Terraform, Ansible, Kubernetes, Prometheus/Grafana, and logging steps are in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## License

This project is developed as part of the Data Structures and Algorithms course at Bahria University.
