import dbInit, { type ITestDb } from '../../test/e2e/helpers/database-init.js';
import {
    type IUnleashTest,
    setupAppWithCustomConfig,
} from '../../test/e2e/helpers/test-helper.js';
import getLogger from '../../test/fixtures/no-logger.js';
import { forkConfig, forkPreRouterHook } from './index.js';

let app: IUnleashTest;
let db: ITestDb;

const PROJECTS_BASE = '/api/admin/projects';

beforeAll(async () => {
    db = await dbInit('fork_project_admin_serial', getLogger, forkConfig);
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

test('validates a unique project id', async () => {
    await app.request
        .post(`${PROJECTS_BASE}/validate`)
        .send({ id: 'new-unique-project' })
        .expect(204);
});

test('rejects a duplicate project id', async () => {
    await app.request
        .post(`${PROJECTS_BASE}/validate`)
        .send({ id: 'default' })
        .expect(409);
});

test('lists archived projects', async () => {
    await app.request
        .post(PROJECTS_BASE)
        .send({ name: 'Archived Project', id: 'archived-project' })
        .expect(201);

    await app.request
        .post(`${PROJECTS_BASE}/archive/archived-project`)
        .expect(200);

    const response = await app.request
        .get(`${PROJECTS_BASE}?archived=true`)
        .expect(200);

    const ids = response.body.projects.map(
        (project: { id: string }) => project.id,
    );
    expect(ids).toContain('archived-project');
});

test('creates a feature in a non-default project', async () => {
    await app.request
        .post(PROJECTS_BASE)
        .send({ name: 'Feature Project', id: 'feature-project' })
        .expect(201);

    await app.request
        .post('/api/admin/projects/feature-project/features')
        .send({ name: 'flag-in-feature-project' })
        .expect(201);
});

test('lists all projects after creation', async () => {
    await app.request
        .post(PROJECTS_BASE)
        .send({ name: 'Listed Project', id: 'listed-project' })
        .expect(201);

    const response = await app.request.get(PROJECTS_BASE).expect(200);

    const ids = response.body.projects.map(
        (project: { id: string }) => project.id,
    );
    expect(ids).toContain('default');
    expect(ids).toContain('listed-project');
});

test('creates, updates, archives, revives, and deletes a project', async () => {
    const createResponse = await app.request
        .post(PROJECTS_BASE)
        .send({ name: 'Fork Test Project', id: 'fork-test-project' })
        .expect(201);

    expect(createResponse.body.id).toBe('fork-test-project');
    expect(createResponse.body.name).toBe('Fork Test Project');
    expect(createResponse.body.environments).toEqual(
        expect.arrayContaining(['development', 'production']),
    );

    await app.request
        .put(`${PROJECTS_BASE}/fork-test-project`)
        .send({
            id: 'fork-test-project',
            name: 'Fork Test Project Updated',
            description: 'Updated description',
            defaultStickiness: 'default',
            featureLimit: null,
        })
        .expect(200);

    await app.request
        .put(`${PROJECTS_BASE}/fork-test-project/settings`)
        .send({ mode: 'open' })
        .expect(200);

    const project = await db.stores.projectStore.get('fork-test-project');
    expect(project?.name).toBe('Fork Test Project Updated');
    expect(project?.description).toBe('Updated description');

    await app.request
        .post(`${PROJECTS_BASE}/archive/fork-test-project`)
        .expect(200);

    const archived = await db.stores.projectStore.get('fork-test-project');
    expect(archived?.archivedAt).toBeTruthy();

    await app.request
        .post(`${PROJECTS_BASE}/revive/fork-test-project`)
        .expect(200);

    const revived = await db.stores.projectStore.get('fork-test-project');
    expect(revived?.archivedAt).toBeFalsy();

    await app.request.delete(`${PROJECTS_BASE}/fork-test-project`).expect(200);

    expect(await db.stores.projectStore.hasProject('fork-test-project')).toBe(
        false,
    );
});

test('enforces project limit', async () => {
    const limitedApp = await setupAppWithCustomConfig(
        db.stores,
        {
            ...forkConfig,
            preRouterHook: forkPreRouterHook,
            resourceLimits: { projects: 1 },
        },
        db.rawDatabase,
    );

    await limitedApp.request
        .post(PROJECTS_BASE)
        .send({ name: 'Over limit project' })
        .expect(400);

    await limitedApp.destroy();
});
