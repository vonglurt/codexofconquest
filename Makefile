# SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
#
# The root is about starting and running. Every target delegates to ./run.sh.
.DEFAULT_GOAL := help
.PHONY: help run play landing edit wbapi server monitor stop status test check gates clean

help:  ## show this help
	@echo "Codex of Conquest — make targets"
	@echo
	@grep -hE '^[a-z-]+:.*?## ' $(MAKEFILE_LIST) | awk -F':.*?## ' '{printf "  \033[1m%-14s\033[0m %s\n", $$1, $$2}'

run: server monitor landing  ## start API + monitor in terminals, open the landing page

play: server monitor  ## start API + monitor, open the game directly
	@./run.sh play

edit: server monitor  ## start API + monitor, open the world editor
	@./run.sh edit

wbapi:    ## start the WBAPI node server in a terminal, announcing where node runs
	@./run.sh server
server: wbapi  ## alias for wbapi
monitor:  ## start the snapshot monitor in its own terminal window
	@./run.sh monitor
landing:  ## open the project landing page
	@./run.sh landing
stop:     ## stop the API server and the monitor
	@./run.sh stop
status:   ## show what is running
	@./run.sh status

test:   ## run the Playwright integration suite
	@npm test
check:  ## run the full gate chain (anchors, invariants, parity, graphs)
	@npm run check:walk
gates: check  ## alias for check

clean:  ## remove generated build output (never touches src/ or docs/)
	@rm -rf build/test-results build/playwright-report && echo "build output cleared"
