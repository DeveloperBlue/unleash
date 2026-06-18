import type { FromSchema } from 'json-schema-to-ts';

export const createProjectSchema = {
    $id: '#/components/schemas/createProjectSchema',
    type: 'object',
    additionalProperties: false,
    required: ['name'],
    description:
        'Data used to create a new [project](https://docs.getunleash.io/concepts/projects).',
    properties: {
        name: {
            type: 'string',
            pattern: '^(?!\\s*$).+',
            description:
                "The project's name. The name must contain at least one non-whitespace character.",
            example: 'My project',
        },
        id: {
            type: 'string',
            pattern: '[A-Za-z0-9_~.-]*',
            deprecated: true,
            description:
                "The project's identifier. If this property is not present or is an empty string, Unleash will generate the project id automatically.",
            example: 'my-project',
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
        environments: {
            type: 'array',
            description:
                'A list of environments that should be enabled for this project.',
            items: {
                type: 'string',
            },
            example: ['development', 'production'],
        },
        changeRequestEnvironments: {
            type: 'array',
            description:
                'A list of environments that should have change requests enabled.',
            items: {
                type: 'object',
                required: ['name'],
                properties: {
                    name: {
                        type: 'string',
                        description: 'The environment name',
                    },
                    requiredApprovals: {
                        type: 'integer',
                        minimum: 1,
                        description:
                            'The number of approvals required for change requests in this environment',
                    },
                },
            },
        },
    },
    components: {},
} as const;

export type CreateProjectSchema = FromSchema<typeof createProjectSchema>;
