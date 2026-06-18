import type { FromSchema } from 'json-schema-to-ts';

export const createEnvironmentSchema = {
    $id: '#/components/schemas/createEnvironmentSchema',
    type: 'object',
    additionalProperties: false,
    required: ['name', 'type'],
    description:
        'Data required to create a new [environment](https://docs.getunleash.io/concepts/environments)',
    properties: {
        name: {
            type: 'string',
            pattern: '^[a-zA-Z0-9~_.-]+$',
            description:
                'The name of the environment. Must be a URL-friendly string.',
            example: 'staging',
        },
        type: {
            type: 'string',
            minLength: 1,
            description:
                'The type of environment (e.g. development, production).',
            example: 'production',
        },
        enabled: {
            type: 'boolean',
            description:
                'Newly created environments are enabled by default. Set to `false` to create in a disabled state.',
            example: true,
        },
        sortOrder: {
            type: 'integer',
            description:
                'Defines where in the list of environments to place this environment.',
            example: 4,
        },
        requiredApprovals: {
            type: 'integer',
            nullable: true,
            minimum: 1,
            description:
                'Experimental field. The number of approvals required before a change request can be applied in this environment.',
            example: 2,
        },
    },
    components: {},
} as const;

export type CreateEnvironmentSchema = FromSchema<
    typeof createEnvironmentSchema
>;
