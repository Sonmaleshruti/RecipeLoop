
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
    private final AuthService authService;

    public MealPlanService(
            MealPlanRepository mealPlanRepository,
            RecipeRepository recipeRepository,
            AuthService authService) {
        this.mealPlanRepository = mealPlanRepository;
        this.recipeRepository = recipeRepository;
        this.authService = authService;
    }

    public MealPlan createMealPlan(String email, MealPlan mealPlan) {
        AppUser user = authService.findByEmail(email);

        Long recipeId = getRecipeId(mealPlan);
        Recipe recipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new RecipeNotFoundException(recipeId));

        mealPlan.setId(null);
        mealPlan.setUser(user);
        mealPlan.setRecipe(recipe);

        return mealPlanRepository.save(mealPlan);
    }

    @Transactional(readOnly = true)
    public List<MealPlan> getAllMealPlans(String email) {
        AppUser user = authService.findByEmail(email);
        return mealPlanRepository.findByUser_IdOrderByPlannedDateAsc(
                user.getId());
    }

    @Transactional(readOnly = true)
    public MealPlan getMealPlanById(String email, Long id) {
        AppUser user = authService.findByEmail(email);

        return mealPlanRepository.findByIdAndUser_Id(id, user.getId())
                .orElseThrow(() -> new MealPlanNotFoundException(id));
    }

    @Transactional(readOnly = true)
    public List<MealPlan> getMealPlansBetween(
            String email, LocalDate startDate, LocalDate endDate) {
        if (startDate == null || endDate == null) {
            throw new IllegalArgumentException(
                    "Start date and end date are required");
        }

        if (endDate.isBefore(startDate)) {
            throw new IllegalArgumentException(
                    "End date cannot be before start date");
        }

        AppUser user = authService.findByEmail(email);

        return mealPlanRepository
                .findByUser_IdAndPlannedDateBetweenOrderByPlannedDateAsc(
                        user.getId(), startDate, endDate);
    }

    public MealPlan updateMealPlan(
            String email, Long id, MealPlan updatedMealPlan) {
        MealPlan existingMealPlan = getMealPlanById(email, id);

        Long recipeId = getRecipeId(updatedMealPlan);
        Recipe recipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new RecipeNotFoundException(recipeId));

        existingMealPlan.setRecipe(recipe);
        existingMealPlan.setPlannedDate(updatedMealPlan.getPlannedDate());
        existingMealPlan.setMealType(updatedMealPlan.getMealType());

        return mealPlanRepository.save(existingMealPlan);
    }

    public void deleteMealPlan(String email, Long id) {
        MealPlan mealPlan = getMealPlanById(email, id);
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
