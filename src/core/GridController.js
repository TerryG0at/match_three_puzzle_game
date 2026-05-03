import { BOARD_SETTINGS, FOOD_CATALOG } from "../config/foodConfig.js";
import { FoodItem } from "./FoodItem.js";

export class GridController {
  constructor(options = {}) {
    this.rows = options.rows ?? BOARD_SETTINGS.rows;
    this.columns = options.columns ?? BOARD_SETTINGS.columns;
    this.minMatchLength = options.minMatchLength ?? BOARD_SETTINGS.minMatchLength;
    this.foodTypes = options.foodTypes ?? FOOD_CATALOG.map((foodConfig) => foodConfig.type);
    this.random = options.random ?? Math.random;
    this.grid = [];
  }

  initializeGrid() {
    this.grid = Array.from({ length: this.rows }, () => Array(this.columns).fill(null));

    for (let row = 0; row < this.rows; row += 1) {
      for (let column = 0; column < this.columns; column += 1) {
        const excludedTypes = this.getTypesThatWouldMatchAt(row, column);
        this.grid[row][column] = this.createRandomFoodItem(excludedTypes);
      }
    }

    return this.grid;
  }

  getSnapshot() {
    return this.grid.map((row) => row.map((foodItem) => foodItem?.clone() ?? null));
  }

  setGrid(grid) {
    this.grid = grid;
  }

  isInsideBounds(position) {
    return (
      position.row >= 0 &&
      position.row < this.rows &&
      position.column >= 0 &&
      position.column < this.columns
    );
  }

  getItem(position) {
    if (!this.isInsideBounds(position)) {
      return null;
    }

    return this.grid[position.row][position.column];
  }

  setItem(position, foodItem) {
    if (!this.isInsideBounds(position)) {
      return;
    }

    this.grid[position.row][position.column] = foodItem;
  }

  areAdjacent(firstPosition, secondPosition) {
    const rowDistance = Math.abs(firstPosition.row - secondPosition.row);
    const columnDistance = Math.abs(firstPosition.column - secondPosition.column);

    return rowDistance + columnDistance === 1;
  }

  getPositionFromDirection(position, direction) {
    const offsets = {
      up: { row: -1, column: 0 },
      down: { row: 1, column: 0 },
      left: { row: 0, column: -1 },
      right: { row: 0, column: 1 }
    };
    const offset = offsets[direction];

    if (!offset) {
      return null;
    }

    return {
      row: position.row + offset.row,
      column: position.column + offset.column
    };
  }

  swapItems(firstPosition, secondPosition) {
    if (!this.isInsideBounds(firstPosition) || !this.isInsideBounds(secondPosition)) {
      return false;
    }

    const firstItem = this.getItem(firstPosition);
    const secondItem = this.getItem(secondPosition);

    this.setItem(firstPosition, secondItem);
    this.setItem(secondPosition, firstItem);

    return true;
  }

  findMatches() {
    return [...this.findHorizontalMatches(), ...this.findVerticalMatches()];
  }

  clearMatches(matchGroups, preferredSpecialPosition = null) {
    const clearKeys = new Set();
    const specialDishAnchors = [];

    for (const matchGroup of matchGroups) {
      let specialDishAnchor = null;

      if (matchGroup.length === 4) {
        specialDishAnchor = this.findSpecialDishAnchor(matchGroup, preferredSpecialPosition);
        specialDishAnchors.push({
          position: specialDishAnchor,
          type: matchGroup.type
        });
      }

      for (const cell of matchGroup.cells) {
        if (specialDishAnchor && this.positionsEqual(cell, specialDishAnchor)) {
          continue;
        }

        clearKeys.add(this.positionKey(cell));
      }
    }

    for (const key of clearKeys) {
      const position = this.positionFromKey(key);
      this.setItem(position, null);
    }

    for (const specialDishAnchor of specialDishAnchors) {
      this.setItem(
        specialDishAnchor.position,
        new FoodItem(specialDishAnchor.type, {
          isSpecialDish: true
        })
      );
    }

    return {
      clearedCells: Array.from(clearKeys).map((key) => this.positionFromKey(key)),
      specialDishAnchors
    };
  }

