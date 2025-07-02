import json
import os
import sys

import ijson

from log import logger
from search_client import import_documents, create_collection, drop_collection


def _load_jsonl(path: str):
    objects = []
    with open(path, 'rb') as f:
        for obj in ijson.items(f, '', multiple_values=True, use_float=True):
            objects.append(obj)
    return objects


def _ensure_collection(collection_name: str, overwrite: bool, schema: str):
    if overwrite:
        logger.info(f"Dropping collection {collection_name} (overwrite mode)")
        drop_collection(collection_name)
    try:
        logger.info(f"Creating collection with schema")
        create_collection(schema)
    except RuntimeError as e:
        print(str(e))
        sys.exit(1)


def main():
    if len(sys.argv) < 3:
        print("Usage: path-to-script.py <schema_path> <jsonl_path> [--overwrite]")
        sys.exit(1)
    schema_path = sys.argv[1]
    jsonl_path = sys.argv[2]
    overwrite = "--overwrite" in sys.argv

    if not os.path.exists(schema_path):
        print(f"Schema file not found: {schema_path}")
        sys.exit(1)
    with open(schema_path, "r") as f:
        schema = json.load(f)
    collection_name = schema["name"]
    _ensure_collection(collection_name, overwrite, schema)

    if not os.path.exists(jsonl_path):
        print(f"File not found: {jsonl_path}")
        sys.exit(1)

    logger.info(f"Importing documents from {jsonl_path}")
    documents = _load_jsonl(jsonl_path)
    logger.info(f"Found {len(documents)} documents to import")
    import_documents(documents)


if __name__ == "__main__":
    main()
