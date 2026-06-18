import type { IUnleashConfig } from '../types/option.js';
import type { IUnleashServices } from '../services/index.js';
import type { IUnleashStores } from '../types/stores.js';
import type {
    IEnvironment,
    IEnvironmentClone,
    IEnvironmentCreate,
} from '../types/model.js';
import type { IAuditUser } from '../types/user.js';
import { throwExceedsLimitError } from '../error/exceeds-limit-error.js';
import NameExistsError from '../error/name-exists-error.js';
import NotFoundError from '../error/notfound-error.js';
import InvalidOperationError from '../error/invalid-operation-error.js';
import type EnvironmentService from '../features/project-environments/environment-service.js';
import type { FeatureToggleService } from '../features/feature-toggle/feature-toggle-service.js';
import type { ResourceLimitsService } from '../features/resource-limits/resource-limits-service.js';
import type { IEnvironmentStore } from '../features/project-environments/environment-store-type.js';
import type { IProjectStore } from '../features/project/project-store-type.js';
import type { IAccessStore } from '../types/stores/access-store.js';
import type EventEmitter from 'events';
import type { UpdateEnvironmentSchema } from '../openapi/spec/update-environment-schema.js';

export default class EnvironmentAdminService {
    private environmentStore: IEnvironmentStore;

    private projectStore: IProjectStore;

    private accessStore: IAccessStore;

    private environmentService: EnvironmentService;

    private featureToggleService: FeatureToggleService;

    private resourceLimitsService: ResourceLimitsService;

    private eventBus: EventEmitter;

    constructor(
        config: IUnleashConfig,
        {
            environmentService,
            featureToggleService,
            resourceLimitsService,
        }: Pick<
            IUnleashServices,
            | 'environmentService'
            | 'featureToggleService'
            | 'resourceLimitsService'
        >,
        {
            environmentStore,
            projectStore,
            accessStore,
        }: Pick<
            IUnleashStores,
            'environmentStore' | 'projectStore' | 'accessStore'
        >,
    ) {
        this.environmentStore = environmentStore;
        this.projectStore = projectStore;
        this.accessStore = accessStore;
        this.environmentService = environmentService;
        this.featureToggleService = featureToggleService;
        this.resourceLimitsService = resourceLimitsService;
        this.eventBus = config.eventBus;
    }

    async validateEnvironmentLimit(): Promise<void> {
        const { environments } =
            await this.resourceLimitsService.getResourceLimits();
        const limit = Math.max(environments, 1);
        const environmentCount = await this.environmentStore.count();

        if (environmentCount >= limit) {
            throwExceedsLimitError(this.eventBus, {
                resource: 'environment',
                limit,
            });
        }
    }

    async validateName(name: string): Promise<void> {
        if (!name) {
            throw new NameExistsError('Environment name cannot be empty');
        }

        if (await this.environmentStore.exists(name)) {
            throw new NameExistsError(
                'An environment with this name already exists.',
            );
        }
    }

    async createEnvironment(
        input: IEnvironmentCreate,
        auditUser: IAuditUser,
    ): Promise<IEnvironment> {
        await this.validateEnvironmentLimit();
        await this.validateName(input.name);

        const sortOrder =
            input.sortOrder ??
            (await this.environmentStore.getMaxSortOrder()) + 1;

        const environment = await this.environmentStore.create({
            ...input,
            sortOrder,
            enabled: input.enabled ?? true,
        });

        const projects = await this.projectStore.getAll();
        await Promise.all(
            projects.map((project) =>
                this.environmentService.addEnvironmentToProject(
                    environment.name,
                    project.id,
                    auditUser,
                ),
            ),
        );

        return environment;
    }

    async updateEnvironment(
        name: string,
        input: UpdateEnvironmentSchema,
    ): Promise<IEnvironment> {
        const existing = await this.environmentStore.get(name);
        if (!existing) {
            throw new NotFoundError(
                `Could not find environment with name ${name}`,
            );
        }

        if (existing.protected) {
            throw new InvalidOperationError(
                'You can not update a protected environment',
            );
        }

        return this.environmentStore.update(
            {
                type: input.type ?? existing.type,
                protected: existing.protected,
                requiredApprovals:
                    input.requiredApprovals !== undefined
                        ? input.requiredApprovals
                        : existing.requiredApprovals,
                ...(input.sortOrder !== undefined
                    ? { sortOrder: input.sortOrder }
                    : {}),
            },
            name,
        );
    }

    async deleteEnvironment(name: string): Promise<void> {
        const existing = await this.environmentStore.get(name);
        if (!existing) {
            throw new NotFoundError(
                `Could not find environment with name ${name}`,
            );
        }

        if (existing.protected) {
            throw new InvalidOperationError(
                'You can not delete a protected environment',
            );
        }

        const projectLinks =
            await this.projectStore.getProjectLinksForEnvironments([name]);

        await Promise.all(
            projectLinks.map(async (link) => {
                await this.environmentService.forceRemoveEnvironmentFromProject(
                    name,
                    link.projectId,
                );
                await this.featureToggleService.deleteEnvironment(
                    link.projectId,
                    name,
                );
            }),
        );

        await this.environmentStore.delete(name);
    }

    async cloneEnvironment(
        sourceName: string,
        input: IEnvironmentClone,
        auditUser: IAuditUser,
    ): Promise<IEnvironment> {
        const source = await this.environmentStore.get(sourceName);
        if (!source) {
            throw new NotFoundError(
                `Could not find environment with name ${sourceName}`,
            );
        }

        await this.validateEnvironmentLimit();
        await this.validateName(input.name);

        const sortOrder = (await this.environmentStore.getMaxSortOrder()) + 1;

        const environment = await this.environmentStore.create({
            name: input.name,
            type: input.type,
            sortOrder,
            enabled: source.enabled,
            requiredApprovals: source.requiredApprovals,
        });

        const projects = input.projects ?? [];
        await Promise.all(
            projects.map((projectId) =>
                this.environmentService.addEnvironmentToProject(
                    environment.name,
                    projectId,
                    auditUser,
                ),
            ),
        );

        if (input.clonePermissions !== false) {
            await this.accessStore.cloneEnvironmentPermissions(
                sourceName,
                input.name,
            );
        }

        return environment;
    }
}
