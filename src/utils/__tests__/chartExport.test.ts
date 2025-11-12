import { describe, it, expect, vi, beforeEach } from 'vitest'
import { exportVisibleChartDataAsCsv, exportAllChartDataAsCsv, formatChartTimestamp, exportChartData } from '../chartExport'
import type { ViewPortData } from '../../store/RingStore'

const mockViewPortData: ViewPortData = {
  series: [
    { id: 0, name: 'Temperature', color: '#ff0000', visible: true },
    { id: 1, name: 'Humidity', color: '#00ff00', visible: true }
  ],
  getSeriesData: (id: number) => {
    if (id === 0) return new Float32Array([23.5, 24.0, 24.5, NaN])
    if (id === 1) return new Float32Array([45, 46, NaN, 47]) // Use integers to avoid precision issues
    return new Float32Array(0)
  },
  yMin: 20,
  yMax: 50,
  getTimes: () => new Float64Array([1609459200000, 1609459260000, 1609459320000, 1609459380000]),
  viewPortCursor: 0,
  viewPortSize: 4,
  firstTimestamp: 1609459200000 // First timestamp ever received
}

const mockStore = {
  getSeries: () => [
    { id: 0, name: 'Temperature', color: '#ff0000', visible: true },
    { id: 1, name: 'Humidity', color: '#00ff00', visible: true }
  ],
  getCapacity: () => 5,
  writeIndex: 4,
  firstTimestamp: 1609459200000, // First timestamp ever received
  times: new Float64Array([1609459200000, 1609459260000, 1609459320000, 1609459380000, NaN]),
  buffers: [
    new Float32Array([23.5, 24.0, 24.5, 25.0, NaN]),
    new Float32Array([45, 46, 47, 47, NaN]) // Use integers to avoid precision issues
  ]
}

describe('chartExport', () => {
  beforeEach(() => {
    // Mock downloadFile function
    vi.mock('./consoleExport', () => ({
      downloadFile: vi.fn()
    }))
  })

  describe('formatChartTimestamp', () => {
    it('should format timestamp as ISO string', () => {
      const result = formatChartTimestamp(1609459200000, 'iso')
      expect(result).toBe('2021-01-01T00:00:00.000Z')
    })

    it('should format timestamp as relative seconds', () => {
      const result = formatChartTimestamp(1609459260000, 'relative', 1609459200000)
      expect(result).toBe('60.000')
    })

    it('should format timestamp as raw number', () => {
      const result = formatChartTimestamp(1609459200000, 'timestamp')
      expect(result).toBe('1609459200000')
    })

    it('should handle relative time without base time', () => {
      const result = formatChartTimestamp(1609459200000, 'relative')
      expect(result).toBe('1609459200.000')
    })
  })

  describe('exportVisibleChartDataAsCsv', () => {
    it('should export visible data with ISO timestamps', () => {
      const result = exportVisibleChartDataAsCsv(mockViewPortData, {
        scope: 'visible',
        includeTimestamps: true,
        timeFormat: 'iso',
        format: 'csv'
      })
      
      const lines = result.split('\n')
      expect(lines[0]).toBe('Timestamp,Temperature,Humidity')
      expect(lines[1]).toBe('2021-01-01T00:00:00.000Z,23.5,45')
      expect(lines[2]).toBe('2021-01-01T00:01:00.000Z,24,46')
      expect(lines[3]).toBe('2021-01-01T00:02:00.000Z,24.5,')
      expect(lines[4]).toBe('2021-01-01T00:03:00.000Z,,47')
    })

    it('should export visible data with relative timestamps', () => {
      const result = exportVisibleChartDataAsCsv(mockViewPortData, {
        scope: 'visible',
        includeTimestamps: true,
        timeFormat: 'relative',
        format: 'csv'
      })
      
      const lines = result.split('\n')
      expect(lines[0]).toBe('Timestamp,Temperature,Humidity')
      expect(lines[1]).toBe('0.000,23.5,45')
      expect(lines[2]).toBe('60.000,24,46')
      expect(lines[3]).toBe('120.000,24.5,')
      expect(lines[4]).toBe('180.000,,47')
    })

    it('should export data without timestamps', () => {
      const result = exportVisibleChartDataAsCsv(mockViewPortData, {
        scope: 'visible',
        includeTimestamps: false,
        format: 'csv'
      })
      
      const lines = result.split('\n')
      expect(lines[0]).toBe('Temperature,Humidity')
      expect(lines[1]).toBe('23.5,45')
      expect(lines[2]).toBe('24,46')
    })

    it('should handle empty data', () => {
      const emptyData: ViewPortData = {
        ...mockViewPortData,
        series: [],
        getTimes: () => new Float64Array([]),
        firstTimestamp: null
      }
      
      const result = exportVisibleChartDataAsCsv(emptyData)
      expect(result).toBe('No data available')
    })
  })

  describe('exportAllChartDataAsCsv', () => {
    it('should export all data from store', () => {
      const result = exportAllChartDataAsCsv(mockStore, {
        scope: 'all',
        includeTimestamps: true,
        timeFormat: 'iso',
        format: 'csv'
      })
      
      const lines = result.split('\n')
      expect(lines[0]).toBe('Timestamp,Temperature,Humidity')
      expect(lines[1]).toBe('2021-01-01T00:00:00.000Z,23.5,45')
      expect(lines[2]).toBe('2021-01-01T00:01:00.000Z,24,46')
      expect(lines[3]).toBe('2021-01-01T00:02:00.000Z,24.5,47')
      expect(lines[4]).toBe('2021-01-01T00:03:00.000Z,25,47')
    })

    it('should handle store with no series', () => {
      const emptyStore = {
        ...mockStore,
        getSeries: () => [],
        firstTimestamp: null
      }
      
      const result = exportAllChartDataAsCsv(emptyStore)
      expect(result).toBe('No data available')
    })

    it('should handle store with no data', () => {
      const emptyStore = {
        ...mockStore,
        writeIndex: 0,
        firstTimestamp: null
      }
      
      const result = exportAllChartDataAsCsv(emptyStore)
      expect(result).toBe('Timestamp,Temperature,Humidity') // Just header
    })
  })

  describe('exportChartData', () => {
    beforeEach(() => {
      // Mock downloadFile
      global.URL.createObjectURL = vi.fn(() => 'mock-url')
      global.URL.revokeObjectURL = vi.fn()
      
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn()
      }
      
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as HTMLAnchorElement)
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as Node)
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as Node)
    })

    it('should export visible data and trigger download', () => {
      exportChartData(mockViewPortData, mockStore, { scope: 'visible', includeTimestamps: true, format: 'csv' })
      
      expect(document.createElement).toHaveBeenCalledWith('a')
      expect(document.body.appendChild).toHaveBeenCalled()
    })

    it('should export all data and trigger download', () => {
      exportChartData(mockViewPortData, mockStore, { scope: 'all', includeTimestamps: true, format: 'csv' })
      
      expect(document.createElement).toHaveBeenCalledWith('a')
      expect(document.body.appendChild).toHaveBeenCalled()
    })
  })
})