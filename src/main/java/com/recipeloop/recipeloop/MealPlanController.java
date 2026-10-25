
package com.recipeloop.recipeloop;

import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/meal-plans")
public class MealPlanController {

    private final MealPlanService mealPlanService;

    public MealPlanController(MealPlanService mealPlanService) {
        this.mealPlanService = mealPlanService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MealPlan createMealPlan(
            Authentication authentication,
            @Valid @RequestBody MealPlan mealPlan) {
        return mealPlanService.createMealPlan(
                authentication.getName(), mealPlan);
    }

    @GetMapping
    public List<MealPlan> getMealPlans(
            Authentication authentication,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate endDate) {

        String email = authentication.getName();

        if (startDate == null && endDate == null) {
            return mealPlanService.getAllMealPlans(email);
        }

        if (startDate == null || endDate == null) {
            throw new IllegalArgumentException(
                    "Both startDate and endDate must be provided");
        }

        return mealPlanService.getMealPlansBetween(
                email, startDate, endDate);
    }

    @GetMapping("/{id}")
    public MealPlan getMealPlanById(
            Authentication authentication,
            @PathVariable Long id) {
        return mealPlanService.getMealPlanById(
                authentication.getName(), id);
    }

    @PutMapping("/{id}")
    public MealPlan updateMealPlan(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody MealPlan mealPlan) {
        return mealPlanService.updateMealPlan(
                authentication.getName(), id, mealPlan);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteMealPlan(
            Authentication authentication,
            @PathVariable Long id) {
        mealPlanService.deleteMealPlan(
                authentication.getName(), id);
    }
}
