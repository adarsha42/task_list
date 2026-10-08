import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './api'
import type { NotificationSettings } from './api'
import { settingsQuery } from './query-client'

function SettingsForm({ settings }: { settings: NotificationSettings }) {
  const client = useQueryClient()
  const [hours, setHours] = useState(String(settings.notify_hours_before))
  const update = useMutation({
    mutationFn: api.updateSettings,
    onSuccess: (data) => client.setQueryData(settingsQuery.queryKey, data),
  })

  return (
    <form onSubmit={(event) => {
      event.preventDefault()
      update.mutate({ notify_hours_before: Number(hours) })
    }}>
      <label>Notify this many hours before a deadline
        <input required type="number" min={0} step={1} value={hours} disabled={update.isPending}
          onChange={(event) => { setHours(event.target.value); update.reset() }} />
      </label>
      <p>This setting applies to all users. The scheduler checks tasks periodically.</p>
      {update.error && <p className="error" role="alert">{update.error.message}</p>}
      {update.isSuccess && <p role="status">Notification timing saved.</p>}
      <button disabled={update.isPending}>{update.isPending ? 'Saving…' : 'Save settings'}</button>
    </form>
  )
}

export default function SettingsPage() {
  const settings = useQuery(settingsQuery)

  return (
    <section>
      <h2>Deadline notifications</h2>
      {settings.isPending ? <p role="status">Loading settings…</p> : settings.isError ? (
        <div>
          <p className="error" role="alert">{settings.error.message}</p>
          <button type="button" onClick={() => void settings.refetch()}>Try again</button>
        </div>
      ) : <SettingsForm settings={settings.data} />}
    </section>
  )
}
