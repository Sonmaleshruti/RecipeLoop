
"use strict";

// ==================== API CONFIGURATION ====================

const API_URL = "/api/recipes";
const MEAL_PLAN_API_URL = "/api/meal-plans";
const SHOPPING_LIST_API_URL = "/api/shopping-lists";
const SHOPPING_ITEM_API_URL = "/api/shopping-list-items";

async function apiFetch(url, options = {}) {
    const method = (options.method || "GET").toUpperCase();
    const headers = new Headers(options.headers || {});

    if (!["GET", "HEAD", "OPTIONS", "TRACE"].includes(method)) {
        const csrfResponse = await fetch("/api/auth/csrf", {
            credentials: "same-origin"
        });

        if (!csrfResponse.ok) {
            throw new Error(
                "Could not obtain the security token. Refresh and try again."
            );
        }

        const csrfToken = (await csrfResponse.text()).trim();

        if (!csrfToken) {
            throw new Error(
                "The security token was empty. Refresh and try again."
            );
        }

        headers.set("X-XSRF-TOKEN", csrfToken);
    }

    return fetch(url, {
        ...options,
        headers,
        credentials: "same-origin"
    });
}

// ==================== DOM ELEMENTS ====================

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

const authSection = document.getElementById("auth-section");
const authForm = document.getElementById("auth-form");
const authNameGroup = document.getElementById("auth-name-group");
const authName = document.getElementById("auth-name");
const authEmail = document.getElementById("auth-email");
const authPassword = document.getElementById("auth-password");
const authHeading = document.getElementById("auth-heading");
const authDescription = document.getElementById("auth-description");
const authSubmit = document.getElementById("auth-submit");
const authFeedback = document.getElementById("auth-feedback");
const authUserStatus = document.getElementById("auth-user-status");
const showLoginButton = document.getElementById("show-login");
const showRegisterButton = document.getElementById("show-register");
const authCancelButton = document.getElementById("auth-cancel");
const logoutButton = document.getElementById("logout-button");

const mealPlannerSection = document.getElementById("meal-planner");
const shoppingSection = document.getElementById("shopping-list-section");

let currentUser = null;
let authMode = "login";
let recipes = [];
let searchTerm = "";
let selectedRecipeId = null;

const foodEmojis = [
    "\uD83E\uDD57", "\uD83C\uDF72", "\uD83E\uDD51", "\uD83E\uDEB2",
    "\uD83E\uDD5E", "\uD83E\uDD6C", "\uD83E\uDD59", "\uD83C\uDF7D\uFE0F"
];

// ==================== SHARED HELPERS ====================

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

function showAuthFeedback(
    message,
    isError = false,
    isSuccess = false
) {
    authFeedback.textContent = message;
    authFeedback.classList.toggle("error", isError);
    authFeedback.classList.toggle("success", isSuccess);
    authFeedback.hidden = !message;
}

