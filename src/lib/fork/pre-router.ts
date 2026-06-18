import type { Application } from 'express';
import type { IUnleashConfig } from '../types/option.js';
import type { IUnleashServices } from '../services/index.js';
import type { IUnleashStores } from '../types/stores.js';
import type { Db } from '../db/db.js';
import ForkProjectAdminController from './project-admin-controller.js';
import ForkEnvironmentAdminController from './environment-admin-controller.js';

export function forkPreRouterHook(
    app: Application,
    config: IUnleashConfig,
    services: IUnleashServices,
    stores: IUnleashStores,
    _db: Db,
): void {
    const baseUriPath = config.server.baseUriPath || '';

    app.use(
        `${baseUriPath}/api/admin/projects`,
        new ForkProjectAdminController(config, services).router,
    );

    app.use(
        `${baseUriPath}/api/admin/environments`,
        new ForkEnvironmentAdminController(config, services, stores).router,
    );
}
