# Graph portability audit

The graph was rebuilt using the installed TypeScript Graphify 0.17.1 runtime.
Runtime proof is recorded in `.graphify_runtime.json`; source paths and manifest
keys are repository-relative. Generated machine-specific instructions, caches,
and local runtime details are excluded from publication.

Graphify's `portable-check` currently reports citation text as apparent absolute
paths. These findings include application routes such as `/login`, intentional
container paths such as `/source.env`, and JavaScript comment delimiters.
The verbatim citations are retained rather than altered to hide these findings.
The generic checker therefore does not report a clean pass. A separate staged
file audit checks for workspace/user machine paths and private environment values
before publication.

Structural extraction and reviewed document/image relationships are included.
Optional generated prose descriptions have not been added to code symbols.
