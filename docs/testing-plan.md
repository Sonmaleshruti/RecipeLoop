# RecipeLoop — Testing Plan

## 1. Introduction

This document describes the testing strategy for RecipeLoop, an AI-based recipe-sharing and weekly meal-planning system. Testing will verify that recipe management, ingredient handling, weekly meal planning, shopping-list generation, and intelligent recipe recommendations work correctly.

## 2. Testing Objectives

- Verify that all core features work as expected.
- Validate user inputs and handle invalid data safely.
- Confirm that the backend APIs communicate correctly with the frontend.
- Verify that recipe and shopping-list data are stored correctly in MySQL.
- Check that the shopping list consolidates ingredients without creating duplicates.
- Evaluate whether the recommendation component returns recipes with relevant content.

## 3. Types of Testing

### 3.1 Unit Testing

Unit testing will verify individual methods and components independently.

Examples:
- Validate recipe fields before saving.
- Calculate consolidated ingredient quantities.
- Verify meal-plan date and meal-slot validation.
- Calculate similarity scores for recipe recommendations.

**Tools:** JUnit and Mockito.

### 3.2 Integration Testing

Integration testing will verify the interaction between backend services, repositories, APIs, and the MySQL database.

Examples:
- Save a recipe and retrieve it from the database.
- Add a recipe to a weekly meal plan.
- Generate a shopping list from multiple planned recipes.
- Update the purchased status of a shopping-list item.

**Tools:** Spring Boot Test and Spring Data JPA testing support.

### 3.3 API Testing

API testing will verify REST endpoints, request validation, response data, and HTTP status codes.

Examples:
- Retrieve all recipes using `GET /api/recipes`.
- Create a recipe using `POST /api/recipes`.
- Verify that invalid requests return an appropriate error response.
- Verify that requesting a nonexistent recipe returns `404 Not Found`.

**Tools:** Postman or IntelliJ HTTP Client.

### 3.4 User Interface Testing

UI testing will verify that the frontend is usable and communicates correctly with the backend.

Examples:
- Add and view a recipe.
- Search for recipes.
- Assign recipes to different days of a weekly meal plan.
- Generate and view the shopping list.
- Mark shopping-list items as purchased.

Testing will cover common desktop screen sizes and basic form validation.

### 3.5 Recommendation Testing

The recommendation component will be tested with recipes that have known similarities.

Examples:
- Recipes sharing ingredients or descriptions should receive higher similarity scores than unrelated recipes.
- Recommendations should exclude the selected recipe itself.
- Empty keywords and nonexistent recipe IDs should be handled appropriately.
- The component should return a meaningful result when suitable recipes are available.

The recommendation system will be evaluated for content relevance rather than claiming personalized accuracy.

## 4. Test Cases

| Test ID | Feature | Test Scenario | Expected Result |
|---|---|---|---|
| TC01 | Recipe Management | Create a recipe with valid details | Recipe is saved successfully |
| TC02 | Recipe Management | Submit a recipe without a name | Validation error is displayed |
| TC03 | Recipe Management | Search using an existing recipe name | Matching recipes are displayed |
| TC04 | Recipe Management | Update an existing recipe | Updated details are saved |
| TC05 | Recipe Management | Delete an existing recipe | Recipe is deleted safely |
| TC06 | Ingredients | Add an ingredient with a positive quantity | Ingredient is added successfully |
| TC07 | Ingredients | Enter a negative ingredient quantity | Validation error is returned |
| TC08 | Meal Planning | Assign a recipe to a day and meal slot | Planned meal is saved |
| TC09 | Meal Planning | Retrieve a weekly meal plan | Correct planned meals are displayed |
| TC10 | Shopping List | Generate a list from selected recipes | Required ingredients are listed |
| TC11 | Shopping List | Use the same ingredient in multiple recipes | Compatible quantities are combined |
| TC12 | Shopping List | Regenerate an existing shopping list | Duplicate entries are not created |
| TC13 | Shopping List | Mark an item as purchased | Purchased status is updated |
| TC14 | Recommendations | Request recommendations for a recipe | Similar recipes are returned |
| TC15 | API Validation | Request a nonexistent recipe | `404 Not Found` is returned |
| TC16 | Database | Save and retrieve recipe data | Data is stored and retrieved correctly |

## 5. Test Environment

The following environment will be used for testing:

- **Operating System:** Windows 11
- **IDE:** IntelliJ IDEA
- **Programming Language:** Java
- **Backend Framework:** Spring Boot
- **Database:** MySQL
- **Frontend:** HTML, CSS, and JavaScript
- **Testing Framework:** JUnit and Spring Boot Test
- **API Testing Tool:** Postman or IntelliJ HTTP Client
- **Version Control:** Git and GitHub

## 6. Entry and Exit Criteria

### Entry Criteria

- The application requirements and API designs are documented.
- The required backend and database configuration is available.
- The feature under test has been implemented.
- Test data is available.

### Exit Criteria

- All critical test cases pass.
- No unresolved critical defects remain.
- Recipe and meal-plan data persist correctly.
- Shopping-list generation produces the expected results.
- Recommendation results are relevant to the selected content.
- Known limitations are documented.

## 7. Defect Management

Defects discovered during testing will be recorded with their description, reproduction steps, expected result, actual result, and severity. Critical defects will be fixed before the project demonstration. After corrections, the affected test cases will be executed again to ensure that the changes have not broken existing functionality.

## 8. Conclusion

The testing process will help verify the functional correctness, data integrity, usability, and reliability of RecipeLoop. Unit, integration, API, UI, and recommendation testing will be performed as the corresponding features are implemented. The results will be documented to support the final project demonstration and evaluation.
