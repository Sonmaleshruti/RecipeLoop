
package com.recipeloop.recipeloop;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@Transactional
public class ShoppingListService {

    private static final Pattern QUANTITY_PATTERN = Pattern.compile(
            "^\\s*(\\d+(?:\\.\\d+)?|\\d+\\s*/\\s*\\d+|[½¼¾⅓⅔⅛⅜⅝])\\s+(.+?)\\s*$"
    );

    private final ShoppingListRepository shoppingListRepository;
    private final ShoppingListItemRepository shoppingListItemRepository;
    private final MealPlanRepository mealPlanRepository;
    private final AuthService authService;

    public ShoppingListService(
            ShoppingListRepository shoppingListRepository,
            ShoppingListItemRepository shoppingListItemRepository,
            MealPlanRepository mealPlanRepository,
            AuthService authService) {
        this.shoppingListRepository = shoppingListRepository;
        this.shoppingListItemRepository = shoppingListItemRepository;
        this.mealPlanRepository = mealPlanRepository;
        this.authService = authService;
    }

    @Transactional(readOnly = true)
    public ShoppingList getByWeekStartDate(
            String email, LocalDate weekStartDate) {
        validateWeekStart(weekStartDate);
        AppUser user = authService.findByEmail(email);
        return shoppingListRepository
                .findByUser_IdAndWeekStartDate(user.getId(), weekStartDate)
                .orElseGet(() -> {
                    ShoppingList emptyList = new ShoppingList();
                    emptyList.setUser(user);
                    emptyList.setWeekStartDate(weekStartDate);
                    return emptyList;
                });
    }

    public ShoppingList generate(
            String email, LocalDate weekStartDate) {
        validateWeekStart(weekStartDate);
        AppUser user = authService.findByEmail(email);
        LocalDate weekEndDate = weekStartDate.plusDays(6);

        List<MealPlan> mealPlans =
                mealPlanRepository
                        .findByUser_IdAndPlannedDateBetweenOrderByPlannedDateAsc(
                                user.getId(), weekStartDate, weekEndDate);

        Map<String, IngredientEntry> generatedItems =
                new LinkedHashMap<>();

        for (MealPlan mealPlan : mealPlans) {
            Recipe recipe = mealPlan.getRecipe();

            if (recipe == null || recipe.getIngredients() == null) {
                continue;
            }

            String[] ingredients =
                    recipe.getIngredients().split("\\r?\\n|[,;]");

            for (String ingredient : ingredients) {
                String text = ingredient.trim();

                if (text.isEmpty()) {
                    continue;
                }

                IngredientEntry entry = parseIngredient(text);

                IngredientEntry existing =
                        generatedItems.get(entry.canonicalKey);

                if (existing == null) {
                    generatedItems.put(entry.canonicalKey, entry);
                } else if (entry.quantity != null
                        && existing.quantity != null) {
                    existing.quantity =
                            existing.quantity.add(entry.quantity);
                }
            }
        }

        ShoppingList shoppingList = shoppingListRepository
                .findByUser_IdAndWeekStartDate(user.getId(), weekStartDate)
                .orElseGet(() -> {
                    ShoppingList newList = new ShoppingList();
                    newList.setUser(user);
                    newList.setWeekStartDate(weekStartDate);
                    return newList;
                });

        Map<String, ShoppingListItem> existingItems =
                new LinkedHashMap<>();

        for (ShoppingListItem item : shoppingList.getItems()) {
            existingItems.put(item.getItemKey(), item);
        }

        for (IngredientEntry entry : generatedItems.values()) {
            String itemKey = hashKey(entry.canonicalKey);

            ShoppingListItem item = existingItems.remove(itemKey);

            if (item == null) {
                item = new ShoppingListItem();
                item.setShoppingList(shoppingList);
                item.setItemKey(itemKey);
                item.setPurchased(false);
                shoppingList.getItems().add(item);
            }

            item.setDisplayText(entry.getDisplayText());
        }

        shoppingList.getItems().removeIf(
                item -> existingItems.containsKey(item.getItemKey())
        );

        return shoppingListRepository.save(shoppingList);
    }

    public ShoppingListItem updatePurchased(
            String email, Long itemId, boolean purchased) {

        AppUser user = authService.findByEmail(email);

        ShoppingListItem item = shoppingListItemRepository
                .findByIdAndShoppingList_User_Id(itemId, user.getId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Shopping-list item not found: " + itemId
                ));

