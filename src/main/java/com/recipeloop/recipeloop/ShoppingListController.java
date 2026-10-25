
package com.recipeloop.recipeloop;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
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
            Authentication authentication,
            @RequestParam LocalDate weekStartDate) {
        return shoppingListService.getByWeekStartDate(
                authentication.getName(), weekStartDate);
    }

    @PostMapping("/api/shopping-lists/generate")
    public ShoppingList generateShoppingList(
            Authentication authentication,
            @RequestParam LocalDate weekStartDate) {
        return shoppingListService.generate(
                authentication.getName(), weekStartDate);
    }

    @PatchMapping("/api/shopping-list-items/{itemId}/purchased")
    public ShoppingListItem updatePurchased(
            Authentication authentication,
            @PathVariable Long itemId,
            @RequestBody PurchasedRequest request) {

        if (request == null || request.purchased() == null) {
            throw new IllegalArgumentException(
                    "The purchased field is required.");
        }

        return shoppingListService.updatePurchased(
                authentication.getName(), itemId, request.purchased());
    }

    public record PurchasedRequest(Boolean purchased) {
    }
}
