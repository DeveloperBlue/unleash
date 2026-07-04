import type { FromSchema } from 'json-schema-to-ts';

export const cloneEnvironmentSchema = {
    $id: '#/components/schemas/cloneEnvironmentSchema',
    type: 'object',
    additionalProperties: false,
    required: ['name', 'type'],
    description: 'Data used to clone an environment.',
    properties: {
        name: {
            type: 'string',
            pattern: '^[a-zA-Z0-9~_.-]+$',
            description:
                'The name of the new cloned environment, this cannot be changed later',
            example: 'staging-clone',
        },
        type: {
            type: 'string',
            description:
                'Updates the type of environment (i.e. development or production).',
            example: 'production',
        },
        projects: {
            type: 'array',
            description:
                'A list of projects that should be included in the cloned environment.',
            items: {
                type: 'string',
            },
            example: ['default'],
        },
        clonePermissions: {
            type: 'boolean',
            description:
                'Copies the RBAC permissions from the source environment if true. Defaults to true',
            example: true,
        },
    },
    components: {},
} as const;

export type CloneEnvironmentSchema = FromSchema<typeof cloneEnvironmentSchema>;
