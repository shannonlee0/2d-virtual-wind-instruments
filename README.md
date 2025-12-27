# 2D Virtual Wind Instrument Simulator

Simulating acoustic wave propagation can aid in the exploration of novel musical instrument designs. We present a 2D wave simulation that visualizes real-time pressure propagation and synthesizes audio, based on user-defined instrument geometries and dynamic source models.

**Live Demo:** [https://shannonlee0.github.io/modeling-virtual-wind-instruments/](https://shannonlee0.github.io/modeling-virtual-wind-instruments/)

---

![Demo of the instrument simulator](./assets/gif.gif)

---

## Technical Overview

### Physics Engine: FDTD Numerical Method
The core of the simulator utilizes the **Finite-Difference Time-Domain (FDTD)** method to approximate acoustic wave propagation. The system discretizes the 2D wave equation into a grid, calculating pressure changes in discrete time steps.
* **Staggered Grid:** The implementation uses a staggered grid where pressure ($p$) and velocity ($v_x, v_y$) are calculated at alternating spatial points for improved numerical stability.
* **Boundary Modeling:** Includes Perfect Matched Layers (PML) at the grid boundaries to attenuate waves and prevent artificial reflections from the edges of the simulation space.
* **Stability Parameters:** The simulation operates at a high temporal resolution ($dt \approx 6.4 \mu s$) and spatial resolution ($dx \approx 0.00383 m$) to satisfy the Courant-Friedrichs-Lewy (CFL) condition.

### Architecture
* **Numerical Solver (CPU):** The physical state updates, including pressure and velocity stepping, are processed on the CPU. This allows for complex logic handling in the source models, such as the clarinet's reed elasticity and the recorder's air jet deflection.
* **Graphical User Interface (GUI):** The pressure field is rendered using **WebGL**. By mapping simulation data to vertex attributes and using custom fragment shaders, the system achieves color mapping of wave phases.

---

## Key Features

* **Interactive Interface:** Draw rigid instrument boundaries directly onto the simulation grid. These boundaries act as reflectors for acoustic waves.
* **Dynamic Toneholes:** Place and toggle toneholes in real-time. Opening or closing these holes shifts the effective acoustic length of the air column, directly altering the resonant frequency.
* **Physically-Informed Source Models:**
    * **Clarinet:** Simulates a single air jet model incorporating reed gap factors and Bernoulli-based particle velocity.
    * **Recorder:** Simulates jet deflection and labium interaction using time-delay lines to model the travel time from the flue exit to the labium edge.
* **Audio Synthesis:** Pressure values at the listener (microphone) location are recorded into a buffer and can be exported as `.txt` data for conversion into audio files.

---

## Controls

* **Left Click + Drag:** Draw instrument walls and geometry.
* **Shift + Drag:** Draw toneholes onto existing instrument geometry.
* **Number Keys (1-9):** Toggle specific toneholes open or closed.
* **Z Key:** Undo the last drawing action.
* **Space Bar:** Toggle simulation play/pause.
* **Yellow Icon Drag:** Reposition the acoustic excitation source.
* Downloads pressure values in form of .txt file after 100000 frames.


---

## Tech Stack

* **Core Logic:** JavaScript
* **Graphics:** WebGL
* **Audio Extraction:** Python
* **Physics:** Numerical Acoustic Modeling (FDTD)

---

## Local Setup

To run this project locally, a web server is required to handle WebGL shaders and external script modules.

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/shannonlee0/aerophones.git](https://github.com/shannonlee0/aerophones.git)
   cd aerophones
   ```

2. **Start a local server:**

   ```bash
   # Using Python 3
   python3 -m http.server 8000
   ```
3. **Open in browser:**
   Navigate to http://localhost:8000.
