import type { FromSchema } from 'json-schema-to-ts';

export const projectCreatedSchema = {
    $id: '#/components/schemas/projectCreatedSchema',
    type: 'object',
    additionalProperties: false,
    required: ['id', 'name'],
    description: 'Details about the newly created project.',
    properties: {
        id: {
            type: 'string',
            pattern: '[A-Za-z0-9_~.-]+',
            description: "The project's identifier.",
            example: 'my-project',
        },
        name: {
            type: 'string',
            minLength: 1,
            description: "The project's name.",
            example: 'My project',
        },
        description: {
            type: 'string',
            nullable: true,
            description: "The project's description.",
            example: 'A project for my team',
        },
        mode: {
            type: 'string',
            enum: ['open', 'protected', 'private'],
            description:
                'A mode of the project affecting what actions are possible in this project',
            example: 'open',
        },
        defaultStickiness: {
            type: 'string',
            description:
                'A default stickiness for the project affecting the default stickiness value for variants and Gradual Rollout strategy',
            example: 'userId',
        },
        featureLimit: {
            type: 'integer',
            nullable: true,
            description:
                'A limit on the number of features allowed in the project. `null` if no limit.',
            example: null,
        },
        environments: {
            type: 'array',
            description: 'The environments enabled for the project.',
            items: {
                type: 'string',
            },
            example: ['development', 'production'],
        },
        changeRequestEnvironments: {
            type: 'array',
            description:
                'The list of environments that have change requests enabled.',
            items: {
                type: 'object',
                required: ['name', 'requiredApprovals'],
                properties: {
                    name: {
                        type: 'string',
                    },
                    requiredApprovals: {
                        type: 'integer',
                        minimum: 1,
                    },
                },
            },
        },
    },
    components: {},
} as const;

export type ProjectCreatedSchema = FromSchema<typeof projectCreatedSchema>;
