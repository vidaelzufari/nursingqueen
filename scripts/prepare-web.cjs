const fs = require("fs");
const path = require("path");
const source = path.dirname(require.resolve("sql.js/package.json"));
const destination = path.join(__dirname, "../public/vendor");
fs.mkdirSync(destination, { recursive: true });
fs.copyFileSync(path.join(source, "dist/sql-asm.js"), path.join(destination, "sql-asm.js"));
fs.copyFileSync(path.join(source, "LICENSE"), path.join(destination, "sql.js-LICENSE"));
