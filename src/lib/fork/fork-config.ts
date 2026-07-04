import type { IUnleashOptions } from '../types/option.js';
import type { IFlags } from '../types/experimental.js';

export const forkConfig: Partial<IUnleashOptions> = {
    enterpriseVersion: 'fork',
    // Belt-and-suspenders: disables OSS store filters (project-store,
    // environment-store, feature-environment-store) and rbac-middleware
    // blocks on non-default projects/environments.
    isOss: false,
    ui: {
        environment: 'Pro',
        flags: { EEA: true, P: true } as unknown as IFlags,
    },
    resourceLimits: {
        projects: 500,
        environments: 50,
    },
};
