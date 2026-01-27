import { useState, useEffect, useCallback } from 'react'
import Button from './ui/Button'
import Checkbox from './ui/Checkbox'
import Input from './ui/Input'
import Select from './ui/Select'
import Modal from './ui/Modal'
import Tooltip from './ui/Tooltip'

interface Settings {
  autoscale: boolean
  manualMinInput: string
  manualMaxInput: string
  capacity: number
  maxViewPortSize: number
  timeMode: 'absolute' | 'relative'
  filterChartData: boolean
  filterConsoleData: boolean
}

interface Props {
  open: boolean
  settings: Settings
  onChange: {
    setAutoscale: (v: boolean) => void
    setManualMinInput: (v: string) => void
    setManualMaxInput: (v: string) => void
    setCapacity: (v: number) => void
    setMaxViewPortSize: (v: number) => void
    setTimeMode: (v: 'absolute' | 'relative') => void
    setFilterChartData: (v: boolean) => void
    setFilterConsoleData: (v: boolean) => void
  }
  onClose: () => void
}

interface SavedProfile extends Settings {
  name: string
}

const STORAGE_KEY = 'wsp.settings.profiles'
const DEFAULT_SETTINGS: Settings = {
  autoscale: true,
  manualMinInput: '-1',
  manualMaxInput: '1',
  capacity: 100000,
  maxViewPortSize: 2000,
  timeMode: 'absolute',
  filterChartData: true,
  filterConsoleData: true
}

