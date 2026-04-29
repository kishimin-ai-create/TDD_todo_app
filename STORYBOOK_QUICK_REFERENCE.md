# Storybook Stories - Quick Reference Guide

## 📋 Story Files Created (11 Total)

### **App List Feature** (3 files)
```
src/features/app-list/
├── pages/
│   └── AppListPage.stories.tsx         (8 stories)
└── components/
    ├── AppList.stories.tsx              (5 stories)
    └── AppCard.stories.tsx              (7 stories)
```

### **App Create Feature** (2 files)
```
src/features/app-create/
├── pages/
│   └── AppCreatePage.stories.tsx        (6 stories)
└── components/
    └── AppForm.stories.tsx              (11 stories)
```

### **App Detail Feature** (5 files)
```
src/features/app-detail/
├── pages/
│   └── AppDetailPage.stories.tsx        (11 stories)
└── components/
    ├── AppHeader.stories.tsx            (7 stories)
    ├── TodoList.stories.tsx             (10 stories)
    ├── TodoItem.stories.tsx             (9 stories)
    └── TodoForm.stories.tsx             (10 stories)
```

### **App Edit Feature** (1 file)
```
src/features/app-edit/
└── pages/
    └── AppEditPage.stories.tsx          (11 stories)
```

---

## 🎯 Quick Commands

### **Start Storybook**
```bash
cd frontend
npm run storybook
```
Opens: `http://localhost:6006`

### **Build Storybook**
```bash
cd frontend
npm run build-storybook
```
Output: `storybook-static/`

### **View Story File**
```bash
# Example: View AppCard stories
cat frontend/src/features/app-list/components/AppCard.stories.tsx
```

---

## 📊 Story Variant Quick Index

### **AppListPage** (8 variants)
| Story | Purpose |
|-------|---------|
| `Default` | 2 apps, loaded |
| `LoadingState` | API still loading |
| `ServerError` | 500 error response |
| `EmptyState` | No apps exist |
| `MultipleApps` | 5+ apps list |
| `LongAppNames` | Apps with long names |
| `RecentlyCreated` | Apps created today |
| `OldApps` | Apps created months ago |

### **AppCreatePage** (6 variants)
| Story | Purpose |
|-------|---------|
| `Default` | Empty form ready |
| `LoadingState` | Form submitting |
| `ValidationError` | Form invalid |
| `ConflictError` | 409 - duplicate name |
| `MinLength` | 1 character name |
| `MaxLength` | 100 character name |

### **AppDetailPage** (11 variants)
| Story | Purpose |
|-------|---------|
| `Default` | App + 2 todos loaded |
| `LoadingState` | App data loading |
| `NotFound` | 404 app not found |
| `EmptyTodos` | App with no todos |
| `DeleteConfirm` | Delete dialog shown |
| `DeleteSuccess` | Post-delete success |
| `CompletedTodo` | All todos completed |
| `LongTitles` | Todos with long text |
| `EditMode` | Todo in edit form |
| `ManyTodos` | 10+ todos |
| `MixedStatuses` | Mix of completed/pending |

### **AppEditPage** (11 variants)
| Story | Purpose |
|-------|---------|
| `Default` | Form pre-filled |
| `LoadingState` | Form submitting |
| `UpdateSuccess` | After update |
| `ValidationError` | Form invalid |
| `ConflictError` | 409 - duplicate |
| `MinLength` | 1 character |
| `MaxLength` | 100 characters |
| `LongName` | 100+ char name |
| `SpecialChars` | Name with symbols |
| `EmptyName` | Cleared input |
| `ServerError` | 500 error |

### **AppForm** (11 variants)
| Story | Purpose |
|-------|---------|
| `Default` | Empty form |
| `LoadingState` | Submitting |
| `PreFilledForm` | Edit mode |
| `ValidationError` | Invalid input |
| `ServerError` | 409/422 error |
| `MinLength` | 1 char minimum |
| `MaxLength` | 100 chars exact |
| `OverMaxLength` | 101+ chars |
| `WithDefaultValue` | Pre-filled |
| `SubmitDisabled` | Loading state |
| `FocusedInput` | Keyboard nav |

### **AppList** (5 variants)
| Story | Purpose |
|-------|---------|
| `Default` | 2 apps rendered |
| `EmptyState` | No apps message |
| `SingleApp` | 1 app only |
| `MultipleApps` | 5 apps |
| `LongNames` | Apps with long names |

### **AppCard** (7 variants)
| Story | Purpose |
|-------|---------|
| `Default` | Single app card |
| `WithCallback` | Callback mock |
| `LongName` | Long app name |
| `RecentlyCreated` | Today's date |
| `OldApp` | 2 year old app |
| `WithCallbackAndLongName` | Both features |
| `MinimalName` | 1 character |

### **AppHeader** (7 variants)
| Story | Purpose |
|-------|---------|
| `Default` | All buttons |
| `WithoutBack` | No back button |
| `WithCallbacks` | Edit/Delete mocked |
| `LongAppName` | Long name display |
| `RecentApp` | Today's creation |
| `OldApp` | Old creation date |
| `ButtonStates` | Hover/focus states |

### **TodoList** (10 variants)
| Story | Purpose |
|-------|---------|
| `Default` | 2 todos |
| `EmptyState` | No todos message |
| `SingleTodo` | 1 todo |
| `MultipleTodos` | 5+ todos |
| `CompletedTodos` | All checked |
| `PendingTodos` | All unchecked |
| `MixedStatuses` | Some completed |
| `LongTitles` | Long todo text |
| `MinimalTitles` | 1 char each |
| `LoadingDelete` | Delete in progress |

