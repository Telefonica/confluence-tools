// SPDX-FileCopyrightText: 2024 Telefónica Innovación Digital
// SPDX-License-Identifier: MIT

// For a detailed explanation regarding each configuration property, visit:
// https://www.mocks-server.org/docs/configuration/how-to-change-settings
// https://www.mocks-server.org/docs/configuration/options

/** @type {import('@mocks-server/core').Configuration} */

module.exports = {
  mock: {
    collections: {
      // Selected collection
      selected: "base",
    },
  },
  files: {
    babelRegister: {
      // Load @babel/register
      enabled: true,
      // Options for @babel/register
      options: {
        configFile: false,
        presets: [
          ["@babel/preset-env", { targets: { node: "current" } }],
          "@babel/preset-typescript",
        ],
      },
    },
  },
};
