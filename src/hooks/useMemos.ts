'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Memo, MemoFormData } from '@/types/memo'
import { Tables } from '@/types/database'
import { supabase } from '@/utils/supabase'

const rowToMemo = (row: Tables<'memos'>): Memo => ({
  id: row.id,
  title: row.title,
  content: row.content,
  category: row.category,
  tags: row.tags,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  summary: row.summary ?? undefined,
  summaryUpdatedAt: row.summary_updated_at ?? undefined,
})

export const useMemos = () => {
  const [memos, setMemos] = useState<Memo[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  // 메모 로드
  useEffect(() => {
    const fetchMemos = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('memos')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        setMemos(data.map(rowToMemo))
      } catch (error) {
        console.error('Failed to load memos:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMemos()
  }, [])

  // 메모 생성
  const createMemo = useCallback(async (formData: MemoFormData): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from('memos')
        .insert({
          title: formData.title,
          content: formData.content,
          category: formData.category,
          tags: formData.tags,
        })
        .select()
        .single()

      if (error) throw error
      setMemos(prev => [rowToMemo(data), ...prev])
    } catch (error) {
      console.error('Failed to create memo:', error)
    }
  }, [])

  // 메모 업데이트
  const updateMemo = useCallback(
    async (id: string, formData: MemoFormData): Promise<void> => {
      const existingMemo = memos.find(memo => memo.id === id)
      if (!existingMemo) return

      const contentChanged = existingMemo.content !== formData.content

      try {
        const { data, error } = await supabase
          .from('memos')
          .update({
            title: formData.title,
            content: formData.content,
            category: formData.category,
            tags: formData.tags,
            updated_at: new Date().toISOString(),
            ...(contentChanged ? { summary: null, summary_updated_at: null } : {}),
          })
          .eq('id', id)
          .select()
          .single()

        if (error) throw error
        setMemos(prev => prev.map(memo => (memo.id === id ? rowToMemo(data) : memo)))
      } catch (error) {
        console.error('Failed to update memo:', error)
      }
    },
    [memos],
  )

  // 메모 삭제
  const deleteMemo = useCallback(async (id: string): Promise<void> => {
    try {
      const { error } = await supabase.from('memos').delete().eq('id', id)
      if (error) throw error
      setMemos(prev => prev.filter(memo => memo.id !== id))
    } catch (error) {
      console.error('Failed to delete memo:', error)
    }
  }, [])

  // 메모 요약 업데이트 (캐싱)
  const updateMemoSummary = useCallback(
    async (id: string, summary: string): Promise<void> => {
      try {
        const { data, error } = await supabase
          .from('memos')
          .update({
            summary,
            summary_updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .single()

        if (error) throw error
        setMemos(prev => prev.map(memo => (memo.id === id ? rowToMemo(data) : memo)))
      } catch (error) {
        console.error('Failed to update memo summary:', error)
      }
    },
    [],
  )

  // 메모 검색
  const searchMemos = useCallback((query: string): void => {
    setSearchQuery(query)
  }, [])

  // 카테고리 필터링
  const filterByCategory = useCallback((category: string): void => {
    setSelectedCategory(category)
  }, [])

  // 특정 메모 가져오기
  const getMemoById = useCallback(
    (id: string): Memo | undefined => {
      return memos.find(memo => memo.id === id)
    },
    [memos],
  )

  // 필터링된 메모 목록
  const filteredMemos = useMemo(() => {
    let filtered = memos

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(memo => memo.category === selectedCategory)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        memo =>
          memo.title.toLowerCase().includes(query) ||
          memo.content.toLowerCase().includes(query) ||
          memo.tags.some(tag => tag.toLowerCase().includes(query)),
      )
    }

    return filtered
  }, [memos, selectedCategory, searchQuery])

  // 모든 메모 삭제
  const clearAllMemos = useCallback(async (): Promise<void> => {
    try {
      const { error } = await supabase
        .from('memos')
        .delete()
        .not('id', 'is', null)

      if (error) throw error
      setMemos([])
      setSearchQuery('')
      setSelectedCategory('all')
    } catch (error) {
      console.error('Failed to clear memos:', error)
    }
  }, [])

  // 통계 정보
  const stats = useMemo(() => {
    const totalMemos = memos.length
    const categoryCounts = memos.reduce(
      (acc, memo) => {
        acc[memo.category] = (acc[memo.category] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return {
      total: totalMemos,
      byCategory: categoryCounts,
      filtered: filteredMemos.length,
    }
  }, [memos, filteredMemos])

  return {
    // 상태
    memos: filteredMemos,
    allMemos: memos,
    loading,
    searchQuery,
    selectedCategory,
    stats,

    // 메모 CRUD
    createMemo,
    updateMemo,
    deleteMemo,
    getMemoById,
    updateMemoSummary,

    // 필터링 & 검색
    searchMemos,
    filterByCategory,

    // 유틸리티
    clearAllMemos,
  }
}
