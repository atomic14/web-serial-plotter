[![CI](https://github.com/atomic14/web-serial-plotter/actions/workflows/ci.yml/badge.svg)](https://github.com/atomic14/web-serial-plotter/actions/workflows/ci.yml)

[![Coverage Status](https://coveralls.io/repos/github/atomic14/web-serial-plotter/badge.svg?branch=main)](https://coveralls.io/github/atomic14/web-serial-plotter?branch=main)

# Web Serial Plotter

Real‑time, beautiful, and zero‑friction plotting for any serial device — right in your browser.

> Connect an Arduino, sensor board, or any UART‑speaking device and get instant charts with no drivers or native apps. Built with Vite + React + TypeScript + Tailwind CSS.
 
## Demo video

[![Watch the demo on YouTube](https://img.youtube.com/vi/MEQCPBF99FQ/hqdefault.jpg)](https://youtu.be/MEQCPBF99FQ)

## Try it out

You can try it out [here](https://web-serial-plotter.atomic14.com). Or follow the instructions below to run it locally.

## Support

If you find this project useful, consider supporting its development:

[![Support on Patreon](https://img.shields.io/badge/Support-Patreon-f96854?logo=patreon&logoColor=white)](https://www.patreon.com/atomic14)

Your support helps maintain and improve this tool for the entire community!

## Goals

- Deliver a delightful, modern UI that “just works” for live serial data.
- Keep everything local in the browser — fast, private, and portable.

## Status

**Production Ready** - Core functionality is complete and stable. The application successfully handles real-time serial data plotting with professional-grade performance and user experience.

## Current Features

✅ **Real-time Plotting**
- Multi-series plotting from CSV/space/tab-separated serial data
- Automatic series detection from header lines (e.g., `# time ax ay az`)
- Dynamic series adjustment (automatically adds/removes series based on data)

✅ **Interactive Controls**
- Mouse/touch pan and zoom with momentum scrolling
- Pinch-to-zoom support on touch devices
- Ctrl+wheel zoom for precise control
- Play/pause (freeze) functionality
- Auto-scaling Y-axis with manual override

✅ **Data Analysis**
- Real-time statistics: min/max/mean/median/stddev
- Live histograms for each data series
- Configurable time display (absolute/relative)
- Sample rate monitoring
- Hover tooltips with precise values and timestamps

✅ **Channel Management**
- Series renaming and color customization
- Interactive legend with click-to-edit
- Dynamic series creation based on incoming data

✅ **Export & Testing**
- PNG screenshot export (plot + individual stats cards)
- CSV data export with multiple options:
  - Export visible data or all stored data
  - Multiple timestamp formats (ISO, relative, raw)
  - Configurable time reference (session start)
- Built-in signal generator for testing (sine, noise, ramp)
- Configurable sample rates and amplitudes

✅ **Serial Console**
- Dual-tab interface (Chart/Console views)
- Bidirectional communication with serial devices
- Send text commands to devices
- View raw incoming/outgoing data streams
- Message export in multiple formats (TXT, CSV, JSON)
- Configurable message history (10-10,000 messages)
- Real-time message timestamps

✅ **User Experience**
- Dark/light theme toggle with system preference detection
- Responsive design optimized for various screen sizes
- Browser-based (no drivers or installations required)
- Real-time connection status with visual indicators
- Professional footer with project links



## Using the App: Live vs. Local

Most users do **not** need to run this project locally! For general use, simply visit the live site:

- **[web-serial-plotter.atomic14.com](https://web-serial-plotter.atomic14.com)**

You only need to follow the local setup instructions below if you want to contribute, develop new features, or test changes to the codebase.

## Quick Start (development)

### Prerequisites

- **Node.js 20.19+ or 22.12+** (required by Vite; older versions will not work)
  - To check your version, run:
    ```bash
    node --version
    ```
  - If your version is lower than 20.19.0, [download the latest Node.js here](https://nodejs.org/en/download) and install it.
  - For upgrade instructions, see the [official Node.js documentation](https://nodejs.org/en/download/package-manager/).
- **npm** (comes with Node.js)
- **A Chromium‑based browser** that supports the Web Serial API (Chrome, Edge, Opera)

### Install and run

```bash
npm install
npm run dev
```

Open the printed local URL (Vite default is `http://localhost:5173`).

## Using the Application

### Serial Device Connection
1. Click **"Connect"** and choose your serial device when prompted
2. Select the appropriate **baud rate** for your device
3. Start streaming data - the app supports CSV, space, or tab-separated values

### Data Format
Your device should send lines of numeric data:
```text
# Optional header defines series names
# time(ms), ax, ay, az
0, 0.01, 0.02, 0.98
10, 0.02, 0.01, 0.99
20, 0.03, 0.00, 1.01
```

### Interactive Controls
- **Pan**: Click and drag on the plot
- **Zoom**: Ctrl+wheel or pinch on touch devices  
- **Freeze**: Click pause button to stop live updates
- **Export**: Use download button for CSV data export (visible or all data)
- **Screenshot**: Use camera button to export PNG images
- **Series**: Click legend entries to edit names and colors
- **Console**: Switch to Console tab to send commands and view raw data

### Built-in Signal Generator
For testing without hardware:
1. Use the **generator panel** in the header
2. Choose signal type: Sine (phased), Noise, or Ramp  
3. Adjust sample rate and click **"Start"**
4. Data will appear as if from a real device

### Statistics Panel
The bottom panel (Chart tab) shows real-time analytics:
- **Statistics**: min/max/mean/median/standard deviation
- **Histogram**: Live distribution visualization with sample count
- **Export**: Individual PNG screenshot per data series

### Console Panel
The Console tab provides direct device communication:
- **Send Commands**: Type and send text messages to your device
- **Message History**: View all incoming and outgoing messages with timestamps
- **Export Options**: Save console logs as TXT, CSV, or JSON files
- **Configurable Buffer**: Adjust message history size (10-10,000 messages)

## Browser Support

The Web Serial API is supported in modern Chromium‑based browsers:

- Chrome 89+
- Edge 89+
- Opera (current versions)

Firefox and Safari do not support Web Serial at this time. On desktop, use Chrome or Edge for the best experience.

## Security & Privacy

- You explicitly grant serial port access per device and per origin using the browser’s permission prompt.
- All data stays local to your machine. The app does not upload your serial data.

## Tech Stack

- Vite + React + TypeScript
- Tailwind CSS v4 (via `@tailwindcss/vite`)

## Scripts

- `npm run dev` – Start the development server
- `npm run build` – Type‑check and build for production
- `npm run preview` – Preview the production build locally
- `npm run lint` – Run ESLint code quality checks
- `npm run typecheck` – Run TypeScript type checking
- `npm test` – Run the test suite
- `npm run test:coverage` – Run the test suite with coverage

## Project Structure

```
.
├─ src/
│  ├─ main.tsx              # App entry point
│  ├─ App.tsx               # Main application component
│  ├─ components/           # React components
│  │  ├─ PlotCanvas.tsx     # High-performance canvas renderer
│  │  ├─ Header.tsx         # Connection controls
│  │  ├─ TabNav.tsx         # Chart/Console tab navigation
│  │  ├─ SerialConsole.tsx  # Console interface
│  │  ├─ ConsoleLog.tsx     # Message display component
│  │  ├─ ConsoleInput.tsx   # Command input component
│  │  ├─ Legend.tsx         # Interactive series legend
│  │  ├─ StatsPanel.tsx     # Real-time statistics
│  │  ├─ PlotToolsOverlay.tsx # Chart controls overlay
│  │  ├─ Footer.tsx         # Project links footer
│  │  └─ ui/               # Reusable UI components
│  ├─ hooks/               # Custom React hooks
│  │  ├─ useSerial.ts      # Web Serial API integration
│  │  ├─ useDataConnection.ts # Connection management
│  │  ├─ useConsoleStore.ts # Console data management
│  │  └─ useSignalGenerator.ts # Test signal generation
│  ├─ store/               # Data management
│  │  ├─ RingStore.ts      # High-performance ring buffer
│  │  ├─ ConsoleStore.ts   # Console message storage
│  │  └─ dataStore.tsx     # React store integration
│  ├─ utils/               # Utility functions
│  │  ├─ plotRendering.ts  # Canvas rendering utilities
│  │  ├─ chartExport.ts    # CSV data export
│  │  ├─ consoleExport.ts  # Console message export
│  │  ├─ canvasInteractions.ts # Mouse/touch handling
│  │  └─ screenshot.ts     # PNG export utilities
│  └─ types/               # TypeScript definitions
├─ public/                 # Static assets
├─ vite.config.ts          # Build configuration
└─ eslint.config.js        # Code quality rules
```

## Roadmap

**Potential Future Enhancements:**
- Session save/load (plot configurations and data)
- More binary protocol support (CBOR/SLIP) (already supports COBS)
- Advanced data processing filters (moving average, FFT)
- Cursor/crosshair tools for precise measurements
- Keyboard navigation and accessibility improvements
- Multiple device connection support
- Data recording/playback functionality
- Custom baud rate input
- Advanced trigger conditions for data capture

## Contributing

Ideas, issues, and pull requests are welcome. If you're testing with specific hardware, please share device details and sample output so we can improve defaults and parsing.

## License

This project is licensed under the **GNU General Public License v3.0** - see the [LICENSE](LICENSE) file for details.

**Summary**: This is free and open-source software. You can redistribute and modify it under the GPL v3 terms, ensuring it remains free software for all users.

