# Chapter 0 - Hello World

Let's start with a basic TypeScript setup and a hello world program.

This guide is written in TypeScript (yes, a python version is coming soon)

There are many checkpoints between the every file edit in theworkshop steps, 
so even if you aren't super familiar with typescript,
you should be able to keep up and run each example.

To run this guide, you'll need a relatively recent version of nodejs and npm installed

You can use whatever nodejs version manager you want, [homebrew](https://formulae.brew.sh/formula/node) is fine


    brew install node@20

You should see the node version

    node --version

Copy initial package.json

    cp ./walkthrough/00-package.json package.json

<details>
<summary>show file</summary>

```json
// ./walkthrough/00-package.json
{
    "name": "my-agent",
    "version": "0.1.0",
    "private": true,
    "scripts": {
      "dev": "tsx src/index.ts",
      "build": "tsc"
    },
    "dependencies": {
      "tsx": "^4.15.0",
      "typescript": "^5.0.0"
    },
    "devDependencies": {
      "@types/node": "^20.0.0",
      "@typescript-eslint/eslint-plugin": "^6.0.0",
      "@typescript-eslint/parser": "^6.0.0",
      "eslint": "^8.0.0"
    }
  }
```

</details>

Install dependencies

    npm install

Copy tsconfig.json

    cp ./walkthrough/00-tsconfig.json tsconfig.json

<details>
<summary>show file</summary>

```json
// ./walkthrough/00-tsconfig.json
{
    "compilerOptions": {
      "target": "ES2017",
      "lib": ["esnext"],
      "allowJs": true,
      "skipLibCheck": true,
      "strict": true,
      "noEmit": true,
      "esModuleInterop": true,
      "module": "esnext",
      "moduleResolution": "bundler",
      "resolveJsonModule": true,
      "isolatedModules": true,
      "jsx": "preserve",
      "incremental": true,
      "plugins": [],
      "paths": {
        "@/*": ["./*"]
      }
    },
    "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
    "exclude": ["node_modules", "walkthrough"]
  }
```

</details>

add .gitignore

    cp ./walkthrough/00-.gitignore .gitignore

<details>
<summary>show file</summary>

```gitignore
// ./walkthrough/00-.gitignore
baml_client/
node_modules/
```

</details>

Create src folder

    mkdir -p src

Add a simple hello world index.ts

    cp ./walkthrough/00-index.ts src/index.ts

<details>
<summary>show file</summary>

```ts
// ./walkthrough/00-index.ts
async function hello(): Promise<void> {
    console.log('hello, world!')
}

async function main() {
    await hello()
}

main().catch(console.error)
```

</details>

Run it to verify

    npx tsx src/index.ts

You should see:

    hello, world!

