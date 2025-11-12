import { useCallback, useRef, useState } from 'react'

import type { SerialConfig } from './useDataConnection'

import { decodeCOBS, COBSDecoderError } from '../utils/cobsDecoder.ts'


export type BaudRate = 300 | 600 | 1200 | 2400 | 4800 | 9600 | 19200 | 38400 | 57600 | 115200 | 230400 | 460800 | 921600

export interface SerialState {
  isSupported: boolean
  isConnecting: boolean
  isConnected: boolean
  port: SerialPort | null
  readerLocked: boolean
  error: string | null
}

export interface UseSerial {
  state: SerialState
  connect: (baudRate: number) => Promise<void>
  disconnect: () => Promise<void>
  onLine: (handler: (line: string) => void) => void
  write: (data: string) => Promise<void>
}

// Minimal serial types from lib.dom (guarded by any where unavailable)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SerialPort = any

export function useSerial(): UseSerial {
  const [state, setState] = useState<SerialState>({
    isSupported: typeof navigator !== 'undefined' && !!(navigator as Navigator).serial,
    isConnecting: false,
    isConnected: false,
    port: null,
    readerLocked: false,
    error: null,
  })


  const lineHandlerRef = useRef<((line: string) => void) | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const readerRef = useRef<ReadableStreamDefaultReader<string> | null>(null)
  const portRef = useRef<SerialPort | null>(null)
  const writerRef = useRef<WritableStreamDefaultWriter<Uint8Array> | null>(null)

  const onLine = useCallback((handler: (line: string) => void) => {
    lineHandlerRef.current = handler
  }, [])

  const disconnect = useCallback(async () => {
    try {
      abortControllerRef.current?.abort()
      abortControllerRef.current = null
      
      if (readerRef.current) {
        try {
          await readerRef.current.cancel()
        } catch {
          // ignore cancel errors
        }
      }
      readerRef.current = null
      
      if (writerRef.current) {
        try {
          await writerRef.current.close()
        } catch {
          // ignore close errors
        }
      }
      writerRef.current = null
      
      if (portRef.current && typeof portRef.current.close === 'function') {
        await portRef.current.close()
      }
      portRef.current = null
      
    } catch {
      // swallow
    } finally {
      setState((s) => ({ ...s, isConnected: false, port: null, readerLocked: false }))
    }
  }, []) // No dependencies - use refs for everything

  const connect = useCallback(async (config: SerialConfig) => {
    if (!state.isSupported) {
      setState((s) => ({ ...s, error: 'Web Serial not supported in this browser.' }))
      return
    }
    
    // Make sure we're fully disconnected first
    if (portRef.current) {
      await disconnect()
    }
    
    setState((s) => ({ ...s, isConnecting: true, error: null }))
    
    try {
      // Always request a fresh port - don't reuse existing ones
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const port: any = await (navigator as Navigator).serial!.requestPort()
      
      // Check if port is already open before attempting to open it
      if (port.readable) {
        try {
          await port.close()
          // Give it a moment to fully close
          await new Promise(resolve => setTimeout(resolve, 100))
        } catch {
          // ignore
        }
      }
      
      await port.open({ baudRate: config.baudRate })

      if (config.encoding === 'ascii') {
        const textDecoder = new TextDecoderStream()
        const readableClosed = port.readable.pipeTo(textDecoder.writable)
        const reader = textDecoder.readable.getReader()
        readerRef.current = reader

        const writer = port.writable.getWriter()
        writerRef.current = writer
        portRef.current = port

        setState((s) => ({ ...s, port, isConnected: true }))

        const abort = new AbortController()
        abortControllerRef.current = abort

        let buffer = ''
        ;(async () => {
          try {
            while (true) {
              const { value, done } = await reader.read()
              if (done) break
              if (value) {
                buffer += value
                let index
                while ((index = buffer.indexOf('\n')) >= 0) {
                  const line = buffer.slice(0, index).replace(/\r$/, '')
                  buffer = buffer.slice(index + 1)
                  lineHandlerRef.current?.(line)
                }
              }
            }
          } catch {
            // ignore if aborted
          } finally {
            try {
              reader.releaseLock()
            } catch {
              // ignore
            }
            try {
              await readableClosed.catch(() => {})
            } catch {
              // ignore
            }
            setState((s) => ({ ...s, readerLocked: false }))
          }
        })()
      } else if (config.encoding === 'cobs-f32') {
        const reader = port.readable.getReader()
        readerRef.current = reader

        const writer = port.writable.getWriter()
        writerRef.current = writer
        portRef.current = port

        setState((s) => ({ ...s, port, isConnected: true }))

        const abort = new AbortController()
        abortControllerRef.current = abort
        
        let buffer = [];
        (async () => {
          try {
            while (true) {
              const { value, done } = await reader.read()
              if (done) break
              if (value) {
                for (const byte of value) {
                  if (byte === 0x00) {
                    // End of COBS packet
                    if (buffer.length > 0) {
                      try {
                        const decoded = decodeCOBS(buffer)
                        const converted = new Float32Array(decoded.buffer, 0, Math.floor(decoded.byteLength/4));

                        // disgusting hack because I don't feel like refactoring stuff right now
                        const line = converted.map((x: number)=>x.toString()).join(' ');
                        lineHandlerRef.current?.(line);

                      } catch (err) { // catch COBS decoding errors
                        if (err instanceof COBSDecoderError) {
                          console.log(err);
                        } else {
                          throw err;
                        }
                      }

                      buffer = [] // reset for next packet
                    }
                  } else {
                    buffer.push(byte)
                  }
                }
              }
            }
          } catch (e) {
            if (e instanceof Error && e.name === "AbortError") {
                // ignore if aborted
            } else {
              throw e;
            }
          } finally {
            try {
              reader.releaseLock()
            } catch {
              // ignore
            }
            setState((s) => ({ ...s, readerLocked: false }))
          }
        })()
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect.'
      setState((s) => ({ ...s, error: message }))
    } finally {
      setState((s) => ({ ...s, isConnecting: false }))
    }
  }, [state.isSupported, disconnect])

  const write = useCallback(async (data: string) => {
    if (!writerRef.current) {
      throw new Error('Serial port not connected')
    }
    
    try {
      const encoder = new TextEncoder()
      const encoded = encoder.encode(data)
      await writerRef.current.write(encoded)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to write to serial port'
      setState((s) => ({ ...s, error: message }))
      throw err
    }
  }, [])

  return { state, connect, disconnect, onLine, write }
}


