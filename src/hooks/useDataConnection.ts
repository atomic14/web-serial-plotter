import { useCallback, useState, useEffect } from 'react'
import { useSerial } from './useSerial'
import { useSignalGenerator, type GeneratorConfig } from './useSignalGenerator'

export interface SerialConfig {
  baudRate: number
  dataBits: 5 | 6 | 7 | 8
  stopBits: 1 | 2
  parity: 'none' | 'even' | 'odd'
  flowControl: 'none' | 'hardware'
  encoding: 'ascii' | 'cobs-f32'
}

export type ConnectionType = 'serial' | 'generator'

export interface ConnectionState {
  type: ConnectionType | null
  isConnecting: boolean
  isConnected: boolean
  isSupported: boolean
  error: string | null
}

export interface UseDataConnection {
  state: ConnectionState
  connectSerial: (config: SerialConfig) => Promise<void>
  connectGenerator: (config: GeneratorConfig) => Promise<void>
  disconnect: () => Promise<void>
  write: (data: string) => Promise<void>
  generatorConfig: GeneratorConfig
  setGeneratorConfig: (config: Partial<GeneratorConfig>) => void
}

const DEFAULT_SERIAL_CONFIG: SerialConfig = {
  baudRate: 115200,
  dataBits: 8,
  stopBits: 1,
  parity: 'none',
  flowControl: 'none',
  encoding: 'ascii'
}

export function useDataConnection(onLine: (line: string) => void): UseDataConnection {
  const [connectionType, setConnectionType] = useState<ConnectionType | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)


  const serial = useSerial()
  const generator = useSignalGenerator(onLine)

  const state: ConnectionState = {
    type: connectionType,
    isConnecting: isConnecting || serial.state.isConnecting,
    isConnected: serial.state.isConnected || generator.isRunning,
    isSupported: serial.state.isSupported,
    error: error || serial.state.error
  }


  const connectSerial = useCallback(async (config: SerialConfig) => {
    if (generator.isRunning) {
      generator.stop()
    }
    
    setIsConnecting(true)
    setError(null)
    
    try {
      // Note: Web Serial API has limited configuration options
      await serial.connect(config);
      setConnectionType('serial')
      // The actual port configuration would need to be done at the port.open() level
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect to serial port'
      setError(message)
      setConnectionType(null)
      throw err // Re-throw so ConnectModal knows the connection failed
    } finally {
      setIsConnecting(false)
    }
  }, [serial, generator])

  const connectGenerator = useCallback(async (config: GeneratorConfig) => {
    if (serial.state.isConnected) {
      await serial.disconnect()
    }
    
    setError(null)
    setConnectionType('generator')
    
    try {
      generator.setConfig(config)
      generator.start()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start signal generator'
      setError(message)
      setConnectionType(null)
    }
  }, [serial, generator])

  const disconnect = useCallback(async () => {
    setError(null)
    
    if (serial.state.isConnected) {
      await serial.disconnect()
    }
    
    if (generator.isRunning) {
      generator.stop()
    }
    
    setConnectionType(null)
  }, [serial, generator])

  // Set up serial line handler
  useEffect(() => {
    serial.onLine(onLine)
  }, [serial, onLine])

  const write = useCallback(async (data: string) => {
    if (connectionType !== 'serial' || !serial.state.isConnected) {
      throw new Error('Serial port not connected')
    }
    await serial.write(data)
  }, [connectionType, serial])

  return {
    state,
    connectSerial,
    connectGenerator,
    disconnect,
    write,
    generatorConfig: generator.config,
    setGeneratorConfig: generator.setConfig
  }
}

export { DEFAULT_SERIAL_CONFIG }