  applyGravity() {
    const movements = [];
    const spawnedItems = [];

    for (let column = 0; column < this.columns; column += 1) {
      let writeRow = this.rows - 1;

      for (let row = this.rows - 1; row >= 0; row -= 1) {
        const foodItem = this.grid[row][column];

        if (!foodItem) {
          continue;
        }

        if (writeRow !== row) {
          this.grid[writeRow][column] = foodItem;
          this.grid[row][column] = null;
          movements.push({
            from: { row, column },
            to: { row: writeRow, column },
            foodItem
          });
        }

        writeRow -= 1;
      }

      for (let row = writeRow; row >= 0; row -= 1) {
        const foodItem = this.createRandomFoodItem();
        this.grid[row][column] = foodItem;
        spawnedItems.push({
          position: { row, column },
          foodItem
        });
      }
    }

    return {
      movements,
      spawnedItems
    };
  }

  createRandomFoodItem(excludedTypes = []) {
    const allowedTypes = this.foodTypes.filter((type) => !excludedTypes.includes(type));
    const typePool = allowedTypes.length > 0 ? allowedTypes : this.foodTypes;
    const randomIndex = Math.floor(this.random() * typePool.length);

    return new FoodItem(typePool[randomIndex]);
  }

  getTypesThatWouldMatchAt(row, column) {
    const excludedTypes = new Set();
    const leftOne = this.grid[row]?.[column - 1];
    const leftTwo = this.grid[row]?.[column - 2];
    const aboveOne = this.grid[row - 1]?.[column];
    const aboveTwo = this.grid[row - 2]?.[column];

    if (leftOne && leftTwo && leftOne.type === leftTwo.type) {
      excludedTypes.add(leftOne.type);
    }

    if (aboveOne && aboveTwo && aboveOne.type === aboveTwo.type) {
      excludedTypes.add(aboveOne.type);
    }

    return Array.from(excludedTypes);
  }

  findHorizontalMatches() {
    const matchGroups = [];

    for (let row = 0; row < this.rows; row += 1) {
      let runStartColumn = 0;
      let currentType = this.grid[row][0]?.type ?? null;

      for (let column = 1; column <= this.columns; column += 1) {
        const nextType = this.grid[row][column]?.type ?? null;
        const isRunContinuing = nextType && nextType === currentType;

        if (isRunContinuing) {
          continue;
        }

        const runLength = column - runStartColumn;

        if (currentType && runLength >= this.minMatchLength) {
          matchGroups.push(this.createMatchGroup(currentType, "horizontal", row, runStartColumn, runLength));
        }

        runStartColumn = column;
        currentType = nextType;
      }
    }

    return matchGroups;
  }

  findVerticalMatches() {
    const matchGroups = [];

    for (let column = 0; column < this.columns; column += 1) {
      let runStartRow = 0;
      let currentType = this.grid[0][column]?.type ?? null;

      for (let row = 1; row <= this.rows; row += 1) {
        const nextType = this.grid[row]?.[column]?.type ?? null;
        const isRunContinuing = nextType && nextType === currentType;

        if (isRunContinuing) {
          continue;
        }

        const runLength = row - runStartRow;

        if (currentType && runLength >= this.minMatchLength) {
          matchGroups.push(this.createMatchGroup(currentType, "vertical", runStartRow, column, runLength));
        }

        runStartRow = row;
        currentType = nextType;
      }
    }

    return matchGroups;
  }

  createMatchGroup(type, direction, startRow, startColumn, length) {
    const cells = Array.from({ length }, (_, index) => ({
      row: direction === "horizontal" ? startRow : startRow + index,
      column: direction === "horizontal" ? startColumn + index : startColumn
    }));

    return {
      type,
      direction,
      start: { row: startRow, column: startColumn },
      length,
      cells,
      createsSpecialDish: length === 4
    };
  }

  findSpecialDishAnchor(matchGroup, preferredSpecialPosition) {
    if (
      preferredSpecialPosition &&
      matchGroup.cells.some((cell) => this.positionsEqual(cell, preferredSpecialPosition))
    ) {
      return preferredSpecialPosition;
    }

    return matchGroup.cells[Math.floor(matchGroup.cells.length / 2)];
  }

  positionKey(position) {
    return `${position.row},${position.column}`;
  }

  positionFromKey(key) {
    const [row, column] = key.split(",").map(Number);

    return { row, column };
  }

  positionsEqual(firstPosition, secondPosition) {
    return firstPosition.row === secondPosition.row && firstPosition.column === secondPosition.column;
  }
}
