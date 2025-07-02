import json
import os

import typesense

from log import logger


def create_collection(schema):
    try:
        _typesense_client.collections.create(schema)
    except Exception as e:
        if "already exists" in str(e):
            raise RuntimeError(f"Collection {schema['name']} already exists.")
        else:
            raise


def drop_collection(collection_name):
    try:
        _typesense_client.collections[collection_name].delete()
    except Exception as e:
        if "not found" in str(e):
            pass
        else:
            raise


_typesense_collection_name = os.getenv("TYPESENSE_COLLECTION_NAME")
if not _typesense_collection_name:
    raise RuntimeError("TYPESENSE_COLLECTION_NAME environment variable is not set.")
_typesense_client = typesense.Client(
    {
        "nodes": [
            {
                "host": "localhost",
                "port": os.getenv("TYPESENSE_PORT", 8018),
                "protocol": "http",
            }
        ],
        "api_key": os.getenv("TYPESENSE_API_KEY", "xyz"),
        "connection_timeout_seconds": 2,
    }
)


def import_documents(documents):
    for doc in documents:
        if "_id" in doc:
            doc["id"] = doc["_id"]["$oid"]
            del doc["_id"]
        if not isinstance(doc["id"], str):
            doc["id"] = str(doc["id"])
        for key, value in doc.items():
            if isinstance(value, dict):
                doc[key] = json.dumps(value)
    res = _typesense_client.collections[_typesense_collection_name].documents.import_(
        documents, {'action': 'create'}
    )
    for doc_res in res:
        if "error" in doc_res:
            logger.error(f"Error importing document: {doc_res}")


def search_documents(query: str, page: int, page_size: int):
    collection_name = os.getenv("TYPESENSE_COLLECTION_NAME")
    search_parameters = {
        "q": query or "*",
        "query_by": "*",
        "page": page,
        "per_page": page_size,
        "sort_by": "rank:asc",
    }
    results = _typesense_client.collections[collection_name].documents.search(
        search_parameters
    )
    return results
