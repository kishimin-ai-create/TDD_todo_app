# Test Driven Development

The goal of TDD is to achieve "clean code that works"

1. Write a list of test scenarios you want to cover (test list)

2. Pick only one item from the test list and translate it into a concrete,
   executable test. Then confirm that the test fails.
   - Commit with the prefix `test:`

3. Modify the production code to make the new test (and all existing tests)
   pass. Add any newly discovered scenarios to the test list.
   - Commit with the prefix `feat:`

4. Refactor the code as needed to improve the design.
   - Commit with the prefix `refactor:` (can be done multiple times)

5. Repeat from step 2 until the test list is empty

---

## Principles

- Break problems into small pieces
- Adjust the size of each step

### Implementation Strategies

- Test → Fake implementation → Triangulation → Real implementation
- Test → Fake implementation → Real implementation
- Test → Obvious implementation
