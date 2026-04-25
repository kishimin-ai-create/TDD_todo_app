import { Hono } from 'hono'

// ─── Types ────────────────────────────────────────────────────────────────────

type AppRecord = {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

type TodoRecord = {
  id: string
  appId: string
  title: string
  completed: boolean
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

// ─── In-memory stores ─────────────────────────────────────────────────────────

const appsStore = new Map<string, AppRecord>()
const todosStore = new Map<string, TodoRecord>()

export const clearStorage = () => {
  appsStore.clear()
  todosStore.clear()
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const now = () => new Date().toISOString()

const successRes = (data: unknown) => ({ data, success: true })
const errorRes = (code: string, message: string) => ({
  data: null,
  success: false,
  error: { code, message },
})

const toAppDto = (a: AppRecord) => ({
  id: a.id,
  name: a.name,
  createdAt: a.createdAt,
  updatedAt: a.updatedAt,
})

const toTodoDto = (t: TodoRecord) => ({
  id: t.id,
  appId: t.appId,
  title: t.title,
  completed: t.completed,
  createdAt: t.createdAt,
  updatedAt: t.updatedAt,
})

const validateName = (name: unknown): string | null => {
  if (typeof name !== 'string') return 'name is required'
  const trimmed = name.trim()
  if (trimmed.length === 0) return 'name must not be empty'
  if (trimmed.length > 100) return 'name must be at most 100 characters'
  return null
}

const validateTitle = (title: unknown): string | null => {
  if (typeof title !== 'string') return 'title is required'
  const trimmed = title.trim()
  if (trimmed.length === 0) return 'title must not be empty'
  if (trimmed.length > 200) return 'title must be at most 200 characters'
  return null
}

const findApp = (id: string) => {
  const a = appsStore.get(id)
  return a && a.deletedAt === null ? a : null
}

const findTodo = (appId: string, id: string) => {
  const t = todosStore.get(id)
  return t && t.deletedAt === null && t.appId === appId ? t : null
}

const isNameTaken = (name: string, excludeId?: string) =>
  [...appsStore.values()].some(
    a => a.deletedAt === null && a.name === name && a.id !== excludeId,
  )

// ─── App ──────────────────────────────────────────────────────────────────────

const app = new Hono()

app.get('/', (c) => c.text('Hello Hono!'))

// POST /api/v1/apps
app.post('/api/v1/apps', async (c) => {
  let body: Record<string, unknown>
  try { body = await c.req.json() } catch { body = {} }

  const nameErr = validateName(body.name)
  if (nameErr) return c.json(errorRes('VALIDATION_ERROR', nameErr), 422)

  const name = (body.name as string).trim()
  if (isNameTaken(name)) return c.json(errorRes('CONFLICT', 'App name already exists'), 409)

  const ts = now()
  const record: AppRecord = {
    id: crypto.randomUUID(),
    name,
    createdAt: ts,
    updatedAt: ts,
    deletedAt: null,
  }
  appsStore.set(record.id, record)
  return c.json(successRes(toAppDto(record)), 201)
})

// GET /api/v1/apps
app.get('/api/v1/apps', (c) => {
  const list = [...appsStore.values()]
    .filter(a => a.deletedAt === null)
    .map(toAppDto)
  return c.json(successRes(list))
})

// GET /api/v1/apps/:appId
app.get('/api/v1/apps/:appId', (c) => {
  const a = findApp(c.req.param('appId'))
  if (!a) return c.json(errorRes('NOT_FOUND', 'App not found'), 404)
  return c.json(successRes(toAppDto(a)))
})

// PUT /api/v1/apps/:appId
app.put('/api/v1/apps/:appId', async (c) => {
  const a = findApp(c.req.param('appId'))
  if (!a) return c.json(errorRes('NOT_FOUND', 'App not found'), 404)

  let body: Record<string, unknown>
  try { body = await c.req.json() } catch { body = {} }

  if (body.name !== undefined) {
    const nameErr = validateName(body.name)
    if (nameErr) return c.json(errorRes('VALIDATION_ERROR', nameErr), 422)
    const name = (body.name as string).trim()
    if (isNameTaken(name, a.id)) return c.json(errorRes('CONFLICT', 'App name already exists'), 409)
    a.name = name
  }
  a.updatedAt = now()
  return c.json(successRes(toAppDto(a)))
})

// DELETE /api/v1/apps/:appId
app.delete('/api/v1/apps/:appId', (c) => {
  const a = findApp(c.req.param('appId'))
  if (!a) return c.json(errorRes('NOT_FOUND', 'App not found'), 404)

  const ts = now()
  a.deletedAt = ts
  // cascade soft-delete todos
  for (const t of todosStore.values()) {
    if (t.appId === a.id && t.deletedAt === null) t.deletedAt = ts
  }
  return c.json(successRes(toAppDto(a)))
})

// ─── Todo ─────────────────────────────────────────────────────────────────────

// POST /api/v1/apps/:appId/todos
app.post('/api/v1/apps/:appId/todos', async (c) => {
  const a = findApp(c.req.param('appId'))
  if (!a) return c.json(errorRes('NOT_FOUND', 'App not found'), 404)

  let body: Record<string, unknown>
  try { body = await c.req.json() } catch { body = {} }

  const titleErr = validateTitle(body.title)
  if (titleErr) return c.json(errorRes('VALIDATION_ERROR', titleErr), 422)

  const ts = now()
  const record: TodoRecord = {
    id: crypto.randomUUID(),
    appId: a.id,
    title: (body.title as string).trim(),
    completed: false,
    createdAt: ts,
    updatedAt: ts,
    deletedAt: null,
  }
  todosStore.set(record.id, record)
  return c.json(successRes(toTodoDto(record)), 201)
})

// GET /api/v1/apps/:appId/todos
app.get('/api/v1/apps/:appId/todos', (c) => {
  const a = findApp(c.req.param('appId'))
  if (!a) return c.json(errorRes('NOT_FOUND', 'App not found'), 404)

  const list = [...todosStore.values()]
    .filter(t => t.appId === a.id && t.deletedAt === null)
    .map(toTodoDto)
  return c.json(successRes(list))
})

// GET /api/v1/apps/:appId/todos/:todoId
app.get('/api/v1/apps/:appId/todos/:todoId', (c) => {
  const a = findApp(c.req.param('appId'))
  if (!a) return c.json(errorRes('NOT_FOUND', 'App not found'), 404)

  const t = findTodo(a.id, c.req.param('todoId'))
  if (!t) return c.json(errorRes('NOT_FOUND', 'Todo not found'), 404)
  return c.json(successRes(toTodoDto(t)))
})

// PUT /api/v1/apps/:appId/todos/:todoId
app.put('/api/v1/apps/:appId/todos/:todoId', async (c) => {
  const a = findApp(c.req.param('appId'))
  if (!a) return c.json(errorRes('NOT_FOUND', 'App not found'), 404)

  const t = findTodo(a.id, c.req.param('todoId'))
  if (!t) return c.json(errorRes('NOT_FOUND', 'Todo not found'), 404)

  let body: Record<string, unknown>
  try { body = await c.req.json() } catch { body = {} }

  if (body.title !== undefined) {
    const titleErr = validateTitle(body.title)
    if (titleErr) return c.json(errorRes('VALIDATION_ERROR', titleErr), 422)
    t.title = (body.title as string).trim()
  }
  if (body.completed !== undefined) {
    if (typeof body.completed !== 'boolean') {
      return c.json(errorRes('VALIDATION_ERROR', 'completed must be a boolean'), 422)
    }
    t.completed = body.completed
  }
  t.updatedAt = now()
  return c.json(successRes(toTodoDto(t)))
})

// DELETE /api/v1/apps/:appId/todos/:todoId
app.delete('/api/v1/apps/:appId/todos/:todoId', (c) => {
  const a = findApp(c.req.param('appId'))
  if (!a) return c.json(errorRes('NOT_FOUND', 'App not found'), 404)

  const t = findTodo(a.id, c.req.param('todoId'))
  if (!t) return c.json(errorRes('NOT_FOUND', 'Todo not found'), 404)

  t.deletedAt = now()
  return c.json(successRes(toTodoDto(t)))
})

export default app
