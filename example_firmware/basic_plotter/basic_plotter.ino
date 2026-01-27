/*
 * Basic Arduino Serial Plotter Example
 * 
 * This sketch generates sample data compatible with the Web Serial Plotter.
 * It outputs multiple data series in CSV format with headers.
 * 
 * Data Format:
 * - Header line starts with '#' followed by series names
 * - Data lines contain comma-separated values
 * - Each line represents one time sample across all series
 * 
 * Compatible with Web Serial Plotter at:
 * https://github.com/your-repo/web-serial-plotter
 */
long lastDebug = 0;
int debugCount = 0;

void setup() {
  Serial.begin(115200);
  
  // Wait for serial connection
  while (!Serial) {
    delay(10);
  }
  
  Serial.println("[# Temperature,Humidity,Pressure,Light]");
  
  // Small delay to ensure header is processed
  delay(100);
}

void loop() {
  // Send debug info every 1 second
  if(millis() - lastDebug > 1000){
    Serial.print("Debug no. ");
    Serial.println(++debugCount);
    lastDebug = millis();
  }

  // Generate sample sensor data
  float temperature = 20.0 + 15.0 * sin(millis() / 5000.0) + random(-100, 100) / 100.0;
  float humidity = 50.0 + 20.0 * cos(millis() / 3000.0) + random(-200, 200) / 100.0;
  float pressure = 1013.25 + 10.0 * sin(millis() / 8000.0) + random(-50, 50) / 100.0;
  float light = 500.0 + 300.0 * sin(millis() / 2000.0) + random(-1000, 1000) / 100.0;
  
  // Output as comma-separated values
  Serial.print("[");
  Serial.print(temperature, 2);
  Serial.print(",");
  Serial.print(humidity, 2);
  Serial.print(",");
  Serial.print(pressure, 2);
  Serial.print(",");
  Serial.print(light, 2);
  Serial.println("]");
  
  // Sample rate: 50 Hz (20ms interval)
  delay(20);
}