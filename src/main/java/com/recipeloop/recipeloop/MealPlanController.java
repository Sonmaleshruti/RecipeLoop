
package com.recipeloop.recipeloop;

import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

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
            @Valid @RequestBody MealPlan mealPlan) {
        return mealPlanService.createMealPlan(mealPlan);
    }

    @GetMapping
    public List<MealPlan> getMealPlans(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate endDate) {

        if (startDate == null && endDate == null) {
            return mealPlanService.getAllMealPlans();
        }

        if (startDate == null || endDate == null) {
            throw new IllegalArgumentException(
                    "Both startDate and endDate must be provided");
        }

        return mealPlanService.getMealPlansBetween(startDate, endDate);
    }

    @GetMapping("/{id}")
    public MealPlan getMealPlanById(@PathVariable Long id) {
        return mealPlanService.getMealPlanById(id);
    }

    @PutMapping("/{id}")
    public MealPlan updateMealPlan(
            @PathVariable Long id,
            @Valid @RequestBody MealPlan mealPlan) {
        return mealPlanService.updateMealPlan(id, mealPlan);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteMealPlan(@PathVariable Long id) {
        mealPlanService.deleteMealPlan(id);
    }
}
