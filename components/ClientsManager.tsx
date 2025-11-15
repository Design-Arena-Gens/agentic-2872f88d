"use client"

import { useMemo, useState } from 'react'
import type { Client } from '@/app/page'

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

export function ClientsManager({
  clients,
  activeClientId,
  onActiveChange,
  onClientsChange,
}: {
  clients: Client[]
  activeClientId: string | null
  onActiveChange: (id: string) => void
  onClientsChange: (clients: Client[]) => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: '',
    baseUrl: '',
    apiKey: '',
  })

  const activeIdx = useMemo(
    () => (activeClientId ? clients.findIndex((c) => c.id === activeClientId) : -1),
    [clients, activeClientId]
  )

  const addClient = () => {
    const trimmed = {
      name: form.name.trim(),
      baseUrl: form.baseUrl.trim().replace(/\/$/, ''),
      apiKey: form.apiKey.trim(),
    }
    if (!trimmed.name || !trimmed.baseUrl || !trimmed.apiKey) return
    const next = [
      ...clients,
      { id: uid(), ...trimmed },
    ]
    onClientsChange(next)
    setForm({ name: '', baseUrl: '', apiKey: '' })
    setShowForm(false)
  }

  const removeClient = (id: string) => {
    const next = clients.filter((c) => c.id !== id)
    onClientsChange(next)
  }

  const moveActive = (delta: number) => {
    if (clients.length === 0 || activeIdx < 0) return
    const nextIdx = (activeIdx + delta + clients.length) % clients.length
    onActiveChange(clients[nextIdx].id)
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {clients.map((c) => (
          <button
            key={c.id}
            className={`px-3 py-1.5 rounded-md border text-sm ${
              c.id === activeClientId
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => onActiveChange(c.id)}
            title={c.baseUrl}
          >
            {c.name}
          </button>
        ))}
        <button
          className="px-3 py-1.5 rounded-md border bg-white text-sm hover:bg-gray-50"
          onClick={() => setShowForm(true)}
        >
          + Add client
        </button>
        {clients.length > 0 && (
          <div className="ml-auto flex items-center gap-2">
            <button
              className="px-2 py-1 rounded border bg-white text-sm"
              onClick={() => moveActive(-1)}
              title="Previous client"
            >
              ?
            </button>
            <button
              className="px-2 py-1 rounded border bg-white text-sm"
              onClick={() => moveActive(1)}
              title="Next client"
            >
              ?
            </button>
          </div>
        )}
      </div>

      {showForm && (
        <div className="rounded-lg border bg-white p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                className="w-full rounded-md border px-3 py-2"
                placeholder="Acme Inc"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">n8n Base URL</label>
              <input
                className="w-full rounded-md border px-3 py-2"
                placeholder="https://n8n.example.com"
                value={form.baseUrl}
                onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">API Key</label>
              <input
                className="w-full rounded-md border px-3 py-2"
                placeholder="X-N8N-API-KEY"
                value={form.apiKey}
                onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button className="px-4 py-2 rounded-md bg-gray-900 text-white" onClick={addClient}>Save</button>
            <button className="px-4 py-2 rounded-md border bg-white" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
          {clients.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium mb-2">Existing clients</h3>
              <ul className="space-y-2">
                {clients.map((c) => (
                  <li key={c.id} className="flex items-center justify-between rounded border p-2">
                    <div>
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-gray-600">{c.baseUrl}</div>
                    </div>
                    <button className="text-red-600 text-sm" onClick={() => removeClient(c.id)}>Remove</button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
