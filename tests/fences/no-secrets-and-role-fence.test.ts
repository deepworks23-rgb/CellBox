/**
 * Cerca da Fábrica DeskLabs (Conformidade 5.9, 5.17, 12.20):
 * - Dono: Equipa CellBox
 * - Motivo: Impedir vazamento de segredos hardcoded em src/ e metadata placeholder em produção.
 * - Data de revisão: 2026-11-26
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

function collectSourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...collectSourceFiles(full));
    } else if (/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

test('varredura de segredos: nenhum segredo real ou DSN com credencial em src/', () => {
  const files = collectSourceFiles(path.join(ROOT, 'src'));
  const secretPatterns = [
    /postgresql:\/\/[^:\s"']+:[^@\s"']+@/i,
    /sk_live_[A-Za-z0-9]{16,}/,
    /AIza[0-9A-Za-z\-_]{30,}/,
    /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  ];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    for (const pattern of secretPatterns) {
      assert.equal(
        pattern.test(content),
        false,
        `Possível segredo detectado em ${path.relative(ROOT, file)} (${pattern})`
      );
    }
  }
});

test('metadata de entrada não usa placeholder genérico (react-example)', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')) as {
    name: string;
    version: string;
  };
  assert.notEqual(pkg.name, 'react-example');
  assert.notEqual(pkg.version, '0.0.0');

  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert.ok(html.includes('CellBox'), 'index.html deve identificar o produto CellBox');
});

test('cerca de papéis (Conformidade 6.2): nenhuma comparação manual de .role em src/server/app.ts', () => {
  const appPath = path.join(ROOT, 'src', 'server', 'app.ts');
  const content = fs.readFileSync(appPath, 'utf8');
  const manualRoleChecks = content.match(/\.role\s*[!=]==?/g) ?? [];
  assert.equal(
    manualRoleChecks.length,
    0,
    `Encontradas ${manualRoleChecks.length} comparações manuais de .role em src/server/app.ts; use requireRole/hasRole de src/server/security.ts.`
  );
});