async function readError(response) {
    try {
        const data = await response.json();

        if (data.message) {
            return data.message;
        }

        if (Array.isArray(data.errors)) {
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

// ==================== AUTHENTICATION ====================

function showAuthForm(mode) {
    authMode = mode;
    authForm.reset();
    showAuthFeedback("");

    const registering = mode === "register";

    authHeading.textContent = registering
        ? "Create your RecipeLoop account"
        : "Log in to RecipeLoop";

    authDescription.textContent = registering
        ? "Create an account to manage your personal meal plans and shopping lists."
        : "Access your personal meal planner and shopping list.";

    authNameGroup.hidden = !registering;
    authName.required = registering;

    authPassword.autocomplete = registering
        ? "new-password"
        : "current-password";

    authSubmit.textContent = registering
        ? "Create account"
        : "Log in";

    authSubmit.disabled = false;
    authSection.hidden = false;

    authSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    if (registering) {
        authName.focus();
    } else {
        authEmail.focus();
    }
}

function updateAuthenticationUI() {
    const loggedIn = Boolean(currentUser);

    authUserStatus.textContent = loggedIn
        ? `Signed in as ${currentUser.name || currentUser.email}`
        : "Not signed in";

    showLoginButton.hidden = loggedIn;
    showRegisterButton.hidden = loggedIn;
    logoutButton.hidden = !loggedIn;

    mealPlannerSection.hidden = !loggedIn;
    shoppingSection.hidden = !loggedIn;

    if (!loggedIn) {
        mealPlans = [];
        renderMealCalendar();

        shoppingListData = null;
        shoppingListRequestVersion++;

        shoppingListItems.innerHTML =
            '<p class="shopping-list-empty">Log in to access your shopping list.</p>';

        shoppingListCount.textContent = "0 items";
        shoppingListProgress.textContent = "0 purchased";

        setMealPlannerStatus(
            "Log in to use your personal meal planner."
        );

        setShoppingListStatus(
            "Log in to access your personal shopping list."
        );
    } else {
        setMealPlannerStatus("");
        setShoppingListStatus("");
    }
}

async function refreshAuthentication() {
    try {
        const response = await apiFetch("/api/auth/me");

        if (response.status === 401 || response.status === 403) {
            currentUser = null;
            updateAuthenticationUI();
            authSection.hidden = true;
            return;
        }

        if (!response.ok) {
            throw new Error(await readError(response));
        }

        currentUser = await response.json();

        updateAuthenticationUI();
        authSection.hidden = true;

        await Promise.all([
            loadMealPlans(),
            loadShoppingList()
        ]);
    } catch (error) {
        console.error(
            "Could not check the authentication session:",
            error
        );

        // Do not claim that a session check succeeded.
        // On initial page load, keep personal sections inaccessible
        // until the server can confirm the authenticated user.
        if (!currentUser) {
            updateAuthenticationUI();
            authUserStatus.textContent = "Session status unavailable";
        }

        authSection.hidden = true;

        showStatus(
            "Could not verify your session. Check your connection and refresh the page.",
            true
        );
    }
}

authForm.addEventListener("submit", async event => {
    event.preventDefault();
    showAuthFeedback("");

    const registering = authMode === "register";

    const payload = {
        email: authEmail.value.trim(),
        password: authPassword.value
    };

    if (registering) {
        payload.name = authName.value.trim();

        if (!payload.name) {
            showAuthFeedback("Please enter your name.", true);
            authName.focus();
            return;
        }
    }

    if (!payload.email || !payload.password) {
        showAuthFeedback("Enter your email and password.", true);
        return;
    }

    if (registering && payload.password.length < 8) {
        showAuthFeedback(
            "Your password must contain at least 8 characters.",
            true
        );
        authPassword.focus();
        return;
    }

    const originalMode = authMode;

    authSubmit.disabled = true;
    authSubmit.textContent = registering
        ? "Creating account..."
        : "Logging in...";

    try {
        const response = await apiFetch(
            registering
                ? "/api/auth/register"
                : "/api/auth/login",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            }
        );

        if (!response.ok) {
            throw new Error(await readError(response));
        }

        const registeredEmail = payload.email;

        if (registering) {
            // Registration creates an account but does not automatically
            // log the user in. Switch to the login form.
            authMode = "login";

            authHeading.textContent = "Log in to RecipeLoop";
            authDescription.textContent =
                "Your account has been created. Log in to continue.";

            authNameGroup.hidden = true;
            authName.required = false;
            authPassword.autocomplete = "current-password";

            authForm.reset();
            authEmail.value = registeredEmail;
            authPassword.value = "";

            authSubmit.textContent = "Log in";

            showAuthFeedback(
                "Account created successfully. You can now log in.",
                false,
                true
            );

            authEmail.focus();
            return;
        }

        // The login endpoint establishes the server-side session.
        authForm.reset();
        await refreshAuthentication();

        if (currentUser) {
            authSection.hidden = true;
            showStatus("You are now logged in.");
        }
    } catch (error) {
        showAuthFeedback(
            error.message || "Authentication failed.",
            true
        );
    } finally {
        authSubmit.disabled = false;

        authSubmit.textContent = authMode === "register"
            ? "Create account"
            : "Log in";
    }
});

showLoginButton.addEventListener("click", () => {
    showAuthForm("login");
});

showRegisterButton.addEventListener("click", () => {
    showAuthForm("register");
});

authCancelButton.addEventListener("click", () => {
    authSection.hidden = true;
    showAuthFeedback("");
});

logoutButton.addEventListener("click", async () => {
    logoutButton.disabled = true;

    try {
        const response = await apiFetch("/api/auth/logout", {
            method: "POST"
        });

        if (!response.ok) {
            throw new Error(await readError(response));
        }

        currentUser = null;
        authSection.hidden = true;

        updateAuthenticationUI();
        showStatus("You have been logged out.");
    } catch (error) {
        showStatus(error.message || "Could not log out.", true);
    } finally {
        logoutButton.disabled = false;
    }
});

// ==================== RECIPES ====================

function getFilteredRecipes() {
    if (!searchTerm) {
        return recipes;
    }

    return recipes.filter(recipe => [
        recipe.name,
        recipe.description,
        recipe.ingredients,
        recipe.instructions
    ].join(" ").toLowerCase().includes(searchTerm));
}

function renderRecipes() {
    const filteredRecipes = getFilteredRecipes();

    recipeGrid.innerHTML = "";

    recipeCount.textContent =
        `${filteredRecipes.length} ${filteredRecipes.length === 1 ? "recipe" : "recipes"}`;

    if (filteredRecipes.length === 0) {
        emptyState.hidden = false;

        emptyTitle.textContent = recipes.length === 0
            ? "Your recipe collection starts here"
            : "No matching recipes found";

        emptyDescription.textContent = recipes.length === 0
            ? "Add your first recipe using the form to build the RecipeLoop collection."
            : "Try another search term or clear the search field.";

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

        const ingredientPreview = ingredients
            .slice(0, 4)
            .map(item => `<li>${escapeHtml(item)}</li>`)
            .join("");

        const remaining = ingredients.length - 4;

        const extra = remaining > 0
            ? `<li class="more-ingredients">+${remaining} more</li>`
            : "";

        card.innerHTML = `
            <div class="recipe-card-visual">
                <span class="recipe-emoji" aria-hidden="true">${emoji}</span>
                <span class="recipe-time">${escapeHtml(recipe.prepTimeMinutes)} min</span>
            </div>

            <div class="recipe-card-content">
                <h3>${escapeHtml(recipe.name)}</h3>

                <p class="recipe-description">
                    ${escapeHtml(recipe.description)}
                </p>

                <div class="recipe-meta">
                    <span>&#9201; ${escapeHtml(recipe.prepTimeMinutes)} min</span>
                    <span>&#127869; ${escapeHtml(recipe.servings)} servings</span>
                </div>

                <div class="recipe-ingredients">
                    <h4>Ingredients</h4>
                    <ul>${ingredientPreview}${extra}</ul>
                </div>

                <details class="recipe-instructions">
                    <summary>View instructions</summary>
                    <p>${escapeHtml(recipe.instructions).replace(/\n/g, "<br>")}</p>
                </details>

                <div class="recipe-actions">
                    <button type="button"
                        class="button button-secondary"
                        data-action="edit"
                        data-id="${escapeHtml(recipe.id)}">Edit</button>

                    <button type="button"
                        class="button button-danger"
                        data-action="delete"
                        data-id="${escapeHtml(recipe.id)}">Delete</button>
                </div>
            </div>
        `;

        recipeGrid.appendChild(card);
    });
}

async function loadRecipes() {
    showStatus("Loading recipes...");

    try {
        const response = await apiFetch(API_URL);

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
    document.getElementById("prepTimeMinutes").value =
        recipe.prepTimeMinutes ?? "";
    document.getElementById("servings").value = recipe.servings ?? "";
    document.getElementById("ingredients").value = recipe.ingredients ?? "";
    document.getElementById("instructions").value = recipe.instructions ?? "";

    submitButton.textContent = "Save Changes";
    cancelEditButton.hidden = false;

    showFormFeedback("");

    recipeForm.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    document.getElementById("name").focus();
}

// ==================== RECIPE DETAILS AND RECOMMENDATIONS ====================

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
            <button type="button"
                class="recipe-detail-close"
                id="recipe-detail-close"
                aria-label="Close recipe details">&times;</button>

            <div class="recipe-detail-emoji"
                id="detail-emoji"
                aria-hidden="true">&#129382;</div>

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

            <div id="recipe-recommendations"
                class="recipe-recommendations"
                aria-live="polite">
                <p class="recommendations-message">Loading recommendations...</p>
            </div>
        </section>

        <div class="recipe-detail-actions">
            <button type="button"
                class="button button-secondary"
                id="detail-edit-button">Edit Recipe</button>

            <button type="button"
                class="button button-danger"
                id="detail-delete-button">Delete Recipe</button>
        </div>
    </article>
`;

document.body.appendChild(detailOverlay);

function openRecipeDetails(recipe) {
    selectedRecipeId = String(recipe.id);

    const index = recipes.findIndex(
        item => String(item.id) === selectedRecipeId
    );

    document.getElementById("detail-emoji").textContent =
        foodEmojis[Math.max(0, index) % foodEmojis.length];

    document.getElementById("recipe-detail-title").textContent =
        recipe.name ?? "";

    document.getElementById("detail-description").textContent =
        recipe.description ?? "";

    document.getElementById("detail-meta").innerHTML = `
        <span>&#9201; ${escapeHtml(recipe.prepTimeMinutes)} minutes</span>
        <span>&#127869; ${escapeHtml(recipe.servings)} servings</span>
    `;

    const ingredientList = document.getElementById("detail-ingredients");
    ingredientList.replaceChildren();

    String(recipe.ingredients ?? "")
        .split(/\r?\n|,/)
        .map(item => item.trim())
        .filter(Boolean)
        .forEach(ingredient => {
            const li = document.createElement("li");
            li.textContent = ingredient;
            ingredientList.appendChild(li);
        });

    if (!ingredientList.children.length) {
        const li = document.createElement("li");
        li.textContent = "No ingredients listed.";
        ingredientList.appendChild(li);
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

    container.textContent = "Finding similar recipes...";

    try {
        const response = await apiFetch(
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
                    const result = await apiFetch(
                        `${API_URL}/${encodeURIComponent(recipe.id)}`
                    );

                    if (!result.ok) {
                        throw new Error(await readError(result));
                    }

                    openRecipeDetails(await result.json());
                } catch (error) {
                    console.error("Could not open recommended recipe:", error);

                    if (selectedRecipeId === String(recipeId)) {
                        const message = document.createElement("p");
                        message.className = "recommendations-message";
                        message.textContent = "Could not open this recipe.";
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

        container.textContent =
            "Could not load recommendations. Please try again.";

        console.error("Recommendation loading failed:", error);
    }
}

function closeRecipeDetails() {
    detailOverlay.hidden = true;
    document.body.classList.remove("recipe-detail-open");
    selectedRecipeId = null;
}

document.getElementById("recipe-detail-close").addEventListener(
    "click",
    closeRecipeDetails
);

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

document.getElementById("detail-delete-button").addEventListener(
    "click",
    async () => {
        const recipe = recipes.find(
            item => String(item.id) === selectedRecipeId
        );

        if (!recipe) {
            closeRecipeDetails();
            return;
        }

        if (!window.confirm(
            `Delete "${recipe.name}"? This action cannot be undone.`
        )) {
            return;
        }

        const button = document.getElementById("detail-delete-button");
        button.disabled = true;

        try {
            const response = await apiFetch(
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
            showStatus(error.message || "Could not delete the recipe.", true);
        } finally {
            button.disabled = false;
        }
    }
);

// ==================== RECIPE FORM AND CARD EVENTS ====================

recipeForm.addEventListener("submit", async event => {
    event.preventDefault();
    showFormFeedback("");

    const recipeId = recipeIdInput.value;

    const recipeData = {
        name: document.getElementById("name").value.trim(),
        description: document.getElementById("description").value.trim(),
        prepTimeMinutes: Number(
            document.getElementById("prepTimeMinutes").value
        ),
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
        showFormFeedback(
            "Complete all fields with valid values before submitting.",
            true
        );
        return;
    }

    const editing = Boolean(recipeId);

    submitButton.disabled = true;
    submitButton.textContent = editing ? "Saving..." : "Adding...";

    try {
        const response = await apiFetch(
            editing
                ? `${API_URL}/${encodeURIComponent(recipeId)}`
                : API_URL,
            {
                method: editing ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(recipeData)
            }
        );

        if (!response.ok) {
            throw new Error(await readError(response));
        }

        resetForm();
        await loadRecipes();

        showFormFeedback(
            editing
                ? "Recipe updated successfully."
                : "Recipe added successfully."
        );

        document.getElementById("recipes").scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    } catch (error) {
        showFormFeedback(
            error.message || "Could not save the recipe.",
            true
        );
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = recipeIdInput.value
            ? "Save Changes"
            : "Add Recipe";
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
        if (!window.confirm(
            `Delete "${recipe.name}"? This action cannot be undone.`
        )) {
            return;
        }

        button.disabled = true;

        try {
            const response = await apiFetch(
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
            showStatus(error.message || "Could not delete the recipe.", true);
            button.disabled = false;
        }
    }
});

recipeGrid.addEventListener("click", event => {
    if (event.target.closest(
        "button, a, summary, input, textarea, select, label"
    )) {
        return;
    }

    const card = event.target.closest(".recipe-card");

    if (!card) {
        return;
    }

    const editButton = card.querySelector('button[data-action="edit"]');

    const recipe = recipes.find(
        item => String(item.id) === editButton?.dataset.id
    );

    if (recipe) {
        openRecipeDetails(recipe);
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

document.getElementById("refresh-recipes").addEventListener(
    "click",
    loadRecipes
);

cancelEditButton.addEventListener("click", resetForm);

// ==================== MEAL PLANNER ====================

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

function parseLocalDate(value) {
    const [year, month, day] = value.split("-").map(Number);

    return new Date(year, month - 1, day);
}

function addDays(date, days) {
    const result = new Date(date);

    result.setDate(result.getDate() + days);

    return result;
}

function getMonday(date) {
    const result = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
    );

    const day = result.getDay();

    result.setDate(
        result.getDate() - (day === 0 ? 6 : day - 1)
    );

    return result;
}

function displayDate(value, options = {}) {
    return parseLocalDate(value).toLocaleDateString("en-IN", options);
}

function setMealPlannerStatus(message, isError = false) {
    mealPlannerStatus.textContent = message;
    mealPlannerStatus.classList.toggle("is-error", isError);
}

function populateMealPlanRecipeOptions() {
    const previousValue = mealPlanRecipe.value;

    mealPlanRecipe.innerHTML =
        '<option value="">Select a recipe</option>';

    recipes.forEach(recipe => {
        const option = document.createElement("option");

        option.value = recipe.id;
        option.textContent = recipe.name;

        mealPlanRecipe.appendChild(option);
    });

    if (recipes.some(recipe => String(recipe.id) === previousValue)) {
        mealPlanRecipe.value = previousValue;
    }

    if (!recipes.length) {
        mealPlanRecipe.innerHTML =
            '<option value="">No recipes available</option>';
    }
}

function getRecipeName(plan) {
    return plan.recipe?.name || "Unnamed recipe";
}

function getMealTypeLabel(type) {
    return ({
        BREAKFAST: "Breakfast",
        LUNCH: "Lunch",
        DINNER: "Dinner",
        SNACK: "Snack"
    })[type] || type;
}

function renderMealCalendar() {
    const start = formatLocalDate(mealWeekStart);
    const end = formatLocalDate(addDays(mealWeekStart, 6));

    mealWeekLabel.textContent =
        `${displayDate(start, { day: "numeric", month: "short" })}` +
        ` – ${displayDate(end, { day: "numeric", month: "short", year: "numeric" })}`;

    const types = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"];

    const days = Array.from(
        { length: 7 },
        (_, index) => addDays(mealWeekStart, index)
    );

    mealCalendar.innerHTML = days.map(day => {
        const date = formatLocalDate(day);

        const dayPlans = mealPlans.filter(
            plan => plan.plannedDate === date
        );

        const sections = types.map(type => {
            const matching = dayPlans.filter(
                plan => plan.mealType === type
            );

            const cards = matching.map(plan => `
                <article class="meal-plan-card">
                    <p class="meal-plan-recipe-name">
                        ${escapeHtml(getRecipeName(plan))}
                    </p>

                    <div class="meal-plan-card-actions">
                        <button type="button"
                            class="meal-edit-button"
                            data-meal-action="edit"
                            data-plan-id="${escapeHtml(plan.id)}">Edit</button>

                        <button type="button"
                            class="meal-delete-button"
                            data-meal-action="delete"
                            data-plan-id="${escapeHtml(plan.id)}">Remove</button>
                    </div>
                </article>
            `).join("");

            return `
                <div class="meal-slot">
                    <h4>${getMealTypeLabel(type)}</h4>

                    ${cards || '<p class="meal-slot-empty">No meals planned</p>'}

                    <button type="button"
                        class="meal-add-slot-button"
                        data-meal-action="add"
                        data-date="${date}"
                        data-meal-type="${type}">
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

                ${sections}
            </section>
        `;
    }).join("");
}

async function loadMealPlans() {
    if (!currentUser) {
        renderMealCalendar();
        return;
    }

    const start = formatLocalDate(mealWeekStart);
    const end = formatLocalDate(addDays(mealWeekStart, 6));

    setMealPlannerStatus("Loading meal plans...");

    try {
        const response = await apiFetch(
            `${MEAL_PLAN_API_URL}?startDate=${start}&endDate=${end}`
        );

        if (response.status === 401 || response.status === 403) {
            currentUser = null;
            updateAuthenticationUI();
            return;
        }

        if (!response.ok) {
            throw new Error(await readError(response));
        }

        const data = await response.json();

        mealPlans = Array.isArray(data) ? data : [];

        renderMealCalendar();
        setMealPlannerStatus("");
    } catch (error) {
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

function openMealPlanForm(date, type = "BREAKFAST") {
    resetMealPlanForm();

    mealPlanDate.value = date;
    mealPlanType.value = type;

    document.getElementById("meal-plan-form-panel").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    mealPlanRecipe.focus();
}

mealPlanForm.addEventListener("submit", async event => {
    event.preventDefault();

    if (!currentUser) {
        showAuthForm("login");
        return;
    }

    const recipeId = Number(mealPlanRecipe.value);

    if (!recipeId || !mealPlanDate.value || !mealPlanType.value) {
        setMealPlannerStatus(
            "Select a recipe, date, and meal type.",
            true
        );
        return;
    }

    const payload = {
        recipe: { id: recipeId },
        plannedDate: mealPlanDate.value,
        mealType: mealPlanType.value
    };

    const editing = editingMealPlanId !== null;

    const url = editing
        ? `${MEAL_PLAN_API_URL}/${encodeURIComponent(editingMealPlanId)}`
        : MEAL_PLAN_API_URL;

    try {
        saveMealPlanButton.disabled = true;

        setMealPlannerStatus(
            editing ? "Updating meal..." : "Adding meal..."
        );

        const response = await apiFetch(url, {
            method: editing ? "PUT" : "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(await readError(response));
        }

        mealWeekStart = getMonday(
            parseLocalDate(mealPlanDate.value)
        );

        resetMealPlanForm();

        await loadMealPlans();
        await loadShoppingList();

        setMealPlannerStatus(
            editing ? "Meal plan updated." : "Meal added to your plan."
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

    if (button.dataset.mealAction === "add") {
        openMealPlanForm(
            button.dataset.date,
            button.dataset.mealType
        );
        return;
    }

    const id = Number(button.dataset.planId);

    const plan = mealPlans.find(
        item => Number(item.id) === id
    );

    if (!plan) {
        setMealPlannerStatus(
            "This meal plan could not be found.",
            true
        );
        return;
    }

    if (button.dataset.mealAction === "edit") {
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

    if (button.dataset.mealAction === "delete") {
        if (!window.confirm(
            `Remove "${getRecipeName(plan)}" from your meal plan?`
        )) {
            return;
        }

        button.disabled = true;

        try {
            const response = await apiFetch(
                `${MEAL_PLAN_API_URL}/${encodeURIComponent(plan.id)}`,
                { method: "DELETE" }
            );

            if (!response.ok) {
                throw new Error(await readError(response));
            }

            await loadMealPlans();
            await loadShoppingList();

            setMealPlannerStatus("Meal removed from your plan.");
        } catch (error) {
            setMealPlannerStatus(
                error.message || "Could not remove the meal.",
                true
            );
        } finally {
            button.disabled = false;
        }
    }
});

function navigateMealWeek(offset) {
    mealWeekStart = addDays(mealWeekStart, offset);

    renderMealCalendar();
    updateShoppingWeekLabel();

    if (currentUser) {
        loadMealPlans();
        loadShoppingList();
    }
}

document.getElementById("previous-week").addEventListener("click", () => {
    navigateMealWeek(-7);
});

document.getElementById("next-week").addEventListener("click", () => {
    navigateMealWeek(7);
});

document.getElementById("current-week").addEventListener("click", () => {
    mealWeekStart = getMonday(new Date());

    renderMealCalendar();
    updateShoppingWeekLabel();

    if (currentUser) {
        loadMealPlans();
        loadShoppingList();
    }
});

cancelMealEditButton.addEventListener("click", () => {
    resetMealPlanForm();
    setMealPlannerStatus("");
});

mealPlanDate.value = formatLocalDate(new Date());
populateMealPlanRecipeOptions();

// ==================== SHOPPING LIST ====================

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
    const start = formatLocalDate(mealWeekStart);
    const end = formatLocalDate(addDays(mealWeekStart, 6));

    shoppingWeekLabel.textContent =
        `${displayDate(start, { day: "numeric", month: "short" })}` +
        ` – ${displayDate(end, { day: "numeric", month: "short", year: "numeric" })}`;
}

function renderShoppingList() {
    const items = shoppingListData?.items ?? [];
    const purchased = items.filter(item => item.purchased).length;

    shoppingListCount.textContent =
        `${items.length} ${items.length === 1 ? "item" : "items"}`;

    shoppingListProgress.textContent =
        `${purchased} purchased · ${items.length - purchased} remaining`;

    if (!items.length) {
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
            <input type="checkbox"
                data-shopping-item-id="${escapeHtml(item.id)}"
                ${item.purchased ? "checked" : ""}
                aria-label="Mark ${escapeHtml(item.displayText)} as purchased">

            <span class="shopping-item-text">
                ${escapeHtml(item.displayText)}
            </span>

            <span class="shopping-item-state">
                ${item.purchased ? "Purchased" : "To buy"}
            </span>
        </label>
    `).join("");
}

