# Operação 15

Protótipo responsivo de uma PWA para acompanhamento de emagrecimento, apresentado como um centro de operações.

## Estrutura

- `index.html`: telas e estrutura do aplicativo
- `styles.css`: identidade visual e responsividade
- `app.js`: navegação e interações de interface
- `manifest.webmanifest` e `service-worker.js`: configuração de instalação e cache da PWA
- `assets/`: ícone do aplicativo

## Dados locais

Na versão 1.1, o perfil do agente — nome, peso atual, peso-meta e início da operação — é salvo somente no armazenamento local do navegador. Assim, os dados permanecem ao recarregar o aplicativo no mesmo dispositivo, sem login ou servidor.

## Operação do atleta

Na versão 1.2, o perfil também define o foco da evolução: Operação Fênix (redução de gordura), Titã (ganho de massa muscular), Equilíbrio (recomposição corporal) ou Performance (condicionamento). A operação adapta a linguagem e os indicadores apresentados no Centro de Comando, sem criar métricas adicionais.

## Nomenclatura operacional

As Operações Estratégicas definem o objetivo do atleta: Fênix, Titã, Equilíbrio ou Performance. Os treinos usam uma nomenclatura independente para evitar conflitos: Treino Alfa (Ficha A), Treino Bravo (Ficha B), Treino Charlie (Ficha C), Treino Delta (Ficha D) e Treino Echo (Ficha E).

## Missões diárias

Na versão 1.3, o Centro de Comando carrega um catálogo inicial de missões diárias de acordo com a operação ativa. As conclusões são salvas localmente somente para o dia atual. O módulo `missions.js` separa o catálogo e o contexto diário para que futuras missões inteligentes, especiais e sazonais — além do Briefing da Central — possam ser adicionados sem alterar a interface principal.

Ao trocar a operação com um protocolo ativo, o aplicativo solicita confirmação antes de reiniciar as missões do dia para o novo foco.

## Como visualizar

Abra o projeto por um servidor local estático para habilitar a instalação e o cache da PWA. Não há backend, login nem banco de dados nesta versão.
