// ============================================================
// js/modals.js — Carrega modals.html e gerencia modais globais
// Incluir em todos os HTMLs APÓS o bootstrap.bundle.min.js
// e APÓS js/supabase.js.
// ============================================================

let alunoAtualIndex = -1;
let contextoSelecaoAtual = null;

const selecoesModal = {
  dificuldade: [],
  sala: [],
  plataforma: []
};

function textoParaLista(texto) {
  if (!texto) return [];
  return texto.split(",").map(t => t.trim()).filter(Boolean);
}

function atualizarResumoSelecao(tipo) {
  const mapa = {
    dificuldade: "resumoDificuldade",
    sala: "resumoSala",
    plataforma: "resumoPlataforma"
  };

  const el = document.getElementById(mapa[tipo]);
  if (!el) return;

  const lista = selecoesModal[tipo] || [];

  if (lista.length === 0) {
    el.textContent = "Nenhuma disciplina selecionada";
    return;
  }

  if (lista.length <= 3) {
    el.textContent = lista.join(", ");
    return;
  }

  el.textContent = `${lista.length} disciplinas selecionadas`;
}

function alternarAreaPorRadio(nomeRadio, areaId, valorQueMostra = "true") {
  const selecionado = document.querySelector(`input[name="${nomeRadio}"]:checked`);
  const area = document.getElementById(areaId);
  if (!area) return;

  area.classList.toggle("d-none", !selecionado || selecionado.value !== valorQueMostra);
}

function montarListaDisciplinasSelecao(tipo) {
  const listaEl = document.getElementById("modalSelecionarDisciplinasLista");
  if (!listaEl) return;

  const disciplinas = window.cacheDisciplinas || [];
  const selecionadas = selecoesModal[tipo] || [];

  if (!disciplinas.length) {
    listaEl.innerHTML = `<div class="text-muted">Nenhuma disciplina encontrada.</div>`;
    return;
  }

  listaEl.innerHTML = disciplinas.map((disc, i) => {
    const checked = selecionadas.includes(disc.nome) ? "checked" : "";
    return `
      <div class="form-check mb-2">
        <input class="form-check-input chk-disciplina-selecao" type="checkbox"
          id="disc_${tipo}_${i}" value="${disc.nome}" ${checked}>
        <label class="form-check-label" for="disc_${tipo}_${i}">
          ${disc.nome}
        </label>
      </div>
    `;
  }).join("");
}

function abrirModalSelecaoDisciplinas(tipo, titulo) {
  contextoSelecaoAtual = tipo;

  const tituloEl = document.getElementById("modalSelecionarDisciplinasTitulo");
  if (tituloEl) tituloEl.textContent = titulo;

  montarListaDisciplinasSelecao(tipo);

  bootstrap.Modal.getOrCreateInstance(
    document.getElementById("modalSelecionarDisciplinas")
  ).show();
}

//Antigo inicio do arquivo
(async function carregarModais() {
  try {
    const resp = await fetch("modals.html");
    if (!resp.ok) throw new Error("modals.html não encontrado");
    const html = await resp.text();

    const container = document.createElement("div");
    container.id = "globalModals";
    container.innerHTML = html;
    document.body.appendChild(container);

    document.dispatchEvent(new CustomEvent("modalsLoaded"));
  } catch (err) {
    console.warn("modals.js: não foi possível carregar modals.html →", err.message);
  }
})();

// ── Modal: Alterar Senha ─────────────────────────────────────

let modalSenhaInstance = null;

function abrirModalSenha() {
  // Garante que o modal já foi injetado no DOM
  const modalEl = document.getElementById("modalAlterarSenha");
  if (!modalEl) {
    console.warn("Modal de senha ainda não foi carregado no DOM.");
    return;
  }

  document.getElementById("senhaAtual").value        = "";
  document.getElementById("senhaNova").value         = "";
  document.getElementById("senhaNovaConfirm").value  = "";
  document.getElementById("feedbackSenha").innerHTML = "";

  if (!modalSenhaInstance) {
    modalSenhaInstance = new bootstrap.Modal(modalEl);
  }
  modalSenhaInstance.show();
}

function toggleSenhaModal(inputId) {
  const input = document.getElementById(inputId);
  if (input) input.type = input.type === "password" ? "text" : "password";
}

