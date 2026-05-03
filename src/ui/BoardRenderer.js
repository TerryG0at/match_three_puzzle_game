import { BOARD_SETTINGS } from "../config/foodConfig.js";

export class BoardRenderer {
  constructor(boardElement, assetLoader) {
    this.boardElement = boardElement;
    this.assetLoader = assetLoader;
  }

  render(grid) {
    const fragment = document.createDocumentFragment();

    for (let row = 0; row < grid.length; row += 1) {
      for (let column = 0; column < grid[row].length; column += 1) {
        fragment.append(this.createCellElement(row, column, grid[row][column]));
      }
    }

    this.boardElement.replaceChildren(fragment);
  }

  createCellElement(row, column, foodItem) {
    const cellElement = document.createElement("button");
    cellElement.className = "cell";
    cellElement.type = "button";
    cellElement.dataset.row = String(row);
    cellElement.dataset.column = String(column);
    cellElement.ariaLabel = foodItem ? `${foodItem.type} at row ${row + 1}, column ${column + 1}` : "Empty cell";

    if (foodItem) {
      cellElement.append(this.createFoodTokenElement(foodItem));
    }

    return cellElement;
  }

  createFoodTokenElement(foodItem) {
    const renderableAsset = this.assetLoader.getRenderableAsset(foodItem.type);
    const tokenElement = document.createElement("span");

    tokenElement.className = "food-token";
    tokenElement.dataset.foodId = foodItem.id;
    tokenElement.dataset.foodType = foodItem.type;
    tokenElement.dataset.shape = renderableAsset.shape;
    tokenElement.dataset.assetKind = renderableAsset.kind;
    tokenElement.title = renderableAsset.label;
    tokenElement.style.setProperty("--food-color", renderableAsset.color);

    if (renderableAsset.kind === "image" && renderableAsset.imageUrl) {
      tokenElement.style.setProperty("--food-image", `url("${renderableAsset.imageUrl}")`);
    }

    if (foodItem.isSpecialDish) {
      tokenElement.classList.add("is-special");
    }

    return tokenElement;
  }

  async animateSwap(firstPosition, secondPosition) {
    const firstToken = this.getTokenAt(firstPosition);
    const secondToken = this.getTokenAt(secondPosition);

    if (!firstToken || !secondToken) {
      await this.wait(BOARD_SETTINGS.animationMs.swap);
      return;
    }

    const firstRect = firstToken.getBoundingClientRect();
    const secondRect = secondToken.getBoundingClientRect();
    const firstDelta = {
      x: secondRect.left - firstRect.left,
      y: secondRect.top - firstRect.top
    };
    const secondDelta = {
      x: firstRect.left - secondRect.left,
      y: firstRect.top - secondRect.top
    };

    firstToken.style.setProperty("--swap-transform", `translate(${firstDelta.x}px, ${firstDelta.y}px)`);
    secondToken.style.setProperty("--swap-transform", `translate(${secondDelta.x}px, ${secondDelta.y}px)`);

    await this.wait(BOARD_SETTINGS.animationMs.swap);

    firstToken.style.removeProperty("--swap-transform");
    secondToken.style.removeProperty("--swap-transform");
  }

  async highlightMatches(matchGroups) {
    const matchedPositionKeys = new Set();

    for (const matchGroup of matchGroups) {
      for (const cell of matchGroup.cells) {
        matchedPositionKeys.add(this.positionKey(cell));
      }
    }

    for (const key of matchedPositionKeys) {
      const tokenElement = this.getTokenAt(this.positionFromKey(key));
      tokenElement?.classList.add("is-matching");
    }

    await this.wait(BOARD_SETTINGS.animationMs.clear);
  }

  async animateInvalidSwap(firstPosition, secondPosition) {
    this.getCellAt(firstPosition)?.classList.add("is-invalid");
    this.getCellAt(secondPosition)?.classList.add("is-invalid");
    await this.wait(BOARD_SETTINGS.animationMs.swap);
  }

  getCellAt(position) {
    return this.boardElement.querySelector(`[data-row="${position.row}"][data-column="${position.column}"]`);
  }

  getTokenAt(position) {
    return this.getCellAt(position)?.querySelector(".food-token") ?? null;
  }

  wait(ms) {
    return new Promise((resolve) => {
      window.setTimeout(resolve, ms);
    });
  }

  positionKey(position) {
    return `${position.row},${position.column}`;
  }

  positionFromKey(key) {
    const [row, column] = key.split(",").map(Number);

    return { row, column };
  }
}
