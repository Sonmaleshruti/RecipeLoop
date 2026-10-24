
const API_URL = "/api/recipes";

const recipeGrid = document.getElementById("recipe-grid");
const recipeCount = document.getElementById("recipe-count");
const statusMessage = document.getElementById("status-message");
const emptyState = document.getElementById("empty-state");
const emptyTitle = document.getElementById("empty-title");
const emptyDescription = document.getElementById("empty-description");
const searchInput = document.getElementById("search-input");
const recipeForm = document.getElementById("recipe-form");
const recipeIdInput = document.getElementById("recipe-id");
const submitButton = document.getElementById("submit-button");
const cancelEditButton = document.getElementById("cancel-edit");
const formFeedback = document.getElementById("form-feedback");

let recipes = [];
let searchTerm = "";

let selectedRecipeId = null;

const detailOverlay = document.createElement("div");
detailOverlay.id = "recipe-detail-overlay";
detailOverlay.className = "recipe-detail-overlay";
detailOverlay.hidden = true;
detailOverlay.setAttribute("role", "dialog");
detailOverlay.setAttribute("aria-modal", "true");
detailOverlay.setAttribute("aria-labelledby", "recipe-detail-title");

detailOverlay.innerHTML = `
    <article class="recipe-detail-modal">
        <header class="recipe-detail-header">
            <button type="button" class="recipe-detail-close"
                id="recipe-detail-close" aria-label="Close recipe details">&times;</button>
            <div class="recipe-detail-emoji" id="detail-emoji" aria-hidden="true">&#129382;</div>
            <h2 class="recipe-detail-title" id="recipe-detail-title"></h2>
            <p class="recipe-detail-description" id="detail-description"></p>
            <div class="recipe-detail-meta" id="detail-meta"></div>
        </header>
        <div class="recipe-detail-body">
            <section class="recipe-detail-section">
                <h3>Ingredients</h3>
                <ul class="recipe-detail-ingredients" id="detail-ingredients"></ul>
            </section>
            <section class="recipe-detail-section">
                <h3>Instructions</h3>
                <div class="recipe-detail-instructions" id="detail-instructions"></div>
            </section>
        </div>

        <section class="recipe-detail-section recipe-recommendations-section">
            <h3>Similar Recipes</h3>
            <p class="recommendations-description">
                Recipes with ingredients and descriptions similar to this one.
            </p>
            <div id="recipe-recommendations" class="recipe-recommendations"
                 aria-live="polite">
                <p class="recommendations-message">Loading recommendations...</p>
            </div>
        </section>

        <div class="recipe-detail-actions">
            <button type="button" class="button button-secondary"
                id="detail-edit-button">Edit Recipe</button>
            <button type="button" class="button button-danger"
                id="detail-delete-button">Delete Recipe</button>
        </div>
    </article>
`;

document.body.appendChild(detailOverlay);

const foodEmojis = ["\uD83E\uDD57", "\uD83C\uDF72", "\uD83E\uDD51", "\uD83E\uDEB2", "\uD83E\uDD5E", "\uD83E\uDD6C", "\uD83E\uDD59", "\uD83C\uDF7D\uFE0F"];

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);
}

function showStatus(message, isError = false) {
    statusMessage.textContent = message;
    statusMessage.classList.toggle("error", isError);
    statusMessage.hidden = !message;
}

function showFormFeedback(message, isError = false) {
    formFeedback.textContent = message;
    formFeedback.classList.toggle("error", isError);
    formFeedback.hidden = !message;
}

async function readError(response) {
    try {
        const data = await response.json();

        if (data.message) {
            return data.message;
        }

        if (data.errors && Array.isArray(data.errors)) {
            return data.errors.join(", ");
        }

        if (data.fieldErrors && typeof data.fieldErrors === "object") {
            return Object.values(data.fieldErrors).join(", ");
        }

        return "The request could not be completed. Check the entered details.";
    } catch {
        return `Request failed with status ${response.status}.`;
    }
}

function getFilteredRecipes() {
    if (!searchTerm) {
        return recipes;
    }

    return recipes.filter(recipe => {
        const searchableText = [
            recipe.name,
            recipe.description,
            recipe.ingredients,
            recipe.instructions
        ].join(" ").toLowerCase();

        return searchableText.includes(searchTerm);
    });
}

