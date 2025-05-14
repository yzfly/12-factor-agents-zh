# Chapter 4 - Add Tests to agent.baml

Let's add some tests to our BAML agent.

to start, leave the baml logs enabled

    export BAML_LOG=debug

next, let's add some tests to the agent

We'll start with a simple test that checks the agent's ability to handle
a basic calculation.


```diff
baml_src/agent.baml
     "#
   }
+
+test MathOperation {
+  functions [DetermineNextStep]
+  args {
+    thread #"
+      {
+        "type": "user_input",
+        "data": "can you multiply 3 and 4?"
+      }
+    "#
+  }
+}
+
```

<details>
<summary>skip this step</summary>

    cp ./walkthrough/04-agent.baml baml_src/agent.baml

</details>

Run the tests

    npx baml-cli test

now, let's improve the test with assertions!

Assertions are a great way to make sure the agent is working as expected,
and can easily be extended to check for more complex behavior.


```diff
baml_src/agent.baml
     "#
   }
+  @@assert(hello, {{this.intent == "done_for_now"}})
 }
 
     "#
   }
+  @@assert(math_operation, {{this.intent == "multiply"}})
 }
 
```

<details>
<summary>skip this step</summary>

    cp ./walkthrough/04b-agent.baml baml_src/agent.baml

</details>

Run the tests

    npx baml-cli test

as you add more tests, you can disable the logs to keep the output clean. 
You may want to turn them on as you iterate on specific tests.


    export BAML_LOG=off

now, let's add some more complex test cases,
where we resume from in the middle of an in-progress
agentic context window


```diff
baml_src/agent.baml
     "#
   }
-  @@assert(hello, {{this.intent == "done_for_now"}})
+  @@assert(intent, {{this.intent == "done_for_now"}})
 }
 
     "#
   }
-  @@assert(math_operation, {{this.intent == "multiply"}})
+  @@assert(intent, {{this.intent == "multiply"}})
 }
 
+test LongMath {
+  functions [DetermineNextStep]
+  args {
+    thread #"
+      [
+        {
+          "type": "user_input",
+          "data": "can you multiply 3 and 4, then divide the result by 2 and then add 12 to that result?"
+        },
+        {
+          "type": "tool_call",
+          "data": {
+            "intent": "multiply",
+            "a": 3,
+            "b": 4
+          }
+        },
+        {
+          "type": "tool_response",
+          "data": 12
+        },
+        {
+          "type": "tool_call", 
+          "data": {
+            "intent": "divide",
+            "a": 12,
+            "b": 2
+          }
+        },
+        {
+          "type": "tool_response",
+          "data": 6
+        },
+        {
+          "type": "tool_call",
+          "data": {
+            "intent": "add", 
+            "a": 6,
+            "b": 12
+          }
+        },
+        {
+          "type": "tool_response",
+          "data": 18
+        }
+      ]
+    "#
+  }
+  @@assert(intent, {{this.intent == "done_for_now"}})
+  @@assert(answer, {{"18" in this.message}})
+}
+
```

<details>
<summary>skip this step</summary>

    cp ./walkthrough/04c-agent.baml baml_src/agent.baml

</details>

let's try to run it


    npx baml-cli test

