// Banco de dados local
let produtos = JSON.parse(localStorage.getItem('produtos_pdv')) || [
  { codigo: '123', nome: 'Produto Exemplo', preco: 10.50, foto: 'https://via.placeholder.com/150?text=Exemplo' }
];

let carrinho = [];
let codeReader = null;
let fotoBase64Temp = '';

// Elementos Globais
const btnMenu = document.getElementById('btnMenu');
const dropdownMenu = document.getElementById('dropdownMenu');
const menuItems = document.querySelectorAll('.menu-item');
const secoes = document.querySelectorAll('.aba-conteudo');

// Seção Início e Vendas
const btnIniciarVenda = document.getElementById('btnIniciarVenda');
const btnCancelarVenda = document.getElementById('btnCancelarVenda');
const codigoInput = document.getElementById('codigoBarrasInput');
const btnAdicionarManual = document.getElementById('btnAdicionarManual');

// Câmera e Destaque
const destaqueImg = document.getElementById('destaqueImg');
const destaqueNome = document.getElementById('destaqueNome');
const destaquePreco = document.getElementById('destaquePreco');

// Resumo e Lista
const valorTotalEl = document.getElementById('valorTotal');
const qtdItensTotal = document.getElementById('qtdItensTotal');
const btnVerItens = document.getElementById('btnVerItens');
const painelCarrinho = document.getElementById('painelCarrinho');
const listaCarrinho = document.getElementById('listaCarrinho');
const btnFinalizarVenda = document.getElementById('btnFinalizarVenda');

// Cadastro
const formCadastro = document.getElementById('formCadastro');
const cadFotoArquivo = document.getElementById('cadFotoArquivo');
const previewFotoContainer = document.getElementById('previewFotoContainer');
const previewFoto = document.getElementById('previewFoto');
const listaProdutosCadastrados = document.getElementById('listaProdutosCadastrados');
const totalCadastrados = document.getElementById('totalCadastrados');

// Controle Menu Dropdown
if (btnMenu && dropdownMenu) {
  btnMenu.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdownMenu.classList.toggle('show');
  });

  document.addEventListener('click', () => dropdownMenu.classList.remove('show'));
}

// Navegação entre Telas
menuItems.forEach(item => {
  item.addEventListener('click', () => {
    const targetId = item.getAttribute('data-target');
    navegarPara(targetId);
    dropdownMenu.classList.remove('show');
  });
});

function navegarPara(secaoId) {
  secoes.forEach(s => s.classList.remove('active'));
  const target = document.getElementById(secaoId);
  if (target) target.classList.add('active');

  if (secaoId !== 'secaoCaixa') {
    pararCamera();
  }

  if (secaoId === 'secaoCadastro') {
    atualizarListaCadastrados();
  }
}

// Iniciar Venda e Ativar Câmera Automática
if (btnIniciarVenda) {
  btnIniciarVenda.addEventListener('click', () => {
    navegarPara('secaoCaixa');
    iniciarCamera();
  });
}

if (btnCancelarVenda) {
  btnCancelarVenda.addEventListener('click', () => {
    if (carrinho.length > 0) {
      if (!confirm('Deseja cancelar a venda atual? Os itens serão descartados.')) return;
    }
    carrinho = [];
    atualizarCarrinhoGUI();
    navegarPara('secaoInicio');
  });
}

// Função de Inicialização da Câmera
function iniciarCamera() {
  codeReader = new ZXing.BrowserMultiFormatReader();
  codeReader.decodeFromVideoDevice(null, 'videoCamera', (result, err) => {
    if (result) {
      adicionarAoCarrinho(result.text);
    }
  }).catch(err => {
    console.error('Erro na câmera:', err);
  });
}

function pararCamera() {
  if (codeReader) {
    codeReader.reset();
    codeReader = null;
  }
}

// Inserção Manual de Código
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

