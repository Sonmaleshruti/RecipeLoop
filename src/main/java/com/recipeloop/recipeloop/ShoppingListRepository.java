
package com.recipeloop.recipeloop;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface ShoppingListRepository
        extends JpaRepository<ShoppingList, Long> {

    Optional<ShoppingList> findByUser_IdAndWeekStartDate(
            Long userId,
            LocalDate weekStartDate
    );

    Optional<ShoppingList> findByIdAndUser_Id(Long id, Long userId);
}
