import { useCallback, useRef, useState } from 'react'

export interface HttpState {
  isSupported: boolean
  isConnecting: boolean
  isConnected: boolean
  error: string | null
  address: string
}

export interface UseHttp {
  state: HttpState
  connect: (address: string) => Promise<void>
  disconnect: () => Promise<void>
  onLine: (handler: (line: string) => void) => void
  write: (data: string) => Promise<void>
}

export function useHttp(): UseHttp {
  const [state, setState] = useState<HttpState>({
    isSupported: typeof fetch !== 'undefined' && 'body' in Response.prototype, // TODO: make this actually check if streaming fetch responses specifically are not supported
    isConnecting: false,
    isConnected: false,
    error: null,
    address: ''
  })

  const lineHandlerRef = useRef<((line: string) => void) | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const writerRef = useRef<WritableStreamDefaultWriter | null>(null)
  const socketRef = useRef<WebSocket | null>(null)

  const onLine = useCallback((handler: (line: string) => void) => {
    lineHandlerRef.current = handler
  }, [])

  const disconnect = useCallback(async () => {
    try {
      abortControllerRef.current?.abort()
      abortControllerRef.current = null
      
      if (writerRef.current) {
        try {
          await writerRef.current.close()
        } catch {
          // ignore close errors
        }
      }
      writerRef.current = null

      if (socketRef.current) {
        socketRef.current.close()
        socketRef.current = null
      }
      
    } catch {
      // swallow
    } finally {
      setState((s) => ({ ...s, isConnected: false }))
    }
  }, [])

  const connect = useCallback(async (address: string) => {
    if (!state.isSupported) {
      setState((s) => ({ ...s, error: 'Streaming fetch not supported in this browser.' }))
      return
    }
    
    // Make sure we're fully disconnected first
    await disconnect()
    
    setState((s) => ({ ...s, isConnecting: true, error: null, address }))

    try {
      const abortController = new AbortController()
      abortControllerRef.current = abortController

      // Try to detect if it's a WebSocket URL
      const isWebSocket = address.startsWith('ws://') || address.startsWith('wss://')
      
      if (isWebSocket) {
        // Handle WebSocket connection
        const socket = new WebSocket(address)
        socketRef.current = socket

        socket.onmessage = (event) => {
          lineHandlerRef.current?.(event.data)
        }

        socket.onclose = () => {
          setState((s) => ({ ...s, isConnected: false }))
        }

        socket.onerror = (error) => {
          setState((s) => ({ ...s, error: 'WebSocket error: ' + error }))
        }

        // Wait for connection
        await new Promise<void>((resolve, reject) => {
          socket.onopen = () => resolve()
          socket.onerror = () => reject(new Error('Failed to connect to WebSocket'))
          // Add timeout
          setTimeout(() => reject(new Error('Connection timeout')), 5000)
        })

      } else {
        // Handle HTTP streaming
        const response = await fetch(address, {
          signal: abortController.signal
        })

        if (!response.body) {
          throw new Error('Response has no body')
        }

        const reader = response.body.getReader()
        const textDecoder = new TextDecoder()
        let buffer = ''

        // Process the stream
        ;(async () => {
          try {
            while (true) {
              const { value, done } = await reader.read()
              if (done) break
              
              if (value) {
                buffer += textDecoder.decode(value, { stream: true })
                let index
                while ((index = buffer.indexOf('\n')) >= 0) {
                  const line = buffer.slice(0, index).replace(/\r$/, '')
                  buffer = buffer.slice(index + 1)
                  lineHandlerRef.current?.(line)
                }
              }
            }
          } catch {
            if (!abortController.signal.aborted) {
              setState((s) => ({ ...s, error: 'Stream ended unexpectedly', isConnected: false }))
            }
          }
        })()
      }

      setState((s) => ({ ...s, isConnected: true }))

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect.'
      setState((s) => ({ ...s, error: message }))
      throw err
    } finally {
      setState((s) => ({ ...s, isConnecting: false }))
    }
  }, [state.isSupported, disconnect])

  const write = useCallback(async (data: string) => {
    if (!state.isConnected) {
      throw new Error('Not connected')
    }

    if (socketRef.current) {
      socketRef.current.send(data)
    } else {
        // TODO: implement this, I think it might require an additional HTTP connection for a streaming request/upload. 
        throw new Error('write on HTTP connection not supported');
    }
  }, [state.isConnected])

  return { state, connect, disconnect, onLine, write }
}


