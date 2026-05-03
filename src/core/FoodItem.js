let nextFoodItemId = 1;

export class FoodItem {
  constructor(type, options = {}) {
    this.id = options.id ?? `food-${nextFoodItemId++}`;
    this.type = type;
    this.isSpecialDish = Boolean(options.isSpecialDish);
  }

  clone(overrides = {}) {
    return new FoodItem(overrides.type ?? this.type, {
      id: overrides.id ?? this.id,
      isSpecialDish: overrides.isSpecialDish ?? this.isSpecialDish
    });
  }
}
