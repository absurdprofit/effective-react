export type Phase = 'rendering' | 'committing' | 'committed';

export class EffectiveComponentPhase extends EventTarget {
  public current: Phase = 'rendering';

  public override dispatchEvent(event: Event): boolean {
    this.current = event.type as Phase;
    return super.dispatchEvent(event);
  }
}

export class RenderingEvent extends Event {
  constructor() {
    super('rendering');
  }
}

export class CommittingEvent extends Event {
  constructor() {
    super('committing');
  }
}

export class CommittedEvent extends Event {
  constructor() {
    super('committed');
  }
}