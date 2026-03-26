// ============================================
// FUNÇÕES PARA DESTACAR NOTAS ABAIXAS DE 5
// ============================================

/**
 * Aplica classes CSS em um input/elemento baseado no valor da nota
 * @param {HTMLElement} elemento - Input ou célula a ser destacada
 * @param {number|string} valor - Valor da nota
 */
function aplicarDestaqueNota(elemento, valor) {
  if (!elemento) return;

  // Limpar classes anteriores
  elemento.classList.remove('nota-baixa', 'nota-muito-baixa', 'nota-baixa-cell', 'nota-muito-baixa-cell');

  // Converter para número
  const nota = parseFloat(valor);

  // Se não for número válido, não destacar
  if (isNaN(nota)) return;

  // Aplicar destaque baseado no valor
  if (nota < 3) {
    // Nota muito baixa (< 3) - vermelho
    if (elemento.tagName === 'INPUT' || elemento.tagName === 'TEXTAREA') {
      elemento.classList.add('nota-muito-baixa');
    } else {
      elemento.classList.add('nota-muito-baixa-cell');
    }
  } else if (nota < 5) {
    // Nota baixa (< 5) - amarelo
    if (elemento.tagName === 'INPUT' || elemento.tagName === 'TEXTAREA') {
      elemento.classList.add('nota-baixa');
    } else {
      elemento.classList.add('nota-baixa-cell');
    }
  }
}

/**
 * Monitora mudanças em inputs de notas e aplica destaque em tempo real
 * @param {HTMLElement} input - Input a ser monitorado
 */
function monitorarInputNota(input) {
  if (!input) return;

  // Aplicar destaque inicial
  aplicarDestaqueNota(input, input.value);

  // Monitorar mudanças
  input.addEventListener('input', function() {
    aplicarDestaqueNota(this, this.value);
  });

  input.addEventListener('change', function() {
    aplicarDestaqueNota(this, this.value);
  });
}

/**
 * Aplica destaque em todos os inputs de média da página
 */
function destacarTodasNotas() {
  // Inputs de média
  document.querySelectorAll('input.media').forEach(input => {
    monitorarInputNota(input);
  });

  // Células com classe de média (se houver)
  document.querySelectorAll('td[data-media], .cell-media').forEach(cell => {
    const valor = cell.getAttribute('data-media') || cell.textContent;
    aplicarDestaqueNota(cell, valor);
  });
}

/**
 * Destaca notas em uma tabela específica
 * @param {string} tabelaId - ID da tabela
 * @param {string} colunaNota - Classe ou identificador da coluna de notas
 */
function destacarNotasNaTabela(tabelaId, colunaNota = 'media') {
  const tabela = document.getElementById(tabelaId);
  if (!tabela) return;

  // Buscar todas as células/inputs com notas
  const elementos = tabela.querySelectorAll(`.${colunaNota}, input.${colunaNota}`);
  
  elementos.forEach(el => {
    if (el.tagName === 'INPUT') {
      monitorarInputNota(el);
    } else {
      const valor = el.getAttribute('data-nota') || el.textContent;
      aplicarDestaqueNota(el, valor);
    }
  });
}

/**
 * Adiciona badge visual ao lado de nota baixa
 * @param {HTMLElement} elemento - Elemento próximo onde o badge será inserido
 * @param {number} nota - Valor da nota
 */
function adicionarBadgeNotaBaixa(elemento, nota) {
  if (!elemento) return;

  // Remover badge anterior se existir
  const badgeAntigo = elemento.parentElement?.querySelector('.badge-nota-baixa, .badge-nota-muito-baixa');
  if (badgeAntigo) badgeAntigo.remove();

  const notaNum = parseFloat(nota);
  if (isNaN(notaNum) || notaNum >= 5) return;

  const badge = document.createElement('span');
  
  if (notaNum < 3) {
    badge.className = 'badge-nota-muito-baixa';
    badge.textContent = 'Nota Crítica';
  } else {
    badge.className = 'badge-nota-baixa';
    badge.textContent = 'Atenção';
  }

  // Inserir badge após o elemento
  if (elemento.nextSibling) {
    elemento.parentElement.insertBefore(badge, elemento.nextSibling);
  } else {
    elemento.parentElement.appendChild(badge);
  }
}

/**
 * Conta quantas notas baixas existem na página
 * @returns {Object} Contadores de notas baixas e muito baixas
 */
function contarNotasBaixas() {
  const inputs = document.querySelectorAll('input.media, .cell-media, [data-media]');
  
  let baixas = 0; // < 5
  let muitoBaixas = 0; // < 3
  
  inputs.forEach(el => {
    const valor = el.value || el.getAttribute('data-media') || el.textContent;
    const nota = parseFloat(valor);
    
    if (!isNaN(nota)) {
      if (nota < 3) {
        muitoBaixas++;
      } else if (nota < 5) {
        baixas++;
      }
    }
  });

  return {
    baixas,
    muitoBaixas,
    total: baixas + muitoBaixas
  };
}

/**
 * Exibe alerta com resumo de notas baixas
 */
function mostrarResumoNotasBaixas() {
  const contagem = contarNotasBaixas();
  
  if (contagem.total === 0) {
    console.log('✅ Nenhuma nota abaixo de 5 encontrada!');
    return;
  }

  console.log(`⚠️ Atenção: ${contagem.total} nota(s) abaixo de 5`);
  console.log(`   📊 Entre 3 e 5: ${contagem.baixas}`);
  console.log(`   🚨 Abaixo de 3: ${contagem.muitoBaixas}`);
}

/**
 * Inicializa o sistema de destaque de notas
 * Chame esta função no DOMContentLoaded ou após carregar as notas
 */
function inicializarDestaqueNotas() {
  // Destacar notas existentes
  destacarTodasNotas();

  // Mostrar resumo no console
  mostrarResumoNotasBaixas();

  // Observer para detectar novas linhas/inputs adicionados dinamicamente
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      mutation.addedNodes.forEach(function(node) {
        if (node.nodeType === 1) { // Element node
          // Se o nó adicionado tem inputs de média
          const inputs = node.querySelectorAll ? node.querySelectorAll('input.media') : [];
          inputs.forEach(input => monitorarInputNota(input));
          
          // Se o próprio nó é um input de média
          if (node.classList && node.classList.contains('media')) {
            monitorarInputNota(node);
          }
        }
      });
    });
  });

  // Observar mudanças no body
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  console.log('✅ Sistema de destaque de notas inicializado!');
}

// Auto-inicializar se o documento já estiver carregado
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializarDestaqueNotas);
} else {
  // DOM já carregado, inicializar imediatamente
  inicializarDestaqueNotas();
}
