// Gives the sprite sheet readable animation names.
export class SpriteAnimator {
  // Store the sprite and its frame definitions.
  constructor(sprite, states = {}) {
    this.sprite = sprite;
    this.states = states;
    this.currentState = null;
  }

  // Play an animated state.
  play(state, loop = true, delay = 180) {
    const animation = this.states[state];
    if (!animation || this.currentState === state) return;
    this.currentState = state;
    this.sprite.playAnimation(animation.start, animation.end, loop, delay);
  }

  // Show one frame without looping.
  frame(state) {
    const animation = this.states[state];
    if (!animation) return;
    this.currentState = state;
    this.sprite.stopAnimation();
    this.sprite.cellIndex = animation.frame;
  }

  // Stop animation and show a resting frame.
  stop(state = "idle") {
    this.sprite.stopAnimation();
    this.currentState = state;
    const animation = this.states[state];
    if (animation) this.sprite.cellIndex = animation.frame;
  }
}
