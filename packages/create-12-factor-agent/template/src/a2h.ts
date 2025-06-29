import { z, ZodSchema } from 'zod';

// Types for A2H API objects matching the new schemas

// Common metadata type
export type Metadata = {
  uid: string;
};

// Message sent by agent to a2h server
type MessageSpec<T extends ZodSchema<any>> = {
  agentMessage: string; // message from the agent
  response_schema?: T; // optional Zod schema for the response
  channel_id?: string; // optional channel id
};

export type Message<T extends ZodSchema<any> = ZodSchema<any>> = {
  apiVersion: "proto.a2h.dev/v1alpha1";
  kind: "Message";
  metadata: Metadata;
  spec: MessageSpec<T>;
  status?: {
    humanMessage?: string; // message from the human
    response?: T extends ZodSchema<any> ? z.infer<T> : any; // optional, matches spec schema
  };
};

export const ApprovalSchema = z.object({
  approved: z.boolean(),
  comment: z.string().optional(),
});

export type ApprovalRequest = Message<typeof ApprovalSchema>;
export type HumanRequest = Message;

// NewConversation sent by a2h server to agent
type NewConversationSpec = {
  user_message: string; // message from the human
  channel_id: string; // channel id to use for future conversations
  agent_name?: string; // optional agent name or identifier
  raw?: Record<string, any>; // optional raw data from the request, e.g. email metadata
};

export type NewConversation = {
  apiVersion: "proto.a2h.dev/v1alpha1";
  kind: "NewConversation";
  metadata: Metadata;
  spec: NewConversationSpec;
};

// Optionally, you can add union types for future extensibility
export type A2HEvent<T extends ZodSchema<any> = ZodSchema<any>> = Message<T> | NewConversation;

