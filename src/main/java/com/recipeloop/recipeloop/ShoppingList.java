package com.recipeloop.recipeloop;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
        name = "shopping_lists",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_shopping_list_week",
                columnNames = "week_start_date"
        )
)
public class ShoppingList {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "week_start_date", nullable = false)
    private LocalDate weekStartDate;

    @OneToMany(
            mappedBy = "shoppingList",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.EAGER
    )
    @OrderBy("id ASC")
    @JsonManagedReference
    private List<ShoppingListItem> items = new ArrayList<>();

    public ShoppingList() {
    }

    public Long getId() {
        return id;
    }

    public LocalDate getWeekStartDate() {
        return weekStartDate;
    }

    public void setWeekStartDate(LocalDate weekStartDate) {
        this.weekStartDate = weekStartDate;
    }

    public List<ShoppingListItem> getItems() {
        return items;
    }

    public void setItems(List<ShoppingListItem> items) {
        this.items = items;
    }
}