# RecipeLoop — System Architecture

## 1. Overview

RecipeLoop follows a layered web application architecture. The frontend communicates with a Spring Boot backend through REST APIs. The backend handles application logic, database operations, weekly meal planning, shopping-list generation, and recipe recommendations.

MySQL provides persistent storage. The recommendation engine uses content-based text similarity to rank relevant recipes.

## 2. Architecture Components

### 2.1 Presentation Layer

**Technology:** HTML, CSS, JavaScript

Responsibilities:
- Display recipe listings and recipe details.
- Provide forms for adding and editing recipes.
- Display the weekly meal planner.
- Show generated shopping lists and purchased status.
- Display recommended recipes.
- Communicate with the backend through HTTP requests.

### 2.2 Controller Layer

**Technology:** Spring Boot and Spring MVC REST controllers

Responsibilities:
- Expose REST API endpoints.
- Accept and validate incoming requests.
- Delegate operations to service classes.
- Return appropriate HTTP status codes and response data.

Controllers shall not contain the main business logic or direct database queries.

### 2.3 Service Layer

**Technology:** Java and Spring services

Responsibilities:
- Implement recipe management rules.
- Manage ingredients and their associations with recipes.
- Create and update weekly meal plans.
- Generate and consolidate shopping-list items.
- Invoke the recommendation component.
- Handle business validation and transactional operations.

### 2.4 Repository Layer

**Technology:** Spring Data JPA and Hibernate

Responsibilities:
- Persist entities to MySQL.
- Retrieve recipes and related ingredients.
- Store weekly plans, planned meals, and shopping lists.
- Perform database updates and deletions.
- Use repository methods and queries to retrieve required data.

Spring Data JPA with Hibernate will be the primary data-access approach. Spring JDBC will not be used to duplicate the same CRUD operations.

### 2.5 Database Layer

**Technology:** MySQL

The database will store:
- Recipes
- Ingredients and recipe-ingredient relationships
- Weekly meal plans
- Planned meals
- Shopping lists and their items

Relationships and referential integrity will be finalized in `database-design.md`.

### 2.6 AI Recommendation Component

**Initial approach:** Content-based recommendation using TF-IDF and cosine similarity.

Responsibilities:
- Prepare text from recipe titles, descriptions, and ingredients.
- Transform text into numerical feature vectors.
- Compare a selected recipe or ingredient query with candidate recipes.
- Rank candidates by similarity.
- Return relevant recommendations to the application.

For the initial implementation, the recommendation component will be a separate logical module. Its execution location will be finalized before implementation.

The project may implement the algorithm in Java or use a small Python service if that proves more practical. The chosen approach must be documented and tested.

## 3. Logical Architecture Diagram

```text
+--------------------------------------+
|          Presentation Layer          |
|       HTML, CSS, JavaScript          |
+------------------+-------------------+
                   |
                   | HTTP / JSON
                   v
+--------------------------------------+
|      Spring Boot REST Controllers    |
| Recipes | Plans | Shopping | AI      |
+------------------+-------------------+
                   |
                   v
+--------------------------------------+
|             Service Layer            |
| Recipe | Planning | Shopping | Recs   |
+----------+------------------+--------+
           |                  |
           v                  v
+--------------------+  +--------------------+
| Spring Data JPA /  |  | Recommendation     |
| Hibernate          |  | Engine             |
+---------+----------+  | TF-IDF + Cosine    |
          |             +--------------------+
          v
+--------------------------------------+
|              MySQL                   |
| Recipes, Ingredients, Plans, Lists    |
+--------------------------------------+
```

The diagram shows logical responsibilities. It does not require the recommendation engine to run as a separate network service.

## 4. Main Application Workflows

### 4.1 Recipe Creation

1. The user submits recipe details through the frontend.
2. The frontend sends a request to the recipe REST controller.
3. The controller validates the request structure.
4. The recipe service applies business rules.
5. The repository saves the recipe and its ingredient associations.
6. The backend returns a response to the frontend.

### 4.2 Weekly Meal Planning

1. The user selects a week.
2. The user assigns recipes to specific days.
3. The planning controller receives the request.
4. The planning service verifies that the referenced recipes exist.
5. The repository saves the planned meals.
6. The updated weekly plan is returned to the frontend.

### 4.3 Shopping List Generation

1. The user requests a shopping list for a weekly plan.
2. The shopping service retrieves the planned recipes and their ingredients.
3. Ingredient names are normalized for comparison.
4. Quantities are combined only when units are compatible.
5. Incompatible units remain separate entries.
6. The generated list is stored or updated according to the defined regeneration rules.
7. The frontend displays the consolidated list.

### 4.4 AI Recipe Recommendations

1. The user selects a recipe or provides an ingredient-based query.
2. The recommendation service obtains candidate recipes.
3. The recommendation engine prepares and vectorizes recipe text.
4. Cosine similarity scores are calculated.
5. Candidates are ranked by relevance.
6. The highest-ranked suitable recipes are returned to the frontend.

## 5. REST Communication

The frontend will communicate with the backend using HTTP and JSON.

Expected operations include:
- `GET` for retrieving recipes, meal plans, and shopping lists.
- `POST` for creating recipes, plans, and other resources.
- `PUT` or `PATCH` for updating resources.
- `DELETE` for removing resources.

Exact endpoint paths and request/response formats will be defined in `api-design.md`.

## 6. Error Handling

The application will use centralized exception handling where appropriate.

Examples include:
- Invalid recipe input: HTTP 400 Bad Request.
- Requested resource not found: HTTP 404 Not Found.
- Conflicting or invalid state: an appropriate 4xx response.
- Unexpected server failure: HTTP 500 Internal Server Error.

Error responses should be understandable and must not expose database credentials or internal stack traces to users.

## 7. Data Integrity and Transactions

Operations that modify related records shall preserve database consistency.

Examples:
- Saving a recipe and its ingredients should be handled consistently.
- A planned meal must reference an existing recipe.
- Shopping-list generation should update a list without unintentionally accumulating duplicate quantities.
- Deleting a recipe must not leave invalid references.

Spring-managed transactions will be used where necessary.

## 8. Design Principles

- Separation of concerns
- Reusable service logic
- RESTful API design
- Relational data integrity
- Input validation
- Centralized exception handling
- Testable recommendation logic
- Incremental development

## 9. Architecture Decision Summary

| Decision | Selected approach |
|---|---|
| Backend | Spring Boot |
| API style | REST with JSON |
| Persistence | Spring Data JPA and Hibernate |
| Database | MySQL |
| Frontend | HTML, CSS, JavaScript |
| Recommendation approach | TF-IDF and cosine similarity |
| Initial deployment | Local development environment |
| Authentication | Excluded from the initial version |

## 10. Document Status

**Status:** Proposed architecture

**Next:** Finalize database entities, attributes, relationships, and constraints in `database-design.md`.