async function salvarNovaSenha() {
  const senhaAtual   = document.getElementById("senhaAtual").value;
  const senhaNova    = document.getElementById("senhaNova").value;
  const senhaConfirm = document.getElementById("senhaNovaConfirm").value;
  const feedback     = document.getElementById("feedbackSenha");
  const btn          = document.getElementById("btnSalvarSenha");
  const btnTexto     = document.getElementById("btnSalvarSenhaTexto");
  const spinner      = document.getElementById("btnSalvarSenhaSpinner");

  feedback.innerHTML = "";

  if (!senhaAtual || !senhaNova || !senhaConfirm) {
    feedback.innerHTML = `<div class="alert alert-warning py-2">Preencha todos os campos.</div>`;
    return;
  }

  if (senhaNova.length < 6) {
    feedback.innerHTML = `<div class="alert alert-warning py-2">A nova senha precisa ter no mínimo 6 caracteres.</div>`;
    return;
  }

  if (senhaNova !== senhaConfirm) {
    feedback.innerHTML = `<div class="alert alert-warning py-2">A confirmação de senha não confere.</div>`;
    return;
  }

  btn.disabled = true;
  btnTexto.textContent = "Salvando...";
  spinner.classList.remove("d-none");

  try {
    // Reautentica com a senha atual para garantir que é o próprio usuário
    const { data: { user } } = await supabaseClient.auth.getUser();
    const { error: reAuthErr } = await supabaseClient.auth.signInWithPassword({
      email: user.email,
      password: senhaAtual,
    });

    if (reAuthErr) {
      feedback.innerHTML = `<div class="alert alert-danger py-2">Senha atual incorreta.</div>`;
      return;
    }

    // Atualiza para a nova senha
    const { error: updateErr } = await supabaseClient.auth.updateUser({
      password: senhaNova,
    });

    if (updateErr) {
      feedback.innerHTML = `<div class="alert alert-danger py-2">Erro ao atualizar senha: ${updateErr.message}</div>`;
      return;
    }

    feedback.innerHTML = `<div class="alert alert-success py-2">Senha alterada com sucesso!</div>`;

    setTimeout(() => {
      modalSenhaInstance?.hide();
    }, 1500);

  } catch (err) {
    feedback.innerHTML = `<div class="alert alert-danger py-2">Erro inesperado: ${err.message}</div>`;
  } finally {
    btn.disabled = false;
    btnTexto.textContent = "Salvar";
    spinner.classList.add("d-none");
  }
}

// ── Adicione funções de novos modais globais abaixo desta linha ──


// ── Gestão de Alunos (Dashboard Coordenação) ─────────────────

let todosAlunos = [];
let turmasParaAlunos = [];
let modalNovoAlunoInstance = null;

// Carrega turmas no select da aba e no modal
async function carregarTurmasAlunos() {
  const { data, error } = await supabaseClient
    .from("turmas")
    .select("id, nome, ano")
    .order("nome", { ascending: true });

  if (error) {
    console.error(error);
    return;
  }

  turmasParaAlunos = data || [];
}

// ── Modal: Conselho Individual com botão de Notas integrado ──

