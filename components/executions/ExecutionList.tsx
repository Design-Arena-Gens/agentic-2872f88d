"use client"

import useSWR from 'swr'
import type { Client } from '@/app/page'

async function api<T>(endpoint: string, payload: any): Promise<T> {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export function ExecutionList({ client, workflowId }: { client: Client, workflowId: number }) {
  const { data, isLoading, error } = useSWR(
    ['executions', client.baseUrl, client.apiKey, workflowId],
    ([, baseUrl, apiKey, id]) => api<{ executions: any[] }>('/api/n8n/proxy', {
      baseUrl,
      apiKey,
      method: 'GET',
      path: '/rest/executions',
      query: { workflowId: String(id), limit: '5' },
    }),
    { refreshInterval: 25_000 }
  )

  if (isLoading) return <div className="text-xs text-gray-500">Loading executions?</div>
  if (error) return <div className="text-xs text-red-600">Executions error: {String(error.message || error)}</div>
  const executions = data?.executions ?? []

  return (
    <div className="rounded-md border bg-gray-50">
      <div className="grid grid-cols-12 gap-2 border-b px-3 py-2 text-[11px] font-medium text-gray-600">
        <div className="col-span-3">Started</div>
        <div className="col-span-3">Stopped</div>
        <div className="col-span-2">Mode</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-2 text-right">ID</div>
      </div>
      <ul className="divide-y text-xs">
        {executions.map((e: any) => (
          <li key={e.id} className="grid grid-cols-12 gap-2 px-3 py-2">
            <div className="col-span-3">{e.startedAt ? new Date(e.startedAt).toLocaleString() : '?'}</div>
            <div className="col-span-3">{e.stoppedAt ? new Date(e.stoppedAt).toLocaleString() : '?'}</div>
            <div className="col-span-2">{e.mode}</div>
            <div className="col-span-2">
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${e.status === 'success' ? 'bg-green-100 text-green-800' : e.status === 'running' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>
                {e.status || (e.finished ? 'success' : 'error')}
              </span>
            </div>
            <div className="col-span-2 text-right">{e.id}</div>
          </li>
        ))}
        {executions.length === 0 && (
          <li className="px-3 py-2 text-gray-500">No recent executions.</li>
        )}
      </ul>
    </div>
  )
}
