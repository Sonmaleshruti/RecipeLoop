# RecipeLoop — Database Design

## 1. Overview

RecipeLoop will use MySQL as its relational database. The schema is designed to support recipe management, ingredient storage, weekly meal planning, shopping-list generation, and purchased-item tracking.

Spring Data JPA and Hibernate will map Java entities to database tables.

## 2. Database Name

`recipeloop_db`

## 3. Entities and Tables

The initial database design contains seven tables:

1. `recipes`
2. `ingredients`
3. `recipe_ingredients`
4. `weekly_plans`
5. `planned_meals`
6. `shopping_lists`
7. `shopping_list_items`

## 4. Table Structures

### 4.1 recipes

Stores recipe information.

| Column | Type | Description |
|---|---|---|
| id | BIGINT | Primary key |
| title | VARCHAR(150) | Recipe title |
| description | TEXT | Recipe description |
| preparation_time_minutes | INT | Preparation time |
| cooking_time_minutes | INT | Cooking time |
| instructions | TEXT | Cooking instructions |
| created_at | DATETIME | Creation timestamp |
| updated_at | DATETIME | Last update timestamp |

Constraints:
- `id` is the primary key.
- `title` is required.
- Preparation and cooking times must be non-negative.
- Timestamps should be managed consistently by the application.

### 4.2 ingredients

Stores normalized ingredient names.

| Column | Type | Description |
|---|---|---|
| id | BIGINT | Primary key |
| name | VARCHAR(100) | Ingredient name |

Constraints:
- `id` is the primary key.
- `name` is required.
- Ingredient names should be normalized before matching.

The application should avoid creating duplicate ingredient records for names that differ only by capitalization or surrounding whitespace.

### 4.3 recipe_ingredients

Associates recipes with ingredients and stores recipe-specific quantities.

| Column | Type | Description |
|---|---|---|
| id | BIGINT | Primary key |
| recipe_id | BIGINT | Foreign key to recipes |
| ingredient_id | BIGINT | Foreign key to ingredients |
| quantity | DECIMAL(10,3) | Required quantity |
| unit | VARCHAR(30) | Measurement unit |

Constraints:
- `recipe_id` references `recipes.id`.
- `ingredient_id` references `ingredients.id`.
- Quantity must be non-negative.
- Unit is required.
- Each row represents an ingredient used by a recipe.

A recipe may contain multiple ingredients, and an ingredient may be used by multiple recipes. This table represents the many-to-many relationship while storing quantity and unit for each recipe.

### 4.4 weekly_plans

Stores a user's selected planning week. The initial version does not require a user account.

| Column | Type | Description |
|---|---|---|
| id | BIGINT | Primary key |
| week_start_date | DATE | First day of the planning week |
| created_at | DATETIME | Creation timestamp |

Constraints:
- `id` is the primary key.
- `week_start_date` is required.
- The application shall use Monday as the first day of the week.
- Duplicate plans for the same week should be prevented or handled through a defined lookup-or-create rule.

### 4.5 planned_meals

Stores recipes assigned to particular dates.

| Column | Type | Description |
|---|---|---|
| id | BIGINT | Primary key |
| weekly_plan_id | BIGINT | Foreign key to weekly_plans |
| recipe_id | BIGINT | Foreign key to recipes |
| planned_date | DATE | Scheduled meal date |
| meal_type | VARCHAR(30) | Optional meal category |

Constraints:
- `weekly_plan_id` references `weekly_plans.id`.
- `recipe_id` references `recipes.id`.
- `planned_date` must fall within the associated planning week.
- Multiple recipes may be assigned to the same date.
- `meal_type` may identify breakfast, lunch, dinner, or snack.

### 4.6 shopping_lists

Stores shopping lists generated for weekly plans.

| Column | Type | Description |
|---|---|---|
| id | BIGINT | Primary key |
| weekly_plan_id | BIGINT | Foreign key to weekly_plans |
| generated_at | DATETIME | Last generation timestamp |

Constraints:
- `id` is the primary key.
- `weekly_plan_id` references `weekly_plans.id`.
- The initial design supports one current shopping list per weekly plan.
- Regeneration updates the existing list rather than creating duplicate quantities.

A unique constraint on `weekly_plan_id` may be used to enforce one list per plan.

### 4.7 shopping_list_items

Stores individual ingredients in a generated shopping list.

| Column | Type | Description |
|---|---|---|
| id | BIGINT | Primary key |
| shopping_list_id | BIGINT | Foreign key to shopping_lists |
| ingredient_id | BIGINT | Foreign key to ingredients |
| quantity | DECIMAL(10,3) | Consolidated quantity |
| unit | VARCHAR(30) | Measurement unit |
| purchased | BOOLEAN | Purchase status |

