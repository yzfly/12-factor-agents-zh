class DiffDescription {
  header string
  instructions string[] @description("The instructions that should preceed the diff - only one sentence per uunique diff section")
}

function DescribeDiff(
    diff: string 
) -> DiffDescription {
    client "openai/gpt-4o"

    prompt #"
      this diff is part of a walkthrough guide.

      It will be displayed along side a set of instructions for the user, in the format of

      INSTRUCTIONS

      DIFF

      your job is to generate instructions for the diff


      {{ _.role("user") }}

      The diff is:

      {{ diff }}

      Please write the instructions that should preceed the diff. 

      They should be fairly terse, maybe one sentence

      {{ ctx.output_format }}

    "#
}

test Diff {
  functions [DescribeDiff]
  args {
    diff #"
      - console.log('hello, world!')
      + console.log('goodbye, world!')

    "#
  }
}
