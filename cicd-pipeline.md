# CI/CD Pipeline Policy

The CI/CD policy for this repo is maintained in the backend repo, since it covers both:

**[chess-openings-master-services / cicd-pipeline.md](https://github.com/jschae22/chess-openings-master-services/blob/main/cicd-pipeline.md)**

Frontend specifics:
- Required check: `Lint, Test, Build` (`npm run lint`, `npm run test`, `npm run build`)
- Branch names: `<type>-<scope-words>`, e.g. `feat-board-colour-picker`
- Cross-repo features use the same branch name in both repos
