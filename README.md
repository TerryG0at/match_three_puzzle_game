# မုန့်ပွဲတော် / Mont Pwel Taw

A bright, mobile-first match-three puzzle game scaffold using Myanmar food items.

## Run

Open the folder with any static web server, then visit the served `index.html`.

```powershell
python -m http.server 5173
```

Then open `http://localhost:5173`.

## Test Core Logic

```powershell
npm test
```

## Architecture

- `src/config/foodConfig.js` maps the six food types, dummy colors, shapes, board settings, and scoring rules.
- `src/services/AssetLoader.js` is the central swap point for replacing dummy CSS shapes with `.png` or `.svg` pixel art.
- `src/core/GridController.js` owns the 8x8 board, swapping, match detection, clearing, gravity, and spawning.
- `src/core/GameController.js` coordinates input, animation timing, scoring, special dish flags, and cascade resolution.
- `src/input/SwipeInputHandler.js` detects mobile-friendly drag/swipe gestures.
- `src/ui/BoardRenderer.js` renders the board and contains animation hooks.
- `src/services/FeedbackService.js` contains placeholders for sound and haptic feedback.

## Swapping In Real Art

Update a food entry in `src/config/foodConfig.js`:

```js
{
  type: FOOD_TYPES.FALOODA,
  label: "Falooda",
  color: "#FF69B4",
  asset: {
    kind: "image",
    shape: "glass",
    src: "./assets/falooda.png"
  }
}
```

The renderer will use the image automatically.
