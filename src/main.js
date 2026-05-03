import { GridController } from "./core/GridController.js";
import { GameController } from "./core/GameController.js";
import { SwipeInputHandler } from "./input/SwipeInputHandler.js";
import { AssetLoader } from "./services/AssetLoader.js";
import { FeedbackService } from "./services/FeedbackService.js";
import { BoardRenderer } from "./ui/BoardRenderer.js";
import { GameUI } from "./ui/GameUI.js";

const boardElement = document.querySelector("#gameBoard");
const assetLoader = new AssetLoader();
const boardRenderer = new BoardRenderer(boardElement, assetLoader);
const feedbackService = new FeedbackService();
const gridController = new GridController();
const ui = new GameUI({
  scoreElement: document.querySelector("#scoreValue"),
  statusElement: document.querySelector("#moveStatus"),
  specialDishElement: document.querySelector("#specialDishStatus"),
  legendElement: document.querySelector("#foodLegend"),
  assetLoader
});

const gameController = new GameController({
  gridController,
  boardRenderer,
  feedbackService,
  ui
});

const swipeInputHandler = new SwipeInputHandler(boardElement, {
  canStartDrag: () => gameController.canAcceptInput(),
  onDragStart: ({ origin }) => boardRenderer.beginDrag(origin),
  onDragMove: (dragState) => boardRenderer.moveDrag(dragState),
  onDragEnd: () => boardRenderer.endDrag(),
  onSwipe: (swipe) => gameController.handleSwipe(swipe)
});

ui.renderLegend();
gameController.start();
swipeInputHandler.attach();
