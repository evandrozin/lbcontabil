import { z } from "zod";
import {
  normalizarCNPJ,
  somenteDigitos,
  validarCEP,
  validarCNPJ,
  validarCelular,
  validarCpfOuCnpj,
} from "@/lib/validacao/documentos";

/**
 * Esquema único do checkout, usado no cliente (feedback imediato) e no
 * servidor (fonte da verdade). Validação de formulário no navegador é
 * conveniência; quem decide se a venda entra é a rota da API.
 */
export const esquemaCheckout = z
  .object({
    planoId: z.string().min(1, "Plano não informado."),
    periodicidade: z.enum(["mensal", "anual"]),
    metodo: z.enum(["cartao", "pix", "boleto", "escolher-depois"]),

    responsavelNome: z
      .string()
      .trim()
      .min(5, "Informe o nome completo.")
      .max(120, "Nome muito longo.")
      .refine((v) => v.includes(" "), "Informe nome e sobrenome."),
    responsavelEmail: z.email("E-mail inválido.").max(160),
    responsavelCpfCnpj: z
      .string()
      .transform(normalizarCNPJ)
      .refine(validarCpfOuCnpj, "CPF ou CNPJ inválido."),
    responsavelCelular: z
      .string()
      .transform(somenteDigitos)
      .refine(validarCelular, "Celular inválido. Use DDD + 9 dígitos."),
    cep: z
      .string()
      .transform(somenteDigitos)
      .refine((v) => v === "" || validarCEP(v), "CEP inválido.")
      .optional(),

    jaTemEmpresa: z.boolean(),
    empresaRazaoSocial: z.string().trim().max(200).optional(),
    empresaCnpj: z.string().transform(normalizarCNPJ).optional(),

    aceiteContrato: z.literal(true, {
      message: "É preciso aceitar o contrato para contratar.",
    }),
  })
  .superRefine((dados, ctx) => {
    if (!dados.jaTemEmpresa) return;

    if (!dados.empresaCnpj) {
      ctx.addIssue({
        code: "custom",
        path: ["empresaCnpj"],
        message: "Informe o CNPJ da empresa que já existe.",
      });
      return;
    }

    if (!validarCNPJ(dados.empresaCnpj)) {
      ctx.addIssue({
        code: "custom",
        path: ["empresaCnpj"],
        message: "CNPJ inválido.",
      });
    }

    if (!dados.empresaRazaoSocial) {
      ctx.addIssue({
        code: "custom",
        path: ["empresaRazaoSocial"],
        message: "Informe a razão social.",
      });
    }
  });

export type DadosCheckout = z.infer<typeof esquemaCheckout>;

export const esquemaSimulacao = z.object({
  segmentoId: z.string().max(40),
  planoRecomendadoId: z.string().max(60),
  periodicidade: z.enum(["mensal", "anual"]),
  totalMensalCentavos: z.number().int().nonnegative(),
  entrada: z.record(z.string(), z.unknown()),
  origem: z.string().max(200).optional(),
});