// Lógica de Adicionar Produto ao Carrinho
function adicionarAoCarrinho(codigo) {
  if (!codigo) return;

  const produto = produtos.find(p => p.codigo === codigo);

  if (!produto) {
    alert('Produto não encontrado!');
    return;
  }

  if (destaqueImg) destaqueImg.src = produto.foto;
  if (destaqueNome) destaqueNome.textContent = produto.nome;
  if (destaquePreco) destaquePreco.textContent = produto.preco.toFixed(2);

  const itemExistente = carrinho.find(item => item.codigo === codigo);
  if (itemExistente) {
    itemExistente.qtd += 1;
    itemExistente.subtotal = itemExistente.qtd * itemExistente.preco;
  } else {
    carrinho.push({
      codigo: produto.codigo,
      nome: produto.nome,
      preco: produto.preco,
      qtd: 1,
      subtotal: produto.preco
    });
  }

  atualizarCarrinhoGUI();
}

// Incremento e Remoção de Itens da Lista
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

// Atualizar Interface do Carrinho
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
      <td>
        <button class="btn-acao-tabela btn-add" onclick="alterarQuantidade('${item.codigo}', 1)">+</button>
        <button class="btn-acao-tabela btn-del" onclick="removerItem('${item.codigo}')">🗑️</button>
      </td>
    `;
    listaCarrinho.appendChild(tr);
  });

  if (valorTotalEl) valorTotalEl.textContent = total.toFixed(2);
  if (qtdItensTotal) qtdItensTotal.textContent = totalItens;
}

// Botão para Alternar Exibição da Lista
if (btnVerItens && painelCarrinho) {
  btnVerItens.addEventListener('click', () => {
    const estaVisivel = painelCarrinho.style.display === 'block';
    painelCarrinho.style.display = estaVisivel ? 'none' : 'block';
  });
}

// Finalizar Venda e Cupom
if (btnFinalizarVenda) {
  btnFinalizarVenda.addEventListener('click', () => {
    if (carrinho.length === 0) {
      alert('O carrinho está vazio!');
      return;
    }

    const totalFormatado = valorTotalEl.textContent;
    let mensagemCupom = `*--- CUPOM DE COMPRA ---*\n`;
    carrinho.forEach(i => {
      mensagemCupom += `${i.qtd}x ${i.nome} - R$ ${i.subtotal.toFixed(2)}\n`;
    });
    mensagemCupom += `*TOTAL: R$ ${totalFormatado}*\nObrigado pela preferência!`;

    const enviarCupom = confirm(`Venda de R$ ${totalFormatado} realizada!\n\nDeseja enviar o cupom fiscal para o cliente via WhatsApp?`);

    if (enviarCupom) {
      const urlWhatsapp = `https://api.whatsapp.com/send?text=${encodeURIComponent(mensagemCupom)}`;
      window.open(urlWhatsapp, '_blank');
    }

    carrinho = [];
    atualizarCarrinhoGUI();
    if (painelCarrinho) painelCarrinho.style.display = 'none';

    if (destaqueImg) destaqueImg.src = 'https://via.placeholder.com/150?text=Sem+Foto';
    if (destaqueNome) destaqueNome.textContent = 'Aguardando leitura...';
    if (destaquePreco) destaquePreco.textContent = '0,00';

    navegarPara('secaoInicio');
  });
}

// Upload de Foto da Galeria (Base64)
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

// Cadastro de Produto
if (formCadastro) {
  formCadastro.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const codigo = document.getElementById('cadCodigo').value.trim();
    const nome = document.getElementById('cadNome').value.trim();
    const preco = parseFloat(document.getElementById('cadPreco').value);
    const foto = fotoBase64Temp || 'https://via.placeholder.com/150?text=Sem+Foto';

    const index = produtos.findIndex(p => p.codigo === codigo);
    if (index !== -1) {
      produtos[index] = { codigo, nome, preco, foto };
      alert('Produto atualizado!');
    } else {
      produtos.push({ codigo, nome, preco, foto });
      alert('Produto cadastrado com sucesso!');
    }

    localStorage.setItem('produtos_pdv', JSON.stringify(produtos));
    formCadastro.reset();
    fotoBase64Temp = '';
    if (previewFotoContainer) previewFotoContainer.style.display = 'none';
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
        <img src="${p.foto}" alt="Foto">
        <span><strong>${p.codigo}</strong> - ${p.nome}</span>
      </div>
      <span>R$ ${p.preco.toFixed(2)}</span>
    `;
    listaProdutosCadastrados.appendChild(li);
  });
}
