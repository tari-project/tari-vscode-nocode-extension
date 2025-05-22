export function getNextAvailable(name: string, isValid: (name: string) => boolean): string {
  if (isValid(name)) {
    return name;
  }
  let counter = 0;
  let fullName: string;
  do {
    counter++;
    fullName = `${name}${counter.toString()}`;
  } while (!isValid(fullName));
  return fullName;
}
