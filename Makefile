.PHONY: build compile test clean install node_modules
default: build

SHELL:=/bin/bash
UNAME_S := $(shell uname -s)

node_modules: package.json yarn.lock
install: node_modules
	yarn install
run: install
	NODE_ENV=development npx ts-node ./src/server.ts
compile: install clean
	npx tsc  -p tsconfig.build.json
build: compile
test: install
	NODE_ENV=testing npx jest --runInBand
clean:
	rm -rf ./dist
