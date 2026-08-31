/**
 * Materia-prima do gerador: nomes, pastas e arquivos possiveis.
 *
 * Nada aqui e uma maquina pronta - `generator.ts` e que monta os alvos sorteando
 * destas listas. Tudo ficticio de proposito: bancos, empresas e pessoas sao
 * inventados.
 */

export const NOMES = [
  'Renato Tavares', 'Maria Luiza Dias', 'Joana Medeiros', 'Cleber Antunes',
  'Sandra Bezerra', 'Wagner Prado', 'Débora Nunes', 'Ivan Rocheda',
  'Marcos Vinícius Alves', 'Rita Camargo', 'Adilson Pires', 'Célia Fontana',
  'Rogério Bastos', 'Neusa Portela', 'Fábio Werneck', 'Tânia Mesquita',
  'Otávio Serpa', 'Lúcia Baldin', 'Nelson Quirino', 'Elaine Castro',
]

export const EMPRESAS = [
  'Veiga Contabilidade', 'Helios Indústria', 'Transportes Aurora',
  'Metalúrgica Pilar', 'Clínica São Rafael', 'Gráfica Bandeirante',
  'Atacadão Ipê', 'Construtora Mirante', 'Frigorífico Boa Vista',
  'Laboratório Quíron', 'Têxtil Guararapes', 'Distribuidora Palmares',
]

export const APELIDOS_PC = [
  'CASA', 'NOTE', 'MICRO', 'PC', 'ESTACAO', 'DESKTOP',
]

/** Pastas de usuario possiveis, com os arquivos plausiveis de cada uma. */
export const PASTAS_PESSOAIS = [
  'Meus documentos', 'Área de trabalho', 'Minhas imagens', 'Minhas músicas',
  'Downloads', 'Pessoal', 'Faculdade', 'Trabalho', 'Receitas', 'Fotos antigas',
]

export const PASTAS_CORPORATIVAS = [
  'Financeiro', 'Clientes', 'Backup', 'Administração', 'Contratos',
  'Folha', 'Tesouraria', 'dumps', 'scripts', 'Relatórios', 'Auditoria',
]

/** Textos banais - o que enche um PC de verdade. */
export const TEXTOS: readonly (readonly [string, string])[] = [
  ['lista mercado.txt', 'arroz\nfeijão\ncafé\npilha AA\nsabão em pó\n'],
  ['leiame.txt', 'Comprei esse PC usado do vizinho.\nNão mexer na pasta de fotos.\n'],
  ['lembrete.txt', 'LIGAR PARA O CONTADOR\nrenovar o antivírus (venceu)\n'],
  ['telefones.txt', 'Zé encanador - 9988-1122\nDona Cida - 9977-3344\n'],
  ['senha do micro.txt', 'a senha nova é 1234 (não contar pra ninguém)\n'],
  ['bibliografia.txt', 'CASTELLS, M. A sociedade em rede.\n(faltam 8)\n'],
  ['TCC RASCUNHO.txt', 'Capítulo 3 - metodologia.\nFalta a bibliografia. ENTREGAR DIA 12!!\n'],
  ['diario.txt', 'Hoje o Rafael nem olhou pra mim no corredor.\n'],
  ['cron.log', 'backup diário 03:00 - ok\nbackup diário 03:00 - ok\nbackup diário 03:00 - FALHOU\n'],
  ['ramais.txt', 'Diretoria - 201\nRecepção - 202\nEstagiário - 203\n'],
  ['ata reunião.txt', 'Decidido: cortar 15% do orçamento de TI.\nNinguém vai notar.\n'],
  ['rotina.txt', 'Backup toda sexta às 18h. Fita no cofre.\n'],
]

/** Fotos: quase sempre sem valor, as vezes rendem uns trocados. */
export const IMAGENS: readonly (readonly [string, string])[] = [
  ['formatura.jpg', 'Uma pessoa de beca segurando um diploma.'],
  ['churrasco 2002.jpg', 'Seis pessoas em volta de uma churrasqueira.'],
  ['férias 2003.jpg', 'Uma praia desbotada, três pessoas rindo.'],
  ['IMG_0043.jpg', 'Uma foto tremida de um cachorro.'],
  ['eu e a Nina.jpg', 'Uma jovem abraçada a uma gata cinza.'],
  ['casamento tia.jpg', 'Salão de festas com balões brancos.'],
  ['scan0001.jpg', 'Um documento escaneado torto, ilegível.'],
  ['aniversário do Téo.jpg', 'Um bolo com velinhas e muita gente desfocada.'],
]

export const MUSICAS: readonly (readonly [string, string])[] = [
  ['musica nova.mp3', 'Um sertanejo estourado no rádio esse ano.'],
  ['faixa 03.mp3', 'Título ilegível, gravado de CD emprestado.'],
  ['pagode.mp3', 'Uma roda de samba gravada ao vivo, com chiado.'],
  ['rock nacional.mp3', 'Aquela música que tocava em toda festa.'],
]

/** Documentos que valem dinheiro no mercado negro. */
export const VALIOSOS: readonly (readonly [string, string, string])[] = [
  ['clientes.csv', 'sheet', 'nome;cnpj;honorário\n(+ 84 linhas de cadastro)\n'],
  ['folha_pagamento.csv', 'sheet', 'matrícula;nome;líquido\n(+ 412 linhas)\n'],
  ['inadimplentes.xls', 'sheet', '[planilha]\n\nQuem está devendo, e há quanto tempo.\n'],
  ['orçamento.xls', 'sheet', '[planilha]\n\nO que foi cortado, e de onde.\n'],
  ['contratos.zip', 'archive', '[arquivo compactado: 63 contratos assinados]'],
  ['backup_2003.zip', 'archive', '[arquivo compactado: 812 documentos fiscais]'],
  ['dump_clientes.sql', 'archive', '[dump de banco: 41.882 registros]'],
  ['cobranca.sql', 'archive', '[dump: dados de cobrança recorrente]'],
  ['prontuarios.zip', 'archive', '[arquivo compactado: fichas de pacientes]'],
]

/** Nomes que um arquivo de senhas costuma ter. */
export const NOMES_SENHAS = [
  'senhas do banco.txt', 'acessos.txt', 'cofre.txt', '_senhas.txt',
  'minhas senhas.txt', 'banco.txt', 'importante.txt', 'nao apagar.txt',
  'logins.txt', 'deploy.conf',
]

/** Palavras usadas para montar senhas de 2003 - fracas, como eram. */
export const PALAVRAS_SENHA = [
  'vasco', 'flamengo', 'girassol', 'estrela', 'cachorro', 'brasil',
  'familia', 'amor', 'sucesso', 'trabalho', 'liberdade', 'saudade',
  'primavera', 'guitarra', 'oceano', 'montanha',
]

/** Sistema: sempre presente, nunca util. E o ruido que faz vasculhar valer. */
export const SISTEMA: readonly (readonly [string, string])[] = [
  ['kernel32.dll', 'Biblioteca do sistema.'],
  ['user32.dll', 'Biblioteca do sistema.'],
  ['hal.dll', 'Camada de abstração de hardware.'],
  ['gdi32.dll', 'Biblioteca gráfica do sistema.'],
  ['win.ini', 'Configuração do sistema.'],
]
