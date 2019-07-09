.PHONY: build compile test clean
default: build
.ONESHELL:

SHELL:=/bin/bash
UNAME_S := $(shell uname -s)
VER ?= patch

node_modules: yarn.lock
	@if [ $${NODE_ENV} == "production" ]; \
	then \
		yarn install --production;\
	else \
		yarn install; \
	fi
compile: node_modules clean
	npx tsc  -p tsconfig.build.json
build: export NODE_ENV = production
build: compile
test: export NODE_ENV = testing
test: node_modules
	NODE_ENV=testing npx jest --runInBand
publish: build
	standard-version -r ${VER} &&  npm publish
clean:
	rm -rf ./dist
