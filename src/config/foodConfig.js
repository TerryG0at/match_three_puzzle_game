export const FOOD_TYPES = Object.freeze({
  MONTPYARTHALET: "MontPyarThalet",
  MONTLONEYAYPAW: "MontLoneYayPaw",
  STICKY_RICE: "StickyRice",
  SI_HTAMIN: "SiHtamin",
  MOHINGA: "Mohinga",
  FALOODA: "Falooda"
});

export const FOOD_CATALOG = Object.freeze([
  {
    type: FOOD_TYPES.MONTPYARTHALET,
    label: "Mont Pyar Thalet",
    color: "#D2B48C",
    asset: {
      kind: "shape",
      shape: "square",
      src: null
    }
  },
  {
    type: FOOD_TYPES.MONTLONEYAYPAW,
    label: "Mont Lone Yay Paw",
    color: "#FFFFFF",
    asset: {
      kind: "shape",
      shape: "round",
      src: null
    }
  },
  {
    type: FOOD_TYPES.STICKY_RICE,
    label: "Sticky Rice",
    color: "#4B0082",
    asset: {
      kind: "shape",
      shape: "diamond",
      src: null
    }
  },
  {
    type: FOOD_TYPES.SI_HTAMIN,
    label: "Si Htamin",
    color: "#FFD700",
    asset: {
      kind: "shape",
      shape: "pill",
      src: null
    }
  },
  {
    type: FOOD_TYPES.MOHINGA,
    label: "Mohinga",
    color: "#8B4513",
    asset: {
      kind: "shape",
      shape: "bowl",
      src: null
    }
  },
  {
    type: FOOD_TYPES.FALOODA,
    label: "Falooda",
    color: "#FF69B4",
    asset: {
      kind: "shape",
      shape: "glass",
      src: null
    }
  }
]);

export const FOOD_BY_TYPE = Object.freeze(
  FOOD_CATALOG.reduce((lookup, foodConfig) => {
    lookup[foodConfig.type] = foodConfig;
    return lookup;
  }, {})
);

export const BOARD_SETTINGS = Object.freeze({
  rows: 8,
  columns: 8,
  minMatchLength: 3,
  swipeThresholdPixels: 24,
  animationMs: {
    swap: 180,
    clear: 180,
    cascade: 220
  }
});

export const SCORING_RULES = Object.freeze({
  3: 100,
  4: 300,
  5: 1000
});
