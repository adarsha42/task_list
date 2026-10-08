import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, Outlet } from '@tanstack/react-router'
import { api } from './api'
import { userQuery } from './query-client'
import './App.css'

export default function App() {
  const client = useQueryClient()
  const user = useQuery(userQuery)
  const [identifier, setIdentifier] = useState('')
  const login = useMutation({
    mutationFn: api.login,
    onSuccess: (data) => {
      client.removeQueries({ queryKey: ['tasks'] })
      client.removeQueries({ queryKey: ['notification-settings'] })
      client.setQueryData(userQuery.queryKey, data)
      setIdentifier('')
    },
  })
  const logout = useMutation({
    mutationFn: api.logout,
    onSuccess: () => {
      client.removeQueries({ queryKey: ['tasks'] })
      client.removeQueries({ queryKey: ['notification-settings'] })
      client.setQueryData(userQuery.queryKey, null)
      login.reset()
    },
  })

  return (
    <div className="app">
      <header className="app-header">
        <h1>Task list</h1>
        {user.data && (
          <div className="actions">
            <span>{user.data.username}</span>
            <button type="button" onClick={() => logout.mutate()} disabled={logout.isPending}>
              {logout.isPending ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        )}
      </header>
      {logout.error && <p className="error" role="alert">{logout.error.message}</p>}
      {user.isPending ? <p role="status">Loading…</p> : user.isError ? (
        <div>
          <p className="error" role="alert">{user.error.message}</p>
          <button type="button" onClick={() => void user.refetch()}>Try again</button>
        </div>
      ) : user.data ? (
        <>
          <nav aria-label="Main navigation">
            <Link to="/" activeOptions={{ exact: true }} activeProps={{ 'aria-current': 'page' }}>Tasks</Link>
            <Link to="/settings" activeProps={{ 'aria-current': 'page' }}>Notification settings</Link>
          </nav>
          <main><Outlet /></main>
        </>
      ) : (
        <main className="login">
          <h2>Sign in</h2>
          <p>Enter a username or email. A new account is created if needed.</p>
          <form onSubmit={(event) => {
            event.preventDefault()
            login.mutate(identifier.trim())
          }}>
            <label htmlFor="identifier">Username or email</label>
            <input id="identifier" autoComplete="username" required value={identifier}
              onChange={(event) => setIdentifier(event.target.value)} />
            {login.error && <p className="error" role="alert">{login.error.message}</p>}
            <button disabled={login.isPending || !identifier.trim()}>
              {login.isPending ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </main>
      )}
    </div>
  )
}
