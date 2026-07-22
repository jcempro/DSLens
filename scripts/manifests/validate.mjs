/* Origem: https://github.com/jcempro/DSLens | Autor: JeanCarloEM | MPL-2.0 https://mozilla.org/MPL/2.0/ */
import { readFile } from 'node:fs/promises';

const index = JSON.parse(
  await readFile('manifests/components/index.json', 'utf8'),
);
if (index.schemaVersion !== 1 || !Array.isArray(index.components))
  throw new Error('indice de componentes invalido');

const rootPackage = JSON.parse(await readFile('package.json', 'utf8'));
for (const component of index.components) {
  const manifest = JSON.parse(await readFile(component.manifest, 'utf8'));
  for (const key of [
    'schemaVersion',
    'id',
    'name',
    'summary',
    'category',
    'entrypoints',
    'environments',
    'exports',
    'signature',
    'parameters',
    'returns',
    'sideEffects',
    'dependencies',
    'requirements',
    'since',
    'stability',
    'normativeReference',
  ])
    if (!Object.prototype.hasOwnProperty.call(manifest, key))
      throw new Error(`${component.id}: campo ausente ${key}`);
  if (manifest.id !== component.id)
    throw new Error(`${component.id}: id divergente`);
  for (const entry of Object.values(manifest.entrypoints)) {
    const subpath = `.${entry.replace(rootPackage.name, '')}`;
    if (!rootPackage.exports[subpath])
      throw new Error(`${component.id}: export ausente ${subpath}`);
  }
}

console.log(`manifests ok components=${index.components.length}`);

