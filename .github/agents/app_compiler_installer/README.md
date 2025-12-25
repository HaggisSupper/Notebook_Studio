# App Compiler & Installer Orchestrator Agent

This directory contains multi-platform agent configuration files for the "App Compiler & Installer Orchestrator" agent, which acts as a senior build/release engineer specialized in designing minimal, robust, and repeatable toolchains for compiling, packaging, and installing applications.

## Overview

The agent is designed to:
- Select appropriate compilers and build tools
- Choose packaging and installer technologies
- Design installation & update strategies
- Respect isolation best practices
- Provide concrete, production-ready build + installer strategies

## Platform Configurations

### Generic
- **`generic/app_compiler_installer_agent_master_prompt.txt`**: Complete master prompt specification

### Gemini (Google AI)
- **`gemini/app_compiler_installer_agent_gemini_system.txt`**: System prompt for Gemini
- **`gemini/app_compiler_installer_agent_gemini_context.txt`**: Context information

### Cursor IDE
- **`cursor/app_compiler_installer_agent_cursor.rules`**: JSON rules configuration

### Cline
- **`cline/app_compiler_installer_agent_cline.rules`**: JSON rules configuration

### Antigravity
- **`antigravity/app_compiler_installer_agent_antigravity_constitution.txt`**: Constitutional guidelines
- **`antigravity/app_compiler_installer_agent_antigravity_operator.txt`**: Operational instructions

### OpenCoder
- **`opencoder/app_compiler_installer_agent_opencoder_persona.yaml`**: YAML persona definition

### Copilot (GitHub)
- **`copilot/app_compiler_installer_agent_copilot_ide_instructions.txt`**: IDE integration instructions

### Claude (Anthropic)
- **`claude/app_compiler_installer_agent_claude_system.txt`**: System prompt

### Roo
- **`roo/app_compiler_installer_agent_roo.yaml`**: YAML configuration

## Environment & Baseline

- **Baseline OS**: Windows 11 Pro
- **Common Targets**: Win11 desktop, Electron/Tauri, PWA-capable web apps
- **Shell**: PowerShell (primary), bash/WSL (optional)
- **Package Managers**: Prefer isolated methods (pipx/uv, virtualenv, nvm/pnpm)

## Evaluation Rubric

The agent evaluates all plans using this scoring framework:

| Dimension | Weight | Focus |
|-----------|--------|-------|
| Pre-flight Planning | 0.40 | Stack understanding, tool selection, prerequisites |
| Toolchain Correctness & Robustness | 0.25 | Complete build steps, handles failures, stable tools |
| Isolation, Reproducibility & Safety | 0.20 | Avoid globals, lockfiles, security considerations |
| Simplicity & Maintainability | 0.15 | Minimal toolchain, easy to follow, CI-friendly |

**Acceptance Threshold**: RUBRIC_SCORE ≥ 0.9998

## Output Format

When consulted, the agent provides:
1. High-level summary of chosen approach
2. Toolchain selection (compilers/build tools, packaging/installer tools)
3. Step-by-step setup instructions with isolated installs
4. Build commands and scripts (PowerShell/bash)
5. Packaging/installer configuration and commands
6. Notes on signing, elevation, and distribution
7. CI/CD integration notes
8. Numeric RUBRIC_SCORE
9. Reflection (assumptions, tradeoffs, risks)

## Usage

These configuration files enable the App Compiler & Installer Orchestrator agent across multiple AI assistant platforms. Select the appropriate configuration file(s) for your platform and follow the platform-specific integration instructions.