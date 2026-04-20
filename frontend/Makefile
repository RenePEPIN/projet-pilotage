PNPM=npx --yes pnpm
POWERSHELL=powershell -NoProfile -ExecutionPolicy Bypass -Command

.PHONY: help install dev dev3000 build start lint clean

help:
	@echo "Targets disponibles:"
	@echo "  make install   - Installe les dependances"
	@echo "  make dev       - Lance le serveur de dev (port par defaut)"
	@echo "  make dev3000   - Lance le serveur de dev sur le port 3000"
	@echo "  make build     - Build production"
	@echo "  make start     - Lance le serveur Next en production"
	@echo "  make lint      - Lance le lint"
	@echo "  make clean     - Nettoie le cache .next"

install:
	$(PNPM) install

dev:
	$(PNPM) dev

dev3000:
	$(POWERSHELL) "$${p = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty OwningProcess; if ($$p) { Stop-Process -Id $$p -Force; Write-Host ('Killed PID ' + $$p + ' on port 3000') } else { Write-Host 'Port 3000 already free' }"
	$(PNPM) dev --port 3000

build:
	$(PNPM) build

start:
	$(PNPM) start

lint:
	$(PNPM) lint

clean:
	$(POWERSHELL) "if (Test-Path '.next') { Remove-Item '.next' -Recurse -Force; Write-Host 'Removed .next' } else { Write-Host '.next not found' }"
