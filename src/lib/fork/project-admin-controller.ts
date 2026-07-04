import type { Response } from 'express';
import Controller from '../routes/controller.js';
import type { IUnleashConfig } from '../types/option.js';
import type { IUnleashServices } from '../services/index.js';
import type { OpenApiService } from '../services/openapi-service.js';
import type ProjectService from '../features/project/project-service.js';
import type { IAuthRequest } from '../routes/unleash-types.js';
import {
    CREATE_PROJECT,
    DELETE_PROJECT,
    NONE,
    UPDATE_PROJECT,
} from '../types/permissions.js';
import { createRequestSchema } from '../openapi/util/create-request-schema.js';
import {
    createResponseSchema,
    resourceCreatedResponseSchema,
} from '../openapi/util/create-response-schema.js';
import {
    emptyResponse,
    getStandardResponses,
} from '../openapi/util/standard-responses.js';
import type { CreateProjectSchema } from '../openapi/spec/create-project-schema.js';
import type { ProjectCreatedSchema } from '../openapi/spec/project-created-schema.js';
import type { UpdateProjectSchema } from '../openapi/spec/update-project-schema.js';
import type { UpdateProjectEnterpriseSettingsSchema } from '../openapi/spec/update-project-enterprise-settings-schema.js';
import type { ValidateProjectIdSchema } from '../openapi/spec/validate-project-id-schema.js';
import type { IProjectEnterpriseSettingsUpdate } from '../features/project/project-store-type.js';
import type { IProjectUpdate } from '../types/model.js';
import { projectsSchema, type ProjectsSchema } from '../openapi/index.js';
import { serializeDates } from '../types/index.js';

const FORK_API_RELEASE = { stable: '5.5.0' } as const;

interface ProjectParam {
    projectId: string;
}

export default class ForkProjectAdminController extends Controller {
    private openApiService: OpenApiService;

    private projectService: ProjectService;

    constructor(
        config: IUnleashConfig,
        {
            projectService,
            openApiService,
        }: Pick<IUnleashServices, 'projectService' | 'openApiService'>,
    ) {
        super(config);
        this.openApiService = openApiService;
        this.projectService = projectService;

        this.route({
            method: 'get',
            path: '',
            handler: this.getProjects,
            permission: NONE,
            middleware: [
                openApiService.validPath({
                    tags: ['Projects'],
                    release: FORK_API_RELEASE,
                    operationId: 'getProjects',
                    summary: 'Get a list of all projects.',
                    description:
                        'This endpoint returns a list of all the projects in the Unleash instance.',
                    parameters: [
                        {
                            name: 'archived',
                            in: 'query',
                            required: false,
                            schema: {
                                type: 'boolean',
                            },
                        },
                    ],
                    responses: {
                        200: createResponseSchema('projectsSchema'),
                        ...getStandardResponses(401, 403),
                    },
                }),
            ],
        });

        this.route({
            method: 'post',
            path: '/validate',
            handler: this.validateProjectId,
            permission: NONE,
            middleware: [
                openApiService.validPath({
                    summary: 'Validates if a project id exists',
                    description:
                        'Uses the id provided in the body of the request to validate if the given id exists or not',
                    tags: ['Projects'],
                    release: FORK_API_RELEASE,
                    operationId: 'validateProjectId',
                    requestBody: createRequestSchema('validateProjectIdSchema'),
                    responses: {
                        204: emptyResponse,
                        ...getStandardResponses(400, 401, 409, 415),
                    },
                }),
            ],
        });

        this.route({
            method: 'post',
            path: '/archive/:projectId',
            handler: this.archiveProject,
            permission: UPDATE_PROJECT,
            acceptAnyContentType: true,
            middleware: [
                openApiService.validPath({
                    summary: 'Archive a project',
                    tags: ['Projects'],
                    release: FORK_API_RELEASE,
                    operationId: 'archiveProject',
                    parameters: [
                        {
                            name: 'projectId',
                            in: 'path',
                            required: true,
                            schema: { type: 'string' },
                        },
                    ],
                    responses: {
                        200: emptyResponse,
                        ...getStandardResponses(400, 401, 403, 404),
                    },
                }),
            ],
        });

        this.route({
            method: 'post',
            path: '/revive/:projectId',
            handler: this.reviveProject,
            permission: UPDATE_PROJECT,
            acceptAnyContentType: true,
            middleware: [
                openApiService.validPath({
                    summary: 'Revive an archived project',
                    tags: ['Projects'],
                    release: FORK_API_RELEASE,
                    operationId: 'reviveProject',
                    parameters: [
                        {
                            name: 'projectId',
                            in: 'path',
                            required: true,
                            schema: { type: 'string' },
                        },
                    ],
                    responses: {
                        200: emptyResponse,
                        ...getStandardResponses(400, 401, 403, 404, 409),
                    },
                }),
            ],
        });

        this.route({
            method: 'post',
            path: '/',
            handler: this.createProject,
            permission: CREATE_PROJECT,
            middleware: [
                openApiService.validPath({
                    summary: 'Create a project',
                    tags: ['Projects'],
                    release: FORK_API_RELEASE,
                    operationId: 'createProject',
                    requestBody: createRequestSchema('createProjectSchema'),
                    responses: {
                        201: resourceCreatedResponseSchema(
                            'projectCreatedSchema',
                        ),
                        ...getStandardResponses(400, 401, 403, 409, 415),
                    },
                }),
            ],
        });

        this.route({
            method: 'put',
            path: '/:projectId/settings',
            handler: this.updateProjectSettings,
            permission: UPDATE_PROJECT,
            middleware: [
                openApiService.validPath({
                    summary: 'Update project settings',
                    tags: ['Projects'],
                    release: FORK_API_RELEASE,
                    operationId: 'updateProjectEnterpriseSettings',
                    parameters: [
                        {
                            name: 'projectId',
                            in: 'path',
                            required: true,
                            schema: { type: 'string' },
                        },
                    ],
                    requestBody: createRequestSchema(
                        'updateProjectEnterpriseSettingsSchema',
                    ),
                    responses: {
                        200: emptyResponse,
                        ...getStandardResponses(400, 401, 403, 404, 415),
                    },
                }),
            ],
        });

        this.route({
            method: 'put',
            path: '/:projectId',
            handler: this.updateProject,
            permission: UPDATE_PROJECT,
            middleware: [
                openApiService.validPath({
                    summary: 'Update a project',
                    tags: ['Projects'],
                    release: FORK_API_RELEASE,
                    operationId: 'updateProject',
                    parameters: [
                        {
                            name: 'projectId',
                            in: 'path',
                            required: true,
                            schema: { type: 'string' },
                        },
                    ],
                    requestBody: createRequestSchema('updateProjectSchema'),
                    responses: {
                        200: emptyResponse,
                        ...getStandardResponses(400, 401, 403, 404, 415),
                    },
                }),
            ],
        });

        this.route({
            method: 'delete',
            path: '/:projectId',
            handler: this.deleteProject,
            permission: DELETE_PROJECT,
            acceptAnyContentType: true,
            middleware: [
                openApiService.validPath({
                    summary: 'Delete a project',
                    tags: ['Projects'],
                    release: FORK_API_RELEASE,
                    operationId: 'deleteProject',
                    parameters: [
                        {
                            name: 'projectId',
                            in: 'path',
                            required: true,
                            schema: { type: 'string' },
                        },
                    ],
                    responses: {
                        200: emptyResponse,
                        ...getStandardResponses(400, 401, 403, 404),
                    },
                }),
            ],
        });
    }

