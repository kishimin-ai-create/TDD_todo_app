# Protected paths

Use [`.github/rules/protected-paths.md`](../rules/protected-paths.md) as the
source of truth for protected paths.

- Do not modify files or folders listed in `.github/rules/protected-paths.md`
  unless the user explicitly requests a change to that exact path.
- Currently protected:
  - `AGENTS.md`
  - `README.md`
- You may read protected files for context, but you must not edit, rename, move,
  or delete them unless the user explicitly asks for it.

# backend

### Directory Structure for Clean Architecture

```text
src/
├── domain/                # Domain Layer
│   ├── entities/          # Business Entities
│   └── repositories/      # Repository Interfaces
├── usecase/               # Usecase Layer
│   ├── interactors/       # Business Logic Implementation
│   ├── input_ports/       # Input Boundaries
│   └── output_ports/      # Output Boundaries
├── interface/             # Interface Adapters Layer
│   ├── controllers/       # Controllers
│   ├── presenters/        # Presenters
│   └── gateways/          # Repository Implementations
└── infrastructure/        # Infrastructure Layer
    ├── database/          # Database Configurations
    ├── external_api/      # External API Clients
    └── framework/         # Framework Specific Settings
```

#### Layer Descriptions

| Layer              | Description                                                                                                                                                                             |
| :----------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Domain**         | The innermost circle. Defines business rules and entities. It is the core of the application and has no dependencies on other layers.                                                   |
| **Usecase**        | Contains application-specific business logic. It orchestrates the flow of data to and from the entities and directs those entities to use their critical business rules.                |
| **Interface**      | A set of adapters that convert data from the format most convenient for the use cases and entities to the format most convenient for external agencies such as the Database or the Web. |
| **Infrastructure** | The outermost layer. It is where all the details go: the framework, the database, the UI, etc. It communicates with the Interface layer to receive and send data.                       |

### Strict Rules to Follow

- **Domain Layer:** Never import frameworks or infrastructure-specific SDKs (e.g., SQLx, Axum). It must contain only business entities, rules, and Ports (interfaces/traits).
- **Usecase Layer:** Dedicated to orchestration and transaction boundary management. Implementation of SQL or HTTP calls is strictly prohibited; it must interact with the outside world only through Ports.
- **Handler Layer:** Keep it "thin." Its responsibility is limited to parsing/validating input, calling the Usecase, and mapping internal errors to HTTP responses or DTOs.
- **Error Handling:** Never leak raw infrastructure errors (like DB errors) outside the infrastructure layer. They must be mapped into domain-specific error types (e.g., `AppError` or `RepoError`).

### Implementation Steps (Thinking Process)

To avoid getting lost during development, the following implementation order is recommended:

1.  **Domain:** Implement the core models and business logic first.
2.  **Port:** Define the interfaces (Traits) required for I/O.
3.  **Usecase:** Define the flow of the process (orchestration) using the Ports.
4.  **Adapter:** Implement the infrastructure details (e.g., DB queries, external API clients).
5.  **Registry:** Wire everything together using Dependency Injection.
6.  **Handler:** Create the entry point, such as an HTTP endpoint.
7.  **Test:** Conduct tests from the inside out (Domain → Usecase → Infrastructure → Interface).

### Article Summary: Testing Web APIs (from Money Forward Developers Blog)

This article summarizes the key takeaways from the book _Testing Web APIs_ by Mark Winteringham. It emphasizes that API testing is not just a technical collection of scripts, but a **"comprehensive approach to understanding the product and improving quality strategically."**

---

### Key Points

**1. Importance of Product Understanding (Chapter 2)**

- Before starting any tests, you must deeply understand how the system works by watching demos, reading documentation, analyzing source code, and observing actual traffic using DevTools.
- This helps identify risks and bottlenecks at the network communication level.

**2. Defining Quality and Risk (Chapter 3)**

- Consider what "value" means to the users and prioritize testing accordingly.
- Create a risk matrix based on "impact" and "probability" to clarify which risks must be addressed first.

**3. Utilizing Exploratory Testing (Chapter 5)**

- Incorporate exploratory testing into your API strategy—moving beyond predefined checks with a "What if?" mindset.
- Follow a cycle of "Explore → Learn → Experiment" to discover unknown issues.

**4. Valuable Test Automation (Chapter 6)**

- The goal of automation should be to enhance the value of regression testing. To maintain high code quality, the author recommends organizing test code into three layers:
  - **Tests:** Definition of test scenarios.
  - **Requests:** Execution of API requests.
  - **Payloads:** Definition of data sent and received.