function renderRecipes() {
    const filteredRecipes = getFilteredRecipes();

    recipeGrid.innerHTML = "";
    recipeCount.textContent =
        `${filteredRecipes.length} ${filteredRecipes.length === 1 ? "recipe" : "recipes"}`;

    if (filteredRecipes.length === 0) {
        emptyState.hidden = false;

        if (recipes.length === 0) {
            emptyTitle.textContent = "Your recipe collection starts here";
            emptyDescription.textContent =
                "Add your first recipe using the form to build your personal collection.";
        } else {
            emptyTitle.textContent = "No matching recipes found";
            emptyDescription.textContent =
                "Try another search term or clear the search field.";
        }

        return;
    }

    emptyState.hidden = true;

    filteredRecipes.forEach((recipe, index) => {
        const card = document.createElement("article");
        card.className = "recipe-card";

        const emoji = foodEmojis[index % foodEmojis.length];
        const ingredients = String(recipe.ingredients ?? "")
            .split(/[\n,]+/)
            .map(item => item.trim())
            .filter(Boolean);

        const ingredientPreview = ingredients.slice(0, 4)
            .map(ingredient => `<li>${escapeHtml(ingredient)}</li>`)
            .join("");

        const remainingIngredients = ingredients.length - 4;
        const extraIngredients = remainingIngredients > 0
            ? `<li class="more-ingredients">+${remainingIngredients} more</li>`
            : "";

        card.innerHTML = `
            <div class="recipe-card-visual">
                <span class="recipe-emoji" aria-hidden="true">${emoji}</span>
                <span class="recipe-time">${escapeHtml(recipe.prepTimeMinutes)} min</span>
            </div>
            <div class="recipe-card-content">
                <h3>${escapeHtml(recipe.name)}</h3>
                <p class="recipe-description">${escapeHtml(recipe.description)}</p>
                <div class="recipe-meta">
                    <span>&#9201; ${escapeHtml(recipe.prepTimeMinutes)} min</span>
                    <span>&#127869; ${escapeHtml(recipe.servings)} servings</span>
                </div>
                <div class="recipe-ingredients">
                    <h4>Ingredients</h4>
                    <ul>${ingredientPreview}${extraIngredients}</ul>
                </div>
                <details class="recipe-instructions">
                    <summary>View instructions</summary>
                    <p>${escapeHtml(recipe.instructions).replace(/\n/g, "<br>")}</p>
                </details>
                <div class="recipe-actions">
                    <button type="button" class="button button-secondary"
                        data-action="edit" data-id="${escapeHtml(recipe.id)}">Edit</button>
                    <button type="button" class="button button-danger"
                        data-action="delete" data-id="${escapeHtml(recipe.id)}">Delete</button>
                </div>
            </div>
        `;

        recipeGrid.appendChild(card);
    });
}

async function loadRecipes() {
    showStatus("Loading recipes...");

    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error(await readError(response));
        }

        const data = await response.json();
        recipes = Array.isArray(data) ? data : [];

        renderRecipes();
        populateMealPlanRecipeOptions();
        showStatus("");
    } catch (error) {
        showStatus(
            error instanceof TypeError
                ? "Could not connect to the backend. Ensure RecipeLoop is running."
                : error.message,
            true
        );
    }
}

function resetForm() {
    recipeForm.reset();
    recipeIdInput.value = "";
    submitButton.textContent = "Add Recipe";
    cancelEditButton.hidden = true;
    showFormFeedback("");
}

function startEditing(recipe) {
    recipeIdInput.value = recipe.id;
    document.getElementById("name").value = recipe.name ?? "";
    document.getElementById("description").value = recipe.description ?? "";
    document.getElementById("prepTimeMinutes").value = recipe.prepTimeMinutes ?? "";
    document.getElementById("servings").value = recipe.servings ?? "";
    document.getElementById("ingredients").value = recipe.ingredients ?? "";
    document.getElementById("instructions").value = recipe.instructions ?? "";

    submitButton.textContent = "Save Changes";
    cancelEditButton.hidden = false;
    showFormFeedback("");

    recipeForm.scrollIntoView({ behavior: "smooth", block: "start" });
    document.getElementById("name").focus();
}


