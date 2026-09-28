import { ActivityState } from '../state/activityState';

export type Mood =
    | 'neutral'
    | 'focused'
    | 'warning'
    | 'error'
    | 'save-success'
    | 'save-error'
    | 'idle';

const SAVE_MOOD_DURATION = 3000;

export function getMood(state: ActivityState): Mood {
    const now = Date.now();

    // Saving gets a temporary reaction.
    if (
        state.lastSaveTime !== undefined &&
        now - state.lastSaveTime <= SAVE_MOOD_DURATION
    ) {
        return state.lastSaveHadErrors
            ? 'save-error'
            : 'save-success';
    }

    if (state.errors > 0) {
        return 'error';
    }

    if (state.warnings > 0) {
        return 'warning';
    }

    if (state.inactive) {
        return 'idle';
    }

    if (state.typing) {
        return 'focused';
    }

    return 'neutral';
}