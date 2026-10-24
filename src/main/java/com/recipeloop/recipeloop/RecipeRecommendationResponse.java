package com.recipeloop.recipeloop;

public record RecipeRecommendationResponse(
        Long id,
        String name,
        String description,
        String ingredients,
        Integer prepTimeMinutes,
        Integer servings,
        double similarityScore
) {
}