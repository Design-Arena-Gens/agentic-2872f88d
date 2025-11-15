"use client"

import { useEffect, useMemo, useState } from 'react'
import { ClientsManager } from '@/components/ClientsManager'
import { WorkflowList } from '@/components/WorkflowList'

export type Client = {
  id: string
  name: string
  baseUrl: string
  apiKey: string
}

export default function Page() {
  const [clients, setClients] = useState<Client[]>([])
  const [activeClientId, setActiveClientId] = useState<string | null>(null)

  // Load clients from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('flients')
      if (raw) {
        const parsed = JSON.parse(raw) as Client[]
        setClients(parsed)
        if (parsed.length > 0) setActiveClientId(parsed[0].id)
      }
    } catch (e) {
      // ignore
    }
  }, [])

  const activeClient = useMemo(
    () => clients.find((c) => c.id === activeClientId) ?? null,
    [clients, activeClientId]
  )

  const onClientsChange = (next: Client[]) => {
    setClients(next)
    localStorage.setItem('flients', JSON.stringify(next))
    if (next.length && !next.some((c) => c.id === activeClientId)) {
      setActiveClientId(next[0].id)
    }
  }

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">n8n Workflows Dashboard</h1>
      </header>

      <ClientsManager
        clients={clients}
        activeClientId={activeClientId}
        onActiveChange={setActiveClientId}
        onClientsChange={onClientsChange}
      />

      {activeClient ? (
        <WorkflowList client={activeClient} />)
        : (
        <div className="rounded-lg border bg-white p-8 text-center text-gray-500">
          Add a client to begin managing n8n workflows.
        </div>
      )}
    </div>
  )
}
