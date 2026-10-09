import { useState } from 'react'
import type { Task, TaskInput } from './api'

function localDateTime(value: string) {
  const date = new Date(value)
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 16)
}

interface Props {
  task?: Task
  pending: boolean
  error: Error | null
  onSubmit: (input: TaskInput) => void
  onCancel?: () => void
}

export default function TaskForm({ task, pending, error, onSubmit, onCancel }: Props) {
  const [header, setHeader] = useState(task?.header ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [email, setEmail] = useState(task?.assignee_email ?? '')
  const [deadline, setDeadline] = useState(task ? localDateTime(task.deadline) : '')

  return (
    <form onSubmit={(event) => {
      event.preventDefault()
      onSubmit({
        header: header.trim(),
        description: description.trim(),
        assignee_email: email.trim(),
        deadline: new Date(deadline).toISOString(),
        deadline_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      })
    }}>
      <fieldset disabled={pending}>
        <label>Header
          <input required maxLength={200} value={header} onChange={(event) => setHeader(event.target.value)} />
        </label>
        <label>Description
          <textarea required rows={3} value={description} onChange={(event) => setDescription(event.target.value)} />
        </label>
        <label>Assignee email
          <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label>Deadline (your local time)
          <input required type="datetime-local" value={deadline} onChange={(event) => setDeadline(event.target.value)} />
        </label>
        {error && <p className="error" role="alert">{error.message}</p>}
        <div className="actions">
          <button disabled={!header.trim() || !description.trim()}>
            {pending ? 'Saving…' : task ? 'Save changes' : 'Create task'}
          </button>
          {onCancel && <button type="button" onClick={onCancel}>Cancel</button>}
        </div>
      </fieldset>
    </form>
  )
}
