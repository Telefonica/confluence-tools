// SPDX-FileCopyrightText: 2024 Telefónica Innovación Digital
// SPDX-License-Identifier: MIT

const path = require("node:path");

module.exports = {
  confluence: {
    url: "https://my-confluence.com",
    spaceKey: "CTO",
  },
  docsDir: path.join(__dirname, "./docs"),
};
