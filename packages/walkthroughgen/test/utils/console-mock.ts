/**
 * A utility function to mock console.log and console.error and capture their output
 * @param callback The function to execute while console is mocked
 * @returns The captured console output (both log and error messages)
 */
export const withMockedConsole = (callback: () => void): string => {
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  let capturedOutput: string[] = [];
  
  console.log = (...args: any[]) => {
    capturedOutput.push(args.join(" "));
  };

  console.error = (...args: any[]) => {
    capturedOutput.push(args.join(" "));
  };

  try {
    callback();
  } finally {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  }

  return capturedOutput.join("\n");
};