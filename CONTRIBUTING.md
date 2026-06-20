# Contributing to Software MRI

First off, thank you for considering contributing to Software MRI! 

This project aims to completely change how developers understand codebases. We welcome all contributions, from bug fixes and documentation to brand new features and languages.

## 🚀 Getting Started

To get a local development environment running:

1. **Fork** this repository and clone it to your machine.
2. Ensure you have **Node.js (v20+)** installed.
3. Install the dependencies:
   ```bash
   npm ci
   ```
4. Run the development server (starts Vite + Electron):
   ```bash
   npm run dev
   ```

## 🏗️ Architecture Overview

Before contributing, it's highly recommended you understand the basic architecture. Software MRI is an Electron application divided into two main parts:

### 1. Main Process (`main/`)
This runs in Node.js and handles the heavy lifting:
- **`main/parsers/`**: Uses `tree-sitter` to parse code into ASTs.
- **`main/analyzers/`**: Reads the ASTs to find dependencies, calculate metrics, and detect "diseases" (like circular dependencies).
- **`main/llm/`**: Integrates with `node-llama-cpp` for local, fully private AI models (GGUF format).
- **`main/ipc/`**: Handles communication with the UI.

### 2. Renderer Process (`src/`)
This is the UI, built with Vite, HTML, and Vanilla JS (No React/Vue framework overhead!):
- **`src/workers/physics.worker.js`**: Runs the 3D force simulation off the main thread so the UI never freezes.
- **`src/visualization/`**: Contains the Three.js and `3d-force-graph` integration.

## 💡 How You Can Help

- **Add Language Support**: Want to support a new language? Check out `main/parsers/treesitter.js`.
- **New Disease Detectors**: Can you write an algorithm to detect a specific code smell? Add it to `main/analyzers/disease.js`!
- **UI/UX Tweaks**: If you're a frontend wizard, help us make the `src/styles/` or Three.js shaders look even more spectacular.

## 📝 Submitting a Pull Request

1. Create a new branch: `git checkout -b feature/my-awesome-feature`
2. Make your changes and write descriptive commit messages.
3. Ensure the app still builds: `npm run build`
4. Open a Pull Request on GitHub and describe what you've added!

## 🐛 Reporting Bugs

If you find a bug, please use the GitHub Issues tab and provide:
- Your OS (Windows/Mac/Linux)
- Steps to reproduce the bug
- Any error logs from the Electron console (Ctrl+Shift+I to open Developer Tools)

Happy coding! Let's build the ultimate codebase visualizer together.
