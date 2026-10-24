package com.recipeloop.recipeloop;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ShoppingListItemRepository
        extends JpaRepository<ShoppingListItem, Long> {
}