function openRecipeDetails(recipe) {
    selectedRecipeId = String(recipe.id);

    const recipeIndex = recipes.findIndex(
        item => String(item.id) === selectedRecipeId
    );

    document.getElementById("detail-emoji").textContent =
        foodEmojis[Math.max(0, recipeIndex) % foodEmojis.length];

    document.getElementById("recipe-detail-title").textContent =
        recipe.name ?? "";

    document.getElementById("detail-description").textContent =
        recipe.description ?? "";

    document.getElementById("detail-meta").innerHTML = `
        <span>&#9201; ${escapeHtml(recipe.prepTimeMinutes)} minutes</span>
        <span>&#127869; ${escapeHtml(recipe.servings)} servings</span>
    `;

    const ingredientsList = document.getElementById("detail-ingredients");
    ingredientsList.replaceChildren();

    String(recipe.ingredients ?? "")
        .split(/\r?\n|,/)
        .map(item => item.trim())
        .filter(Boolean)
        .forEach(ingredient => {
            const listItem = document.createElement("li");
            listItem.textContent = ingredient;
            ingredientsList.appendChild(listItem);
        });

    if (!ingredientsList.children.length) {
        const item = document.createElement("li");
        item.textContent = "No ingredients listed.";
        ingredientsList.appendChild(item);
    }

    document.getElementById("detail-instructions").textContent =
        recipe.instructions ?? "No instructions provided.";

    detailOverlay.hidden = false;
    document.body.classList.add("recipe-detail-open");
    document.getElementById("recipe-detail-close").focus();
    loadRecommendations(recipe.id);
}

async function loadRecommendations(recipeId) {
    const container = document.getElementById("recipe-recommendations");

    container.replaceChildren();

    const loadingMessage = document.createElement("p");
    loadingMessage.className = "recommendations-message";
    loadingMessage.textContent = "Finding similar recipes...";
    container.appendChild(loadingMessage);

    try {
        const response = await fetch(
            `${API_URL}/${encodeURIComponent(recipeId)}/recommendations?limit=4`
        );

        if (!response.ok) {
            throw new Error(await readError(response));
        }

        const recommendations = await response.json();

        if (selectedRecipeId !== String(recipeId)) {
            return;
        }

        container.replaceChildren();

        if (!Array.isArray(recommendations) || recommendations.length === 0) {
            const message = document.createElement("p");
            message.className = "recommendations-message";
            message.textContent =
                "No similar recipes yet. Add more recipes to your collection.";
            container.appendChild(message);
            return;
        }

        recommendations.forEach(recipe => {
            const card = document.createElement("button");
            card.type = "button";
            card.className = "recommendation-card";

            const name = document.createElement("span");
            name.className = "recommendation-card-title";
            name.textContent = recipe.name ?? "Untitled recipe";

            const description = document.createElement("span");
            description.className = "recommendation-card-description";
            description.textContent = recipe.description ?? "";

            const score = Number(recipe.similarityScore);
            const similarity = document.createElement("span");
            similarity.className = "recommendation-card-score";
            similarity.textContent = Number.isFinite(score)
                ? `${(Math.max(0, Math.min(1, score)) * 100).toFixed(1)}% text similarity`
                : "Similar recipe";

            card.append(name, description, similarity);

            card.addEventListener("click", async () => {
                try {
                    const recipeResponse = await fetch(
                        `${API_URL}/${encodeURIComponent(recipe.id)}`
                    );

                    if (!recipeResponse.ok) {
                        throw new Error(await readError(recipeResponse));
                    }

                    const fullRecipe = await recipeResponse.json();
                    openRecipeDetails(fullRecipe);
                } catch (error) {
                    const message = document.createElement("p");
                    message.className = "recommendations-message";
                    message.textContent =
                        error.message || "Could not open this recipe.";

                    if (selectedRecipeId === String(recipeId)) {
                        container.replaceChildren(message);
                    }
                }
            });

            container.appendChild(card);
        });
    } catch (error) {
        if (selectedRecipeId !== String(recipeId)) {
            return;
        }

        container.replaceChildren();

        const message = document.createElement("p");
        message.className = "recommendations-message";
        message.textContent = "Could not load recommendations. Please try again.";
        container.appendChild(message);

        console.error("Recommendation loading failed:", error);
    }
}

function closeRecipeDetails() {
    detailOverlay.hidden = true;
    document.body.classList.remove("recipe-detail-open");
    selectedRecipeId = null;
}


