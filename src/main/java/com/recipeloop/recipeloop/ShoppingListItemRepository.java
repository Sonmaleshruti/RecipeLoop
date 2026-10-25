package com.recipeloop.recipeloop;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface ShoppingListItemRepository
        extends JpaRepository<ShoppingListItem, Long> {
    Optional<ShoppingListItem> findByIdAndShoppingList_User_Id(
            Long itemId, Long userId);
}