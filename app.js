const navItems = document.querySelectorAll('.nav-item');
const screens = document.querySelectorAll('.screen');
const toast = document.querySelector('#toast');
const profileForm = document.querySelector('#profile-form');
const OPERATION_CONFIG = {
  phoenix: { label: 'OPERAÇÃO FÊNIX', caption: 'REDUÇÃO DE GORDURA', progress: 'PROGRESSO DE REDUÇÃO', complete: 'META DE REDUÇÃO ALCANÇADA' },
  titan: { label: 'OPERAÇÃO TITÃ', caption: 'CONSTRUÇÃO MUSCULAR', progress: 'PROGRESSO DE CONSTRUÇÃO', complete: 'META DE CONSTRUÇÃO ALCANÇADA' },
  equilibrio: { label: 'OPERAÇÃO EQUILÍBRIO', caption: 'RECOMPOSIÇÃO CORPORAL', progress: 'TRAJETÓRIA DE EQUILÍBRIO', complete: 'OBJETIVO DE EQUILÍBRIO ALCANÇADO' },
  performance: { label: 'OPERAÇÃO PERFORMANCE', caption: 'CONDICIONAMENTO FÍSICO', progress: 'BASE DE PERFORMANCE', complete: 'OBJETIVO DE PERFORMANCE ALCANÇADO' }
};
let toastTimer;

function showToast(message, tone = 'info') {
  toast.textContent = message;
  toast.className = `toast ${tone}`;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), tone === 'success' ? 3400 : 2800);
}

navItems.forEach((item) => item.addEventListener('click', () => {
  const target = item.dataset.target;
  navItems.forEach((nav) => nav.classList.toggle('active', nav === item));
  screens.forEach((screen) => screen.classList.toggle('active', screen.dataset.screen === target));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}));

function formatWeight(value) {
  return Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function formatToday() {
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })
    .format(new Date()).replaceAll('.', '').toUpperCase();
}

function openScreen(target) {
  document.querySelector(`.nav-item[data-target="${target}"]`).click();
}

function selectOperation(operation) {
  document.querySelectorAll('.operation-option').forEach((option) => {
    option.classList.toggle('selected', option.dataset.operation === operation);
    option.querySelector('input').checked = option.dataset.operation === operation;
  });
}

function selectAgentLevel(level) {
  document.querySelectorAll('.agent-level-option').forEach((option) => {
    option.classList.toggle('selected', option.dataset.agentLevel === level);
    option.querySelector('input').checked = option.dataset.agentLevel === level;
  });
}

function selectTrainingFrequency(days) {
  document.querySelectorAll('.training-frequency-option').forEach((option) => {
    option.classList.toggle('selected', option.dataset.trainingFrequency === String(days));
    option.querySelector('input').checked = option.dataset.trainingFrequency === String(days);
  });
}

