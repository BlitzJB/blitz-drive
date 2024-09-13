'use client'

import * as React from 'react'
import { X, Plus } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface Option {
  value: string
  label: string
}

interface MultiSelectWithChipsProps {
  options: Option[]
  selectedOptions: Option[]
  onChange: (selectedOptions: Option[]) => void
  placeholder?: string
  createNewOptionLabel?: string
  createNewDialogTitle?: string
}

export function MultiSelectWithChips({
  options: initialOptions,
  selectedOptions: initialSelectedOptions,
  onChange,
  placeholder = "Add a tag",
  createNewOptionLabel = "Create new",
  createNewDialogTitle = "Create New Tag"
}: MultiSelectWithChipsProps) {
  const [options, setOptions] = React.useState<Option[]>(initialOptions)
  const [selectedOptions, setSelectedOptions] = React.useState<Option[]>(initialSelectedOptions)
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [newTagName, setNewTagName] = React.useState('')
  const [selectKey, setSelectKey] = React.useState(0)

  const handleSelectChange = (value: string) => {
    if (value === 'create-new') {
      setIsModalOpen(true)
    } else {
      const option = options.find(opt => opt.value === value)
      if (option && !selectedOptions.some(selected => selected.value === value)) {
        const updatedOptions = [...selectedOptions, option]
        setSelectedOptions(updatedOptions)
        onChange(updatedOptions)
        setSelectKey(prev => prev + 1)
      }
    }
  }

  const removeOption = (optionToRemove: Option) => {
    const updatedOptions = selectedOptions.filter(option => option.value !== optionToRemove.value)
    setSelectedOptions(updatedOptions)
    onChange(updatedOptions)
    setSelectKey(prev => prev + 1)
  }

  const handleCreateNewTag = () => {
    if (newTagName.trim()) {
      const newOption: Option = {
        value: newTagName.toLowerCase().replace(/\s+/g, '-'),
        label: newTagName.trim()
      }
      const updatedOptions = [...options, newOption]
      const updatedSelectedOptions = [...selectedOptions, newOption]
      setOptions(updatedOptions)
      setSelectedOptions(updatedSelectedOptions)
      onChange(updatedSelectedOptions)
      setNewTagName('')
      setIsModalOpen(false)
      setSelectKey(prev => prev + 1)
    }
  }

  const getPlaceholderText = () => {
    if (selectedOptions.length === 0) {
      return placeholder
    }
    return `${selectedOptions.length} tag${selectedOptions.length > 1 ? 's' : ''} selected`
  }

  return (
    <div className="w-full space-y-4">
      <Select key={selectKey} onValueChange={handleSelectChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={getPlaceholderText()} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="create-new">
            <span className="flex items-center">
              <Plus className="mr-2 h-4 w-4" />
              {createNewOptionLabel}
            </span>
          </SelectItem>
          {options.map(option => (
            <SelectItem 
              key={option.value} 
              value={option.value}
              disabled={selectedOptions.some(selected => selected.value === option.value)}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex flex-wrap gap-2">
        {selectedOptions.map(option => (
          <div
            key={option.value}
            className="flex items-center bg-primary/10 text-primary px-2 py-1 rounded-full text-sm"
          >
            {option.label}
            <button
              onClick={() => removeOption(option)}
              className="ml-1 focus:outline-none"
              aria-label={`Remove ${option.label}`}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{createNewDialogTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="Enter new tag name"
            />
            <Button onClick={handleCreateNewTag} className="w-full">Create Tag</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}