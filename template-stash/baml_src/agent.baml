// human tools are async requests to a human
type HumanTools = ClarificationRequest | DoneForNow

class ClarificationRequest {
  intent "request_more_information" @description("you can request more information from me")
  message string
}

class DoneForNow {
  intent "done_for_now"

  message string @description(#"
    message to send to the user about the work that was done. 
  "#)
}

function DetermineNextStep(
    thread: string 
) -> HumanTools | CalculatorTools {
    client CustomSonnet

    prompt #"
        {{ _.role("system") }}

        TODO(vaibhav) basic prompt

        - ...
        - ...
        - ...

        {{ _.role("user") }}

        TODO(vaibhav) basic user

        You are working on the following thread:

        {{ thread }}


        What should the next step be?

        {{ ctx.output_format }}
    "#
}

test InitialEmail {

  functions [DetermineNextStep]
  args {
    thread #"
      
          Events:
              <email_received>: 
                  {"from_address":"test@example.com","to_address":"support@company.com","subject":"New Ticket","body":"Can you make a new issue for Austin to restock the fridges with tasty beers?","message_id":"test123","previous_thread":[],"raw_email":"raw email content","is_test":null}
              </email_received>

              
          
    "#
  }
}


test TeamIDErrorAsksForMoreInput {
  functions [DetermineNextStep]
  args {
    thread #"
      
          Events:
              <email_received>:
                  {"from_address":"test@example.com","to_address":"support@company.com","subject":"New Ticket","body":"Can you make a new issue for Austin to restock the fridges with tasty beers?","message_id":"test123","previous_thread":[],"raw_email":"raw email content","is_test":null}
              </email_received>
              
      <create_issue> 
                  Title: Restock fridges with tasty beers
                  Description: Austin is requested to restock the fridges with tasty beers.
                  Team ID: team_supply_maintenance
              </create_issue>
              
      <issue_create_result>: 
                  {"errors": [{"message": "Argument Validation Error", "path": ["issueCreate"], "locations": [{"line": 3, "column": 13}], "extensions": {"code": "INVALID_INPUT", "type": "invalid input", "userError": true, "userPresentableMessage": "teamId must be a UUID.", "meta": {}}}], "data: null}"
              </issue_create_result>
              
          
    "#
  }
  @@assert({{this.intent == "list_teams"}})
}


test CompletedIssueCreate {
  functions [DetermineNextStep]
  args {
    thread #"
      
          Events:
              <email_received>
                  {"from_address":"test@example.com","to_address":"support@company.com","subject":"New Ticket","body":"Can you make a new issue for Austin to restock the fridges with tasty beers?","message_id":"test123","previous_thread":[],"raw_email":"raw email content","is_test":null}
              </email_received>
              
      <create_issue>
                  Title: Restock fridges with tasty beers
                  Description: Austin is requested to restock the fridges with tasty beers.
                  Team ID: team_supply_maintenance
      </create_issue>
              
      <issue_create_result>
                  {"errors": [{"message": "Argument Validation Error", "path": ["issueCreate"], "locations": [{"line": 3, "column": 13}], "extensions": {"code": "INVALID_INPUT", "type": "invalid input", "userError": true, "userPresentableMessage": "teamId must be a UUID.", "meta": {}}}], "data": null}
      </issue_create_result>
              
      <request_more_information>
                  {"intent":"request_more_information","message":"The team ID provided (team_supply_maintenance) is not a valid UUID, which caused the issue creation to fail. Please provide a valid UUID for the team."}
              </request_more_information>
              
      <human_response>
                  Message: use a different team id, perhaps try running list-teams?
      </human_response>
              
      <list_teams>
                  {"intent":"list_teams","teams":[]}
              </list_teams>
              
      <list_teams_result>
                  {"data": {"teams": {"nodes": [{"id": "b1af0caf-0a15-4d27-a71a-7076f71948bf", "name": "Operations", "members": {"nodes": [{"email": "...", "id": "d9b7a650-e5f3-48d7-ba25-fe72a505cdf1", "displayName": "austin"}, {"email": "...", "id": "16765c85-2286-4c0f-ab49-0d4d79222ef5", "displayName": "dexter"}]}}]}}}
      </list_teams_result>
              
      <create_issue>
                  Title: Restock fridges with tasty beers
                  Description: Austin is requested to restock the fridges with tasty beers.
                  Team ID: b1af0caf-0a15-4d27-a71a-7076f71948bf
      </create_issue>
              
      <issue_create_result>
                  {"data": {"issueCreate": {"success": true, "issue": {"id": "bd1c1df8-1399-49be-b96c-b175db42ab1e", "title": "Restock fridges with tasty beers", "description": "Austin is requested to restock the fridges with tasty beers."}}}}
      </issue_create_result>
              
          
    "#
  }
  @@assert({{this.intent == "done_for_now"}})
}
