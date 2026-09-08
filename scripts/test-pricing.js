/* eslint-disable @typescript-eslint/no-require-imports */
const ts = require('typescript');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

require.extensions['.ts'] = function (module, filename) {
  const source = fs.readFileSync(filename, 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
    fileName: filename,
  });

  let code = transpiled.outputText;
  code = code.replace(/require\((['"])@\/(.*?)\1\)/g, (_match, quote, relPath) => {
    const resolved = path.resolve(rootDir, 'src', relPath).replace(/\\/g, '/');
    return `require(${quote}${resolved}${quote})`;
  });

  return module._compile(code, filename);
};

require('../src/lib/pricing/pricing.test.ts');
