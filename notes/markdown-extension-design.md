# Markdown Extension Design

I want to extend the markdown symbols to accommodate some custom syntax for my application. How should I design this?

I need to be able to indicate to the ai agent that the previous statement is a prompt for the ai orchestrator agent to take action on. 

I am thinking I need some sort of user created syntax which will trigger the markdown editor to create a prompt node, associate it to the user id, add it to the markdown prompts array and then push the prompt to be added to a fifo prompts buffer where the ai orchestrator agent can pick it up and take action on it.

When the ai orchestrator agent picks up the prompt node, it will update the node with the pending status and send it back to the markdown editor. The markdown editor will update the markdown content to reflect the change in status from waiting to pending. When the ai agent completes the action, it will create a markdown document and add it to the document vector database, then update the prompt node from pending to completed and add the markdown node id to the prompt node. It will then send the prompt node back to the markdown editor. The markdown editor will update the prompt node in the prompts array and update the markdown content to reflect the change in status from pending to completed.

Does this make sense?