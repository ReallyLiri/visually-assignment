import os
from fastapi import FastAPI, Query
from search_client import search_documents
import uvicorn
from log import logger

_DEFAULT_PAGE_SIZE = 12


app = FastAPI()


@app.get("/health")
def read_root():
    logger.debug("Health check endpoint called")
    return {"health": "Can't complain!"}


@app.get("/search")
def search(
    q: str = Query(None),
    page: int = Query(1),
    page_size: int = Query(_DEFAULT_PAGE_SIZE, alias="pageSize"),
):
    logger.info(
        f"Search endpoint called with q={q}, page={page}, page_size={page_size}"
    )
    results = search_documents(query=q, page=page, page_size=page_size)
    return results


if __name__ == "__main__":
    uvicorn.run(
        "server:app", host="0.0.0.0", port=int(os.getenv("SERVER_PORT", 8017)), reload=True
    )
