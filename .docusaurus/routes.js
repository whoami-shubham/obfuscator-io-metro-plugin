import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/markdown-page',
    component: ComponentCreator('/markdown-page', 'da8'),
    exact: true
  },
  {
    path: '/docs',
    component: ComponentCreator('/docs', '703'),
    routes: [
      {
        path: '/docs/intro',
        component: ComponentCreator('/docs/intro', 'aed'),
        exact: true,
        sidebar: "tutorialSidebar"
      }
    ]
  },
  {
    path: '/',
    component: ComponentCreator('/', 'f43'),
    exact: true
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
