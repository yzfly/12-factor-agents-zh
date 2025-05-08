.PHONY: clean
clean:
	rm -rf build/

.PHONY: generate
generate: clean
	npm -C ../../packages/walkthroughgen/ \
	  exec tsx \
	  ../../packages/walkthroughgen/src/index.ts \
	  generate walkthrough.yaml	
  
