import type { Task } from './api'

interface Props {
  task: Task
  disabled: boolean
  completing: boolean
  deleting: boolean
  onComplete: (id: number) => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
}

export default function TaskItem({ task, disabled, completing, deleting, onComplete, onEdit, onDelete }: Props) {
  const completed = task.status === 'completed'

  return (
    <li>
      <article>
        <div className="task-heading">
          <h3>{task.header}</h3>
          <span className="status">{completed ? 'Completed' : 'Pending'}</span>
        </div>

        <p className="description">{task.description}</p>

        <dl>
          <dt>Assignee</dt>
          <dd>{task.assignee_email}</dd>
          <dt>Deadline</dt>
          <dd>
            <time dateTime={task.deadline}>
              {new Date(task.deadline).toLocaleString()}
            </time>
          </dd>
        </dl>

        <div className="actions">
          {!completed && (
            <button type="button" disabled={disabled} onClick={() => onComplete(task.id)}>
              {completing ? 'Completing…' : 'Complete'}
            </button>
          )}
          <button type="button" disabled={disabled} onClick={() => onEdit(task)}>
            Edit
          </button>
          <button type="button" disabled={disabled} onClick={() => onDelete(task)}>
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </article>
    </li>
  )
}
