import type { ConsoleMessage } from '../store/ConsoleStore'

export type ExportFormat = 'txt' | 'csv' | 'json'

export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toISOString()
}

export function exportMessagesAsTxt(messages: ConsoleMessage[]): string {
  return messages.map(msg => {
    const time = formatTimestamp(msg.timestamp)
    const direction = msg.direction === 'incoming' ? '←' : '→'
    const type = msg.type && msg.type !== 'data' ? ` [${msg.type.toUpperCase()}]` : ''
    return `${time} ${direction}${type} ${msg.content}`
  }).join('\n')
}

export function exportMessagesAsCsv(messages: ConsoleMessage[]): string {
  const header = 'Timestamp,Direction,Type,Content\n'
  const rows = messages.map(msg => {
    const time = formatTimestamp(msg.timestamp)
    const direction = msg.direction
    const type = msg.type || 'data'
    const content = `"${msg.content.replace(/"/g, '""')}"` // Escape quotes in CSV
    return `${time},${direction},${type},${content}`
  }).join('\n')
  
  return header + rows
}

export function exportMessagesAsJson(messages: ConsoleMessage[]): string {
  const exportData = {
    exported: new Date().toISOString(),
    messageCount: messages.length,
    messages: messages.map(msg => ({
      timestamp: msg.timestamp,
      timestampISO: formatTimestamp(msg.timestamp),
      direction: msg.direction,
      type: msg.type || 'data',
      content: msg.content
    }))
  }
  
  return JSON.stringify(exportData, null, 2)
}

export function downloadFile(content: string | Uint8Array, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  // Clean up the URL object
  URL.revokeObjectURL(url)
}

export function exportMessages(messages: ConsoleMessage[], format: ExportFormat) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
  
  let content: string
  let filename: string
  let mimeType: string
  
  switch (format) {
    case 'txt':
      content = exportMessagesAsTxt(messages)
      filename = `console-log-${timestamp}.txt`
      mimeType = 'text/plain'
      break
    case 'csv':
      content = exportMessagesAsCsv(messages)
      filename = `console-log-${timestamp}.csv`
      mimeType = 'text/csv'
      break
    case 'json':
      content = exportMessagesAsJson(messages)
      filename = `console-log-${timestamp}.json`
      mimeType = 'application/json'
      break
    default:
      throw new Error(`Unsupported export format: ${format}`)
  }
  
  downloadFile(content, filename, mimeType)
}