### **TodoItem** (9 variants)
| Story | Purpose |
|-------|---------|
| `Default` | Pending todo |
| `CompletedTodo` | Checked checkbox |
| `LongTitle` | Long todo text |
| `MinimalTitle` | 1 char |
| `InEditMode` | Edit form shown |
| `DeleteConfirm` | Delete dialog |
| `LoadingDelete` | Delete pending |
| `SuccessMessage` | Post-delete |
| `CheckboxInteraction` | Toggle state |

### **TodoForm** (10 variants)
| Story | Purpose |
|-------|---------|
| `CreateMode` | New todo |
| `EditMode` | Editing todo |
| `EditModeCompleted` | Edit completed |
| `ValidationError` | Invalid title |
| `LoadingState` | Submitting |
| `MinLength` | 1 char |
| `MaxLength` | 200 chars |
| `OverMaxLength` | 201+ chars |
| `PreFilledForm` | Edit pre-filled |
| `CancelButton` | Cancel action |

---

## 🔍 How to Find a Specific Story

### By Feature
- **App Management**: `app-list/`, `app-create/`, `app-detail/`, `app-edit/`
- **List Pages**: `pages/` subdirectories
- **UI Components**: `components/` subdirectories

### By Component Type
- **Pages** (need providers): `*/pages/*.stories.tsx`
- **Forms**: `AppForm.tsx`, `TodoForm.tsx`
- **Lists**: `AppList.tsx`, `TodoList.tsx`
- **Cards**: `AppCard.tsx`, `TodoItem.tsx`
- **Headers**: `AppHeader.tsx`

### By Story Variant Type
- **Default**: Every component has a `Default` story
- **Loading**: Search for `LoadingState` variant
- **Error**: Search for `Error` in story name (409, 422, 500)
- **Empty**: Search for `EmptyState` variant
- **Interaction**: Look for stories with callbacks

---

## 🛠️ Story Structure Template

Every story file follows this structure:

```typescript
import type { Meta, StoryObj } from '@storybook/react'
import { http, HttpResponse } from 'msw'
import { ComponentName } from './ComponentName'

type Story = StoryObj<typeof ComponentName>

// Mock data
const mockData = { /* ... */ }

// Meta configuration
const meta: Meta<typeof ComponentName> = {
  title: 'Features/ComponentName', // or Pages/PageName
  component: ComponentName,
  tags: ['autodocs'],
  
  // For page components:
  decorators: [
    (Story) => {
      const queryClient = new QueryClient()
      const store = createStore()
      return (
        <QueryClientProvider client={queryClient}>
          <JotaiProvider store={store}>
            <Story />
          </JotaiProvider>
        </QueryClientProvider>
      )
    },
  ],
  
  // For components with props:
  argTypes: {
    propName: {
      description: 'Description of prop',
    },
  },
}

export default meta

// Story variants
export const Default: Story = {
  args: { /* props */ },
}

export const OtherVariant: Story = {
  args: { /* props */ },
  parameters: {
    msw: {
      handlers: [ /* MSW handlers */ ],
    },
  },
}
```

---

## 📖 Using Stories for Documentation

### **For Developers**
1. Use as reference when building components
2. Copy story patterns for new components
3. Reference mock data format

### **For Designers**
1. Review all variants for consistency
2. Check responsive breakpoints
3. Verify color/typography usage

### **For QA**
1. Use stories for manual testing
2. Verify error handling
3. Test form validations

### **For Product**
1. Preview features before deployment
2. Share with stakeholders
3. Document UI behavior

---

## 🚀 Performance & Build

### Build Stats
- **Total Stories**: 95+
- **Total LOC**: 1,683
- **Build Time**: 1.32s
- **Build Size**: ~1,030 KB (iframe bundle)
- **Gzipped**: ~291 KB

### Optimization
- ✅ Code-split by feature
- ✅ Dynamic imports available
- ✅ MSW mocking (no real API calls)
- ✅ Tree-shaken dependencies

---

## 📝 Adding New Stories

### Steps
1. Create `ComponentName.stories.tsx` next to component
2. Import component and required types
3. Define mock data
4. Create Meta with title and component
5. Add story variants with args/parameters
6. For API components, add MSW handlers

### Example
```typescript
// NewComponent.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import { NewComponent } from './NewComponent'

type Story = StoryObj<typeof NewComponent>

const meta: Meta<typeof NewComponent> = {
  title: 'Features/NewComponent',
  component: NewComponent,
  tags: ['autodocs'],
}

export default meta

export const Default: Story = {
  args: { /* props */ },
}
```

---

## ✅ Validation Checklist

Before considering a story complete:
- [ ] Component renders without errors
- [ ] All props are TypeScript typed
- [ ] Mock data is realistic
- [ ] MSW handlers work (if API component)
- [ ] Story title follows convention
- [ ] Auto-documentation is enabled
- [ ] At least 5+ variants created
- [ ] Edge cases covered (empty, error, loading)
- [ ] Responsive layouts tested
- [ ] Build succeeds

---

## 📚 Additional Resources

- **Storybook Docs**: https://storybook.js.org/
- **MSW Docs**: https://mswjs.io/
- **CSF 3.0 Format**: https://storybook.js.org/docs/writing-stories
- **React Query**: https://tanstack.com/query/
- **Jotai**: https://jotai.org/

---

**Last Updated**: 2026-04-01  
**Status**: ✅ Production Ready  
**Total Variants**: 95+ stories across 11 components
