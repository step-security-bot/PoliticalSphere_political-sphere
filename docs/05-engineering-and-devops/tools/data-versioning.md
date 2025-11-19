# Data Versioning with DVC

> NOTE: For project-level context and strategy, see `docs/00-foundation/project-context.md`.

Political Sphere now ships DVC (Data Version Control) hooks so that large fixtures and seeds can live outside Git history while remaining reproducible.

## Toolchain

- `requirements-dev.txt` is installed inside the devcontainer so `dvc` is always available.
- `.dvcignore` shields common build artifacts from DVC hashing.
- `dvc.yaml` contains the `track-datasets` stage, mapping `data/seeds` and `data/fixtures` to reproducible DVC metadata.
- Helper script `scripts/data/dvc-track.sh` validates input directories before DVC captures them.

## Usage

```bash
dvc repro track-datasets   # snapshot local datasets
dvc add data/seeds         # optionally add new directories
dvc remote add --default local cache/.dvc-cache
dvc push                   # publish to configured remote
```

Developers who do not wish to use DVC can ignore the tooling—Git continues to track the directories until you remove them manually. When you are ready to lean on DVC fully, run `dvc add data/seeds data/fixtures` and delete the raw directories from Git after confirming the `.dvc` metadata acts as the new source of truth.
