# Chapter 6 - Customize Your Prompt with Reasoning

In this section, we'll explore how to customize the prompt of the agent
with reasoning steps.

this is core to [factor 2 - own your prompts](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-2-own-your-prompts.md)

there's a deep dive on reasoning on AI That Works [reasoning models versus reasoning steps](https://github.com/hellovai/ai-that-works/tree/main/2025-04-07-reasoning-models-vs-prompts)


for this section, it will be helpful to leave the baml logs enabled

    export BAML_LOG=debug

update the agent prompt to include a reasoning step


```diff
baml_src/agent.baml
 
         {{ ctx.output_format }}
+
+        First, always plan out what to do next, for example:
+
+        - ...
+        - ...
+        - ...
+
+        {...} // schema
     "#
 }
   @@assert(b, {{this.a == 3}})
 }
-        
-
```

<details>
<summary>skip this step</summary>

    cp ./walkthrough/06-agent.baml baml_src/agent.baml

</details>

generate the updated client

    npx baml-cli generate

now, you can try it out with a simple prompt


    npx tsx src/index.ts 'can you multiply 3 and 4'

you should see output from the baml logs showing the reasoning steps

#### optional challenge 

add a field to your tool output format that includes the reasoning steps in the output!


