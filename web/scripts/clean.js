const fs = require("fs");

const dir = process.env.NODE_V8_COVERAGE;

// console.log(dir, fs.existsSync(dir))
if (fs.existsSync(dir)) {
  console.log(`clean previous ${dir} ...`);
  fs.rmSync(dir, {
    recursive: true,
    force: true,
  });
}
