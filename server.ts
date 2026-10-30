import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

function generatePaddockChronicle(prompt: string): string {
  const p = (prompt || '').toLowerCase();

  if (p.includes('inicia sua carreira') || p.includes('início') || p.includes('kart')) {
    const intros = [
      "TEMPORADA ABERTA NO KART: As arquibancadas lotadas acompanham a nova geração de pilotos na briga por cada centímetro de asfalto. Olheiros das principais academias de base já monitoram os talentos mais agressivos.",
      "NOVA PROMESSA NO PADDOCK: Com ritmo consistente e arrojo nas tomadas de curva, o piloto chega ao kartismo disposto a brigar pelo Top 3 e garantir vaga nas categorias de fórmula.",
      "BASTIDORES DO KARTÓDROMO: O início de trajetória mostra que precisão no traçado e gerenciamento de pneus farão toda a diferença ao longo deste campeonato."
    ];
    return intros[Math.floor(Math.random() * intros.length)];
  }

  if (p.includes('promoção') || p.includes('sobe para') || p.includes('promovido')) {
    const promotions = [
      "CONTRATAÇÃO CONFIRMADA: Após um campeonato espetacular no Top 3, o piloto carimba o passaporte rumo ao próximo escalão do automobilismo com moral elevado e novo contrato assinado!",
      "SALTO NA CARREIRA: O paddock aplaude a subida de categoria. Diretores técnicos destacam a rápida adaptação ao novo bólido e a maturidade demonstrada em momentos decisivos.",
      "MERCADO DE PILOTOS EM POLVOROSA: Vaga conquistada na pista! A nova equipe comemora a chegada do piloto e promete um pacote aerodinâmico competitivo para disputar vitórias."
    ];
    return promotions[Math.floor(Math.random() * promotions.length)];
  }

  if (p.includes('1º') || p.includes('p1') || p.includes('vitória') || p.includes('venceu')) {
    const wins = [
      "TRIUNFO MAJESTOSO NA BANDEIRADA: Pilotagem impecável de ponta a ponta! Com gerenciamento cirúrgico de pneus e voltas mais rápidas, a vitória coroou uma estratégia perfeita.",
      "VITÓRIA HISTÓRICA NO PADDOCK: Em um GP emocionante com disputas ferozes, o vencedor manteve a cabeça fria sob pressão e garantiu os 25 pontos máximos para a equipe!",
      "SHOW DE VELOCIDADE: Domínio absoluto nas retas e curvas! O piloto resistiu aos ataques rivais e cruzou a linha de chegada ovacionado pelos mecânicos no pit wall."
    ];
    return wins[Math.floor(Math.random() * wins.length)];
  }

  if (p.includes('p2') || p.includes('p3') || p.includes('2º') || p.includes('3º') || p.includes('pódio')) {
    const podiums = [
      "CELEBRAÇÃO NO PÓDIO: Corrida de altíssimo nível técnico! Com ultrapassagens ousadas e parada eficiente nos boxes, o piloto assegurou um lugar de destaque no pódio e valiosos pontos no campeonato.",
      "FESTA DO TROFÉU: A consistência nas voltas finais fez toda a diferença. O piloto administrou a pressão nas últimas voltas e ergueu a taça sob aplausos da torcida e da imprensa especializada.",
      "BATALHA ATÉ A ÚLTIMA CURVA: Disputa roda a roda eletrizante garantiu o Top 3! A equipe comemora a pontuação que mantém o piloto firme na luta pelos objetivos da temporada."
    ];
    return podiums[Math.floor(Math.random() * podiums.length)];
  }

  if (p.includes('chuva') || p.includes('molhad')) {
    const rain = [
      "DRAMA E BRAVURA NO ASFALTO MOLHADO: A chuva traiçoeira testou o limite dos pilotos. Quem teve mais controle e sensibilidade no acelerador evitou rodadas e saiu consagrado pelos analistas.",
      "CAOS SOB TEMPESTADE: Condições extremas de pista criaram reviravoltas inacreditáveis! A estratégia de pneus e a paciência nos trechos sinuosos definiram os grandes vencedores da rodada.",
      "PILOTAGEM CIRÚRGICA NA CHUVA: Entre poças e spray de água a mais de 250 km/h, os pilotos provaram sua fibra e proporcionaram um espetáculo inesquecível aos fãs da velocidade."
    ];
    return rain[Math.floor(Math.random() * rain.length)];
  }

  const generic = [
    "DIÁRIO DO PADDOCK: O campeonato atinge seu ponto mais quente. Engenheiros e chefes de equipe analisam cada décimo na telemetria enquanto os pilotos intensificam a preparação física e mental.",
    "BOLETIM DAS PISTAS: A briga pelas posições no grid segue acirrada. Cada ponto é vital na disputa pelo Top 3 e a promessa é de duelos ainda mais intensos no próximo fim de semana.",
    "RADAR TÉCNICO: Com o desgaste dos pneus sendo fator decisivo nas corridas, as equipes ajustam a carga aerodinâmica para buscar o equilíbrio perfeito entre velocidade e controle."
  ];
  return generic[Math.floor(Math.random() * generic.length)];
}

let quotaExhaustedUntil = 0;

// Endpoint for AI F1 News & Press Conference with graceful quota resilience
app.post('/api/gemini/news', async (req, res) => {
  const { prompt, systemInstruction } = req.body || {};

  // If quota was already exhausted in recent requests, respond immediately with editorial chronicle
  if (Date.now() < quotaExhaustedUntil || !process.env.GEMINI_API_KEY) {
    return res.json({
      text: generatePaddockChronicle(prompt || ''),
      source: 'paddock_editorial'
    });
  }

  try {
    const apiPromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction || 'You are an expert Formula 1 lead journalist writing dramatic, immersive motorsport news articles and post-race press conference summaries in Portuguese.',
        temperature: 0.8,
      }
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT_AI_RESPONSE')), 3500)
    );

    const response: any = await Promise.race([apiPromise, timeoutPromise]);

    if (response?.text) {
      return res.json({ text: response.text, source: 'ai' });
    }

    return res.json({
      text: generatePaddockChronicle(prompt || ''),
      source: 'paddock_editorial'
    });
  } catch (error: any) {
    const errMsg = String(error?.message || error || '');
    const isQuotaOrRateLimit =
      errMsg.includes('429') ||
      errMsg.includes('quota') ||
      errMsg.includes('RESOURCE_EXHAUSTED');
    const isHighDemandOrTransient =
      errMsg.includes('503') ||
      errMsg.includes('UNAVAILABLE') ||
      errMsg.includes('high demand') ||
      errMsg.includes('TIMEOUT_AI_RESPONSE');

    if (isQuotaOrRateLimit) {
      quotaExhaustedUntil = Date.now() + 15 * 60 * 1000;
    } else if (isHighDemandOrTransient) {
      // Back off for 2 minutes on 503 high-demand spikes and serve instant paddock editorial
      quotaExhaustedUntil = Date.now() + 2 * 60 * 1000;
    }

    return res.json({
      text: generatePaddockChronicle(prompt || ''),
      source: 'paddock_editorial',
      quotaNote: isQuotaOrRateLimit ? 'free_tier_limit' : isHighDemandOrTransient ? 'high_demand_fallback' : undefined
    });
  }
});

async function startServer() {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  app.use(vite.middlewares);

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
