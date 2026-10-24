
package com.recipeloop.recipeloop;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
public class ShoppingListController {

    private final ShoppingListService shoppingListService;

    public ShoppingListController(
            ShoppingListService shoppingListService) {
        this.shoppingListService = shoppingListService;
    }

    @GetMapping("/api/shopping-lists")
    public ShoppingList getShoppingList(
            @RequestParam LocalDate weekStartDate) {
        return shoppingListService.getByWeekStartDate(weekStartDate);
    }

    @PostMapping("/api/shopping-lists/generate")
    public ShoppingList generateShoppingList(
            @RequestParam LocalDate weekStartDate) {
        return shoppingListService.generate(weekStartDate);
    }

    @PatchMapping("/api/shopping-list-items/{itemId}/purchased")
    public ShoppingListItem updatePurchased(
            @PathVariable Long itemId,
            @RequestBody PurchasedRequest request) {

        if (request == null || request.purchased() == null) {
            throw new IllegalArgumentException(
                    "The purchased field is required."
            );
        }

        return shoppingListService.updatePurchased(
                itemId, request.purchased()
        );
    }

    public record PurchasedRequest(Boolean purchased) {
    }
}
