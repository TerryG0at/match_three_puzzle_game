export class FeedbackService {
  playSwapSound() {
    // Placeholder: connect to Web Audio, Howler, Unity AudioSource, etc.
  }

  playMatchSound(matchGroups) {
    // Placeholder: trigger combo-dependent sound effects here.
    void matchGroups;
  }

  playInvalidSwapSound() {
    // Placeholder: short deny sound.
  }

  triggerLightHaptic() {
    this.vibrate(12);
  }

  triggerMatchHaptic(matchGroups) {
    const longestMatch = Math.max(...matchGroups.map((matchGroup) => matchGroup.length), 3);
    this.vibrate(longestMatch >= 5 ? [18, 24, 18] : 18);
  }

  triggerInvalidHaptic() {
    this.vibrate([8, 32, 8]);
  }

  vibrate(pattern) {
    if ("vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  }
}
