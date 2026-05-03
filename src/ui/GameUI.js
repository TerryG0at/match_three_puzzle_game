const SPECIAL_DISH_LABEL = "\u1021\u1011\u1030\u1038\u1019\u102f\u1014\u103a\u1037";

export class GameUI {
  constructor({ scoreElement, statusElement, specialDishElement, legendElement, assetLoader }) {
    this.scoreElement = scoreElement;
    this.statusElement = statusElement;
    this.specialDishElement = specialDishElement;
    this.legendElement = legendElement;
    this.assetLoader = assetLoader;
  }

  setScore(score) {
    this.scoreElement.textContent = String(score);
  }

  setStatus(message) {
    this.statusElement.textContent = message;
  }

  setSpecialDishCount(count) {
    this.specialDishElement.textContent = `${SPECIAL_DISH_LABEL}: ${count}`;
  }

  renderLegend() {
    const fragment = document.createDocumentFragment();

    for (const foodConfig of this.assetLoader.listFoods()) {
      const legendItem = document.createElement("div");
      const swatch = document.createElement("span");
      const label = document.createElement("span");

      legendItem.className = "legend-item";
      swatch.className = "legend-swatch";
      swatch.style.setProperty("--food-color", foodConfig.color);
      label.textContent = foodConfig.label;

      legendItem.append(swatch, label);
      fragment.append(legendItem);
    }

    this.legendElement.replaceChildren(fragment);
  }
}
