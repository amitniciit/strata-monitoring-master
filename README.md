# 🏗️ System Architecture

The Interactive Strata Monitoring and Data Management System follows a modular architecture consisting of the React frontend, Express.js backend, MongoDB database, and visualization engine. Monitoring data flows from underground instruments into the database where it is processed and visualized through interactive 2D and 3D interfaces.

<p align="center">
<img src="./assets/system-architecture.png" width="950"/>
</p>

---

# 📸 Application Walkthrough

## 🏠 1. Home Dashboard

The dashboard provides centralized access to panel visualization, monitoring instruments, historical readings, and management modules.

<p align="center">
<img src="./assets/Home Page Interface.png" width="900"/>
</p>

---

## 📋 2. Panel Repository

Browse every underground panel available in the system together with its associated snapshots.

<p align="center">
<img src="./assets/Panel List Interface.png" width="900"/>
</p>

---

## 📤 3. Upload Underground Panel

Upload JSON files describing pillar coordinates, extraction status, panel geometry, and instrument locations.

<p align="center">
<img src="./assets/Panel Upload Interface.png" width="900"/>
</p>

---

## 📡 4. Register Monitoring Instrument

Register a monitoring instrument by specifying its panel number, coordinates, instrument type, threshold values, and description.

<p align="center">
<img src="./assets/Add Instrument Interface.png" width="900"/>
</p>

---

## 📝 5. Record Instrument Reading

Store time-stamped monitoring readings collected from underground instruments.

<p align="center">
<img src="./assets/Instrument Data Entry Interface.png" width="900"/>
</p>

---

## 📈 6. Historical Trend Analysis

Visualize historical sensor readings and compare them against warning and critical threshold values.

<p align="center">
<img src="./assets/Historical Trend Graph of Instrument Readings.png" width="900"/>
</p>

---

# 🏗️ Interactive Underground Panel Visualization

## 🟦 7. Interactive 2D Panel Visualization

The 2D interface displays the underground panel layout, pillar geometry, extraction status, and monitoring instrument locations.

<p align="center">
<img src="./assets/Panel Visualization Interface Showing Pillar Layout(2D).png" width="900"/>
</p>

---

## 🟫 8. Interactive 3D Panel Visualization

An immersive 3D representation of the underground panel enabling enhanced spatial understanding of mining operations.

<p align="center">
<img src="./assets/Panel Visualization Interface Showing Pillar Layout(3D).png" width="900"/>
</p>

---

# 🚨 Threshold Monitoring

## ⚠️ 9. Threshold Alert Visualization (2D)

Whenever an instrument exceeds its predefined threshold, it is immediately highlighted within the 2D panel for rapid identification.

<p align="center">
<img src="./assets/Warning and Alert Interface for Threshold Exceedance(2D).png" width="900"/>
</p>

---

## 🚨 10. Threshold Alert Visualization (3D)

Threshold violations are also visualized within the interactive 3D environment for improved situational awareness.

<p align="center">
<img src="./assets/Warning and Alert Interface for Threshold Exceedance(3D).png" width="900"/>
</p>

---

# ⛏️ Mining Progress Visualization

## 🟩 11. Extraction Progress Visualization (2D)

The system supports time-based visualization of underground extraction progress through multiple stored panel snapshots.

<p align="center">
<img src="./assets/Extraction Progression Visualization Interface(2D).png" width="900"/>
</p>

---

## 🟫 12. Extraction Progress Visualization (3D)

Extraction progression is simultaneously visualized in a fully interactive 3D environment, providing a realistic representation of underground mining advancement.

<p align="center">
<img src="./assets/Extraction Progression Visualization Interface(3D).png" width="900"/>
</p>

---

# ⭐ Major Features

- Interactive Underground Panel Visualization
- 2D & 3D Mine Layout Rendering
- Historical Instrument Trend Analysis
- Threshold-based Warning & Alert System
- Underground Instrument Management
- Panel Snapshot Upload using JSON
- Extraction Progress Visualization
- Time-series Monitoring Database
- React + Express + MongoDB Full Stack Architecture
- Extensible Design for Future IoT Integration
- Future-ready for AI/ML-based Roof Fall Prediction
