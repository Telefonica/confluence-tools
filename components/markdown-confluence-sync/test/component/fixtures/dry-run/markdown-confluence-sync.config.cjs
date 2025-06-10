// SPDX-FileCopyrightText: 2025 Telefónica Innovación Digital
// SPDX-License-Identifier: MIT

const path = require("node:path");

module.exports = {
  confluence: {
    url: "https://my-confluence.com",
    spaceKey: "FOO",
  },
  docsDir: path.join(__dirname, "./docs"),
  dryRun: true,
};
