import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './api'
import type { Task, TaskInput } from './api'
import { tasksQuery } from './query-client'
import TaskForm from './TaskForm'
import TaskItem from './TaskItem'

export default function TasksPage() {
  const client = useQueryClient()
  const tasks = useQuery(tasksQuery)
  const [editing, setEditing] = useState<Task | null>(null)
  const [formResetCount, setFormResetCount] = useState(0)
  const [notice, setNotice] = useState('')

  function refreshTasks() {
    return client.invalidateQueries({ queryKey: tasksQuery.queryKey })
  }

  async function saveTask(input: TaskInput) {
    if (editing) {
      await api.updateTask(editing.id, input)
      return 'Task updated.'
    }

    await api.createTask(input)
    return 'Task created.'
  }

  async function afterSave(message: string) {
    setNotice(message)
    setEditing(null)
    setFormResetCount((count) => count + 1)
    await refreshTasks()
  }

  async function afterComplete(task: Task) {
    if (editing?.id === task.id) setEditing(null)
    setNotice('Task completed. Email notification queued.')
    await refreshTasks()
  }

  async function deleteTask(id: number) {
    await api.deleteTask(id)
    return id
  }

  async function afterDelete(id: number) {
    if (editing?.id === id) setEditing(null)
    setNotice('Task deleted.')
    await refreshTasks()
  }

  const save = useMutation({ mutationFn: saveTask, onSuccess: afterSave })
  const complete = useMutation({ mutationFn: api.completeTask, onSuccess: afterComplete })
  const remove = useMutation({ mutationFn: deleteTask, onSuccess: afterDelete })

  const busy = save.isPending || complete.isPending || remove.isPending
  const actionError = complete.error ?? remove.error

  // Changing the key clears the form or loads the task selected for editing.
  const formKey = editing?.id ?? `new-${formResetCount}`

  function handleEdit(task: Task) {
    save.reset()
    setEditing(task)
    window.scrollTo({ top: 0 })
  }

  function handleCancel() {
    setEditing(null)
    save.reset()
  }

  function handleComplete(id: number) {
    setNotice('')
    remove.reset()
    complete.mutate(id)
  }

  function handleDelete(task: Task) {
    if (!window.confirm(`Delete "${task.header}"?`)) return
    setNotice('')
    complete.reset()
    remove.mutate(task.id)
  }

  function renderTaskList() {
    if (tasks.isPending) return <p role="status">Loading tasks…</p>

    if (tasks.isError) {
      return (
        <div>
          <p className="error" role="alert">{tasks.error.message}</p>
          <button type="button" onClick={() => tasks.refetch()}>Try again</button>
        </div>
      )
    }

    if (tasks.data.length === 0) return <p>No tasks yet.</p>

    return (
      <ul className="task-list">
        {tasks.data.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            disabled={busy}
            completing={complete.isPending && complete.variables === task.id}
            deleting={remove.isPending && remove.variables === task.id}
            onComplete={handleComplete}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </ul>
    )
  }

  return (
    <>
      <section aria-labelledby="task-form-heading">
        <h2 id="task-form-heading">{editing ? 'Edit task' : 'New task'}</h2>
        <TaskForm
          key={formKey}
          task={editing ?? undefined}
          pending={save.isPending}
          error={save.error}
          onSubmit={save.mutate}
          onCancel={editing ? handleCancel : undefined}
        />
      </section>

      <section aria-labelledby="tasks-heading">
        <h2 id="tasks-heading">Your tasks</h2>
        {notice && <p role="status">{notice}</p>}
        {actionError && <p className="error" role="alert">{actionError.message}</p>}
        {renderTaskList()}
      </section>
    </>
  )
}