async function loadShoppingList() {
    if (!currentUser) {
        updateShoppingWeekLabel();
        return;
    }

    const version = ++shoppingListRequestVersion;
    const weekStartDate = formatLocalDate(mealWeekStart);

    updateShoppingWeekLabel();

    shoppingListItems.innerHTML =
        '<p class="shopping-list-empty">Loading shopping list...</p>';

    setShoppingListStatus("");

    try {
        const response = await apiFetch(
            `${SHOPPING_LIST_API_URL}?weekStartDate=${weekStartDate}`
        );

        if (response.status === 401 || response.status === 403) {
            currentUser = null;
            updateAuthenticationUI();
            return;
        }

        if (!response.ok) {
            throw new Error(await readError(response));
        }

        const data = await response.json();

        if (version !== shoppingListRequestVersion) {
            return;
        }

        shoppingListData = data;
        renderShoppingList();
    } catch (error) {
        if (version !== shoppingListRequestVersion) {
            return;
        }

        shoppingListData = null;

        shoppingListItems.innerHTML =
            '<p class="shopping-list-empty">Could not load the shopping list.</p>';

        shoppingListCount.textContent = "— items";
        shoppingListProgress.textContent = "— purchased";

        setShoppingListStatus(
            error.message || "Could not load the shopping list.",
            true
        );
    }
}

