/**
 * A utility function to mock console.log and capture its output
 * @param callback The function to execute while console.log is mocked
 * @returns The captured console.log output
 */
export const withMockedConsole = (callback: () => void): string => {
  const originalConsoleLog = console.log;
  let output = "";
  
  console.log = (...args: any[]) => {
    output = args.join(" ");
  };

  try {
    callback();
  } finally {
    console.log = originalConsoleLog;
  }

  return output;
}; 