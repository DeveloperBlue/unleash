import type { FromSchema } from 'json-schema-to-ts';

export const updateProjectSchema = {
    $id: '#/components/schemas/updateProjectSchema',
    type: 'object',
    additionalProperties: false,
    required: ['name'],
    description:
        'Data used to update a [project](https://docs.getunleash.io/concepts/projects)',
    properties: {
        id: {
            type: 'string',
            pattern: '[A-Za-z0-9_~.-]*',
            deprecated: true,
            description:
                'The project identifier. Prefer using the projectId path parameter instead.',
            example: 'my-project',
        },
        name: {
            type: 'string',
            pattern: '^(?!\\s*$).+',
            description:
                'The new name of the project. The name must contain at least one non-whitespace character.',
            example: 'My project',
        },
        description: {
            type: 'string',
            description: 'A new description for the project',
            example: 'Updated description',
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
            type: 'number',
            nullable: true,
            description:
                'A limit on the number of features allowed in the project. Null if no limit.',
            example: 100,
        },
    },
    components: {},
} as const;

export type UpdateProjectSchema = FromSchema<typeof updateProjectSchema>;
