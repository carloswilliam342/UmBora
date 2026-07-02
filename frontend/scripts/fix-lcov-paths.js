/**
 * Normaliza os caminhos do relatório de cobertura (lcov.info) para usar "/".
 *
 * No Windows, o Istanbul/Jest gera linhas como `SF:src\screens\Foo.js` (barra
 * invertida). O parser de cobertura do SonarQube espera caminhos com barra
 * normal (`SF:src/screens/Foo.js`); com barra invertida ele não consegue
 * mapear os arquivos e reporta cobertura muito abaixo da real.
 *
 * Este script roda após o `jest --coverage` e converte as barras nas linhas SF:.
 */
const fs = require('fs');
const path = require('path');

const lcovPath = path.resolve(__dirname, '..', 'coverage', 'lcov.info');

if (!fs.existsSync(lcovPath)) {
  console.error(`[fix-lcov-paths] Arquivo não encontrado: ${lcovPath}`);
  process.exit(0);
}

const original = fs.readFileSync(lcovPath, 'utf8');
const fixed = original.replace(/^SF:(.*)$/gm, (_match, filePath) =>
  `SF:${filePath.replace(/\\/g, '/')}`
);

if (original !== fixed) {
  fs.writeFileSync(lcovPath, fixed, 'utf8');
  console.log('[fix-lcov-paths] Caminhos do lcov.info normalizados para "/".');
} else {
  console.log('[fix-lcov-paths] Nenhuma alteração necessária (já usa "/").');
}
