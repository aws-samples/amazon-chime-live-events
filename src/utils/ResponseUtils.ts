// Throws if the response is non-JSON or contains an error field.
export async function jsonOrBail(
  response: Response,
  label: () => string
): Promise<any> {
  const bail = (message: string) => {
    throw new Error(`${label()}: ${message}`);
  };

  if (response.headers.get('Content-Type') !== 'application/json') {
    bail('Non-JSON response');
  }

  let json: any;
  try {
    json = await response.json();
  } catch (e) {
    bail(`Invalid JSON: ${e}`);
  }

  if (json && json.error) {
    bail(json.error);
  }

  return json;
}

export function hasError(response: Response): boolean {
  return !response.ok;
}
