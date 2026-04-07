# Keep / Freeze / Kill Audit Template

Use this template to classify every product feature against the MVP workflow:

`Login -> RFP Ingestion -> Bid/No-Bid with reasons -> Compliance Matrix -> Draft Starter -> Save -> Export`

## Decision Rubric

- `Keep`: Required to make one workflow step reliable now.
- `Freeze`: Useful later, but not required for reliable MVP path.
- `Kill`: Adds surface area without improving the MVP path.

## Feature Audit Row Template

```md
### Feature: <name>
- Outcome: <what user gets>
- Workflow step: <login|ingest|decision|matrix|draft|save|export|none>
- Dependencies:
  - Frontend: <path1>, <path2>
  - Backend: <path3>, <path4>
- Current stability: <works end-to-end|partial|broken>
- Decision: <Keep|Freeze|Kill>
- Rationale: <one sentence tied to workflow>
- Action owner: <name>
- Target date: <yyyy-mm-dd>
```

## Brutal Cut Rule

If a feature cannot answer this with "yes", it is not in active MVP:

`Does this directly help a logged-in user go from RFP input to decision, compliance checklist, and draft output?`
