"use client"

import useSWR from 'swr'
import { useCallback, useMemo, useState } from 'react'
import type { Client } from '@/app/page'
import { ExecutionList } from './executions/ExecutionList'

async function api<T>(endpoint: string, payload: any): Promise<T> {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || 'Request failed')
  }
  return res.json()
}

export function WorkflowList({ client }: { client: Client }) {
  const [search, setSearch] = useState('')
  const { data, isLoading, error, mutate } = useSWR(
    ['workflows', client.baseUrl, client.apiKey],
    ([, baseUrl, apiKey]) => api<{ workflows: any[] }>('/api/n8n/proxy', {
      baseUrl,
      apiKey,
      method: 'GET',
      path: '/rest/workflows',
      query: {},
    }),
    { refreshInterval: 20_000 }
  )

  const workflows = useMemo(() => {
    const list = data?.workflows ?? []
    if (!search.trim()) return list
    const q = search.toLowerCase()
    return list.filter((w: any) =>
      String(w.name || '').toLowerCase().includes(q) || String(w.id).includes(q)
    )
  }, [data, search])

  const setActive = useCallback(async (workflowId: number, active: boolean) => {
    await api('/api/n8n/proxy', {
      baseUrl: client.baseUrl,
      apiKey: client.apiKey,
      method: 'PATCH',
      path: `/rest/workflows/${workflowId}`,
      body: { active },
    })
    await mutate()
  }, [client.baseUrl, client.apiKey, mutate])

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <input
          className="w-full md:w-80 rounded-md border px-3 py-2"
          placeholder={`Search ${data?.workflows?.length ?? 0} workflows...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="px-3 py-2 rounded-md border bg-white" onClick={() => mutate()}>Refresh</button>
      </div>

      <div className="rounded-lg border bg-white">
        <div className="grid grid-cols-12 gap-2 border-b px-4 py-2 text-xs font-medium text-gray-500">
          <div className="col-span-5">Workflow</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-3">Updated</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>
        {isLoading && (
          <div className="p-4 text-sm text-gray-500">Loading workflows?</div>
        )}
        {error && (
          <div className="p-4 text-sm text-red-600">{String(error.message || error)}</div>
        )}
        <ul className="divide-y">
          {workflows.map((w: any) => (
            <li key={w.id} className="grid grid-cols-12 items-center gap-2 px-4 py-3">
              <div className="col-span-5">
                <div className="font-medium">{w.name || `Workflow #${w.id}`}</div>
                <div className="text-xs text-gray-500">ID: {w.id}</div>
              </div>
              <div className="col-span-2">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${w.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                  {w.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="col-span-3 text-sm text-gray-600">
                {w.updatedAt ? new Date(w.updatedAt).toLocaleString() : '?'}
              </div>
              <div className="col-span-2 flex justify-end gap-2">
                {w.active ? (
                  <button className="px-3 py-1.5 rounded-md border bg-white text-sm" onClick={() => setActive(w.id, false)}>Deactivate</button>
                ) : (
                  <button className="px-3 py-1.5 rounded-md border bg-white text-sm" onClick={() => setActive(w.id, true)}>Activate</button>
                )}
              </div>
              <div className="col-span-12 mt-3">
                <ExecutionList client={client} workflowId={w.id} />
              </div>
            </li>
          ))}
          {!isLoading && !error && workflows.length === 0 && (
            <li className="p-4 text-sm text-gray-500">No workflows found.</li>
          )}
        </ul>
      </div>
    </section>
  )
}