export default function SettingsPanel({ open, settings, onChange, onClose }: Props) {
  const [profiles, setProfiles] = useState<SavedProfile[]>([])
  const [currentProfile, setCurrentProfile] = useState<string>('Default')
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showSaveAsDialog, setShowSaveAsDialog] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false)
  const [profileToDelete, setProfileToDelete] = useState<string>('')
  const [newProfileName, setNewProfileName] = useState('')
  const [saveError, setSaveError] = useState('')
  const [isModified, setIsModified] = useState(false)

  // Load profiles from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as SavedProfile[]
        setProfiles(parsed)
      }
    } catch (err) {
      console.error('Failed to load profiles:', err)
    }
  }, [])

  // Check if current settings match any profile
  useEffect(() => {
    // Only run this check after initial render to avoid setting Custom on startup
    if (!open) return

    // Check if matches default
    const matchesDefault = 
      settings.autoscale === DEFAULT_SETTINGS.autoscale &&
      settings.manualMinInput === DEFAULT_SETTINGS.manualMinInput &&
      settings.manualMaxInput === DEFAULT_SETTINGS.manualMaxInput &&
      settings.capacity === DEFAULT_SETTINGS.capacity &&
      settings.maxViewPortSize === DEFAULT_SETTINGS.maxViewPortSize &&
      settings.timeMode === DEFAULT_SETTINGS.timeMode &&
      settings.filterChartData === DEFAULT_SETTINGS.filterChartData &&
      settings.filterConsoleData === DEFAULT_SETTINGS.filterConsoleData

    if (matchesDefault) {
      setCurrentProfile('Default')
      setIsModified(false)
      return
    }

    // Check if matches any saved profile
    const matchingProfile = profiles.find(p => 
      p.autoscale === settings.autoscale &&
      p.manualMinInput === settings.manualMinInput &&
      p.manualMaxInput === settings.manualMaxInput &&
      p.capacity === settings.capacity &&
      p.maxViewPortSize === settings.maxViewPortSize &&
      p.timeMode === settings.timeMode &&
      p.filterChartData === settings.filterChartData &&
      p.filterConsoleData === settings.filterConsoleData
    )

    if (matchingProfile) {
      setCurrentProfile(matchingProfile.name)
      setIsModified(false)
    } else {
      // Settings don't match any profile
      // If currently on Default, switch to Custom
      // If on a saved profile, mark as modified but keep the name
      if (currentProfile === 'Default') {
        setCurrentProfile('Custom')
      }
      setIsModified(currentProfile !== 'Default' && currentProfile !== 'Custom')
    }
  }, [settings, profiles, open, currentProfile])

  const loadProfile = useCallback((profileName: string) => {
    if (profileName === 'Default') {
      onChange.setAutoscale(DEFAULT_SETTINGS.autoscale)
      onChange.setManualMinInput(DEFAULT_SETTINGS.manualMinInput)
      onChange.setManualMaxInput(DEFAULT_SETTINGS.manualMaxInput)
      onChange.setCapacity(DEFAULT_SETTINGS.capacity)
      onChange.setMaxViewPortSize(DEFAULT_SETTINGS.maxViewPortSize)
      onChange.setTimeMode(DEFAULT_SETTINGS.timeMode)
      onChange.setFilterChartData(DEFAULT_SETTINGS.filterChartData)
      onChange.setFilterConsoleData(DEFAULT_SETTINGS.filterConsoleData)
      setIsModified(false)
      return
    }

    const profile = profiles.find(p => p.name === profileName)
    if (profile) {
      onChange.setAutoscale(profile.autoscale)
      onChange.setManualMinInput(profile.manualMinInput)
      onChange.setManualMaxInput(profile.manualMaxInput)
      onChange.setCapacity(profile.capacity)
      onChange.setMaxViewPortSize(profile.maxViewPortSize)
      onChange.setTimeMode(profile.timeMode)
      onChange.setFilterChartData(profile.filterChartData)
      onChange.setFilterConsoleData(profile.filterConsoleData)
      setIsModified(false)
    }
  }, [profiles, onChange])

  const handleSaveProfile = useCallback(() => {
    const trimmedName = newProfileName.trim()
    
    if (!trimmedName) {
      setSaveError('Profile name cannot be empty')
      return
    }

    if (trimmedName.toLowerCase() === 'default' || trimmedName.toLowerCase() === 'custom') {
      setSaveError('Cannot use "Default" or "Custom" as profile name')
      return
    }

    const newProfile: SavedProfile = {
      name: trimmedName,
      ...settings
    }

    try {
      // Remove existing profile with same name
      const updatedProfiles = profiles.filter(p => p.name !== trimmedName)
      updatedProfiles.push(newProfile)
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProfiles))
      setProfiles(updatedProfiles)
      setShowSaveDialog(false)
      setShowSaveAsDialog(false)
      setNewProfileName('')
      setSaveError('')
      setCurrentProfile(trimmedName)
      setIsModified(false)
    } catch (err) {
      setSaveError('Failed to save profile. Storage may be full.')
      console.error('Failed to save profile:', err)
    }
  }, [newProfileName, settings, profiles])

  const handleOverwriteProfile = useCallback(() => {
    // Overwrite the currently selected profile
    const newProfile: SavedProfile = {
      name: currentProfile,
      ...settings
    }

    try {
      const updatedProfiles = profiles.filter(p => p.name !== currentProfile)
      updatedProfiles.push(newProfile)
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProfiles))
      setProfiles(updatedProfiles)
      setIsModified(false)
      setShowOverwriteConfirm(false)
    } catch (err) {
      console.error('Failed to overwrite profile:', err)
    }
  }, [currentProfile, settings, profiles])

  const confirmOverwriteProfile = useCallback(() => {
    setShowOverwriteConfirm(true)
  }, [])

  const handleDeleteProfile = useCallback((profileName: string) => {
    try {
      const updatedProfiles = profiles.filter(p => p.name !== profileName)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProfiles))
      setProfiles(updatedProfiles)
      
      if (currentProfile === profileName) {
        setCurrentProfile('Default')
        loadProfile('Default')
      }
      setShowDeleteConfirm(false)
      setProfileToDelete('')
    } catch (err) {
      console.error('Failed to delete profile:', err)
    }
  }, [profiles, currentProfile, loadProfile])

  const confirmDeleteProfile = useCallback((profileName: string) => {
    setProfileToDelete(profileName)
    setShowDeleteConfirm(true)
  }, [])

  // Determine which buttons to show
  const showSaveButton = isModified && currentProfile !== 'Default' && currentProfile !== 'Custom'
  const showSaveAsButton = isModified && currentProfile !== 'Default' && currentProfile !== 'Custom'
  const showSaveProfileButton = currentProfile === 'Custom'
  return (
    <>
      <aside aria-hidden={!open} className={`shrink-0 border-l ${open ? 'border-gray-200 dark:border-neutral-800' : 'border-transparent'} ${open ? 'w-56' : 'w-0'} overflow-hidden transition-all duration-200 ease-out bg-white dark:bg-neutral-900 text-sm flex flex-col`}>
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-neutral-800 shrink-0">
          <div className="font-medium">Settings</div>
          <Button size="sm" variant="neutral" onClick={onClose}>Close</Button>
        </div>
        <div className="p-3 space-y-5 overflow-y-auto flex-1">
          {/* Profile Selector */}
          <div>
            <div className="text-xs uppercase tracking-wide opacity-70 mb-2">Profile</div>
            <div className="flex items-center gap-2">
              <Tooltip label={currentProfile}>
                <div className="flex-1 min-w-0">
                  <Select 
                    className="w-full truncate" 
                    value={currentProfile} 
                    onChange={(e) => loadProfile(e.target.value)}
                    style={{ maxWidth: '100%' }}
                  >
                    <option value="Default">Default</option>
                    {profiles.map(p => (
                      <option key={p.name} value={p.name}>{p.name}</option>
                    ))}
                    {currentProfile === 'Custom' && <option value="Custom">Custom</option>}
                  </Select>
                </div>
              </Tooltip>
              {currentProfile !== 'Default' && currentProfile !== 'Custom' && (
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => confirmDeleteProfile(currentProfile)}
                  title="Delete profile"
                  className="px-2"
                >
                  ×
                </Button>
              )}
            </div>
          </div>

          <div>
            <div className="text-xs uppercase tracking-wide opacity-70 mb-2">Y-Axis</div>
          <label className="flex items-center gap-2 mb-3">
            <Checkbox checked={settings.autoscale} onChange={(e) => onChange.setAutoscale(e.target.checked)} />
            <span>Autoscale Y</span>
          </label>
          {!settings.autoscale && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-xs opacity-70 mb-1">Y min</div>
                <Input type="number" step="any" className="w-full" value={settings.manualMinInput} onChange={(e) => onChange.setManualMinInput(e.target.value)} />
              </div>
              <div>
                <div className="text-xs opacity-70 mb-1">Y max</div>
                <Input type="number" step="any" className="w-full" value={settings.manualMaxInput} onChange={(e) => onChange.setManualMaxInput(e.target.value)} />
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="text-xs uppercase tracking-wide opacity-70 mb-2">Time</div>
          <Select className="w-full" value={settings.timeMode} onChange={(e) => onChange.setTimeMode(e.target.value as 'absolute' | 'relative')}>
            <option value="absolute">Absolute</option>
            <option value="relative">Relative</option>
          </Select>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wide opacity-70 mb-2">History</div>
          <div className="flex items-center gap-2">
            <Input type="number" className="w-28" min={100} step={100} value={settings.capacity} onChange={(e) => onChange.setCapacity(Math.max(100, Math.floor(Number(e.target.value) || 100)))} />
            <span className="opacity-70">pts</span>
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wide opacity-70 mb-2">Max Viewport</div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              className="w-28"
              min={10}
              step={50}
              value={settings.maxViewPortSize}
              onChange={(e) => onChange.setMaxViewPortSize(Math.max(10, Math.floor(Number(e.target.value) || 10)))}
            />
            <span className="opacity-70">pts</span>
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wide opacity-70 mb-2">Data Filters</div>
          <label className="flex items-center gap-2 mb-2">
            <Checkbox checked={settings.filterChartData} onChange={(e) => onChange.setFilterChartData(e.target.checked)} />
            <span className="text-xs">Chart: Only [bracketed] lines</span>
          </label>
          <label className="flex items-center gap-2">
            <Checkbox checked={settings.filterConsoleData} onChange={(e) => onChange.setFilterConsoleData(e.target.checked)} />
            <span className="text-xs">Console: Hide [bracketed] lines</span>
          </label>
        </div>

        {/* Save buttons */}
        {(showSaveButton || showSaveAsButton || showSaveProfileButton) && (
          <div className="pt-3 border-t border-gray-200 dark:border-neutral-800 space-y-2">
            {showSaveButton && (
              <Button 
                variant="primary" 
                onClick={confirmOverwriteProfile}
                className="w-full"
              >
                Save
              </Button>
            )}
            {showSaveAsButton && (
              <Button 
                variant="neutral" 
                onClick={() => setShowSaveAsDialog(true)}
                className="w-full"
              >
                Save as...
              </Button>
            )}
            {showSaveProfileButton && (
              <Button 
                variant="primary" 
                onClick={() => setShowSaveDialog(true)}
                className="w-full"
              >
                Save Profile
              </Button>
            )}
          </div>
        )}

      </div>
    </aside>

    {/* Save Profile Dialog (for Custom) */}
    <Modal
      open={showSaveDialog}
      onClose={() => {
        setShowSaveDialog(false)
        setNewProfileName('')
        setSaveError('')
      }}
      title="Save Profile"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm mb-2">Profile Name</label>
          <Input
            type="text"
            value={newProfileName}
            onChange={(e) => {
              setNewProfileName(e.target.value)
              setSaveError('')
            }}
            placeholder="Enter profile name"
            className="w-full"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSaveProfile()
              }
            }}
          />
          {saveError && (
            <div className="text-xs text-red-600 dark:text-red-400 mt-1">{saveError}</div>
          )}
        </div>
        <div className="flex gap-2 justify-end">
          <Button
            variant="neutral"
            onClick={() => {
              setShowSaveDialog(false)
              setNewProfileName('')
              setSaveError('')
            }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSaveProfile}
          >
            Confirm
          </Button>
        </div>
      </div>
    </Modal>

    {/* Save As Dialog (for modified saved profiles) */}
    <Modal
      open={showSaveAsDialog}
      onClose={() => {
        setShowSaveAsDialog(false)
        setNewProfileName('')
        setSaveError('')
      }}
      title="Save Profile As"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm mb-2">New Profile Name</label>
          <Input
            type="text"
            value={newProfileName}
            onChange={(e) => {
              setNewProfileName(e.target.value)
              setSaveError('')
            }}
            placeholder="Enter new profile name"
            className="w-full"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSaveProfile()
              }
            }}
          />
          {saveError && (
            <div className="text-xs text-red-600 dark:text-red-400 mt-1">{saveError}</div>
          )}
        </div>
        <div className="flex gap-2 justify-end">
          <Button
            variant="neutral"
            onClick={() => {
              setShowSaveAsDialog(false)
              setNewProfileName('')
              setSaveError('')
            }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSaveProfile}
          >
            Confirm
          </Button>
        </div>
      </div>
    </Modal>

    {/* Delete Confirmation Dialog */}
    <Modal
      open={showDeleteConfirm}
      onClose={() => {
        setShowDeleteConfirm(false)
        setProfileToDelete('')
      }}
      title="Delete Profile"
    >
      <div className="space-y-4">
        <p className="text-sm">
          Are you sure you want to delete the profile <strong>"{profileToDelete}"</strong>? This action cannot be undone.
        </p>
        <div className="flex gap-2 justify-end">
          <Button
            variant="neutral"
            onClick={() => {
              setShowDeleteConfirm(false)
              setProfileToDelete('')
            }}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => handleDeleteProfile(profileToDelete)}
          >
            Delete
          </Button>
        </div>
      </div>
    </Modal>

    {/* Overwrite Confirmation Dialog */}
    <Modal
      open={showOverwriteConfirm}
      onClose={() => setShowOverwriteConfirm(false)}
      title="Overwrite Profile"
    >
      <div className="space-y-4">
        <p className="text-sm">
          Are you sure you want to overwrite the profile <strong>"{currentProfile}"</strong> with the current settings?
        </p>
        <div className="flex gap-2 justify-end">
          <Button
            variant="neutral"
            onClick={() => setShowOverwriteConfirm(false)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleOverwriteProfile}
          >
            Overwrite
          </Button>
        </div>
      </div>
    </Modal>
    </>
  )
}


