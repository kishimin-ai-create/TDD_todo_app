# Backend Rules

## Directory Structure (DDD + Clean Architecture with Controller/Service Style)

```text
src/
├── models/                # Domain Model (Entities / Value Objects)
├── services/              # Application Service (Usecase / Business Logic)
├── repositories/           # Repository Interfaces (Domain) & Implementations
├── controllers/           # Entry Point (HTTP Layer)
└── infrastructures/       # External Systems (DB, APIs, Framework)
````


## Layer Descriptions

| Layer              | Description                                                                                     |
| ------------------ | ----------------------------------------------------------------------------------------------- |
| **Model**          | Domain layer. Defines entities and business rules. No dependencies on other layers.             |
| **Service**        | Application layer. Executes business logic and orchestrates use cases.                          |
| **Repository**     | Handles data persistence. Interfaces belong to Model, implementations belong to Infrastructure. |
| **Controller**     | Entry point. Handles HTTP requests/responses and calls Services.                                |
| **Infrastructure** | External concerns such as DB, frameworks, and APIs.                                             |


## Strict Rules to Follow

### Model Layer

* Must not depend on any other layer
* No frameworks, no database access, no HTTP

### Service Layer

* Contains business logic and usecase orchestration
* Must not include infrastructure details (DB, HTTP, etc.)

### Repository Layer

* Interfaces belong to the Model layer
* Implementations belong to the Infrastructure layer
* Must not leak infrastructure-specific errors

### Controller Layer

* Must be thin
* Only handles request/response mapping
* Calls Service layer only

### Infrastructure Layer

* Handles all external systems (DB, APIs, frameworks)
* Must not contain business logic


## Dependency Rule

* Dependencies must always point inward (toward Model)

```text
Controller → Service → Model
           ↓
      Repository (interface)
           ↓
    Infrastructure (implementation)
```

* Outer layers must not be referenced from inner layers


## Error Handling

* Do not expose raw infrastructure errors outside Infrastructure layer
* Map errors to domain-specific types (e.g., AppError, RepoError)


## Command Execution Rules

* Use the **bash shell**
* Do not use PowerShell (pwsh)
* Run commands in the current working directory unless specified
* When working on backend, execute commands inside the `backend` directory

### Commands

```bash
npm run lint
npm run typecheck
npm run test
```


## Implementation Steps (Thinking Process)

1. Model: Define domain models and business rules
2. Repository: Define interfaces (ports)
3. Service: Implement usecases using repositories
4. Infrastructure: Implement repository details (DB, API)
5. Controller: Handle HTTP and call services
6. Test: Test from inside out (Model → Service → Infrastructure → Controller)


## Testing Strategy (Summary)

### Principles

* Understand the system before testing
* Define quality based on user value
* Prioritize based on risk (impact × probability)

### Testing Approach

* Combine automated testing with exploratory testing
* Use "Explore → Learn → Experiment" cycle

### Test Structure

* Tests: Define scenarios
* Requests: Execute API calls
* Payloads: Define request/response data

### Strategy

* Improve testability continuously
* Keep test plans simple and maintainable

