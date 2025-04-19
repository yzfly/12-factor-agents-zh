import { b, DoneForNow, ClarificationRequest, AddTool, MultiplyTool, SubtractTool, DivideTool } from "../baml_client"
import { FunctionCallStatus, HumanContactStatus, humanlayer } from "humanlayer"

type SlackEvent = {}
type EmailEvent = {}
type HumanResponseEvent = FunctionCallStatus | HumanContactStatus
type HumanRequestState = {}

type StartEvent = SlackEvent | EmailEvent
type TerminalEvent = DoneForNow | ClarificationRequest
type ToolEvent = AddTool | MultiplyTool | SubtractTool | DivideTool

// todo(vaibhav) make this better
type ToolResponse = any;
type AgentEvent = {
  type: 'tool'
  data: ToolEvent | TerminalEvent
} | {
  type: 'tool_response'
  data: ToolResponse
} | {
  type: 'await_human'
  data: HumanRequestState
} | {
  type: 'human_response'
  data: HumanResponseEvent
}

class AgentState {
  readonly trigger: StartEvent
  events: AgentEvent[]

  private constructor(trigger: StartEvent, events?: AgentEvent[]) {
    this.trigger = trigger
    this.events = events ?? []
  }

  static async fromHistory(trigger: StartEvent, events: AgentEvent[]) {
    const state = new AgentState(trigger, events)
    await state.initialize()
    return state
  }

  static async fromTrigger(trigger: StartEvent) {
    const state = new AgentState(trigger)
    await state.initialize()
    return state
  }

  private async initialize() {
    // TODO execute pending tools if they are approved
  }

  public get shouldContinue() : boolean {
    let lastEvent = this.events[this.events.length - 1]

    switch (lastEvent.type) {
      case 'tool':
        switch (lastEvent.data.intent) {
          case 'done_for_now':
          case 'request_more_information':
              return false
          case 'add':
          case 'subtract':
          case 'multiply':
          case 'divide':
            return true
        }
      case 'tool_response':
        return true
      case 'human_response':
        return true
      case 'await_human':
        return false
    }
  }

  public serialize() : string {
    return JSON.stringify([this.trigger, ...this.events])
  }

  public addEvent(event: AgentEvent) {
    this.events.push(event)
  }

  public async handleNextStep(nextStep: TerminalEvent | ToolEvent): Promise<void> {
    switch (nextStep.intent) {
      case 'request_more_information':
        // break - send message back to human
        return;
      case 'done_for_now':
        // break - send message back to human
        return;
      case 'divide':
        // break - divide is scary get approval
        this.addEvent({
          type: 'await_human',
          data: {}
        })
        return;
      case 'add':
        this.addEvent({
          type: 'tool_response',
          data: nextStep.a + nextStep.b
        })
        return;
      case 'subtract':
        this.addEvent({
          type: 'tool_response',
          data: nextStep.a - nextStep.b
        })
        return;
      case 'multiply':
        this.addEvent({
          type: 'tool_response',
          data: nextStep.a * nextStep.b
        })
        return;
    }
  }
}

async function agentLoop(state: AgentState) {
  
  while (state.shouldContinue) {
    const nextStep = await b.DetermineNextStep(state.serialize())
    state.addEvent({
      type: 'tool',
      data: nextStep
    })
    await state.handleNextStep(nextStep)
  }

  return state;
}

async function expressEndpoint(event: { create: SlackEvent | EmailEvent } | { continue: AgentState, tool_response: ToolResponse } | { human: HumanResponseEvent } ) {
  if ('create' in event) {
    const state = await AgentState.fromTrigger(event.create)
    const resp = await agentLoop(state)
  } else if ('continue' in event) {
    const state = await AgentState.fromHistory(event.continue, event.tool_response)
  } else if ('human' in event) {
    const state = await AgentState.fromHistory(event.continue, event.tool_response)
  }

  const resp = await agentLoop(state)

  // returned, which means we're done for now, send result somewhere
  const lastEvent = resp.events[resp.events.length - 1]

  // if no humanlayer, res.json()... and the api or chat ui can display the last thing
  // which either: do divide (get approval) or a stirng response to print to the UI

  // else

  return resp.json(200, {status: ok})
}