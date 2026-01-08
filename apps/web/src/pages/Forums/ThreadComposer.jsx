import React, { useState, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Container } from '../../components/Layout/Container'
import { useToast } from '../../components/Toast'
import { useConfirm } from '../../components/ConfirmDialog'
import { forumService } from '../../forums/service'
import { parseMarkdown } from '../../lib/markdown'
import { setPageMeta } from '../../lib/head'
import { clsx } from 'clsx'

// Available tags for threads
const availableTags = [
  'Question', 'Discussion', 'News', 'Help', 'Tutorial', 'Review',
  'Bug Report', 'Feature Request', 'Announcement', 'Off-Topic',
  'Beginner', 'Advanced', 'Tips', 'Resources', 'Community'
]

// Thread categories
const threadCategories = [
  { value: 'general', label: 'General Discussion' },
  { value: 'question', label: 'Question & Answer' },
  { value: 'tutorial', label: 'Tutorial & Guide' },
  { value: 'news', label: 'News & Updates' },
  { value: 'review', label: 'Review & Opinion' },
  { value: 'help', label: 'Help & Support' },
]

export default function ThreadComposer() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const confirm = useConfirm()
  const textareaRef = useRef(null)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    tags: [],
    category: 'general',
    allowComments: true,
    sticky: false,
    nsfw: false,
  })

  const [showPreview, setShowPreview] = useState(false)
  const [errors, setErrors] = useState({})
  const [isDirty, setIsDirty] = useState(false)
  const [autoSaveStatus, setAutoSaveStatus] = useState('')

  // Drafts management
  const [drafts, setDrafts] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('threadDrafts') || '{}')
    } catch {
      return {}
    }
  })

  // Load forum data
  const { data: forum } = useQuery({
    queryKey: ['forum', slug],
    queryFn: () => forumService.getForum(slug),
  })

  // Set page meta
  React.useEffect(() => {
    setPageMeta({
      title: `New Thread - ${forum?.name || 'Forum'}`,
      description: 'Create a new discussion thread in the community forum.',
    })
  }, [forum])

  // Auto-save draft
  React.useEffect(() => {
    if (!isDirty) return

    const timeoutId = setTimeout(() => {
      const draftKey = `${slug}_${Date.now()}`
      const updatedDrafts = {
        ...drafts,
        [draftKey]: {
          ...formData,
          forumSlug: slug,
          savedAt: new Date().toISOString(),
        }
      }

      // Keep only last 5 drafts per forum
      const forumDrafts = Object.entries(updatedDrafts)
        .filter(([key]) => key.startsWith(slug))
        .sort(([, a], [, b]) => new Date(b.savedAt) - new Date(a.savedAt))
        .slice(0, 5)

      const finalDrafts = {
        ...Object.fromEntries(Object.entries(updatedDrafts).filter(([key]) => !key.startsWith(slug))),
        ...Object.fromEntries(forumDrafts)
      }

      setDrafts(finalDrafts)
      localStorage.setItem('threadDrafts', JSON.stringify(finalDrafts))
      setAutoSaveStatus('Draft saved')

      setTimeout(() => setAutoSaveStatus(''), 2000)
    }, 3000) // Auto-save after 3 seconds of inactivity

    return () => clearTimeout(timeoutId)
  }, [formData, isDirty, slug, drafts])

  // Create thread mutation
  const createThreadMutation = useMutation({
    mutationFn: (threadData) => forumService.createThread(slug, threadData),
    onSuccess: (newThread) => {
      // Clear draft
      const clearedDrafts = Object.fromEntries(
        Object.entries(drafts).filter(([key]) => !key.startsWith(slug))
      )
      setDrafts(clearedDrafts)
      localStorage.setItem('threadDrafts', JSON.stringify(clearedDrafts))

      toast.success('Thread created successfully!')
      navigate(`/forums/${slug}/thread/${newThread.id}`)
    },
    onError: (error) => {
      toast.error('Failed to create thread. Please try again.')
      console.error('Thread creation error:', error)
    }
  })

  // Form handlers
  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setIsDirty(true)

    // Clear specific field error
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }, [errors])

  const handleTagToggle = useCallback((tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }))
    setIsDirty(true)
  }, [])

  // Markdown toolbar actions
  const insertMarkdown = useCallback((before, after = '') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = formData.body.substring(start, end)
    const newText = before + selectedText + after

    const newBody = formData.body.substring(0, start) + newText + formData.body.substring(end)
    handleChange('body', newBody)

    // Restore cursor position
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length)
    }, 0)
  }, [formData.body, handleChange])

  // Form validation
  const validateForm = useCallback(() => {
    const newErrors = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    } else if (formData.title.length > 200) {
      newErrors.title = 'Title must be less than 200 characters'
    }

    if (!formData.body.trim()) {
      newErrors.body = 'Body content is required'
    } else if (formData.body.length > 10000) {
      newErrors.body = 'Content must be less than 10,000 characters'
    }

    if (formData.tags.length > 5) {
      newErrors.tags = 'Maximum 5 tags allowed'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault()

    // Check authentication
    const user = localStorage.getItem('demo_user')
    if (!user) {
      toast.error('Please sign in to create threads')
      return
    }

    if (!validateForm()) {
      toast.error('Please fix the errors before submitting')
      return
    }

    createThreadMutation.mutate(formData)
  }

  // Draft management
  const loadDraft = (draftKey) => {
    const draft = drafts[draftKey]
    if (draft) {
      setFormData({
        title: draft.title || '',
        body: draft.body || '',
        tags: draft.tags || [],
        category: draft.category || 'general',
        allowComments: draft.allowComments !== false,
        sticky: draft.sticky || false,
        nsfw: draft.nsfw || false,
      })
      setIsDirty(true)
      toast.success('Draft loaded')
    }
  }

  const deleteDraft = (draftKey) => {
    const updatedDrafts = { ...drafts }
    delete updatedDrafts[draftKey]
    setDrafts(updatedDrafts)
    localStorage.setItem('threadDrafts', JSON.stringify(updatedDrafts))
    toast.success('Draft deleted')
  }

  // Navigation guard
  const handleNavigation = useCallback(async () => {
    if (isDirty) {
      const shouldLeave = await confirm({
        title: 'Unsaved Changes',
        message: 'You have unsaved changes. Are you sure you want to leave?',
        confirmText: 'Leave',
        cancelText: 'Stay',
        type: 'danger'
      })
      return shouldLeave
    }
    return true
  }, [isDirty, confirm])

  if (!forum) {
    return (
      <Container className="py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Loading...
          </h1>
        </div>
      </Container>
    )
  }

  const previewHtml = showPreview ? parseMarkdown(formData.body) : ''
  const forumDrafts = Object.entries(drafts).filter(([key]) => key.startsWith(slug))

  return (
    <Container className="py-8">
      <div className="max-w-4xl mx-auto">
        {/* Navigation */}
        <nav className="mb-6 text-sm">
          <Link
            to="/forums"
            className="text-blue-600 hover:text-blue-700"
          >
            Forums
          </Link>
          <span className="mx-2 text-gray-500">/</span>
          <Link
            to={`/forums/${slug}`}
            className="text-blue-600 hover:text-blue-700"
          >
            {forum.name}
          </Link>
          <span className="mx-2 text-gray-500">/</span>
          <span className="text-gray-900">Thread</span>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create New Thread
          </h1>
          <p className="text-gray-600">
            Start a new discussion in {forum.name}. Be respectful and follow the community guidelines.
          </p>
        </div>

        {/* Drafts Panel */}
        {forumDrafts.length > 0 && (
          <div className="card p-4 mb-6">
            <h3 className="font-medium text-gray-900 mb-3">
              Recent Drafts ({forumDrafts.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {forumDrafts.map(([key, draft]) => (
                <div key={key} className="border border-gray-200 rounded-lg p-3">
                  <h4 className="font-medium text-sm text-gray-900 mb-1">
                    {draft.title || 'Untitled'}
                  </h4>
                  <p className="text-xs text-gray-600 mb-2">
                    {new Date(draft.savedAt).toLocaleString()}
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => loadDraft(key)}
                      className="text-xs text-blue-600 hover:text-blue-700"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => deleteDraft(key)}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="card p-6">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Thread Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className={clsx('input w-full', errors.title && 'border-red-500')}
              placeholder="Enter a descriptive title for your thread"
              maxLength={200}
            />
            <div className="flex justify-between mt-1">
              {errors.title && (
                <p className="text-sm text-red-600">
                  {errors.title}
                </p>
              )}
              <p className="text-xs text-gray-500 ml-auto">
                {formData.title.length}/200
              </p>
            </div>
          </div>

          {/* Category and Tags */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category */}
            <div className="card p-6">
              <label className="block text-sm font-medium text-gray-900 mb-3">
                Category
              </label>
              <div className="space-y-2">
                {threadCategories.map((category) => (
                  <label key={category.value} className="flex items-center">
                    <input
                      type="radio"
                      name="category"
                      value={category.value}
                      checked={formData.category === category.value}
                      onChange={(e) => handleChange('category', e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">
                      {category.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="card p-6">
              <label className="block text-sm font-medium text-gray-900 mb-3">
                Tags (max 5)
              </label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagToggle(tag)}
                    disabled={!formData.tags.includes(tag) && formData.tags.length >= 5}
                    className={clsx(
                      'px-3 py-1 rounded-full text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                      formData.tags.includes(tag)
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-200'
                    )}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              {errors.tags && (
                <p className="text-sm text-red-600 mt-2">{errors.tags}</p>
              )}
            </div>
          </div>

          {/* Body Content */}
          <div className="card">
            {/* Editor Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex space-x-1 p-4">
                <button
                  type="button"
                  onClick={() => setShowPreview(false)}
                  className={clsx(
                    'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    !showPreview
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  Write
                </button>
                <button
                  type="button"
                  onClick={() => setShowPreview(true)}
                  disabled={!formData.body.trim()}
                  className={clsx(
                    'px-3 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                    showPreview
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  Preview
                </button>

                {autoSaveStatus && (
                  <div className="flex items-center ml-auto text-sm text-green-600">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {autoSaveStatus}
                  </div>
                )}
              </nav>
            </div>

            <div className="p-6">
              {!showPreview ? (
                <div>
                  {/* Markdown Toolbar */}
                  <div className="flex flex-wrap items-center space-x-2 mb-3 pb-3 border-b border-gray-200">
                    <button
                      type="button"
                      onClick={() => insertMarkdown('**', '**')}
                      className="p-2 text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-50"
                      title="Bold"
                    >
                      <strong>B</strong>
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown('*', '*')}
                      className="p-2 text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-50"
                      title="Italic"
                    >
                      <em>I</em>
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown('[', '](url)')}
                      className="p-2 text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-50"
                      title="Link"
                    >
                      🔗
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown('`', '`')}
                      className="p-2 text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-50 font-mono"
                      title="Code"
                    >
                      {`</>`}
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown('\n> ')}
                      className="p-2 text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-50"
                      title="Quote"
                    >
                      “”
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown('\n- ')}
                      className="p-2 text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-50"
                      title="List"
                    >
                      •
                    </button>
                  </div>

                  {/* Textarea */}
                  <textarea
                    ref={textareaRef}
                    value={formData.body}
                    onChange={(e) => handleChange('body', e.target.value)}
                    className={clsx('textarea w-full h-64', errors.body && 'border-red-500')}
                    placeholder="Write your thread content here. You can use Markdown formatting."
                    maxLength={10000}
                  />

                  <div className="flex justify-between mt-2">
                    {errors.body && (
                      <p className="text-sm text-red-600">
                        {errors.body}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 ml-auto">
                      {formData.body.length}/10,000 characters
                    </p>
                  </div>
                </div>
              ) : (
                <div className="prose prose-gray max-w-none min-h-[16rem]">
                  {previewHtml ? (
                    <div
                      className="markdown-content"
                      dangerouslySetInnerHTML={{ __html: previewHtml }}
                    />
                  ) : (
                    <p className="text-gray-500 italic">
                      Nothing to preview yet. Start writing to see how your content will look.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Thread Options */}
          <div className="card p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Thread Settings
            </h3>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.allowComments}
                  onChange={(e) => handleChange('allowComments', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">
                  Allow comments and replies
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.nsfw}
                  onChange={(e) => handleChange('nsfw', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">
                  Mark as NSFW (Not Safe For Work)
                </span>
              </label>

              {/* Only show sticky option for moderators */}
              {localStorage.getItem('demo_user') === 'demo' && (
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.sticky}
                    onChange={(e) => handleChange('sticky', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">
                    Pin this thread (Moderator only)
                  </span>
                </label>
              )}
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                to={`/forums/${slug}`}
                onClick={handleNavigation}
                className="btn-ghost"
              >
                Cancel
              </Link>

              <div className="text-sm text-gray-600">
                By posting, you agree to follow our community guidelines
              </div>
            </div>

            <button
              type="submit"
              disabled={createThreadMutation.isPending || !formData.title.trim() || !formData.body.trim()}
              className="btn-primary disabled:opacity-50 flex items-center space-x-2"
            >
              {createThreadMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Create Thread</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Container>
  )
}