window.abrirModalConselho = async function(index) {
  const linhas = document.querySelectorAll("#corpoTabela tr");
  if (index < 0 || index >= linhas.length) return;

  alunoAtualIndex = index;
  const linha = linhas[index];

  // Dados ocultos
  const alunoId = linha.getAttribute("data-aluno-id");
  const alunoNome = linha.getAttribute("data-aluno-nome");
  const dificuldade = linha.querySelector(".dificuldadeChk")?.checked || false;
  const dificMat = linha.querySelector(".dificuldadeTxt")?.value || "";

  const fazSalaVal = linha.querySelector(".selFazSala")?.value || "true";
  const salaMat = linha.querySelector(".salaMateriasTxt")?.value || "";

  const fazPlatVal = linha.querySelector(".selFazPlataforma")?.value || "true";
  const platMat = linha.querySelector(".plataformaMateriasTxt")?.value || "";

  const indisciplina = linha.querySelector(".indisciplinaChk")?.checked || false;
  const indTxt = linha.querySelector(".indisciplinaTxt")?.value || "";

  const proficienciaVal = linha.querySelector(".proficiencia")?.value || "";

  // Popular campos do modal
  document.getElementById("modalAlunoNome").innerText = alunoNome;

  selecoesModal.dificuldade = textoParaLista(dificMat);
  selecoesModal.sala = textoParaLista(salaMat);
  selecoesModal.plataforma = textoParaLista(platMat);

  document.querySelector(`input[name="modalDificuldade"][value="${dificuldade}"]`).checked = true;
  document.querySelector(`input[name="modalFazSala"][value="${fazSalaVal}"]`).checked = true;
  document.querySelector(`input[name="modalFazPlataforma"][value="${fazPlatVal}"]`).checked = true;
  document.querySelector(`input[name="modalIndisciplina"][value="${indisciplina}"]`).checked = true;

  document.getElementById("modalIndisciplinaTxt").value = indTxt;
  document.getElementById("modalProficiencia").value = proficienciaVal;

  alternarAreaPorRadio("modalDificuldade", "modalDificuldadeArea", "true");
  alternarAreaPorRadio("modalFazSala", "modalSalaArea", "false");
  alternarAreaPorRadio("modalFazPlataforma", "modalPlataformaArea", "false");
  alternarAreaPorRadio("modalIndisciplina", "modalIndisciplinaArea", "true");

  atualizarResumoSelecao("dificuldade");
  atualizarResumoSelecao("sala");
  atualizarResumoSelecao("plataforma");

  // Botões de navegação
  const btnAnterior = document.getElementById("btnAnterior");
  const btnProximo = document.getElementById("btnProximo");
  btnAnterior.disabled = (index === 0);
  btnProximo.disabled = (index === linhas.length - 1);

  // Atualizar atributo data-aluno no botão de notas do modal
  const btnNotasModal = document.getElementById("btnNotasModal");
  if (btnNotasModal) {
    btnNotasModal.setAttribute("data-aluno", alunoId);
  }

  // Buscar proficiência do bimestre anterior
  const textoProfAnterior = document.getElementById("textoProfAnterior");
  if (textoProfAnterior) {
    textoProfAnterior.textContent = "Carregando...";
  }

  try {
    if (conselhoAtual?.bimestre > 1) {
      const bimestreAnterior = conselhoAtual.bimestre - 1;
      const { data: conselhoAnt } = await supabaseClient
        .from("conselhos")
        .select("id")
        .eq("turma_id", conselhoAtual.turma_id)
        .eq("bimestre", bimestreAnterior)
        .maybeSingle();

      if (conselhoAnt) {
        const { data: alunoAnt } = await supabaseClient
          .from("conselho_alunos")
          .select("nivel_proficiencia")
          .eq("conselho_id", conselhoAnt.id)
          .eq("aluno_id", alunoId)
          .maybeSingle();

        if (alunoAnt?.nivel_proficiencia) {
          if (textoProfAnterior) {
            textoProfAnterior.textContent = `Proficiência no conselho anterior: ${alunoAnt.nivel_proficiencia}`;
          }
        } else {
          if (textoProfAnterior) {
            textoProfAnterior.textContent = "Proficiência no conselho anterior: sem registro";
          }
        }
      } else {
        if (textoProfAnterior) {
          textoProfAnterior.textContent = "Proficiência no conselho anterior: conselho não encontrado";
        }
      }
    } else {
      if (textoProfAnterior) {
        textoProfAnterior.textContent = "Proficiência no conselho anterior: não aplicável (1º bimestre)";
      }
    }
  } catch (err) {
    console.error("Erro ao carregar proficiência anterior:", err);
    if (textoProfAnterior) {
      textoProfAnterior.textContent = "Proficiência no conselho anterior: não foi possível carregar";
    }
  }

  bootstrap.Modal.getOrCreateInstance(
    document.getElementById("modalConselhoAluno")
  ).show();
};

