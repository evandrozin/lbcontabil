/**
 * Validação de CPF e CNPJ pelos dígitos verificadores.
 *
 * O CNPJ aqui aceita o formato ALFANUMÉRICO (IN RFB 2.229/2024), em que as
 * 12 primeiras posições podem conter letras. O cálculo do DV passa a usar o
 * código ASCII do caractere menos 48 — para dígitos o resultado é o próprio
 * número, então a regra antiga continua valendo para CNPJ numérico.
 */

export function somenteDigitos(valor: string): string {
  return valor.replace(/\D/g, "");
}

function todosIguais(texto: string): boolean {
  return /^(.)\1+$/.test(texto);
}

export function validarCPF(entrada: string): boolean {
  const cpf = somenteDigitos(entrada);
  if (cpf.length !== 11 || todosIguais(cpf)) return false;

  for (const [tamanho, peso] of [
    [9, 10],
    [10, 11],
  ] as const) {
    let soma = 0;
    for (let i = 0; i < tamanho; i++) {
      soma += Number(cpf[i]) * (peso - i);
    }
    const resto = (soma * 10) % 11;
    const digito = resto === 10 ? 0 : resto;
    if (digito !== Number(cpf[tamanho])) return false;
  }

  return true;
}

/** Normaliza para maiúsculas e remove a máscara, preservando letras. */
export function normalizarCNPJ(entrada: string): string {
  return entrada.toUpperCase().replace(/[^0-9A-Z]/g, "");
}

const PESOS_CNPJ = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

function digitoCNPJ(base: string): number {
  const pesos = PESOS_CNPJ.slice(PESOS_CNPJ.length - base.length);
  let soma = 0;
  for (let i = 0; i < base.length; i++) {
    soma += (base.charCodeAt(i) - 48) * pesos[i];
  }
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

export function validarCNPJ(entrada: string): boolean {
  const cnpj = normalizarCNPJ(entrada);
  if (cnpj.length !== 14) return false;
  // Os dois últimos caracteres são sempre numéricos, mesmo no CNPJ alfanumérico.
  if (!/^[0-9A-Z]{12}\d{2}$/.test(cnpj)) return false;
  if (todosIguais(cnpj)) return false;

  const base = cnpj.slice(0, 12);
  if (digitoCNPJ(base) !== Number(cnpj[12])) return false;
  if (digitoCNPJ(base + cnpj[12]) !== Number(cnpj[13])) return false;

  return true;
}

/** Aceita CPF (produtor rural PF) ou CNPJ (demais segmentos). */
export function validarCpfOuCnpj(entrada: string): boolean {
  const limpo = normalizarCNPJ(entrada);
  if (limpo.length === 11) return validarCPF(limpo);
  if (limpo.length === 14) return validarCNPJ(limpo);
  return false;
}

export function formatarCPF(entrada: string): string {
  const cpf = somenteDigitos(entrada).slice(0, 11);
  return cpf
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function formatarCNPJ(entrada: string): string {
  const cnpj = normalizarCNPJ(entrada).slice(0, 14);
  return cnpj
    .replace(/^([0-9A-Z]{2})([0-9A-Z])/, "$1.$2")
    .replace(/^([0-9A-Z]{2})\.([0-9A-Z]{3})([0-9A-Z])/, "$1.$2.$3")
    .replace(/\.([0-9A-Z]{3})([0-9A-Z])/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export function formatarCpfOuCnpj(entrada: string): string {
  const limpo = normalizarCNPJ(entrada);
  return limpo.length <= 11 ? formatarCPF(limpo) : formatarCNPJ(limpo);
}

/** Celular brasileiro com DDD: 11 dígitos, nono dígito 9. */
export function validarCelular(entrada: string): boolean {
  const tel = somenteDigitos(entrada);
  return /^[1-9]{2}9\d{8}$/.test(tel);
}

export function formatarCelular(entrada: string): string {
  const tel = somenteDigitos(entrada).slice(0, 11);
  if (tel.length <= 10) {
    return tel.replace(/(\d{2})(\d{1,4})(\d{0,4})/, "($1) $2-$3").replace(/-$/, "");
  }
  return tel.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").replace(/-$/, "");
}

/** CEP com 8 dígitos. */
export function validarCEP(entrada: string): boolean {
  return /^\d{8}$/.test(somenteDigitos(entrada));
}

export function formatarCEP(entrada: string): string {
  const cep = somenteDigitos(entrada).slice(0, 8);
  return cep.replace(/(\d{5})(\d{1,3})/, "$1-$2");
}
