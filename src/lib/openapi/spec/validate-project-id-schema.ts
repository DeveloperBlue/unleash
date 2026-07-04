import type { FromSchema } from 'json-schema-to-ts';

export const validateProjectIdSchema = {
    $id: '#/components/schemas/validateProjectIdSchema',
    type: 'object',
    additionalProperties: false,
    required: ['id'],
    description: 'Data used to validate a project id',
    properties: {
        id: {
            type: 'string',
            pattern: '[A-Za-z0-9_~.-]*',
            description: 'The project id to validate',
            example: 'my-project',
        },
    },
    components: {},
} as const;

export type ValidateProjectIdSchema = FromSchema<
    typeof validateProjectIdSchema
>;
