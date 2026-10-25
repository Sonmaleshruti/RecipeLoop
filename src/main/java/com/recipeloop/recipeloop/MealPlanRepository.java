
package com.recipeloop.recipeloop;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface MealPlanRepository extends JpaRepository<MealPlan, Long> {

    List<MealPlan> findByUser_IdOrderByPlannedDateAsc(Long userId);

    List<MealPlan> findByUser_IdAndPlannedDateBetweenOrderByPlannedDateAsc(
            Long userId,
            LocalDate startDate,
            LocalDate endDate
    );

    Optional<MealPlan> findByIdAndUser_Id(Long id, Long userId);
}
