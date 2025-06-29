# A2H - The Agent-to-Human Protocol


## Overview

A2H is a service that allows an agent to request human interaction


## Why another protocol?

MCP and A2A are not enough

## Shoulds

- Clients should respect A2H_BASE_URL and A2H_API_KEY environment variables if set, to allow for simple oauth2-based authentication to REST services.

## Core Protocol 

### Scopes 

The A2H protocol supports two scopes:

- The agent side, APIs consumed by an agent to request human interaction
- The (Optional) admin side, APIs consumed by an admin or web application to manage humans and their contact channels

This separation allows for agents to query and find humans to contact, without exposing the human's contact details to the agent. It is the responsibility of the A2H provider to relay agent requests to the appropriate human via that human's preferred contact channel(s).

### Objects

```
apiVersion: proto.a2h.dev/v1alpha1
kind: Message
metatdata:
  uid: "123"
spec: # spec sent by agent
  message: "" # message from the agent
  response_schema:
   # optional, json schema for the response,
  channel_id: 
status: # status resolved by a2h server
  humanMessage: "" # message from the human
  response:
    # optional, matches spec schema
```

```
apiVersion: proto.a2h.dev/v1alpha1
kind: NewConversation
metadata:
  uid: "abc"
spec: # spec sent by a2h server
  message: "" # message from the agent
  channel_id: "123" # channel id to use for future conversations
  response_schema:
   # optional, json schema for the response,
```



  





#### HumanContact

```json
{
  "run_id": "run_123",
  "call_id": "call_456",
  "spec": {
    "msg": "I've tried using the tool to refund the customer but its returning a 500 error. Can you help?",
    "channel": {
      "slack": {
        "channel_or_user_id": "U1234567890",
        "context_about_channel_or_user": "Support team lead"
      }
    },
  },
}
```

A HumanContact represents a request for human interaction. It contains:

- `run_id` (string): Unique identifier for the run
- `call_id` (string): Unique identifier for the contact request
- `spec` (HumanContactSpec): The specification for the contact request
- `status` (HumanContactStatus, optional): The current status of the contact request

The HumanContactSpec contains:
- `msg` (string): The message to send to the human
- `subject` (string, optional): Subject of the contact request
- `channel` (ContactChannel, optional): The channel to use for contact
- `response_options` (ResponseOption[], optional): Available response options
- `state` (object, optional): Additional state information

The HumanContactStatus contains:
- `requested_at` (datetime, optional): When the contact was requested
- `responded_at` (datetime, optional): When the human responded
- `response` (string, optional): The human's response
- `response_option_name` (string, optional): Name of the selected response option
- `slack_message_ts` (string, optional): Slack message timestamp if applicable
- `failed_validation_details` (object, optional): Details if validation failed

#### FunctionCall

Example:
```json
{
  "run_id": "run_789",
  "call_id": "call_101",
  "spec": {
    "fn": "process_payment",
    "kwargs": {
      "amount": 100.00,
      "currency": "USD",
      "recipient": "merchant_123"
    },
    "channel": {
      "email": {
        "address": "ap@example.com",
      }
    },
  },
  "status": {
    "requested_at": "2024-03-20T11:00:00Z",
    "responded_at": "2024-03-20T11:02:00Z",
    "approved": true,
    "comment": "Payment looks good, approved",
    "user_info": {
      "name": "John Doe",
      "role": "Finance Manager"
    },
    "slack_message_ts": "1234567890.123457"
  }
}
```

A FunctionCall represents a request for human approval of a function execution. It contains:

- `run_id` (string): Unique identifier for the run
- `call_id` (string): Unique identifier for the function call
- `spec` (FunctionCallSpec): The specification for the function call
- `status` (FunctionCallStatus, optional): The current status of the function call

The FunctionCallSpec contains:
- `fn` (string): The function to be called
- `kwargs` (object): The keyword arguments for the function
- `channel` (ContactChannel, optional): The channel to use for contact
- `reject_options` (ResponseOption[], optional): Available rejection options
- `state` (object, optional): Additional state information

The FunctionCallStatus contains:
- `requested_at` (datetime, optional): When the approval was requested
- `responded_at` (datetime, optional): When the human responded
- `approved` (boolean, optional): Whether the function call was approved
- `comment` (string, optional): Any comment from the human
- `user_info` (object, optional): Information about the responding user
- `slack_context` (object, optional): Slack-specific context
- `reject_option_name` (string, optional): Name of the selected rejection option
- `slack_message_ts` (string, optional): Slack message timestamp if applicable
- `failed_validation_details` (object, optional): Details if validation failed

