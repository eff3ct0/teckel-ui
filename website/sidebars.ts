import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docs: [
    'intro',
    {
      type: 'category',
      label: 'Getting Started',
      items: [
        'getting-started/installation',
        'getting-started/connecting-backend',
      ],
    },
    {
      type: 'category',
      label: 'User Guide',
      items: [
        'user-guide/canvas-editor',
        'user-guide/yaml-roundtrip',
        'user-guide/validation',
        'user-guide/execution',
        'user-guide/variables-secrets',
      ],
    },
    {
      type: 'category',
      label: 'Development',
      items: [
        'development/architecture',
        'development/components',
        'development/grpc-client',
      ],
    },
  ],
};

export default sidebars;
