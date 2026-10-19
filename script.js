// Base de dados de produtos salva no navegador
let produtos = JSON.parse(localStorage.getItem('produtos_pdv')) || [
  { codigo: '123', nome: 'Produto Exemplo', preco: 10.50, foto: 'https://via.placeholder.com/150?text=Exemplo' }
];

let carrinho = [];

// Elementos das Abas
const btnAbaCaixa = document.getElementById('btnAbaCaixa');
const btnAbaCadastro = document.getElementById('btnAbaCadastro');
const secaoCaixa = document.getElementById('secaoCaixa');
const secaoCadastro = document.getElementById('secaoCadastro');

// Elementos do Caixa
const codigoInput = document.getElementById('codigoBarrasInput');
const btnAdicionarManual = document.getElementById('btnAdicionarManual');
const destaqueImg = document.getElementById('destaqueImg');
const destaqueNome = document.getElementById('destaqueNome');
const destaquePreco = document.getElementById('destaquePreco');
const listaCarrinho = document.getElementById('listaCarrinho');
const valorTotalEl = document.getElementById('valorTotal');
const btnFinalizarVenda = document.getElementById('btnFinalizarVenda');

// Elementos do Cadastro
const formCadastro = document.getElementById('formCadastro');
const listaProdutosCadastrados = document.getElementById('listaProdutosCadastrados');
const totalCadastrados = document.getElementById('totalCadastrados');

// Troca de Abas
if (btnAbaCaixa && btnAbaCadastro) {
  btnAbaCaixa.addEventListener('click', () => {
    btnAbaCaixa.classList.add('active');
    btnAbaCadastro.classList.remove('active');
    secaoCaixa.classList.add('active');
    secaoCadastro.classList.remove('active');
    if (codigoInput) codigoInput.focus();
  });

  btnAbaCadastro.addEventListener('click', () => {
    btnAbaCadastro.classList.add('active');
    btnAbaCaixa.classList.remove('active');
    secaoCadastro.classList.add('active');
    secaoCaixa.classList.remove('active');
    atualizarListaCadastrados();
  });
}

// Salvar Produto
if (formCadastro) {
  formCadastro.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const codigo = document.getElementById('cadCodigo').value.trim();
    const nome = document.getElementById('cadNome').value.trim();
    const preco = parseFloat(document.getElementById('cadPreco').value);
    const foto = document.getElementById('cadFoto').value.trim() || 'https://via.placeholder.com/150?text=Sem+Foto';

    const index = produtos.findIndex(p => p.codigo === codigo);
    if (index !== -1) {
      produtos[index] = { codigo, nome, preco, foto };
      alert('Produto atualizado com sucesso!');
    } else {
      produtos.push({ codigo, nome, preco, foto });
      alert('Produto cadastrado com sucesso!');
    }

    localStorage.setItem('produtos_pdv', JSON.stringify(produtos));
    formCadastro.reset();
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
      <span><strong>${p.codigo}</strong> - ${p.nome}</span>
      <span>R$ ${p.preco.toFixed(2)}</span>
    `;
    listaProdutosCadastrados.appendChild(li);
  });
}

// Processar Leitura no Caixa
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
    alert('Produto não encontrado! Cadastre na aba "Cadastrar Produtos".');
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

function atualizarCarrinhoGUI() {
  if (!listaCarrinho) return;
  listaCarrinho.innerHTML = '';
  let total = 0;

  carrinho.forEach(item => {
    total += item.subtotal;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.nome}</td>
      <td>${item.qtd}x</td>
      <td>R$ ${item.preco.toFixed(2)}</td>
      <td>R$ ${item.subtotal.toFixed(2)}</td>
    `;
    listaCarrinho.appendChild(tr);
  });

  if (valorTotalEl) valorTotalEl.textContent = total.toFixed(2);
}

// Finalizar Venda
if (btnFinalizarVenda) {
  btnFinalizarVenda.addEventListener('click', () => {
    if (carrinho.length === 0) {
      alert('O carrinho está vazio!');
      return;
    }

    alert(`Venda finalizada com sucesso!\nTotal: R$ ${valorTotalEl.textContent}`);
    carrinho = [];
    atualizarCarrinhoGUI();
    
    if (destaqueImg) destaqueImg.src = 'https://via.placeholder.com/150?text=Sem+Foto';
    if (destaqueNome) destaqueNome.textContent = 'Aguardando produto...';
    if (destaquePreco) destaquePreco.textContent = '0,00';
    if (codigoInput) codigoInput.focus();
  });
}
