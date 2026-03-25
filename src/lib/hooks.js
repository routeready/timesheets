import { useState, useCallback, useEffect } from 'react'
import { getJSON, setJSON } from './storage'

export function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(() => getJSON(key, defaultValue))

  const setAndPersist = useCallback(
    (newValue) => {
      setValue(prev => {
        const resolved = typeof newValue === 'function' ? newValue(prev) : newValue
        setJSON(key, resolved)
        return resolved
      })
    },
    [key]
  )

  return [value, setAndPersist]
}

export function useFileImport(onParsed) {
  const handleFile = useCallback(
    (file) => {
      if (!file) return
      const reader = new FileReader()
      reader.onload = (e) => {
        onParsed(e.target.result, file.name)
      }
      reader.readAsArrayBuffer(file)
    },
    [onParsed]
  )

  return handleFile
}

export function useDragDrop(onFile) {
  const [isDragging, setIsDragging] = useState(false)

  const handlers = {
    onDragOver: (e) => {
      e.preventDefault()
      setIsDragging(true)
    },
    onDragLeave: () => setIsDragging(false),
    onDrop: (e) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) onFile(file)
    },
  }

  return { isDragging, handlers }
}
