import type { FromSchema } from 'json-schema-to-ts';
import { createFeatureNamingPatternSchema } from './create-feature-naming-pattern-schema.js';
import { projectLinkTemplateSchema } from './project-link-template-schema.js';

export const updateProjectEnterpriseSettingsSchema = {
    $id: '#/components/schemas/updateProjectEnterpriseSettingsSchema',
    type: 'object',
    additionalProperties: false,
    description:
        'Data used to update a [project](https://docs.getunleash.io/concepts/projects) settings',
    properties: {
        mode: {
            type: 'string',
            enum: ['open', 'protected', 'private'],
            description:
                'A mode of the project affecting what actions are possible in this project',
            example: 'open',
        },
        featureNaming: {
            $ref: '#/components/schemas/createFeatureNamingPatternSchema',
        },
        linkTemplates: {
            type: 'array',
            description:
                'A list of link templates that can be automatically added to new feature flags.',
            items: {
                $ref: '#/components/schemas/projectLinkTemplateSchema',
            },
        },
    },
    components: {
        schemas: {
            createFeatureNamingPatternSchema,
            projectLinkTemplateSchema,
        },
    },
} as const;

export type UpdateProjectEnterpriseSettingsSchema = FromSchema<
    typeof updateProjectEnterpriseSettingsSchema
>;
