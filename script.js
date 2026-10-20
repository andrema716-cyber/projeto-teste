let produtos = JSON.parse(localStorage.getItem('produtos_pdv')) || [
  { codigo: '123', nome: 'Produto Exemplo', custo: 5.00, preco: 10.50, foto: 'https://via.placeholder.com/150?text=Exemplo' }
];

let clientes = JSON.parse(localStorage.getItem('clientes_pdv')) || [];
let historicoVendas = JSON.parse(localStorage.getItem('historico_pdv')) || [];
let chavePixConfig = localStorage.getItem('chave_pix_pdv') || 'sua-chave-pix';

let carrinho = [];
let codeReader = null;
let fotoBase64Temp = '';
let formaPagamentoSelecionada = 'dinheiro';
let qtdMultiplicador = 1;
let periodoFiltroAtual = 'hoje';
let clienteSelecionadoBaixaIdx = null;

// Som de Bip
function tocarSomBip() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1800, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.08);
  } catch (e) {
    console.error(e);
  }
}

// Elementos
const btnMenu = document.getElementById('btnMenu');
const dropdownMenu = document.getElementById('dropdownMenu');
const menuItems = document.querySelectorAll('.menu-item');
const secoes = document.querySelectorAll('.aba-conteudo');

const btnIniciarVenda = document.getElementById('btnIniciarVenda');
const btnCancelarVenda = document.getElementById('btnCancelarVenda');
const codigoInput = document.getElementById('codigoBarrasInput');
const btnAdicionarManual = document.getElementById('btnAdicionarManual');
const btnsQtd = document.querySelectorAll('.btn-qtd');

const destaqueImg = document.getElementById('destaqueImg');
const destaqueNome = document.getElementById('destaqueNome');
const destaquePreco = document.getElementById('destaquePreco');

const valorTotalEl = document.getElementById('valorTotal');
const qtdItensTotal = document.getElementById('qtdItensTotal');
const btnVerItens = document.getElementById('btnVerItens');
const painelCarrinho = document.getElementById('painelCarrinho');
const listaCarrinho = document.getElementById('listaCarrinho');

const modalPagamento = document.getElementById('modalPagamento');
const btnAbrirPagamento = document.getElementById('btnAbrirPagamento');
const btnConfirmarPagamento = document.getElementById('btnConfirmarPagamento');
const btnCancelarPagamento = document.getElementById('btnCancelarPagamento');
const modalValorTotal = document.getElementById('modalValorTotal');
const btnsPagamento = document.querySelectorAll('.btn-pagamento');
const boxPix = document.getElementById('boxPix');
const boxPrazo = document.getElementById('boxPrazo');
const selectClientePrazo = document.getElementById('selectClientePrazo');
const infoVencimentoPrazo = document.getElementById('infoVencimentoPrazo');

const modalBaixaFiado = document.getElementById('modalBaixaFiado');
const nomeClienteBaixa = document.getElementById('nomeClienteBaixa');
const dividaAtualCliente = document.getElementById('dividaAtualCliente');
const valorBaixaInput = document.getElementById('valorBaixaInput');
const btnConfirmarBaixa = document.getElementById('btnConfirmarBaixa');
const btnCancelarBaixa = document.getElementById('btnCancelarBaixa');

const formCadastro = document.getElementById('formCadastro');
const cadFotoArquivo = document.getElementById('cadFotoArquivo');
const previewFotoContainer = document.getElementById('previewFotoContainer');
const previewFoto = document.getElementById('previewFoto');
const listaProdutosCadastrados = document.getElementById('listaProdutosCadastrados');
const totalCadastrados = document.getElementById('totalCadastrados');

const formCliente = document.getElementById('formCliente');
const listaClientesCadastrados = document.getElementById('listaClientesCadastrados');

const relFaturamento = document.getElementById('relFaturamento');
const relLucro = document.getElementById('relLucro');
const listaHistoricoVendas = document.getElementById('listaHistoricoVendas');
const btnsFiltro = document.querySelectorAll('.btn-filtro');

const cfgChavePix = document.getElementById('cfgChavePix');
const btnSalvarConfig = document.getElementById('btnSalvarConfig');

// Menu
if (btnMenu && dropdownMenu) {
  btnMenu.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdownMenu.classList.toggle('show');
  });
  document.addEventListener('click', () => dropdownMenu.classList.remove('show'));
}

