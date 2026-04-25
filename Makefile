PROJECT_ID ?= subscreen
REGION     ?= asia-northeast1
SERVICE    ?= mahjong
PORT       ?= 8080
GCLOUD     ?= /Users/abetetsuya/google-cloud-sdk/bin/gcloud

.PHONY: local docker_local deploy logs test

# ユニットテスト (Node 標準テストランナー)
test:
	node --test test/*.test.js

# 静的ファイルをローカルで配信 (http://localhost:$(PORT))
local:
	@echo "Serving at http://localhost:$(PORT)"
	python3 -m http.server $(PORT)

# 本番と同じ nginx コンテナで配信
docker_local:
	docker build -t $(SERVICE):local .
	docker run --rm -p $(PORT):8080 $(SERVICE):local

# Cloud Run にデプロイ
deploy:
	$(GCLOUD) run deploy $(SERVICE) \
		--source=. \
		--region=$(REGION) \
		--project=$(PROJECT_ID) \
		--allow-unauthenticated \
		--port=8080 \
		--cpu=1 \
		--memory=256Mi \
		--min-instances=0 \
		--max-instances=3

logs:
	$(GCLOUD) run services logs read $(SERVICE) --region=$(REGION) --project=$(PROJECT_ID) --limit=50
