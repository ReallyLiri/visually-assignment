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
        if "404" in str(e):
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


def _flatten(xss):
    return [x for xs in xss for x in xs]


def import_documents(documents):
    transformed_docs = []
    for doc in documents:
        transformed_doc = {
            "id": doc["_id"]["$oid"],
            "doc": json.dumps(doc, ensure_ascii=False),
            "alias": doc.get("alias", ""),
            "collections": doc.get("collections", []),
            "tags": doc.get("tags", []),
            "handle": doc.get("handle", ""),
            "title": doc.get("title", ""),
            "description": doc.get("description", ""),
            "rank": doc.get("rank", 0),
            "variants_titles": [
                var.get("title", "")
                for var in doc.get("variants", [])
                if "title" in var
            ],
            "variants_colors": [
                var.get("Color", "")
                for var in doc.get("variants", [])
                if "Color" in var
            ],
            "options_values": _flatten(
                [var.get("values") for var in doc.get("options", [])]
            ),
            "price": doc.get("price", 0),
        }
        transformed_docs.append(transformed_doc)

    res = _typesense_client.collections[_typesense_collection_name].documents.import_(
        transformed_docs, {"action": "create"}
    )
    for doc_res in res:
        if "error" in doc_res:
            logger.error(f"Error importing document: {doc_res}")


def search_documents(
    query: str,
    page: int,
    page_size: int,
    collections=None,
    tags=None,
    price_min=None,
    price_max=None,
    facet_by=None,
):
    collection_name = os.getenv("TYPESENSE_COLLECTION_NAME")
    filters = []
    if collections:
        filters.append(
            "collections:=[{}]".format(",".join(f'"{c}"' for c in collections))
        )
    if tags:
        filters.append("tags:=[{}]".format(",".join(f'"{t}"' for t in tags)))
    if price_min is not None:
        filters.append(f"price:>={price_min}")
    if price_max is not None:
        filters.append(f"price:<={price_max}")
    filter_by = " && ".join(filters) if filters else None
    search_parameters = {
        "q": query or "*",
        "query_by": "*",
        "page": page,
        "per_page": page_size,
        "sort_by": "rank:asc",
    }
    if filter_by:
        search_parameters["filter_by"] = filter_by
    if facet_by:
        search_parameters["facet_by"] = ",".join(facet_by)
    results = _typesense_client.collections[collection_name].documents.search(
        search_parameters
    )
    return results
