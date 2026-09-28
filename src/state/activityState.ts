export interface ActivityState {
    typing: boolean;
    activeFile: string | undefined;

    errors: number;
    warnings: number;

    inactive: boolean;

    lastActive: number;

    lastSaveHadErrors: boolean | undefined;
    lastSaveTime: number | undefined;
}

export const activityState: ActivityState = {
    typing: false,
    activeFile: undefined,

    errors: 0,
    warnings: 0,

    inactive: true,

    lastActive: Date.now(),

    lastSaveHadErrors: undefined,
    lastSaveTime: undefined,
};