        item.setPurchased(purchased);
        return shoppingListItemRepository.save(item);
    }

    private void validateWeekStart(LocalDate date) {
        if (date == null) {
            throw new IllegalArgumentException(
                    "weekStartDate is required."
            );
        }

        if (date.getDayOfWeek() != DayOfWeek.MONDAY) {
            throw new IllegalArgumentException(
                    "weekStartDate must be a Monday."
            );
        }
    }

    private IngredientEntry parseIngredient(String originalText) {
        Matcher matcher = QUANTITY_PATTERN.matcher(originalText);

        if (!matcher.matches()) {
            return rawEntry(originalText);
        }

        BigDecimal quantity;

        try {
            quantity = parseQuantity(matcher.group(1));
        } catch (NumberFormatException | ArithmeticException exception) {
            return rawEntry(originalText);
        }

        String remainder = matcher.group(2).trim();

        if (remainder.isEmpty()) {
            return rawEntry(originalText);
        }

        String[] parts = remainder.split("\\s+", 2);
        String firstWord = parts[0].toLowerCase(Locale.ROOT);

        String unit = canonicalUnit(firstWord);
        String ingredientName;

        if (unit != null && parts.length == 2) {
            ingredientName = parts[1].trim();
        } else if (unit != null) {
            return rawEntry(originalText);
        } else {
            unit = "count";
            ingredientName = remainder;
        }

        if (ingredientName.isBlank()) {
            return rawEntry(originalText);
        }

        ingredientName = singularizeCommonIngredient(
                normalizeWhitespace(ingredientName)
        );

        String canonicalName =
                ingredientName.toLowerCase(Locale.ROOT);

        String canonicalKey =
                "parsed|" + unit + "|" + canonicalName;

        return new IngredientEntry(
                canonicalKey,
                quantity,
                unit,
                ingredientName,
                originalText
        );
    }

    private IngredientEntry rawEntry(String text) {
        String normalized = normalizeWhitespace(text);

        return new IngredientEntry(
                "raw|" + normalized.toLowerCase(Locale.ROOT),
                null,
                null,
                null,
                text
        );
    }

    private BigDecimal parseQuantity(String text) {
        String value = text.trim();

        switch (value) {
            case "½":
                return new BigDecimal("0.5");
            case "¼":
                return new BigDecimal("0.25");
            case "¾":
                return new BigDecimal("0.75");
            case "⅓":
                return BigDecimal.ONE.divide(
                        new BigDecimal("3"),
                        6,
                        java.math.RoundingMode.HALF_UP
                );
            case "⅔":
                return new BigDecimal("2").divide(
                        new BigDecimal("3"),
                        6,
                        java.math.RoundingMode.HALF_UP
                );
            case "⅛":
                return new BigDecimal("0.125");
            case "⅜":
                return new BigDecimal("0.375");
            case "⅝":
                return new BigDecimal("0.625");
            default:
                break;
        }

        if (value.contains("/")) {
            String[] fraction = value.split("/");

            return new BigDecimal(fraction[0].trim()).divide(
                    new BigDecimal(fraction[1].trim()),
                    6,
                    java.math.RoundingMode.HALF_UP
            );
        }

        return new BigDecimal(value);
    }

    private String canonicalUnit(String value) {
        return switch (value) {
            case "slice", "slices" -> "slice";
            case "tbsp", "tbs", "tablespoon", "tablespoons" -> "tbsp";
            case "tsp", "teaspoon", "teaspoons" -> "tsp";
            case "g", "gram", "grams" -> "g";
            case "kg", "kilogram", "kilograms" -> "kg";
            case "ml", "milliliter", "milliliters",
                 "millilitre", "millilitres" -> "ml";
            case "l", "liter", "liters", "litre", "litres" -> "l";
            case "cup", "cups" -> "cup";
            case "clove", "cloves" -> "clove";
            case "piece", "pieces", "pc", "pcs" -> "piece";
            case "pinch", "pinches" -> "pinch";
            case "bunch", "bunches" -> "bunch";
            case "can", "cans" -> "can";
            case "packet", "packets", "pack", "packs" -> "pack";
            default -> null;
        };
    }

    private String singularizeCommonIngredient(String name) {
        String lower = name.toLowerCase(Locale.ROOT);

        return switch (lower) {
            case "tomatoes" -> "tomato";
            case "potatoes" -> "potato";
            case "onions" -> "onion";
            case "cucumbers" -> "cucumber";
            case "chillies", "chilies", "chilis" -> "chilli";
            default -> name;
        };
    }

    private String normalizeWhitespace(String value) {
        return value.trim().replaceAll("\\s+", " ");
    }

    private String hashKey(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(
                    value.getBytes(StandardCharsets.UTF_8)
            );

            StringBuilder result = new StringBuilder();

            for (byte b : hash) {
                result.append(String.format("%02x", b & 0xff));
            }

            return result.toString();
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException(
                    "SHA-256 is unavailable.", exception
            );
        }
    }

    private static class IngredientEntry {
        private final String canonicalKey;
        private BigDecimal quantity;
        private final String unit;
        private final String ingredientName;
        private final String originalText;

        private IngredientEntry(
                String canonicalKey,
                BigDecimal quantity,
                String unit,
                String ingredientName,
                String originalText) {
            this.canonicalKey = canonicalKey;
            this.quantity = quantity;
            this.unit = unit;
            this.ingredientName = ingredientName;
            this.originalText = originalText;
        }

        private String getDisplayText() {
            if (quantity == null) {
                return originalText;
            }

            String amount = quantity.stripTrailingZeros().toPlainString();

            if ("count".equals(unit)) {
                String name = ingredientName;

                if (quantity.compareTo(BigDecimal.ONE) != 0) {
                    String lower = name.toLowerCase(Locale.ROOT);

                    if (lower.endsWith("y") && lower.length() > 1) {
                        name = name.substring(0, name.length() - 1) + "ies";
                    } else if (lower.endsWith("s")
                            || lower.endsWith("x")
                            || lower.endsWith("ch")
                            || lower.endsWith("sh")) {
                        name = name + "es";
                    } else if (lower.endsWith("o")) {
                        name = name + "es";
                    } else {
                        name = name + "s";
                    }
                }

                return amount + " " + name;
            }

            String unitLabel = switch (unit) {
                case "tbsp" -> "tbsp";
                case "tsp" -> "tsp";
                case "g", "kg", "ml", "l" -> unit;
                default -> quantity.compareTo(BigDecimal.ONE) == 0
                        ? unit
                        : unit + "s";
            };

            return amount + " " + unitLabel + " " + ingredientName;
        }
    }
}
