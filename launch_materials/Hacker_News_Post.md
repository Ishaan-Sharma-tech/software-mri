# Hacker News "Show HN" Post

**Title:** Show HN: Software MRI – I built a local 3D engine to visualize 10K+ file codebases

**Text:**
Hey HN,

I'm Ishaan. Over the last few weeks, I’ve been building an open-source desktop app called Software MRI (https://github.com/Ishaan-Sharma-tech/software-mri). 

I got tired of dropping into massive monolithic codebases and spending weeks just trying to map out the folder structures and dependency graphs in my head.

Software MRI takes any local folder and runs a multi-layered static analysis pipeline over it. It parses the ASTs of 300+ languages using `tree-sitter` (via a web assembly bundle), extracts all the imports, exports, and functions, and then renders the entire architecture in 3D using Three.js. 

To keep the UI from freezing when analyzing massive projects (like VS Code or Linux), I pushed the `d3-force-3d` simulation into a background WebWorker, and implemented an aggressive custom Level-of-Detail (LOD) system in Three.js. When you're zoomed out, files render as instanced points. As you fly in, they resolve into spheres, then text labels, and finally the actual code itself.

It also runs some basic graph traversal algorithms to highlight "diseased" code (e.g., Tarjan's for circular dependencies, cyclomatic complexity spikes) and glows them red so you can spot architectural flaws visually. 

It’s an Electron app, entirely local (no telemetry, no cloud analysis), and there's a pre-built Windows `.exe` on the Releases page if you just want to drag and drop your biggest repo into it to see what happens.

Would love to hear what HN thinks about the architecture or how I can optimize the WebGL shaders further!

Repo: https://github.com/Ishaan-Sharma-tech/software-mri
Website: [Insert your website URL here]