function renderProfile(profile) {
  const setupCallout = document.querySelector('#setup-callout');
  const currentWeight = document.querySelector('#current-weight');
  const goalWeight = document.querySelector('#goal-weight');
  const progress = document.querySelector('#goal-progress');
  const progressLabel = document.querySelector('#goal-progress-label');
  const progressBar = document.querySelector('#goal-progress-bar');
  const operationLabel = document.querySelector('#operation-label');
  const operationCaption = document.querySelector('#operation-caption');
  const setupTitle = document.querySelector('#setup-title');
  const setupDescription = document.querySelector('#setup-description');

  if (!profile) {
    setupCallout.hidden = false;
    currentWeight.firstChild.nodeValue = '--';
    goalWeight.firstChild.nodeValue = '--';
    progress.textContent = '--';
    progressLabel.textContent = 'CONFIGURE A MISSÃO';
    progressBar.style.width = '0%';
    operationLabel.textContent = 'OBJETIVO DA MISSÃO';
    operationCaption.textContent = 'SELECIONE A OPERAÇÃO';
    setupTitle.textContent = 'Configure sua missão';
    setupDescription.textContent = 'Defina seu perfil e sua operação para ativar o painel.';
    selectOperation(null);
    return;
  }

  const operation = OPERATION_CONFIG[profile.operation];
  setupCallout.hidden = Boolean(operation);
  currentWeight.firstChild.nodeValue = formatWeight(profile.currentWeight);
  goalWeight.firstChild.nodeValue = formatWeight(profile.goalWeight);
  const totalDistance = Math.abs(profile.startingWeight - profile.goalWeight);
  const requiredDirection = Math.sign(profile.goalWeight - profile.startingWeight);
  const currentDirection = Math.sign(profile.currentWeight - profile.startingWeight);
  const coveredDistance = requiredDirection === currentDirection ? Math.abs(profile.startingWeight - profile.currentWeight) : 0;
  const percentage = totalDistance === 0 ? 100 : Math.max(0, Math.min(100, Math.round((coveredDistance / totalDistance) * 100)));
  progress.textContent = `${percentage}%`;
  progressLabel.textContent = operation ? (percentage === 100 ? operation.complete : operation.progress) : 'SELECIONE A OPERAÇÃO';
  progressBar.style.width = `${percentage}%`;
  operationLabel.textContent = operation ? operation.label : 'OBJETIVO DA MISSÃO';
  operationCaption.textContent = operation ? operation.caption : 'SELECIONE A OPERAÇÃO';
  setupTitle.textContent = 'Selecione a operação';
  setupDescription.textContent = 'Escolha o foco da sua evolução para adaptar o Centro de Comando.';
  document.querySelector('#profile-name').value = profile.name;
  document.querySelector('#profile-current-weight').value = profile.currentWeight;
  document.querySelector('#profile-goal-weight').value = profile.goalWeight;
  document.querySelector('#profile-start-date').value = profile.startDate;
  selectOperation(profile.operation);
  selectAgentLevel(profile.agentLevel || null);
  selectTrainingFrequency(profile.trainingFrequency || null);
}

function renderMissions(profile) {
  const missionList = document.querySelector('#mission-list');
  const summary = document.querySelector('#mission-summary');
  const finishLabel = document.querySelector('#finish-mission-label');

  if (!profile?.operation) {
    missionList.innerHTML = '';
    summary.textContent = 'Configure sua operação para receber o protocolo.';
    finishLabel.textContent = 'PROTOCOLO AGUARDANDO CONFIGURAÇÃO';
    return;
  }

  const context = MissionSystem.getContext(profile.operation);
  summary.textContent = context.isDailyMissionComplete
    ? 'PROTOCOLO DIÁRIO CONCLUÍDO'
    : `${context.completedMissions} DE ${context.totalMissions} MISSÕES CONCLUÍDAS`;
  finishLabel.textContent = context.isDailyMissionComplete ? 'PROTOCOLO DIÁRIO CONCLUÍDO' : 'ACOMPANHAR PROTOCOLO';
  missionList.innerHTML = context.missions.map((mission) => {
    const isComplete = context.completedMissionIds.includes(mission.id);
    return `<button class="mission-card${isComplete ? ' complete' : ''}" type="button" data-mission-id="${mission.id}" aria-pressed="${isComplete}"><span class="mission-icon">${mission.icon}</span><span class="mission-copy"><strong>${mission.title}</strong><small>${isComplete ? 'Protocolo concluído' : mission.detail}</small></span><span class="check">✓</span></button>`;
  }).join('');
}

document.querySelector('#mission-list').addEventListener('click', (event) => {
  const card = event.target.closest('.mission-card');
  const profile = OperationData.getProfile();
  if (!card || !profile?.operation) return;
  const context = MissionSystem.toggleMission(profile.operation, card.dataset.missionId);
  renderMissions(profile);
  const mission = context.missions.find((item) => item.id === card.dataset.missionId);
  const isComplete = context.completedMissionIds.includes(card.dataset.missionId);
  if (context.justCompleted) showToast('Missão diária concluída. Protocolo finalizado.', 'success');
  else showToast(isComplete ? `${mission.title}: protocolo concluído.` : `${mission.title}: protocolo reaberto.`, isComplete ? 'success' : 'info');
});

