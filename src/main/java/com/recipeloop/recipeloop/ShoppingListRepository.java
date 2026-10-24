package com.recipeloop.recipeloop;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface ShoppingListRepository
        extends JpaRepository<ShoppingList, Long> {

    Optional<ShoppingList> findByWeekStartDate(LocalDate weekStartDate);
}