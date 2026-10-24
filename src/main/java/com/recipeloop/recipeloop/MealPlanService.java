
package com.recipeloop.recipeloop;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@Transactional
public class MealPlanService {

    private final MealPlanRepository mealPlanRepository;
    private final RecipeRepository recipeRepository;

    public MealPlanService(
            MealPlanRepository mealPlanRepository,
            RecipeRepository recipeRepository) {
        this.mealPlanRepository = mealPlanRepository;
        this.recipeRepository = recipeRepository;
    }

    public MealPlan createMealPlan(MealPlan mealPlan) {
        Long recipeId = getRecipeId(mealPlan);

        Recipe recipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new RecipeNotFoundException(recipeId));

        mealPlan.setRecipe(recipe);

        return mealPlanRepository.save(mealPlan);
    }

    @Transactional(readOnly = true)
    public List<MealPlan> getAllMealPlans() {
        return mealPlanRepository.findAll();
    }

    @Transactional(readOnly = true)
    public MealPlan getMealPlanById(Long id) {
        return mealPlanRepository.findById(id)
                .orElseThrow(() -> new MealPlanNotFoundException(id));
    }

    @Transactional(readOnly = true)
    public List<MealPlan> getMealPlansBetween(
            LocalDate startDate,
            LocalDate endDate) {

        if (startDate == null || endDate == null) {
            throw new IllegalArgumentException(
                    "Start date and end date are required");
        }

        if (endDate.isBefore(startDate)) {
            throw new IllegalArgumentException(
                    "End date cannot be before start date");
        }

        return mealPlanRepository
                .findByPlannedDateBetweenOrderByPlannedDateAsc(
                        startDate, endDate);
    }

    public MealPlan updateMealPlan(Long id, MealPlan updatedMealPlan) {
        MealPlan existingMealPlan = getMealPlanById(id);

        Long recipeId = getRecipeId(updatedMealPlan);

        Recipe recipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new RecipeNotFoundException(recipeId));

        existingMealPlan.setRecipe(recipe);
        existingMealPlan.setPlannedDate(updatedMealPlan.getPlannedDate());
        existingMealPlan.setMealType(updatedMealPlan.getMealType());

        return mealPlanRepository.save(existingMealPlan);
    }

    public void deleteMealPlan(Long id) {
        MealPlan mealPlan = getMealPlanById(id);
        mealPlanRepository.delete(mealPlan);
    }

    private Long getRecipeId(MealPlan mealPlan) {
        if (mealPlan.getRecipe() == null
                || mealPlan.getRecipe().getId() == null) {
            throw new IllegalArgumentException(
                    "A valid recipe ID is required");
        }

        return mealPlan.getRecipe().getId();
    }
}
