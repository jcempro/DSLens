# Origem: https://github.com/jcempro/DSLens
# Autor: JeanCarloEM - https://jeancarloem.com
# Licença: MPL-2.0 - https://mozilla.org/MPL/2.0/
# Resumo: uso, cópia, modificação e distribuição conforme a MPL-2.0.

"""Executa os vetores canônicos offline contra a implementação Python."""

import importlib.util
import json
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('dslens_python', ROOT / 'src/py/dsl.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
vectors = json.loads((ROOT / 'tests/conformance/v1.json').read_text(encoding='utf-8'))
request_vectors = json.loads(
    (ROOT / 'tests/conformance/request-v2.json').read_text(encoding='utf-8')
)

failures = []
for case in vectors['cases']:
    actual = module.resolve_dsl_data(vectors['data'], case['path'])
    if actual != case['expected']:
        failures.append(f"{case['id']}: esperado={case['expected']!r} obtido={actual!r}")

for case in vectors['detection']:
    actual = module.has_parser_expression(case['input'])
    if actual != case['expected']:
        failures.append(f"detect: esperado={case['expected']!r} obtido={actual!r}")

for case in request_vectors['cases']:
    actual = module._extract_dsl(case['input'])
    method = actual['request']['method'] if actual and actual['request'] else 'GET'
    if not actual or method != case['expected']['method'] or actual['path'] != case['expected']['path']:
        failures.append(f"request: {case['id']}")

for value in request_vectors['invalid']:
    if module._extract_dsl(value) is not None:
        failures.append(f"request inválido aceito: {value}")


class RequestHandler(BaseHTTPRequestHandler):
    received = None

    def do_POST(self):
        length = int(self.headers.get('content-length', '0'))
        RequestHandler.received = {
            'path': self.path,
            'token': self.headers.get('x-token'),
            'body': self.rfile.read(length).decode(),
        }
        payload = b'{"value":"ok"}'
        self.send_response(200)
        self.send_header('content-type', 'application/json')
        self.send_header('content-length', str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def log_message(self, _format, *_args):
        return


server = HTTPServer(('127.0.0.1', 0), RequestHandler)
thread = threading.Thread(target=server.serve_forever, daemon=True)
thread.start()
try:
    expression = (
        '${"http://127.0.0.1:%d/fixture"; request={"method":"POST",'
        '"query":{"page":1},"headers":{"X-Token":{"env":"TOKEN"}},'
        '"body":{"encoding":"json","value":{"id":7}}}}.value'
    ) % server.server_port
    actual = module.resolve_parser_expression(
        expression, env={'TOKEN': 'safe-test-token'}
    )
    if actual != 'ok' or RequestHandler.received != {
        'path': '/fixture?page=1',
        'token': 'safe-test-token',
        'body': '{"id":7}',
    }:
        failures.append('request Python E2E divergente')
finally:
    server.shutdown()
    server.server_close()

if failures:
    raise SystemExit('\n'.join(failures))

print(f"PASS python conformance ({len(vectors['cases']) + len(vectors['detection'])} casos)")