document.querySelector('#finish-mission').addEventListener('click', () => {
  const profile = OperationData.getProfile();
  const context = profile?.operation ? MissionSystem.getContext(profile.operation) : null;
  if (!context) showToast('Configure a operação do atleta para ativar o protocolo.', 'warning');
  else if (context.isDailyMissionComplete) showToast('Protocolo diário concluído. Central em prontidão.', 'success');
  else showToast(`Restam ${context.totalMissions - context.completedMissions} missões para concluir o protocolo.`, 'info');
});
document.querySelector('.add-entry').addEventListener('click', () => showToast('Registro nutricional disponível em uma próxima versão.', 'warning'));
document.querySelectorAll('.future-setting').forEach((button) => button.addEventListener('click', () => showToast(`${button.querySelector('span').textContent}: módulo em planejamento.`, 'warning')));
document.querySelector('#notifications-button').addEventListener('click', () => showToast('Nenhuma notificação operacional no momento.', 'info'));

document.querySelector('#open-profile').addEventListener('click', () => {
  openScreen('settings');
  document.querySelector('.profile-settings').open = true;
  document.querySelector('#profile-name').focus();
});

function setProfileFeedback(message = '') {
  const feedback = document.querySelector('#profile-feedback');
  feedback.textContent = message;
  feedback.classList.toggle('show', Boolean(message));
}

function validateProfileForm() {
  const fieldGroups = [
    { selector: '.operation-picker', name: 'operation', message: 'Selecione a operação que orientará sua evolução.' },
    { selector: '.agent-level-picker', name: 'agentLevel', message: 'Selecione o nível do agente.' },
    { selector: '.training-frequency-picker', name: 'trainingFrequency', message: 'Informe quantos dias por semana você treina.' },
    { selector: '#profile-name', name: 'name', message: 'Informe como deseja ser identificado na operação.' },
    { selector: '#profile-current-weight', name: 'currentWeight', message: 'Informe um peso atual entre 25 e 350 kg.' },
    { selector: '#profile-goal-weight', name: 'goalWeight', message: 'Informe uma meta de peso entre 25 e 350 kg.' },
    { selector: '#profile-start-date', name: 'startDate', message: 'Informe a data de início da operação.' }
  ];

  const invalidGroup = fieldGroups.find(({ selector, name }) => {
    const node = document.querySelector(selector);
    if (!node) return false;
    if (name === 'operation' || name === 'agentLevel' || name === 'trainingFrequency') {
      return !node.querySelector(`input[name="${name}"]:checked`);
    }
    const input = document.querySelector(selector);
    return !input.validity.valid;
  });

  document.querySelectorAll('.operation-picker, .agent-level-picker, .training-frequency-picker').forEach((picker) => picker.classList.remove('is-invalid'));
  profileForm.querySelectorAll('input').forEach((field) => field.classList.remove('is-invalid'));

  if (!invalidGroup) return true;

  const invalidField = invalidGroup.selector.startsWith('.')
    ? document.querySelector(invalidGroup.selector)
    : document.querySelector(invalidGroup.selector);
  invalidField.classList.add('is-invalid');
  setProfileFeedback(invalidGroup.message);
  invalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });

  if (invalidGroup.name === 'name' || invalidGroup.name === 'currentWeight' || invalidGroup.name === 'goalWeight' || invalidGroup.name === 'startDate') {
    const input = document.querySelector(`#${invalidGroup.selector.replace('#', '')}`);
    input?.focus();
  }
  return false;
}

profileForm.querySelectorAll('input').forEach((field) => field.addEventListener('input', () => {
  field.classList.remove('is-invalid');
  if (field.name === 'operation') {
    document.querySelector('.operation-picker').classList.remove('is-invalid');
    selectOperation(field.value);
  }
  if (field.name === 'agentLevel') {
    document.querySelector('.agent-level-picker').classList.remove('is-invalid');
    selectAgentLevel(field.value);
  }
  if (field.name === 'trainingFrequency') {
    document.querySelector('.training-frequency-picker').classList.remove('is-invalid');
    selectTrainingFrequency(field.value);
  }
  setProfileFeedback();
}));

profileForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!validateProfileForm()) return;
  const currentProfile = OperationData.getProfile();
  const nextProfile = { ...currentProfile, ...Object.fromEntries(new FormData(profileForm)) };
  const isOperationChange = currentProfile?.operation && currentProfile.operation !== nextProfile.operation;
  if (isOperationChange && MissionSystem.hasActiveProtocol(currentProfile.operation)) {
    const confirmed = window.confirm('Há um protocolo diário ativo. Confirmar a troca de operação reiniciará as missões de hoje para o novo foco. Deseja continuar?');
    if (!confirmed) {
      selectOperation(currentProfile.operation);
      showToast('Troca de operação cancelada. O protocolo atual foi preservado.', 'info');
      return;
    }
    MissionSystem.restartForOperation(nextProfile.operation);
  }
  const profile = OperationData.saveProfile(nextProfile);
  renderProfile(profile);
  renderMissions(profile);
  renderTraining();
  showToast('Perfil salvo. Painel operacional atualizado.', 'success');
  openScreen('command');
});

