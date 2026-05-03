import { summarizeMatchScore } from "./scoring.js";

export class GameController {
  constructor({ gridController, boardRenderer, feedbackService, ui }) {
    this.gridController = gridController;
    this.boardRenderer = boardRenderer;
    this.feedbackService = feedbackService;
    this.ui = ui;
    this.score = 0;
    this.specialDishCount = 0;
    this.isAnimating = false;
    this.activeMatches = [];
  }

  start() {
    this.gridController.initializeGrid();
    this.boardRenderer.render(this.gridController.grid);
    this.updateScoreUI();
    this.ui.setStatus("Swipe a dish to swap.");
  }

  async handleSwipe({ origin, direction }) {
    if (this.isAnimating) {
      return;
    }

    const target = this.gridController.getPositionFromDirection(origin, direction);

    if (!target || !this.gridController.isInsideBounds(target)) {
      this.ui.setStatus("That swap is outside the board.");
      return;
    }

    if (!this.gridController.areAdjacent(origin, target)) {
      return;
    }

    this.isAnimating = true;
    this.ui.setStatus("Swapping...");
    this.feedbackService.playSwapSound();
    this.feedbackService.triggerLightHaptic();

    await this.boardRenderer.animateSwap(origin, target);
    this.gridController.swapItems(origin, target);
    this.boardRenderer.render(this.gridController.grid);

    const matchGroups = this.gridController.findMatches();

    if (matchGroups.length === 0) {
      await this.revertSwap(origin, target);
      this.isAnimating = false;
      return;
    }

    await this.resolveBoard(target);
    this.isAnimating = false;
    this.ui.setStatus("Swipe a dish to swap.");
  }

  async revertSwap(origin, target) {
    this.ui.setStatus("No match. Reverting...");
    this.feedbackService.playInvalidSwapSound();
    this.feedbackService.triggerInvalidHaptic();
    await this.boardRenderer.animateInvalidSwap(origin, target);
    await this.boardRenderer.animateSwap(target, origin);
    this.gridController.swapItems(origin, target);
    this.boardRenderer.render(this.gridController.grid);
  }

  async resolveBoard(preferredSpecialPosition = null) {
    let nextPreferredSpecialPosition = preferredSpecialPosition;
    this.activeMatches = this.gridController.findMatches();

    while (this.activeMatches.length > 0) {
      const scoreSummary = summarizeMatchScore(this.activeMatches);
      this.score += scoreSummary.points;
      this.specialDishCount += scoreSummary.createdSpecialDishes;
      this.updateScoreUI();

      this.ui.setStatus(this.createMatchStatus(scoreSummary));
      this.feedbackService.playMatchSound(this.activeMatches);
      this.feedbackService.triggerMatchHaptic(this.activeMatches);

      await this.boardRenderer.highlightMatches(this.activeMatches);
      this.gridController.clearMatches(this.activeMatches, nextPreferredSpecialPosition);
      this.boardRenderer.render(this.gridController.grid);

      await this.boardRenderer.wait(120);
      this.gridController.applyGravity();
      this.boardRenderer.render(this.gridController.grid);
      await this.boardRenderer.wait(180);

      nextPreferredSpecialPosition = null;
      this.activeMatches = this.gridController.findMatches();
    }
  }

  createMatchStatus(scoreSummary) {
    if (scoreSummary.createdSpecialDishes > 0) {
      return `+${scoreSummary.points} points. Special Dish created!`;
    }

    return `+${scoreSummary.points} points.`;
  }

  updateScoreUI() {
    this.ui.setScore(this.score);
    this.ui.setSpecialDishCount(this.specialDishCount);
  }
}
