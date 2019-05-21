DOCKER_IMAGE ?= lev-report

.PHONY: all clean deps docker docker-clean node-deps test unit-test

all: deps test docker

clean:
	rm -rf node_modules/

distclean: clean
	docker rmi -f '$(DOCKER_IMAGE)' || true

deps: node-deps

node-deps: node_modules/

node_modules/: package.json
	npm install

docker:
	docker build -t '$(DOCKER_IMAGE)' .

docker-clean:
	docker rmi -f '$(DOCKER_IMAGE)'

unit-test: node-deps
	npm test

test: unit-test
