# Example Arduino Firmware

This folder contains sample Arduino sketches for testing the Web Serial Plotter.

## basic_plotter.ino

A basic example that generates simulated sensor data with 4 series:
- Temperature (°C)
- Humidity (%)
- Pressure (hPa)
- Light (lux)

### Features
- Outputs data at 50 Hz (20ms intervals)
- Uses sine waves with random noise for realistic sensor simulation
- Demonstrates bracket-based filtering with mixed debug/data output
- Includes proper header line with series names
- Compatible with standard Arduino boards (Uno, Nano, ESP32, etc.)

### Upload Instructions

1. Open `basic_plotter.ino` in Arduino IDE
2. Select your board and COM port
3. Upload the sketch
4. Open the Web Serial Plotter in your browser
5. Click "Connect" and select the Arduino's serial port
6. Use default settings: 115200 baud, 8 data bits, 1 stop bit, no parity

### Data Format

The sketch outputs data using the bracket-based filtering format:

```
Chart header:
[# Temperature,Humidity,Pressure,Light]
Chart values:
[22.45,65.23,1015.67,789.12]
[22.67,64.89,1015.23,792.45]
[23.01,65.45,1016.12,791.23]
...
```

**Bracket Filtering (Enabled by Default):**
- Lines enclosed in `[brackets]` are sent to the chart
- Lines without brackets are shown only in the console
- This allows mixing debug messages with sensor data on the same serial connection

**Format Rules:**
- Header line: `[# series1,series2,...]` with `#` prefix and comma-separated names
- Data lines: `[value1,value2,...]` with comma-separated numerical values
- Debug/status messages: plain text without brackets (console only)
- Each bracketed line represents one time sample across all series

**Filter Settings:**
You can toggle the filters in the Settings panel:
- **Chart filter**: When ON (default), only `[bracketed]` lines are plotted
- **Console filter**: When ON (default), `[bracketed]` lines are hidden from console
- Turn both OFF to use the plotter without filtering (legacy behavior)

### Customization

You can modify the sketch to:
- Change the number of data series
- Adjust sampling rate (modify `delay()` value)
- Change data generation functions
- Add real sensor readings instead of simulated data
- Add or remove debug messages
- Use without brackets for legacy behavior (disable filters in settings)

### Serial Settings

- **Baud Rate**: 115200
- **Data Bits**: 8
- **Stop Bits**: 1
- **Parity**: None
- **Flow Control**: None