'use client'

import { useState, useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'

interface Todo {
  id: string
  text: string
  completed: boolean
}

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem('todos')
    if (saved) {
      try {
        setTodos(JSON.parse(saved))
      } catch {}
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos))
  }, [todos])

  const addTodo = () => {
    if (!input.trim()) return
    setTodos(prev => [
      ...prev,
      { id: crypto.randomUUID(), text: input.trim(), completed: false },
    ])
    setInput('')
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
    setTodos(prev =>
      prev.map(t => (t.id === id ? { ...t, completed: !t.completed } : t))
    )
  }

  const deleteTodo = (id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id))
  }

  const remaining = todos.filter(t => !t.completed).length
  const allDone = todos.length > 0 && remaining === 0

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-violet-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-pink-400 mb-1">✿ My To-Do ✿</h1>
          <p className="text-violet-300 text-sm">今日もがんばろう！</p>
        </div>

        <div className="bg-white rounded-3xl shadow-lg shadow-pink-100 p-6">

          <div className="flex gap-2 mb-6">
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

          {todos.length === 0 ? (
            <p className="text-center text-pink-200 py-8 text-sm">
              タスクを追加してみましょう ♪
            </p>
          ) : (
            <ul className="space-y-2">
              {todos.map(todo => (
                <li
                  key={todo.id}
                  className="flex items-center gap-3 bg-pink-50 rounded-2xl px-4 py-3 group"
                >
                  <button
                    onClick={() => toggleTodo(todo.id)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition cursor-pointer ${
                      todo.completed
                        ? 'bg-gradient-to-r from-pink-400 to-violet-400 border-transparent'
                        : 'border-pink-300 hover:border-pink-400'
                    }`}
                  >
                    {todo.completed && (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>

                  <span
                    className={`flex-1 text-sm ${
                      todo.completed ? 'line-through text-pink-300' : 'text-gray-600'
                    }`}
                  >
                    {todo.text}
                  </span>

                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="text-pink-200 hover:text-pink-400 transition opacity-0 group-hover:opacity-100 cursor-pointer"
                    aria-label="削除"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {todos.length > 0 && (
            <div className="mt-4 text-center">
              {allDone ? (
                <p className="text-violet-400 text-sm font-bold">
                  🎉 全部完了！お疲れ様でした！
                </p>
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
