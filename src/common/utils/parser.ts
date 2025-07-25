export function parseArgs(text: string): Record<string, string> {
  const args: Record<string, string> = {};
  const matches = text.matchAll(/(\w+)=(["'][^"']*["']|\[[^\]]+\]|\S+)/g);
  for (const match of matches) {
    const [, key, value] = match;
    args[key] = value.replace(/^"|"$/g, '');
  }
  return args;
}

export function parseBuffs(
  buffString: string,
): { type: string; value: number }[] {
  const result: { type: string; value: number }[] = [];
  const buffs = buffString.replace(/[\[\]]/g, '').split(',');
  for (const b of buffs) {
    const [type, value] = b.split(':');
    if (type && value)
      result.push({ type: type.trim(), value: parseInt(value.trim()) });
  }
  return result;
}
