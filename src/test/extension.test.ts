import * as assert from 'assert';

import { getMood, Mood } from '../mood/moodEngine';
import { ActivityState } from '../state/activityState';

function createState(
    overrides: Partial<ActivityState> = {}
): ActivityState {
    return {
        typing: false,
        activeFile: undefined,
        errors: 0,
        warnings: 0,
        inactive: false,
        lastActive: Date.now(),
        lastSaveHadErrors: undefined,
        lastSaveTime: undefined,
        ...overrides,
    };
}

suite('Mood Engine Tests', () => {

    test('returns neutral when there is no activity or problem', () => {
        assert.strictEqual(getMood(createState()), 'neutral');
    });

    test('returns focused when typing', () => {
        assert.strictEqual(
            getMood(createState({ typing: true })),
            'focused'
        );
    });

    test('returns idle when inactive', () => {
        assert.strictEqual(
            getMood(createState({ inactive: true })),
            'idle'
        );
    });

    test('returns warning when warnings exist', () => {
        assert.strictEqual(
            getMood(createState({ warnings: 1 })),
            'warning'
        );
    });

    test('returns error when errors exist', () => {
        assert.strictEqual(
            getMood(createState({ errors: 1 })),
            'error'
        );
    });

    test('returns save-success after a successful save', () => {
        assert.strictEqual(
            getMood(createState({
                lastSaveTime: Date.now(),
                lastSaveHadErrors: false,
            })),
            'save-success'
        );
    });

    test('returns save-error after a save with errors', () => {
        assert.strictEqual(
            getMood(createState({
                lastSaveTime: Date.now(),
                lastSaveHadErrors: true,
            })),
            'save-error'
        );
    });

    test('errors take priority over warnings', () => {
        assert.strictEqual(
            getMood(createState({
                errors: 1,
                warnings: 2,
            })),
            'error'
        );
    });

    test('warnings take priority over inactivity', () => {
        assert.strictEqual(
            getMood(createState({
                warnings: 1,
                inactive: true,
            })),
            'warning'
        );
    });

    test('inactivity takes priority over typing', () => {
        assert.strictEqual(
            getMood(createState({
                inactive: true,
                typing: true,
            })),
            'idle'
        );
    });

    test('a recent save takes priority over errors', () => {
        assert.strictEqual(
            getMood(createState({
                errors: 1,
                lastSaveTime: Date.now(),
                lastSaveHadErrors: false,
            })),
            'save-success'
        );
    });

    test('an old save no longer overrides errors', () => {
        assert.strictEqual(
            getMood(createState({
                errors: 1,
                lastSaveTime: Date.now() - 4000,
                lastSaveHadErrors: false,
            })),
            'error'
        );
    });
});