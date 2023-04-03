import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/obfuscator-io-metro-plugin/__docusaurus/debug',
    component: ComponentCreator('/obfuscator-io-metro-plugin/__docusaurus/debug', 'c28'),
    exact: true
  },
  {
    path: '/obfuscator-io-metro-plugin/__docusaurus/debug/config',
    component: ComponentCreator('/obfuscator-io-metro-plugin/__docusaurus/debug/config', '204'),
    exact: true
  },
  {
    path: '/obfuscator-io-metro-plugin/__docusaurus/debug/content',
    component: ComponentCreator('/obfuscator-io-metro-plugin/__docusaurus/debug/content', '44b'),
    exact: true
  },
  {
    path: '/obfuscator-io-metro-plugin/__docusaurus/debug/globalData',
    component: ComponentCreator('/obfuscator-io-metro-plugin/__docusaurus/debug/globalData', 'ffa'),
    exact: true
  },
  {
    path: '/obfuscator-io-metro-plugin/__docusaurus/debug/metadata',
    component: ComponentCreator('/obfuscator-io-metro-plugin/__docusaurus/debug/metadata', '96e'),
    exact: true
  },
  {
    path: '/obfuscator-io-metro-plugin/__docusaurus/debug/registry',
    component: ComponentCreator('/obfuscator-io-metro-plugin/__docusaurus/debug/registry', '807'),
    exact: true
  },
  {
    path: '/obfuscator-io-metro-plugin/__docusaurus/debug/routes',
    component: ComponentCreator('/obfuscator-io-metro-plugin/__docusaurus/debug/routes', '136'),
    exact: true
  },
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
