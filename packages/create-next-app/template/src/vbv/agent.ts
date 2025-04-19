import { SlackEvent } from "@slack/web-api"
import { b, DoneForNow, ClarificationRequest, AddTool, MultiplyTool, SubtractTool, DivideTool } from "../baml_client"
import { SlackThread } from "../vendored"

class Interrupt extends Error {
  constructor(message: string) {
    super(message)
  }
}

const divide = (a: number, b: number) => {
  throw new Interrupt("divide requires approval")

  if (b === 0) {
    throw new Error('Cannot divide by zero')
  }
  return a / b
}

const handleNextStep = (state: AgentState, nextStep: TerminalEvent | ToolEvent): boolean => {
  state.addEvent(nextStep)

  switch (nextStep.intent) {
    case 'request_more_information':
      // break - send message back to human
      return false
    case 'done_for_now':
      // break - send message back to human
      return false
    case 'divide':
      // break - divide is scary get approval
      const result = divide(nextStep.a, nextStep.b)
      state.addEvent({
        type: 'divide_response',
        data: result
      })
      return true
    case 'add':
      state.addEvent({
        type: 'add_response',
        data: nextStep.a + nextStep.b
      })
      return true
    case 'subtract':
      state.addEvent({
        type: 'subtract_response',
        data: nextStep.a - nextStep.b
      })
      return true
    case 'multiply':
      state.addEvent({
        type: 'multiply_response',
        data: nextStep.a * nextStep.b
      })
      return true
  }
}

type SlackEvent = {}
type EmailEvent = {}
type HumanResponseEvent = {}




type StartEvent = SlackEvent | EmailEvent
type TerminalEvent = DoneForNow | ClarificationRequest
type ToolEvent = AddTool | MultiplyTool | SubtractTool | DivideTool

// todo(vaibhav) make this better
type ToolResponse = any;
type AgentEvent = TerminalEvent | ToolEvent | ToolResponse

class AgentState {
  readonly trigger: StartEvent
  events: AgentEvent[]

  constructor(trigger: StartEvent, events?: AgentEvent[]) {
    this.trigger = trigger
    this.events = events ?? []
  }

  public get shouldContinue() : boolean {

    let lastEvent = this.events[this.events.length - 1]
    switch (lastEvent.intent) {
      case 'divide':
        return false
      default:
        return true
    }
  }

  public serialize() : string {
    return JSON.stringify([this.trigger, ...this.events])
  }

  public addEvent(event: AgentEvent) {
    this.events.push(event)
  }
}


async function agentLoop(state: AgentState) {
  
  while (state.shouldContinue) {
    const nextStep = await b.DetermineNextStep(state.serialize())
    const result = handleNextStep(state, nextStep)
    state.addEvent(nextStep, result)
  }

  // Do human layer stuff heremo
  return state;
}


async function expressEndpoint(event: SlackEvent | EmailEvent | HumanResponseEvent) {
  const state = new AgentState(event)

  const resp = await agentLoop(state)

  // returned, which means we're done for now, send result somewhere
  const lastEvent = resp.events[resp.events.length - 1]

  // if no humanlayer, res.json()... and the api or chat ui can display the last thing
  // which either: do divide (get approval) or a stirng response to print to the UI

  // else

  switch (lastEvent.intent) {
    case 'request_clarification':
      // contact human
      break;
    case 'done_for_now':
      // contact human
      break;
    case 'divide':
      // request approval
      break;
  }

  //
  // respond to the webhook with ok, we fired off the next 
  return resp.json(200, {status: ok})
}