
package com.recipeloop.recipeloop;

public class MealPlanNotFoundException extends RuntimeException {

    public MealPlanNotFoundException(Long id) {
        super("Meal plan not found with ID: " + id);
    }
}