**5. Testability and Strategy (Chapter 7)**

- Assess and improve "Testability" by considering the team's skill set and existing processes through the "9 Ps" (People, Pipeline, Process, etc.).
- Create a simple, one-page test plan that is easy to understand and keep updated.

# frontend

I'm using `React` and `Typescript`.
Within this directory, you should be regarded as an expert in React and TypeScript.

## Overall

- The overall direction looks good. I focused mainly on **separation of concerns** and whether the structure will remain maintainable as the codebase grows.
- There are a few points around **common component design** and **testing practices** that are worth addressing early to avoid future friction.

---

## ✅ Good Points

- Component responsibilities are reasonably scoped, and state / side effects appear localized.
- Tests (if present) seem to be written from a **user-centric perspective**, which is a strong foundation.

---

## 🔥 Must Address (Affects Maintainability / Bugs)

### 1) Common Components: Are We Preserving Native HTML Props and Events?

- Be careful not to redefine standard props like `onClick` with custom signatures (e.g. passing only `value`).
  This often breaks compatibility with native attributes such as `disabled`, `type`, `aria-*`, etc.
- Prefer **extending and forwarding standard HTML props** rather than redefining them.

---

### 2) `useEffect`: Is It Truly Necessary?

- `useEffect` should primarily be used for **synchronizing with external systems**.
- Avoid driving UI logic or state transitions via `useEffect`, as it often introduces subtle bugs.
- Consider whether the logic can be handled via:
  - event handlers
  - derived state
  - `useMemo`
  - or extracting logic into custom hooks

---

### 3) Dependency Boundaries: UI vs Global State

- UI-level components should avoid directly depending on global state hooks, routing hooks, or data-fetching logic.
- Either:
  - move such logic into `features`, or
  - introduce a wrapper layer to clearly define boundaries

This improves reusability and testability.

---

## 🧪 Testing Considerations (Long-Term Maintainability)

### 4) Test Readability First (AAA + 3-Part Test Names)

- Test names should clearly express:
  **what** is being tested, **under what condition**, and **what outcome is expected**.
- Structure test bodies using **Arrange / Act / Assert (AAA)** to make intent obvious at a glance.

---

### 5) Testing Library Query Priority

- Prefer queries in the following order:
  - `getByRole`
  - `getByLabelText`
  - other semantic queries
- Treat `getByTestId` as a last resort.
- This aligns tests with accessibility and real user behavior.

---

### 6) Helper Functions in Tests: Use with Care

- Extracting common interactions (typing, clicking, setup) can reduce duplication.
- However, over-abstracting can make tests harder to read.
- Optimize first for **clarity**, then for reuse.

---

### 7) Snapshot Testing: Keep It Focused

- Avoid large or overly detailed snapshots.
- Prefer **small, focused snapshots** (or inline snapshots) that clearly express intent.
- Large snapshots tend to be brittle and expensive to maintain.

---

## 🧹 Minor Notes (Nits)

- Naming and folder placement (`ui`, `features`, `pages`, etc.) should clearly communicate responsibility.
- Where possible, rely on static analysis (ESLint, TypeScript) to catch mechanical issues and reduce review noise.

---

## 🤖 About AI-Assisted Reviews

- AI tools are effective for catching typos, formatting issues, and basic patterns.
- However, domain context and architectural intent still require human judgment.
- Final decisions should remain with the reviewer.

---

## 🎯 What I’d Like to See After This PR

- Common components that **preserve native props and events**
- `useEffect` limited to **external synchronization**
- Tests written with **ByRole-first queries**, **AAA structure**, and **clear test names**

# git

## 📌 Summary

<!-- Briefly describe what this PR does and why it is needed -->

This PR introduces changes to improve / fix / add **[short description]**.

---

## 🎯 Purpose / Background

<!-- Why is this change necessary? What problem does it solve? -->

- Background:
- Related issue / ticket:
- Motivation behind this change:

---

## 🔧 Changes

<!-- List the main changes in this PR -->

- [ ] Added / Updated / Removed **XXX**
- [ ] Refactored **YYY**
- [ ] Fixed bug related to **ZZZ**

---

## 🧩 Design / Implementation Notes

<!-- Explain design decisions or trade-offs -->

- Why this approach was chosen:
- Alternatives considered (if any):
- Scope intentionally left out:

---

## 🧪 How to Test

<!-- Steps for reviewers to verify the change -->

1. Checkout this branch
2. Run:
   ```bash
   # example
   npm test
   ```
