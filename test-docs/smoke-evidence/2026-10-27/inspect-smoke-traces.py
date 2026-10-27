import json
import pathlib
import zipfile

root = pathlib.Path('test-docs/smoke-evidence/2026-10-27')
output = []
for subdir in ['artifacts', 'catalogue-check/artifacts']:
    trace = next((root / subdir).rglob('trace.zip'))
    events = []
    with zipfile.ZipFile(trace) as archive:
        for name in archive.namelist():
            if name.endswith('.trace'):
                for line in archive.read(name).decode().splitlines():
                    if 'screenshot' in line.lower() or 'captureScreenshot' in line:
                        events.append(json.loads(line))
    output.append({'path': str(trace), 'events': events})
(root / 'screenshot-investigation.json').write_text(json.dumps(output, indent=2), encoding='utf-8')
print(json.dumps(output, indent=2))
