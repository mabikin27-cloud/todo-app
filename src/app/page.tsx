'use client'

import { useState, useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'

type Priority = 'A' | 'B' | 'C' | 'D'

interface Todo {
  id: string
  text: string
  completed: boolean
  priority?: Priority
  scheduledDate?: string
  deadline?: string
}

const PRIORITY_CONFIG: Record<Priority, { label: string; tag: string }> = {
  A: { label: '緊急＆重要', tag: 'bg-red-100 text-red-500 border border-red-200' },
  B: { label: '重要',       tag: 'bg-blue-100 text-blue-500 border border-blue-200' },
  C: { label: '緊急',       tag: 'bg-amber-100 text-amber-500 border border-amber-200' },
  D: { label: 'その他',     tag: 'bg-gray-100 text-gray-400 border border-gray-200' },
}

const PRIORITY_ORDER: Priority[] = ['A', 'B', 'C', 'D']

function getLocalDateString(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getDaysRemaining(deadline: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dl = new Date(deadline + 'T00:00:00')
  dl.setHours(0, 0, 0, 0)
  return Math.round((dl.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function formatDateLabel(dateStr: string): string {
  const today = getLocalDateString()
  const tomorrow = getLocalDateString(new Date(Date.now() + 86400000))
  if (dateStr === today) return '今日'
  if (dateStr === tomorrow) return '明日'
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [input, setInput] = useState('')
  const [priority, setPriority] = useState<Priority | ''>('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [deadline, setDeadline] = useState('')
  const [sortByPriority, setSortByPriority] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem('todos')
    if (saved) {
      try { setTodos(JSON.parse(saved)) } catch {}
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos))
  }, [todos])

  const addTodo = () => {
    if (!input.trim()) return
    setTodos(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        text: input.trim(),
        completed: false,
        priority: priority || undefined,
        scheduledDate: scheduledDate || undefined,
        deadline: deadline || undefined,
      },
    ])
    setInput('')
    setPriority('')
    setScheduledDate('')
    setDeadline('')
    inputRef.current?.focus()
  }

  const toggleTodo = (id: string) => {
    const todo = todos.find(t => t.id === id)
    if (todo && !todo.completed) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#f9a8d4', '#c4b5fd', '#fbcfe8', '#ddd6fe', '#fde68a'],
      })
    }
    setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t))
  }

  const deleteTodo = (id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id))
  }

  const updateTodo = (id: string, updates: Partial<Pick<Todo, 'priority' | 'scheduledDate' | 'deadline'>>) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
  }

  const today = getLocalDateString()

  const groupedTodos = (() => {
    let sorted = [...todos]
    if (sortByPriority) {
      sorted.sort((a, b) => {
        const ai = a.priority ? PRIORITY_ORDER.indexOf(a.priority) : 4
        const bi = b.priority ? PRIORITY_ORDER.indexOf(b.priority) : 4
        return ai - bi
      })
    }
    const groups = new Map<string, Todo[]>()
    for (const todo of sorted) {
      const date = todo.scheduledDate || today
      if (!groups.has(date)) groups.set(date, [])
      groups.get(date)!.push(todo)
    }
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))
  })()

  const remaining = todos.filter(t => !t.completed).length
  const allDone = todos.length > 0 && remaining === 0

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-violet-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-pink-400 mb-1">✿ My To-Do ✿</h1>
          <p className="text-violet-300 text-sm">今日もがんばろう！</p>
        </div>

        <div className="bg-white rounded-3xl shadow-lg shadow-pink-100 p-6">

          {/* 入力エリア */}
          <div className="mb-5 space-y-3">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTodo()}
                placeholder="タスクを入力..."
                className="flex-1 bg-pink-50 border border-pink-200 rounded-full px-4 py-2.5 text-gray-600 placeholder-pink-200 outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100 transition text-sm"
              />
              <button
                onClick={addTodo}
                className="bg-gradient-to-r from-pink-400 to-violet-400 text-white rounded-full px-5 py-2.5 font-bold text-sm hover:opacity-90 transition active:scale-95 cursor-pointer"
              >
                追加
              </button>
            </div>

            {/* 優先度・日付 */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-gray-400">優先度</span>
                {PRIORITY_ORDER.map(p => (
                  <button
                    key={p}
                    onClick={() => setPriority(prev => prev === p ? '' : p)}
                    className={`w-7 h-7 rounded-full font-bold border transition cursor-pointer ${
                      priority === p
                        ? PRIORITY_CONFIG[p].tag
                        : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <label className="flex items-center gap-1 text-gray-400">
                  <span>予定日</span>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={e => setScheduledDate(e.target.value)}
                    className="border border-pink-200 rounded-lg px-2 py-1 text-gray-500 outline-none focus:border-pink-300 text-xs cursor-pointer"
                  />
                </label>
                <label className="flex items-center gap-1 text-gray-400">
                  <span>期限</span>
                  <input
                    type="date"
                    value={deadline}
                    onChange={e => setDeadline(e.target.value)}
                    className="border border-pink-200 rounded-lg px-2 py-1 text-gray-500 outline-none focus:border-pink-300 text-xs cursor-pointer"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* 並び替えボタン */}
          {todos.length > 0 && (
            <div className="mb-3 flex justify-end">
              <button
                onClick={() => setSortByPriority(p => !p)}
                className={`text-xs px-3 py-1 rounded-full border transition cursor-pointer ${
                  sortByPriority
                    ? 'bg-violet-100 text-violet-500 border-violet-200'
                    : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {sortByPriority ? '▲ 優先度順' : '優先度順に並び替え'}
              </button>
            </div>
          )}

          {/* タスク一覧 */}
          {todos.length === 0 ? (
            <p className="text-center text-pink-200 py-8 text-sm">
              タスクを追加してみましょう ♪
            </p>
          ) : (
            <div className="space-y-4">
              {groupedTodos.map(([date, dateTodos]) => (
                <div key={date}>
                  <p className="text-xs font-bold text-violet-300 mb-1.5 px-1">
                    {formatDateLabel(date)}
                  </p>
                  <ul className="space-y-2">
                    {dateTodos.map(todo => {
                      const daysLeft = todo.deadline ? getDaysRemaining(todo.deadline) : null
                      const isOverdue = daysLeft !== null && daysLeft < 0
                      const isEditing = editingId === todo.id
                      return (
                        <li
                          key={todo.id}
                          className={`rounded-2xl px-4 py-3 group transition ${
                            isOverdue ? 'bg-red-50 border border-red-200' : 'bg-pink-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => toggleTodo(todo.id)}
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition cursor-pointer ${
                                todo.completed
                                  ? 'bg-gradient-to-r from-pink-400 to-violet-400 border-transparent'
                                  : 'border-pink-300 hover:border-pink-400'
                              }`}
                            >
                              {todo.completed && (
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>

                            {todo.priority && (
                              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${PRIORITY_CONFIG[todo.priority].tag}`}>
                                {todo.priority}
                              </span>
                            )}

                            <span className={`flex-1 text-sm ${
                              todo.completed
                                ? 'line-through text-pink-300'
                                : isOverdue
                                ? 'text-red-500'
                                : 'text-gray-600'
                            }`}>
                              {todo.text}
                            </span>

                            {daysLeft !== null && (
                              <span className={`text-xs flex-shrink-0 font-medium ${
                                daysLeft < 0
                                  ? 'text-red-400'
                                  : daysLeft === 0
                                  ? 'text-amber-400'
                                  : 'text-violet-300'
                              }`}>
                                {daysLeft < 0
                                  ? `${Math.abs(daysLeft)}日超過`
                                  : daysLeft === 0
                                  ? '今日まで'
                                  : `あと${daysLeft}日`}
                              </span>
                            )}

                            <button
                              onClick={() => setEditingId(isEditing ? null : todo.id)}
                              className={`transition cursor-pointer ${
                                isEditing
                                  ? 'text-violet-400'
                                  : 'text-pink-200 hover:text-violet-400 opacity-0 group-hover:opacity-100'
                              }`}
                              aria-label="編集"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>

                            <button
                              onClick={() => deleteTodo(todo.id)}
                              className="text-pink-200 hover:text-pink-400 transition opacity-0 group-hover:opacity-100 cursor-pointer"
                              aria-label="削除"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>

                          {isEditing && (
                            <div className="mt-2 pt-2 border-t border-pink-100 flex flex-wrap items-center gap-3 text-xs">
                              <div className="flex items-center gap-1.5">
                                <span className="text-gray-400">優先度</span>
                                {PRIORITY_ORDER.map(p => (
                                  <button
                                    key={p}
                                    onClick={() => updateTodo(todo.id, { priority: todo.priority === p ? undefined : p })}
                                    className={`w-7 h-7 rounded-full font-bold border transition cursor-pointer ${
                                      todo.priority === p
                                        ? PRIORITY_CONFIG[p].tag
                                        : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'
                                    }`}
                                  >
                                    {p}
                                  </button>
                                ))}
                              </div>
                              <div className="flex items-center gap-2">
                                <label className="flex items-center gap-1 text-gray-400">
                                  <span>予定日</span>
                                  <input
                                    type="date"
                                    value={todo.scheduledDate || ''}
                                    onChange={e => updateTodo(todo.id, { scheduledDate: e.target.value || undefined })}
                                    className="border border-pink-200 rounded-lg px-2 py-1 text-gray-500 outline-none focus:border-pink-300 text-xs cursor-pointer"
                                  />
                                </label>
                                <label className="flex items-center gap-1 text-gray-400">
                                  <span>期限</span>
                                  <input
                                    type="date"
                                    value={todo.deadline || ''}
                                    onChange={e => updateTodo(todo.id, { deadline: e.target.value || undefined })}
                                    className="border border-pink-200 rounded-lg px-2 py-1 text-gray-500 outline-none focus:border-pink-300 text-xs cursor-pointer"
                                  />
                                </label>
                              </div>
                              <button
                                onClick={() => setEditingId(null)}
                                className="ml-auto text-xs px-3 py-1 rounded-full bg-violet-100 text-violet-500 border border-violet-200 cursor-pointer hover:opacity-80 transition"
                              >
                                完了
                              </button>
                            </div>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {todos.length > 0 && (
            <div className="mt-4 text-center">
              {allDone ? (
                <p className="text-violet-400 text-sm font-bold">🎉 全部完了！お疲れ様でした！</p>
              ) : (
                <p className="text-pink-300 text-sm">残り {remaining} 件</p>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
