import { BOARD_SETTINGS } from "../config/foodConfig.js";

export class SwipeInputHandler {
  constructor(boardElement, options = {}) {
    this.boardElement = boardElement;
    this.swipeThresholdPixels = options.swipeThresholdPixels ?? BOARD_SETTINGS.swipeThresholdPixels;
    this.onSwipe = options.onSwipe ?? (() => {});
    this.startPoint = null;

    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);
    this.handlePointerCancel = this.handlePointerCancel.bind(this);
  }

  attach() {
    this.boardElement.addEventListener("pointerdown", this.handlePointerDown);
    this.boardElement.addEventListener("pointerup", this.handlePointerUp);
    this.boardElement.addEventListener("pointercancel", this.handlePointerCancel);
  }

  detach() {
    this.boardElement.removeEventListener("pointerdown", this.handlePointerDown);
    this.boardElement.removeEventListener("pointerup", this.handlePointerUp);
    this.boardElement.removeEventListener("pointercancel", this.handlePointerCancel);
  }

  handlePointerDown(event) {
    const cellElement = event.target.closest("[data-row][data-column]");

    if (!cellElement) {
      return;
    }

    this.boardElement.setPointerCapture?.(event.pointerId);
    this.startPoint = {
      x: event.clientX,
      y: event.clientY,
      row: Number(cellElement.dataset.row),
      column: Number(cellElement.dataset.column)
    };
  }

  handlePointerUp(event) {
    if (!this.startPoint) {
      return;
    }

    const deltaX = event.clientX - this.startPoint.x;
    const deltaY = event.clientY - this.startPoint.y;
    const direction = this.getSwipeDirection(deltaX, deltaY);
    const origin = {
      row: this.startPoint.row,
      column: this.startPoint.column
    };

    this.startPoint = null;

    if (!direction) {
      return;
    }

    this.onSwipe({
      origin,
      direction
    });
  }

  handlePointerCancel() {
    this.startPoint = null;
  }

  getSwipeDirection(deltaX, deltaY) {
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (Math.max(absX, absY) < this.swipeThresholdPixels) {
      return null;
    }

    if (absX > absY) {
      return deltaX > 0 ? "right" : "left";
    }

    return deltaY > 0 ? "down" : "up";
  }
}