const EXECUTION_STORAGE_KEY = Store.SYNC_KEYS.execution;

function getExecutionRegistry() {
  const registry = Store.getJSON(EXECUTION_STORAGE_KEY);
  return registry && typeof registry === 'object' && !Array.isArray(registry) ? registry : {};
}

function setExecutionRegistry(registry) {
  Store.setJSON(EXECUTION_STORAGE_KEY, registry);
}

function getExecutionProfileKey(profile) {
  if (!profile) return null;
  return `${profile.operation || 'unknown'}|${profile.agentLevel || 'unknown'}|${profile.trainingFrequency || 0}`;
}

function getExerciseExecutionState(profile, sessionId, exerciseId, fallback) {
  const registry = getExecutionRegistry();
  const key = getExecutionProfileKey(profile);
  if (!key || !registry[key] || !registry[key][sessionId] || !registry[key][sessionId][exerciseId]) {
    return {
      sets: fallback?.sets ?? 3,
      reps: fallback?.reps ?? 10,
      weight: fallback?.weight ?? '',
      rest: fallback?.rest ?? 60,
      completed: Boolean(fallback?.completed)
    };
  }

  const saved = registry[key][sessionId][exerciseId];
  return {
    sets: Number.isFinite(Number(saved.sets)) ? Number(saved.sets) : fallback?.sets ?? 3,
    reps: Number.isFinite(Number(saved.reps)) ? Number(saved.reps) : fallback?.reps ?? 10,
    weight: typeof saved.weight === 'string' ? saved.weight : (fallback?.weight ?? ''),
    rest: Number.isFinite(Number(saved.rest)) ? Number(saved.rest) : fallback?.rest ?? 60,
    completed: Boolean(saved.completed)
  };
}

function saveExerciseExecutionState(profile, sessionId, exerciseId, patch) {
  const registry = getExecutionRegistry();
  const key = getExecutionProfileKey(profile);
  if (!key) return;
  const sessionState = registry[key] && registry[key][sessionId] ? registry[key][sessionId] : {};
  registry[key] = registry[key] || {};
  registry[key][sessionId] = sessionState;
  registry[key][sessionId][exerciseId] = {
    ...(sessionState[exerciseId] || {}),
    ...patch
  };
  setExecutionRegistry(registry);
}

