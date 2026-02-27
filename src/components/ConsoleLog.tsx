import { useEffect, useRef, useState } from 'react'
import type { ConsoleMessage } from '../store/ConsoleStore'

interface ConsoleLogProps {
  messages: ConsoleMessage[]
}

export default function ConsoleLog({ messages }: ConsoleLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)

  // Auto-scroll to bottom when new messages arrive (only if user was already at bottom)
  useEffect(() => {
    if (isAtBottom && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isAtBottom])

  // Track if user is at bottom
  const handleScroll = () => {
    if (!scrollRef.current) return
    
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
    const atBottom = scrollHeight - scrollTop - clientHeight < 10 // 10px tolerance
    setIsAtBottom(atBottom)
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString(
      undefined, // use default locale
      {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        fractionalSecondDigits: 3
      }
    )
  }

  const getMessageClasses = (message: ConsoleMessage) => {
    const baseClasses = 'py-1 px-2 text-xs font-mono border-l-2 flex gap-2'
    
    if (message.direction === 'incoming') {
      if (message.type === 'error') {
        return `${baseClasses} border-red-500 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300`
      } else if (message.type === 'info') {
        return `${baseClasses} border-blue-500 bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300`
      }
      return `${baseClasses} border-green-500 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300`
    } else {
      return `${baseClasses} border-gray-500 bg-gray-50 dark:bg-neutral-800/50 text-gray-700 dark:text-neutral-300`
    }
  }

  const getDirectionSymbol = (direction: 'incoming' | 'outgoing') => {
    return direction === 'incoming' ? '←' : '→'
  }

  return (
    <div className="relative flex-1 min-h-0">
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-md"
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-gray-500 dark:text-neutral-400">
            No messages yet. Connect a device to see serial data.
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {messages.map((message) => (
              <div key={message.id} className={getMessageClasses(message)}>
                <span className="text-gray-400 dark:text-neutral-500 text-[10px] min-w-[60px] shrink-0">
                  {formatTimestamp(message.timestamp)}
                </span>
                <span className="text-gray-400 dark:text-neutral-500 min-w-[12px] shrink-0">
                  {getDirectionSymbol(message.direction)}
                </span>
                <span className="break-all whitespace-pre-wrap">
                  {message.content}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Auto-scroll indicator */}
      {!isAtBottom && (
        <button
          onClick={() => {
            if (scrollRef.current) {
              scrollRef.current.scrollTop = scrollRef.current.scrollHeight
            }
          }}
          className="absolute bottom-4 right-4 px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-colors"
        >
          ↓ Scroll to bottom
        </button>
      )}
    </div>
  )
}