menuItems.forEach(item => {
  item.addEventListener('click', () => {
    navegarPara(item.getAttribute('data-target'));
    dropdownMenu.classList.remove('show');
  });
});

function navegarPara(secaoId) {
  secoes.forEach(s => s.classList.remove('active'));
  const target = document.getElementById(secaoId);
  if (target) target.classList.add('active');

  if (secaoId !== 'secaoCaixa') pararCamera();
  if (secaoId === 'secaoCadastro') atualizarListaCadastrados();
  if (secaoId === 'secaoClientes') atualizarListaClientes();
  if (secaoId === 'secaoHistorico') atualizarHistoricoERelatorios();
  if (secaoId === 'secaoConfig' && cfgChavePix) cfgChavePix.value = chavePixConfig;
}

// Multiplicador de Quantidade Antes de Bipar
btnsQtd.forEach(b => {
  b.addEventListener('click', () => {
    btnsQtd.forEach(btn => btn.classList.remove('active'));
    b.classList.add('active');
    qtdMultiplicador = parseInt(b.getAttribute('data-qtd'));
  });
});

// Vendas
if (btnIniciarVenda) {
  btnIniciarVenda.addEventListener('click', () => {
    navegarPara('secaoCaixa');
    iniciarCamera();
  });
}

if (btnCancelarVenda) {
  btnCancelarVenda.addEventListener('click', () => {
    if (carrinho.length > 0 && !confirm('Deseja cancelar a venda atual?')) return;
    carrinho = [];
    atualizarCarrinhoGUI();
    navegarPara('secaoInicio');
  });
}

function iniciarCamera() {
  codeReader = new ZXing.BrowserMultiFormatReader();
  codeReader.decodeFromVideoDevice(null, 'videoCamera', (result) => {
    if (result) adicionarAoCarrinho(result.text);
  }).catch(err => console.error(err));
}

function pararCamera() {
  if (codeReader) {
    codeReader.reset();
    codeReader = null;
  }
}

if (codigoInput) {
  codigoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      adicionarAoCarrinho(codigoInput.value.trim());
      codigoInput.value = '';
    }
  });
}

if (btnAdicionarManual) {
  btnAdicionarManual.addEventListener('click', () => {
    adicionarAoCarrinho(codigoInput.value.trim());
    codigoInput.value = '';
  });
}

function adicionarAoCarrinho(codigo) {
  if (!codigo) return;
  const produto = produtos.find(p => p.codigo === codigo);
  if (!produto) {
    alert('Produto não encontrado!');
    return;
  }

  tocarSomBip();
  if (destaqueImg) destaqueImg.src = produto.foto;
  if (destaqueNome) destaqueNome.textContent = produto.nome;
  if (destaquePreco) destaquePreco.textContent = produto.preco.toFixed(2);

  const qtdAdicionar = qtdMultiplicador;
  // Reseta para 1 após bipar
  qtdMultiplicador = 1;
  btnsQtd.forEach(b => b.classList.toggle('active', b.getAttribute('data-qtd') === '1'));

  const itemExistente = carrinho.find(item => item.codigo === codigo);
  if (itemExistente) {
    itemExistente.qtd += qtdAdicionar;
    itemExistente.subtotal = itemExistente.qtd * itemExistente.preco;
  } else {
    carrinho.push({
      codigo: produto.codigo,
      nome: produto.nome,
      custo: produto.custo || (produto.preco * 0.6),
      preco: produto.preco,
      qtd: qtdAdicionar,
      subtotal: qtdAdicionar * produto.preco
    });
  }

  atualizarCarrinhoGUI();
}

function alterarQuantidade(codigo, delta) {
  const item = carrinho.find(i => i.codigo === codigo);
  if (!item) return;

  item.qtd += delta;
  if (item.qtd <= 0) {
    carrinho = carrinho.filter(i => i.codigo !== codigo);
  } else {
    item.subtotal = item.qtd * item.preco;
  }
  atualizarCarrinhoGUI();
}

function removerItem(codigo) {
  carrinho = carrinho.filter(i => i.codigo !== codigo);
  atualizarCarrinhoGUI();
}

