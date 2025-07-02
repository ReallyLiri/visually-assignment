import json
import os
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from search_client import search_documents
import uvicorn
from log import logger
from typing import List, Optional

_DEFAULT_PAGE_SIZE = 12


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def read_root():
    logger.debug("Health check endpoint called")
    return {"health": "Can't complain!"}


@app.get("/search")
def search(
    q: str = Query(None),
    page: int = Query(1),
    page_size: int = Query(_DEFAULT_PAGE_SIZE, alias="pageSize"),
    collections: Optional[List[str]] = Query(None),
    tags: Optional[List[str]] = Query(None),
    price_min: Optional[float] = Query(None),
    price_max: Optional[float] = Query(None),
):
    logger.info(
        f"Search endpoint called with q={q}, page={page}, page_size={page_size}, collections={collections}, tags={tags}, price_min={price_min}, price_max={price_max}"
    )
    results = search_documents(
        query=q,
        page=page,
        page_size=page_size,
        collections=collections,
        tags=tags,
        price_min=price_min,
        price_max=price_max,
        facet_by=["collections", "tags", "price"],
    )
    has_more = page * page_size < results["found"]
    documents = [json.loads(entry["document"]["doc"]) for entry in results["hits"]]
    facets = results.get("facet_counts", [])
    return {
        "documents": documents,
        "has_more": has_more,
        "total": results["found"],
        "facets": facets,
    }


if __name__ == "__main__":
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=int(os.getenv("SERVER_PORT", 8017)),
        reload=True,
    )
