# Walkthroughgen

Walkthroughgen is a tool for creating walkthroughs, tutorials, readmes, and documentation. It helps you maintain step-by-step guides by generating markdown and working directories from a simple YAML configuration.

## Features

- 📝 **Markdown Generation**: Create beautiful markdown files with diffs, code blocks, and collapsible sections
- 📁 **Working Directories**: Generate separate directories for each section of your walkthrough
- 🔄 **Incremental Changes**: Track and display changes between steps
- 🎯 **Multiple Targets**: Output to markdown, section folders, and final project state
- 📦 **File Management**: Copy files, create directories, and run commands
- 🔍 **Rich Diffs**: Show meaningful diffs between file versions
- 📚 **Section READMEs**: Generate per-section documentation

## Installation

```bash
npm install -g walkthroughgen
```

## Quick Start

1. Create a `walkthrough.yaml` file:

```yaml
title: "My Tutorial"
text: "A step-by-step guide"
targets:
  - markdown: "./walkthrough.md"
    onChange:
      diff: true
      cp: true
  - folders:
      path: "./by-section"
      final:
        dirName: "final"
sections:
  - name: setup
    title: "Initial Setup"
    steps:
      - file: {src: ./files/package.json, dest: package.json}
      - command: "npm install"
```

2. Run the generator:

```bash
walkthroughgen generate walkthrough.yaml
```

## Directory Structure

A typical walkthrough project looks like this:

```
my-tutorial/
├── walkthrough/          # Source files for each step
│   ├── 00-package.json
│   ├── 01-index.ts
│   └── 02-config.ts
├── walkthrough.yaml     # Walkthrough configuration
└── build/              # Generated output
    ├── by-section/    # Section-by-section working directories
    │   ├── 00-setup/
    │   └── 01-config/
    ├── final/         # Final project state
    └── walkthrough.md # Generated markdown
```

## Walkthrough.yaml Configuration

### Top-Level Fields

- `title`: Title of the walkthrough
- `text`: Introduction text
- `targets`: Output configuration
- `sections`: Tutorial sections

### Targets

#### Markdown Target

```yaml
targets:
  - markdown: "./output.md"
    onChange:
      diff: true  # Show diffs for changed files
      cp: true    # Show cp commands
    newFiles:
      cat: false  # Don't show file contents
      cp: true    # Show cp commands
```

#### Folders Target

```yaml
targets:
  - folders:
      path: "./by-section"        # Base path for section folders
      skip: ["cleanup"]          # Sections to skip
      final:
        dirName: "final"        # Name for final state directory
```

### Sections

Each section represents a logical step in your tutorial:

```yaml
sections:
  - name: setup              # Used for folder naming and skip array
    title: "Initial Setup"   # Display title
    text: "Setup steps..."   # Section description
    steps:
      # ... steps ...
```

### Steps

Steps define the actions to take:

#### File Copy
```yaml
steps:
  - text: "Copy package.json"
    file:
      src: ./files/package.json
      dest: package.json
```

#### Directory Creation
```yaml
steps:
  - text: "Create src directory"
    dir:
      create: true
      path: src
```

#### Command Execution
```yaml
steps:
  - text: "Install dependencies"
    command: "npm install"
    incremental: true  # run when building up folders target
```

#### Command Results
```yaml
steps:
  - command: "npm run test"
    results:
      - text: "You should see:"
        code: |
          All tests passed!
```

## Generated Output

### Markdown Features

- **File Diffs**: Shows changes between versions
- **Copy Commands**: Easy-to-follow file copy instructions
- **Collapsible Sections**: Hide/show file contents
- **Code Highlighting**: Syntax highlighting for various languages

Example markdown output:

~~~markdown
# Initial Setup

Copy the package.json:

    cp ./files/package.json package.json

<details>
<summary>show file</summary>

```json
{
  "name": "my-project",
  "version": "1.0.0"
}
```
</details>

Install dependencies:

    npm install

You should see:

    added 123 packages
~~~

### Section Folders

The `folders` target creates:

1. A directory for each section
2. Section-specific README.md files
3. Working project state
4. Optional final state directory

## Examples

See the [examples](./examples) directory for complete examples:

- [TypeScript CLI](./examples/typescript): Basic TypeScript project setup
- [Walkthroughgen](./examples/walkthroughgen): Self-documenting example

## Tips

1. Use meaningful section names - they become folder names
2. Include context in step text
3. Use `incremental: true` for commands that modify state
4. Leverage diffs to highlight important changes
5. Use the `skip` array to exclude setup/cleanup sections from output

## Contributing

Contributions welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
