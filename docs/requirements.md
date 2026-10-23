# RecipeLoop — Software Requirements Specification

## 1. Introduction

### 1.1 Purpose

This document specifies the functional and non-functional requirements of RecipeLoop, a web application for recipe sharing, weekly meal planning, shopping list generation, and AI-based recipe recommendations.

### 1.2 Scope

The initial version will support recipe management, recipe discovery, ingredient management, weekly meal planning, automatic shopping lists, shopping checklist updates, and content-based recipe recommendations.

The first version will run locally and use MySQL for persistent storage.

### 1.3 Intended Users

The initial application will support general users without mandatory registration or login. Users will be able to browse recipes, manage recipes, create weekly plans, generate shopping lists, and view recommendations.

## 2. Functional Requirements

### 2.1 Recipe Management

- The system shall allow users to create recipes.
- Each recipe shall contain a title, description, preparation time, cooking instructions, and a collection of ingredients.
- The system shall allow users to view recipe details.
- The system shall allow users to edit recipe information and ingredients.
- The system shall allow users to delete recipes.
- The system shall validate required fields before saving a recipe.

### 2.2 Ingredient Management

- Each ingredient entry shall include a name, quantity, and unit.
- Ingredient names shall be normalized for comparison, such as treating differences in capitalization as equivalent.
- Quantities shall be non-negative, and zero quantities shall be accepted only if explicitly allowed by the implementation rules.
- Units shall be represented consistently, such as g, kg, ml, l, piece, or tablespoon.
- The system shall not combine quantities when units are incompatible.

### 2.3 Recipe Search and Discovery

- Users shall be able to search for recipes by title.
- The system shall display matching recipes.
- Users shall be able to browse all available recipes.
- Empty search results shall produce a clear message.

### 2.4 Weekly Meal Planning

- Users shall be able to create or select a weekly meal plan.
- Users shall be able to assign a recipe to a day of the selected week.
- Multiple meals may be assigned to the same day.
- Users shall be able to view planned meals by day.
- Users shall be able to remove or replace planned meals.
- A planned meal shall reference an existing recipe.

### 2.5 Shopping List Generation

- Users shall be able to generate a shopping list from recipes in a selected weekly plan.
- The system shall collect the ingredients required by all selected recipes.
- Matching ingredient names with compatible units shall be consolidated.
- Ingredients with incompatible units shall remain separate entries.
- The system shall prevent duplicate generation from unintentionally accumulating the same ingredients repeatedly.
- Users shall be able to regenerate the list after changing the meal plan.

### 2.6 Shopping Checklist

- Each shopping-list item shall have a purchased status.
- Users shall be able to mark an item as purchased or pending.
- Purchased status shall persist in the database.
- Users shall be able to view all items and their current statuses.

### 2.7 AI-Based Recipe Recommendations

- The system shall provide content-based recipe recommendations.
- Recipe titles, descriptions, and ingredient text may be used as input features.
- TF-IDF shall convert text into numerical feature vectors.
- Cosine similarity shall measure similarity between the selected recipe or user-provided ingredient query and candidate recipes.
- The system shall rank candidates by relevance.
- The currently selected recipe shall be excluded from similar-recipe results where appropriate.
- The system shall handle empty queries and recipes with insufficient text.
- The recommendation feature shall not be described as personalized machine learning unless user-specific preference data is actually collected and used.

## 3. Business Rules

1. A recipe must have a valid title and at least one ingredient.
2. Ingredient quantities must be non-negative.
3. Every planned meal must reference an existing recipe.
4. Shopping-list generation must use the recipes currently assigned to the selected plan.
5. Ingredient consolidation must account for both normalized ingredient names and compatible units.
6. Units must not be converted or added together unless a valid conversion rule exists.
7. Changes to a meal plan must be reflected when its shopping list is regenerated.
8. Deleting a recipe must not leave invalid recipe references in meal plans.
9. Shopping-list purchased status must remain independent for each list item.
10. Recommendation results must be based on available recipe data.

## 4. Non-Functional Requirements

### 4.1 Usability
The interface shall provide clear navigation and understandable validation messages.

### 4.2 Performance
The application shall respond within a reasonable time for a small local recipe dataset.

### 4.3 Maintainability
The backend shall separate controllers, services, repositories, entities, and data-transfer objects where appropriate.

### 4.4 Data Integrity
Database relationships and constraints shall prevent invalid references and inconsistent records.

### 4.5 Reliability
The system shall handle invalid input and expected application errors without crashing.

### 4.6 Security
Input validation shall be implemented. Database credentials shall not be committed to the public repository.

### 4.7 Compatibility
The application shall support a modern desktop browser and a compatible local Java and MySQL environment.

## 5. Data Requirements

The initial database design is expected to contain the following main entities:

- Recipe
- Ingredient
- RecipeIngredient
- WeeklyPlan
- PlannedMeal
- ShoppingList
- ShoppingListItem

The final entity structure and relationships will be defined in `database-design.md`.

## 6. Constraints and Assumptions

- The first version will not require user accounts.
- Recipe data will be stored in MySQL.
- The initial recommendation engine will use text-based content similarity.
- The initial recipe collection may be seeded with sample data.
- The application will not place grocery orders.
- Nutritional analysis, image recognition, and chatbot integration are outside the initial scope.
- Advanced unit conversion will be excluded from the first version.

## 7. Acceptance Criteria

The application meets its initial requirements when:

- Users can create, view, update, and delete recipes.
- Recipe ingredients are stored and retrieved correctly.
- Recipe search returns relevant matches.
- Users can assign recipes to days of a week.
- Shopping lists contain ingredients from the selected weekly plan.
- Compatible repeated ingredients are combined correctly.
- Incompatible units are not incorrectly combined.
- Shopping-list items can be marked purchased and pending.
- The recommendation engine returns ranked candidate recipes.
- Invalid input produces useful error responses.
- The application can be run locally using documented setup instructions.

## 8. Out of Scope

The following are excluded from the first version:

- User registration and authentication
- Social media integrations
- Online grocery ordering and payments
- Image-based ingredient recognition
- Conversational AI assistant
- Advanced nutrition and medical dietary advice
- Production cloud deployment

## 9. Document Status

**Status:** Initial requirements baseline

**Next review:** After database and API design, to confirm that all requirements can be implemented consistently.
