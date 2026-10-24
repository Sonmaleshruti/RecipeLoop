package com.recipeloop.recipeloop;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;

@Entity
@Table(
        name = "shopping_list_items",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_shopping_item_key_per_list",
                columnNames = {"shopping_list_id", "item_key"}
        )
)
public class ShoppingListItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "shopping_list_id", nullable = false)
    @JsonBackReference
    private ShoppingList shoppingList;

    @Column(name = "display_text", nullable = false, columnDefinition = "TEXT")
    private String displayText;

    @Column(name = "item_key", nullable = false, length = 64)
    private String itemKey;

    @Column(nullable = false)
    private boolean purchased = false;

    public ShoppingListItem() {
    }

    public Long getId() {
        return id;
    }

    public ShoppingList getShoppingList() {
        return shoppingList;
    }

    public void setShoppingList(ShoppingList shoppingList) {
        this.shoppingList = shoppingList;
    }

    public String getDisplayText() {
        return displayText;
    }

    public void setDisplayText(String displayText) {
        this.displayText = displayText;
    }

    public String getItemKey() {
        return itemKey;
    }

    public void setItemKey(String itemKey) {
        this.itemKey = itemKey;
    }

    public boolean isPurchased() {
        return purchased;
    }

    public void setPurchased(boolean purchased) {
        this.purchased = purchased;
    }
}