generateShoppingListButton.addEventListener("click", async () => {
    if (!currentUser) {
        showAuthForm("login");
        return;
    }

    const weekStartDate = formatLocalDate(mealWeekStart);

    generateShoppingListButton.disabled = true;

    setShoppingListStatus("Generating shopping list...");

    try {
        const response = await apiFetch(
            `${SHOPPING_LIST_API_URL}/generate?weekStartDate=${weekStartDate}`,
            { method: "POST" }
        );

        if (!response.ok) {
            throw new Error(await readError(response));
        }

        shoppingListData = await response.json();

        renderShoppingList();

        setShoppingListStatus(
            "Shopping list generated successfully."
        );
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

    const id = Number(checkbox.dataset.shoppingItemId);

    const item = shoppingListData?.items?.find(
        entry => Number(entry.id) === id
    );

    if (!item) {
        return;
    }

    const previousValue = item.purchased;
    const requestedValue = checkbox.checked;

    item.purchased = requestedValue;
    renderShoppingList();

    const updatedCheckbox = shoppingListItems.querySelector(
        `input[data-shopping-item-id="${id}"]`
    );

    if (updatedCheckbox) {
        updatedCheckbox.disabled = true;
    }

    try {
        const response = await apiFetch(
            `${SHOPPING_ITEM_API_URL}/${encodeURIComponent(id)}/purchased`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    purchased: requestedValue
                })
            }
        );

        if (!response.ok) {
            throw new Error(await readError(response));
        }

        const updated = await response.json();

        const current = shoppingListData?.items?.find(
            entry => Number(entry.id) === id
        );

        if (current) {
            current.purchased = updated.purchased;
        }

        renderShoppingList();

        setShoppingListStatus(
            updated.purchased
                ? "Item marked as purchased."
                : "Item marked as not purchased."
        );
    } catch (error) {
        const current = shoppingListData?.items?.find(
            entry => Number(entry.id) === id
        );

        if (current) {
            current.purchased = previousValue;
        }

        renderShoppingList();

        setShoppingListStatus(
            error.message || "Could not update the purchased status.",
            true
        );
    }
});

// ==================== INITIALIZATION ====================

updateShoppingWeekLabel();
renderMealCalendar();
populateMealPlanRecipeOptions();

loadRecipes();
refreshAuthentication();
