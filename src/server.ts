import { start } from './lib/server-impl.js';
import { forkConfig, forkPreRouterHook } from './lib/fork/index.js';

try {
    start({
        ...forkConfig,
        preRouterHook: forkPreRouterHook,
    });
} catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit();
}
