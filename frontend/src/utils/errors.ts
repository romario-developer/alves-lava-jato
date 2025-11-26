const traducoesPadrao: Record<string, string> = {
  'Network Error': 'Erro de rede. Verifique sua conexao.',
  'Request failed with status code 400': 'Requisicao invalida (400). Verifique os campos.',
  'Request failed with status code 401': 'Nao autorizado (401). Faca login novamente.',
  'Request failed with status code 403': 'Acesso negado (403).',
  'Request failed with status code 404': 'Recurso nao encontrado (404).',
  'Request failed with status code 500': 'Erro interno (500). Tente novamente.',
};

const mensagemCamposObrigatorios = 'Preencha/seleciona todos os campos obrigatorios.';

export function getErrorMessage(err: any, fallback = mensagemCamposObrigatorios) {
  const resp = err?.response?.data;
  if (resp) {
    if (typeof resp === 'string') return resp;

    if (Array.isArray(resp?.message)) {
      return fallback;
    }

    if (typeof resp?.message === 'string') {
      const msg = resp.message;
      if (
        msg.includes('must be') ||
        msg.includes('should not be empty') ||
        msg.toLowerCase().includes('string') ||
        msg.toLowerCase().includes('required')
      ) {
        return fallback;
      }
      return msg;
    }
  }

  const msg = typeof err?.message === 'string' ? err.message : '';
  if (msg && traducoesPadrao[msg]) return traducoesPadrao[msg];
  if (msg) return `Erro: ${msg}`;

  return fallback;
}