async function salvarAlunoModalAtual() {
  const linhas = document.querySelectorAll("#corpoTabela tr");
  const linha = linhas[alunoAtualIndex];
  if (!linha) return false;

  const dificuldade = document.querySelector('input[name="modalDificuldade"]:checked')?.value === "true";
  const fazSala = document.querySelector('input[name="modalFazSala"]:checked')?.value || "true";
  const fazPlataforma = document.querySelector('input[name="modalFazPlataforma"]:checked')?.value || "true";
  const indisciplina = document.querySelector('input[name="modalIndisciplina"]:checked')?.value === "true";

  const textoIndisciplina = document.getElementById("modalIndisciplinaTxt").value.trim();
  const proficiencia = document.getElementById("modalProficiencia").value || "";

  if (dificuldade && selecoesModal.dificuldade.length === 0) {
    alert("Se marcar 'Tem dificuldade = Sim', selecione pelo menos uma disciplina.");
    return false;
  }

  if (fazSala === "false" && selecoesModal.sala.length === 0) {
    alert("Se marcar 'Faz atividade em sala = Não', selecione pelo menos uma disciplina.");
    return false;
  }

  if (fazPlataforma === "false" && selecoesModal.plataforma.length === 0) {
    alert("Se marcar 'Faz plataformas = Não', selecione pelo menos uma disciplina.");
    return false;
  }

  if (indisciplina && !textoIndisciplina) {
    alert("Se marcar 'Indisciplina = Sim', descreva a indisciplina.");
    return false;
  }

  if (!proficiencia) {
    alert("Selecione o nível de proficiência do aluno.");
    return false;
  }
  const alunoId = linha.getAttribute("data-aluno-id");

  if (proficiencia && conselhoAtual?.bimestre > 1) {
    try {
      const validacao = await validarProficienciaBimestreAnterior(
        alunoId,
        conselhoAtual,
        proficiencia
      );
  
      if (!validacao.permitido) {
        alert(
          `O aluno não pode regredir na proficiência.\n\n` +
          `Bimestre anterior: ${validacao.nivelAnterior}\n` +
          `Selecionado agora: ${proficiencia}`
        );
        return false;
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao validar a proficiência do bimestre anterior.");
      return false;
    }
  }

  function atualizarResumoVisualLinha(linha) {
  if (!linha) return;

  const difTem = linha.querySelector(".dificuldadeChk")?.checked || false;
  const difMat = linha.querySelector(".dificuldadeTxt")?.value?.trim() || "";

  const fazSala = linha.querySelector(".selFazSala")?.value === "true";
  const salaMat = linha.querySelector(".salaMateriasTxt")?.value?.trim() || "";

  const fazPlat = linha.querySelector(".selFazPlataforma")?.value === "true";
  const platMat = linha.querySelector(".plataformaMateriasTxt")?.value?.trim() || "";

  const indTem = linha.querySelector(".indisciplinaChk")?.checked || false;
  const proficiencia = linha.querySelector(".proficiencia")?.value || "";
  const concluido = linha.querySelector(".concluidoSwitch")?.checked || false;

  const badges = [];

  if (difTem) {
    const qtdDif = difMat
      ? difMat.split(",").map(t => t.trim()).filter(Boolean).length
      : 0;
    badges.push(
      `<span class="badge text-bg-warning text-dark me-1 mb-1">Dificuldade${qtdDif > 0 ? ` (${qtdDif})` : ""}</span>`
    );
  }

  if (!fazSala) {
    const qtdSala = salaMat
      ? salaMat.split(",").map(t => t.trim()).filter(Boolean).length
      : 0;
    badges.push(
      `<span class="badge text-bg-secondary me-1 mb-1">Sem atividade${qtdSala > 0 ? ` (${qtdSala})` : ""}</span>`
    );
  }

  if (!fazPlat) {
    const qtdPlat = platMat
      ? platMat.split(",").map(t => t.trim()).filter(Boolean).length
      : 0;
    badges.push(
      `<span class="badge text-bg-info me-1 mb-1">Sem plataforma${qtdPlat > 0 ? ` (${qtdPlat})` : ""}</span>`
    );
  }

  if (indTem) {
    badges.push(
      `<span class="badge text-bg-danger me-1 mb-1">Indisciplina</span>`
    );
  }

  const resumoHtml = badges.length
    ? badges.join("")
    : `<span class="text-muted small">Sem apontamentos</span>`;

  const proficienciaHtml = proficiencia
    ? `<span>${proficiencia}</span>`
    : `<span class="text-muted">-</span>`;

  const statusHtml = `
    <span class="badge status-badge ${concluido ? "text-bg-success" : "text-bg-secondary"}">
      ${concluido ? "Concluído" : "Pendente"}
    </span>
  `;

  const tdResumo = linha.querySelector(".cell-resumo");
  const tdProficiencia = linha.querySelector(".cell-proficiencia");
  const tdStatus = linha.querySelector(".cell-status");

  if (tdResumo) tdResumo.innerHTML = resumoHtml;
  if (tdProficiencia) tdProficiencia.innerHTML = proficienciaHtml;
  if (tdStatus) tdStatus.innerHTML = statusHtml;
}

  linha.querySelector(".dificuldadeChk").checked = dificuldade;
  linha.querySelector(".dificuldadeTxt").value = dificuldade ? selecoesModal.dificuldade.join(", ") : "";
  
  linha.querySelector(".selFazSala").value = fazSala;
  linha.querySelector(".salaMateriasTxt").value = fazSala === "false" ? selecoesModal.sala.join(", ") : "";
  
  linha.querySelector(".selFazPlataforma").value = fazPlataforma;
  linha.querySelector(".plataformaMateriasTxt").value = fazPlataforma === "false" ? selecoesModal.plataforma.join(", ") : "";
  
  linha.querySelector(".indisciplinaChk").checked = indisciplina;
  linha.querySelector(".indisciplinaTxt").value = indisciplina ? textoIndisciplina : "";
  
  linha.querySelector(".proficiencia").value =
    document.getElementById("modalProficiencia").value;
  
  // concluído automático
  linha.querySelector(".concluidoSwitch").checked = true;
  
  atualizarStatusLinha(linha);
  atualizarContadoresTabela();
  atualizarResumoVisualLinha(linha);
  
  return true;
}

document.addEventListener("modalsLoaded", () => {
  document.querySelectorAll('input[name="modalDificuldade"]').forEach(el => {
    el.addEventListener("change", () => alternarAreaPorRadio("modalDificuldade", "modalDificuldadeArea", "true"));
  });

  document.querySelectorAll('input[name="modalFazSala"]').forEach(el => {
    el.addEventListener("change", () => alternarAreaPorRadio("modalFazSala", "modalSalaArea", "false"));
  });

  document.querySelectorAll('input[name="modalFazPlataforma"]').forEach(el => {
    el.addEventListener("change", () => alternarAreaPorRadio("modalFazPlataforma", "modalPlataformaArea", "false"));
  });

  document.querySelectorAll('input[name="modalIndisciplina"]').forEach(el => {
    el.addEventListener("change", () => alternarAreaPorRadio("modalIndisciplina", "modalIndisciplinaArea", "true"));
  });

  document.getElementById("btnSelecionarDificuldade")?.addEventListener("click", () => {
    abrirModalSelecaoDisciplinas("dificuldade", "Selecionar disciplinas com dificuldade");
  });

  document.getElementById("btnSelecionarSala")?.addEventListener("click", () => {
    abrirModalSelecaoDisciplinas("sala", "Selecionar disciplinas sem atividade em sala");
  });

  document.getElementById("btnSelecionarPlataforma")?.addEventListener("click", () => {
    abrirModalSelecaoDisciplinas("plataforma", "Selecionar disciplinas sem plataformas");
  });

  document.getElementById("btnConfirmarDisciplinas")?.addEventListener("click", () => {
    if (!contextoSelecaoAtual) return;

    const marcadas = Array.from(
      document.querySelectorAll(".chk-disciplina-selecao:checked")
    ).map(el => el.value);

    selecoesModal[contextoSelecaoAtual] = marcadas;
    atualizarResumoSelecao(contextoSelecaoAtual);

    bootstrap.Modal.getInstance(document.getElementById("modalSelecionarDisciplinas"))?.hide();
  });

  document.getElementById("btnSalvarAluno")?.addEventListener("click", async () => {
  const salvou = await salvarAlunoModalAtual();
  if (!salvou) return;

  bootstrap.Modal.getInstance(document.getElementById("modalConselhoAluno"))?.hide();
});

document.getElementById("btnAnterior")?.addEventListener("click", async () => {
  const salvou = await salvarAlunoModalAtual();
  if (!salvou) return;

  if (alunoAtualIndex > 0) abrirModalConselho(alunoAtualIndex - 1);
});

document.getElementById("btnProximo")?.addEventListener("click", async () => {
  const salvou = await salvarAlunoModalAtual();
  if (!salvou) return;

  const linhas = document.querySelectorAll("#corpoTabela tr");
  if (alunoAtualIndex < linhas.length - 1) abrirModalConselho(alunoAtualIndex + 1);
});

  // ── NOVO: Botão de Notas dentro do modal do conselho ──
  document.getElementById("btnNotasModal")?.addEventListener("click", (e) => {
    const alunoId = e.target.closest("#btnNotasModal").getAttribute("data-aluno");
    if (alunoId && typeof abrirModalNotas === 'function') {
      abrirModalNotas(alunoId);
    }
  });
});
