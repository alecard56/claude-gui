// File: babel.config.js
// Purpose: Babel configuration for transpiling JavaScript/TypeScript
// Usage: Used by Jest and other build tools
// Contains: Babel presets and plugins configuration
// Dependencies: None
// Iteration: 1

module.exports = {
    presets: [
      '@babel/preset-env',
      '@babel/preset-typescript',
      ['@babel/preset-react', { runtime: 'automatic' }]
    ],
    plugins: [
      ['@babel/plugin-proposal-decorators', { legacy: true }],
      ['@babel/plugin-proposal-class-properties', { loose: true }]
    ]
  };