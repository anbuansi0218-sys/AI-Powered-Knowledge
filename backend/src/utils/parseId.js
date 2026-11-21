export default function parseId(value, label = 'id') {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1) {
    const error = new Error(`Invalid ${label}.`);
    error.status = 400;
    throw error;
  }
  return id;
}