recipeForm.addEventListener("submit", async event => {
    event.preventDefault();
    showFormFeedback("");

    const recipeId = recipeIdInput.value;

    const recipeData = {
        name: document.getElementById("name").value.trim(),
        description: document.getElementById("description").value.trim(),
        prepTimeMinutes: Number(document.getElementById("prepTimeMinutes").value),
        servings: Number(document.getElementById("servings").value),
        ingredients: document.getElementById("ingredients").value.trim(),
        instructions: document.getElementById("instructions").value.trim()
    };

    if (
        !recipeData.name ||
        !recipeData.description ||
        !recipeData.ingredients ||
        !recipeData.instructions ||
        !Number.isInteger(recipeData.prepTimeMinutes) ||
        recipeData.prepTimeMinutes < 1 ||
        !Number.isInteger(recipeData.servings) ||
        recipeData.servings < 1
    ) {
        showFormFeedback("Complete all fields with valid values before submitting.", true);
        return;
    }

    const isEditing = Boolean(recipeId);
    const url = isEditing
        ? `${API_URL}/${encodeURIComponent(recipeId)}`
        : API_URL;

    submitButton.disabled = true;
    submitButton.textContent = isEditing ? "Saving..." : "Adding...";

    try {
        const response = await fetch(url, {
            method: isEditing ? "PUT" : "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(recipeData)
        });

        if (!response.ok) {
            throw new Error(await readError(response));
        }

        resetForm();
        await loadRecipes();

        showFormFeedback(
            isEditing ? "Recipe updated successfully." : "Recipe added successfully."
        );

        document.getElementById("recipes").scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    } catch (error) {
        showFormFeedback(
            error instanceof TypeError
                ? "Could not connect to the backend. Ensure RecipeLoop is running."
                : error.message,
            true
        );
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = recipeIdInput.value ? "Save Changes" : "Add Recipe";
    }
});

recipeGrid.addEventListener("click", async event => {
    const button = event.target.closest("button[data-action]");

    if (!button) {
        return;
    }

    const recipe = recipes.find(
        item => String(item.id) === button.dataset.id
    );

    if (!recipe) {
        showStatus("Recipe not found. Refresh the list and try again.", true);
        return;
    }

    if (button.dataset.action === "edit") {
        startEditing(recipe);
        return;
    }

    if (button.dataset.action === "delete") {
        const confirmed = window.confirm(
            `Delete "${recipe.name}"? This action cannot be undone.`
        );

        if (!confirmed) {
            return;
        }

        button.disabled = true;

        try {
            const response = await fetch(
                `${API_URL}/${encodeURIComponent(recipe.id)}`,
                { method: "DELETE" }
            );

            if (!response.ok) {
                throw new Error(await readError(response));
            }

            if (String(recipeIdInput.value) === String(recipe.id)) {
                resetForm();
            }

            await loadRecipes();
            showStatus(`"${recipe.name}" was deleted successfully.`);
        } catch (error) {
            showStatus(
                error instanceof TypeError
                    ? "Could not connect to the backend. Ensure RecipeLoop is running."
                    : error.message,
                true
            );
            button.disabled = false;
        }
    }
});



searchInput.addEventListener("input", event => {
    searchTerm = event.target.value.trim().toLowerCase();
    renderRecipes();
});

document.getElementById("show-all").addEventListener("click", () => {
    searchInput.value = "";
    searchTerm = "";
    renderRecipes();
});

document.getElementById("refresh-recipes").addEventListener("click", loadRecipes);

cancelEditButton.addEventListener("click", resetForm);

loadRecipes();

document.getElementById("recipe-detail-close").addEventListener("click", () => {
    closeRecipeDetails();
});

detailOverlay.addEventListener("click", event => {
    if (event.target === detailOverlay) {
        closeRecipeDetails();
    }
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !detailOverlay.hidden) {
        closeRecipeDetails();
    }
});

document.getElementById("detail-edit-button").addEventListener("click", () => {
    const recipe = recipes.find(
        item => String(item.id) === selectedRecipeId
    );

    if (recipe) {
        closeRecipeDetails();
        startEditing(recipe);
    }
});

