import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/obfuscator-io-metro-plugin/markdown-page',
    component: ComponentCreator('/obfuscator-io-metro-plugin/markdown-page', 'f8e'),
    exact: true
  },
  {
    path: '/obfuscator-io-metro-plugin/docs',
    component: ComponentCreator('/obfuscator-io-metro-plugin/docs', '723'),
    routes: [
      {
        path: '/obfuscator-io-metro-plugin/docs/intro',
        component: ComponentCreator('/obfuscator-io-metro-plugin/docs/intro', 'f4a'),
        exact: true,
        sidebar: "tutorialSidebar"
      }
    ]
  },
  {
    path: '/obfuscator-io-metro-plugin/',
    component: ComponentCreator('/obfuscator-io-metro-plugin/', '4da'),
    exact: true
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
