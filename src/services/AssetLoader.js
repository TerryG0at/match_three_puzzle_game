import { FOOD_BY_TYPE, FOOD_CATALOG } from "../config/foodConfig.js";

export class AssetLoader {
  constructor(foodCatalog = FOOD_CATALOG) {
    this.foodCatalog = foodCatalog;
    this.foodByType =
      foodCatalog === FOOD_CATALOG
        ? FOOD_BY_TYPE
        : foodCatalog.reduce((lookup, foodConfig) => {
            lookup[foodConfig.type] = foodConfig;
            return lookup;
          }, {});
  }

  getFoodConfig(type) {
    const foodConfig = this.foodByType[type];

    if (!foodConfig) {
      throw new Error(`Unknown food type: ${type}`);
    }

    return foodConfig;
  }

  getRenderableAsset(type) {
    const foodConfig = this.getFoodConfig(type);
    const { asset } = foodConfig;

    return {
      label: foodConfig.label,
      color: foodConfig.color,
      kind: asset.kind,
      shape: asset.shape ?? "round",
      imageUrl: asset.src
    };
  }

  listFoods() {
    return this.foodCatalog.map((foodConfig) => ({
      type: foodConfig.type,
      label: foodConfig.label,
      color: foodConfig.color,
      asset: { ...foodConfig.asset }
    }));
  }
}