document.getElementById("detail-delete-button").addEventListener("click", async () => {
    const recipe = recipes.find(
        item => String(item.id) === selectedRecipeId
    );

    if (!recipe) {
        closeRecipeDetails();
        return;
    }

    const confirmed = window.confirm(
        `Delete "${recipe.name}"? This action cannot be undone.`
    );

    if (!confirmed) {
        return;
    }

    const deleteButton = document.getElementById("detail-delete-button");
    deleteButton.disabled = true;

    try {
        const response = await fetch(
            `${API_URL}/${encodeURIComponent(recipe.id)}`,
            { method: "DELETE" }
        );

        if (!response.ok) {
            throw new Error(await readError(response));
        }

        closeRecipeDetails();
        await loadRecipes();
        showStatus(`"${recipe.name}" was deleted successfully.`);
    } catch (error) {
        showStatus(
            error instanceof TypeError
                ? "Could not connect to the backend. Ensure RecipeLoop is running."
                : error.message,
            true
        );
    } finally {
        deleteButton.disabled = false;
    }
});

recipeGrid.addEventListener("click", event => {
    if (event.target.closest("button, a, summary, input, textarea, select, label")) {
        return;
    }

    const card = event.target.closest(".recipe-card");

    if (!card) {
        return;
    }

    const cardButtons = card.querySelectorAll("button[data-action]");
    const editButton = Array.from(cardButtons).find(
        button => button.dataset.action === "edit"
    );

    if (!editButton) {
        return;
    }

    const recipe = recipes.find(
        item => String(item.id) === editButton.dataset.id
    );

    if (recipe) {
        openRecipeDetails(recipe);
    }
});


const MEAL_PLAN_API_URL = "/api/meal-plans";

const mealCalendar = document.getElementById("meal-calendar");
const mealPlannerStatus = document.getElementById("meal-planner-status");
const mealWeekLabel = document.getElementById("meal-week-label");
const mealPlanForm = document.getElementById("meal-plan-form");
const mealPlanDate = document.getElementById("meal-plan-date");
const mealPlanType = document.getElementById("meal-plan-type");
const mealPlanRecipe = document.getElementById("meal-plan-recipe");
const mealPlanFormTitle = document.getElementById("meal-plan-form-title");
const saveMealPlanButton = document.getElementById("save-meal-plan");
const cancelMealEditButton = document.getElementById("cancel-meal-edit");

let mealPlans = [];
let editingMealPlanId = null;
let mealWeekStart = getMonday(new Date());

function formatLocalDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function parseLocalDate(dateString) {
    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day);
}

function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function getMonday(date) {
    const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const day = result.getDay();
    result.setDate(result.getDate() - (day === 0 ? 6 : day - 1));
    return result;
}

function displayDate(dateString, options = {}) {
    return parseLocalDate(dateString).toLocaleDateString("en-IN", options);
}

function setMealPlannerStatus(message, isError = false) {
    mealPlannerStatus.textContent = message;
    mealPlannerStatus.classList.toggle("is-error", isError);
}

function populateMealPlanRecipeOptions() {
    const previousValue = mealPlanRecipe.value;

    mealPlanRecipe.innerHTML = '<option value="">Select a recipe</option>';

    recipes.forEach(recipe => {
        const option = document.createElement("option");
        option.value = recipe.id;
        option.textContent = recipe.name;
        mealPlanRecipe.appendChild(option);
    });

    if (recipes.some(recipe => String(recipe.id) === previousValue)) {
        mealPlanRecipe.value = previousValue;
    }

    if (recipes.length === 0) {
        mealPlanRecipe.innerHTML =
            '<option value="">No recipes available</option>';
    }
}

function getRecipeName(plan) {
    return plan.recipe?.name || "Unnamed recipe";
}

function getMealTypeLabel(mealType) {
    const labels = {
        BREAKFAST: "Breakfast",
        LUNCH: "Lunch",
        DINNER: "Dinner",
        SNACK: "Snack"
    };

    return labels[mealType] || mealType;
}