Constraints:
- `shopping_list_id` references `shopping_lists.id`.
- `ingredient_id` references `ingredients.id`.
- Quantity must be non-negative.
- `purchased` defaults to `FALSE`.
- Items with incompatible units must remain separate.
- The application shall define how purchased status is preserved when a list is regenerated.

## 5. Entity Relationships

- One recipe can have many recipe-ingredient records.
- One ingredient can appear in many recipes.
- One weekly plan can contain many planned meals.
- One recipe can appear in many planned meals.
- One weekly plan has one current shopping list.
- One shopping list contains many shopping-list items.
- One ingredient can appear in many shopping-list items.

## 6. ER Diagram

```text
+-------------+       +--------------------+       +-------------+
|   RECIPES   | 1   M |  RECIPE_INGREDIENTS| M   1 | INGREDIENTS |
+-------------+-------+--------------------+-------+-------------+
| id (PK)     |       | id (PK)            |       | id (PK)     |
| title       |       | recipe_id (FK)     |       | name        |
| description |       | ingredient_id (FK) |       +-------------+
| instructions|       | quantity           |
+-------------+       | unit               |
                      +--------------------+

+----------------+       +----------------+
|  WEEKLY_PLANS  | 1   M |  PLANNED_MEALS |
+----------------+-------+----------------+
| id (PK)        |       | id (PK)        |
| week_start_date|       | weekly_plan_id |
+-------+--------+       | recipe_id (FK) |
        |                | planned_date   |
        |                | meal_type      |
        |                +--------+-------+
        |                         |
        |                         M
        |                         |
        |                         1
        |                   +-------------+
        |                   |   RECIPES   |
        |                   +-------------+
        |
        | 1
        |
        | 1
+-------v--------+
| SHOPPING_LISTS |
+----------------+
| id (PK)        |
| weekly_plan_id |
| generated_at   |
+-------+--------+
        |
        | 1
        | 
        | M
+-------v-------------+       +-------------+
| SHOPPING_LIST_ITEMS | M   1 | INGREDIENTS |
+---------------------+-------+-------------+
| id (PK)             |
| shopping_list_id    |
| ingredient_id       |
| quantity            |
| unit                |
| purchased           |
+---------------------+
```

The diagram illustrates the main relationships. Foreign-key columns and exact cardinality constraints will be implemented in the JPA mappings and MySQL schema.

## 7. Shopping List Generation Logic

1. Retrieve all planned meals for the selected weekly plan.
2. Retrieve the ingredients for every associated recipe.
3. Normalize ingredient names for matching.
4. Group ingredients by normalized name and compatible unit.
5. Add quantities within each group.
6. Keep quantities with incompatible units separate.
7. Create or update the current shopping list.
8. Apply the defined policy for preserving purchased status.
9. Return the consolidated items to the frontend.

### Example

Suppose the weekly plan contains these ingredient requirements:

| Recipe | Ingredient | Quantity |
|---|---|---:|
| Vegetable Sandwich | Butter | 20 g |
| Butter Toast | Butter | 30 g |
| Pasta | Tomato | 2 pieces |

The consolidated list should contain:

| Ingredient | Quantity | Unit |
|---|---:|---|
| Butter | 50 | g |
| Tomato | 2 | pieces |

Butter quantities can be combined because their units match. The application must not add grams to tablespoons without a valid conversion rule.

## 8. Data Integrity and Deletion Rules

- Foreign keys shall prevent invalid relationships.
- Recipe-ingredient records should be removed when their recipe is deleted.
- Planned meals must not reference deleted recipes.
- Shopping-list generation shall run transactionally when multiple records are changed.
- Deleting a recipe must follow a deliberate policy for existing meal plans. The application may reject deletion while a recipe is planned, or remove affected planned meals and update the associated shopping list transactionally.
- Regenerating a shopping list shall not double-count previously generated quantities.

## 9. JPA Mapping Guidelines

- Use `@Entity` and `@Id` for persistent entities.
- Use `@ManyToOne` and `@OneToMany` for the relationships described above.
- Use `BigDecimal` for ingredient quantities.
- Use `LocalDate` for planning dates.
- Use suitable timestamp types for creation and update times.
- Use `@Transactional` for operations that modify related data.
- Avoid unintended eager loading of large entity relationships.

## 10. Document Status

**Status:** Proposed database design

**Next:** Define REST endpoints, HTTP methods, request structures, response structures, and error handling in `api-design.md`.
