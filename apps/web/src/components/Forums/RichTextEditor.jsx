import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { parseMarkdown } from '../../lib/markdown'
import { clsx } from 'clsx'

export function RichTextEditor({
  value = '',
  onChange,
  onSubmit,
  placeholder = 'Write your message...',
  className = '',
  minHeight = '120px',
  maxHeight = '400px',
  allowUploads = true,
  showPreview = true,
  showMentions = true,
  showEmojis = true,
  submitLabel = 'Post',
  disabled = false
}) {
  const [mode, setMode] = useState('write') // 'write' or 'preview'
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionPosition, setMentionPosition] = useState(null)
  const [emojiPicker, setEmojiPicker] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [cursorPosition, setCursorPosition] = useState(0)

  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)

  // User search for mentions
  const { data: mentionUsers = [] } = useQuery({
    queryKey: ['user-search', mentionQuery],
    queryFn: () => api.searchUsers(mentionQuery),
    enabled: mentionQuery.length > 1,
  })

  // Handle text changes and detect mentions
  const handleTextChange = useCallback((e) => {
    const newValue = e.target.value
    const cursor = e.target.selectionStart

    onChange(newValue)
    setCursorPosition(cursor)

    // Check for mentions
    if (showMentions) {
      const beforeCursor = newValue.substring(0, cursor)
      const mentionMatch = beforeCursor.match(/@(\w*)$/)

      if (mentionMatch) {
        setMentionQuery(mentionMatch[1])
        setMentionPosition(cursor - mentionMatch[1].length - 1)
      } else {
        setMentionQuery('')
        setMentionPosition(null)
      }
    }
  }, [onChange, showMentions])

  // Insert mention
  const insertMention = useCallback((user) => {
    const beforeMention = value.substring(0, mentionPosition)
    const afterCursor = value.substring(cursorPosition)
    const newValue = `${beforeMention}@${user.handle} ${afterCursor}`

    onChange(newValue)
    setMentionQuery('')
    setMentionPosition(null)

    // Focus back to textarea
    setTimeout(() => {
      textareaRef.current?.focus()
      const newCursorPos = mentionPosition + user.handle.length + 2
      textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }, [value, mentionPosition, cursorPosition, onChange])

  // Formatting functions
  const formatText = useCallback((format) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    const beforeSelection = value.substring(0, start)
    const afterSelection = value.substring(end)

    let newText = ''
    let cursorOffset = 0

    switch (format) {
      case 'bold':
        newText = selectedText ? `**${selectedText}**` : '**bold text**'
        cursorOffset = selectedText ? 0 : -11
        break
      case 'italic':
        newText = selectedText ? `*${selectedText}*` : '*italic text*'
        cursorOffset = selectedText ? 0 : -12
        break
      case 'code':
        newText = selectedText ? `\`${selectedText}\`` : '`code`'
        cursorOffset = selectedText ? 0 : -6
        break
      case 'codeblock':
        newText = selectedText ? `\`\`\`\n${selectedText}\n\`\`\`` : '```\ncode block\n```'
        cursorOffset = selectedText ? 0 : -13
        break
      case 'link':
        newText = selectedText ? `[${selectedText}](url)` : '[link text](url)'
        cursorOffset = selectedText ? -4 : -14
        break
      case 'quote':
        newText = selectedText ? `> ${selectedText}` : '> quoted text'
        cursorOffset = selectedText ? 0 : -12
        break
      case 'list':
        newText = selectedText ? `- ${selectedText}` : '- list item'
        cursorOffset = selectedText ? 0 : -10
        break
      case 'numberedlist':
        newText = selectedText ? `1. ${selectedText}` : '1. numbered item'
        cursorOffset = selectedText ? 0 : -14
        break
    }

    const finalValue = beforeSelection + newText + afterSelection
    onChange(finalValue)

    // Set cursor position
    setTimeout(() => {
      const newPos = start + newText.length + cursorOffset
      textarea.setSelectionRange(newPos, newPos)
      textarea.focus()
    }, 0)
  }, [value, onChange])

  // Handle file upload
  const handleFileUpload = useCallback(async (files) => {
    if (!allowUploads) return

    setIsUploading(true)
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Mock upload - in real app would upload to server
        await new Promise(resolve => setTimeout(resolve, 1000))
        return {
          name: file.name,
          url: `https://example.com/uploads/${file.name}`,
          type: file.type
        }
      })

      const uploadedFiles = await Promise.all(uploadPromises)

      // Insert file links into text
      const fileLinks = uploadedFiles.map(file => {
        if (file.type.startsWith('image/')) {
          return `![${file.name}](${file.url})`
        } else {
          return `[${file.name}](${file.url})`
        }
      }).join('\n')

      const newValue = value + (value ? '\n\n' : '') + fileLinks
      onChange(newValue)

    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setIsUploading(false)
    }
  }, [allowUploads, value, onChange])

  // Drag and drop
  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileUpload(files)
    }
  }, [handleFileUpload])

  // Insert emoji
  const insertEmoji = useCallback((emoji) => {
    const newValue = value + emoji
    onChange(newValue)
    setEmojiPicker(false)
    textareaRef.current?.focus()
  }, [value, onChange])

  const commonEmojis = []

  const toolbarButtons = [
    { icon: '**B**', label: 'Bold', action: () => formatText('bold') },
    { icon: '*I*', label: 'Italic', action: () => formatText('italic') },
    { icon: '<>', label: 'Code', action: () => formatText('code') },
    { icon: '```', label: 'Code Block', action: () => formatText('codeblock') },
    { icon: '🔗', label: 'Link', action: () => formatText('link') },
    { icon: '"', label: 'Quote', action: () => formatText('quote') },
    { icon: '•', label: 'List', action: () => formatText('list') },
    { icon: '1.', label: 'Numbered List', action: () => formatText('numberedlist') },
  ]

  const handleKeyDown = useCallback((e) => {
    // Handle keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault()
          formatText('bold')
          break
        case 'i':
          e.preventDefault()
          formatText('italic')
          break
        case 'Enter':
          e.preventDefault()
          onSubmit?.()
          break
      }
    }

    // Handle Tab for indentation
    if (e.key === 'Tab') {
      e.preventDefault()
      const start = e.target.selectionStart
      const end = e.target.selectionEnd
      const newValue = value.substring(0, start) + '  ' + value.substring(end)
      onChange(newValue)

      setTimeout(() => {
        e.target.setSelectionRange(start + 2, start + 2)
      }, 0)
    }
  }, [formatText, onSubmit, value, onChange])

  return (
    <div className={clsx('relative border border-gray-300 rounded-lg overflow-hidden', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200"
        <div className="flex items-center space-x-1">
        {/* Formatting buttons */}
        {toolbarButtons.map((button, index) => (
          <button
            key={index}
            onClick={button.action}
            disabled={disabled}
            className="p-2 text-sm font-mono text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors disabled:opacity-50"
            title={button.label}
          >
            {button.icon}
          </button>
        ))}

        <div className="w-px h-6 bg-gray-300 mx-2" />

        {/* File upload */}
        {allowUploads && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isUploading}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors disabled:opacity-50"
            title="Upload file"
          >
            {isUploading ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.586-6.586a4 4 0 00-5.656-5.656l-7.07 7.07a6 6 0 008.485 8.485L20 12" />
              </svg>
            )}
          </button>
        )}

        {/* Emoji picker */}
        {showEmojis && (
          <div className="relative">
            <button
              onClick={() => setEmojiPicker(!emojiPicker)}
              disabled={disabled}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors disabled:opacity-50"
              title="Add emoji"
            >
              😀
            </button>

            {emojiPicker && (
              <div className="absolute top-full left-0 mt-1 p-3 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <div className="grid grid-cols-5 gap-1">
                  {commonEmojis.map((emoji, index) => (
                    <button
                      key={index}
                      onClick={() => insertEmoji(emoji)}
                      className="p-2 hover:bg-gray-50 rounded text-lg"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mode toggle */}
      {showPreview && (
        <div className="flex items-center">
          <button
            onClick={() => setMode('write')}
            className={clsx(
              'px-3 py-1 text-sm rounded-l-lg transition-colors',
              mode === 'write'
                ? 'bg-blue-100 text-blue-800
                : 'text-gray-600 hover:text-gray-900
            )}
          >
            Write
          </button>
          <button
            onClick={() => setMode('preview')}
            className={clsx(
              'px-3 py-1 text-sm rounded-r-lg transition-colors',
              mode === 'preview'
                ? 'bg-blue-100 text-blue-800
                : 'text-gray-600 hover:text-gray-900
            )}
          >
            Preview
          </button>
        </div>
      )}
    </div>
      
      {/* Content area */ }
  <div className="relative">
    {mode === 'write' ? (
      <>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full px-4 py-3 bg-transparent border-0 resize-none focus:outline-none focus:ring-0 text-gray-900 placeholder-gray-500"
          style={{
            minHeight,
            maxHeight,
            resize: 'vertical'
          }}
        />

        {/* Mention dropdown */}
        {mentionPosition !== null && mentionUsers.length > 0 && (
          <div className="absolute z-20 mt-1 max-w-xs bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
            style={{
              top: '100%',
              left: `${(mentionPosition / value.length) * 100}%` // Approximate positioning
            }}>
            {mentionUsers.map((user, index) => (
              <button
                key={user.id}
                onClick={() => insertMention(user)}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {user.handle[0].toUpperCase()}
                </div>
                <div>
                  <div className="font-medium text-gray-900"
                    {user.display_name && (
                      <div className="text-sm text-gray-500"
                      )}
                    </div>
              </button>
            ))}
          </div>
        )}
      </>
    ) : (
      <div
        className="px-4 py-3 prose prose-gray max-w-none"
        style={{ minHeight }}
        dangerouslySetInnerHTML={{ __html: parseMarkdown(value || '*Nothing to preview yet*') }}
      />
    )}
  </div>

  {/* Bottom toolbar */ }
  {
    onSubmit && (
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200"
          <div className="text-xs text-gray-500"
            Supports Markdown • @mention users • Drag & drop files
          </div >
      <button
        onClick={onSubmit}
        disabled={disabled || !value.trim()}
        className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitLabel}
      </button>
        </div >
      )
  }

  {/* Hidden file input */ }
  <input
    ref={fileInputRef}
    type="file"
    multiple
    accept="image/*,video/*,.pdf,.doc,.docx,.txt"
    onChange={(e) => handleFileUpload(e.target.files)}
    className="hidden"
  />

  {/* Click outside handler for emoji picker */ }
  {
    emojiPicker && (
      <div
        className="fixed inset-0 z-0"
        onClick={() => setEmojiPicker(false)}
      />
    )
  }
    </div >
  )
}
