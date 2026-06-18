<div align="center">
  <img src="build/icon.png" width="128" height="128" alt="Software MRI Logo" />
  <h1>Software MRI</h1>
  <p><strong>See Your Code. Understand Your Architecture.</strong></p>

  <p>
    <a href="https://github.com/Ishaan-Sharma-tech/software-mri/releases/latest/download/Software.MRI.Setup.exe">Download for Windows (.exe)</a>
    ·
    <a href="https://github.com/Ishaan-Sharma-tech/software-mri">View Repository</a>
    ·
    <a href="#getting-started">Documentation</a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/Platform-Windows%20%7C%20Mac%20%7C%20Linux-blue?style=flat-square" />
    <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" />
    <img src="https://img.shields.io/badge/Built%20with-Electron%20%26%20WebGL-cyan?style=flat-square" />
  </p>
</div>

---

**Software MRI** is an ultra-fast, local-first code analysis tool that visualizes your entire codebase as a living, interactive 3D galaxy. Powered by Electron and WebGL, it runs completely on your machine ensuring your proprietary code never leaves your local environment.

## ✨ Features

- **Galactic Folder Clustering:** Explore your architecture naturally. Folders act as massive gravitational hubs, pulling associated files into distinct, colorful solar systems.
- **Native Git Integration:** Instantly clone and analyze any public Git repository securely without needing mock APIs.
- **Bloodflow Analysis:** Switch to the Bloodflow layer to visualize execution paths and dependencies pulsing through your code.
- **Disease & Tech Debt Highlighting:** The Disease layer instantly illuminates bloated, overly-complex, or highly-churned files in bright red.
- **Integrated AI Brain:** Chat seamlessly with your codebase. Ask questions about your architecture, and it will highlight the relevant nodes directly in the 3D graph.

## 🚀 Download

You can download the latest pre-compiled beta installer directly:
**[Download Software MRI v1.0.0 (.exe)](https://github.com/Ishaan-Sharma-tech/software-mri/releases/latest/download/Software.MRI.Setup.exe)**

## 💻 Getting Started (For Developers)

If you'd like to build the project from source or contribute:

### Prerequisites
- [Node.js](https://nodejs.org/en/) (v18+)
- [Git](https://git-scm.com/)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Ishaan-Sharma-tech/software-mri.git
   cd software-mri
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```
   *This will start Vite and the Electron app simultaneously.*

### Packaging for Release

To compile the application into a standalone Windows installer (`.exe`):
```bash
# Note: You must run your terminal as Administrator on Windows 
# so electron-builder can create symlinks during code-signing
npm run build
```
The compiled installer will be available in the `release/` directory.

## 🤝 Contributing
Software MRI is built by developers, for developers, and we would absolutely love your help! 

Whether you want to add new visual layers, improve the 3D WebGL physics, add support for new programming languages, or simply fix a bug—your contributions are deeply appreciated.

**How to get started:**
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

If you have a massive feature idea, feel free to open an **Issue** first so we can discuss the architecture!

## 🛡️ Privacy & Security
Software MRI is built strictly **Local-First**. We believe code is proprietary and private. The AST parsing, git cloning, and graph physics all happen locally on your CPU/GPU. No code is ever uploaded to a cloud server without your explicit LLM API key usage.

## 📜 License
Distributed under the MIT License. See `LICENSE` for more information.
