# Operação 15

Protótipo responsivo de uma PWA para acompanhamento de emagrecimento, apresentado como um centro de operações.

## Estrutura

- `index.html`: telas e estrutura do aplicativo
- `styles.css`: identidade visual e responsividade
- `app.js`: navegação e interações de interface
- `storage.js`: camada única de salvamento local, carimbos de sincronização e backup
- `data.js`, `missions.js`, `protocol-engine.js`, `training-library.js`: perfil, missões, protocolo e treino
- `manifest.webmanifest` e `service-worker.js`: configuração de instalação e cache da PWA
- `assets/`: ícones do aplicativo

## Dados locais

Na versão 1.1, o perfil do agente — nome, peso atual, peso-meta e início da operação — é salvo no armazenamento local do navegador. Assim, os dados permanecem ao recarregar o aplicativo no mesmo dispositivo.

Desde a etapa 2, todo salvamento passa por `storage.js` (`Store`), que guarda o dado no aparelho e, quando há login, avisa a nuvem. O app continua funcionando sem login e sem internet.

## Operação do atleta

Na versão 1.2, o perfil também define o foco da evolução: Operação Fênix (redução de gordura), Titã (ganho de massa muscular), Equilíbrio (recomposição corporal) ou Performance (condicionamento). A operação adapta a linguagem e os indicadores apresentados no Centro de Comando, sem criar métricas adicionais.

## Nomenclatura operacional

As Operações Estratégicas definem o objetivo do atleta: Fênix, Titã, Equilíbrio ou Performance. Os treinos usam uma nomenclatura independente para evitar conflitos: Treino Alfa (Ficha A), Treino Bravo (Ficha B), Treino Charlie (Ficha C), Treino Delta (Ficha D) e Treino Echo (Ficha E).

## Missões diárias

Na versão 1.3, o Centro de Comando carrega um catálogo inicial de missões diárias de acordo com a operação ativa. As conclusões são salvas localmente somente para o dia atual. O módulo `missions.js` separa o catálogo e o contexto diário para que futuras missões inteligentes, especiais e sazonais — além do Briefing da Central — possam ser adicionados sem alterar a interface principal.

Ao trocar a operação com um protocolo ativo, o aplicativo solicita confirmação antes de reiniciar as missões do dia para o novo foco.

## Conta e sincronização (Firebase)

Entrando com o Google (Ajustes > Conta e sincronização), os dados são guardados no Firestore e aparecem em todos os seus aparelhos. Cada usuário só acessa os próprios dados.

- `firebase-config.js`: configuração web do projeto Firebase `operacao15`. Não são segredos; a proteção está nas regras e no login.
- `cloud.js`: login com Google e sincronização. Carrega o SDK do Firebase (versão fixa 10.14.1) pelo CDN do Google; se não carregar, o app segue só local.
- `firestore.rules`: regras do Firestore. Cole em Firestore > Regras e clique em Publicar. Os dados ficam em `users/{uid}/data/{profile|training|execution|missions}`.
- Conflitos: vale o dado mais recente de cada bloco (profile, training, execution, missions). Alterações feitas sem internet sobem quando a conexão voltar.
- Sair da conta mantém os dados no aparelho. Entrar com outra conta Google substitui os dados locais pelos dessa conta.
- No Firebase, o domínio do site precisa estar em Authentication > Configurações > Domínios autorizados.

### Backup em arquivo

Em Ajustes > Conta e sincronização há "Exportar backup" (arquivo `.json`) e "Importar backup". Importar substitui os dados atuais.

## Testes

`node protocol-engine.test.js` (motor de protocolo e gerador de treino), `node store.test.js` (salvamento, backup e missões) e `node cloud.test.js` (login e sincronização contra um Firebase simulado). O Firebase de verdade só pode ser testado no navegador.

## Como visualizar

Abra o projeto por um servidor local estático para habilitar a instalação e o cache da PWA (por exemplo, `python3 -m http.server 8080` na pasta do projeto e acesse `http://localhost:8080`). Não há build nem backend próprio: a nuvem usa o Firebase direto do navegador.

## Publicação (GitHub Pages ou Netlify)

O projeto é estático: não há build. Publique a pasta raiz como está. O endereço precisa ser HTTPS para o service worker funcionar (GitHub Pages e Netlify já são).

**GitHub Pages:** no repositório, `Settings > Pages`, em `Build and deployment` escolha `Deploy from a branch`, branch `main` e pasta `/ (root)`. O endereço será `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`.

**Netlify:** `Add new site > Import an existing project`, conecte o repositório, deixe `Build command` vazio e `Publish directory` como `.` (raiz).

**Atenção:** os dados ficam no `localStorage` e pertencem ao endereço. Trocar de endereço depois (por exemplo, para um domínio próprio) faz o app abrir vazio. Defina o endereço definitivo antes do uso real.

**A cada publicação:** altere a constante `VERSION` em `service-worker.js` para o navegador baixar a nova versão.

**Instalar no celular:** abra o endereço no Chrome (Android) ou Safari (iPhone) e use "Adicionar à tela inicial".
