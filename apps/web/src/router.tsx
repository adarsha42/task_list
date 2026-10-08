import { createRootRoute, createRoute, createRouter, Link } from '@tanstack/react-router'
import App from './App'
import TasksPage from './TasksPage'
import SettingsPage from './SettingsPage'

const rootRoute = createRootRoute({
  component: App,
  notFoundComponent: () => <p>Page not found. <Link to="/">Go to tasks</Link></p>,
})
const tasksRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: TasksPage })
const settingsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/settings', component: SettingsPage })

export const router = createRouter({ routeTree: rootRoute.addChildren([tasksRoute, settingsRoute]) })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
