# Origem: https://github.com/jcempro/DSLens
# Autor: JeanCarloEM - https://jeancarloem.com
# Licença: MPL-2.0 - https://mozilla.org/MPL/2.0/
# Resumo: uso, cópia, modificação e distribuição conforme a MPL-2.0.

"""Executa os vetores canônicos offline contra a implementação Python."""

import importlib.util
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('dslens_python', ROOT / 'src/py/dsl.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
vectors = json.loads((ROOT / 'tests/conformance/v1.json').read_text(encoding='utf-8'))

failures = []
for case in vectors['cases']:
    actual = module.resolve_dsl_data(vectors['data'], case['path'])
    if actual != case['expected']:
        failures.append(f"{case['id']}: esperado={case['expected']!r} obtido={actual!r}")

for case in vectors['detection']:
    actual = module.has_parser_expression(case['input'])
    if actual != case['expected']:
        failures.append(f"detect: esperado={case['expected']!r} obtido={actual!r}")

if failures:
    raise SystemExit('\n'.join(failures))

print(f"PASS python conformance ({len(vectors['cases']) + len(vectors['detection'])} casos)")
