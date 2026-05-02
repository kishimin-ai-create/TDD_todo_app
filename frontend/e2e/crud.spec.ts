import { expect, test, type Page, type Route } from '@playwright/test';

type AppRecord = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

type TodoRecord = {
  id: string;
  appId: string;
  title: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
};

const now = '2026-05-02T00:00:00.000Z';

async function registerApiStub(page: Page) {
  const apps: AppRecord[] = [];
  const todosByAppId = new Map<string, TodoRecord[]>();
  let appSequence = 1;
  let todoSequence = 1;

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const segments = url.pathname.split('/').filter(Boolean);
    const method = request.method();

    if (segments[0] !== 'api' || segments[1] !== 'v1' || segments[2] !== 'apps') {
      await route.continue();
      return;
    }

    const appId = segments[3];
    const resource = segments[4];
    const todoId = segments[5];

    if (!appId && method === 'GET') {
      await fulfillJson(route, 200, { success: true, data: apps });
      return;
    }

    if (!appId && method === 'POST') {
      const body = await request.postDataJSON() as { name: string };
      const app = {
        id: `app-${appSequence}`,
        name: body.name,
        createdAt: now,
        updatedAt: now,
      };
      appSequence += 1;
      apps.push(app);
      todosByAppId.set(app.id, []);
      await fulfillJson(route, 201, { success: true, data: app });
      return;
    }

    const app = apps.find((candidate) => candidate.id === appId);
    if (!app) {
      await fulfillJson(route, 404, { success: false, error: { message: 'App not found' } });
      return;
    }

    if (!resource && method === 'GET') {
      await fulfillJson(route, 200, { success: true, data: app });
      return;
    }

    if (!resource && method === 'PUT') {
      const body = await request.postDataJSON() as { name: string };
      app.name = body.name;
      app.updatedAt = now;
      await fulfillJson(route, 200, { success: true, data: app });
      return;
    }

    if (!resource && method === 'DELETE') {
      apps.splice(apps.indexOf(app), 1);
      todosByAppId.delete(app.id);
      await fulfillJson(route, 200, { success: true, data: app });
      return;
    }

    if (resource !== 'todos') {
      await route.continue();
      return;
    }

    const todos = todosByAppId.get(app.id) ?? [];

    if (!todoId && method === 'GET') {
      await fulfillJson(route, 200, { success: true, data: todos });
      return;
    }

    if (!todoId && method === 'POST') {
      const body = await request.postDataJSON() as { title: string };
      const todo = {
        id: `todo-${todoSequence}`,
        appId: app.id,
        title: body.title,
        completed: false,
        createdAt: now,
        updatedAt: now,
      };
      todoSequence += 1;
      todos.push(todo);
      await fulfillJson(route, 201, { success: true, data: todo });
      return;
    }

    const todo = todos.find((candidate) => candidate.id === todoId);
    if (!todo) {
      await fulfillJson(route, 404, { success: false, error: { message: 'Todo not found' } });
      return;
    }

    if (method === 'PUT') {
      const body = await request.postDataJSON() as { title?: string; completed?: boolean };
      todo.title = body.title ?? todo.title;
      todo.completed = body.completed ?? todo.completed;
      todo.updatedAt = now;
      await fulfillJson(route, 200, { success: true, data: todo });
      return;
    }

    if (method === 'DELETE') {
      todos.splice(todos.indexOf(todo), 1);
      await fulfillJson(route, 200, { success: true, data: todo });
      return;
    }

    await fulfillJson(route, 405, { success: false, error: { message: 'Method not allowed' } });
  });
}

async function fulfillJson(route: Route, status: number, body: unknown) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

test('app and todo CRUD happy path @smoke', async ({ page }) => {
  await registerApiStub(page);

  await page.goto('/');

  await expect(page.getByText('No apps yet. Create your first app!')).toBeVisible();

  await page.getByRole('button', { name: '+ Create App' }).click();
  await page.getByLabel('App Name').fill('Personal Tasks');
  await page.getByRole('button', { name: 'Create' }).click();

  await expect(page.getByRole('heading', { name: 'Todo App TDD' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Personal Tasks' })).toBeVisible();

  await page.getByRole('button', { name: 'View' }).click();
  await expect(page.getByRole('heading', { name: 'Personal Tasks' })).toBeVisible();
  await expect(page.getByText('No todos yet. Create your first todo!')).toBeVisible();

  await page.getByRole('button', { name: 'Edit' }).click();
  await page.getByLabel('App Name').fill('Work Tasks');
  await page.getByRole('button', { name: 'Update' }).click();

  await expect(page.getByRole('heading', { name: 'Work Tasks' })).toBeVisible();

  await page.getByRole('button', { name: '+ Create Todo' }).click();
  await page.getByLabel('Title').fill('Write CRUD E2E test');
  await page.getByRole('button', { name: 'Save' }).click();

  const todoItem = page.locator('div.p-3.border.rounded.bg-white').filter({ hasText: 'Write CRUD E2E test' });
  await expect(todoItem).toBeVisible();

  await todoItem.getByRole('checkbox').click();
  await expect(todoItem.getByRole('checkbox')).toBeChecked();

  await todoItem.getByRole('button', { name: 'Edit' }).click();
  await page.getByLabel('Title').fill('Review CRUD E2E test');
  await page.getByRole('button', { name: 'Save' }).click();

  const updatedTodoItem = page.locator('div.p-3.border.rounded.bg-white').filter({ hasText: 'Review CRUD E2E test' });
  await expect(updatedTodoItem).toBeVisible();

  await updatedTodoItem.getByRole('button', { name: 'Delete' }).click();
  await updatedTodoItem.getByRole('button', { name: 'Confirm' }).click();
  await expect(page.getByText('Review CRUD E2E test')).toBeHidden();
  await expect(page.getByText('No todos yet. Create your first todo!')).toBeVisible();

  await page.getByRole('button', { name: 'Delete' }).click();
  await page.getByRole('button', { name: 'Confirm' }).click();

  await expect(page.getByText('No apps yet. Create your first app!')).toBeVisible();
});