function atualizarCarrinhoGUI() {
  if (!listaCarrinho) return;
  listaCarrinho.innerHTML = '';
  let total = 0;
  let totalItens = 0;

  carrinho.forEach(item => {
    total += item.subtotal;
    totalItens += item.qtd;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.nome}</td>
      <td>${item.qtd}x</td>
      <td>R$ ${item.subtotal.toFixed(2)}</td>
      <td style="text-align:center;">
        <div class="acoes-item-box">
          <button class="btn-acao-tabela btn-add" onclick="alterarQuantidade('${item.codigo}', 1)">+</button>
          <button class="btn-acao-tabela btn-del" onclick="removerItem('${item.codigo}')">🗑️</button>
        </div>
      </td>
    `;
    listaCarrinho.appendChild(tr);
  });

  if (valorTotalEl) valorTotalEl.textContent = total.toFixed(2);
  if (qtdItensTotal) qtdItensTotal.textContent = totalItens;
}

if (btnVerItens && painelCarrinho) {
  btnVerItens.addEventListener('click', () => {
    painelCarrinho.style.display = painelCarrinho.style.display === 'block' ? 'none' : 'block';
  });
}

// Pagamento
if (btnAbrirPagamento) {
  btnAbrirPagamento.addEventListener('click', () => {
    if (carrinho.length === 0) {
      alert('O carrinho está vazio!');
      return;
    }
    modalValorTotal.textContent = valorTotalEl.textContent;
    modalPagamento.style.display = 'flex';
    selecionarFormaPagamento('dinheiro');
  });
}

if (btnCancelarPagamento) {
  btnCancelarPagamento.addEventListener('click', () => modalPagamento.style.display = 'none');
}

btnsPagamento.forEach(btn => {
  btn.addEventListener('click', () => {
    btnsPagamento.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selecionarFormaPagamento(btn.getAttribute('data-forma'));
  });
});

function selecionarFormaPagamento(forma) {
  formaPagamentoSelecionada = forma;
  boxPix.style.display = forma === 'pix' ? 'block' : 'none';
  boxPrazo.style.display = forma === 'prazo' ? 'block' : 'none';

  if (forma === 'pix') {
    const qrcodeDiv = document.getElementById('qrcode');
    qrcodeDiv.innerHTML = '';
    new QRCode(qrcodeDiv, { text: `PIX Valor: R$ ${valorTotalEl.textContent} Chave: ${chavePixConfig}`, width: 128, height: 128 });
  }

  if (forma === 'prazo') {
    selectClientePrazo.innerHTML = '';
    clientes.forEach((cli, idx) => {
      const opt = document.createElement('option');
      opt.value = idx;
      opt.textContent = `${cli.nome} (Venc: dia ${cli.diaVencimento})`;
      selectClientePrazo.appendChild(opt);
    });
    atualizarInfoPrazo();
    selectClientePrazo.onchange = atualizarInfoPrazo;
  }
}

function calcularDataVencimento(diaVenc) {
  const hoje = new Date();
  let mesVenc = hoje.getMonth() + 1;
  let anoVenc = hoje.getFullYear();
  if (mesVenc > 11) { mesVenc = 0; anoVenc += 1; }
  return `${diaVenc.toString().padStart(2, '0')}/${(mesVenc + 1).toString().padStart(2, '0')}/${anoVenc}`;
}

function atualizarInfoPrazo() {
  const cliIdx = selectClientePrazo.value;
  if (clientes[cliIdx]) {
    infoVencimentoPrazo.textContent = `Vencimento do Fiado: ${calcularDataVencimento(clientes[cliIdx].diaVencimento)}`;
  }
}

if (btnConfirmarPagamento) {
  btnConfirmarPagamento.addEventListener('click', () => {
    const totalVenda = parseFloat(valorTotalEl.textContent);
    let custoTotal = 0;
    carrinho.forEach(i => custoTotal += (i.custo * i.qtd));

    let clienteNome = 'Balcão';
    let dataVencFiado = null;

    if (formaPagamentoSelecionada === 'prazo') {
      const cliIdx = selectClientePrazo.value;
      if (!clientes[cliIdx]) { alert('Cadastre um cliente primeiro!'); return; }
      const cli = clientes[cliIdx];
      clienteNome = cli.nome;
      dataVencFiado = calcularDataVencimento(cli.diaVencimento);

      cli.saldoDevedor = (cli.saldoDevedor || 0) + totalVenda;
      cli.historico = cli.historico || [];
      cli.historico.push({ data: new Date().toISOString(), tipo: 'Compra Fiado', valor: totalVenda });
      localStorage.setItem('clientes_pdv', JSON.stringify(clientes));
    }

    const venda = {
      dataISO: new Date().toISOString(),
      data: new Date().toLocaleDateString('pt-BR'),
      hora: new Date().toLocaleTimeString('pt-BR'),
      itens: carrinho,
      total: totalVenda,
      custo: custoTotal,
      lucro: totalVenda - custoTotal,
      formaPagamento: formaPagamentoSelecionada,
      cliente: clienteNome
    };

    historicoVendas.push(venda);
    localStorage.setItem('historico_pdv', JSON.stringify(historicoVendas));

    modalPagamento.style.display = 'none';
    carrinho = [];
    atualizarCarrinhoGUI();
    if (painelCarrinho) painelCarrinho.style.display = 'none';
    navegarPara('secaoInicio');
    alert('Venda finalizada com sucesso!');
  });
}

// Quitação de Débito (Baixa de Fiado)
function abrirModalBaixa(cliIdx) {
  clienteSelecionadoBaixaIdx = cliIdx;
  const cli = clientes[cliIdx];
  nomeClienteBaixa.textContent = cli.nome;
  dividaAtualCliente.textContent = (cli.saldoDevedor || 0).toFixed(2);
  valorBaixaInput.value = '';
  modalBaixaFiado.style.display = 'flex';
}

if (btnCancelarBaixa) {
  btnCancelarBaixa.addEventListener('click', () => modalBaixaFiado.style.display = 'none');
}

if (btnConfirmarBaixa) {
  btnConfirmarBaixa.addEventListener('click', () => {
    const valorBaixa = parseFloat(valorBaixaInput.value);
    if (isNaN(valorBaixa) || valorBaixa <= 0) {
      alert('Digite um valor válido!');
      return;
    }

    const cli = clientes[clienteSelecionadoBaixaIdx];
    if (valorBaixa > cli.saldoDevedor) {
      alert('O valor da baixa não pode ser maior que a dívida atual.');
      return;
    }

    cli.saldoDevedor -= valorBaixa;
    cli.historico = cli.historico || [];
    cli.historico.push({ data: new Date().toISOString(), tipo: 'Pagamento Débito', valor: -valorBaixa });
    localStorage.setItem('clientes_pdv', JSON.stringify(clientes));

    // Registrar entrada no histórico de faturamento/caixa
    const baixaHistorico = {
      dataISO: new Date().toISOString(),
      data: new Date().toLocaleDateString('pt-BR'),
      hora: new Date().toLocaleTimeString('pt-BR'),
      itens: [],
      total: valorBaixa,
      custo: 0,
      lucro: valorBaixa,
      formaPagamento: 'quitação fiado',
      cliente: cli.nome
    };
    historicoVendas.push(baixaHistorico);
    localStorage.setItem('historico_pdv', JSON.stringify(historicoVendas));

    modalBaixaFiado.style.display = 'none';
    alert('Baixa de fiado registrada com sucesso!');
    atualizarListaClientes();
  });
}

// Cadastro Foto
if (cadFotoArquivo) {
  cadFotoArquivo.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(evt) {
        fotoBase64Temp = evt.target.result;
        previewFoto.src = fotoBase64Temp;
        previewFotoContainer.style.display = 'block';
      };
      reader.readAsDataURL(file);
    }
  });
}

if (formCadastro) {
  formCadastro.addEventListener('submit', (e) => {
    e.preventDefault();
    const codigo = document.getElementById('cadCodigo').value.trim();
    const nome = document.getElementById('cadNome').value.trim();
    const custo = parseFloat(document.getElementById('cadCusto').value);
    const preco = parseFloat(document.getElementById('cadPreco').value);
    const foto = fotoBase64Temp || 'https://via.placeholder.com/150?text=Sem+Foto';

    const index = produtos.findIndex(p => p.codigo === codigo);
    if (index !== -1) {
      produtos[index] = { codigo, nome, custo, preco, foto };
    } else {
      produtos.push({ codigo, nome, custo, preco, foto });
    }

    localStorage.setItem('produtos_pdv', JSON.stringify(produtos));
    formCadastro.reset();
    fotoBase64Temp = '';
    if (previewFotoContainer) previewFotoContainer.style.display = 'none';
    alert('Produto salvo!');
    atualizarListaCadastrados();
  });
}

function atualizarListaCadastrados() {
  if (!listaProdutosCadastrados) return;
  listaProdutosCadastrados.innerHTML = '';
  if (totalCadastrados) totalCadastrados.textContent = produtos.length;

  produtos.forEach(p => {
    const li = document.createElement('li');
    li.innerHTML = `
      <div style="display:flex; align-items:center;">
        <img src="${p.foto}" style="width:40px; height:40px; object-fit:cover; border-radius:6px; margin-right:10px;">
        <span><strong>${p.codigo}</strong> - ${p.nome}</span>
      </div>
      <span>R$ ${p.preco.toFixed(2)}</span>
    `;
    listaProdutosCadastrados.appendChild(li);
  });
}

// Cliente
if (formCliente) {
  formCliente.addEventListener('submit', (e) => {
    e.preventDefault();
    const nome = document.getElementById('cliNome').value.trim();
    const telefone = document.getElementById('cliTelefone').value.trim();
    const diaVencimento = parseInt(document.getElementById('cliDiaVencimento').value);

    clientes.push({ nome, telefone, diaVencimento, saldoDevedor: 0, historico: [] });
    localStorage.setItem('clientes_pdv', JSON.stringify(clientes));
    formCliente.reset();
    alert('Cliente cadastrado!');
    atualizarListaClientes();
  });
}

function atualizarListaClientes() {
  if (!listaClientesCadastrados) return;
  listaClientesCadastrados.innerHTML = '';
  const diaAtual = new Date().getDate();

  clientes.forEach((cli, idx) => {
    const temDebito = (cli.saldoDevedor || 0) > 0;
    const atrasado = temDebito && (diaAtual > cli.diaVencimento);
    
    const li = document.createElement('li');
    li.innerHTML = `
      <div>
        <strong>${cli.nome}</strong> (Venc: dia ${cli.diaVencimento})
        <div style="font-size:0.8rem; color:#94a3b8;">Débito: R$ ${(cli.saldoDevedor || 0).toFixed(2)}</div>
      </div>
      <div style="display:flex; align-items:center; gap: 5px;">
        ${temDebito ? `<span class="status-debito ${atrasado ? 'atrasado' : 'emdia'}">${atrasado ? '⚠️ Atrasado' : '✅ Em dia'}</span>` : '<span class="status-debito emdia">Em dia</span>'}
        ${temDebito ? `<button class="btn-baixa" onclick="abrirModalBaixa(${idx})">Pagar</button>` : ''}
      </div>
    `;
    listaClientesCadastrados.appendChild(li);
  });
}

// Filtros do Histórico
btnsFiltro.forEach(b => {
  b.addEventListener('click', () => {
    btnsFiltro.forEach(btn => btn.classList.remove('active'));
    b.classList.add('active');
    periodoFiltroAtual = b.getAttribute('data-periodo');
    atualizarHistoricoERelatorios();
  });
});

function atualizarHistoricoERelatorios() {
  let fat = 0;
  let luc = 0;
  if (listaHistoricoVendas) listaHistoricoVendas.innerHTML = '';

  const hojeStr = new Date().toDateString();

  const vendasFiltradas = historicoVendas.filter(v => {
    const dataVenda = new Date(v.dataISO);
    if (periodoFiltroAtual === 'hoje') {
      return dataVenda.toDateString() === hojeStr;
    } else if (periodoFiltroAtual === 'semana') {
      const umDia = 24 * 60 * 60 * 1000;
      const diff = Math.abs(new Date() - dataVenda);
      return diff <= (7 * umDia);
    } else if (periodoFiltroAtual === 'mes') {
      const agora = new Date();
      return dataVenda.getMonth() === agora.getMonth() && dataVenda.getFullYear() === agora.getFullYear();
    }
    return true; // todos
  });

  vendasFiltradas.forEach(v => {
    fat += v.total;
    luc += v.lucro;

    if (listaHistoricoVendas) {
      const li = document.createElement('li');
      li.innerHTML = `
        <div>
          <strong>${v.data} ${v.hora}</strong> - ${v.cliente} (${v.formaPagamento.toUpperCase()})
          <div style="font-size:0.8rem; color:#38bdf8;">Lucro: R$ ${v.lucro.toFixed(2)}</div>
        </div>
        <strong style="color:#22c55e;">R$ ${v.total.toFixed(2)}</strong>
      `;
      listaHistoricoVendas.appendChild(li);
    }
  });

  if (relFaturamento) relFaturamento.textContent = fat.toFixed(2);
  if (relLucro) relLucro.textContent = luc.toFixed(2);
}

if (btnSalvarConfig) {
  btnSalvarConfig.addEventListener('click', () => {
    chavePixConfig = cfgChavePix.value.trim();
    localStorage.setItem('chave_pix_pdv', chavePixConfig);
    alert('Configurações salvas!');
  });
}
