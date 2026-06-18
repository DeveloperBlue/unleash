import type { Response } from 'express';
import Controller from '../routes/controller.js';
import type { IUnleashConfig } from '../types/option.js';
import type { IUnleashServices } from '../services/index.js';
import type { IUnleashStores } from '../types/stores.js';
import type { IAuthRequest } from '../routes/unleash-types.js';
import { ADMIN, NONE } from '../types/permissions.js';
import { createRequestSchema } from '../openapi/util/create-request-schema.js';
import {
    createResponseSchema,
    resourceCreatedResponseSchema,
} from '../openapi/util/create-response-schema.js';
import {
    emptyResponse,
    getStandardResponses,
} from '../openapi/util/standard-responses.js';
import type { CreateEnvironmentSchema } from '../openapi/spec/create-environment-schema.js';
import type { UpdateEnvironmentSchema } from '../openapi/spec/update-environment-schema.js';
import type { CloneEnvironmentSchema } from '../openapi/spec/clone-environment-schema.js';
import type { EnvironmentSchema } from '../openapi/spec/environment-schema.js';
import type { NameSchema } from '../openapi/spec/name-schema.js';
import EnvironmentAdminService from './environment-admin-service.js';
import { serializeDates } from '../types/index.js';

const FORK_API_RELEASE = { stable: '5.5.0' } as const;

interface EnvironmentParam {
    name: string;
}

export default class ForkEnvironmentAdminController extends Controller {
    private environmentAdminService: EnvironmentAdminService;

    constructor(
        config: IUnleashConfig,
        services: IUnleashServices,
        stores: IUnleashStores,
    ) {
        super(config);
        this.environmentAdminService = new EnvironmentAdminService(
            config,
            services,
            stores,
        );

        this.route({
            method: 'post',
            path: '/validate',
            handler: this.validateEnvironmentName,
            permission: NONE,
            middleware: [
                services.openApiService.validPath({
                    summary: 'Validates if an environment name exists',
                    description:
                        'Uses the name provided in the body of the request to validate if the given name exists or not',
                    tags: ['Environments'],
                    release: FORK_API_RELEASE,
                    operationId: 'validateEnvironmentName',
                    requestBody: createRequestSchema('nameSchema'),
                    responses: {
                        204: emptyResponse,
                        ...getStandardResponses(400, 401, 409, 415),
                    },
                }),
            ],
        });

        this.route({
            method: 'put',
            path: '/update/:name',
            handler: this.updateEnvironment,
            permission: ADMIN,
            middleware: [
                services.openApiService.validPath({
                    summary: 'Update an environment',
                    tags: ['Environments'],
                    release: FORK_API_RELEASE,
                    operationId: 'updateEnvironment',
                    parameters: [
                        {
                            name: 'name',
                            in: 'path',
                            required: true,
                            schema: { type: 'string' },
                        },
                    ],
                    requestBody: createRequestSchema('updateEnvironmentSchema'),
                    responses: {
                        200: createResponseSchema('environmentSchema'),
                        ...getStandardResponses(400, 401, 403, 404, 415),
                    },
                }),
            ],
        });

        this.route({
            method: 'post',
            path: '/:name/clone',
            handler: this.cloneEnvironment,
            permission: ADMIN,
            middleware: [
                services.openApiService.validPath({
                    summary: 'Clone an environment',
                    tags: ['Environments'],
                    release: FORK_API_RELEASE,
                    operationId: 'cloneEnvironment',
                    parameters: [
                        {
                            name: 'name',
                            in: 'path',
                            required: true,
                            schema: { type: 'string' },
                        },
                    ],
                    requestBody: createRequestSchema('cloneEnvironmentSchema'),
                    responses: {
                        201: resourceCreatedResponseSchema('environmentSchema'),
                        ...getStandardResponses(400, 401, 403, 404, 409, 415),
                    },
                }),
            ],
        });

        this.route({
            method: 'delete',
            path: '/:name',
            handler: this.deleteEnvironment,
            permission: ADMIN,
            acceptAnyContentType: true,
            middleware: [
                services.openApiService.validPath({
                    summary: 'Delete an environment',
                    tags: ['Environments'],
                    release: FORK_API_RELEASE,
                    operationId: 'deleteEnvironment',
                    parameters: [
                        {
                            name: 'name',
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
            path: '/',
            handler: this.createEnvironment,
            permission: ADMIN,
            middleware: [
                services.openApiService.validPath({
                    summary: 'Create an environment',
                    tags: ['Environments'],
                    release: FORK_API_RELEASE,
                    operationId: 'createEnvironment',
                    requestBody: createRequestSchema('createEnvironmentSchema'),
                    responses: {
                        201: resourceCreatedResponseSchema('environmentSchema'),
                        ...getStandardResponses(400, 401, 403, 409, 415),
                    },
                }),
            ],
        });
    }

    async validateEnvironmentName(
        req: IAuthRequest<unknown, unknown, NameSchema>,
        res: Response,
    ): Promise<void> {
        const { name } = req.body;
        await this.environmentAdminService.validateName(name);
        res.status(204).send();
    }

    async createEnvironment(
        req: IAuthRequest<unknown, unknown, CreateEnvironmentSchema>,
        res: Response<EnvironmentSchema>,
    ): Promise<void> {
        const environment =
            await this.environmentAdminService.createEnvironment(
                req.body,
                req.audit,
            );
        res.status(201).json(serializeDates(environment));
    }

    async updateEnvironment(
        req: IAuthRequest<EnvironmentParam, unknown, UpdateEnvironmentSchema>,
        res: Response<EnvironmentSchema>,
    ): Promise<void> {
        const { name } = req.params;
        const environment =
            await this.environmentAdminService.updateEnvironment(
                name,
                req.body,
            );
        res.status(200).json(serializeDates(environment));
    }

    async deleteEnvironment(
        req: IAuthRequest<EnvironmentParam>,
        res: Response,
    ): Promise<void> {
        const { name } = req.params;
        await this.environmentAdminService.deleteEnvironment(name);
        res.status(200).send();
    }

    async cloneEnvironment(
        req: IAuthRequest<EnvironmentParam, unknown, CloneEnvironmentSchema>,
        res: Response<EnvironmentSchema>,
    ): Promise<void> {
        const { name } = req.params;
        const environment = await this.environmentAdminService.cloneEnvironment(
            name,
            req.body,
            req.audit,
        );
        res.status(201).json(serializeDates(environment));
    }
}
