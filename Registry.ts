export function regReader(key: String, value: String): String
{
    let laRequete = `REG QUERY "${key}" /v ${value}`
    let REG = require('child_process').execSync(laRequete).toString();
    let regFin = REG.substring(REG.indexOf("REG_"));
    regFin = regFin.substring(regFin.indexOf(" "));
    return regFin.trim();
}