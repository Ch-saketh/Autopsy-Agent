# Sherlock-Agent-
An Ai-Agent which helps in finding patterns when uploaded digital evidences , clues ect... 
                    ┌─────────────────────────┐
                    │     1. FILE UPLOAD       │
                    │  (UFDR ZIP / JSON File)  │
                    └─────────────┬───────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │ 2. VALIDATION LAYER      │
                    │ - file type/size check   │
                    │ - store original upload  │
                    │   in /data/uploads/      │
                    └─────────────┬───────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │    3. PARSING LAYER      │
                    │ - UFDR XML/JSON parsing  │
                    │ - extract contacts       │
                    │ - extract messages       │
                    │ - extract media paths    │
                    │ - normalize into schema  │
                    │   (parsed.json)          │
                    └─────────────┬───────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │ 4. DATABASE INGESTION    │
                    │  (MongoDB)               │
                    │ - contacts collection    │
                    │ - messages collection    │
                    │ - media collection       │
                    │ - events collection      │
                    │ All linked by case_id    │
                    └─────────────┬───────────┘
                                  │
                                  ▼
           ┌──────────────────────────────────────────┐
           │           5. PREPROCESSING LAYER         │
           │ - generate thumbnails for images/videos  │
           │ - extract OCR text from screenshots      │
           │ - create embeddings (text + images)      │
           │ - prepare keyword sets & clusters        │
           └─────────────┬────────────────────────────┘
                          │
                          ▼
           ┌──────────────────────────────────────────┐
           │        6. MODEL ANALYSIS LAYER           │
           │ - NLP threat detection on messages       │
           │ - NSFW/violence detector for media       │
           │ - POI ranking model                      │
           │ - link analysis (graph building)         │
           │ - anomaly detection                      │
           └─────────────┬────────────────────────────┘
                          │
                          ▼
           ┌──────────────────────────────────────────┐
           │      7. RESULTS GENERATION LAYER         │
           │ - suspicious messages                    │
           │ - flagged media (thumbnails)             │
           │ - POI list with scores                   │
           │ - timeline (merged events)               │
           │ - summary.json + report data             │
           └─────────────┬────────────────────────────┘
                          │
                          ▼
           ┌──────────────────────────────────────────┐
           │         8. API RESPONSE LAYER            │
           │ REST API Routes:                         │
           │  - /api/upload                           │
           │  - /api/cases/{id}/summary               │
           │  - /api/cases/{id}/messages              │
           │  - /api/cases/{id}/media                 │
           │  - /api/cases/{id}/timeline              │
           │  - /api/cases/{id}/pois                  │
           │  (all results pulled from MongoDB + FS)  │
           └─────────────┬────────────────────────────┘
                          │
                          ▼
           ┌──────────────────────────────────────────┐
           │       9. FRONTEND PRESENTATION           │
           │ - dashboard (summary)                    │
           │ - timeline view                           │
           │ - chat explorer                          │
           │ - media gallery (flagged)                │
           │ - POI insights                           │
           │ - export PDF/JSON                        │
           └──────────────────────────────────────────┘
