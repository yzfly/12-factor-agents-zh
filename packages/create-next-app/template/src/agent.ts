import { ContactChannel, FunctionCall, HumanContact, humanlayer, HumanLayer } from 'humanlayer'
import {
  b,
  ClarificationRequest,
  DoneForNow,
  AddTool,
  SubtractTool,
  MultiplyTool,
  DivideTool,
} from './baml_client'
import * as yaml from 'js-yaml'
import { V1Beta1FunctionCallCompleted, V1Beta1HumanContactCompleted, EmailPayload, SlackThread } from './vendored'
import { saveThreadState, getThreadState, getSlackTokenForTeam } from './state'

// todo(dex) put this in a config.ts or humanlayer.ts or something
const HUMANLAYER_API_KEY = process.env.HUMANLAYER_API_KEY_NAME ? process.env[process.env.HUMANLAYER_API_KEY_NAME] : process.env.HUMANLAYER_API_KEY

type AgentEvent = Awaited<ReturnType<typeof b.DetermineNextStep>>
type ToolResponse = any;

// Events and Threads
export interface Event {
  type: string;
  data: AgentEvent | ToolResponse;
}

export interface Thread {
  initial_email?: EmailPayload;
  initial_slack_message?: SlackThread;
  events: Event[];
}

export function stringifyToYaml(obj: any): string {
  if (!obj) {
    return 'undefined'
  }

  const replacer = (key: string, value: any) => {
    if (typeof value === 'function') {
      return undefined
    }
    return value
  }

  const plainObj = JSON.parse(JSON.stringify(obj, replacer))

  return yaml.dump(plainObj, {
    skipInvalid: true,
    noRefs: true,
  })
}

const eventToPrompt = (event: Event) => {
  switch (event.type) {
    case 'email_received':
      const email = event.data as EmailPayload
      return `<${event.type}>
            From: ${email.from_address}
            To: ${email.to_address}
            Subject: ${email.subject}
            Body: ${email.body}
            Previous Thread: ${stringifyToYaml(email.previous_thread)}
</${event.type}>
        `
    default:
      const data = typeof event.data !== 'string' ? stringifyToYaml(event.data) : event.data
      return `<${event.type}>
          ${data}
</${event.type}>
      `
  }
}

const threadToPrompt = (thread: Thread) => {
  return thread.events.map(eventToPrompt).join('\n\n')
}

const appendResult = async (
  thread: Thread,
  fn: () => Promise<any>,
): Promise<Thread> => {
  const lastEvent: Event = thread.events.slice(-1)[0]
  const responseType: string = lastEvent.type + '_result'
  if (!responseType) {
    thread.events.push({
      type: 'error',
      data: `No response type found for ${lastEvent.type} - something is wrong with your internal programming, please get help from a human`,
    })
    return thread
  }
  try {
    const result = await fn()
    thread.events.push({
      type: responseType,
      data: result,
    })
  } catch (e) {
    console.error(e)
    thread.events.push({
      type: 'error',
      data: `error running ${lastEvent.type}: ${e}`,
    })
  }
  return thread
}

const _handleNextStep = async (
  thread: Thread,
  nextStep: AgentEvent,
  hl: HumanLayer,
): Promise<Thread | false> => {
  thread.events.push({
    type: nextStep.intent,
    data: nextStep,
  })
  let stateId: string | null = null
  switch (nextStep.intent) {
    case 'done_for_now':
      stateId = await saveThreadState(thread)

      await hl.createHumanContact({
        spec: {
          msg: nextStep.message,
          state: { stateId },
        },
      })
      console.log(`thread sent to humanlayer`)
      return false
    case 'request_more_information':

      stateId = await saveThreadState(thread)

      await hl.createHumanContact({
        spec: {
          msg: nextStep.message,
          state: { stateId },
        },
      })
      console.log(`thread sent to humanlayer`)
      return false
    case 'add':
      return await appendResult(thread, async () => {
        return nextStep.a + nextStep.b
      })
    case 'subtract':
      return await appendResult(thread, async () => {
        return nextStep.a - nextStep.b
      })
    case 'multiply':
      return await appendResult(thread, async () => {
        return nextStep.a * nextStep.b
      })
    // division is scary - always require human approval
    case 'divide':

      stateId = await saveThreadState(thread)

      await hl.createFunctionCall({
        spec: {
          fn: "divide",
          kwargs: { a: nextStep.a, b: nextStep.b },
          state: { stateId },
        },
      })
      return false
  }
}


