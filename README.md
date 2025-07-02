# The Visually.io Catalog

![preview](https://i.imgur.com/uotJQC3.png)

## Search Engine - Typesense

We use [Typesense](https://typesense.org/) as our search engine. It is a fast, open-source search engine that is easy to set up and use.

### Set up

```shell
docker compose up -d
```

It will then start the server on port 8017. You can use a tool like [https://bfritscher.github.io/](https://bfritscher.github.io/) to observe the collections.

## Server

### Set up

```shell
brew install uv
cd server
uv sync
```

### Index

```bash
cd server 
uv run --env-file=../.env src/index.py ../docs/catalog.schema.json ../docs/catalog.jsonl [--overwrite]
```

### Run

```bash
uv run --env-file=../.env src/server.py
```

## Web App

### Set up

```bash
cd app
yarn
```

### Run

```bash
yarn dev
```

### Publish

TBD

## Next Steps

- [ ] Make facets filters actually work (currently its flaky)
- [ ] Make faceted properties dynamic (currently its hardcoded)
- [ ] Add PDP when clicking a product etc
- [ ] Cache server responses, on server and client levels
- [ ] Add OpenAPI spec
- [ ] Auto-generate typescript from json schema
