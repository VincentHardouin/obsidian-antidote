export function regReader(key: string, value: string): string {
  const laRequete = `REG QUERY "${key}" /v ${value}`
  const REG = require('node:child_process').execSync(laRequete).toString();
  let regFin = REG.substring(REG.indexOf('REG_'));
  regFin = regFin.substring(regFin.indexOf(' '));
  return regFin.trim();
}