function renderTraining() {
  const trainingContent = document.querySelector('#training-content');
  const profile = OperationData.getProfile();
  const plan = profile && window.TrainingGenerator ? window.TrainingGenerator.generateTrainingPlan(profile) : null;
  const trainingData = TrainingData.getTrainingData();
  const scheduleMarkup = trainingData.schedule.map((entry, index) => `
    <div class="training-day" data-entry-id="${entry.id}">
      <div class="training-day-label">${index + 1}</div>
      <label>
        <span>Dia</span>
        <select data-role="schedule-day">
          ${TrainingData.DAY_OPTIONS.map((day) => `<option value="${day}" ${day === entry.day ? 'selected' : ''}>${day}</option>`).join('')}
        </select>
      </label>
      <label>
        <span>Horário</span>
        <input type="time" data-role="schedule-time" value="${entry.time}" />
      </label>
      <label>
        <span>Protocolo</span>
        <select data-role="schedule-protocol">
          ${TrainingData.PROTOCOL_OPTIONS.map((protocol) => `<option value="${protocol}" ${protocol === entry.protocol ? 'selected' : ''}>${protocol}</option>`).join('')}
        </select>
      </label>
      <button type="button" class="danger-button training-remove-day" aria-label="Remover dia de treino">REMOVER</button>
    </div>
  `).join('');

  const generatedPlanMarkup = plan && Array.isArray(plan.sessions)
    ? plan.sessions.map((session) => `
      <article class="training-protocol panel">
        <div class="training-protocol-header">
          <div>
            <p class="card-label">PROTOCOLO DE TREINO</p>
            <h3>${session.name}</h3>
          </div>
          <span class="card-label">${session.focus}</span>
        </div>
        <div class="training-exercise-list">
          ${session.exercises.map((exercise) => {
            const executionState = getExerciseExecutionState(profile, session.id, exercise.id, exercise);
            return `
              <div class="training-exercise" data-session-id="${session.id}" data-exercise-id="${exercise.id}">
                <div class="training-exercise-copy">
                  <strong>${exercise.name}</strong>
                  <small>${exercise.muscleGroup} · ${exercise.movementPattern} · ${executionState.sets}x${executionState.reps} · descanso ${executionState.rest}s</small>
                </div>
                <div class="training-exercise-controls">
                  <label>
                    <span>Séries</span>
                    <input type="number" min="1" max="20" value="${executionState.sets}" data-role="sets" data-session-id="${session.id}" data-exercise-id="${exercise.id}" />
                  </label>
                  <label>
                    <span>Reps</span>
                    <input type="number" min="1" max="30" value="${executionState.reps}" data-role="reps" data-session-id="${session.id}" data-exercise-id="${exercise.id}" />
                  </label>
                  <label>
                    <span>Carga</span>
                    <input type="text" value="${executionState.weight || ''}" data-role="weight" data-session-id="${session.id}" data-exercise-id="${exercise.id}" placeholder="Sem carga" />
                  </label>
                  <label>
                    <span>Descanso</span>
                    <input type="number" min="15" max="180" step="15" value="${executionState.rest}" data-role="rest" data-session-id="${session.id}" data-exercise-id="${exercise.id}" />
                  </label>
                  <label class="exercise-complete-toggle">
                    <input type="checkbox" data-role="completed" data-session-id="${session.id}" data-exercise-id="${exercise.id}" ${executionState.completed ? 'checked' : ''} />
                    <span>${executionState.completed ? 'Concluído' : 'Concluído'}</span>
                  </label>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </article>
    `).join('')
    : '<article class="training-protocol panel"><div class="training-protocol-header"><div><p class="card-label">PROTOCOLO</p><h3>Sem ficha</h3></div></div><p class="training-empty">Selecione o perfil operacional para gerar a ficha.</p></article>';

  trainingContent.innerHTML = `
    <article class="training-config panel">
      <div class="training-config-header">
        <div>
          <p class="card-label">PLANO SEMANAL</p>
          <h3>Horário e dias de treino</h3>
        </div>
        <button type="button" class="save-profile training-add-day">+ ADICIONAR DIA</button>
      </div>
      <div class="training-days-list">${scheduleMarkup || '<p class="training-empty">Nenhum dia configurado.</p>'}</div>
    </article>
    <div class="training-protocols">${generatedPlanMarkup}</div>
  `;
}

function openExerciseModal({ protocol, exerciseId = null }) {
  const modal = document.querySelector('#training-modal');
  const trainingData = TrainingData.getTrainingData();
  const exercise = (trainingData.protocols[protocol] || []).find((item) => item.id === exerciseId) || null;
  const form = document.querySelector('#exercise-form');
  const title = document.querySelector('#training-modal-title');

  form.querySelector('#exercise-protocol').value = protocol;
  form.querySelector('#exercise-id').value = exercise?.id || '';
  form.querySelector('#exercise-name').value = exercise?.name || '';
  form.querySelector('#exercise-sets').value = exercise?.sets || 3;
  form.querySelector('#exercise-reps').value = exercise?.reps || 10;
  form.querySelector('#exercise-weight').value = exercise?.weight || '';
  form.querySelector('#exercise-rest').value = exercise?.rest || 60;
  form.querySelector('#exercise-notes').value = exercise?.notes || '';
  title.textContent = exercise ? 'Editar exercício' : 'Novo exercício';
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
  setTimeout(() => form.querySelector('#exercise-name').focus(), 40);
}

function closeExerciseModal() {
  const modal = document.querySelector('#training-modal');
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
  document.querySelector('#exercise-form').reset();
}

function applyScheduleChange(entryId, field, value) {
  const trainingData = TrainingData.getTrainingData();
  const entry = trainingData.schedule.find((item) => item.id === entryId);
  if (!entry) return;
  entry[field] = value;
  TrainingData.saveTrainingData(trainingData);
  renderTraining();
}

function addScheduleEntry() {
  const trainingData = TrainingData.getTrainingData();
  const nextDay = TrainingData.DAY_OPTIONS.find((day) => !trainingData.schedule.some((entry) => entry.day === day)) || TrainingData.DAY_OPTIONS[0];
  trainingData.schedule.push({ id: TrainingData.uid('day'), day: nextDay, time: '13:30', protocol: 'Bravo' });
  TrainingData.saveTrainingData(trainingData);
  renderTraining();
}

function removeScheduleEntry(entryId) {
  const trainingData = TrainingData.getTrainingData();
  trainingData.schedule = trainingData.schedule.filter((entry) => entry.id !== entryId);
  TrainingData.saveTrainingData(trainingData);
  renderTraining();
}

function addExerciseToProtocol(protocol) {
  openExerciseModal({ protocol, exerciseId: null });
}

function updateExerciseInProtocol(protocol, exerciseId, updates) {
  const trainingData = TrainingData.getTrainingData();
  const exercises = trainingData.protocols[protocol] || [];
  const found = exercises.find((exercise) => exercise.id === exerciseId);
  if (!found) return;
  Object.assign(found, updates);
  TrainingData.saveTrainingData(trainingData);
  renderTraining();
}

function removeExerciseFromProtocol(protocol, exerciseId) {
  const confirmed = window.confirm('Confirma a remoção deste exercício do protocolo?');
  if (!confirmed) return;
  const trainingData = TrainingData.getTrainingData();
  trainingData.protocols[protocol] = (trainingData.protocols[protocol] || []).filter((exercise) => exercise.id !== exerciseId);
  TrainingData.saveTrainingData(trainingData);
  renderTraining();
  showToast('Exercício removido do protocolo.', 'info');
}

document.querySelector('#training-content').addEventListener('click', (event) => {
  const addDayButton = event.target.closest('.training-add-day');
  if (addDayButton) {
    addScheduleEntry();
    return;
  }

  const removeDayButton = event.target.closest('.training-remove-day');
  if (removeDayButton) {
    const dayRow = event.target.closest('.training-day');
    if (!dayRow) return;
    if (document.querySelectorAll('.training-day').length === 1) {
      showToast('Mantenha pelo menos um dia configurado.', 'warning');
      return;
    }
    removeScheduleEntry(dayRow.dataset.entryId);
    return;
  }

  const addExerciseButton = event.target.closest('.training-add-exercise');
  if (addExerciseButton) {
    addExerciseToProtocol(addExerciseButton.dataset.protocol);
    return;
  }

  const editButton = event.target.closest('.training-edit-exercise');
  if (editButton) {
    openExerciseModal({ protocol: editButton.dataset.protocol, exerciseId: editButton.dataset.exerciseId });
    return;
  }

  const removeExerciseButton = event.target.closest('.training-remove-exercise');
  if (removeExerciseButton) {
    removeExerciseFromProtocol(removeExerciseButton.dataset.protocol, removeExerciseButton.dataset.exerciseId);
  }
});

document.querySelector('#training-content').addEventListener('change', (event) => {
  const dayRow = event.target.closest('.training-day');
  if (dayRow) {
    applyScheduleChange(dayRow.dataset.entryId, event.target.dataset.role.replace('schedule-', ''), event.target.value);
    return;
  }

  const exerciseField = event.target.closest('[data-role]');
  if (!exerciseField || !exerciseField.dataset.sessionId || !exerciseField.dataset.exerciseId) return;

  const profile = OperationData.getProfile();
  const sessionId = exerciseField.dataset.sessionId;
  const exerciseId = exerciseField.dataset.exerciseId;
  const role = exerciseField.dataset.role;

  if (!profile || !sessionId || !exerciseId) return;

  if (role === 'completed') {
    saveExerciseExecutionState(profile, sessionId, exerciseId, { completed: Boolean(event.target.checked) });
    return;
  }

  if (role === 'weight') {
    saveExerciseExecutionState(profile, sessionId, exerciseId, { weight: event.target.value });
    return;
  }

  const numberValue = Number(event.target.value);
  if (!Number.isFinite(numberValue)) return;
  saveExerciseExecutionState(profile, sessionId, exerciseId, { [role]: Math.max(1, Math.round(numberValue)) });
});

document.querySelector('#training-content').addEventListener('input', (event) => {
  const dayRow = event.target.closest('.training-day');
  if (dayRow && event.target.dataset.role === 'schedule-time') {
    applyScheduleChange(dayRow.dataset.entryId, 'time', event.target.value);
    return;
  }

  const exerciseField = event.target.closest('[data-role]');
  if (!exerciseField || !exerciseField.dataset.sessionId || !exerciseField.dataset.exerciseId) return;

  const profile = OperationData.getProfile();
  const sessionId = exerciseField.dataset.sessionId;
  const exerciseId = exerciseField.dataset.exerciseId;
  const role = exerciseField.dataset.role;

  if (!profile || !sessionId || !exerciseId) return;

  if (role === 'weight') {
    saveExerciseExecutionState(profile, sessionId, exerciseId, { weight: event.target.value });
    return;
  }

  const numberValue = Number(event.target.value);
  if (!Number.isFinite(numberValue)) return;
  saveExerciseExecutionState(profile, sessionId, exerciseId, { [role]: Math.max(1, Math.round(numberValue)) });
});

document.querySelector('#exercise-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const protocol = form.querySelector('#exercise-protocol').value;
  const id = form.querySelector('#exercise-id').value;
  const exerciseName = form.querySelector('#exercise-name').value.trim();
  const sets = Number(form.querySelector('#exercise-sets').value);
  const reps = Number(form.querySelector('#exercise-reps').value);
  const rest = Number(form.querySelector('#exercise-rest').value);
  const weight = form.querySelector('#exercise-weight').value.trim();
  const notes = form.querySelector('#exercise-notes').value.trim();

  if (!exerciseName || !sets || !reps || !rest) {
    showToast('Preencha nome, séries, repetições e descanso.', 'warning');
    return;
  }
  if (rest > 120) {
    showToast('O descanso máximo permitido nesta versão é 120 segundos.', 'warning');
    return;
  }

  const payload = {
    id: id || TrainingData.uid('ex'),
    name: exerciseName,
    sets: Math.max(1, Math.round(sets)),
    reps: Math.max(1, Math.round(reps)),
    weight,
    rest: Math.min(120, Math.max(30, Math.round(rest))),
    notes
  };

  const trainingData = TrainingData.getTrainingData();
  const exercises = trainingData.protocols[protocol] || [];
  if (id) {
    const index = exercises.findIndex((item) => item.id === id);
    if (index >= 0) exercises[index] = payload;
  } else {
    exercises.push(payload);
  }
  trainingData.protocols[protocol] = exercises;
  TrainingData.saveTrainingData(trainingData);
  renderTraining();
  closeExerciseModal();
  showToast('Exercício salvo no protocolo.', 'success');
});

document.querySelectorAll('.quick-rest').forEach((button) => {
  button.addEventListener('click', () => {
    const restInput = document.querySelector('#exercise-rest');
    restInput.value = button.dataset.rest;
  });
});

document.querySelectorAll('[data-close-modal="true"]').forEach((button) => {
  button.addEventListener('click', closeExerciseModal);
});

document.querySelector('#today-date').textContent = formatToday();
document.querySelector('#profile-start-date').value = new Date().toISOString().slice(0, 10);
const initialProfile = OperationData.getProfile();
renderProfile(initialProfile);
renderMissions(initialProfile);
renderTraining();

if (window.ProtocolEngine && initialProfile) {
  window.ProtocolEngine.generateProtocol(initialProfile);
}

// ---- Atualização geral da interface (usada pela nuvem e pelo backup) ----
function refreshAll() {
  const profile = OperationData.getProfile();
  renderProfile(profile);
  renderMissions(profile);
  renderTraining();
}

let refreshPending = false;

function isEditingField() {
  const active = document.activeElement;
  return Boolean(active && active.closest && active.closest('#training-content, #profile-form') && /^(INPUT|SELECT|TEXTAREA)$/.test(active.tagName));
}

window.addEventListener('operacao15:data-changed', () => {
  if (isEditingField()) {
    refreshPending = true;
    return;
  }
  refreshAll();
});

document.addEventListener('focusout', () => {
  if (!refreshPending) return;
  setTimeout(() => {
    if (isEditingField()) return;
    refreshPending = false;
    refreshAll();
  }, 0);
});

window.addEventListener('operacao15:storage-error', () => {
  showToast('Não foi possível salvar neste aparelho. O armazenamento pode estar cheio ou bloqueado.', 'warning');
});

// ---- Conta e sincronização ----
const cloudStatusEl = document.querySelector('#cloud-status');
const cloudDetailEl = document.querySelector('#cloud-detail');
const cloudSignInButton = document.querySelector('#cloud-signin');
const cloudSignOutButton = document.querySelector('#cloud-signout');
let lastCloudStatus = null;
let signInRequested = false;

function formatClock(timestamp) {
  return new Date(timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function renderCloudState(state) {
  const status = state && state.status ? state.status : 'loading';
  const hasAccount = Boolean(state && state.email);
  const messages = {
    disabled: 'Sincronização desativada: o Firebase não está configurado. Os dados ficam só neste aparelho.',
    loading: 'Preparando a sincronização...',
    unavailable: 'Sincronização indisponível agora (sem conexão ou bloqueada). Seus dados continuam salvos neste aparelho.',
    'signed-out': 'Os dados estão salvos só neste aparelho. Entre com o Google para sincronizar com a nuvem.',
    syncing: 'Sincronizando...',
    'signed-in': 'Sincronização ativa. Os dados são guardados na sua conta e aparecem em todos os seus aparelhos.',
    error: (state && state.message) || 'Erro de sincronização.'
  };
  cloudStatusEl.textContent = messages[status] || messages.loading;
  cloudDetailEl.textContent = hasAccount
    ? `Conta: ${state.email}${state.lastSync && status === 'signed-in' ? ` · última sincronização às ${formatClock(state.lastSync)}` : ''}`
    : '';
  cloudSignInButton.hidden = hasAccount || !['signed-out', 'error'].includes(status);
  cloudSignOutButton.hidden = !hasAccount;

  if (status === 'signed-in' && signInRequested) {
    signInRequested = false;
    showToast('Conectado. Dados sincronizados.', 'success');
  }
  if (status === 'error' && lastCloudStatus !== 'error' && state.message) {
    signInRequested = false;
    showToast(state.message, 'warning');
  }
  lastCloudStatus = status;
}

window.addEventListener('operacao15:cloud-state', (event) => renderCloudState(event.detail));
renderCloudState(window.CloudSync ? window.CloudSync.getState() : { status: 'loading' });

cloudSignInButton.addEventListener('click', () => {
  if (!window.CloudSync) return showToast('A sincronização ainda não está disponível.', 'warning');
  signInRequested = true;
  setTimeout(() => { signInRequested = false; }, 60000);
  window.CloudSync.signIn();
});

cloudSignOutButton.addEventListener('click', () => {
  if (!window.CloudSync) return;
  if (window.confirm('Sair da conta? Os dados continuam salvos neste aparelho, mas deixam de sincronizar até você entrar de novo. Se entrar depois com outra conta Google, os dados deste aparelho serão substituídos pelos dessa conta.')) window.CloudSync.signOut();
});

// ---- Backup em arquivo ----
document.querySelector('#backup-export').addEventListener('click', () => {
  const payload = Store.exportBackup();
  if (!Object.keys(payload.data).length) return showToast('Ainda não há dados para exportar.', 'warning');
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `operacao15-backup-${new Date().toLocaleDateString('sv-SE')}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast('Backup exportado.', 'success');
});

const backupFileInput = document.querySelector('#backup-file');
document.querySelector('#backup-import').addEventListener('click', () => backupFileInput.click());
backupFileInput.addEventListener('change', async () => {
  const file = backupFileInput.files && backupFileInput.files[0];
  backupFileInput.value = '';
  if (!file) return;
  let payload;
  try {
    payload = JSON.parse(await file.text());
  } catch {
    return showToast('Não foi possível ler o arquivo. Escolha um backup .json da Operação 15.', 'warning');
  }
  const check = Store.validateBackup(payload);
  if (!check.ok) return showToast(check.error, 'warning');
  if (!window.confirm('Importar este backup substitui os dados atuais deste aparelho (e da nuvem, se estiver conectado). Deseja continuar?')) return;
  const result = Store.importBackup(payload);
  if (!result.ok) return showToast(result.error, 'warning');
  refreshAll();
  showToast('Backup importado.', 'success');
});

if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js'));
