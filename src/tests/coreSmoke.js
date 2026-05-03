import assert from "node:assert/strict";
import { FOOD_TYPES } from "../config/foodConfig.js";
import { FoodItem } from "../core/FoodItem.js";
import { GridController } from "../core/GridController.js";
import { getScoreForMatchLength, summarizeMatchScore } from "../core/scoring.js";

const seededValues = [0.1, 0.3, 0.5, 0.7, 0.9];
let seedIndex = 0;
const predictableRandom = () => {
  const value = seededValues[seedIndex % seededValues.length];
  seedIndex += 1;
  return value;
};

const gridController = new GridController({
  random: predictableRandom
});

gridController.initializeGrid();
assert.equal(gridController.grid.length, 8);
assert.equal(gridController.grid[0].length, 8);
assert.equal(gridController.findMatches().length, 0);

const types = Object.values(FOOD_TYPES);
const testGrid = Array.from({ length: 8 }, (_, row) =>
  Array.from({ length: 8 }, (_, column) => new FoodItem(types[(row * 2 + column) % types.length]))
);

testGrid[0][0] = new FoodItem(FOOD_TYPES.FALOODA);
testGrid[0][1] = new FoodItem(FOOD_TYPES.FALOODA);
testGrid[0][2] = new FoodItem(FOOD_TYPES.FALOODA);
testGrid[2][4] = new FoodItem(FOOD_TYPES.MOHINGA);
testGrid[3][4] = new FoodItem(FOOD_TYPES.MOHINGA);
testGrid[4][4] = new FoodItem(FOOD_TYPES.MOHINGA);
testGrid[5][4] = new FoodItem(FOOD_TYPES.MOHINGA);
testGrid[6][4] = new FoodItem(FOOD_TYPES.STICKY_RICE);

gridController.setGrid(testGrid);

const matches = gridController.findMatches();
assert.equal(matches.length, 2);
assert.equal(getScoreForMatchLength(3), 100);
assert.equal(getScoreForMatchLength(4), 300);
assert.equal(getScoreForMatchLength(5), 1000);
assert.deepEqual(summarizeMatchScore(matches), {
  points: 400,
  createdSpecialDishes: 1
});

gridController.clearMatches(matches, { row: 3, column: 4 });
assert.equal(gridController.getItem({ row: 0, column: 0 }), null);
assert.equal(gridController.getItem({ row: 3, column: 4 }).isSpecialDish, true);

gridController.applyGravity();
for (let row = 0; row < 8; row += 1) {
  for (let column = 0; column < 8; column += 1) {
    assert.ok(gridController.getItem({ row, column }));
  }
}

console.log("Core match-three smoke tests passed.");
