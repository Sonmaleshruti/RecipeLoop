# RecipeLoop

### AI-Based Recipe Sharing and Intelligent Weekly Meal Planning

RecipeLoop is a web-based application that simplifies recipe management, weekly meal planning, and grocery preparation. Users can manage recipes, organize meals throughout the week, automatically generate consolidated shopping lists, and discover similar recipes through content-based recommendations.

The application is built using Java, Spring Boot, Spring Data JPA, MySQL, HTML, CSS, and JavaScript.

## Key Features

### 1. Recipe Management
- Create, view, update, and delete recipes.
- Store recipe names, descriptions, ingredients, quantities, preparation instructions, preparation time, and servings.
- Search and explore available recipes.
- View recipe details and discover similar recipes.

### 2. User Authentication
- Register an account and log in securely.
- Store passwords using BCrypt hashing.
- Maintain session-based authentication.
- Restrict meal-planning and shopping-list operations to the authenticated user.

### 3. Weekly Meal Planning
- Organize recipes into a day-wise weekly schedule.
- Add and manage planned meals.
- Retrieve meal plans for a selected date range.
- Keep meal plans associated with the respective user.

### 4. Automatic Shopping List Generation
- Generate shopping lists from recipes scheduled for a selected week.
- Split ingredient text into individual shopping-list items.
- Combine repeated ingredients when their names and measurement units are compatible.
- Preserve items with incompatible or ambiguous quantities separately.
- Mark individual items as purchased or pending.
- Maintain user-specific shopping lists.

### 5. AI-Based Recipe Recommendations
- Recommend similar recipes based on recipe content and ingredients.
- Use TF-IDF vectorization and cosine similarity to calculate textual similarity.
- Present relevant recommendations using the available recipe data.

## Technology Stack

| Component | Technology |
|---|---|
| Programming Language | Java 25 |
| Backend Framework | Spring Boot 4.1.1 |
| Web Layer | Spring MVC, REST APIs |
| Persistence | Spring Data JPA, Hibernate |
| Database | MySQL 8 |
| Frontend | HTML5, CSS3, JavaScript |
| Authentication | Spring Security, session-based authentication |
| Password Security | BCrypt |
| Recommendation Technique | TF-IDF and cosine similarity |
| Build Tool | Maven |
| Version Control | Git and GitHub |
| Development Environment | IntelliJ IDEA |

## Application Architecture

RecipeLoop follows a layered application architecture:

1. **Frontend:** HTML, CSS, and JavaScript provide the user interface.
2. **Controller Layer:** Spring MVC controllers handle HTTP requests and REST API operations.
3. **Service Layer:** Business logic manages recipes, authentication, meal planning, shopping lists, and recommendations.
4. **Repository Layer:** Spring Data JPA repositories provide database access.
5. **Database Layer:** MySQL stores recipes, user accounts, meal plans, shopping lists, and shopping-list items.

## Prerequisites

Install the following software before running the application:

- Java Development Kit (JDK) compatible with the project configuration.
- MySQL Server 8.
- Git.
- IntelliJ IDEA or another Java IDE.

The project includes Maven Wrapper scripts, so a separate Maven installation is not required.

## Setup and Installation

### 1. Clone the repository

```bash
git clone https://github.com/Sonmaleshruti/RecipeLoop.git
cd RecipeLoop
```

### 2. Select the application branch

The latest authentication and user-specific planning changes are on `feature/authentication`.

```bash
git checkout feature/authentication
```

### 3. Create the database

Open MySQL and execute:

```sql
CREATE DATABASE recipeloop;
```

### 4. Configure database credentials

Configure the database connection in `src/main/resources/application.properties`.

Set the MySQL JDBC URL, database username, and password for your local environment. Do not commit real database credentials or other secrets to GitHub.

Check the project's existing configuration before changing any property names.

### 5. Run the application

On Windows PowerShell:

```powershell
.\mvnw.cmd spring-boot:run
```

Alternatively, open the project in IntelliJ IDEA and run the main Spring Boot application class.

Once the application starts, open:

http://localhost:8080

## Running Tests

Run the automated test suite from the project root.

**Windows PowerShell:**

```powershell
.\mvnw.cmd test
```

To compile the application:

```powershell
.\mvnw.cmd compile
```

## Repository Structure

```text
RecipeLoop/
├── .mvn/
├── docs/
│   ├── requirements.md
│   ├── architecture.md
│   ├── database-design.md
│   ├── api-design.md
│   └── testing-plan.md
├── src/
│   ├── main/
│   │   ├── java/com/recipeloop/recipeloop/
│   │   │   ├── controllers
│   │   │   ├── services
│   │   │   ├── repositories
│   │   │   └── entities
│   │   └── resources/
│   │       └── static/
│   │           ├── index.html
│   │           ├── style.css
│   │           └── script.js
│   └── test/
├── .gitignore
├── mvnw
├── mvnw.cmd
├── pom.xml
├── PROJECT_PLAN.md
└── README.md
```

*Note: The Java files are organized in the main application package; the names above describe their responsibilities rather than separate package directories.*

## Project Status

**Current phase:** Core application implemented and manually verified.

Implemented functionality includes recipe management, authentication, user-specific meal planning, shopping-list generation with compatible ingredient aggregation, and content-based recipe recommendations.

The automated test suite has also been run successfully in the current development environment.

## Future Enhancements

Potential extensions include:

- Dietary preference and nutritional filtering.
- Ingredient inventory and expiry tracking.
- More advanced personalized recommendations.
- Recipe image uploads.
- Cloud deployment.

## Author

**Shruti Sonmale**

## Repository

[RecipeLoop on GitHub](https://github.com/Sonmaleshruti/RecipeLoop)