    async getProjects(
        req: IAuthRequest,
        res: Response<ProjectsSchema>,
    ): Promise<void> {
        const archived = req.query.archived;
        const query =
            archived === true || archived === 'true' ? { archived: true } : {};

        const projects = await this.projectService.getProjects(
            query,
            req.user.id,
        );

        const projectsWithOwners =
            await this.projectService.addOwnersToProjects(projects);

        this.openApiService.respondWithValidation(
            200,
            res,
            projectsSchema.$id,
            { version: 1, projects: serializeDates(projectsWithOwners) },
        );
    }

    async validateProjectId(
        req: IAuthRequest<unknown, unknown, ValidateProjectIdSchema>,
        res: Response,
    ): Promise<void> {
        const { id } = req.body;
        await this.projectService.validateId(id);
        res.status(204).send();
    }

    async createProject(
        req: IAuthRequest<unknown, unknown, CreateProjectSchema>,
        res: Response<ProjectCreatedSchema>,
    ): Promise<void> {
        const user = req.user.id > 0 ? req.user : { ...req.user, id: 0 };
        const project = await this.projectService.createProject(
            req.body,
            user,
            req.audit,
        );
        res.status(201).json(serializeDates(project));
    }

    async updateProject(
        req: IAuthRequest<ProjectParam, unknown, UpdateProjectSchema>,
        res: Response,
    ): Promise<void> {
        const { projectId } = req.params;
        await this.projectService.updateProject(
            { ...req.body, id: projectId } as IProjectUpdate,
            req.audit,
        );
        res.status(200).send();
    }

    async updateProjectSettings(
        req: IAuthRequest<
            ProjectParam,
            unknown,
            UpdateProjectEnterpriseSettingsSchema
        >,
        res: Response,
    ): Promise<void> {
        const { projectId } = req.params;
        await this.projectService.updateProjectEnterpriseSettings(
            { ...req.body, id: projectId } as IProjectEnterpriseSettingsUpdate,
            req.audit,
        );
        res.status(200).send();
    }

    async deleteProject(
        req: IAuthRequest<ProjectParam>,
        res: Response,
    ): Promise<void> {
        const { projectId } = req.params;
        await this.projectService.deleteProject(projectId, req.user, req.audit);
        res.status(200).send();
    }

    async archiveProject(
        req: IAuthRequest<ProjectParam>,
        res: Response,
    ): Promise<void> {
        const { projectId } = req.params;
        await this.projectService.archiveProject(projectId, req.audit);
        res.status(200).send();
    }

    async reviveProject(
        req: IAuthRequest<ProjectParam>,
        res: Response,
    ): Promise<void> {
        const { projectId } = req.params;
        await this.projectService.reviveProject(projectId, req.audit);
        res.status(200).send();
    }
}
