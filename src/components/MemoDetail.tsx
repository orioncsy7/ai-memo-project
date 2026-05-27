'use client'

import { useEffect, useState, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Memo, MEMO_CATEGORIES } from '@/types/memo'

interface MemoDetailProps {
  memo: Memo | null
  isOpen: boolean
  onClose: () => void
  onEdit: (memo: Memo) => void
  onDelete: (id: string) => void
  onUpdateSummary: (id: string, summary: string) => void
}

export default function MemoDetail({
  memo,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onUpdateSummary,
}: MemoDetailProps) {
  const [summarizing, setSummarizing] = useState(false)
  const [summaryError, setSummaryError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) {
      setSummarizing(false)
      setSummaryError(null)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const handleSummarize = useCallback(async () => {
    if (!memo) return
    setSummarizing(true)
    setSummaryError(null)

    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: memo.content }),
      })

      const data = await response.json()

      if (!response.ok) {
        setSummaryError(data.error ?? '요약 생성에 실패했습니다.')
        return
      }

      onUpdateSummary(memo.id, data.summary)
    } catch {
      setSummaryError('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.')
    } finally {
      setSummarizing(false)
    }
  }, [memo, onUpdateSummary])

  if (!isOpen || !memo) return null

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      personal: 'bg-blue-100 text-blue-800',
      work: 'bg-green-100 text-green-800',
      study: 'bg-purple-100 text-purple-800',
      idea: 'bg-yellow-100 text-yellow-800',
      other: 'bg-gray-100 text-gray-800',
    }
    return colors[category as keyof typeof colors] || colors.other
  }

  const handleEdit = () => {
    onEdit(memo)
    onClose()
  }

  const handleDelete = () => {
    if (window.confirm('정말로 이 메모를 삭제하시겠습니까?')) {
      onDelete(memo.id)
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="memo-detail-title"
      data-testid="memo-detail-backdrop"
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          {/* 헤더 */}
          <div className="flex justify-between items-start gap-4 mb-4">
            <h2
              id="memo-detail-title"
              className="text-2xl font-bold text-gray-900 break-words flex-1"
            >
              {memo.title}
            </h2>

            <div className="flex items-center gap-1 flex-shrink-0">
              {/* AI 요약 버튼 */}
              <button
                onClick={handleSummarize}
                disabled={summarizing}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="AI 요약 생성"
                aria-label="AI 요약 생성"
                data-testid="memo-detail-summarize-btn"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L13.09 8.26L19 7L15.45 11.91L21 14L15.45 16.09L19 21L13.09 15.74L12 22L10.91 15.74L5 21L8.55 16.09L3 14L8.55 11.91L5 7L10.91 8.26L12 2Z" />
                </svg>
                <span>AI 요약</span>
              </button>

              <button
                onClick={handleEdit}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="편집"
                aria-label="메모 편집"
                data-testid="memo-detail-edit-btn"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
              <button
                onClick={handleDelete}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="삭제"
                aria-label="메모 삭제"
                data-testid="memo-detail-delete-btn"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="닫기"
                aria-label="닫기"
                data-testid="memo-detail-close-btn"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* 메타 정보 */}
          <div className="flex items-center gap-2 flex-wrap mb-6 pb-4 border-b border-gray-200">
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(memo.category)}`}
            >
              {MEMO_CATEGORIES[memo.category as keyof typeof MEMO_CATEGORIES] ||
                memo.category}
            </span>
            <span className="text-xs text-gray-500">
              작성: {formatDate(memo.createdAt)}
            </span>
            {memo.createdAt !== memo.updatedAt && (
              <span className="text-xs text-gray-500">
                · 수정: {formatDate(memo.updatedAt)}
              </span>
            )}
          </div>

          {/* AI 요약 섹션 */}
          <div className="mb-6" data-testid="memo-detail-summary-section">
            {summarizing ? (
              <div className="flex items-center gap-3 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <svg
                  className="w-5 h-5 text-purple-500 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                <span className="text-sm text-purple-700">요약 중...</span>
              </div>
            ) : summaryError ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700 mb-3">{summaryError}</p>
                <button
                  onClick={handleSummarize}
                  className="text-sm text-red-600 hover:text-red-700 font-medium underline"
                >
                  다시 시도
                </button>
              </div>
            ) : memo.summary ? (
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg" data-testid="memo-detail-summary-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-purple-600 uppercase tracking-wide">
                    AI 요약
                  </span>
                  <div className="flex items-center gap-2">
                    {memo.summaryUpdatedAt && (
                      <span className="text-xs text-purple-400">
                        {formatDate(memo.summaryUpdatedAt)}
                      </span>
                    )}
                    <button
                      onClick={handleSummarize}
                      className="text-xs text-purple-500 hover:text-purple-700 font-medium underline"
                    >
                      다시 요약
                    </button>
                  </div>
                </div>
                <p className="text-sm text-purple-900 leading-relaxed">{memo.summary}</p>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-500 flex-1">
                  AI가 이 메모를 2-3문장으로 요약해 드립니다.
                </p>
                <button
                  onClick={handleSummarize}
                  className="flex-shrink-0 px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                >
                  AI 요약 생성
                </button>
              </div>
            )}
          </div>

          {/* 본문 (원본 + 프리뷰 분할) */}
          <div
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6"
            data-testid="memo-detail-content"
          >
            {/* 원본 (좌) */}
            <section
              className="flex flex-col"
              aria-labelledby="memo-detail-raw-label"
            >
              <h3
                id="memo-detail-raw-label"
                className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2"
              >
                원본
              </h3>
              <pre
                className="flex-1 text-gray-800 text-sm leading-relaxed whitespace-pre-wrap break-words bg-gray-50 border border-gray-200 rounded-md p-4 font-mono overflow-auto max-h-[60vh]"
                data-testid="memo-detail-raw"
              >
                {memo.content}
              </pre>
            </section>

            {/* 프리뷰 (우) */}
            <section
              className="flex flex-col"
              aria-labelledby="memo-detail-preview-label"
            >
              <h3
                id="memo-detail-preview-label"
                className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2"
              >
                프리뷰
              </h3>
              <div
                className="flex-1 bg-white border border-gray-200 rounded-md p-4 overflow-auto max-h-[60vh] prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-800 prose-a:text-blue-600 prose-strong:text-gray-900 prose-code:text-pink-600 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-img:rounded-lg prose-blockquote:border-blue-500 prose-blockquote:text-gray-700"
                data-testid="memo-detail-markdown"
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    a: ({ ...props }) => (
                      <a
                        {...props}
                        target="_blank"
                        rel="noopener noreferrer"
                      />
                    ),
                  }}
                >
                  {memo.content}
                </ReactMarkdown>
              </div>
            </section>
          </div>

          {/* 태그 */}
          {memo.tags.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {memo.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-md"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
