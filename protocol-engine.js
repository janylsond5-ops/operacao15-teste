const ProtocolEngine = (() => {
  const STORAGE_KEY = 'operacao15.protocol.v1';

  const OPERATION_RULES = {
    phoenix: {
      identity: 'phoenix',
      label: 'OPERAÇÃO FÊNIX',
      objective: 'redução de gordura',
      characteristics: ['energia controlada', 'cardio orientado', 'recuperação ativa'],
      levelModifiers: {
        recruta: {
          complexity: 'inicial',
          volume: 'modesto',
          variety: 'base',
          distribution: 'equilibrada',
          characteristics: ['introdução gradual', 'controle de esforço']
        },
        operador: {
          complexity: 'intermediária',
          volume: 'progressivo',
          variety: 'modulada',
          distribution: 'especializada',
          characteristics: ['manutenção do gasto', 'intensidade regulada']
        },
        veterano: {
          complexity: 'avançada',
          volume: 'elevado',
          variety: 'dinâmica',
          distribution: 'desafiadora',
          characteristics: ['estímulo mais intenso', 'maior densidade']
        }
      },
      strategies: {
        3: {
          strategy: 'base-abrange',
          description: 'sessões mais abrangentes',
          distribution: ['condicionamento base', 'metabolismo', 'recuperação ativa']
        },
        4: {
          strategy: 'intermediario-equilibrado',
          description: 'distribuição intermediária',
          distribution: ['base energética', 'estímulo secundário', 'resiliência', 'recuperação']
        },
        5: {
          strategy: 'especializacao-intensiva',
          description: 'maior especialização',
          distribution: ['base funcional', 'estímulo principal', 'condicionamento', 'recuperação', 'grupos focados']
        },
        6: {
          strategy: 'distribuicao-continua',
          description: 'maior distribuição dos estímulos',
          distribution: ['base aeróbica', 'estímulo específico', 'potência leve', 'manutenção', 'recuperação', 'reposição']
        }
      }
    },
    titan: {
      identity: 'titan',
      label: 'OPERAÇÃO TITÃ',
      objective: 'ganho de massa muscular',
      characteristics: ['stimulus de força', 'ordem de esforço', 'crescimento estrutural'],
      levelModifiers: {
        recruta: {
          complexity: 'inicial',
          volume: 'modesto',
          variety: 'base',
          distribution: 'equilibrada',
          characteristics: ['aprendizado técnico', 'controle de volume']
        },
        operador: {
          complexity: 'intermediária',
          volume: 'progressivo',
          variety: 'modulada',
          distribution: 'especializada',
          characteristics: ['aumento de densidade', 'melhor ordem de treino']
        },
        veterano: {
          complexity: 'avançada',
          volume: 'elevado',
          variety: 'dinâmica',
          distribution: 'desafiadora',
          characteristics: ['volume mais denso', 'resistência estrutural']
        }
      },
      strategies: {
        3: {
          strategy: 'forca-abarcante',
          description: 'sessões mais abrangentes',
          distribution: ['base estrutural', 'força primária', 'recovery-driven']
        },
        4: {
          strategy: 'forca-intermediaria',
          description: 'distribuição intermediária',
          distribution: ['movimento base', 'força secundária', 'massa', 'recuperação']
        },
        5: {
          strategy: 'especializacao-muscular',
          description: 'maior especialização',
          distribution: ['base de força', 'pressão de carga', 'massa segmentada', 'recuperação', 'volume estratégico']
        },
        6: {
          strategy: 'distribuicao-estrutural',
          description: 'maior distribuição dos estímulos',
          distribution: ['força base', 'estímulo primário', 'volume controlado', 'massa total', 'recuperação', 'resposta total']
        }
      }
    },
    equilibrio: {
      identity: 'equilibrio',
      label: 'OPERAÇÃO EQUILÍBRIO',
      objective: 'recomposição corporal',
      characteristics: ['equilíbrio energético', 'mobilidade', 'estabilidade'],
      levelModifiers: {
        recruta: {
          complexity: 'inicial',
          volume: 'modesto',
          variety: 'base',
          distribution: 'equilibrada',
          characteristics: ['introdução de mobilidade', 'regularidade']
        },
        operador: {
          complexity: 'intermediária',
          volume: 'progressivo',
          variety: 'modulada',
          distribution: 'especializada',
          characteristics: ['rompimento de desequilíbrios', 'boa recuperação']
        },
        veterano: {
          complexity: 'avançada',
          volume: 'elevado',
          variety: 'dinâmica',
          distribution: 'desafiadora',
          characteristics: ['controle de estresse', 'resiliência funcional']
        }
      },
      strategies: {
        3: {
          strategy: 'equilibrio-base',
          description: 'sessões mais abrangentes',
          distribution: ['mobilidade base', 'estabilidade', 'recuperação plena']
        },
        4: {
          strategy: 'equilibrio-intermediario',
          description: 'distribuição intermediária',
          distribution: ['pilar de suporte', 'controle postural', 'mobilidade', 'recuperação']
        },
        5: {
          strategy: 'especializacao-equilibrada',
          description: 'maior especialização',
          distribution: ['mobilidade', 'controle', 'estabilidade', 'capacitação', 'regulação']
        },
        6: {
          strategy: 'distribuicao-equilibrada',
          description: 'maior distribuição dos estímulos',
          distribution: ['suporte', 'mobilidade', 'estabilidade', 'resistência', 'recuperação', 'regulação']
        }
      }
    },
    performance: {
      identity: 'performance',
      label: 'OPERAÇÃO PERFORMANCE',
      objective: 'condicionamento físico',
      characteristics: ['potência', 'resistência', 'qualidade de movimento'],
      levelModifiers: {
        recruta: {
          complexity: 'inicial',
          volume: 'modesto',
          variety: 'base',
          distribution: 'equilibrada',
          characteristics: ['base de movimento', 'adaptação gradual']
        },
        operador: {
          complexity: 'intermediária',
          volume: 'progressivo',
          variety: 'modulada',
          distribution: 'especializada',
          characteristics: ['melhoria de eficiência', 'maior densidade']
        },
        veterano: {
          complexity: 'avançada',
          volume: 'elevado',
          variety: 'dinâmica',
          distribution: 'desafiadora',
          characteristics: ['potência máxima', 'sistema integrado']
        }
      },
      strategies: {
        3: {
          strategy: 'performance-base',
          description: 'sessões mais abrangentes',
          distribution: ['base de potência', 'resistência', 'recuperação']
        },
        4: {
          strategy: 'performance-intermediario',
          description: 'distribuição intermediária',
          distribution: ['potência', 'capacidade', 'eficiência', 'recuperação']
        },
        5: {
          strategy: 'especializacao-performance',
          description: 'maior especialização',
          distribution: ['potência', 'resistência', 'qualidade', 'mobilidade', 'resposta']
        },
        6: {
          strategy: 'distribuicao-performance',
          description: 'maior distribuição dos estímulos',
          distribution: ['potência', 'capacidade', 'base técnica', 'resistência', 'recuperação', 'sistema total']
        }
      }
    }
  };

  const memoryStore = (() => {
    const store = new Map();
    return {
      getItem(key) {
        return Object.prototype.hasOwnProperty.call(store, key) ? store.get(key) : null;
      },
      setItem(key, value) {
        store.set(key, String(value));
      },
      removeItem(key) {
        store.delete(key);
      }
    };
  })();

  const storage = (() => {
    if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
      return globalThis.localStorage;
    }
    return memoryStore;
  })();

  function readState() {
    try {
      const raw = storage.getItem(STORAGE_KEY);
      return raw == null ? null : JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function writeState(state) {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      memoryStore.setItem(STORAGE_KEY, JSON.stringify(state));
    }
    return state;
  }

  function normalizeNumber(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function normalizeProfile(profile) {
    if (!profile || typeof profile !== 'object') return null;

    const name = String(profile.name || '').trim();
    const currentWeight = normalizeNumber(profile.currentWeight, Number.NaN);
    const targetWeight = normalizeNumber(profile.targetWeight ?? profile.goalWeight, Number.NaN);
    const operation = Object.prototype.hasOwnProperty.call(OPERATION_RULES, String(profile.operation || '')) ? String(profile.operation) : null;
    const level = ['recruta', 'operador', 'veterano'].includes(String(profile.agentLevel || '')) ? String(profile.agentLevel) : null;
    const trainingDays = [3, 4, 5, 6].includes(Number(profile.trainingDays ?? profile.trainingFrequency)) ? Number(profile.trainingDays ?? profile.trainingFrequency) : null;

    if (!name || !Number.isFinite(currentWeight) || !Number.isFinite(targetWeight) || !operation || !level || !trainingDays) {
      return null;
    }

    return {
      name,
      currentWeight,
      targetWeight,
      operation,
      agentLevel: level,
      trainingDays
    };
  }

  function makeSafeFallback(profile) {
    const fallbackOperation = Object.prototype.hasOwnProperty.call(OPERATION_RULES, String(profile?.operation || '')) ? String(profile.operation) : 'phoenix';
    const fallbackLevel = ['recruta', 'operador', 'veterano'].includes(String(profile?.agentLevel || '')) ? String(profile.agentLevel) : 'recruta';
    const fallbackDays = [3, 4, 5, 6].includes(Number(profile?.trainingDays ?? profile?.trainingFrequency)) ? Number(profile.trainingDays ?? profile.trainingFrequency) : 3;

    return {
      operation: fallbackOperation,
      level: fallbackLevel,
      trainingDays: fallbackDays,
      status: 'incomplete',
      structure: {
        sessions: 0,
        strategy: 'fallback-incompleto',
        characteristics: ['perfil incompleto'],
        distribution: []
      },
      warnings: ['Perfil incompleto para geração do protocolo.']
    };
  }

  function generateProtocol(profile) {
    const normalized = normalizeProfile(profile);
    if (!normalized) {
      return makeSafeFallback(profile);
    }

    const operationRules = OPERATION_RULES[normalized.operation];
    const levelRules = operationRules.levelModifiers[normalized.agentLevel];
    const frequencyStrategy = operationRules.strategies[normalized.trainingDays] || operationRules.strategies[3];

    const distribution = frequencyStrategy.distribution.map((focus, index) => ({
      slot: index + 1,
      focus,
      emphasis: levelRules.distribution,
      objective: `sessão ${index + 1}`
    }));

    const result = {
      operation: normalized.operation,
      level: normalized.agentLevel,
      trainingDays: normalized.trainingDays,
      status: 'ready',
      structure: {
        sessions: normalized.trainingDays,
        strategy: frequencyStrategy.strategy,
        characteristics: [...new Set([...operationRules.characteristics, ...levelRules.characteristics])],
        distribution
      },
      modifiers: {
        operation: {
          identity: operationRules.identity,
          objective: operationRules.objective,
          label: operationRules.label
        },
        level: {
          complexity: levelRules.complexity,
          volume: levelRules.volume,
          variety: levelRules.variety,
          distribution: levelRules.distribution
        },
        frequency: {
          strategy: frequencyStrategy.strategy,
          description: frequencyStrategy.description
        }
      }
    };

    writeState(result);
    return result;
  }

  function getStoredProtocol() {
    const stored = readState();
    return stored && typeof stored === 'object' ? stored : null;
  }

  function persistProtocol(profile) {
    const protocol = generateProtocol(profile);
    if (protocol && protocol.status === 'ready') {
      writeState(protocol);
    }
    return protocol;
  }

  const api = {
    OPERATION_RULES,
    generateProtocol,
    getStoredProtocol,
    persistProtocol
  };

  if (typeof window !== 'undefined') {
    window.ProtocolEngine = api;
  }

  if (typeof globalThis !== 'undefined') {
    globalThis.ProtocolEngine = api;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  return api;
})();
