import type { FromSchema } from 'json-schema-to-ts';

export const updateEnvironmentSchema = {
    $id: '#/components/schemas/updateEnvironmentSchema',
    type: 'object',
    additionalProperties: false,
    description:
        'Data used to update an [environment](https://docs.getunleash.io/concepts/environments).',
    properties: {
        type: {
            type: 'string',
            description:
                'Updates the type of environment (i.e. development or production).',
            example: 'production',
        },
        sortOrder: {
            type: 'integer',
            description: 'Changes the sort order of this environment.',
            example: 2,
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

export type UpdateEnvironmentSchema = FromSchema<
    typeof updateEnvironmentSchema
>;
