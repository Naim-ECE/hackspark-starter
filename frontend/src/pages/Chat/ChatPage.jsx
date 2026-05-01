import React, { useEffect, useMemo, useRef, useState } from 'react'
import api from '../../api'

function formatTime(value) {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

function makeSessionName() {
  return `Chat ${Math.random().toString(36).slice(2, 8)}`
}

function Bubble({ message }) {
  const isUser = message.role === 'user'
  const timeLabel = message.timestamp ? formatTime(message.timestamp) : ''
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] rounded-[1.35rem] border px-4 py-3 text-sm shadow-lg ${isUser ? 'border-cyan-300/20 bg-cyan-400 text-slate-950 shadow-cyan-500/10' : 'border-white/10 bg-slate-900 text-slate-100 shadow-black/20'}`}>
        <div className="whitespace-pre-wrap leading-6">{message.content}</div>
        {timeLabel && (
          <div className={`mt-2 text-[11px] ${isUser ? 'text-slate-800/80' : 'text-slate-400'}`}>
            {timeLabel}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ChatPage() {
  const [sessions, setSessions] = useState([])
  const [selectedSessionId, setSelectedSessionId] = useState('')
  const [messages, setMessages] = useState([])
  const [message, setMessage] = useState('')
  const [loadingSessions, setLoadingSessions] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const [chatError, setChatError] = useState(null)
  const [typing, setTyping] = useState(false)
  const bottomRef = useRef(null)

  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => new Date(b.lastMessageAt || b.createdAt || 0) - new Date(a.lastMessageAt || a.createdAt || 0))
  }, [sessions])

  const loadHistory = async (sessionId) => {
    if (!sessionId) return
    setLoadingHistory(true)
    setChatError(null)
    try {
      const response = await api.get(`/chat/${sessionId}/history`)
      setMessages(response.data?.messages || [])
    } catch (err) {
      setChatError(err?.response?.data?.message || 'Unable to load chat history.')
      setMessages([])
    } finally {
      setLoadingHistory(false)
    }
  }

  const loadSessions = async () => {
    setLoadingSessions(true)
    setError(null)
    try {
      const response = await api.get('/chat/sessions')
      const sessionList = response.data?.sessions || []
      setSessions(sessionList)
      if (sessionList.length) {
        const mostRecent = [...sessionList].sort((a, b) => new Date(b.lastMessageAt || b.createdAt || 0) - new Date(a.lastMessageAt || a.createdAt || 0))[0]
        setSelectedSessionId(mostRecent.sessionId)
        await loadHistory(mostRecent.sessionId)
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load chat sessions.')
    } finally {
      setLoadingSessions(false)
    }
  }

  useEffect(() => {
    loadSessions()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  const handleSelectSession = async (sessionId) => {
    setSelectedSessionId(sessionId)
    await loadHistory(sessionId)
  }

  const handleNewChat = () => {
    const sessionId = crypto.randomUUID()
    setSessions((current) => [
      { sessionId, name: makeSessionName(), createdAt: new Date().toISOString(), lastMessageAt: new Date().toISOString() },
      ...current,
    ])
    setSelectedSessionId(sessionId)
    setMessages([])
    setChatError(null)
  }

  const handleSend = async (event) => {
    event.preventDefault()
    if (!message.trim() || !selectedSessionId || sending) return

    const outgoingMessage = message.trim()
    setSending(true)
    setTyping(true)
    setChatError(null)
    setMessages((current) => [...current, { role: 'user', content: outgoingMessage, timestamp: new Date().toISOString() }])
    setMessage('')

    try {
      const response = await api.post('/chat', { sessionId: selectedSessionId, message: outgoingMessage })
      const reply = response.data?.reply || response.data?.message || 'No reply was returned.'
      setMessages((current) => [...current, { role: 'assistant', content: reply, timestamp: new Date().toISOString() }])
      await loadSessions()
    } catch (err) {
      setChatError(err?.response?.data?.message || 'Unable to send message.')
    } finally {
      setTyping(false)
      setSending(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-white">Chat</h1>
          <button className="rounded-xl bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-950" onClick={handleNewChat}>
            New Chat
          </button>
        </div>
        {error && <div className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>}
        <div className="mt-4 space-y-2">
          {loadingSessions && <div className="text-sm text-slate-300">Loading sessions...</div>}
          {!loadingSessions && sortedSessions.length === 0 && <div className="text-sm text-slate-400">No sessions yet.</div>}
          {sortedSessions.map((session) => (
            <button
              key={session.sessionId}
              onClick={() => handleSelectSession(session.sessionId)}
              className={`w-full rounded-2xl border px-4 py-3 text-left transition ${selectedSessionId === session.sessionId ? 'border-cyan-400 bg-cyan-400/10' : 'border-white/10 bg-slate-900 hover:border-white/20'}`}
            >
              <div className="font-semibold text-white">{session.name || session.sessionId}</div>
              <div className="mt-1 text-xs text-slate-400">{formatTime(session.lastMessageAt || session.createdAt)}</div>
            </button>
          ))}
        </div>
      </aside>

      <section className="flex min-h-[70vh] flex-col rounded-3xl border border-white/10 bg-white/5 backdrop-blur">
        <div className="border-b border-white/10 px-5 py-4">
          <h2 className="text-lg font-semibold text-white">Conversation</h2>
          <p className="text-sm text-slate-400">Most recent session is selected automatically.</p>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {loadingHistory && <div className="text-sm text-slate-300">Loading history...</div>}
          {chatError && <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{chatError}</div>}
          {!loadingHistory && messages.length === 0 && !chatError && (
            <div className="rounded-2xl border border-dashed border-white/15 p-6 text-sm text-slate-400">Start a conversation by typing a message below.</div>
          )}
          {messages.map((item, index) => (
            <Bubble key={`${item.timestamp || index}-${index}`} message={item} />
          ))}
          {typing && (
            <div className="flex justify-start">
              <div className="inline-flex items-center gap-1 rounded-2xl bg-white/10 px-4 py-3 text-white">
                <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-300 [animation-delay:-0.3s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-300 [animation-delay:-0.15s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-300" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <form onSubmit={handleSend} className="border-t border-white/10 p-4">
          <div className="flex gap-3">
            <input
              className="flex-1 rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none placeholder:text-slate-500 disabled:opacity-60"
              placeholder={selectedSessionId ? 'Type a message...' : 'Click New Chat to begin'}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              disabled={sending || !selectedSessionId}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  handleSend(event)
                }
              }}
            />
            <button className="rounded-2xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50" disabled={sending || !selectedSessionId}>
              Send
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
