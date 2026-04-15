# Miller Explorer Pro - 3D Crystallography & Engineering Lab

A high-fidelity, industrial-grade 3D viewer for Miller $(\text{hkl})$ and Miller-Bravais $(\text{hkil})$ indices. Designed for material scientists, engineers, and students, providing a robust environment for technical analysis of crystal systems.

![THREE.js](https://img.shields.io/badge/Render-Three.js-blue) ![Mobile-First](https://img.shields.io/badge/UX-Mobile--First-green) ![Engineering](https://img.shields.io/badge/Lab-Engineering--Mode-orange)

## 🌟 Core Features

### ⚛️ Multi-System Support
- **Cubic Systems**: Full support for **SC**, **BCC**, and **FCC** lattice structures.
- **Hexagonal (HCP)**: Advanced Miller-Bravais $(\text{hkil})$ logic within a mathematically audit hexagonal prism.
- **Atomic Visualization**: Real-time rendering of lattice sites, basis atoms, and internal stacking (Layer B) in HCP.

### ⚙️ Engineering Mode (Technical Dashboard)
- **Slip Systems**: Determine favorability using integrated **Planar and Linear Density** scores.
- **Schmid Factor Calculator**: Analyze resolved shear stress $(\tau_r)$ under custom loading directions $[X Y Z]$.
- **Mechanism Engine**: Heuristic interpretation of dislocation movement based on active slip systems.
- **Defect Lab**: Visualize and analyze the impact of Vacancies, Interstitials, and Substitutional atoms.

### 🧮 Advanced Crystallography Calculator
- **Material Catalog**: 100+ preset materials with structural and isotopic data.
- **Isotopic Analysis**: Calculate **Effective Atomic Mass** and **Theoretical Density** based on natural or custom isotopic abundance.
- **Interplanar Metrics**: Precise calculation of d-spacing $(d_{hkl})$, plane area, and planar density $(\rho_p)$.
- **Interstitial Module**: Evaluation of octahedral and tetrahedral site compatibility for solute atoms (H, C, N, O).

### 📱 Professional UX/UI
- **Sticky Viewport**: Maintain 3D context while scrolling technical parameters on mobile.
- **Input Hardening**: Touch-optimized numerical inputs with real-time sanitization.
- **Clean Aesthetic**: Modern, neutral-background design optimized for technical documentation and clarity.

## 🛠️ Technical Stack
- **Engine**: Three.js (v0.160+) with `PerspectiveCamera` and `OrbitControls`.
- **UI Architecture**: Modular JavaScript (ESM) with a single-source-of-truth State Manager.
- **Styling**: Vanilla CSS (Responsive Flex/Grid) - No external CSS frameworks for maximum light-weight performance.
- **Math**: Custom intersection engines for Plane-Cube and Plane-Hexagon clipping logic.

## 🚀 Getting Started
1. Clone or download the repository.
2. Open `INDEX.HTML` in any modern web browser (Chrome, Firefox, Safari, Edge).
3. Use the **System Tabs** to switch between Cubic and Hexagonal modes.
4. Enable **Engineering Mode** to unlock advanced analysis tools.
5. Use the **Crystallography Calculator** for material-specific calculations.

---
*Created as a professional-grade educational and analysis tool for Material Science and Engineering.*