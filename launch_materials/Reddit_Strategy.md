# Reddit Launch Strategy

Reddit is notoriously harsh on self-promotion. If you just drop a link and say "Look at my app", you will get banned.

You **must** provide value first, explain the technical challenges, and link your tool at the bottom as an open-source resource.

### Target Subreddits
1. **r/programming** (Hardcore engineers. Very strict rules. Post on a Saturday morning.)
2. **r/webdev** (Friendly to UI/UX and WebWorker/Three.js content.)
3. **r/javascript** (Focus on the Node.js / AST parsing / Vite aspects.)
4. **r/opensource** (Friendly to all open source projects.)

---

### Template for r/programming or r/webdev

**Title:** I got tired of getting lost in 10,000-file codebases, so I built an open-source 3D WebGL visualization engine to map out architectures visually.

**Body:**
Hey everyone,

Whenever I join a new project, reading the codebase top-to-bottom feels impossible. I wanted a way to just "fly through" the architecture to see how everything connects. 

Over the last few weeks, I built an open-source Electron app that parses local directories using ASTs (`tree-sitter`) and renders a massive 3D force-directed graph. 

The biggest challenge I faced was the UI freezing when analyzing massive monolithic repos. I ended up having to push the `d3-force-3d` physics simulation entirely into a background WebWorker. I also had to write an aggressive Level-of-Detail (LOD) system in Three.js so that zoomed-out files render as single instanced points (handling 10K+ nodes at 60fps), and only resolve into actual code when the camera flies close to them.

It also runs Tarjan’s strongly connected components algorithm on the parsed imports to detect circular dependencies, and highlights those files with a red "disease" glow.

Everything runs 100% locally. No cloud analysis, no telemetry. 

If you're interested in the WebWorker physics approach or want to try dropping your biggest repo into it to see what it looks like, the source code and the pre-built `.exe` are up on GitHub:

🔗 https://github.com/Ishaan-Sharma-tech/software-mri

I'd love to hear your feedback on the architecture or how I can optimize the AST parsing further!
