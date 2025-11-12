import { useState } from 'react'
import { XMarkIcon, WifiIcon, SignalIcon, GlobeAltIcon } from '@heroicons/react/24/outline'
import Button from './ui/Button'
import Input from './ui/Input'
import Select from './ui/Select'
import Checkbox from './ui/Checkbox'
import type { SerialConfig, ConnectionType } from '../hooks/useDataConnection'
import type { GeneratorConfig } from '../hooks/useSignalGenerator'
import { DEFAULT_SERIAL_CONFIG } from '../hooks/useDataConnection'

interface Props {
  isOpen: boolean
  onClose: () => void
  onConnectSerial: (config: SerialConfig) => Promise<void>
  onConnectHttp: (address: string) => Promise<void>
  onConnectGenerator: (config: GeneratorConfig) => Promise<void>
  isConnecting: boolean
  isSupported: boolean
  generatorConfig: GeneratorConfig
}

const BAUD_RATES = [300, 600, 1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200, 230400, 460800, 921600]

export function ConnectModal({
  isOpen,
  onClose,
  onConnectSerial,
  onConnectHttp,
  onConnectGenerator,
  isConnecting,
  isSupported,
  generatorConfig
}: Props) {
  const [activeTab, setActiveTab] = useState<ConnectionType>('serial')
  const [serialConfig, setSerialConfig] = useState<SerialConfig>(DEFAULT_SERIAL_CONFIG)
  const [localGeneratorConfig, setLocalGeneratorConfig] = useState<GeneratorConfig>(generatorConfig)
  const [httpConfig, setHttpConfig] = useState<{ address: string }>({ address: '' })

  if (!isOpen) return null

  const handleSerialConnect = async () => {
    try {
      await onConnectSerial(serialConfig)
      onClose()
    } catch {
      // Keep modal open on error so user can try again
    }
  }

  const handleHttpConnect = async () => {
    try {
      await onConnectHttp(httpConfig.address)
      onClose()
    } catch (e) {
      // Keep modal open on error so user can try again
      console.log(e)
    }
  }

  const handleGeneratorConnect = async () => {
    try {
      await onConnectGenerator(localGeneratorConfig)
      onClose()
    } catch {
      // Keep modal open on error so user can try again
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-neutral-700">
          <h2 className="text-xl font-semibold">Connect Data Source</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-neutral-700">
          <button
            onClick={() => setActiveTab('serial')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === 'serial'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <WifiIcon className="w-4 h-4" />
            Serial Port
          </button>
          <button
            onClick={() => setActiveTab('http')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === 'http'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <GlobeAltIcon className="w-4 h-4" />
            HTTP/WS Stream
          </button>
          <button
            onClick={() => setActiveTab('generator')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === 'generator'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <SignalIcon className="w-4 h-4" />
            Signal Generator
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'serial' && (
            <div className="space-y-4">
              {!isSupported && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-800 dark:text-red-200 text-sm">
                    Web Serial API is not supported in this browser. Please use Chrome, Edge, or another Chromium-based browser.
                  </p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Baud Rate</label>
                  <Select
                    value={serialConfig.baudRate.toString()}
                    onChange={(e) => setSerialConfig(prev => ({ ...prev, baudRate: parseInt(e.target.value) }))}
                  >
                    {BAUD_RATES.map(rate => (
                      <option key={rate} value={rate.toString()}>{rate}</option>
                    ))}
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Data Bits</label>
                  <Select
                    value={serialConfig.dataBits.toString()}
                    onChange={(e) => setSerialConfig(prev => ({ ...prev, dataBits: parseInt(e.target.value) as 5 | 6 | 7 | 8 }))}
                  >
                    <option value="5">5</option>
                    <option value="6">6</option>
                    <option value="7">7</option>
                    <option value="8">8</option>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Stop Bits</label>
                  <Select
                    value={serialConfig.stopBits.toString()}
                    onChange={(e) => setSerialConfig(prev => ({ ...prev, stopBits: parseInt(e.target.value) as 1 | 2 }))}
                  >
                    <option value="1">1</option>
                    <option value="2">2</option>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Parity</label>
                  <Select
                    value={serialConfig.parity}
                    onChange={(e) => setSerialConfig(prev => ({ ...prev, parity: e.target.value as 'none' | 'even' | 'odd' }))}
                  >
                    <option value="none">None</option>
                    <option value="even">Even</option>
                    <option value="odd">Odd</option>
                  </Select>
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-2">Flow Control</label>
                  <Select
                    value={serialConfig.flowControl}
                    onChange={(e) => setSerialConfig(prev => ({ ...prev, flowControl: e.target.value as 'none' | 'hardware' }))}
                  >
                    <option value="none">None</option>
                    <option value="hardware">Hardware (RTS/CTS)</option>
                  </Select>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-neutral-700">
                <Button
                  variant="primary"
                  onClick={handleSerialConnect}
                  disabled={!isSupported || isConnecting}
                  className="w-full"
                >
                  {isConnecting ? 'Connecting...' : 'Connect Serial Port'}
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'http' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">HTTP Stream or WebSocket URL</label>
                <Input
                  type="url"
                  className="w-full"
                  placeholder="http://microcontroller.local:1234"
                  value={httpConfig.address}
                  onChange={(e) => setHttpConfig(prev => ({ 
                    ...prev, 
                    address: e.target.value
                  }))}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Enter URL for HTTP streaming endpoint or WebSocket server
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Response must have Access-Control-Allow-Origin header set to * or this domain
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {document.location.protocol == 'https:' ? 'Server must use HTTPS/WSS due to browser restrictions as this is an HTTPS page' : ''}
                </p>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-neutral-700">
                <Button
                  variant="primary"
                  onClick={handleHttpConnect}
                  disabled={!httpConfig.address || isConnecting}
                  className="w-full"
                >
                  {isConnecting ? 'Connecting...' : 'Connect to HTTP or WebSocket server'}
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'generator' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Signal Type</label>
                  <Select
                    value={localGeneratorConfig.mode}
                    onChange={(e) => setLocalGeneratorConfig(prev => ({ 
                      ...prev, 
                      mode: e.target.value as 'sine3' | 'noise' | 'ramp' 
                    }))}
                  >
                    <option value="sine3">Sine Wave (3-phase)</option>
                    <option value="noise">Random Noise</option>
                    <option value="ramp">Ramp/Sawtooth</option>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Channels</label>
                  <Input
                    type="number"
                    min={1}
                    max={8}
                    value={localGeneratorConfig.channels}
                    onChange={(e) => setLocalGeneratorConfig(prev => ({ 
                      ...prev, 
                      channels: Math.max(1, Math.min(8, parseInt(e.target.value) || 1))
                    }))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Sample Rate (Hz)</label>
                  <Input
                    type="number"
                    min={1}
                    max={1000}
                    value={localGeneratorConfig.sampleRateHz}
                    onChange={(e) => setLocalGeneratorConfig(prev => ({ 
                      ...prev, 
                      sampleRateHz: Math.max(1, parseInt(e.target.value) || 100)
                    }))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Frequency (Hz)</label>
                  <Input
                    type="number"
                    min={0.1}
                    max={100}
                    step={0.1}
                    value={localGeneratorConfig.frequencyHz}
                    onChange={(e) => setLocalGeneratorConfig(prev => ({ 
                      ...prev, 
                      frequencyHz: Math.max(0.1, parseFloat(e.target.value) || 1)
                    }))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Amplitude</label>
                  <Input
                    type="number"
                    min={0.1}
                    max={10}
                    step={0.1}
                    value={localGeneratorConfig.amplitude}
                    onChange={(e) => setLocalGeneratorConfig(prev => ({ 
                      ...prev, 
                      amplitude: Math.max(0.1, parseFloat(e.target.value) || 1)
                    }))}
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={localGeneratorConfig.includeHeader}
                    onChange={(e) => setLocalGeneratorConfig(prev => ({ 
                      ...prev, 
                      includeHeader: e.target.checked 
                    }))}
                  />
                  <span className="text-sm font-medium">Include series headers</span>
                </label>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-neutral-700">
                <Button
                  variant="primary"
                  onClick={handleGeneratorConnect}
                  disabled={isConnecting}
                  className="w-full"
                >
                  Start Signal Generator
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ConnectModal