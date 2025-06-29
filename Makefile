# Makefile for launch compatibility
.PHONY: setup teardown

setup:
	@echo "Setting up project..."
	@npm install || bun install || yarn install
	@echo "Setup complete!"

teardown:
	@echo "Tearing down project..."
	@rm -rf node_modules
	@echo "Teardown complete!"
