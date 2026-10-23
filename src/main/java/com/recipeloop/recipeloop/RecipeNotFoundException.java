
package com.recipeloop.recipeloop;

public class RecipeNotFoundException extends RuntimeException {

    public RecipeNotFoundException(Long id) {
        super("Recipe not found with ID: " + id);
    }
}