export const handleNextStep = async (thread: Thread): Promise<void> => {
  console.log(`thread: ${JSON.stringify(thread)}`)

  const hl = await getHumanLayerInstanceForThread(thread)

  let nextThread: Thread | false = thread

  while (true) {
    const nextStep = await b.DetermineNextStep(threadToPrompt(nextThread))

    console.log(`===============`)
    console.log(threadToPrompt(thread))
    console.log(nextStep)
    console.log(`===============`)

    nextThread = await _handleNextStep(thread, nextStep, hl)
    if (!nextThread) {
      break
    }
  }
}

export const handleHumanResponse = async (
  thread: Thread,
  payload: V1Beta1HumanContactCompleted | V1Beta1FunctionCallCompleted,
): Promise<void> => {
  const humanResponse = payload.event

  if (payload.type === 'human_contact.completed') {
    const humanContact = humanResponse as HumanContact
    thread.events.push({
      type: 'human_response',
      data: humanContact.status?.response!,
    })
    return await handleNextStep(thread)
  } else if (payload.type === 'function_call.completed') {
    const functionCall = humanResponse as FunctionCall
    const stateId = (functionCall.spec.state as any).stateId
    let currentThread = stateId ? await getThreadState(stateId) : null
    if (!currentThread) {
      currentThread = thread
    }

    if (!functionCall.status?.approved) {
      currentThread.events.push({
        type: 'human_response',
        data: `User denied ${functionCall.spec.fn} with feedback: ${
          functionCall.status?.comment || '(No comment provided)'
        }`,
      })
      return await handleNextStep(currentThread)
    } else if (functionCall.spec.fn === 'promote_vercel_deployment') {
      const updatedThread = await appendResult(currentThread, async () => {
        console.log(`promoting vercel deployment: ${functionCall.spec.kwargs.new_deployment}`)
        console.log(`previous deployment: ${functionCall.spec.kwargs.previous_deployment}`)
        const resp = await triggerWorkflowDispatch(
          'vercel-promote-to-prod.yaml',
          'main',
          {
            'git_sha': functionCall.spec.kwargs.new_deployment_sha,
          })
        console.log(`resp: ${resp}`)
        return resp
      })
      return await handleNextStep(updatedThread)
    } else if (functionCall.spec.fn === 'tag_push_prod') {
      const updatedThread = await appendResult(currentThread, async () => {
        console.log(`tagging and pushing to prod: ${functionCall.spec.kwargs.new_commit}`)
        console.log(`previous commit: ${functionCall.spec.kwargs.previous_commit}`)
        const resp = await triggerWorkflowDispatch(
          'tag-and-push-prod.yaml',
          'main',
        )
      })
      return await handleNextStep(updatedThread)
    } else {
      currentThread.events.push({
        type: 'error',
        data: `Unknown intent: ${functionCall.spec.fn}`,
      })
      return await handleNextStep(currentThread)
    }
  }

  throw new Error(`Could not determine human response type: ${JSON.stringify(humanResponse)}`)
}

/**
 * inspect the initial thread event and return a humanlayer instance
 * that contacts the human back on the orighinal channel
 * 
 * (e.g. if the thread starts with an email, we'll reply on that email thread, same for slack)
 * 
 * @returns 
 */
async function getHumanLayerInstanceForThread(thread: Thread): Promise<HumanLayer> {
  let contactChannel: ContactChannel | null = null
  if (thread.initial_slack_message) {
    const teamId = thread.initial_slack_message.team_id
    console.log('Looking up token for team:', teamId)

    const slackBotToken = await getSlackTokenForTeam(teamId)

    contactChannel = {
      slack: {
        channel_or_user_id: thread.initial_slack_message?.channel_id || "",
        experimental_slack_blocks: true,
        bot_token: slackBotToken || undefined,
      }
    }
  } else if (thread.initial_email) {
    contactChannel = {
      email: {
        address: thread.initial_email.from_address,
        experimental_subject_line: thread.initial_email.subject,
        experimental_in_reply_to_message_id: thread.initial_email.message_id,
        experimental_references_message_id: thread.initial_email.message_id,
      }
    }
  }

  console.log(`contactChannel: ${JSON.stringify(contactChannel)}`)
  const hl = humanlayer({ contactChannel: contactChannel || undefined, apiKey: HUMANLAYER_API_KEY })
  return hl
}
