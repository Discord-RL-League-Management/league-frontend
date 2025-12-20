# LLM Test Generation Directive: Nest.js Unit Tests

You are an expert Nest.js and Jest unit testing professional. Your task is to generate a complete, high-quality Jest unit test file (`[COMPONENT_NAME].spec.ts`) for the primary Nest.js component currently available in your context (Service, Controller, or Provider).

## CONSTRAINTS & REQUIREMENTS

1.  **Test Scope:** Generate **Unit Tests ONLY**. Do not generate integration or E2E tests.
2.  **Frameworks:** Use **Jest** and the official **@nestjs/testing** utilities (e.g., `Test.createTestingModule`).
3.  **Isolation (MOCKING MANDATE):** All external dependencies (other Services, Repositories, etc.) **must be mocked**. Use `jest.fn()` or spies. Mocks must be provided to the `TestingModule` using the `useValue` or `useFactory` pattern in the `providers` array in `beforeEach`.
4.  **Test Structure:** Adhere strictly to the **Arrange-Act-Assert (AAA)** pattern for every test case.
5.  **Coverage Focus:** Test cases must focus entirely on the component's interface and contract, covering:
    * **Inputs:** Scenarios for valid, invalid, null, and edge-case inputs.
    * **Outputs:** Verification of all successful return values.
    * **Behaviors:** Verification of side effects (method calls on mocked dependencies) using **`expect(...).toHaveBeenCalledWith(...)`**, and correct exception throwing for failure paths using **`expect(...).rejects.toThrow(...)`**.
6.  **Cleanup:** Include **`jest.clearAllMocks()`** within an **`afterEach`** block to ensure test isolation.

## MANDATORY EXAMPLE STRUCTURE AND QUALITY STANDARD

The final generated test code must follow this exact structure and quality standard for Nest.js service unit testing:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ComponentUnderTest } from './component-under-test.service';
import { DependencyService } from '../dependency/dependency.service'; 
import { NotFoundException } from '@nestjs/common'; 

// Example: Define a mock for a dependency
const mockDependencyService = {
  // Mock all methods that the ComponentUnderTest calls
  methodCalledByComponent: jest.fn(),
  otherMethod: jest.fn(),
};

describe('ComponentUnderTest', () => {
  let service: ComponentUnderTest;

  beforeEach(async () => {
    // 1. Arrange: Setup the testing module
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ComponentUnderTest,
        {
          // Provide the mock implementation for the dependency
          provide: DependencyService, // Replace with the actual Injection Token/Class
          useValue: mockDependencyService,
        },
      ],
    }).compile();

    service = module.get<ComponentUnderTest>(ComponentUnderTest);
  });

  afterEach(() => {
    // 6. Cleanup: Clear all mock usage data
    jest.clearAllMocks(); 
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('methodToTest', () => {
    it('should successfully execute business logic and return the expected result', async () => {
      // ARRANGE
      const input = { data: 'valid' };
      const expectedOutput = { id: 1, processed: true };
      
      // Mock dependency output for the successful path
      mockDependencyService.methodCalledByComponent.mockResolvedValue(true); 

      // ACT
      const result = await service.methodToTest(input);

      // ASSERT
      // Verify successful output
      expect(result).toEqual(expectedOutput); 
      // Verify behavior: Dependency was called correctly
      expect(mockDependencyService.methodCalledByComponent).toHaveBeenCalledWith(input.data); 
    });

    it('should throw a custom exception for invalid input data', async () => {
      // ARRANGE
      const invalidInput = { data: null };

      // ACT & ASSERT
      // Verify behavior: Correct exception is thrown
      await expect(service.methodToTest(invalidInput)).rejects.toThrow(NotFoundException);
      // Verify behavior: Dependent method was NOT called
      expect(mockDependencyService.methodCalledByComponent).not.toHaveBeenCalled();
    });
  });
});