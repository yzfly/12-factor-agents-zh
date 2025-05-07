# Chapter 6 - Customize Your Prompt with Reasoning

Improve the agent's prompting by adding reasoning steps.

Update agent with reasoning steps

```diff
baml_src/agent.baml
+
+        Always think about what to do next first, like:
+
+        - ...
+        - ...
+        - ...
+
+        {...} // schema
-        
-
```

<details>
<summary>skip this step</summary>

    cp ./walkthrough/06-agent.baml baml_src/agent.baml

</details>

Generate updated client

    npx baml-cli generate