function renderMealCalendar() {
    const weekEnd = addDays(mealWeekStart, 6);
    const startDate = formatLocalDate(mealWeekStart);
    const endDate = formatLocalDate(weekEnd);

    mealWeekLabel.textContent =
        `${displayDate(startDate, { day: "numeric", month: "short" })}` +
        ` – ${displayDate(endDate, {
            day: "numeric",
            month: "short",
            year: "numeric"
        })}`;

    const mealTypes = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"];
    const days = Array.from({ length: 7 }, (_, index) =>
        addDays(mealWeekStart, index)
    );

    mealCalendar.innerHTML = days.map(day => {
        const dateString = formatLocalDate(day);
        const dayPlans = mealPlans.filter(
            plan => plan.plannedDate === dateString
        );

        const mealSections = mealTypes.map(mealType => {
            const matchingPlans = dayPlans.filter(
                plan => plan.mealType === mealType
            );

            const planCards = matchingPlans.map(plan => `
                <article class="meal-plan-card">
                    <p class="meal-plan-recipe-name">
                        ${escapeHtml(getRecipeName(plan))}
                    </p>
                    <div class="meal-plan-card-actions">
                        <button type="button"
                                class="meal-edit-button"
                                data-meal-action="edit"
                                data-plan-id="${plan.id}">
                            Edit
                        </button>
                        <button type="button"
                                class="meal-delete-button"
                                data-meal-action="delete"
                                data-plan-id="${plan.id}">
                            Remove
                        </button>
                    </div>
                </article>
            `).join("");

            return `
                <div class="meal-slot">
                    <h4>${getMealTypeLabel(mealType)}</h4>
                    ${planCards || '<p class="meal-slot-empty">No meals planned</p>'}
                    <button type="button"
                            class="meal-add-slot-button"
                            data-meal-action="add"
                            data-date="${dateString}"
                            data-meal-type="${mealType}">
                        + Add meal
                    </button>
                </div>
            `;
        }).join("");

        return `
            <section class="meal-day-column">
                <header class="meal-day-header">
                    <span>${day.toLocaleDateString("en-IN", {
            weekday: "short"
        })}</span>
                    <strong>${day.getDate()}</strong>
                </header>
                ${mealSections}
            </section>
        `;
    }).join("");
}

async function loadMealPlans() {
    const startDate = formatLocalDate(mealWeekStart);
    const endDate = formatLocalDate(addDays(mealWeekStart, 6));

    setMealPlannerStatus("Loading meal plans...");

    try {
        const response = await fetch(
            `${MEAL_PLAN_API_URL}?startDate=${startDate}&endDate=${endDate}`
        );

        if (!response.ok) {
            throw new Error(await readError(response));
        }

        const data = await response.json();
        mealPlans = Array.isArray(data) ? data : [];
        renderMealCalendar();
        setMealPlannerStatus("");
    } catch (error) {
        mealPlans = [];
        renderMealCalendar();
        setMealPlannerStatus(
            error.message || "Could not load meal plans.",
            true
        );
    }
}

function resetMealPlanForm() {
    editingMealPlanId = null;
    mealPlanForm.reset();
    mealPlanDate.value = formatLocalDate(new Date());
    mealPlanFormTitle.textContent = "Add a meal";
    saveMealPlanButton.textContent = "Add to plan";
    cancelMealEditButton.hidden = true;
}

function openMealPlanForm(dateString, mealType = "BREAKFAST") {
    mealPlanDate.value = dateString;
    mealPlanType.value = mealType;
    document.getElementById("meal-plan-form-panel").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
    mealPlanRecipe.focus();
}

