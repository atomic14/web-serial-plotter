import { useCallback, useState, useEffect } from 'react'
import { useSerial } from './useSerial'
import { useSignalGenerator, type GeneratorConfig } from './useSignalGenerator'
import { useHttp } from './useHttp'

export interface SerialConfig {
  baudRate: number
  dataBits: 5 | 6 | 7 | 8
  stopBits: 1 | 2
  parity: 'none' | 'even' | 'odd'
  flowControl: 'none' | 'hardware'
}

export type ConnectionType = 'serial' | 'http' | 'generator'

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
  connectHttp: (address: string) => Promise<void>
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
  flowControl: 'none'
}

export function useDataConnection(onLine: (line: string) => void): UseDataConnection {
  const [connectionType, setConnectionType] = useState<ConnectionType | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const serial = useSerial()
  const generator = useSignalGenerator(onLine)
  const http = useHttp()

  const state: ConnectionState = {
    type: connectionType,
    isConnecting: isConnecting || serial.state.isConnecting || http.state.isConnecting,
    isConnected: serial.state.isConnected || generator.isRunning || http.state.isConnected,
    isSupported: serial.state.isSupported && http.state.isSupported,
    error: error || serial.state.error || http.state.error
  }

  const connectSerial = useCallback(async (config: SerialConfig) => {
    if (generator.isRunning) {
      generator.stop()
    }

    if (http.state.isConnected) {
      await http.disconnect()
    }
    
    setIsConnecting(true)
    setError(null)
    
    try {
      // Convert our config to the format useSerial expects
      // Note: Web Serial API has limited configuration options
      await serial.connect(config.baudRate)
      setConnectionType('serial')
      // The actual port configuration would need to be done at the port.open() level
      // For now, we'll just use baudRate as useSerial currently does
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect to serial port'
      setError(message)
      setConnectionType(null)
      throw err // Re-throw so ConnectModal knows the connection failed
    } finally {
      setIsConnecting(false)
    }
  }, [serial, generator, http])

  const connectHttp = useCallback(async (address: string) => {
    if (serial.state.isConnected) {
      await serial.disconnect()
    }

    if (generator.isRunning) {
      generator.stop()
    }
    
    setIsConnecting(true)
    setError(null)
    
    try {
      await http.connect(address)
      setConnectionType('http')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect to HTTP stream'
      setError(message)
      setConnectionType(null)
      throw err
    } finally {
      setIsConnecting(false)
    }
  }, [serial, generator, http])

  const connectGenerator = useCallback(async (config: GeneratorConfig) => {
    if (serial.state.isConnected) {
      await serial.disconnect()
    }

    if (http.state.isConnected) {
      await http.disconnect()
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
  }, [serial, generator, http])

  const disconnect = useCallback(async () => {
    setError(null)
    
    if (serial.state.isConnected) {
      await serial.disconnect()
    }
    
    if (generator.isRunning) {
      generator.stop()
    }

    if (http.state.isConnected) {
      await http.disconnect()
    }
    
    setConnectionType(null)
  }, [serial, generator, http])

  // Set up serial and http line handlers
  useEffect(() => {
    serial.onLine(onLine)
    http.onLine(onLine)
  }, [serial, http, onLine])

  const write = useCallback(async (data: string) => {
    if (connectionType === 'serial' && serial.state.isConnected) {
      await serial.write(data)
    } else if (connectionType === 'http' && http.state.isConnected) {
      await http.write(data)
    } else {
      throw new Error('Not connected')
    }
  }, [connectionType, serial, http])

  return {
    state,
    connectSerial,
    connectHttp,
    connectGenerator,
    disconnect,
    write,
    generatorConfig: generator.config,
    setGeneratorConfig: generator.setConfig
  }
}

export { DEFAULT_SERIAL_CONFIG }