import dbInit, { type ITestDb } from '../../test/e2e/helpers/database-init.js';
import {
    type IUnleashTest,
    setupAppWithCustomConfig,
} from '../../test/e2e/helpers/test-helper.js';
import getLogger from '../../test/fixtures/no-logger.js';
import { forkConfig, forkPreRouterHook } from './index.js';

let app: IUnleashTest;
let db: ITestDb;

const ENVIRONMENTS_BASE = '/api/admin/environments';

beforeAll(async () => {
    db = await dbInit('fork_environment_admin_serial', getLogger, forkConfig);
    app = await setupAppWithCustomConfig(
        db.stores,
        {
            ...forkConfig,
            preRouterHook: forkPreRouterHook,
        },
        db.rawDatabase,
    );
});

afterAll(async () => {
    await app.destroy();
    await db.destroy();
});

test('lists all environments when fork config disables OSS filtering', async () => {
    await db.stores.environmentStore.create({
        name: 'fork-hidden-env',
        type: 'production',
        enabled: true,
    });

    const response = await app.request.get(ENVIRONMENTS_BASE).expect(200);

    const names = response.body.environments.map(
        (env: { name: string }) => env.name,
    );
    expect(names).toContain('fork-hidden-env');
});

test('validates a unique environment name', async () => {
    await app.request
        .post(`${ENVIRONMENTS_BASE}/validate`)
        .send({ name: 'fork-unique-env' })
        .expect(204);
});

test('rejects a duplicate environment name', async () => {
    await app.request
        .post(`${ENVIRONMENTS_BASE}/validate`)
        .send({ name: 'development' })
        .expect(409);
});

test('creates, updates, clones, and deletes an environment', async () => {
    const createResponse = await app.request
        .post(ENVIRONMENTS_BASE)
        .send({ name: 'fork-staging', type: 'production', sortOrder: 99 })
        .expect(201);

    expect(createResponse.body.name).toBe('fork-staging');
    expect(createResponse.body.type).toBe('production');

    const updateResponse = await app.request
        .put(`${ENVIRONMENTS_BASE}/update/fork-staging`)
        .send({ type: 'development', sortOrder: 5 })
        .expect(200);

    expect(updateResponse.body.type).toBe('development');
    expect(updateResponse.body.sortOrder).toBe(5);

    const cloneResponse = await app.request
        .post(`${ENVIRONMENTS_BASE}/development/clone`)
        .send({
            name: 'fork-staging-clone',
            type: 'development',
            projects: ['default'],
            clonePermissions: false,
        })
        .expect(201);

    expect(cloneResponse.body.name).toBe('fork-staging-clone');

    await app.request
        .delete(`${ENVIRONMENTS_BASE}/fork-staging-clone`)
        .expect(200);

    await app.request.delete(`${ENVIRONMENTS_BASE}/fork-staging`).expect(200);

    expect(await db.stores.environmentStore.exists('fork-staging')).toBe(false);
});

test('enforces environment limit', async () => {
    const limitedApp = await setupAppWithCustomConfig(
        db.stores,
        {
            ...forkConfig,
            preRouterHook: forkPreRouterHook,
            resourceLimits: { environments: 3 },
        },
        db.rawDatabase,
    );

    await limitedApp.request
        .post(ENVIRONMENTS_BASE)
        .send({ name: 'fork-over-limit-env', type: 'production' })
        .expect(400);

    await limitedApp.destroy();
});
