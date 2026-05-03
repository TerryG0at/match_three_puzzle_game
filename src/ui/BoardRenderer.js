import { BOARD_SETTINGS } from "../config/foodConfig.js";

export class BoardRenderer {
  constructor(boardElement, assetLoader) {
    this.boardElement = boardElement;
    this.assetLoader = assetLoader;
    this.activeDrag = null;
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

  beginDrag(position) {
    const tokenElement = this.getTokenAt(position);
    const cellElement = this.getCellAt(position);

    this.endDrag();

    if (!tokenElement || !cellElement) {
      return;
    }

    tokenElement.classList.add("is-grabbed");
    cellElement.classList.add("is-drag-origin");
    this.boardElement.classList.add("is-dragging");
    this.activeDrag = {
      origin: position,
      tokenElement,
      originCellElement: cellElement,
      targetCellElement: null
    };
  }

  moveDrag({ origin, deltaX, deltaY, direction }) {
    if (!this.activeDrag || !this.positionsEqual(this.activeDrag.origin, origin)) {
      return;
    }

    const cellSize = this.getCellAt(origin)?.getBoundingClientRect().width ?? 56;
    const dragLimit = cellSize * 1.08;
    const constrainedDelta = this.constrainDragDelta(deltaX, deltaY, dragLimit);

    this.activeDrag.tokenElement.style.setProperty(
      "--drag-transform",
      `translate(${constrainedDelta.x}px, ${constrainedDelta.y}px)`
    );
    this.updateDragTarget(origin, direction);
  }

  endDrag() {
    if (!this.activeDrag) {
      return;
    }

    this.activeDrag.tokenElement.classList.remove("is-grabbed");
    this.activeDrag.tokenElement.style.removeProperty("--drag-transform");
    this.activeDrag.originCellElement.classList.remove("is-drag-origin");
    this.activeDrag.targetCellElement?.classList.remove("is-drag-target");
    this.boardElement.classList.remove("is-dragging");
    this.activeDrag = null;
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

  updateDragTarget(origin, direction) {
    this.activeDrag.targetCellElement?.classList.remove("is-drag-target");
    this.activeDrag.targetCellElement = null;

    if (!direction) {
      return;
    }

    const target = this.getPositionFromDirection(origin, direction);
    const targetCellElement = this.getCellAt(target);

    if (!targetCellElement) {
      return;
    }

    targetCellElement.classList.add("is-drag-target");
    this.activeDrag.targetCellElement = targetCellElement;
  }

  getPositionFromDirection(position, direction) {
    const offsets = {
      up: { row: -1, column: 0 },
      down: { row: 1, column: 0 },
      left: { row: 0, column: -1 },
      right: { row: 0, column: 1 }
    };
    const offset = offsets[direction] ?? { row: 0, column: 0 };

    return {
      row: position.row + offset.row,
      column: position.column + offset.column
    };
  }

  constrainDragDelta(deltaX, deltaY, dragLimit) {
    const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);

    if (isHorizontal) {
      return {
        x: Math.max(-dragLimit, Math.min(deltaX, dragLimit)),
        y: Math.max(-dragLimit * 0.28, Math.min(deltaY, dragLimit * 0.28))
      };
    }

    return {
      x: Math.max(-dragLimit * 0.28, Math.min(deltaX, dragLimit * 0.28)),
      y: Math.max(-dragLimit, Math.min(deltaY, dragLimit))
    };
  }

  positionsEqual(firstPosition, secondPosition) {
    return firstPosition.row === secondPosition.row && firstPosition.column === secondPosition.column;
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