mealPlanForm.addEventListener("submit", async event => {
    event.preventDefault();

    const recipeId = Number(mealPlanRecipe.value);

    if (!recipeId || !mealPlanDate.value || !mealPlanType.value) {
        setMealPlannerStatus("Select a recipe, date, and meal type.", true);
        return;
    }

    const payload = {
        recipe: { id: recipeId },
        plannedDate: mealPlanDate.value,
        mealType: mealPlanType.value
    };

    const isEditing = editingMealPlanId !== null;
    const url = isEditing
        ? `${MEAL_PLAN_API_URL}/${editingMealPlanId}`
        : MEAL_PLAN_API_URL;

    try {
        saveMealPlanButton.disabled = true;
        setMealPlannerStatus(isEditing ? "Updating meal..." : "Adding meal...");

        const response = await fetch(url, {
            method: isEditing ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(await readError(response));
        }

        const savedDate = mealPlanDate.value;
        resetMealPlanForm();

        const savedDateObject = parseLocalDate(savedDate);
        mealWeekStart = getMonday(savedDateObject);

        await loadMealPlans();
        setMealPlannerStatus(
            isEditing ? "Meal plan updated." : "Meal added to your plan."
        );
    } catch (error) {
        setMealPlannerStatus(
            error.message || "Could not save the meal plan.",
            true
        );
    } finally {
        saveMealPlanButton.disabled = false;
    }
});

mealCalendar.addEventListener("click", async event => {
    const button = event.target.closest("button[data-meal-action]");

    if (!button) {
        return;
    }

    const action = button.dataset.mealAction;

    if (action === "add") {
        resetMealPlanForm();
        openMealPlanForm(button.dataset.date, button.dataset.mealType);
        return;
    }

    const planId = Number(button.dataset.planId);
    const plan = mealPlans.find(item => item.id === planId);

    if (!plan) {
        setMealPlannerStatus("This meal plan could not be found.", true);
        return;
    }

    if (action === "edit") {
        editingMealPlanId = plan.id;
        mealPlanDate.value = plan.plannedDate;
        mealPlanType.value = plan.mealType;
        mealPlanRecipe.value = String(plan.recipe?.id ?? "");
        mealPlanFormTitle.textContent = "Edit planned meal";
        saveMealPlanButton.textContent = "Save changes";
        cancelMealEditButton.hidden = false;

        document.getElementById("meal-plan-form-panel").scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
        return;
    }

    if (action === "delete") {
        const confirmed = window.confirm(
            `Remove "${getRecipeName(plan)}" from your meal plan?`
        );

        if (!confirmed) {
            return;
        }

        try {
            button.disabled = true;
            setMealPlannerStatus("Removing meal...");

            const response = await fetch(
                `${MEAL_PLAN_API_URL}/${plan.id}`,
                { method: "DELETE" }
            );

            if (!response.ok) {
                throw new Error(await readError(response));
            }

            await loadMealPlans();
            setMealPlannerStatus("Meal removed from your plan.");
        } catch (error) {
            setMealPlannerStatus(
                error.message || "Could not remove the meal.",
                true
            );
        }
    }
});

document.getElementById("previous-week").addEventListener("click", () => {
    mealWeekStart = addDays(mealWeekStart, -7);
    loadMealPlans();
    loadShoppingList();
});

document.getElementById("next-week").addEventListener("click", () => {
    mealWeekStart = addDays(mealWeekStart, 7);
    loadMealPlans();
    loadShoppingList();
});

document.getElementById("current-week").addEventListener("click", () => {
    mealWeekStart = getMonday(new Date());
    loadMealPlans();
    loadShoppingList();
});

cancelMealEditButton.addEventListener("click", () => {
    resetMealPlanForm();
    setMealPlannerStatus("");
});

mealPlanDate.value = formatLocalDate(new Date());
populateMealPlanRecipeOptions();
loadMealPlans();

// ==================== SHOPPING LIST ====================

const SHOPPING_LIST_API_URL = "/api/shopping-lists";
const SHOPPING_ITEM_API_URL = "/api/shopping-list-items";

const shoppingWeekLabel = document.getElementById("shopping-week-label");
const shoppingListStatus = document.getElementById("shopping-list-status");
const shoppingListItems = document.getElementById("shopping-list-items");
const shoppingListCount = document.getElementById("shopping-list-count");
const shoppingListProgress = document.getElementById("shopping-list-progress");
const generateShoppingListButton =
    document.getElementById("generate-shopping-list");

let shoppingListData = null;
let shoppingListRequestVersion = 0;

function setShoppingListStatus(message, isError = false) {
    shoppingListStatus.textContent = message;
    shoppingListStatus.classList.toggle("is-error", isError);
}

function updateShoppingWeekLabel() {
    const startDate = formatLocalDate(mealWeekStart);
    const endDate = formatLocalDate(addDays(mealWeekStart, 6));

    shoppingWeekLabel.textContent =
        `${displayDate(startDate, { day: "numeric", month: "short" })}` +
        ` – ${displayDate(endDate, {
            day: "numeric",
            month: "short",
            year: "numeric"
        })}`;
}

function renderShoppingList() {
    const items = shoppingListData?.items ?? [];
    const purchasedCount = items.filter(item => item.purchased).length;

    shoppingListCount.textContent =
        `${items.length} ${items.length === 1 ? "item" : "items"}`;
    shoppingListProgress.textContent =
        `${purchasedCount} purchased · ${items.length - purchasedCount} remaining`;

    if (items.length === 0) {
        shoppingListItems.innerHTML = `
            <div class="shopping-list-empty">
                <h3>Your list is empty</h3>
                <p>Add meals to this week, then generate your shopping list.</p>
            </div>
        `;
        return;
    }

    shoppingListItems.innerHTML = items.map(item => `
        <label class="shopping-list-item ${item.purchased ? "is-purchased" : ""}">
            <input
                type="checkbox"
                data-shopping-item-id="${item.id}"
                ${item.purchased ? "checked" : ""}
                aria-label="Mark ${escapeHtml(item.displayText)} as purchased">
            <span class="shopping-item-text">${escapeHtml(item.displayText)}</span>
            <span class="shopping-item-state">
                ${item.purchased ? "Purchased" : "To buy"}
            </span>
        </label>
    `).join("");
}

async function loadShoppingList() {
    const requestVersion = ++shoppingListRequestVersion;
    const weekStartDate = formatLocalDate(mealWeekStart);

    updateShoppingWeekLabel();
    shoppingListItems.innerHTML =
        '<p class="shopping-list-empty">Loading shopping list...</p>';
    setShoppingListStatus("");

    try {
        const response = await fetch(
            `${SHOPPING_LIST_API_URL}?weekStartDate=${weekStartDate}`
        );

        if (!response.ok) {
            throw new Error(await readError(response));
        }

        const data = await response.json();

        if (requestVersion !== shoppingListRequestVersion) {
            return;
        }

        shoppingListData = data;
        renderShoppingList();
    } catch (error) {
        if (requestVersion !== shoppingListRequestVersion) {
            return;
        }

        shoppingListData = null;
        shoppingListItems.innerHTML = `
            <p class="shopping-list-empty">
                Could not load the shopping list. Check that RecipeLoop is running.
            </p>
        `;
        shoppingListCount.textContent = "— items";
        shoppingListProgress.textContent = "— purchased";
        setShoppingListStatus(
            error.message || "Could not load the shopping list.",
            true
        );
    }
}

generateShoppingListButton.addEventListener("click", async () => {
    const weekStartDate = formatLocalDate(mealWeekStart);

    generateShoppingListButton.disabled = true;
    setShoppingListStatus("Generating shopping list...");

    try {
        const response = await fetch(
            `${SHOPPING_LIST_API_URL}/generate?weekStartDate=${weekStartDate}`,
            { method: "POST" }
        );

        if (!response.ok) {
            throw new Error(await readError(response));
        }

        shoppingListData = await response.json();
        renderShoppingList();
        setShoppingListStatus("Shopping list generated successfully.");
    } catch (error) {
        setShoppingListStatus(
            error.message || "Could not generate the shopping list.",
            true
        );
    } finally {
        generateShoppingListButton.disabled = false;
    }
});

shoppingListItems.addEventListener("change", async event => {
    const checkbox = event.target.closest(
        'input[data-shopping-item-id]'
    );

    if (!checkbox) {
        return;
    }

    const itemId = Number(checkbox.dataset.shoppingItemId);
    const item = shoppingListData?.items?.find(
        listItem => listItem.id === itemId
    );

    if (!item) {
        return;
    }

    const previousValue = item.purchased;
    const requestedValue = checkbox.checked;

    checkbox.disabled = true;
    item.purchased = requestedValue;
    renderShoppingList();

    const updatedCheckbox = shoppingListItems.querySelector(
        `input[data-shopping-item-id="${itemId}"]`
    );
    if (updatedCheckbox) {
        updatedCheckbox.disabled = true;
    }

    try {
        const response = await fetch(
            `${SHOPPING_ITEM_API_URL}/${itemId}/purchased`,
            {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ purchased: requestedValue })
            }
        );

        if (!response.ok) {
            throw new Error(await readError(response));
        }

        const updatedItem = await response.json();
        const currentItem = shoppingListData?.items?.find(
            listItem => listItem.id === itemId
        );

        if (currentItem) {
            currentItem.purchased = updatedItem.purchased;
        }

        renderShoppingList();
        setShoppingListStatus(
            updatedItem.purchased
                ? "Item marked as purchased."
                : "Item marked as not purchased."
        );
    } catch (error) {
        const currentItem = shoppingListData?.items?.find(
            listItem => listItem.id === itemId
        );

        if (currentItem) {
            currentItem.purchased = previousValue;
        }

        renderShoppingList();
        setShoppingListStatus(
            error.message || "Could not update the purchased status.",
            true
        );
    }
});

loadShoppingList();
