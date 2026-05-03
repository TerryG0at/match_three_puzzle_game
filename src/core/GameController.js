import { summarizeMatchScore } from "./scoring.js";

const DEFAULT_STATUS_MESSAGE = "\u1019\u102f\u1014\u103a\u1037\u1000\u102d\u102f \u1006\u103d\u1032\u1015\u103c\u102e\u1038 \u101c\u1032\u1015\u102b\u104b";
const OUT_OF_BOUNDS_MESSAGE = "\u1021\u1015\u103c\u1004\u103a\u1018\u1000\u103a\u1000\u102d\u102f \u101c\u1032\u101c\u102d\u102f\u1037 \u1019\u101b\u1015\u102b\u104b";
const SWAPPING_MESSAGE = "\u101c\u1032\u1014\u1031\u1015\u102b\u101e\u100a\u103a...";
const REVERT_MESSAGE = "\u1019\u1010\u1030\u101e\u1031\u1038\u1015\u102b\u104b \u1015\u103c\u1014\u103a\u101c\u1032\u1014\u1031\u1015\u102b\u101e\u100a\u103a...";
const POINTS_LABEL = "\u1021\u1019\u103e\u1010\u103a";
const SPECIAL_DISH_MESSAGE = "\u1021\u1011\u1030\u1038\u1019\u102f\u1014\u103a\u1037 \u101b\u1015\u102b\u1015\u103c\u102e\u104b";

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
    this.ui.setStatus(DEFAULT_STATUS_MESSAGE);
  }

  canAcceptInput() {
    return !this.isAnimating;
  }

  async handleSwipe({ origin, direction }) {
    if (this.isAnimating) {
      return;
    }

    const target = this.gridController.getPositionFromDirection(origin, direction);

    if (!target || !this.gridController.isInsideBounds(target)) {
      this.ui.setStatus(OUT_OF_BOUNDS_MESSAGE);
      return;
    }

    if (!this.gridController.areAdjacent(origin, target)) {
      return;
    }

    this.isAnimating = true;
    this.ui.setStatus(SWAPPING_MESSAGE);
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
    this.ui.setStatus(DEFAULT_STATUS_MESSAGE);
  }

  async revertSwap(origin, target) {
    this.ui.setStatus(REVERT_MESSAGE);
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
      return `+${scoreSummary.points} ${POINTS_LABEL}\u104b ${SPECIAL_DISH_MESSAGE}`;
    }

    return `+${scoreSummary.points} ${POINTS_LABEL}`;
  }

  updateScoreUI() {
    this.ui.setScore(this.score);
    this.ui.setSpecialDishCount(this.specialDishCount);
  }
}
