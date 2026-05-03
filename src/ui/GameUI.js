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
    this.specialDishElement.textContent = `Special Dishes: ${count}`;
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
