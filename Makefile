DOCKER_IMAGE ?= lev-report
test_image = quay.io/ukhomeofficedigital/lev-report-test:latest

mkfile_path := $(abspath $(lastword $(MAKEFILE_LIST)))
current_dir := $(notdir $(patsubst %/,%,$(dir $(mkfile_path))))

compose_project_name = $(current_dir)
compose_network_regexp != echo "$$(echo '$(compose_project_name)' | sed -E 's/([-_])+/[-_]*/g')_default"
probe_network = docker network ls | grep -o '$(compose_network_regexp)'

.PHONY: all clean deps docker docker-clean docker-test node-deps test unit-test

all: deps test docker

clean: docker-compose-clean
	rm -rf node_modules/

distclean: clean
	docker rmi -f '$(DOCKER_IMAGE)' || true

deps: node-deps

node-deps: node_modules/

node_modules/: package.json
	npm install

docker-compose-deps:
	docker-compose pull

docker-test-deps:
	docker pull '$(test_image)'
	docker-compose -f docker-compose-test.yml -p '$(compose_project_name)' pull

docker-compose: docker-compose-deps docker docker-compose.yml
	docker-compose build

docker-test: docker-test-deps docker
	docker rm -vf 'lev-report-mock' || true
	docker run -d --name 'lev-report-mock' '$(DOCKER_IMAGE)'
	docker run --net 'container:lev-report-mock' --env 'TEST_URL=http://localhost:8080' --env 'WAIT=true' '$(test_image)'
	docker stop 'lev-report-mock'
	docker-compose -f docker-compose-test.yml -p '$(compose_project_name)' down -v
	docker-compose -f docker-compose-test.yml -p '$(compose_project_name)' build
	docker-compose -f docker-compose-test.yml -p '$(compose_project_name)' up &> /dev/null &
	compose_network=`$(probe_network)`; \
	while [ $$? -ne 0 ]; do \
		echo ...; \
		sleep 5; \
		compose_network=`$(probe_network)`; \
	done; \
	docker run --net "$${compose_network}" --env 'TEST_URL=http://report:8080' --env 'WAIT=true' '$(test_image)' && \
	docker-compose -f docker-compose-test.yml -p '$(compose_project_name)' down -v

docker:
	docker build -t '$(DOCKER_IMAGE)' .

docker-clean:
	docker rmi -f '$(DOCKER_IMAGE)'

docker-compose-clean:
	docker-compose stop
	docker-compose rm -vf

run: docker-compose-clean docker-compose
	docker-compose up

unit-test: node-deps
	npm test

test: unit-test