#### ContactChannel

Example:
```json
{
  "slack": {
    "channel_or_user_id": "U1234567890",
    "context_about_channel_or_user": "Support team lead",
    "allowed_responder_ids": ["U1234567890", "U2345678901"],
    "experimental_slack_blocks": true,
    "thread_ts": "1234567890.123456"
  }
}
```

or

```json
{
    "email": {
        "address": "ap@example.com",
        "context_about_user": "Accounts Payable",
        "in_reply_to_message_id": "1234567890",
        "references_message_id": "1234567890",
        "template": "<html><body>...</body></html>"
    }
}
```

A ContactChannel represents a channel through which a human can be contacted. The protocol supports several channel types:

1. SlackContactChannel:
   - `channel_or_user_id` (string): The Slack channel or user ID
   - `context_about_channel_or_user` (string, optional): Additional context
   - `bot_token` (string, optional): Bot token for authentication
   - `allowed_responder_ids` (string[], optional): IDs of allowed responders
   - `experimental_slack_blocks` (boolean, optional): Enable experimental blocks
   - `thread_ts` (string, optional): Thread timestamp for threaded messages

2. SMSContactChannel:
   - `phone_number` (string): The phone number to contact
   - `context_about_user` (string, optional): Additional context about the user

3. WhatsAppContactChannel:
   - `phone_number` (string): The phone number to contact
   - `context_about_user` (string, optional): Additional context about the user

#### Human (Agent Side)

From the agent's perspective, a human is an object that has a name and description.

#### Human (Admin Side)

From the admin's perspective, a human is an object that has a name, description, and a list of prioritized contact channels, with details 

### Agent Endpoints


#### POST /human_contacts

#### GET /human_contacts/:call_id

#### POST /function_calls

#### GET /function_calls/:call_id


## Extended Protocol

- Admin Humans
- Agent Humans Get
- Agent Humans Search
- Agent Channels List
- Agent Channels validate

### Objects

#### Human (Agent Side)

From the agent's perspective, a human is an object that has a name and description.

#### Human (Admin Side)

From the admin's perspective, a human is an object that has a name, description, and a list of prioritized contact channels, with details 

### Agent Endpoints

#### GET /channels 

return what contact channels are available and their supported fields

example response:

```json
{
    "channels": {
        "slack": {
            "channelOrUserId": {
                "type": "string",
                "description": "The Slack channel or user ID to send messages to"
            },
            "contextAboutChannelOrUser": {
                "type": "string", 
                "description": "Additional context about the Slack channel or user"
            }
        },
        "email": {
            "address": {
                "type": "string",
                "description": "Email address to send messages to"
            },
            "contextAboutUser": {
                "type": "string",
                "description": "Additional context about the email recipient"
            },
            "inReplyToMessageId": {
                "type": "string",
                "description": "The message ID of the email to reply to"
            },
            "referencesMessageId": {
                "type": "string",
                "description": "The message ID of the email to reference"
            }
        }
    }
}
```

#### GET /humans

return a list of humans that are available to interact with

example response:

```json
{
    "humans": [
        {
            "id": "654",
            "name": "Jane Doe",
            "description": "Jane Doe is a human who knows about technology and entrepreneurship",
        },
        {
            "id": "123",
            "name": "John Doe",
            "description": "John Doe is a human who knows about sales and marketing"
        }
    ]
}
#### GET /humans/search?q=

search for humans by name or description

example response:

```json
{
    "humans": [
        {
            "id": "654",
            "name": "Jane Doe",
            "description": "Jane Doe is a human who knows about technology and entrepreneurship",
        },
    ]
}
```

### Administrative Endpoints


#### POST /humans

Enroll a new human for agent contact

example request:

```json
{
    "name": "John Doe",
    "description": "John Doe is a human who knows about sales and marketing",
    "prioritizedContactChannels": [
        {
            "slack": {
                "channelOrUserId": "U1234567890",
            }
        },
        {
            "email": {
                "address": "john.doe@example.com",
            }
        }
    ]
}
```



#### GET /humans/:id

Get a human by id

example response:

```json