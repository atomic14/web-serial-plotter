import { useState } from 'react'
import { PlayIcon, StopIcon, XCircleIcon, CircleStackIcon } from '@heroicons/react/24/outline'
import Button from './ui/Button'
import ConnectModal from './ConnectModal'
import type { ConnectionState, ConnectionType, SerialConfig } from '../hooks/useDataConnection'
import type { GeneratorConfig } from '../hooks/useSignalGenerator'

interface Props {
  connectionState: ConnectionState
  onConnectSerial: (config: SerialConfig) => Promise<void>
  onConnectHttp: (address: string) => Promise<void>
  onConnectGenerator: (config: GeneratorConfig) => Promise<void>
  onDisconnect: () => Promise<void>
  generatorConfig: GeneratorConfig
}

function getConnectionIcon(type: ConnectionType | null, isConnected: boolean) {
  if (!isConnected) return <PlayIcon className="w-4 h-4" />
  if (type === 'serial') return <StopIcon className="w-4 h-4" />
  if (type === 'generator') return <StopIcon className="w-4 h-4" />
  return <StopIcon className="w-4 h-4" />
}

function getConnectionText(state: ConnectionState) {
  if (state.isConnecting) return 'Connecting...'
  if (state.isConnected) {
    if (state.type === 'serial') return 'Serial Connected'
    if (state.type === 'generator') return 'Generator Running'
    return 'Connected'
  }
  if (!state.isSupported) return 'Serial Unsupported'
  if (state.error) return 'Connection Error'
  return 'Connect'
}

function getButtonVariant(state: ConnectionState) {
  if (state.isConnected) return 'danger'
  if (state.error) return 'neutral'
  return 'primary'
}

export function Header({ 
  connectionState, 
  onConnectSerial, 
  onConnectHttp, 
  onConnectGenerator, 
  onDisconnect, 
  generatorConfig 
}: Props) {
  const [showConnectModal, setShowConnectModal] = useState(false)

  const handleButtonClick = () => {
    if (connectionState.isConnected) {
      onDisconnect()
    } else {
      setShowConnectModal(true)
    }
  }

  return (
    <>
      <header className="flex items-center justify-between gap-4 py-3 px-4 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <CircleStackIcon className="w-6 h-6" />
          <div className="text-lg font-semibold tracking-tight">Web Serial Plotter</div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:block text-xs text-neutral-500 dark:text-neutral-400">
            This project is a work in progress. Found a bug or have an idea? <a className="underline hover:no-underline text-blue-600 dark:text-blue-400" href="https://github.com/atomic14/web-serial-plotter/issues" target="_blank" rel="noopener noreferrer">Open an issue on GitHub</a>.
          </div>
          <Button 
            id="tour-connect-button"
            variant={getButtonVariant(connectionState)}
            disabled={connectionState.isConnecting}
            onClick={handleButtonClick}
            startIcon={
              connectionState.isConnected 
                ? getConnectionIcon(connectionState.type, connectionState.isConnected)
                : connectionState.error
                  ? <XCircleIcon className="w-4 h-4" />
                  : getConnectionIcon(connectionState.type, connectionState.isConnected)
            }
          >
            {getConnectionText(connectionState)}
          </Button>
        </div>
      </header>

      <ConnectModal
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        onConnectSerial={onConnectSerial}
        onConnectHttp={onConnectHttp}
        onConnectGenerator={onConnectGenerator}
        isConnecting={connectionState.isConnecting}
        isSupported={connectionState.isSupported}
        generatorConfig={generatorConfig}
      />
    </>
  )
}

export default Header


