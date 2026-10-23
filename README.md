# RecipeLoop

### AI-Based Recipe Sharing and Intelligent Weekly Meal Planning

RecipeLoop is a web-based application designed to simplify recipe discovery, weekly meal planning, and grocery preparation. Users can share and manage recipes, organize meals throughout the week, generate consolidated shopping lists automatically, and receive intelligent recipe recommendations based on ingredient similarity and preferences.

## Project Objectives

- Provide a centralized platform for creating, viewing, updating, and deleting recipes.
- Organize recipes into a day-wise weekly meal plan.
- Automatically generate a consolidated shopping list from selected recipes.
- Combine repeated ingredients when their measurement units are compatible.
- Provide content-based recipe recommendations using TF-IDF and cosine similarity.
- Develop a maintainable application using Java, Spring Boot, and MySQL.

## Key Features

### Recipe Management
- Add, view, edit, and delete recipes.
- Store recipe descriptions, ingredients, quantities, measurement units, and preparation details.
- Search and filter available recipes.

### Weekly Meal Planning
- Assign recipes to days of the week.
- View planned meals in a weekly schedule.
- Update meal plans as needed.

### Automatic Shopping List
- Generate a shopping list from planned recipes.
- Aggregate repeated ingredients with compatible units.
- Mark shopping items as purchased or pending.

### AI-Based Recipe Recommendations
- Recommend recipes using ingredient and recipe-description similarity.
- Apply TF-IDF vectorization and cosine similarity.
- Present relevant recipe suggestions based on available recipe data.

## Technology Stack

| Component | Technology |
|---|---|
| Programming Language | Java |
| Backend Framework | Spring Boot |
| Web and REST Layer | Spring MVC, REST APIs |
| Persistence | Spring Data JPA, Hibernate |
| Database | MySQL |
| Frontend | HTML, CSS, JavaScript |
| AI Recommendation | TF-IDF and cosine similarity |
| Version Control | Git and GitHub |
| Development Environment | IntelliJ IDEA |

## Project Scope

The initial version focuses on the core recipe, meal-planning, shopping-list, and recommendation workflows.

Features such as user authentication, online grocery ordering, image recognition, chatbot integration, and cloud deployment are outside the initial scope and may be considered in future versions.

## Planned Modules

1. Recipe Management
2. Recipe Search and Discovery
3. Ingredient Management
4. Weekly Meal Planning
5. Shopping List Generation
6. AI-Based Recipe Recommendations
7. Testing and Documentation

## Repository Structure

```text
RecipeLoop/
├── README.md
├── PROJECT_PLAN.md
└── docs/
    ├── requirements.md
    ├── architecture.md
    ├── database-design.md
    ├── api-design.md
    └── testing-plan.md
```

The application source code will be added after the requirements and technical design are finalized.

## Project Status

**Current Phase:** Requirements and Project Planning

## Future Enhancements

- User accounts and personalized preferences.
- Dietary and nutritional filtering.
- Ingredient inventory and expiry tracking.
- More advanced personalized recommendations.
- Deployment to a cloud platform.

## Author
**Shruti Sonmale**
