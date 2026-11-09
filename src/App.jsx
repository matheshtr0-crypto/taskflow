import { useEffect, useMemo, useState } from 'react'
import {
  LayoutDashboard,
  CheckSquare,
  Clock3,
  Plus,
  Search,
  LogOut,
  Trash2,
  Pencil,
  Check,
  X,
  ListTodo,
  CalendarDays,
  CircleUserRound,
  LoaderCircle,
  AlertCircle,
} from 'lucide-react'

import { supabase } from './lib/supabase'

const emptyTask = {
  title: '',
  description: '',
  priority: 'medium',
  due_date: '',
}

export default function App() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const [tasks, setTasks] = useState([])
  const [tasksLoading, setTasksLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [form, setForm] = useState(emptyTask)
  const [saving, setSaving] = useState(false)

  // Restore the existing login session.
  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return

      if (error) setError(error.message)

      setUser(data.session?.user ?? null)
      setAuthLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setError('')
      setMessage('')
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // Load only the signed-in user's tasks.
  useEffect(() => {
    if (!user) {
      setTasks([])
      return
    }

    loadTasks()
  }, [user])

  async function loadTasks() {
    setTasksLoading(true)
    setError('')

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setTasks(data ?? [])
    }

    setTasksLoading(false)
  }

  async function handleAuth(event) {
    event.preventDefault()
    setError('')
    setMessage('')

    if (password.length < 8) {
      setError('Password must contain at least 8 characters.')
      return
    }

    setSaving(true)

    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: window.location.origin,
        },
      })

      if (error) {
        setError(error.message)
      } else if (!data.session) {
        setMessage('Account created. Check your email to confirm your account, then sign in.')
        setMode('login')
      } else {
        setMessage('Account created successfully.')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) setError(error.message)
    }

    setSaving(false)
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut()

    if (error) setError(error.message)
    else {
      setTasks([])
      setMessage('You have signed out.')
    }
  }

  function openNewTask() {
    setEditingTask(null)
    setForm(emptyTask)
    setShowForm(true)
    setError('')
  }

  function openEditTask(task) {
    setEditingTask(task)

    setForm({
      title: task.title,
      description: task.description ?? '',
      priority: task.priority,
      due_date: task.due_date ?? '',
    })

    setShowForm(true)
    setError('')
  }

  async function handleTaskSubmit(event) {
    event.preventDefault()
    setError('')
    setSaving(true)

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      priority: form.priority,
      due_date: form.due_date || null,
    }

    let result

    if (editingTask) {
      result = await supabase
        .from('tasks')
        .update(payload)
        .eq('id', editingTask.id)
    } else {
      result = await supabase
        .from('tasks')
        .insert({
          ...payload,
          user_id: user.id,
          status: 'pending',
        })
    }

    if (result.error) {
      setError(result.error.message)
    } else {
      setShowForm(false)
      setEditingTask(null)
      setForm(emptyTask)
      await loadTasks()
    }

    setSaving(false)
  }

  async function toggleTask(task) {
    setError('')

    const newStatus =
      task.status === 'completed' ? 'pending' : 'completed'

    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', task.id)

    if (error) {
      setError(error.message)
    } else {
      await loadTasks()
    }
  }

  async function deleteTask(task) {
    const confirmed = window.confirm(
      `Delete "${task.title}"?`
    )

    if (!confirmed) return

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', task.id)

    if (error) {
      setError(error.message)
    } else {
      await loadTasks()
    }
  }

  const completed = tasks.filter(
    task => task.status === 'completed'
  ).length

  const pending = tasks.filter(
    task => task.status === 'pending'
  ).length

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch =
        task.title.toLowerCase().includes(search.toLowerCase()) ||
        (task.description ?? '').toLowerCase().includes(search.toLowerCase())

      const matchesFilter =
        filter === 'all' || task.status === filter

      return matchesSearch && matchesFilter
    })
  }, [tasks, search, filter])

  if (authLoading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <LoaderCircle className="animate-spin" size={32} />
      </div>
    )
  }

  // Login and signup screen
  if (!user) {
    return (
      <main className="min-h-screen grid md:grid-cols-2 bg-white">
        <section className="hidden md:flex flex-col justify-between bg-violet-700 p-12 text-white">
          <h1 className="text-3xl font-bold tracking-tight">
            TASKFLOW
          </h1>

          <div>
            <h2 className="text-5xl font-bold leading-tight">
              Make every day productive.
            </h2>
            <p className="mt-5 text-violet-100 text-lg">
              Organize your work, manage your priorities
              and achieve your goals.
            </p>
          </div>

          <p className="text-sm text-violet-200">
            Your personal productivity workspace.
          </p>
        </section>

        <section className="flex items-center justify-center p-6">
          <form
            onSubmit={handleAuth}
            className="w-full max-w-md space-y-5"
          >
            <div>
              <h2 className="text-3xl font-bold">
                {mode === 'login' ? 'Welcome back' : 'Create account'}
              </h2>

              <p className="mt-2 text-slate-500">
                {mode === 'login'
                  ? 'Sign in to manage your tasks.'
                  : 'Start organizing your day.'}
              </p>
            </div>

            {mode === 'signup' && (
              <div>
                <label className="text-sm font-medium">
                  Full name
                </label>
                <input
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="mt-2 w-full rounded-xl border p-3 outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="Your name"
                />
              </div>
            )}

            <div>
              <label className="text-sm font-medium">
                Email address
              </label>
              <input
                required
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="mt-2 w-full rounded-xl border p-3 outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="text-sm font-medium">
                Password
              </label>
              <input
                required
                minLength={8}
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="mt-2 w-full rounded-xl border p-3 outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="At least 8 characters"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}

            {message && (
              <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
                {message}
              </p>
            )}

            <button
              disabled={saving}
              className="w-full rounded-xl bg-violet-700 p-3 font-semibold text-white hover:bg-violet-800 disabled:opacity-60"
            >
              {saving
                ? 'Please wait...'
                : mode === 'login'
                  ? 'Sign in'
                  : 'Create account'}
            </button>

            <p className="text-center text-sm text-slate-500">
              {mode === 'login'
                ? "Don't have an account?"
                : 'Already have an account?'}
              {' '}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'login' ? 'signup' : 'login')
                  setError('')
                  setMessage('')
                }}
                className="font-semibold text-violet-700"
              >
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </form>
        </section>
      </main>
    )
  }

  // Main dashboard
  return (
    <div className="min-h-screen bg-slate-50 md:flex">
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-white p-6 md:flex">
        <h1 className="text-2xl font-extrabold text-violet-700">
          TASKFLOW
        </h1>

        <p className="mt-2 text-xs text-slate-400">
          PERSONAL WORKSPACE
        </p>

        <nav className="mt-10 space-y-2">
          <div className="flex items-center gap-3 rounded-xl bg-violet-50 p-3 font-semibold text-violet-700">
            <LayoutDashboard size={19} />
            Dashboard
          </div>

          <div className="flex items-center gap-3 rounded-xl p-3 text-slate-500">
            <CheckSquare size={19} />
            My Tasks
          </div>

          <div className="flex items-center gap-3 rounded-xl p-3 text-slate-500">
            <Clock3 size={19} />
            Pending
          </div>
        </nav>

        <div className="mt-auto border-t pt-5">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <CircleUserRound size={20} />
            <span className="truncate">{user.email}</span>
          </div>

          <button
            onClick={handleLogout}
            className="mt-4 flex w-full items-center gap-2 rounded-lg p-2 text-sm text-red-600 hover:bg-red-50"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-5 md:p-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">
              Personal workspace
            </p>
            <h2 className="mt-1 text-3xl font-bold">
              My Dashboard
            </h2>
          </div>

          <button
            onClick={openNewTask}
            className="flex items-center gap-2 rounded-xl bg-violet-700 px-4 py-3 font-semibold text-white hover:bg-violet-800"
          >
            <Plus size={19} />
            New Task
          </button>
        </header>

        {error && (
          <div className="mt-6 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {message && (
          <p className="mt-5 rounded-xl bg-green-50 p-3 text-sm text-green-700">
            {message}
          </p>
        )}

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <StatCard
            title="Total tasks"
            value={tasks.length}
            icon={<ListTodo />}
          />
          <StatCard
            title="Pending"
            value={pending}
            icon={<Clock3 />}
          />
          <StatCard
            title="Completed"
            value={completed}
            icon={<CheckSquare />}
          />
        </section>

        <section className="mt-9 rounded-2xl border bg-white p-5 md:p-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold">
                Your tasks
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Manage your personal work.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {['all', 'pending', 'completed'].map(item => (
                <button
                  key={item}
                  onClick={() => setFilter(item)}
                  className={`rounded-lg px-3 py-2 text-sm capitalize ${
                    filter === item
                      ? 'bg-violet-700 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="relative mt-6">
            <Search
              className="absolute left-3 top-3 text-slate-400"
              size={19}
            />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search tasks..."
              className="w-full rounded-xl border bg-slate-50 py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {tasksLoading ? (
            <div className="grid place-items-center py-16">
              <LoaderCircle className="animate-spin text-violet-700" />
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="py-16 text-center">
              <CalendarDays
                size={38}
                className="mx-auto text-slate-300"
              />
              <h4 className="mt-4 font-semibold">
                No tasks found
              </h4>
              <p className="mt-2 text-sm text-slate-500">
                Create your first task to get started.
              </p>
              <button
                onClick={openNewTask}
                className="mt-4 font-semibold text-violet-700"
              >
                + Add a task
              </button>
            </div>
          ) : (
            <div className="mt-5 divide-y">
              {filteredTasks.map(task => (
                <article
                  key={task.id}
                  className="flex flex-wrap items-center justify-between gap-4 py-5"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <button
                      onClick={() => toggleTask(task)}
                      title="Change task status"
                      className={`mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full border ${
                        task.status === 'completed'
                          ? 'border-green-600 bg-green-600 text-white'
                          : 'border-slate-300'
                      }`}
                    >
                      {task.status === 'completed' && (
                        <Check size={15} />
                      )}
                    </button>

                    <div className="min-w-0">
                      <h4 className={`break-words font-semibold ${
                        task.status === 'completed'
                          ? 'text-slate-400 line-through'
                          : 'text-slate-800'
                      }`}>
                        {task.title}
                      </h4>

                      {task.description && (
                        <p className="mt-1 break-words text-sm text-slate-500">
                          {task.description}
                        </p>
                      )}

                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        <span className={`rounded-full px-2 py-1 ${
                          task.priority === 'high'
                            ? 'bg-red-50 text-red-700'
                            : task.priority === 'medium'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-green-50 text-green-700'
                        }`}>
                          {task.priority} priority
                        </span>

                        {task.due_date && (
                          <span className="text-slate-400">
                            Due: {task.due_date}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditTask(task)}
                      title="Edit task"
                      className="rounded-lg p-2 text-slate-500 hover:bg-violet-50 hover:text-violet-700"
                    >
                      <Pencil size={18} />
                    </button>

                    <button
                      onClick={() => deleteTask(task)}
                      title="Delete task"
                      className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <div className="mt-6 text-center text-xs text-slate-400 md:hidden">
          {user.email}
          <button
            onClick={handleLogout}
            className="ml-3 text-red-600"
          >
            Logout
          </button>
        </div>
      </main>

      {showForm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4">
          <form
            onSubmit={handleTaskSubmit}
            className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">
                {editingTask ? 'Edit task' : 'Create new task'}
              </h3>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <X />
              </button>
            </div>

            <div>
              <label className="text-sm font-medium">
                Task title
              </label>
              <input
                required
                maxLength={120}
                value={form.title}
                onChange={e => setForm({
                  ...form,
                  title: e.target.value,
                })}
                className="mt-2 w-full rounded-xl border p-3 outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="e.g. Learn React"
              />
            </div>

            <div>
              <label className="text-sm font-medium">
                Description
              </label>
              <textarea
                maxLength={1000}
                rows={3}
                value={form.description}
                onChange={e => setForm({
                  ...form,
                  description: e.target.value,
                })}
                className="mt-2 w-full rounded-xl border p-3 outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="Add task details..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">
                  Priority
                </label>
                <select
                  value={form.priority}
                  onChange={e => setForm({
                    ...form,
                    priority: e.target.value,
                  })}
                  className="mt-2 w-full rounded-xl border p-3"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">
                  Due date
                </label>
                <input
                  type="date"
                  value={form.due_date}
                  onChange={e => setForm({
                    ...form,
                    due_date: e.target.value,
                  })}
                  className="mt-2 w-full rounded-xl border p-3"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl border px-4 py-3"
              >
                Cancel
              </button>

              <button
                disabled={saving}
                className="rounded-xl bg-violet-700 px-5 py-3 font-semibold text-white disabled:opacity-60"
              >
                {saving
                  ? 'Saving...'
                  : editingTask
                    ? 'Update task'
                    : 'Save task'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

function StatCard({ title, value, icon }) {
  return (
    <div className="rounded-2xl border bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{title}</p>
        <span className="text-violet-700">{icon}</span>
      </div>

      <p className="mt-4 text-3xl font-bold">{value}</p>
    </div>
  )
}